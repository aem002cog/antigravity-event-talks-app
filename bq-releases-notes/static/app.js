// Application State
let releases = [];
let filteredReleases = [];
let activeTypeFilter = 'all';
let searchQuery = '';
let selectedReleaseId = null;

// DOM Elements
const feedContainer = document.getElementById('feed-container');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const refreshBtn = document.getElementById('refresh-btn');
const retryBtn = document.getElementById('retry-btn');
const themeToggle = document.getElementById('theme-toggle');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const cacheIndicator = document.getElementById('cache-indicator');

// Stats Counters
const statTotal = document.getElementById('stat-total');
const statFeatures = document.getElementById('stat-features');
const statChanges = document.getElementById('stat-changes');
const statIssues = document.getElementById('stat-issues');
const statDeprecations = document.getElementById('stat-deprecations');
const statCards = document.querySelectorAll('.stat-card');

// Filter Chips
const filterChips = document.querySelectorAll('.chip');

// Drawer Elements
const tweetDrawer = document.getElementById('tweet-drawer');
const closeDrawerBtn = document.getElementById('close-drawer');
const previewTypeBadge = document.getElementById('preview-type-badge');
const previewDate = document.getElementById('preview-date');
const previewTextContent = document.getElementById('preview-text-content');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const hashtagChips = document.querySelectorAll('.hashtag-chip');
const tweetSubmitBtn = document.getElementById('tweet-submit-btn');

// Theme Switcher Icons
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadReleases();
    setupEventListeners();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    if (theme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
}

// Fetch Release Notes
async function loadReleases(isForceRefresh = false) {
    showState('loading');
    setLoadingState(true);
    
    const url = isForceRefresh ? '/api/refresh' : '/api/releases';
    const method = isForceRefresh ? 'POST' : 'GET';
    
    try {
        const response = await fetch(url, { method });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status === 'success') {
            releases = data.releases;
            
            // Show cache status indicator
            if (data.from_cache) {
                cacheIndicator.style.display = 'inline-block';
            } else {
                cacheIndicator.style.display = 'none';
            }
            
            updateStats();
            applyFiltersAndRender();
        } else {
            throw new Error(data.message || 'Unknown error occurred.');
        }
    } catch (err) {
        console.error('Error fetching release notes:', err);
        errorMessage.textContent = err.message || 'Unable to load release notes. Please check your connection.';
        showState('error');
    } finally {
        setLoadingState(false);
    }
}

// UI State Controller
function showState(state) {
    loadingState.style.display = state === 'loading' ? 'flex' : 'none';
    errorState.style.display = state === 'error' ? 'flex' : 'none';
    emptyState.style.display = state === 'empty' ? 'flex' : 'none';
    feedContainer.style.display = state === 'feed' ? 'flex' : 'none';
}

function setLoadingState(isLoading) {
    const spinner = refreshBtn.querySelector('.refresh-spinner');
    if (isLoading) {
        refreshBtn.disabled = true;
        retryBtn.disabled = true;
        spinner.classList.add('loading');
    } else {
        refreshBtn.disabled = false;
        retryBtn.disabled = false;
        spinner.classList.remove('loading');
    }
}

// Update Statistics Widget Counter
function updateStats() {
    const counts = {
        total: releases.length,
        Feature: 0,
        Change: 0,
        Issue: 0,
        Deprecation: 0
    };
    
    releases.forEach(r => {
        if (counts[r.type] !== undefined) {
            counts[r.type]++;
        }
    });
    
    statTotal.textContent = counts.total;
    statFeatures.textContent = counts.Feature;
    statChanges.textContent = counts.Change;
    statIssues.textContent = counts.Issue;
    statDeprecations.textContent = counts.Deprecation;
}

// Search and Filter logic
function applyFiltersAndRender() {
    filteredReleases = releases.filter(r => {
        // Apply Type Filter
        const typeMatch = activeTypeFilter === 'all' || r.type.toLowerCase() === activeTypeFilter.toLowerCase();
        
        // Apply Search Query Filter
        const searchTerms = searchQuery.toLowerCase().trim();
        const searchMatch = !searchTerms || 
                            r.date.toLowerCase().includes(searchTerms) ||
                            r.type.toLowerCase().includes(searchTerms) ||
                            r.text.toLowerCase().includes(searchTerms);
        
        return typeMatch && searchMatch;
    });
    
    renderFeed();
}

