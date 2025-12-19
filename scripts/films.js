document.addEventListener('DOMContentLoaded', function () {
    const allFilmsContainer = document.getElementById('allFilms');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    const toastContainer = document.getElementById('toastContainer');

    const genreToggle = document.getElementById('genreToggle');
    const genreMenu = document.getElementById('genreMenu');
    const genreLabel = document.getElementById('genreLabel');

    const sortToggle = document.getElementById('sortToggle');
    const sortMenu = document.getElementById('sortMenu');
    const sortLabel = document.getElementById('sortLabel');

    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');

    let filmsData = [];
    let filtered = [];
    let currentGenre = localStorage.getItem('vt_genre') || 'all';
    let currentSort = localStorage.getItem('vt_sort') || 'default';
    let page = parseInt(localStorage.getItem('vt_page') || '1', 10);
    const PAGE_SIZE = 12;

    function escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    function showToast({message, type = 'info', timeout = 4500}) {
        const el = document.createElement('div');
        el.className = 'toast ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : '');
        el.setAttribute('role', 'status');
        el.innerHTML = `
            <div class="toast-content">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
            <button class="toast-close" aria-label="Закрыть уведомление">&times;</button>
        `;
        toastContainer.appendChild(el);
        const closeBtn = el.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => el.remove());
        if (timeout > 0) setTimeout(() => el.remove(), timeout);
    }

    function favoriteIcon(active) {
        return active ? '<i class="fas fa-heart" aria-hidden="true"></i>' : '<i class="far fa-heart" aria-hidden="true"></i>';
    }

    function renderSkeletons(container, count = 6) {
        container.innerHTML = Array.from({length: count}).map(() => `
            <div class="skeleton-card">
                <div class="skeleton-poster"></div>
                <div style="padding:10px">
                    <div class="skeleton-line" style="width:70%"></div>
                    <div class="skeleton-line" style="width:50%"></div>
                    <div class="skeleton-line" style="width:40%"></div>
                </div>
            </div>
        `).join('');
    }

    genreLabel.textContent = `Фильтр: ${currentGenre === 'all' ? 'Все жанры' : currentGenre}`;
    sortLabel.textContent = currentSort === 'default' ? 'Сортировка: По умолчанию' : `Сортировка: ${currentSort}`;
    renderSkeletons(allFilmsContainer, 8);

    fetch('api/films.php')
        .then(resp => {
            if (!resp.ok) throw new Error('Ошибка сети при получении фильмов');
            return resp.json();
        })
        .then(data => {
            filmsData = data || [];
            applyFiltersAndSort();
            restoreFavorites();
            allFilmsContainer.setAttribute('aria-busy', 'false');
        })
        .catch(err => {
            console.error(err);
            allFilmsContainer.innerHTML = `<div class="error">Не удалось загрузить список фильмов. Попробуйте обновить страницу.</div>`;
            showToast({message: 'Ошибка загрузки фильмов. Проверьте соединение.', type: 'error', timeout: 7000});
        });

    function applyFiltersAndSort() {
        const query = (searchInput.value || '').trim().toLowerCase();
        filtered = filmsData.filter(f => {
            const inGenre = (currentGenre === 'all') || (String(f.genres || '').includes(currentGenre));
            const matchesQuery = !query || (String(f.title || '').toLowerCase().includes(query)) || (String(f.director || '').toLowerCase().includes(query));
            return inGenre && matchesQuery;
        });

        if (currentSort === 'По рейтингу') {
            filtered.sort((a,b) => (b.rating || 0) - (a.rating || 0));
        } else if (currentSort === 'По году') {
            filtered.sort((a,b) => (b.year || 0) - (a.year || 0));
        } else if (currentSort === 'По названию') {
            filtered.sort((a,b) => String(a.title || '').localeCompare(String(b.title || ''), 'ru'));
        }

        const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        if (page > maxPage) page = 1;
        localStorage.setItem('vt_page', String(page));
        renderPage();
    }

    function renderPage() {
        const start = (page - 1) * PAGE_SIZE;
        const chunk = filtered.slice(start, start + PAGE_SIZE);

        if (!chunk.length) {
            allFilmsContainer.innerHTML = `<div class="error">Ничего не найдено по текущим фильтрам. Попробуйте изменить критерии поиска.</div>`;
            updatePagination();
            return;
        }

        const frag = document.createDocumentFragment();
        allFilmsContainer.innerHTML = '';

        chunk.forEach(f => {
            const card = createFilmCardElement(f);
            frag.appendChild(card);
        });
        allFilmsContainer.appendChild(frag);

        updatePagination();
    }

    function updatePagination() {
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        pageNumbers.innerHTML = '';

        const visible = 5;
        let start = Math.max(1, page - Math.floor(visible/2));
        let end = Math.min(totalPages, start + visible - 1);
        if (end - start + 1 < visible) start = Math.max(1, end - visible + 1);

        for (let i = start; i <= end; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn-small' + (i === page ? ' active' : '');
            btn.textContent = i;
            btn.setAttribute('aria-label', `Страница ${i}`);
            btn.addEventListener('click', () => {
                page = i;
                localStorage.setItem('vt_page', String(page));
                renderPage();
                window.scrollTo({top: 200, behavior: 'smooth'});
            });
            pageNumbers.appendChild(btn);
        }

        prevPageBtn.disabled = page <= 1;
        nextPageBtn.disabled = page >= totalPages;
    }

    prevPageBtn.addEventListener('click', () => {
        if (page > 1) { page--; localStorage.setItem('vt_page', String(page)); renderPage(); }
    });
    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        if (page < totalPages) { page++; localStorage.setItem('vt_page', String(page)); renderPage(); }
    });

    function createFilmCardElement(film) {
        const wrapper = document.createElement('div');
        wrapper.className = 'film-card';
        wrapper.dataset.id = film.id;
        wrapper.setAttribute('role', 'listitem');

        const isNew = film.is_new == 1;
        const poster = film.poster_url || 'img/placeholder.jpg';
        const title = film.title || 'Без названия';

        wrapper.innerHTML = `
            <div class="film-poster" aria-hidden="false">
                <div class="poster-skeleton" aria-hidden="true" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
                    <div class="spinner" aria-hidden="true"></div>
                </div>
                <img alt="${escapeHtml(title)}" src="${escapeHtml(poster)}">
                ${isNew ? '<span class="film-badge">Новинка</span>' : ''}
            </div>
            <div class="film-info">
                <h3 title="${escapeHtml(title)}">${escapeHtml(title)}</h3>
                <div class="film-meta">
                    <span><i class="fas fa-calendar-alt" aria-hidden="true"></i> ${escapeHtml(film.year || '—')}</span>
                    <span class="film-rating" aria-label="Рейтинг ${escapeHtml(String(film.rating || '—'))}"><i class="fas fa-star" aria-hidden="true"></i> ${escapeHtml(String(film.rating || '—'))}</span>
                </div>
                <p class="film-director"><i class="fas fa-user-tie" aria-hidden="true"></i> ${escapeHtml(film.director || '—')}</p>
                <p class="film-genre"><i class="fas fa-tag" aria-hidden="true"></i> ${escapeHtml(film.genres || '—')}</p>
                <div class="film-actions">
                    <button class="btn-small btn-watch" aria-label="Смотреть ${escapeHtml(title)}">Смотреть</button>
                    <button class="btn-small btn-favorite" aria-pressed="false" aria-label="Добавить в избранное">${favoriteIcon(false)}</button>
                </div>
            </div>
        `;

        const img = wrapper.querySelector('img');
        const skeleton = wrapper.querySelector('.poster-skeleton');

        img.addEventListener('load', () => {
            img.classList.add('loaded');
            if (skeleton) skeleton.remove();
        });
        img.addEventListener('error', () => {
            img.src = 'img/placeholder.jpg';
            if (skeleton) skeleton.remove();
            showToast({message: `Постер для "${film.title}" недоступен. Показывается заглушка.`, type: 'info', timeout: 4200});
        });

        const favBtn = wrapper.querySelector('.btn-favorite');
        favBtn.addEventListener('click', () => {
            const pressed = favBtn.getAttribute('aria-pressed') === 'true';
            favBtn.setAttribute('aria-pressed', String(!pressed));
            favBtn.classList.toggle('active', !pressed);
            favBtn.innerHTML = favoriteIcon(!pressed);
            toggleFavorite(film.id, !pressed, film.title);
        });

        const watchBtn = wrapper.querySelector('.btn-watch');
        watchBtn.addEventListener('click', () => {
            showToast({message: `Открываем страницу фильма "${film.title}".`, type: 'success'});
        });

        return wrapper;
    }

    function toggleFavorite(id, add, title) {
        try {
            const favs = JSON.parse(localStorage.getItem('vt_favs') || '[]');
            if (add) {
                if (!favs.includes(id)) favs.push(id);
                showToast({message: `"${title}" добавлен в избранное`, type: 'success'});
            } else {
                const idx = favs.indexOf(id);
                if (idx !== -1) favs.splice(idx, 1);
                showToast({message: `"${title}" удалён из избранного`, type: 'info'});
            }
            localStorage.setItem('vt_favs', JSON.stringify(favs));
        } catch (e) { console.warn(e); }
    }

    function restoreFavorites() {
        const favs = JSON.parse(localStorage.getItem('vt_favs') || '[]');
        document.querySelectorAll('.film-card').forEach(card => {
            const id = parseInt(card.dataset.id, 10);
            const favBtn = card.querySelector('.btn-favorite');
            if (favs.includes(id) && favBtn) {
                favBtn.setAttribute('aria-pressed', 'true');
                favBtn.classList.add('active');
                favBtn.innerHTML = favoriteIcon(true);
            }
        });
    }

    let searchTimer = null;
    function performSearchDebounced() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            page = 1;
            localStorage.setItem('vt_page', String(page));
            applyFiltersAndSort();
        }, 250);
    }

    searchInput.addEventListener('input', () => {
        performSearchDebounced();
    });
    searchBtn.addEventListener('click', () => { page = 1; applyFiltersAndSort(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    function setupDropdown(toggle, menu, onSelect, saved) {
        toggle.addEventListener('click', (e) => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!expanded));
            menu.style.display = expanded ? 'none' : 'block';
            menu.setAttribute('aria-hidden', String(expanded));
            if (!expanded) {
                const first = menu.querySelector('[role="menuitem"]');
                if (first) first.focus();
            }
        });

        menu.querySelectorAll('[role="menuitem"]').forEach(item => {
            item.tabIndex = 0;
            item.addEventListener('click', (ev) => {
                ev.preventDefault();
                onSelect(item);
                toggle.setAttribute('aria-expanded', 'false');
                menu.style.display = 'none';
                menu.setAttribute('aria-hidden', 'true');
            });
            item.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    item.click();
                }
            });
        });

        document.addEventListener('click', (ev) => {
            if (!toggle.contains(ev.target) && !menu.contains(ev.target)) {
                toggle.setAttribute('aria-expanded', 'false');
                menu.style.display = 'none';
                menu.setAttribute('aria-hidden', 'true');
            }
        });

        if (saved) onSelect(Array.from(menu.querySelectorAll('[role="menuitem"]')).find(i => {
            return (i.dataset.genre && i.dataset.genre === saved) || (i.dataset.sort && i.dataset.sort === saved);
        }) || menu.querySelector('[role="menuitem"]'));
    }

    setupDropdown(genreToggle, genreMenu, (item) => {
        const g = item.dataset.genre || 'all';
        currentGenre = g;
        genreLabel.textContent = `Фильтр: ${g === 'all' ? 'Все жанры' : g}`;
        localStorage.setItem('vt_genre', currentGenre);
        page = 1;
        localStorage.setItem('vt_page', String(page));
        applyFiltersAndSort();
    }, currentGenre);

    setupDropdown(sortToggle, sortMenu, (item) => {
        const s = item.dataset.sort || item.dataset.sort === undefined ? (item.dataset.sort || item.textContent.trim().toLowerCase()) : 'default';
        currentSort = item.dataset.sort || 'default';
        sortLabel.textContent = currentSort === 'default' ? 'Сортировка: По умолчанию' : `Сортировка: ${currentSort}`;
        localStorage.setItem('vt_sort', currentSort);
        page = 1;
        localStorage.setItem('vt_page', String(page));
        applyFiltersAndSort();
    }, currentSort);

    searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (!item) return;
        const id = item.dataset.id;
        const card = document.querySelector(`.film-card[data-id="${id}"]`);
        if (card) {
            card.scrollIntoView({behavior: 'smooth', block: 'center'});
            card.classList.add('focus-temp');
            setTimeout(() => card.classList.remove('focus-temp'), 2000);
        }
        searchResults.classList.remove('show');
        searchResults.setAttribute('aria-hidden', 'true');
    });

    document.querySelectorAll('.help-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showToast({message: 'Используйте фильтры и поиск для быстрого поиска фильмов. Клавиша "/" — фокус на поиске.', type: 'info', timeout: 7000});
        });
    });
});
