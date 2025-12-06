limport os
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

# ====================================================
# Session helpers - Simplified for public profiles
# ====================================================

def make_loader():
    """
    Create an Instaloader instance WITHOUT login requirement.
    This allows scraping public profiles and hashtags.
    """
    L = instaloader.Instaloader(
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
    )
    return L

# ====================================================
# Page routes
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

@app.route("/login", endpoint="login_page")
def login_page():
    return (
        "<html><body style='font-family:sans-serif;background:#020617;color:#e5e7eb;"
        "padding:2rem'>"
        "<h1>Instagram Public Profile Downloader</h1>"
        "<p>No login required - works with public profiles.</p>"
        "<p>Use <a href='/profile'>Profile Downloader</a> or "
        "<a href='/hashtag'>Hashtag Explorer</a>.</p>"
        "</body></html>"
    )

# ====================================================
# Utility endpoints
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

# ====================================================
# API: Profile posts (main grid) - NO LOGIN REQUIRED
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
    
    # Create loader WITHOUT login - works for public profiles
    L = make_loader()
    
    try:
        profile = instaloader.Profile.from_username(L.context, username)
        
        # Check if profile is private
        if profile.is_private:
            return jsonify({
                "error": "Profile is private. Cannot access private profiles without authentication.",
                "is_private": True
            }), 403
        
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
                "error": "Instagram is rate limiting your IP. Please wait and try again."
            }), 429
        return jsonify({"error": "Connection error: " + msg}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ====================================================
# API: Hashtag explorer - NO LOGIN REQUIRED
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
    
    L = make_loader()
    
    try:
        hashtag = instaloader.Hashtag.from_name(L.context, primary_tag)
    except instaloader.exceptions.ConnectionException as e:
        msg = str(e)
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
# Run
# ====================================================

if __name__ == "__main__":
    app.run(debug=True)
