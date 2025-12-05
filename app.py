import os
from itertools import islice

from flask import (
    Flask,
    request,
    jsonify,
    render_template,
    Response,
    abort,
)
import instaloader
import requests
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = "change-this-to-a-random-secret"
CORS(app)

# ----------------------------------------------------
#  Instagram bot account (LOCAL / EDUCATIONAL USE ONLY)
#  WARNING: Hard-coding credentials is NOT safe for real deployment.
# ----------------------------------------------------
IG_BOT_USER = os.getenv("IG_BOT_USER") 
IG_BOT_PASS = os.getenv("IG_BOT_PASS") 

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ====================================================
#  Session helpers
# ====================================================

def session_file_for(username: str) -> str:
    return os.path.join(BASE_DIR, f"{username}.session")


def make_loader(require_login: bool = False) -> instaloader.Instaloader:
    """
    Create an Instaloader instance.
    If require_login=True, make sure we are logged in with IG_BOT_USER.
    """
    L = instaloader.Instaloader(
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
    )

    sfile = session_file_for(IG_BOT_USER)

    # 1) Try load existing session
    if os.path.exists(sfile):
        try:
            L.load_session_from_file(IG_BOT_USER, sfile)
            print(f"[SESSION] Loaded session for {IG_BOT_USER} from {sfile}")
        except Exception as e:
            print(f"[SESSION] Failed to load session from file: {e}")
                # Check if loaded session is actually valid
    if os.path.exists(sfile):
        try:
            test_login = L.context.test_login()
            if test_login is None:
                print(f"[SESSION] Loaded session invalid (test_login returned None), deleting file")
                os.remove(sfile)
        except Exception as e:
            print(f"[SESSION] Error testing session: {e}")


    # 2) If require_login and still not logged in -> fresh login
    if require_login and not L.context.is_logged_in:
        try:
            print("[SESSION] Not logged in – doing fresh login with bot account...")
            L.login(IG_BOT_USER, IG_BOT_PASS)
            L.save_session_to_file(sfile)
            print(f"[SESSION] Logged in as {IG_BOT_USER} and saved session to {sfile}")
        except Exception as e:
            print(f"[SESSION] Login failed: {e}")

    # Debug info
    try:
        logged_user = L.context.test_login()
    except Exception:
        logged_user = None
    print(f"[SESSION] is_logged_in={L.context.is_logged_in}, test_login={logged_user}")

    return L


# ====================================================
#  Page routes
# ====================================================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/profile")
def profile_page():
    return render_template("profile.html")


@app.route("/hashtag")
def hashtag_page():
    return render_template("hashtag.html")


# Dummy login endpoint so url_for('login_page') never breaks
@app.route("/login", endpoint="login_page")
def login_page():
    return (
        "<html><body style='font-family:sans-serif;background:#020617;color:#e5e7eb;"
        "padding:2rem'>"
        "<h1>Instagram Login Disabled</h1>"
        "<p>Login is handled automatically on the server using a bot account.</p>"
        "<p>Use <a href='/profile'>Profile Downloader</a> or "
        "<a href='/hashtag'>Hashtag Explorer</a>.</p>"
        "</body></html>"
    )


# ====================================================
#  Utility endpoints
# ====================================================

@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/proxy")
def proxy():
    """Simple proxy to avoid CORS when downloading IG media."""
    url = request.args.get("u")
    if not url:
        abort(400, description="Missing image/video URL")

    try:
        url = requests.utils.unquote(url)
    except Exception:
        pass

    try:
        resp = requests.get(url, stream=True, timeout=20)
    except requests.RequestException:
        abort(502, description="Failed to fetch from source")

    if resp.status_code != 200:
        abort(resp.status_code)

    content_type = resp.headers.get("Content-Type", "application/octet-stream")
    return Response(resp.content, content_type=content_type)


@app.route("/debug/session")
def debug_session():
    """Check from browser if backend is logged in."""
    L = make_loader(require_login=False)
    try:
        logged_user = L.context.test_login()
    except Exception:
        logged_user = None

    sfile = session_file_for(IG_BOT_USER)

    return jsonify({
        "bot_user": IG_BOT_USER,
        "is_logged_in": L.context.is_logged_in,
        "logged_in_user": logged_user,
        "session_file": sfile,
        "session_file_exists": os.path.exists(sfile),
    })


