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
│── docs/                  # Screenshots folder
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

## 🖼️ Screenshots

![Profile Downloader](docs/profile-view.png)
*Profile downloader interface with analytics and media grid*

![Hashtag Explorer](docs/hashtag-view.png)
*Hashtag explorer with infinite scrolling*

---

## 🔐 Authentication (Bot Session)

This project uses a backend-only login via Instaloader.

Configured bot account credentials can be set via:
- Environment variables: `IG_BOT_USER` and `IG_BOT_PASS`
- Fallback hardcoded values (for local development only)

**Security Note:** Never commit real credentials to public repositories. Use environment variables in production.

---

## ⚡ How to Run Locally

### Prerequisites
- Python 3.8+ installed
- pip package manager

### Windows

```bash
# Clone the repository
git clone https://github.com/KrishlayaKumar/IGOSINT.git
cd IGOSINT

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

Then visit: **http://localhost:5000**

### Mac / Linux

```bash
# Clone the repository
git clone https://github.com/KrishlayaKumar/IGOSINT.git
cd IGOSINT

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

Then visit: **http://localhost:5000**

### Verify Backend Session

After starting the server, check if the bot is logged in:

```
http://localhost:5000/debug/session
```

You should see:
```json
{
  "is_logged_in": true,
  "bot_user": "your_bot_username"
}
```

---

## 📦 Project Structure

```
IGOSINT/
├── app.py                    # Main Flask application
├── templates/
│   ├── index.html           # Landing page
│   ├── profile.html         # Profile scraper page
│   └── hashtag.html         # Hashtag explorer page
├── static/
│   ├── style.css            # Custom CSS
│   ├── profile.js           # Profile page logic
│   └── hashtag.js           # Hashtag page logic
├── docs/                     # Screenshots
├── .gitignore                # Git ignore file
└── README.md                 # This file
```

---

## ⚠️ Disclaimer

This tool is designed for:

- **Educational purposes**  
- **OSINT research**  
- **Cybersecurity analysis**  
- **Academic use**  

**You are responsible for:**

- Complying with Instagram's Terms of Service  
- Respecting user privacy and data protection laws  
- Using the tool ethically and legally  

**This tool should NOT be used for:**

- Harassment or stalking  
- Unauthorized data collection  
- Violating anyone's privacy  
- Any illegal activities  

The developers are not responsible for misuse of this software.

---

## 🛠️ Tech Stack

- **Backend:** Flask (Python)  
- **Frontend:** HTML, Tailwind CSS, JavaScript  
- **Instagram API:** Instaloader  
- **Storage:** Session-based authentication  
- **Export:** JSON + ZIP (JSZip.js, FileSaver.js)  

---

## 👤 Author

**Krishlaya Kumar Singh**  
GitHub: [@KrishlayaKumar](https://github.com/KrishlayaKumar)

---

## 📝 License

This project is open source and available for educational use. Please use responsibly.

---

## ⭐ Support

If you find this project useful, please give it a star ⭐ on GitHub!
