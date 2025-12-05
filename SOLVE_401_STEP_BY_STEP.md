# 🔞 SOLVE HTTP 401 ERROR - Step by Step

## The Complete Solution

### Error You're Seeing
```
Connection error: JSON Query to api/v1/users/web_profile_info/?
username=dishapata ni: HTTP error code 401.
```

**What This Means**: The backend is NOT logged in to Instagram.

---

## IMMEDIATE FIX (5 MINUTES)

### Step 1: Verify Your Bot Credentials

**Go to Render Dashboard**:
1. https://dashboard.render.com
2. Click **igosint-backend** service
3. Go to **Environment** tab
4. Look for these variables:

```
IG_BOT_USER=rock.ingman2004
IG_BOT_PASS=Kkk123@#
FLASK_ENV=production
```

⚠️ **IMPORTANT**: 
- If these are NOT set, add them NOW
- If they're set but incorrect, UPDATE them
- Make sure no typos or spaces

### Step 2: Redeploy Backend

**In Render Dashboard**:
1. Go to **igosint-backend** service
2. Click **Manual Deploy** button (top right)
3. Select **Clear Build Cache** before deploying
4. Wait for deployment to complete (2-3 minutes)
5. Check **Logs** for errors

### Step 3: Test Backend Session

**Run this command in terminal**:
```bash
curl https://igosint-backend.onrender.com/debug/session
```

**If successful**:
```json
{
  "bot_user": "rock.ingman2004",
  "is_logged_in": true,
  "logged_in_user": "rock.ingman2004",
  "session_file_exists": true
}
```

✅ **If `is_logged_in: true`** → Go to Step 4

❌ **If `is_logged_in: false`** → Your credentials are wrong or account is blocked (see Troubleshooting)

### Step 4: Update Frontend API URL

**In Vercel Dashboard**:
1. Go to your IGOSINT project
2. Go to **Settings** → **Environment Variables**
3. Update:
   ```
   NEXT_PUBLIC_API_URL=https://igosint-backend.onrender.com
   ```
4. Click **Save** and **Redeploy**

### Step 5: Test from Browser

1. Go to https://igosint-final-deploy-0300.vercel.app
2. Click **Profile Downloader**
3. Enter a username: `instagram` (official Instagram profile - public)
4. Click **Search**

✅ **Success** = Posts load

❌ **Still 401?** → Go to Troubleshooting

---

## Troubleshooting

### Problem 1: `is_logged_in: false` + Credentials are Correct

**Reasons**:
1. **Instagram Rate Limited Your Account** (too many login attempts)
   - Wait 24-48 hours
   - Try with a different account
   
2. **Instagram Blocked the Account** (security)
   - Log in manually to https://instagram.com
   - Complete any challenges (email/SMS verification)
   - Then redeploy on Render

3. **Account Deleted**
   - Use a different Instagram bot account
   - Update `IG_BOT_USER` and `IG_BOT_PASS`

### Problem 2: Backend Running but Session Still Fails

**Step 1**: Check Render Logs
```bash
# In Render Dashboard
igosint-backend → Logs tab
# Look for:
- [SESSION] Login failed: <error message>
- BadCredentialsException
- ConnectionException
```

**Step 2**: Try Manual Login Locally
```bash
export IG_BOT_USER=rock.ingman2004
export IG_BOT_PASS=Kkk123@#
python app.py

# In another terminal
curl http://localhost:5000/debug/session
```

If it works locally but fails on Render:
- Environment variables not set correctly
- Render using wrong Python version
- Instagram blocks cloud provider IPs

### Problem 3: Frontend Shows 401 on Public Profiles

**The Problem**: Public profiles should NOT need login!

**Check**:
1. Backend logs for actual error
2. Network tab in browser (see exact response)
3. Frontend API URL is correct

**Quick Test**:
```bash
# Direct API call (should work even for public profiles)
curl "https://igosint-backend.onrender.com/api/scrape?username=instagram"
```

If this works: Frontend has bug, not backend

If this fails: Backend not authenticated for profiles either

---

## Complete Checklist

- [ ] 1. Bot credentials verified in Render env vars
- [ ] 2. `IG_BOT_USER` set to valid Instagram account
- [ ] 3. `IG_BOT_PASS` set to correct password
- [ ] 4. Backend redeployed (Manual Deploy button clicked)
- [ ] 5. Render logs show successful deployment
- [ ] 6. `/debug/session` returns `is_logged_in: true`
- [ ] 7. Frontend API_URL environment variable updated
- [ ] 8. Frontend redeployed
- [ ] 9. Test with public profile (@instagram)
- [ ] 10. Try hashtag explorer (requires login)

---

## Expert Diagnostics

### Check Each Component

**1. Is Render Backend Online?**
```bash
curl https://igosint-backend.onrender.com/health
# Should return: {"status": "ok"}
```

**2. Is Backend Authenticated?**
```bash
curl https://igosint-backend.onrender.com/debug/session
# Check is_logged_in field
```

**3. Can Backend Access Public Profiles?**
```bash
curl "https://igosint-backend.onrender.com/api/scrape?username=instagram"
# Should return profile data
```

**4. Can Backend Access Hashtags (requires login)?**
```bash
curl "https://igosint-backend.onrender.com/api/hashtag?tags=meme"
# If 401: not logged in
# If 200: success
```

**5. Is Frontend Connected to Backend?**
- Open DevTools (F12) in browser
- Click **Network** tab
- Try searching for a profile
- Check request URL in Network tab
- Should go to your Render backend

---

## Alternative Solutions

### Solution A: Use Public Profile Only
If bot account stays blocked:
```python
# In app.py, comment out hashtag endpoint
# Focus on profile scraping (public profiles work without login)
```

### Solution B: Use Multiple Bot Accounts
Rotate between different accounts if one gets rate-limited:
```python
accounts = [
    ("account1", "password1"),
    ("account2", "password2"),
    ("account3", "password3"),
]
```

### Solution C: Use Proxy Service
If Instagram blocks cloud IPs:
- Use Bright Data or Oxylabs proxy
- Add to requirements.txt
- Configure in Instaloader

---

## When All Else Fails

1. **Check Instagram Status**: https://downdetector.com/status/instagram/
   - Instagram might be down globally
   
2. **Contact Instagram Support**
   - If account is locked/restricted
   
3. **Use Fresh Account**
   - Create new Instagram account
   - Use for bot instead
   
4. **Switch to Public API**
   - Consider Instagram Graph API
   - Requires official business account

---

## Success Indicators

✅ **Backend is Working**:
- `/health` returns OK
- `/debug/session` shows `is_logged_in: true`
- `/api/scrape?username=instagram` returns profile data

✅ **Frontend is Working**:
- Vercel frontend loads
- API_URL points to Render backend
- Search button triggers requests

✅ **Full Stack Working**:
- Frontend search → Backend receives request
- Backend queries Instagram
- Results display in browser
- No 401 errors

---

## Still Stuck?

Read these in order:
1. `FIX_INSTAGRAM_401.md` - Detailed 401 guide
2. `DEPLOYMENT.md` - Full deployment docs
3. `QUICK_START.md` - Quick reference
4. `README.md` - Project overview

🙋 If still broken, check:
- Render logs for actual error messages
- Instagram account status (not rate-limited)
- Network requests in browser DevTools
- Backend responds to direct API calls
