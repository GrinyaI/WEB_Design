document.addEventListener('DOMContentLoaded', function () {
    const directorsContainer = document.getElementById('allDirectors');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    const toastContainer = document.getElementById('toastContainer');
    const sortButtons = Array.from(document.querySelectorAll('.sort-btn'));
    const viewGridBtn = document.getElementById('viewGrid');
    const viewListBtn = document.getElementById('viewList');
    const helpBtn = document.getElementById('helpDirectors');

    let directorsData = [];
    let currentSort = localStorage.getItem('vt_directors_sort') || 'name';
    let currentView = localStorage.getItem('vt_directors_view') || 'grid';
    let debounceTimer = null;

    function showToast({message, type = 'info', timeout = 4500}) {
        const el = document.createElement('div');
        el.className = 'toast ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : '');
        el.setAttribute('role', 'status');
        el.innerHTML = `<div class="toast-content">${escapeHtml(message)}</div><button class="toast-close" aria-label="Закрыть уведомление">&times;</button>`;
        toastContainer.appendChild(el);
        el.querySelector('.toast-close').addEventListener('click', () => el.remove());
        if (timeout > 0) setTimeout(() => el.remove(), timeout);
    }
    function escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    function renderSkeletons(count = 6) {
        directorsContainer.innerHTML = Array.from({length: count}).map(() => `
            <div class="skeleton-card">
                <div class="skeleton-poster" style="height:160px;"></div>
                <div style="padding:10px">
                    <div class="skeleton-line" style="width:60%"></div>
                    <div class="skeleton-line" style="width:40%"></div>
                    <div class="skeleton-line" style="width:80%"></div>
                </div>
            </div>
        `).join('');
        directorsContainer.setAttribute('aria-busy', 'true');
    }

    renderSkeletons();

    fetch('api/directors.php')
        .then(res => {
            if (!res.ok) throw new Error('Ошибка сети при получении режиссёров');
            return res.json();
        })
        .then(data => {
            directorsData = Array.isArray(data) ? data : [];
            if (directorsData.length === 0) {
                directorsContainer.innerHTML = `<div class="error">Режиссёры не найдены. Попробуйте позже или обновите страницу.</div>`;
                directorsContainer.setAttribute('aria-busy', 'false');
                return;
            }
            applySort(currentSort);
            applyView(currentView);
            renderDirectors(directorsData);
            directorsContainer.setAttribute('aria-busy', 'false');
        })
        .catch(err => {
            console.error('Ошибка загрузки режиссеров:', err);
            directorsContainer.innerHTML = `<div class="error">Не удалось загрузить список режиссёров. Проверьте соединение или обратитесь в поддержку.</div>`;
            directorsContainer.setAttribute('aria-busy', 'false');
            showToast({message: 'Ошибка загрузки режиссёров. Попробуйте обновить страницу.', type: 'error', timeout: 8000});
        });

    function createDirectorCard(director) {
        const wrap = document.createElement('article');
        wrap.className = 'director-card';
        wrap.dataset.id = director.id;
        wrap.setAttribute('role', 'listitem');

        wrap.innerHTML = `
            <div class="director-photo" aria-hidden="false">
                <div class="poster-skeleton" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
                    <div class="spinner" aria-hidden="true"></div>
                </div>
                <img alt="${escapeHtml(director.title)}" src="${escapeHtml(director.poster || 'img/placeholder.jpg')}" loading="lazy">
            </div>
            <div class="director-info">
                <h3 title="${escapeHtml(director.title)}">${escapeHtml(director.title)}</h3>
                <div class="director-meta">
                    <span title="Количество фильмов"><i class="fas fa-film" aria-hidden="true"></i> ${escapeHtml(String(director.films || 0))} фильмов</span>
                    <span title="Средний рейтинг"><i class="fas fa-star" aria-hidden="true"></i> ${escapeHtml(String(director.rating ?? 'N/A'))}</span>
                </div>
                <p class="director-bio">${escapeHtml(director.bio || 'Нет информации')}</p>
                <div class="director-genres" aria-hidden="false"></div>
                <div class="director-actions" style="margin-top:10px">
                    <button class="btn-small btn-view-films" data-director-id="${director.id}" aria-label="Просмотреть фильмы ${escapeHtml(director.title)}">Фильмы режиссера</button>
                    <button class="btn-small btn-favorite" aria-pressed="false" aria-label="Добавить в избранное">${favoriteIcon(false)}</button>
                </div>
            </div>
        `;

        const genresContainer = wrap.querySelector('.director-genres');
        const genresData = director.genres ? (Array.isArray(director.genres) ? director.genres : String(director.genres).split(',').map(s => s.trim())) : [];
        if (genresData.length === 0) {
            genresContainer.innerHTML = `<span class="genre-tag">Нет данных</span>`;
        } else {
            genresContainer.innerHTML = genresData.slice(0, 5).map(g => `<span class="genre-tag" title="${escapeHtml(g)}">${escapeHtml(g)}</span>`).join('');
        }

        const img = wrap.querySelector('img');
        const skeleton = wrap.querySelector('.poster-skeleton');
        img.addEventListener('load', () => {
            img.classList.add('loaded');
            if (skeleton) skeleton.remove();
        });
        img.addEventListener('error', () => {
            img.src = 'img/placeholder.jpg';
            if (skeleton) skeleton.remove();
            showToast({message: `Постер режиссёра "${director.title}" недоступен — используется заглушка.`, type: 'info', timeout: 4200});
        });

        wrap.querySelector('.btn-view-films').addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.directorId;
            showToast({message: `Открывается список фильмов режиссёра "${director.title}"`, type: 'success', timeout: 2000});
            window.location.href = `films_by_director.html?director=${encodeURIComponent(id)}`;
        });

        const favBtn = wrap.querySelector('.btn-favorite');
        favBtn.addEventListener('click', () => {
            const pressed = favBtn.getAttribute('aria-pressed') === 'true';
            favBtn.setAttribute('aria-pressed', String(!pressed));
            favBtn.classList.toggle('active', !pressed);
            favBtn.innerHTML = favoriteIcon(!pressed);
            const favs = JSON.parse(localStorage.getItem('vt_favs') || '[]');
            if (!pressed) {
                favs.push(director.id);
                showToast({message: `"${director.title}" добавлен в избранное`, type: 'success'});
            } else {
                const idx = favs.indexOf(director.id);
                if (idx !== -1) favs.splice(idx, 1);
                showToast({message: `"${director.title}" удалён из избранного`, type: 'info'});
            }
            localStorage.setItem('vt_favs', JSON.stringify(favs));
        });

        return wrap;
    }

    function favoriteIcon(active) {
        return active ? '<i class="fas fa-heart" aria-hidden="true"></i>' : '<i class="far fa-heart" aria-hidden="true"></i>';
    }

    function renderDirectors(list) {
        directorsContainer.innerHTML = '';
        if (!Array.isArray(list) || list.length === 0) {
            directorsContainer.innerHTML = `<div class="error">По заданным критериям режиссёры не найдены. Попробуйте изменить фильтр или запрос.</div>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        list.forEach(d => fragment.appendChild(createDirectorCard(d)));
        directorsContainer.appendChild(fragment);
        const favs = JSON.parse(localStorage.getItem('vt_favs') || '[]');
        document.querySelectorAll('.director-card').forEach(card => {
            const id = parseInt(card.dataset.id, 10);
            const favBtn = card.querySelector('.btn-favorite');
            if (favs.includes(id) && favBtn) {
                favBtn.setAttribute('aria-pressed', 'true');
                favBtn.classList.add('active');
                favBtn.innerHTML = favoriteIcon(true);
            }
        });
    }

    function applySort(sortKey) {
        currentSort = sortKey;
        localStorage.setItem('vt_directors_sort', currentSort);

        sortButtons.forEach(btn => {
            const isActive = btn.dataset.sort === sortKey;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));
        });

        if (!Array.isArray(directorsData)) return;

        if (sortKey === 'name') {
            directorsData.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'ru'));
        } else if (sortKey === 'films') {
            directorsData.sort((a, b) => (b.films || 0) - (a.films || 0));
        } else if (sortKey === 'rating') {
            directorsData.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }
    }

    function applyView(view) {
        currentView = view;
        localStorage.setItem('vt_directors_view', currentView);
        if (view === 'list') {
            document.body.classList.add('view-list');
            viewGridBtn.setAttribute('aria-pressed', 'false');
            viewListBtn.setAttribute('aria-pressed', 'true');
            viewGridBtn.classList.remove('active');
            viewListBtn.classList.add('active');
        } else {
            document.body.classList.remove('view-list');
            viewGridBtn.setAttribute('aria-pressed', 'true');
            viewListBtn.setAttribute('aria-pressed', 'false');
            viewGridBtn.classList.add('active');
            viewListBtn.classList.remove('active');
        }
    }

    sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.sort;
            applySort(key);
            renderDirectors(directorsData);
        });
    });

    viewGridBtn.addEventListener('click', () => { applyView('grid'); });
    viewListBtn.addEventListener('click', () => { applyView('list'); });

    helpBtn.addEventListener('click', () => {
        showToast({message: 'Подсказка: используйте сортировку и поиск для быстрого доступа. Клавиши: "/" — поиск; 1/2/3 — сортировка.', type: 'info', timeout: 7000});
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
        if (['1','2','3'].includes(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
            if (e.key === '1') sortButtons[0].click();
            if (e.key === '2') sortButtons[1].click();
            if (e.key === '3') sortButtons[2].click();
        }
    });

    function performSearch(query) {
        if (!query) {
            renderDirectors(directorsData);
            searchResults.classList.remove('show');
            searchResults.setAttribute('aria-hidden', 'true');
            return;
        }
        searchResults.innerHTML = '<div class="search-result-item">Поиск… <span class="spinner" aria-hidden="true" style="margin-left:8px"></span></div>';
        searchResults.classList.add('show');
        searchResults.setAttribute('aria-hidden', 'false');

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const q = query.trim().toLowerCase();
            const results = directorsData.filter(d => (d.title || '').toLowerCase().includes(q) || (d.bio || '').toLowerCase().includes(q) || (String(d.genres || '').toLowerCase().includes(q)));
            if (results.length === 0) {
                searchResults.innerHTML = `<div class="search-result-item">Ничего не найдено по запросу «${escapeHtml(query)}». Попробуйте другое слово.</div>`;
            } else {
                searchResults.innerHTML = results.slice(0, 8).map(r => `<div class="search-result-item" data-id="${r.id}" tabindex="0"><strong>${escapeHtml(r.title)}</strong><div class="search-genres">${escapeHtml(String(r.films || 0))} фильмов • ${escapeHtml(String(r.rating || '—'))}</div></div>`).join('');
            }
        }, 220);

        try { localStorage.setItem('vt_directors_last_search', query); } catch (e) {}
    }

    searchBtn.addEventListener('click', () => performSearch(searchInput.value));
    searchInput.addEventListener('input', () => performSearch(searchInput.value));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(searchInput.value);
        }
    });

    searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (!item) return;
        const id = item.dataset.id;
        const target = document.querySelector(`.director-card[data-id="${id}"]`);
        if (target) {
            target.scrollIntoView({behavior: 'smooth', block: 'center'});
            target.classList.add('focus-temp');
            setTimeout(() => target.classList.remove('focus-temp'), 2000);
        }
        searchResults.classList.remove('show');
        searchResults.setAttribute('aria-hidden', 'true');
    });

    const lastSearch = localStorage.getItem('vt_directors_last_search');
    if (lastSearch) {
        searchInput.value = lastSearch;
        performSearch(lastSearch);
    }
    applySort(currentSort);
    applyView(currentView);
});
