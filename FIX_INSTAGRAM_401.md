# 🔧 FIX: HTTP 401 Unauthorized Error

## Problem
You're seeing:
```
Connection error: JSON Query to api/v1/users/web_profile_info/? 
username=dishapata ni: HTTP error code 401
```

**Root Cause**: The Instagram bot account session is NOT authenticated.

---

## Solution: 3-Step Fix

### STEP 1: Verify Instagram Bot Credentials ✅

First, make sure your bot account credentials are correct:

**In Render Dashboard → Environment Variables:**
```
IG_BOT_USER=rock.ingman2004
IG_BOT_PASS=Kkk123@#
```

⚠️ **IMPORTANT**: If these credentials changed, update them immediately.

---

### STEP 2: Force Session Refresh on Render 🔄

1. Go to **Render Dashboard**
2. Select **igosint-backend** service
3. Click **"Redeploy"** button
4. This will:
   - Trigger a fresh build
   - Create a new Instaloader session
   - Authenticate with the bot account

---

### STEP 3: Test Backend Authentication ✅

After redeployment, verify the session:

```bash
curl https://igosint-backend.onrender.com/debug/session
```

**Should return**:
```json
{
  "is_logged_in": true,
  "bot_user": "rock.ingman2004",
  "logged_in_user": "rock.ingman2004",
  "session_file_exists": true
}
```

If `"is_logged_in": false` → Credentials are wrong or account is restricted.

---

## Why Session Fails

### Reason 1: Invalid Credentials
- Bot account username/password incorrect
- Account compromised or deleted
- **Fix**: Update `IG_BOT_USER` and `IG_BOT_PASS` in Render env vars

### Reason 2: Instagram Rate Limiting
- Too many login attempts
- Instagram blocked the account
- **Fix**: Wait 24-48 hours before retrying

### Reason 3: Instagram Security Challenge
- Instagram requires verification (email/SMS)
- Account flagged as suspicious
- **Fix**: Log in manually to approve the challenge, then redeploy

### Reason 4: Session Lost on Deploy
- Render doesn't persist files between deployments
- Session file is lost, so we need fresh login each time
- **Fix**: Session will be recreated on redeploy (this is normal)

---

## Quick Diagnostics

### Check 1: Is backend running?
```bash
curl https://igosint-backend.onrender.com/health
# Should return: {"status": "ok"}
```

### Check 2: Is backend authenticated?
```bash
curl https://igosint-backend.onrender.com/debug/session
# Check: "is_logged_in" should be true
```

### Check 3: Can we access public profiles?
```bash
curl "https://igosint-backend.onrender.com/api/scrape?username=instagram"
# Should return profile data (public profiles don't need login)
```

### Check 4: Can we access hashtags? (requires login)
```bash
curl "https://igosint-backend.onrender.com/api/hashtag?tags=meme"
# If 401: backend not logged in
# If 400: bad request (missing tags parameter)
```

---

## Complete Fix Checklist

- [ ] Bot credentials are correct and account exists
- [ ] Account is not rate-limited or restricted
- [ ] Environment variables set in Render
- [ ] Render service has been redeployed
- [ ] `/debug/session` shows `is_logged_in: true`
- [ ] Frontend API_URL points to correct backend
- [ ] CORS is enabled (already in app.py)

---

## Still Not Working?

### Try Manual Test Locally
```bash
# Set credentials
export IG_BOT_USER=rock.ingman2004
export IG_BOT_PASS=Kkk123@#

# Run locally
python app.py

# Test in another terminal
curl http://localhost:5000/debug/session
```

If it works locally but not on Render:
- Env vars not set correctly
- Different Python/Instaloader versions
- Instagram blocks non-cloud IPs

### Check Render Logs
1. Render Dashboard → igosint-backend
2. Click **Logs** tab
3. Look for login errors:
   - `[SESSION] Login failed:` = Invalid credentials
   - `ConnectionException` = Instagram API issue
   - `BadCredentialsException` = Wrong username/password

---

## Long-Term Solution

For production, consider:
1. **Use authenticated public profiles** (profiles can be accessed without login)
2. **Implement session caching** (store session in database, not file)
3. **Use multiple bot accounts** (rotate if one gets blocked)
4. **Monitor rate limits** (Instagram limits requests per account)
5. **Proxy rotation** (use different IPs if needed)

---

## Render Redeployment Steps

1. Go to: https://dashboard.render.com
2. Click your **igosint-backend** service
3. Click **Redeploy** (manual trigger)
4. Wait for build to complete (2-3 min)
5. Check Logs for success
6. Test with `/debug/session` endpoint

✅ **Done!** Your app should now work.
