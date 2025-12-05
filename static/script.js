// --- CONFIG ---
const API_URL = ''; // same origin

// ---------- COMMON ----------
const statusIndicator = document.getElementById('status-indicator');

async function checkBackend() {
    try {
        const res = await fetch(`${API_URL}/health`);
        if (res.ok) {
            statusIndicator.innerHTML =
                '<i class="fa-solid fa-circle text-[8px] mr-1 text-green-500"></i> Server Online';
            statusIndicator.className = 'text-xs font-mono text-green-500';
        } else {
            throw new Error();
        }
    } catch (e) {
        console.error('Backend offline');
        statusIndicator.innerHTML =
            '<i class="fa-solid fa-circle text-[8px] mr-1 text-red-500"></i> Server Offline (Run app.py)';
        statusIndicator.className = 'text-xs font-mono text-red-500';
    }
}
checkBackend();

function slugify(str) {
    return (str || '')
        .toString()
        .replace(/[^a-z0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase() || 'export';
}

// ---------- PROFILE STATE & DOM ----------
const profileSearchForm = document.getElementById('profile-search-form');
const profileUsernameInput = document.getElementById('profile-username-input');
const profileSearchBtn = document.getElementById('profile-search-btn');
const profileLoader = document.getElementById('profile-loader');
const profileContent = document.getElementById('profile-content');
const profileErrorBox = document.getElementById('profile-error-box');
const profileErrorText = document.getElementById('profile-error-text');

const profileHeroPills = document.querySelectorAll('.profile-hero-pill');
const profileFilterType = document.getElementById('profile-filter-type');
const profileFilterLikes = document.getElementById('profile-filter-likes');
const profileSortOrder = document.getElementById('profile-sort-order');
const profileApplyFiltersBtn = document.getElementById('profile-apply-filters');
const profileExportJsonBtn = document.getElementById('profile-export-json');
const profileExportZipBtn = document.getElementById('profile-export-zip');

const profileMediaGrid = document.getElementById('profile-media-grid');
const profileMoreLoader = document.getElementById('profile-more-loader');
const profileEndMarker = document.getElementById('profile-end-marker');

// profile card
const profilePicEl = document.getElementById('profile-pic');
const profileUsernameEl = document.getElementById('profile-username');
const profileFullnameEl = document.getElementById('profile-fullname');
const profileBioEl = document.getElementById('profile-bio');
const statFollowersEl = document.getElementById('stat-followers');
const statFollowingEl = document.getElementById('stat-following');
const statPostsEl = document.getElementById('stat-posts');
const verifiedBadgeEl = document.getElementById('verified-badge');
const privateBadgeEl = document.getElementById('private-badge');

// profile analytics
const profileAnTotalMedia = document.getElementById('profile-an-total-media');
const profileAnRange = document.getElementById('profile-an-range');
const profileAnAvgPerDay = document.getElementById('profile-an-avg-per-day');
const profileAnTopLiked = document.getElementById('profile-an-top-liked');

// profile state
let profileUsername = null;
let profileCurrentProfile = null;
let profileOffset = 0;
const PROFILE_LIMIT = 12;
let profileLoadingMore = false;
let profileAllLoaded = false;
let profileAllMedia = [];
let profileMediaCounter = 0;

// ---------- HASHTAG STATE & DOM ----------
const hashtagSearchForm = document.getElementById('hashtag-search-form');
const hashtagTagsInput = document.getElementById('hashtag-tags-input');
const hashtagSearchBtn = document.getElementById('hashtag-search-btn');
const hashtagLoader = document.getElementById('hashtag-loader');
const hashtagContent = document.getElementById('hashtag-content');
const hashtagErrorBox = document.getElementById('hashtag-error-box');
const hashtagErrorText = document.getElementById('hashtag-error-text');

const hashtagHeroPills = document.querySelectorAll('.hashtag-hero-pill');
const hashtagTagFilterInput = document.getElementById('hashtag-tag-filter');
const hashtagFilterType = document.getElementById('hashtag-filter-type');
const hashtagFilterLikes = document.getElementById('hashtag-filter-likes');
const hashtagSortOrder = document.getElementById('hashtag-sort-order');
const hashtagApplyFiltersBtn = document.getElementById('hashtag-apply-filters');

const hashtagMediaGrid = document.getElementById('hashtag-media-grid');
const hashtagMoreLoader = document.getElementById('hashtag-more-loader');
const hashtagEndMarker = document.getElementById('hashtag-end-marker');

// hashtag state
let hashtagTags = null;
let hashtagPrimaryTag = null;
let hashtagOffset = 0;
const HASHTAG_LIMIT = 12;
let hashtagLoadingMore = false;
let hashtagAllLoaded = false;
let hashtagAllMedia = [];
let hashtagMediaCounter = 0;

// ---------- FETCH HELPERS ----------
async function fetchProfilePage(username, offset) {
    const res = await fetch(
        `${API_URL}/api/scrape?username=${encodeURIComponent(username)}&offset=${offset}&limit=${PROFILE_LIMIT}`
    );
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
    }
    return data;
}

async function fetchHashtagPage(tags, offset) {
    const res = await fetch(
        `${API_URL}/api/hashtag?tags=${encodeURIComponent(tags)}&offset=${offset}&limit=${HASHTAG_LIMIT}`
    );
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch hashtag feed');
    }
    return data;
}

