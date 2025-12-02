// Scroll to top button
const backToTopBtn = document.getElementById('backToTopBtn');
window.addEventListener('scroll', () => {
    if (document.documentElement.scrollTop > 100) {
        backToTopBtn.style.display = 'block';
    } else {
        backToTopBtn.style.display = 'none';
    }
});
backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.addEventListener('DOMContentLoaded', () => {

    const USE_REMOTE_DATA = false; // Set to true for production, false for local/testing

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzy7xTfb_uUN5QbOZrici11BFTVq2NIVEbObdt0hmgppYtUkl7K8Fs7nET-IuxHUHnVnA/exec';
    const LOCAL_JSON_PATH = './media-data.json';

    // Popup Add Form Elements
    const floatingAddBtn = document.getElementById('floatingAddBtn');
    const popupOverlay = document.getElementById('popupOverlay');
    const popupBox = document.getElementById('popupBox');
    const popupCloseBtn = document.getElementById('popupCloseBtn');
    const addForm = document.getElementById('addForm');
    const tmdbInput = document.getElementById('tmdbInput');
    const watchedBtn = document.getElementById('watchedBtn');
    const toWatchBtn = document.getElementById('toWatchBtn');
    const submitBtn = document.getElementById('submitBtn');
    const messageDiv = document.getElementById('message');
    const starsContainer = document.getElementById('stars');
    const watchedListDiv = document.getElementById('watchedList');
    const toWatchListDiv = document.getElementById('toWatchList');

    // Show popup when floating button clicked
    floatingAddBtn.addEventListener('click', () => {
        popupOverlay.style.display = 'block';
        addForm.style.display = 'block';
        setTimeout(() => { tmdbInput.focus(); }, 200);
    });

    // Hide popup when cross button clicked
    popupCloseBtn.addEventListener('click', () => {
        popupOverlay.style.display = 'none';
        addForm.style.display = 'none';
        addForm.reset();
    });

    // Hide popup when clicking outside the box
    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) {
            popupOverlay.style.display = 'none';
            addForm.style.display = 'none';
            addForm.reset();
        }
    });

    // Star rating setup
    let selectedRating = null;
    const STAR_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    starsContainer.innerHTML = '';
    STAR_VALUES.forEach(value => {
        const star = document.createElement('span');
        star.className = 'star';
        star.innerHTML = '★';
        star.dataset.value = value;
        star.addEventListener('click', () => {
            selectedRating = (selectedRating === value) ? null : value;
            shadeStars(selectedRating);
        });
        starsContainer.appendChild(star);
    });

    function shadeStars(uptoValue) {
        Array.from(starsContainer.children).forEach(star => {
            const starValue = parseInt(star.dataset.value);
            if (uptoValue && starValue <= uptoValue) {
                star.classList.add('selected');
            } else {
                star.classList.remove('selected');
            }
        });
    }

    //toggle button for watched/to watch in form
    let selectedList = 'watched';
    function selectList(list) {
        selectedList = list;
        watchedBtn.classList.toggle('active', list === 'watched');
        toWatchBtn.classList.toggle('active', list === 'toWatch');
    }
    watchedBtn.onclick = () => selectList('watched');
    toWatchBtn.onclick = () => selectList('toWatch');
    selectList(selectedList);

    //Filters show and hide
    const filtersToggleBtn = document.getElementById('filtersToggleBtn');
    const filtersSection = document.getElementById('filtersSection');

    filtersToggleBtn.addEventListener('click', () => {
        if (filtersSection.style.display === 'none') {
            filtersSection.style.display = 'block';
            filtersToggleBtn.textContent = '▲ Filters';
        } else {
            filtersSection.style.display = 'none';
            filtersToggleBtn.textContent = '▼ Filters';
        }
    });

    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    resetFiltersBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#filtersSection input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true); // Check all boxes
        applyFilters(); // Re-apply filters to show all items
    });

    function toBool(value) {
        return value === true || value === 'TRUE' || value === 'true';
    }

    
    const mediaTypeFilters = document.querySelectorAll('#mediaTypeFilters input[type="checkbox"]');
    const watchStatusFilters = document.querySelectorAll('#watchStatusFilters input[type="checkbox"]');
    mediaTypeFilters.forEach(cb => cb.checked = true);
    watchStatusFilters.forEach(cb => cb.checked = true);
    mediaTypeFilters.forEach(checkbox => checkbox.addEventListener('change', applyFilters));
    watchStatusFilters.forEach(checkbox => checkbox.addEventListener('change', applyFilters));

    //applying filters
    function applyFilters() {
        // Get checked media types
        const checkedMediaTypes = Array.from(mediaTypeFilters)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // Get checked watch statuses
        const checkedStatuses = Array.from(watchStatusFilters)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // Filter watched list
        const filteredWatched = allItems.filter(item => {
            const mediaTypeMatch = checkedMediaTypes.includes(item.mediaType);
            const watchedStatus = (item.watched === true || item.watched === 'TRUE' || item.watched === 'true');
            const rewatchStatus = (item.reWatch === true || item.reWatch === 'TRUE' || item.reWatch === 'true');

            // Check watched filters
            let statusMatch = false;
            if (watchedStatus && checkedStatuses.includes('watched')) statusMatch = true;
            if (rewatchStatus && checkedStatuses.includes('rewatch')) statusMatch = true;

            return mediaTypeMatch && statusMatch;
        });

        // Filter to watch list
        const filteredToWatch = allItems.filter(item => {
            const mediaTypeMatch = checkedMediaTypes.includes(item.mediaType);
            const toWatchStatus = (item.toWatch === true || item.toWatch === 'TRUE' || item.toWatch === 'true');

            // Check toWatch filters
            let statusMatch = false;
            if (toWatchStatus && checkedStatuses.includes('toWatch')) statusMatch = true;

            return mediaTypeMatch && statusMatch;
        });

        renderList(filteredWatched, watchedListDiv);
        renderList(filteredToWatch, toWatchListDiv);
    }



    // Render media items in container
    function renderList(items, container, append = false) {
        if (!append) container.innerHTML = ''; // Clear everything only in normal mode

        items.forEach(item => {
            const mediaTypeClass = item.mediaType === 'movie' ? 'movie' : (item.mediaType === 'tv' ? 'tv' : '');
            const ratingDisplay = (item.rating === undefined || item.rating === null || item.rating === '')
                ? '/' + '★'
                : item.rating + '★';
            const idParam = encodeURIComponent(item.rowId || item.mediaId);

            const div = document.createElement('div');
            div.className = 'entry ' + mediaTypeClass;
            div.style.position = 'relative';
            div.id = "entry-" + item.mediaType + "-" + item.mediaId;
            div.innerHTML = `
                <img src="${item.poster}" alt="${item.title} poster" />
                <div class="info">
                    <div style="font-weight:bold">${item.title} (${item.relYear}) </div>
                    <div class="date">${item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Unknown'}</div>
                </div>
                <div class="side-bar1">
                    <div class="rating-right">${ratingDisplay}</div>
                    ${item.reWatch === true || item.reWatch === 'TRUE' || item.reWatch === 'true' ? '<div class="rewatch-label">Rewatch</div>' : ''}
                </div>
                <div class="side-bar2">
                    <a href="edit.html?id=${idParam}" class="edit-icon" title="Edit item" aria-label="Edit">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.5 5.5L18.3 8.3M3 21L3.04 20.6C3.21 19.5 3.3 18.9 3.49 18.3C3.6 17.9 3.89 17.4 4.18 17C4.5 16.5 4.92 16.1 5.76 15.2L17.4 3.59C18.19 2.81 19.46 2.81 20.23 3.59C21.02 4.37 21.02 5.64 20.23 6.41L8.38 18.28C7.61 19 7.23 19.42 6.8 19.7C6.41 20 6 20.2 5.56 20.4C5.07 20.6 4.54 20.7 3.48 20.9L3 21Z" />
                        </svg>
                    </a>
                    <div class="type-label">${mediaTypeClass ? mediaTypeClass.toUpperCase() : ''}</div>
                </div>
            `;
            if (append) {
                container.insertBefore(div, container.firstChild); // Add to top
            } else {
                container.appendChild(div); // Standard rendering
            }
        });
    }

    // Banner with spinner for checking updates
    function showCheckingBanner() {
        messageDiv.textContent = 'Checking for latest updates... ';
        messageDiv.className = '';
        messageDiv.style.display = 'inline-flex';
        if (!document.getElementById('spinner')) {
            const spinner = document.createElement('span');
            spinner.id = 'spinner';
            messageDiv.appendChild(spinner);
        }
    }

    function removeSpinnerAndMaybeHide(delayMs = 0) {
        const spinner = document.getElementById('spinner');
        if (spinner) spinner.remove();
        if (delayMs > 0) {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, delayMs);
        } else {
            messageDiv.style.display = 'none';
        }
    }

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = type || '';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 4000);
    }

    // Load local json and display
    async function loadLocalData() {
        try {
            const response = await fetch(LOCAL_JSON_PATH, { cache: 'no-store' });
            if (!response.ok) throw new Error('Failed to load local JSON');
            const items = await response.json();
            displayItems(items);
        } catch (error) {
            console.error('Error loading local data:', error);
            showMessage('Error loading local data.', 'error');
        }
    }

    // Show media in Watched / To Watch lists
    let allItems = [];
    async function displayItems(items) {
        allItems = items;
        applyFilters(); // Apply filters initially (all checked means all shown)
        document.getElementById('loading').style.display = 'none';
        document.getElementById('viewlist').style.display = 'block';
    }

    // Check for updates logic
    async function checkForUpdates() {
        if (!USE_REMOTE_DATA) return;
        try {
            showCheckingBanner();
            const [localData, latestData] = await Promise.all([
                fetch(LOCAL_JSON_PATH, { cache: 'no-store' }).then(r => r.json()),
                fetch(APPS_SCRIPT_URL, { cache: 'no-store' }).then(r => r.json())
            ]);
            const normalizeDates = items => items.map(item => {
                if (item.timestamp)
                    item.timestamp = item.timestamp.toString().slice(0, 19) + 'Z';
                return item;
            });

            const normalizedLocal = JSON.stringify(normalizeDates(localData));
            const normalizedLatest = JSON.stringify(normalizeDates(latestData));

        if (!USE_REMOTE_DATA) {
                messageDiv.textContent = 'Only loading local';
                messageDiv.className = 'success';
                removeSpinnerAndMaybeHide(5000);
        } else if (normalizedLocal === normalizedLatest) {
                messageDiv.textContent = 'No pending updates';
                messageDiv.className = 'success';
                removeSpinnerAndMaybeHide(5000);
            } else {
                displayItems(latestData);
                messageDiv.textContent = 'Latest updates loaded';
                messageDiv.className = 'success';
                removeSpinnerAndMaybeHide(5000);
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
            messageDiv.textContent = 'Error checking for updates';
            messageDiv.className = 'error';
            messageDiv.style.display = 'block';
        }
    }

    // Startup logic
    if (USE_REMOTE_DATA) {
        loadLocalData().then(checkForUpdates);
    } else {
        loadLocalData(); // Just load from local JSON, skip update check
        messageDiv.textContent = 'Loading local data only';
        messageDiv.className = 'success';
        removeSpinnerAndMaybeHide(5000);
    }


    //scrolling logic
    //------ Check if working
    async function scrollToEntry(tmdbLink) {
        addForm.reset();
        popupOverlay.style.display = 'none';
        // Extract mediaType and mediaId from your form
        const match = tmdbLink.match(/themoviedb\.org\/(movie|tv)\/(\d+)/i);
        const entryType = match[1];
        const entryMediaId = match[2]
        const id = "entry-" + entryType + "-" + entryMediaId;
        const entryEl = document.getElementById(id);
        if (entryEl) {
            entryEl.scrollIntoView({ behavior: "smooth", block: "center" });
            entryEl.classList.remove('highlighted');
            void entryEl.offsetWidth; // force reflow to restart animation
            entryEl.classList.add('highlighted');
            flag = true;
        }
        else{
            setTimeout(() => scrollToEntry(tmdbLink), 500);
        }
        flag = false;
    }

    // Form submission (inside popup)
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tmdbLink = tmdbInput.value.trim();
        if (!tmdbLink) {
            showMessage('Please enter a TMDB link.', 'error');
            return;
        }
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const formData = new FormData();
        formData.append('tmdbLink', tmdbLink);
        formData.append('listType', selectedList);
        formData.append('rating', selectedRating || '');
        formData.append('reWatch', false);

        try {
            const response = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: formData });
            const result = await response.json();
            if (result.result === 'duplicate') {
                showMessage('This entry already exists.', 'error');
                scrollToEntry(tmdbLink);
            }
            else if (result.result === 'success') {
                showMessage('Added successfully!', 'success');
                if (result.item) {
                    // Option 1: Use your full renderList function with append=true
                    if (result.item.watched === true || result.item.watched === 'TRUE') {
                        renderList([result.item], watchedListDiv, true);
                    } else if (result.item.toWatch === true || result.item.toWatch === 'TRUE') {
                        renderList([result.item], toWatchListDiv, true);
                    }
                }
                scrollToEntry(tmdbLink);
            } else {
                showMessage('Failed to add entry.', 'error');
            }
        } catch (err) {
            showMessage('Error submitting data.', 'error');
            console.error(err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        }
    });
});