# ====================================================
#  API: Profile posts (main grid)
# ====================================================

@app.route("/api/scrape")
def scrape_profile():
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Username is required"}), 400

    try:
        offset = int(request.args.get("offset", 0) or 0)
        limit_posts = int(request.args.get("limit", 12) or 12)
        if limit_posts <= 0:
            limit_posts = 12
    except ValueError:
        offset, limit_posts = 0, 12

    # Posts can be scraped without login (public profiles)
    L = make_loader(require_login=False)

    try:
        profile = instaloader.Profile.from_username(L.context, username)
        profile_data = {
            "username": profile.username,
            "full_name": profile.full_name,
            "biography": profile.biography,
            "profile_pic": profile.profile_pic_url,
            "followers": profile.followers,
            "following": profile.followees,
            "posts_count": profile.mediacount,
            "is_verified": profile.is_verified,
            "is_private": profile.is_private,
        }

        posts_iter = profile.get_posts()
        sliced_posts = islice(posts_iter, offset, offset + limit_posts)

        media_list = []
        posts_returned = 0

        for post in sliced_posts:
            posts_returned += 1

            base_info = {
                "caption": post.caption or "",
                "taken_at": post.date_utc.isoformat() if post.date_utc else None,
                "comments_count": post.comments,
                "likes": post.likes,
                "shortcode": post.shortcode,
                "hashtags": list(getattr(post, "caption_hashtags", [])),
            }

            if post.typename == "GraphSidecar":
                for node in post.get_sidecar_nodes():
                    is_video = node.is_video
                    media_list.append({
                        **base_info,
                        "thumb_url": node.display_url,
                        "type": "video" if is_video else "image",
                        "video_url": node.video_url if is_video else None,
                    })
            else:
                is_video = post.is_video
                media_list.append({
                    **base_info,
                    "thumb_url": post.url,
                    "type": "video" if is_video else "image",
                    "video_url": post.video_url if is_video else None,
                })

        new_offset = offset + posts_returned
        has_more = new_offset < profile.mediacount

        return jsonify({
            "profile": profile_data,
            "media": media_list,
            "offset": new_offset,
            "has_more": has_more,
        })

    except instaloader.exceptions.ProfileNotExistsException:
        return jsonify({"error": "Profile not found"}), 404
    except instaloader.exceptions.ConnectionException as e:
        msg = str(e)
        if "Please wait a few minutes before you try again" in msg:
            return jsonify({
                "error": "Instagram is rate limiting your IP/account. Please wait and try again."
            }), 429
        return jsonify({"error": "Connection error: " + msg}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ====================================================
#  API: Profile extras (stories, highlights, reels)
# ====================================================

@app.route("/api/profile_extras")
def profile_extras():
    """
    Stories + Highlights + Reels for a profile.
    Requires logged-in session (bot account).
    """
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Username is required"}), 400

    try:
        L = make_loader(require_login=True)

        if not L.context.is_logged_in:
            return jsonify({
                "requires_login": True,
                "error": "Backend not logged in; bot account login failed.",
                "stories": [],
                "highlights": [],
                "reels": [],
            }), 500

        profile = instaloader.Profile.from_username(L.context, username)

        # ---------- Stories ----------
        stories_list = []
        try:
            for story in L.get_stories(userids=[profile.userid]):
                for item in story.get_items():
                    is_video = item.is_video
                    stories_list.append({
                        "type": "video" if is_video else "image",
                        "thumb_url": item.url,
                        "video_url": item.video_url if is_video else None,
                        "taken_at": item.date_utc.isoformat() if item.date_utc else None,
                    })
            stories_list = stories_list[:20]
        except Exception as e:
            print("[STORIES] Failed:", e)

        # ---------- Highlights ----------
        highlights_list = []
        try:
            for hl in profile.get_highlights():
                title = hl.title or ""
                for item in hl.get_items():
                    is_video = item.is_video
                    highlights_list.append({
                        "highlight_title": title,
                        "type": "video" if is_video else "image",
                        "thumb_url": item.url,
                        "video_url": item.video_url if is_video else None,
                        "taken_at": item.date_utc.isoformat() if item.date_utc else None,
                    })
            highlights_list = highlights_list[:40]
        except Exception as e:
            print("[HIGHLIGHTS] Failed:", e)

        # ---------- Reels (approx: video posts) ----------
        reels_list = []
        try:
            max_reels = 12
            for post in profile.get_posts():
                if post.is_video:
                    reels_list.append({
                        "type": "video",
                        "thumb_url": post.url,
                        "video_url": post.video_url,
                        "taken_at": post.date_utc.isoformat() if post.date_utc else None,
                        "caption": post.caption or "",
                        "likes": post.likes,
                        "shortcode": post.shortcode,
                    })
                    if len(reels_list) >= max_reels:
                        break
        except Exception as e:
            print("[REELS] Failed:", e)

        return jsonify({
            "requires_login": False,
            "stories": stories_list,
            "highlights": highlights_list,
            "reels": reels_list,
        })

    except Exception as e:
        # IMPORTANT: Always return JSON, never HTML error page
        return jsonify({"error": str(e)}), 500


# ====================================================
#  API: Hashtag explorer (requires login)
# ====================================================

@app.route("/api/hashtag")
def hashtag_explore():
    tags_param = request.args.get("tags", "").strip()
    if not tags_param:
        return jsonify({"error": "At least one hashtag is required"}), 400

    tags = [
        t.strip().lstrip("#")
        for t in tags_param.split(",")
        if t.strip()
    ]
    if not tags:
        return jsonify({"error": "No valid hashtags found"}), 400

    primary_tag = tags[0]

    try:
        offset = int(request.args.get("offset", 0) or 0)
        limit_posts = int(request.args.get("limit", 12) or 12)
        if limit_posts <= 0:
            limit_posts = 12
    except ValueError:
        offset, limit_posts = 0, 12

    L = make_loader(require_login=True)

    if not L.context.is_logged_in:
        return jsonify({
            "error": "Instagram requires login for hashtag access. Backend login failed.",
            "login_required": True,
        }), 500

    try:
        hashtag = instaloader.Hashtag.from_name(L.context, primary_tag)
    except instaloader.exceptions.ConnectionException as e:
        msg = str(e)
        if "login_required" in msg.lower():
            return jsonify({
                "error": "Instagram requires login for hashtag access.",
                "login_required": True,
            }), 401
        if "Please wait a few minutes before you try again" in msg:
            return jsonify({
                "error": "Instagram is rate limiting your account/IP. Wait a few minutes and retry."
            }), 429
        return jsonify({"error": "Connection error: " + msg}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    posts_iter = hashtag.get_posts()
    sliced_posts = islice(posts_iter, offset, offset + limit_posts)

    media_list = []
    posts_returned = 0

    for post in sliced_posts:
        posts_returned += 1

        base_info = {
            "caption": post.caption or "",
            "taken_at": post.date_utc.isoformat() if post.date_utc else None,
            "comments_count": post.comments,
            "likes": post.likes,
            "shortcode": post.shortcode,
            "hashtags": list(getattr(post, "caption_hashtags", [])),
            "owner_username": post.owner_username,
        }

        if post.typename == "GraphSidecar":
            for node in post.get_sidecar_nodes():
                is_video = node.is_video
                media_list.append({
                    **base_info,
                    "thumb_url": node.display_url,
                    "type": "video" if is_video else "image",
                    "video_url": node.video_url if is_video else None,
                })
        else:
            is_video = post.is_video
            media_list.append({
                **base_info,
                "thumb_url": post.url,
                "type": "video" if is_video else "image",
                "video_url": post.video_url if is_video else None,
            })

    new_offset = offset + posts_returned
    has_more = posts_returned == limit_posts  # approximate

    return jsonify({
        "tags": tags,
        "primary_tag": primary_tag,
        "media": media_list,
        "offset": new_offset,
        "has_more": has_more,
    })


# ====================================================
#  Run
# ====================================================

if __name__ == "__main__":
    app.run(debug=True)