// ---------- PROFILE RENDER ----------
function renderProfileHeader(profile) {
    profilePicEl.src = `/proxy?u=${encodeURIComponent(profile.profile_pic)}`;
    profileUsernameEl.innerText = profile.username;
    profileFullnameEl.innerText = profile.full_name || '';
    profileBioEl.innerText = profile.biography || '';

    const fmt = Intl.NumberFormat('en', { notation: 'compact' });
    statFollowersEl.innerText = fmt.format(profile.followers);
    statFollowingEl.innerText = fmt.format(profile.following);
    statPostsEl.innerText = fmt.format(profile.posts_count);

    verifiedBadgeEl.classList.toggle('hidden', !profile.is_verified);
    privateBadgeEl.classList.toggle('hidden', !profile.is_private);
}

function appendProfileMedia(mediaList) {
    mediaList.forEach(item => {
        const isVideo = item.type === 'video';
        const ext = isVideo ? 'mp4' : 'jpg';
        const id = profileMediaCounter++;

        profileAllMedia.push({
            id,
            username: profileUsername,
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

function renderProfileMediaGrid() {
    profileMediaGrid.innerHTML = '';

    let filtered = [...profileAllMedia];

    // type (dropdown)
    const ft = profileFilterType.value;
    if (ft !== 'all') {
        filtered = filtered.filter(m => m.type === ft);
    }

    // min likes
    const minLikes = parseInt(profileFilterLikes.value || '0', 10);
    if (!isNaN(minLikes) && minLikes > 0) {
        filtered = filtered.filter(m => m.likes >= minLikes);
    }

    // sort
    const order = profileSortOrder.value;
    filtered.sort((a, b) => {
        if (order === 'likes_desc') return b.likes - a.likes;
        if (order === 'likes_asc') return a.likes - b.likes;

        const da = a.taken_at ? Date.parse(a.taken_at) : 0;
        const db = b.taken_at ? Date.parse(b.taken_at) : 0;

        if (order === 'oldest') return da - db;
        return db - da; // newest
    });

    // render
    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className =
            'group relative aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-800';

        const isVideo = item.type === 'video';
        const thumbProxied = `/proxy?u=${encodeURIComponent(item.thumb_url)}`;
        const downloadUrl = item.video_url || item.thumb_url;
        const encodedUrl = encodeURIComponent(downloadUrl);
        const filename = `${item.username}_${item.id}.${item.ext}`;
        const dateStr = item.taken_at ? new Date(item.taken_at).toLocaleString() : 'Unknown';
        const shortCaption = item.caption
            ? (item.caption.length > 70 ? item.caption.slice(0, 67) + '...' : item.caption)
            : '(no caption)';
        const postUrl = item.shortcode ? `https://www.instagram.com/p/${item.shortcode}/` : null;

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
        profileMediaGrid.appendChild(card);
    });
}

function updateProfileAnalytics() {
    const n = profileAllMedia.length;
    profileAnTotalMedia.innerText = n.toString();

    if (n === 0) {
        profileAnRange.innerText = '';
        profileAnAvgPerDay.innerText = '0';
        profileAnTopLiked.innerHTML = '';
        return;
    }

    const dates = profileAllMedia
        .map(m => m.taken_at ? Date.parse(m.taken_at) : null)
        .filter(d => d !== null)
        .sort((a, b) => a - b);

    if (dates.length > 0) {
        const first = new Date(dates[0]);
        const last = new Date(dates[dates.length - 1]);
        const days = Math.max(1, (last - first) / (1000 * 60 * 60 * 24));
        const avg = n / days;

        profileAnRange.innerText = `${first.toLocaleDateString()} → ${last.toLocaleDateString()}`;
        profileAnAvgPerDay.innerText = avg.toFixed(2);
    } else {
        profileAnRange.innerText = 'No date metadata';
        profileAnAvgPerDay.innerText = '0';
    }

    const top = [...profileAllMedia]
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 3);

    profileAnTopLiked.innerHTML = '';
    top.forEach((m, idx) => {
        const li = document.createElement('li');
        const shortCaption = m.caption
            ? (m.caption.length > 60 ? m.caption.slice(0, 57) + '...' : m.caption)
            : '(no caption)';
        const postUrl = m.shortcode ? `https://www.instagram.com/p/${m.shortcode}/` : null;

        li.innerHTML = `
            <span class="text-slate-400 mr-1">#${idx + 1}</span>
            <span class="text-slate-200 font-semibold mr-1">${m.likes} likes</span>
            <span class="text-slate-400">– ${shortCaption}</span>
            ${postUrl ? `<a href="${postUrl}" target="_blank" class="text-cyan-300 ml-1 underline decoration-dotted">link</a>` : ''}
        `;
        profileAnTopLiked.appendChild(li);
    });
}

// ---------- HASHTAG RENDER ----------
function appendHashtagMedia(mediaList) {
    mediaList.forEach(item => {
        const isVideo = item.type === 'video';
        const ext = isVideo ? 'mp4' : 'jpg';
        const id = hashtagMediaCounter++;

        hashtagAllMedia.push({
            id,
            username: item.owner_username || 'user',
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

function renderHashtagMediaGrid() {
    hashtagMediaGrid.innerHTML = '';

    let filtered = [...hashtagAllMedia];

    // type
    const ft = hashtagFilterType.value;
    if (ft !== 'all') {
        filtered = filtered.filter(m => m.type === ft);
    }

    // caption hashtags refine
    const rawTags = hashtagTagFilterInput.value.trim().toLowerCase();
    let tagList = [];
    if (rawTags) {
        tagList = rawTags
            .split(',')
            .map(t => t.trim().replace(/^#/, '').toLowerCase())
            .filter(Boolean);
    }
    if (tagList.length > 0) {
        filtered = filtered.filter(m => {
            if (!m.hashtags || m.hashtags.length === 0) return false;
            const lowerTags = m.hashtags.map(h => h.toLowerCase());
            return tagList.some(tag => lowerTags.includes(tag));
        });
    }

    // min likes
    const minLikes = parseInt(hashtagFilterLikes.value || '0', 10);
    if (!isNaN(minLikes) && minLikes > 0) {
        filtered = filtered.filter(m => m.likes >= minLikes);
    }

    // sort
    const order = hashtagSortOrder.value;
    filtered.sort((a, b) => {
        if (order === 'likes_desc') return b.likes - a.likes;
        if (order === 'likes_asc') return a.likes - b.likes;

        const da = a.taken_at ? Date.parse(a.taken_at) : 0;
        const db = b.taken_at ? Date.parse(b.taken_at) : 0;

        if (order === 'oldest') return da - db;
        return db - da; // newest
    });

    // render
    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className =
            'group relative aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-800';

        const isVideo = item.type === 'video';
        const thumbProxied = `/proxy?u=${encodeURIComponent(item.thumb_url)}`;
        const downloadUrl = item.video_url || item.thumb_url;
        const encodedUrl = encodeURIComponent(downloadUrl);
        const filename = `${item.username}_${item.id}.${item.ext}`;
        const dateStr = item.taken_at ? new Date(item.taken_at).toLocaleString() : 'Unknown';
        const shortCaption = item.caption
            ? (item.caption.length > 70 ? item.caption.slice(0, 67) + '...' : item.caption)
            : '(no caption)';
        const postUrl = item.shortcode ? `https://www.instagram.com/p/${item.shortcode}/` : null;

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
                           @${item.username}
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
        hashtagMediaGrid.appendChild(card);
    });
}

// ---------- DOWNLOAD / OPEN (shared) ----------
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
    } catch (error) {
        console.warn('Download failed, opening in new tab.');
        window.open(`/proxy?u=${encodedUrl}`, '_blank');
    }
}

function handleOpen(encodedUrl) {
    window.open(`/proxy?u=${encodedUrl}`, '_blank');
}

// delegate clicks for both grids
function setupGridDelegation(gridEl) {
    gridEl.addEventListener('click', (e) => {
        const downloadBtn = e.target.closest('.js-download-media');
        if (downloadBtn) {
            const encodedUrl = downloadBtn.dataset.url;
            const filename = downloadBtn.dataset.filename;
            handleDownload(encodedUrl, filename);
            return;
        }

        const openBtn = e.target.closest('.js-open-media');
        if (openBtn) {
            const encodedUrl = openBtn.dataset.url;
            handleOpen(encodedUrl);
        }
    });
}
setupGridDelegation(profileMediaGrid);
setupGridDelegation(hashtagMediaGrid);

// ---------- PROFILE EVENTS ----------
profileApplyFiltersBtn.addEventListener('click', () => {
    renderProfileMediaGrid();
});

profileHeroPills.forEach(btn => {
    btn.addEventListener('click', () => {
        profileHeroPills.forEach(b => {
            b.classList.remove('bg-cyan-500', 'text-slate-900', 'border-cyan-400');
            b.classList.add('bg-slate-800', 'text-slate-200', 'border-slate-700');
        });
        btn.classList.remove('bg-slate-800', 'text-slate-200', 'border-slate-700');
        btn.classList.add('bg-cyan-500', 'text-slate-900', 'border-cyan-400');

        const type = btn.dataset.heroType;
        if (type === 'posts') {
            profileFilterType.value = 'image';
        } else if (type === 'reels') {
            profileFilterType.value = 'video';
        } else {
            profileFilterType.value = 'all';
        }
        renderProfileMediaGrid();
    });
});

// profile exports
profileExportJsonBtn.addEventListener('click', () => {
    if (!profileCurrentProfile) return;
    const payload = {
        profile: profileCurrentProfile,
        media: profileAllMedia
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const filename = `${profileCurrentProfile.username}_profile_dump.json`;
    saveAs(blob, filename);
});

profileExportZipBtn.addEventListener('click', async () => {
    if (!profileCurrentProfile || profileAllMedia.length === 0) return;

    profileExportZipBtn.disabled = true;
    profileExportZipBtn.innerText = 'Preparing ZIP...';

    const zip = new JSZip();
    const folder = zip.folder(profileCurrentProfile.username || 'instagram');

    let done = 0;
    for (const item of profileAllMedia) {
        const url = item.video_url || item.thumb_url;
        const encodedUrl = encodeURIComponent(url);
        const filename = `${item.username}_${item.id}.${item.ext}`;

        try {
            const response = await fetch(`/proxy?u=${encodedUrl}`);
            if (!response.ok) throw new Error('Failed');
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            folder.file(filename, arrayBuffer);
        } catch (e) {
            console.warn('Failed to add file to zip:', filename);
        }

        done++;
        profileExportZipBtn.innerText = `Zipping ${done}/${profileAllMedia.length}`;
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${profileCurrentProfile.username}_media.zip`);

    profileExportZipBtn.innerText = 'Export Media ZIP';
    profileExportZipBtn.disabled = false;
});

// profile search submit
profileSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = profileUsernameInput.value.trim();
    if (!username) return;

    profileUsername = username;
    profileOffset = 0;
    profileAllLoaded = false;
    profileMediaCounter = 0;
    profileAllMedia = [];
    profileMediaGrid.innerHTML = '';
    profileEndMarker.classList.add('hidden');

    profileErrorBox.classList.add('hidden');
    profileContent.classList.add('hidden');
    profileLoader.classList.remove('hidden');
    profileSearchBtn.disabled = true;
    profileSearchBtn.innerText = 'Scraping...';

    try {
        const data = await fetchProfilePage(profileUsername, 0);
        profileCurrentProfile = data.profile;
        renderProfileHeader(data.profile);

        appendProfileMedia(data.media);
        renderProfileMediaGrid();
        updateProfileAnalytics();

        profileOffset = data.offset;
        profileAllLoaded = !data.has_more;

        profileLoader.classList.add('hidden');
        profileContent.classList.remove('hidden');
        if (profileAllLoaded) {
            profileEndMarker.classList.remove('hidden');
        }
    } catch (err) {
        profileLoader.classList.add('hidden');
        profileErrorBox.classList.remove('hidden');
        profileErrorText.innerText = err.message;
    } finally {
        profileSearchBtn.disabled = false;
        profileSearchBtn.innerText = 'Search';
    }
});

// ---------- HASHTAG EVENTS ----------
hashtagApplyFiltersBtn.addEventListener('click', () => {
    renderHashtagMediaGrid();
});
hashtagTagFilterInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        renderHashtagMediaGrid();
    }
});
hashtagHeroPills.forEach(btn => {
    btn.addEventListener('click', () => {
        hashtagHeroPills.forEach(b => {
            b.classList.remove('bg-cyan-500', 'text-slate-900', 'border-cyan-400');
            b.classList.add('bg-slate-800', 'text-slate-200', 'border-slate-700');
        });
        btn.classList.remove('bg-slate-800', 'text-slate-200', 'border-slate-700');
        btn.classList.add('bg-cyan-500', 'text-slate-900', 'border-cyan-400');

        const type = btn.dataset.heroType;
        if (type === 'posts') {
            hashtagFilterType.value = 'image';
        } else if (type === 'reels') {
            hashtagFilterType.value = 'video';
        } else {
            hashtagFilterType.value = 'all';
        }
        renderHashtagMediaGrid();
    });
});

// hashtag search submit
hashtagSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tags = hashtagTagsInput.value.trim();
    if (!tags) return;

    hashtagTags = tags;
    hashtagPrimaryTag = null;
    hashtagOffset = 0;
    hashtagAllLoaded = false;
    hashtagMediaCounter = 0;
    hashtagAllMedia = [];
    hashtagMediaGrid.innerHTML = '';
    hashtagEndMarker.classList.add('hidden');

    hashtagErrorBox.classList.add('hidden');
    hashtagContent.classList.add('hidden');
    hashtagLoader.classList.remove('hidden');
    hashtagSearchBtn.disabled = true;
    hashtagSearchBtn.innerText = 'Exploring...';

    try {
        const data = await fetchHashtagPage(hashtagTags, 0);
        hashtagPrimaryTag = data.primary_tag;

        appendHashtagMedia(data.media);
        renderHashtagMediaGrid();

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
        hashtagSearchBtn.disabled = false;
        hashtagSearchBtn.innerText = 'Explore';
    }
});

// ---------- INFINITE SCROLL FOR BOTH ----------
window.addEventListener('scroll', async () => {
    const scrollY = window.scrollY;
    const viewportH = window.innerHeight;

    // PROFILE LOAD MORE
    if (profileUsername && !profileLoadingMore && !profileAllLoaded && profileMediaGrid.children.length > 0) {
        const profileBottom = profileMediaGrid.getBoundingClientRect().bottom + scrollY;
        if (profileBottom - (scrollY + viewportH) < 400) {
            profileLoadingMore = true;
            profileMoreLoader.classList.remove('hidden');
            try {
                const data = await fetchProfilePage(profileUsername, profileOffset);
                appendProfileMedia(data.media);
                renderProfileMediaGrid();
                updateProfileAnalytics();

                profileOffset = data.offset;
                profileAllLoaded = !data.has_more;
                if (profileAllLoaded) {
                    profileEndMarker.classList.remove('hidden');
                }
            } catch (e) {
                console.error(e);
            } finally {
                profileLoadingMore = false;
                profileMoreLoader.classList.add('hidden');
            }
        }
    }

    // HASHTAG LOAD MORE
    if (hashtagTags && !hashtagLoadingMore && !hashtagAllLoaded && hashtagMediaGrid.children.length > 0) {
        const hashtagBottom = hashtagMediaGrid.getBoundingClientRect().bottom + scrollY;
        if (hashtagBottom - (scrollY + viewportH) < 400) {
            hashtagLoadingMore = true;
            hashtagMoreLoader.classList.remove('hidden');
            try {
                const data = await fetchHashtagPage(hashtagTags, hashtagOffset);
                appendHashtagMedia(data.media);
                renderHashtagMediaGrid();

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
    }
});