// Render Feed Cards
function renderFeed() {
    if (filteredReleases.length === 0) {
        showState('empty');
        return;
    }
    
    feedContainer.innerHTML = '';
    
    filteredReleases.forEach(item => {
        const card = document.createElement('div');
        card.className = `update-card ${item.type} ${selectedReleaseId === item.id ? 'selected' : ''}`;
        card.dataset.id = item.id;
        
        card.innerHTML = `
            <div class="card-meta">
                <span class="type-tag ${item.type}">${item.type}</span>
                <span class="card-date">${item.date}</span>
            </div>
            <div class="card-body">
                ${item.html}
            </div>
            <div class="card-actions">
                <button class="card-btn btn-select" onclick="event.stopPropagation(); selectRelease('${item.id}')">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                    <span>${selectedReleaseId === item.id ? 'Selected' : 'Select'}</span>
                </button>
                <button class="card-btn btn-copy" onclick="event.stopPropagation(); copyCardText('${item.id}', this)" title="Copy release note text">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy</span>
                </button>
                <button class="card-btn btn-tweet" onclick="event.stopPropagation(); tweetImmediately('${item.id}')">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>Tweet</span>
                </button>
                <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="card-btn btn-link" onclick="event.stopPropagation()">
                    Source ↗
                </a>
            </div>
        `;
        
        // Make the whole card clickable for selection
        card.addEventListener('click', () => {
            selectRelease(item.id);
        });
        
        feedContainer.appendChild(card);
    });
    
    showState('feed');
}

// Select Release for Composer Drawer
function selectRelease(id) {
    const previousSelected = selectedReleaseId;
    
    if (selectedReleaseId === id) {
        // Toggle off if clicking the same selected card
        selectedReleaseId = null;
        closeComposer();
    } else {
        selectedReleaseId = id;
        openComposer(id);
    }
    
    // Rerender active states of the cards
    const cards = feedContainer.querySelectorAll('.update-card');
    cards.forEach(card => {
        if (card.dataset.id === selectedReleaseId) {
            card.classList.add('selected');
            const selectBtnSpan = card.querySelector('.btn-select span');
            if (selectBtnSpan) selectBtnSpan.textContent = 'Selected';
        } else {
            card.classList.remove('selected');
            const selectBtnSpan = card.querySelector('.btn-select span');
            if (selectBtnSpan) selectBtnSpan.textContent = 'Select';
        }
    });
}

