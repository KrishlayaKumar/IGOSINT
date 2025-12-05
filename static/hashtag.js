// static/hashtag.js
const API_URL = '';

const statusIndicator = document.getElementById('status-indicator');
const hashtagForm = document.getElementById('hashtag-form');
const hashtagInput = document.getElementById('hashtag-input');
const hashtagBtn = document.getElementById('hashtag-btn');

const hashtagLoader = document.getElementById('hashtag-loader');
const hashtagContent = document.getElementById('hashtag-content');
const hashtagErrorBox = document.getElementById('hashtag-error-box');
const hashtagErrorText = document.getElementById('hashtag-error-text');

const hashtagMediaGrid = document.getElementById('hashtag-media-grid');
const hashtagMoreLoader = document.getElementById('hashtag-more-loader');
const hashtagEndMarker = document.getElementById('hashtag-end-marker');

let hashtagTags = [];
let hashtagPrimary = null;
let hashtagOffset = 0;
let hashtagLoadingMore = false;
let hashtagAllLoaded = false;
const HASHTAG_LIMIT = 12;
let hashtagMediaCounter = 0;
let hashtagAllMedia = [];

// health (reuse same as profile)
async function checkBackendHashtag() {
    try {
        const res = await fetch(`${API_URL}/health`);
        if (res.ok) {
            statusIndicator.innerHTML =
                '<i class="fa-solid fa-circle text-[8px] mr-1 text-green-500"></i> Server Online';
            statusIndicator.className = 'text-xs font-mono text-green-500';
        } else throw new Error();
    } catch {
        statusIndicator.innerHTML =
            '<i class="fa-solid fa-circle text-[8px] mr-1 text-red-500"></i> Server Offline (Run app.py)';
        statusIndicator.className = 'text-xs font-mono text-red-500';
    }
}
checkBackendHashtag();

async function safeJsonFetch(url) {
    const res = await fetch(url);
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error("Non-JSON response from", url, ":", text);
        throw new Error("Backend returned non-JSON (check console).");
    }
    if (!res.ok) {
        throw new Error(data.error || 'Request failed');
    }
    return data;
}

function fetchHashtagPage(tags, offset) {
    const tagParam = tags.join(',');
    return safeJsonFetch(
        `${API_URL}/api/hashtag?tags=${encodeURIComponent(tagParam)}&offset=${offset}&limit=${HASHTAG_LIMIT}`
    );
}

function appendHashtagMedia(mediaList) {
    mediaList.forEach(item => {
        const isVideo = item.type === 'video';
        const ext = isVideo ? 'mp4' : 'jpg';
        const id = hashtagMediaCounter++;

        hashtagAllMedia.push({
            id,
            owner_username: item.owner_username,
            type: item.type,
            thumb_url: item.thumb_url,
            video_url: item.video_url,
            likes: item.likes,
            caption: item.caption || '',
            taken_at: item.taken_at,
            comments_count: item.comments_count,
            shortcode: item.shortcode,
            hashtags: item.hashtags || [],
            ext
        });
    });
}

function renderHashtagGrid() {
    hashtagMediaGrid.innerHTML = '';

    hashtagAllMedia.forEach(item => {
        const isVideo = item.type === 'video';
        const thumbProxied = `/proxy?u=${encodeURIComponent(item.thumb_url)}`;
        const downloadUrl = item.video_url || item.thumb_url;
        const encodedUrl = encodeURIComponent(downloadUrl);
        const filename = `${item.owner_username}_${item.id}.${item.ext}`;
        const dateStr = item.taken_at ? new Date(item.taken_at).toLocaleString() : 'Unknown';
        const shortCaption = item.caption
            ? (item.caption.length > 70 ? item.caption.slice(0, 67) + '...' : item.caption)
            : '(no caption)';
        const postUrl = item.shortcode ? `https://www.instagram.com/p/${item.shortcode}/` : null;

        const card = document.createElement('div');
        card.className =
            'group relative aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-800';

        card.innerHTML = `
            <img src="${thumbProxied}"
                 alt="Post"
                 class="w-full h-full object-cover transition duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100">
            <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-xs">
                <div class="mb-2 space-y-1">
                    <div class="flex items-center justify-between">
                        <span class="text-slate-200 flex items-center gap-1">
                            <i class="fa-solid ${isVideo ? 'fa-video' : 'fa-image'}"></i>
                            ${item.likes} likes
                        </span>
                        <span class="text-slate-400">
                            <i class="fa-regular fa-comment-dots mr-1"></i>${item.comments_count}
                        </span>
                    </div>
                    <p class="text-slate-300 leading-snug">${shortCaption}</p>
                    <p class="text-slate-400 text-[11px]">${dateStr}</p>
                </div>
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        ${isVideo ? `
                            <button class="js-open-media bg-slate-900/80 text-white w-7 h-7 flex items-center justify-center rounded-full hover:bg-cyan-500 hover:scale-110 transition shadow-lg"
                                    data-url="${encodedUrl}">
                                <i class="fa-solid fa-play text-[11px]"></i>
                            </button>
                        ` : ''}
                        <button class="js-download-media bg-white text-black w-7 h-7 flex items-center justify-center rounded-full hover:bg-cyan-400 hover:scale-110 transition shadow-lg"
                                data-url="${encodedUrl}"
                                data-filename="${filename}">
                            <i class="fa-solid fa-download text-[11px]"></i>
                        </button>
                    </div>
                    ${postUrl ? `
                        <a href="${postUrl}" target="_blank"
                           class="text-[11px] text-cyan-300 hover:text-cyan-200 underline decoration-dotted">
                           View on Instagram
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
        hashtagMediaGrid.appendChild(card);
    });
}

