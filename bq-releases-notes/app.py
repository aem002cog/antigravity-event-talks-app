import os
import re
import xml.etree.ElementTree as ET
import urllib.request
from flask import Flask, render_template, jsonify

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_FILE = "feed_cache.xml"
CACHE_TIMEOUT = 3600  # 1 hour in seconds

def fetch_feed_data():
    """Fetches feed data, either from live URL or local cache if server is offline or to speed up."""
    # Check cache first
    use_cache = False
    if os.path.exists(CACHE_FILE):
        file_age = os.path.getmtime(CACHE_FILE)
        import time
        if time.time() - file_age < CACHE_TIMEOUT:
            use_cache = True

    if use_cache:
        try:
            with open(CACHE_FILE, "rb") as f:
                return f.read(), True
        except Exception:
            pass

    # Fetch live
    try:
        req = urllib.request.Request(
            FEED_URL,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            data = response.read()
            # Save to cache
            with open(CACHE_FILE, "wb") as f:
                f.write(data)
            return data, False
    except Exception as e:
        # Fallback to cache if available on failure
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "rb") as f:
                    return f.read(), True
            except Exception:
                pass
        raise e

def parse_xml_to_releases(xml_data):
    root = ET.fromstring(xml_data)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    releases = []
    
    for entry in root.findall('atom:entry', ns):
        date = entry.find('atom:title', ns).text.strip()
        entry_id = entry.find('atom:id', ns).text.strip()
        link_elem = entry.find('atom:link[@rel="alternate"]', ns)
        link = link_elem.get('href') if link_elem is not None else "https://cloud.google.com/bigquery/docs/release-notes"
        content_elem = entry.find('atom:content', ns)
        
        if content_elem is not None:
            content_html = content_elem.text
            if not content_html:
                continue
                
            # Split the HTML content by <h3> headers
            parts = re.split(r'(<h3>.*?</h3>)', content_html, flags=re.IGNORECASE)
            
            current_type = "Update"
            idx = 0
            for part in parts:
                if not part.strip():
                    continue
                
                # Check if this part is a header tag
                if part.lower().startswith('<h3>') and part.lower().endswith('</h3>'):
                    # Strip <h3> and </h3> tags
                    current_type = re.sub(r'<[^<]+?>', '', part).strip()
                else:
                    item_html = part.strip()
                    # Strip tags for plain text search/tweet preview
                    clean_text = re.sub(r'<[^<]+?>', '', item_html)
                    # Resolve common entities and normalize whitespace
                    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
                    clean_text = clean_text.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&').replace('&quot;', '"')
                    
                    releases.append({
                        "date": date,
                        "id": f"{entry_id}_{idx}",
                        "type": current_type,
                        "html": item_html,
                        "text": clean_text,
                        "link": link
                    })
                    idx += 1
                    
    return releases

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        xml_data, from_cache = fetch_feed_data()
        releases = parse_xml_to_releases(xml_data)
        return jsonify({
            "status": "success",
            "from_cache": from_cache,
            "count": len(releases),
            "releases": releases
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/refresh', methods=['POST'])
def force_refresh():
    try:
        # Clear cache file to force live load
        if os.path.exists(CACHE_FILE):
            os.remove(CACHE_FILE)
        xml_data, _ = fetch_feed_data()
        releases = parse_xml_to_releases(xml_data)
        return jsonify({
            "status": "success",
            "from_cache": False,
            "count": len(releases),
            "releases": releases
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    # Start flask app
    app.run(debug=True, port=5000)
