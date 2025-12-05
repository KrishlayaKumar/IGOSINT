# 🚀 IGOSINT Deployment Guide

## Backend on Render + Frontend on Vercel

### Prerequisites
- GitHub account (with repository access)
- Render account (free: https://render.com)
- Vercel account (free: https://vercel.com)
- Instagram bot credentials

---

## PART 1: Backend Deployment (Render)

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 2: Create New Web Service
1. Click **New +** → **Web Service**
2. Select your **IGOSINT repository**
3. Configure:
   - **Name**: `igosint-backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Region**: US (Oregon)
   - **Plan**: Free

### Step 3: Set Environment Variables
In Render Dashboard → Environment:
```
IG_BOT_USER = rock.ingman2004
IG_BOT_PASS = Kkk123@#
FLASK_ENV = production
```

### Step 4: Deploy
1. Click **Create Web Service**
2. Wait for deployment (2-3 minutes)
3. Note your backend URL: `https://igosint-backend.onrender.com`

---

## PART 2: Frontend Deployment (Vercel)

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel

### Step 2: Import Project
1. Click **Add New** → **Project**
2. Select **IGOSINT repository**
3. Framework: **Other**
4. Leave build settings default

### Step 3: Update API URL
Before deploying, update `vercel.json`:
```json
"destination": "https://igosint-backend.onrender.com/:path*"
```
Replace with your actual Render backend URL

### Step 4: Set Environment Variables
In Vercel Project Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL = https://igosint-backend.onrender.com
```

### Step 5: Deploy
1. Click **Deploy**
2. Wait for build (1-2 minutes)
3. Get your frontend URL: `https://your-project.vercel.app`

---

## PART 3: Update Static Files

### Update JavaScript Files
In `static/profile.js` and `static/hashtag.js`, update API_URL:

```javascript
const API_URL = 'https://igosint-backend.onrender.com';
```

Or for development:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

---

## Deployment URLs

| Component | URL | Notes |
|-----------|-----|-------|
| **Backend** | `https://igosint-backend.onrender.com` | REST API endpoints |
| **Frontend** | `https://your-project.vercel.app` | Web interface |
| **API Docs** | `{backend-url}/api/docs` | Swagger documentation |
| **Health Check** | `{backend-url}/health` | Verify backend status |

---

## Troubleshooting

### Backend won't start?
- Check logs: Render Dashboard → Logs
- Verify `requirements.txt` has gunicorn
- Check environment variables are set

### Frontend API calls fail?
- Verify API_URL matches backend domain
- Check CORS is enabled in Flask app
- Test with: `curl https://backend-url/health`

### Cold start delays?
- Render free tier has 15-minute inactivity timeout
- First request after inactivity takes longer
- Keep-alive option available on paid plans

---

## CI/CD Setup (Optional)

Render and Vercel auto-deploy on `main` branch push.

To disable:
1. **Render**: Toggle **Auto Deploy**
2. **Vercel**: Project Settings → Git → Deployment

---

## Cost Breakdown

- **Render Free**: $0/month (with limitations)
- **Vercel Free**: $0/month (Hobby plan)
- **Total**: FREE ✅

Note: Free plans have resource limits. Upgrade for production.

---

## Next Steps

1. ✅ Deploy backend on Render
2. ✅ Deploy frontend on Vercel
3. ✅ Test full-stack integration
4. 📊 Monitor analytics
5. 🔐 Add custom domain
6. 🛡️ Enable SSL/TLS

---

## Support

For issues:
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **Flask**: https://flask.palletsprojects.com