// download/open (reuse from profile)
async function handleDownload(encodedUrl, filename) {
    try {
        const response = await fetch(`/proxy?u=${encodedUrl}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
        console.warn('Download failed, opening in new tab.');
        window.open(`/proxy?u=${encodedUrl}`, '_blank');
    }
}

function handleOpen(encodedUrl) {
    window.open(`/proxy?u=${encodedUrl}`, '_blank');
}

document.addEventListener('click', (e) => {
    const downloadBtn = e.target.closest('.js-download-media');
    if (downloadBtn) {
        const encodedUrl = downloadBtn.dataset.url;
        const filename = downloadBtn.dataset.filename || 'download';
        handleDownload(encodedUrl, filename);
        return;
    }
    const openBtn = e.target.closest('.js-open-media');
    if (openBtn) {
        const encodedUrl = openBtn.dataset.url;
        handleOpen(encodedUrl);
    }
});

// form submit
hashtagForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const raw = hashtagInput.value.trim();
    if (!raw) return;

    hashtagTags = raw.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => t.startsWith('#') ? t.slice(1) : t);
    if (hashtagTags.length === 0) return;

    hashtagPrimary = hashtagTags[0];
    hashtagOffset = 0;
    hashtagAllLoaded = false;
    hashtagMediaCounter = 0;
    hashtagAllMedia = [];
    hashtagMediaGrid.innerHTML = '';
    hashtagEndMarker.classList.add('hidden');

    hashtagErrorBox.classList.add('hidden');
    hashtagContent.classList.add('hidden');
    hashtagLoader.classList.remove('hidden');
    hashtagBtn.disabled = true;
    hashtagBtn.innerText = 'Exploring...';

    try {
        const data = await fetchHashtagPage(hashtagTags, 0);
        appendHashtagMedia(data.media);
        renderHashtagGrid();

        hashtagOffset = data.offset;
        hashtagAllLoaded = !data.has_more;

        hashtagLoader.classList.add('hidden');
        hashtagContent.classList.remove('hidden');
        if (hashtagAllLoaded) {
            hashtagEndMarker.classList.remove('hidden');
        }
    } catch (err) {
        hashtagLoader.classList.add('hidden');
        hashtagErrorBox.classList.remove('hidden');
        hashtagErrorText.innerText = err.message;
    } finally {
        hashtagBtn.disabled = false;
        hashtagBtn.innerText = 'Explore';
    }
});

// infinite scroll
window.addEventListener('scroll', async () => {
    if (!hashtagPrimary || hashtagLoadingMore || hashtagAllLoaded || hashtagMediaGrid.children.length === 0)
        return;

    const scrollY = window.scrollY;
    const viewportH = window.innerHeight;
    const bottom = hashtagMediaGrid.getBoundingClientRect().bottom + scrollY;

    if (bottom - (scrollY + viewportH) < 400) {
        hashtagLoadingMore = true;
        hashtagMoreLoader.classList.remove('hidden');
        try {
            const data = await fetchHashtagPage(hashtagTags, hashtagOffset);
            appendHashtagMedia(data.media);
            renderHashtagGrid();

            hashtagOffset = data.offset;
            hashtagAllLoaded = !data.has_more;
            if (hashtagAllLoaded) {
                hashtagEndMarker.classList.remove('hidden');
            }
        } catch (e) {
            console.error(e);
        } finally {
            hashtagLoadingMore = false;
            hashtagMoreLoader.classList.add('hidden');
        }
    }
});