// Composer Drawer Logic
function openComposer(id) {
    const item = releases.find(r => r.id === id);
    if (!item) return;
    
    // Set Drawer Meta Details
    previewTypeBadge.textContent = item.type;
    previewTypeBadge.className = `type-tag ${item.type}`;
    previewDate.textContent = item.date;
    previewTextContent.textContent = item.text;
    
    // Generate Pre-populated Tweet Text
    generateDefaultTweet(item);
    
    // Show Drawer
    tweetDrawer.classList.add('open');
    tweetDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeComposer() {
    selectedReleaseId = null;
    tweetDrawer.classList.remove('open');
    
    // Remove selection highlight from list
    const cards = feedContainer.querySelectorAll('.update-card');
    cards.forEach(card => {
        card.classList.remove('selected');
        const selectBtnSpan = card.querySelector('.btn-select span');
        if (selectBtnSpan) selectBtnSpan.textContent = 'Select';
    });
}

// Draft Default Tweet inside composer
function generateDefaultTweet(item) {
    // Define hashtags that are active by default
    const activeHashtags = [];
    hashtagChips.forEach(chip => {
        if (chip.classList.contains('active')) {
            activeHashtags.push(chip.dataset.tag);
        }
    });
    
    const dateStr = item.date;
    const typeStr = item.type;
    const linkStr = item.link;
    const textStr = item.text;
    
    // Estimate fixed characters budget:
    // "Google #BigQuery Update [date] - type: \"text\" \n\nSource: link hashtags"
    const prefix = `Google #BigQuery Update [${dateStr}] - ${typeStr}: `;
    const suffix = `\n\nRead more: ${linkStr}\n${activeHashtags.join(' ')}`;
    
    const fixedLength = prefix.length + suffix.length + 4; // Adding safety margin
    const textLimit = 280 - fixedLength;
    
    let trimmedText = textStr;
    if (textStr.length > textLimit) {
        trimmedText = textStr.substring(0, textLimit - 3) + '...';
    }
    
    const defaultTweet = `${prefix}"${trimmedText}"${suffix}`;
    tweetTextarea.value = defaultTweet;
    updateCharCounter();
}

function updateCharCounter() {
    const len = tweetTextarea.value.length;
    charCounter.textContent = len;
    
    // Formatting styling based on limit
    charCounter.className = '';
    if (len > 280) {
        charCounter.classList.add('danger');
        tweetSubmitBtn.disabled = true;
    } else if (len > 260) {
        charCounter.classList.add('warning');
        tweetSubmitBtn.disabled = false;
    } else {
        tweetSubmitBtn.disabled = false;
    }
}

// Tweet Actions
function tweetImmediately(id) {
    const item = releases.find(r => r.id === id);
    if (!item) return;
    
    // Formulate a quick simple tweet
    const prefix = `Google #BigQuery [${item.date}] - ${item.type}: `;
    const suffix = `\n\nRead more: ${item.link} #GoogleCloud`;
    
    const textLimit = 280 - (prefix.length + suffix.length + 4);
    let trimmedText = item.text;
    if (item.text.length > textLimit) {
        trimmedText = item.text.substring(0, textLimit - 3) + '...';
    }
    
    const tweetText = `${prefix}"${trimmedText}"${suffix}`;
    openTwitterWebIntent(tweetText);
}

function openTwitterWebIntent(text) {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=550,height=420');
}

// Setup Page Events
function setupEventListeners() {
    // Refresh buttons
    refreshBtn.addEventListener('click', () => loadReleases(true));
    retryBtn.addEventListener('click', () => loadReleases(true));
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        applyFiltersAndRender();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        applyFiltersAndRender();
        searchInput.focus();
    });
    
    // Filter Chips selection
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            activeTypeFilter = chip.dataset.type;
            
            // Align active statistics card border too
            alignStatCardBorder(activeTypeFilter);
            applyFiltersAndRender();
        });
    });
    
    // Stats Cards selection acts as filter shortcuts
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const filterType = card.dataset.filter;
            
            // Set active chip
            filterChips.forEach(c => {
                if (c.dataset.type.toLowerCase() === filterType.toLowerCase() || 
                    (filterType === 'all' && c.dataset.type === 'all')) {
                    c.classList.add('active');
                } else {
                    c.classList.remove('active');
                }
            });
            
            activeTypeFilter = filterType;
            alignStatCardBorder(filterType);
            applyFiltersAndRender();
        });
    });
    
    // Drawer handlers
    closeDrawerBtn.addEventListener('click', closeComposer);
    
    tweetTextarea.addEventListener('input', updateCharCounter);
    
    // Hashtags chip click modifier inside composer
    hashtagChips.forEach(chip => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('active');
            if (selectedReleaseId) {
                const item = releases.find(r => r.id === selectedReleaseId);
                if (item) {
                    generateDefaultTweet(item);
                }
            }
        });
    });
    
    // Submit Tweet compose
    tweetSubmitBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        if (text.length <= 280) {
            openTwitterWebIntent(text);
        }
    });

    // Export CSV button
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }
}

// Styling sync between widgets and chips
function alignStatCardBorder(filterType) {
    statCards.forEach(card => {
        if (card.dataset.filter.toLowerCase() === filterType.toLowerCase() ||
            (filterType === 'all' && card.dataset.filter === 'all')) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

// Copy Card Text to Clipboard
function copyCardText(id, btnElement) {
    const item = releases.find(r => r.id === id);
    if (!item) return;
    
    const textToCopy = `Google BigQuery Update [${item.date}] - ${item.type}:\n${item.text}\n\nSource: ${item.link}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        // Success feedback
        const span = btnElement.querySelector('span');
        const originalText = span.textContent;
        span.textContent = 'Copied!';
        btnElement.style.borderColor = 'var(--feature-color)';
        btnElement.style.color = 'var(--feature-color)';
        
        setTimeout(() => {
            span.textContent = originalText;
            btnElement.style.borderColor = '';
            btnElement.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Export Filtered Releases to CSV
function exportToCSV() {
    if (filteredReleases.length === 0) {
        alert('No data available to export.');
        return;
    }
    
    const headers = ['Date', 'Type', 'Description', 'Link'];
    const rows = filteredReleases.map(r => [
        r.date,
        r.type,
        r.text,
        r.link
    ]);
    
    // Convert to CSV string, double escaping quotes
    let csvContent = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(val => `"${val.replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bigquery_release_notes_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
