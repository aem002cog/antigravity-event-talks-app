# BigQuery Release Notes Tracker & Broadcaster

A highly responsive and visually premium dashboard application built using **Python Flask** and **Vanilla HTML, CSS, and JavaScript**. This app fetches Google Cloud's official BigQuery release notes Atom XML feed, caches it for efficiency, parses items into modular cards, and provides a customized interface for composing and broadcasting updates directly on X (Twitter).

---

## 🚀 Features

*   **Live XML Feed Ingestion:** Automatically downloads the latest Google Cloud BigQuery release notes in real-time.
*   **Granular Update Tokenizer:** Splits composite date entries into individual updates (Features, Changes, Issues, Deprecations) so they can be filtered, searched, or shared on a micro-level.
*   **Server-Side Caching:** Stores feed XML locally (`feed_cache.xml`) with a **1-hour expiration** to guarantee lightning-fast load times. It also features offline safety fallback to keep the app working even when disconnected.
*   **Aesthetic UI with Dark & Light Modes:** Built using glassmorphic UI elements, smooth animations (loader pulses, spinner rotations, card shifts), Outfit/Inter typography, and automatic persistence of user theme preferences in `localStorage`.
*   **Advanced Tweet Composer Drawer:** Click on any card to slide open an interactive workspace that formats a tweet draft. It includes:
    *   **Auto-trimming:** Fits description text, date, links, and hashtags within the 280-character Twitter limit.
    *   **Interactive Hashtag Chips:** Toggle hashtags (`#BigQuery`, `#GoogleCloud`, `#GCP`, etc.) dynamically into your draft.
    *   **Live Character Counter:** Displays validation feedback (changing color from green to orange and red).
*   **X (Twitter) Integration:** Instantly launches pre-filled compose popups using Twitter Web Intents.

---

## 📁 Repository Structure

```
agy-cli-projects/
├── bq-releases-notes/              # Flask Application Folder
│   ├── templates/
│   │   └── index.html              # Main HTML structure with templates
│   ├── static/
│   │   ├── app.js                  # Frontend state management & controllers
│   │   └── style.css               # Light/Dark mode styling system
│   ├── app.py                      # Flask Server, caching, & parser logic
│   └── requirements.txt            # Python dependencies (Flask, Requests)
├── .gitignore                      # Git ignore file configurations
├── project_architecture.md         # Detailed architectural and flow breakdown
└── README.md                       # Project manual (This file)
```

---

## 🛠️ Installation & Setup

### Prerequisites
Make sure you have Python 3 installed on your system.

### 1. Set Up Virtual Environment
Navigate to the application folder and initialize a Python virtual environment:

```bash
cd bq-releases-notes
python -m venv .venv
```

### 2. Activate the Environment & Install Dependencies
Run the commands corresponding to your operating system:

*   **Windows (PowerShell):**
    ```powershell
    .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    ```
*   **macOS / Linux:**
    ```bash
    source .venv/bin/activate
    pip install -r requirements.txt
    ```

### 3. Run the Flask Server
Start the development server:

```bash
python app.py
```

By default, the server will start on: **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🔍 How to Use the App

1.  **Search & Filters:** Use the search bar in the filter panel to search for keywords (e.g., "Gemini", "continuous query"). Click on any of the stat-cards (Features, Changes, Issues) to filter the feed immediately by that specific category.
2.  **Forced Refresh:** Click **Refresh Feed** to clear the cache file, run a fresh live download from Google, and update the dashboard.
3.  **Draft a Tweet:** Click **Select** on any card. The side composer drawer will slide in. Toggle suggested hashtag chips, edit your draft in the text area, and click **Share on X** to open a pre-filled browser popup.
4.  **Quick Tweet:** Click the **Tweet** button directly on any card to immediately open the X compose popup with a default formatted update draft.
