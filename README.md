/
│── app.py                # Flask backend
│── templates/
│      ├── index.html     # Landing page
│      ├── profile.html   # Profile scraper UI
│      └── hashtag.html   # Hashtag explorer UI
│── static/
│      ├── style.css
│      ├── profile.js
│      ├── hashtag.js
│── rock.ingman2004.session   # Bot session (ignored in .gitignore)
│── .gitignore
│── README.md


# 🛡️ Instagram OSINT Scraper  
*A full-stack Instagram scraping and analytics tool for OSINT research, profile investigation, hashtag tracking, and media downloads.*

---

## 📌 Overview

The **Instagram OSINT Scraper** is a full-stack application built using **Flask (Python)** and **Tailwind + JavaScript**, designed to extract publicly available Instagram data for:

- OSINT investigations  
- Cybersecurity research  
- Digital forensics  
- Academic studies  
- Social media analytics  

This tool uses **Instaloader** to interact with Instagram's public endpoints and extract structured data without browser automation.

---

## 🚀 Features

### ⭐ 1. Profile Scraper  
Scrapes detailed profile data:

- Username, full name, bio, profile picture  
- Followers / following / post count  
- Posts + Reels  
- Stories (if visible)
- Highlights (if visible)
- Timestamps, captions, hashtags  
- Likes & comments count  
- Multi-image (sidecar) post support  

### ⭐ 2. Hashtag Explorer  
- Explore posts under one or multiple hashtags  
- Requires backend bot session login  
- Infinite scrolling  
- High-quality images & videos  
- Extract metadata (likes, comments, caption, owner username)  

### ⭐ 3. Stories & Highlights Downloader  
Backend pulls:

- Active stories  
- Highlight folders  
- Media inside each highlight  

With one-click download buttons for all media.

### ⭐ 4. Media Downloader  
Download:

- Photos  
- Videos  
- Reels  
- Stories  
- Highlights  

Or export everything in one **ZIP**.

### ⭐ 5. Analytics Engine  
Includes:

- Total media scraped  
- Posting date range  
- Average posts per day  
- Most liked posts  
- Hashtag count  
- Engagement metrics  

### ⭐ 6. Filters + Sort  
Real-time filters:

- Posts / Reels / All  
- Minimum likes  
- Sort by:
  - Newest  
  - Oldest  
  - Most liked  
  - Least liked  

### ⭐ 7. Infinite Scrolling  
Just like the Instagram explore page — scroll down for more results.

### ⭐ 8. JSON + ZIP Export  
- **JSON export:** Structured metadata  
- **ZIP export:** All downloaded media neatly organized  

---

## 🔐 Authentication (Bot Session)

This project uses a backend-only login via Instaloader.

Configured bot account:

