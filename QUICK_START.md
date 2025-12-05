# 🚀 Quick Start: Deploy IGOSINT Now!

## 5-Minute Setup (2 Services)

### STEP 1: Backend on Render (2 minutes)

1. Go to https://render.com
2. Sign up with GitHub
3. Click **New +** → **Web Service**
4. Select **IGOSINT** repo
5. Fill in:
   ```
   Name: igosint-backend
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn app:app
   ```
6. Add environment variables:
   ```
   IG_BOT_USER = rock.ingman2004
   IG_BOT_PASS = Kkk123@#
   FLASK_ENV = production
   ```
7. Click **Create Web Service**
8. Wait for deployment ✅
9. Copy backend URL: `https://igosint-backend.onrender.com`

### STEP 2: Frontend on Vercel (2 minutes)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **Add New** → **Project**
4. Select **IGOSINT** repo
5. Leave settings as default
6. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL = https://igosint-backend.onrender.com
   ```
7. Click **Deploy**
8. Wait for build ✅
9. Copy frontend URL: `https://your-project.vercel.app`

### STEP 3: Update Config (1 minute)

Edit `vercel.json` and update:
```json
"destination": "https://igosint-backend.onrender.com/:path*"
```

---

## Done! 🎉

- **Frontend**: https://your-project.vercel.app
- **Backend API**: https://igosint-backend.onrender.com

---

## Cost
- **Render**: FREE
- **Vercel**: FREE
- **Total**: $0

---

## Verify Deployment

### Test Backend
```bash
curl https://igosint-backend.onrender.com/debug/session
# Should return: {"is_logged_in": true}
```

### Test Frontend
Open `https://your-project.vercel.app` in browser and test scraping.

---

## Troubleshooting

**Backend won't start?**
- Check logs in Render dashboard
- Verify gunicorn is in requirements.txt

**Frontend API fails?**
- Update vercel.json with correct backend URL
- Check CORS is enabled in Flask

**Slow first request?**
- Render free tier has inactivity timeout
- First request after inactivity takes 30s
- Upgrade to paid plan to remove this

---

## Next Steps

1. Add custom domain
2. Set up monitoring
3. Enable SSL/TLS
4. Add authentication
5. Upgrade to paid plans for production

---

For detailed setup: See `DEPLOYMENT.md`
