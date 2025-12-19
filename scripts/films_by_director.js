document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const directorId = urlParams.get('director');

    const directorDataEl = document.getElementById('directorData');
    const filmsContainer = document.getElementById('directorFilms');
    const sortButtons = document.querySelectorAll('.sort-controls button[data-sort]');
    const viewGridBtn = document.getElementById('viewGrid');
    const viewListBtn = document.getElementById('viewList');
    const toastContainer = document.getElementById('toastContainer');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!directorId) {
        directorDataEl.innerHTML = '<p>Режиссер не найден</p>';
        return;
    }

    function showToast({message, type = 'info', timeout = 4500}) {
        const el = document.createElement('div');
        el.className = 'toast ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : '');
        el.setAttribute('role', 'status');
        el.innerHTML = `<div class="toast-content">${escapeHtml(message)}</div><button class="toast-close" aria-label="Закрыть">&times;</button>`;
        toastContainer.appendChild(el);
        const closeBtn = el.querySelector('.toast-close');
        const remove = () => el.remove();
        closeBtn.addEventListener('click', remove);
        if (timeout > 0) setTimeout(remove, timeout);
    }
    function escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    function renderSkeletons(count = 6) {
        filmsContainer.innerHTML = Array.from({length: count}).map(() => `
            <div class="skeleton-card" aria-hidden="true">
                <div class="skeleton-poster"></div>
                <div style="padding:10px">
                    <div class="skeleton-line" style="width:70%"></div>
                    <div class="skeleton-line" style="width:50%"></div>
                    <div class="skeleton-line" style="width:40%"></div>
                </div>
            </div>
        `).join('');
    }

    renderSkeletons(6);

    directorDataEl.setAttribute('aria-busy', 'true');
    filmsContainer.setAttribute('aria-busy', 'true');

    fetch(`api/films_by_director.php?director=${encodeURIComponent(directorId)}`)
        .then(resp => {
            if (!resp.ok) throw new Error('Ошибка сети при получении данных.');
            return resp.json();
        })
        .then(payload => {
            const director = payload.director || null;
            const films = Array.isArray(payload.films) ? payload.films : [];

            renderDirector(director);
            renderFilms(films);
            initSorting(films);
            restoreViewPreference();
            directorDataEl.setAttribute('aria-busy', 'false');
            filmsContainer.setAttribute('aria-busy', 'false');
        })
        .catch(err => {
            console.error(err);
            directorDataEl.innerHTML = `<div class="error">Не удалось загрузить данные режиссёра. Пожалуйста, повторите попытку позже.</div>`;
            filmsContainer.innerHTML = '';
            directorDataEl.setAttribute('aria-busy', 'false');
            filmsContainer.setAttribute('aria-busy', 'false');
            showToast({message: 'Ошибка загрузки данных. Проверьте соединение или попробуйте позже.', type: 'error', timeout: 7000});
        });

    function renderDirector(d) {
        if (!d) {
            directorDataEl.innerHTML = '<p>Режиссер не найден</p>';
            return;
        }

        const name = escapeHtml(d.title || '—');
        const poster = escapeHtml(d.poster || 'img/placeholder.jpg');
        const birthday = escapeHtml(d.birthday || '—');
        const filmsCount = escapeHtml(String(d.filmsCount || '0'));
        const rating = escapeHtml(String(d.rating || '—'));
        const bio = escapeHtml(d.bio || 'Биография отсутствует.');

        directorDataEl.innerHTML = `
            <div class="genre-header" style="display:flex;gap:1rem;align-items:flex-start;padding:1rem;margin-top: 0;width: 100%;">
                <div class="director-photo large" style="width:200px; height:250px; overflow:hidden; border-radius:8px;">
                    <div style="position:relative; width:200px; height:250px; background:#eef3fb;">
                        <div class="spinner" style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);"></div>
                        <img src="${poster}" alt="Фото ${name}" style="width:100%; height:100%; object-fit:cover; display:none;" onload="this.style.display='block'; this.previousElementSibling && this.previousElementSibling.remove();" onerror="this.src='img/placeholder.jpg'; this.previousElementSibling && this.previousElementSibling.remove();">
                    </div>
                </div>
                <div class="director-details">
                    <h2>${name}</h2>
                    <div class="director-meta" style="display:flex; gap:1rem; margin-top:0.5rem;">
                        <span title="Дата рождения"><i class="fas fa-birthday-cake" aria-hidden="true"></i> ${birthday}</span>
                        <span title="Количество фильмов"><i class="fas fa-film" aria-hidden="true"></i> ${filmsCount} фильмов</span>
                        <span title="Средний рейтинг"><i class="fas fa-star" aria-hidden="true"></i> Рейтинг: ${rating}</span>
                    </div>
                    <p class="director-bio" style="margin-top:0.9rem;">${bio}</p>
                </div>
            </div>
        `;
    }

    function createFilmCard(film) {
        const card = document.createElement('div');
        card.className = 'film-card';
        card.setAttribute('data-id', film.id);
        card.setAttribute('role', 'listitem');

        const posterUrl = film.poster || 'img/placeholder.jpg';
        const isNew = film.is_new == 1;
        const title = escapeHtml(film.title || '—');
        const year = escapeHtml(String(film.year || '—'));
        const rating = escapeHtml(String(film.rating || '—'));
        const genre = escapeHtml(film.genre || '—');

        card.innerHTML = `
            <div class="film-poster" aria-hidden="false">
                <div class="poster-skeleton" aria-hidden="true" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
                    <div class="spinner" aria-hidden="true"></div>
                </div>
                <img alt="${title}" src="${posterUrl}">
                ${isNew ? '<span class="film-badge">Новинка</span>' : ''}
            </div>
            <div class="film-info">
                <h3 title="${title}">${title}</h3>
                <div class="film-meta">
                    <span><i class="fas fa-calendar-alt" aria-hidden="true"></i> ${year}</span>
                    <span class="film-rating" aria-label="Рейтинг ${rating}"><i class="fas fa-star" aria-hidden="true"></i> ${rating}</span>
                </div>
                <p class="film-genre"><i class="fas fa-tag" aria-hidden="true"></i> ${genre}</p>
                <div class="film-actions">
                    <button class="btn-small btn-watch" aria-label="Смотреть ${title}">Смотреть</button>
                    <button class="btn-small btn-favorite" aria-pressed="false" aria-label="Добавить ${title} в избранное">${favoriteIcon(false)}</button>
                </div>
            </div>
        `;

        const img = card.querySelector('img');
        const skeleton = card.querySelector('.poster-skeleton');

        img.addEventListener('load', () => {
            img.classList.add('loaded');
            if (skeleton) skeleton.remove();
        });
        img.addEventListener('error', () => {
            img.src = 'img/placeholder.jpg';
            if (skeleton) skeleton.remove();
            showToast({message: `Постер для "${film.title}" недоступен. Показана заглушка.`, type: 'info'});
        });

        const favBtn = card.querySelector('.btn-favorite');
        favBtn.addEventListener('click', () => {
            const pressed = favBtn.getAttribute('aria-pressed') === 'true';
            favBtn.setAttribute('aria-pressed', String(!pressed));
            favBtn.classList.toggle('active', !pressed);
            favBtn.innerHTML = favoriteIcon(!pressed);
            const favs = JSON.parse(localStorage.getItem('vt_favs') || '[]');
            const id = film.id;
            if (!pressed) {
                if (!favs.includes(id)) favs.push(id);
                showToast({message: `"${film.title}" добавлен в избранное.`, type: 'success'});
            } else {
                const idx = favs.indexOf(id);
                if (idx !== -1) favs.splice(idx, 1);
                showToast({message: `"${film.title}" удалён из избранного.`, type: 'info'});
            }
            localStorage.setItem('vt_favs', JSON.stringify(favs));
        });

        const watchBtn = card.querySelector('.btn-watch');
        watchBtn.addEventListener('click', () => {
            showToast({message: `Открытие фильма "${film.title}"...`, type: 'success'});
        });

        return card;
    }

    function favoriteIcon(active) {
        return active ? '<i class="fas fa-heart" aria-hidden="true"></i>' : '<i class="far fa-heart" aria-hidden="true"></i>';
    }

    function renderFilms(films) {
        filmsContainer.innerHTML = '';
        if (!Array.isArray(films) || films.length === 0) {
            filmsContainer.innerHTML = '<div class="error">Фильмы этого режиссёра не найдены.</div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        films.forEach(f => fragment.appendChild(createFilmCard(f)));
        filmsContainer.appendChild(fragment);

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

    function initSorting(originalFilms) {
        const storedKey = `vt_director_sort_${directorId}`;
        let currentSort = localStorage.getItem(storedKey) || 'year';

        applySort(currentSort, originalFilms);

        sortButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sortType = e.currentTarget.dataset.sort;
                applySort(sortType, originalFilms);
                sortButtons.forEach(b => {
                    const pressed = b.dataset.sort === sortType;
                    b.classList.toggle('active', pressed);
                    b.setAttribute('aria-pressed', String(pressed));
                });
                localStorage.setItem(storedKey, sortType);
            });
        });
    }

    function applySort(type, films) {
        let sorted = [...films];
        switch (type) {
            case 'year':
                sorted.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
                break;
            case 'rating':
                sorted.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
                break;
            case 'title':
                sorted.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
                break;
            default:
                break;
        }
        renderFilms(sorted);
    }

    function restoreViewPreference() {
        const key = `vt_view_director_${directorId}`;
        const view = localStorage.getItem(key) || 'grid';
        setView(view);
        viewGridBtn.addEventListener('click', () => { setView('grid'); localStorage.setItem(key, 'grid'); });
        viewListBtn.addEventListener('click', () => { setView('list'); localStorage.setItem(key, 'list'); });
    }
    function setView(mode) {
        if (mode === 'list') {
            filmsContainer.classList.add('list-view');
            filmsContainer.classList.remove('film-grid');
            viewListBtn.classList.add('active'); viewGridBtn.classList.remove('active');
        } else {
            filmsContainer.classList.remove('list-view');
            filmsContainer.classList.add('film-grid');
            viewGridBtn.classList.add('active'); viewListBtn.classList.remove('active');
        }
    }

    function performSearch(query) {
        if (!query) {
            searchResults.classList.remove('show');
            searchResults.setAttribute('aria-hidden', 'true');
            return;
        }
        searchResults.innerHTML = '<div class="search-result-item">Поиск… <span class="spinner" aria-hidden="true" style="margin-left:8px"></span></div>';
        searchResults.classList.add('show');
        searchResults.setAttribute('aria-hidden', 'false');

       setTimeout(() => {
            const normalized = query.trim().toLowerCase();
            const cards = Array.from(document.querySelectorAll('.film-card'));
            const matches = cards.filter(c => {
                const title = (c.querySelector('h3')?.textContent || '').toLowerCase();
                const year = (c.querySelector('.film-meta span')?.textContent || '').toLowerCase();
                return title.includes(normalized) || year.includes(normalized);
            });
            if (matches.length === 0) {
                searchResults.innerHTML = `<div class="search-result-item" role="option">Ничего не найдено по запросу «${escapeHtml(query)}».</div>`;
            } else {
                searchResults.innerHTML = matches.slice(0, 10).map(c => {
                    const id = c.dataset.id;
                    const title = c.querySelector('h3')?.textContent || '';
                    return `<div class="search-result-item" role="option" data-id="${id}" tabindex="0"><strong>${escapeHtml(title)}</strong></div>`;
                }).join('');
            }
        }, 180);
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => performSearch(searchInput.value));
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); performSearch(searchInput.value); }
            if (e.key === '/' && document.activeElement !== searchInput) {
                e.preventDefault(); searchInput.focus(); searchInput.select();
            }
        });
    }
    if (searchResults) {
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
        });
    }

    (function addTempStyle(){
        const s = document.createElement('style');
        s.innerHTML = `.film-card.focus-temp { box-shadow: 0 0 0 4px rgba(246,185,59,0.12); transform: translateY(-4px); } .list-view .film-card { display:flex; gap:1rem; }`;
        document.head.appendChild(s);
    })();
});
