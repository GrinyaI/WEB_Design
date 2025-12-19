document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const genreName = urlParams.get('genre');

    const genreHeader = document.querySelector('.genre-header');
    const genreFilms = document.getElementById('genreFilms');
    const genreStatus = document.getElementById('genreStatus');
    const titleEl = document.getElementById('filmsByGenreTitle');
    const minRatingEl = document.getElementById('minRating');
    const yearSelect = document.getElementById('yearSelect');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const toastContainer = document.getElementById('toastContainer');
    const sortButtons = Array.from(document.querySelectorAll('.sort-film'));
    const viewButtons = Array.from(document.querySelectorAll('.view-btn'));
    const filmsFilterInfo = document.getElementById('filmsFilterInfo');

    let filmsData = [];
    let currentSort = localStorage.getItem('vt_films_genre_sort') || 'popular';
    let currentView = localStorage.getItem('vt_films_genre_view') || 'grid';
    let currentMinRating = localStorage.getItem('vt_films_min_rating') || '0';
    let currentYear = localStorage.getItem('vt_films_year') || '';

    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return String(text).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    function showToast({message, type = 'info', timeout = 4500}) {
        const el = document.createElement('div');
        el.className = 'toast ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : '');
        el.setAttribute('role', 'status');
        el.innerHTML = `
            <div class="toast-content">${escapeHtml(message)}</div>
            <button class="toast-close" aria-label="Закрыть уведомление">&times;</button>
        `;
        toastContainer.appendChild(el);
        const closeBtn = el.querySelector('.toast-close');
        const remove = () => el.remove();
        closeBtn.addEventListener('click', remove);
        if (timeout > 0) setTimeout(remove, timeout);
    }

    function renderSkeletons(count = 6) {
        genreFilms.innerHTML = Array.from({length: count}).map(() => `
            <div class="skeleton-card" role="listitem" aria-hidden="true">
                <div class="skeleton-poster" style="height:320px;border-radius:8px"></div>
                <div style="padding:10px">
                    <div class="skeleton-line" style="width:70%"></div>
                    <div class="skeleton-line" style="width:50%"></div>
                    <div class="skeleton-line" style="width:40%"></div>
                </div>
            </div>
        `).join('');
        genreFilms.setAttribute('aria-busy', 'true');
        genreStatus.textContent = `Загрузка фильмов жанра "${genreName || ''}"…`;
    }

    if (!genreName) {
        genreHeader.innerHTML = `<div class="error" role="alert">Жанр не указан. Вернитесь на страницу <a href="genres.html">Жанры</a> и выберите жанр.</div>`;
        genreStatus.textContent = '';
        genreFilms.innerHTML = '';
        showToast({message: 'Не указан жанр. Выберите жанр на странице «Жанры».', type: 'error'});
        return;
    }

    function createFilmCard(film) {
        const poster = film.poster_url || 'img/placeholder.jpg';
        const isNew = film.is_new == 1;
        const wrapper = document.createElement('div');
        wrapper.className = 'film-card';
        wrapper.setAttribute('data-id', film.id);
        wrapper.setAttribute('role', 'listitem');

        wrapper.innerHTML = `
            <div class="film-poster">
                <div class="poster-skeleton" aria-hidden="true" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
                    <div class="spinner" aria-hidden="true"></div>
                </div>
                <img alt="${escapeHtml(film.title)}" src="${escapeHtml(poster)}">
                ${isNew ? '<span class="film-badge">Новинка</span>' : ''}
            </div>
            <div class="film-info">
                <h3 title="${escapeHtml(film.title)}">${escapeHtml(film.title)}</h3>
                <div class="film-meta">
                    <span><i class="fas fa-calendar-alt" aria-hidden="true"></i> ${escapeHtml(film.year || '—')}</span>
                    <span class="film-rating" aria-label="Рейтинг ${escapeHtml(String(film.rating || '—'))}"><i class="fas fa-star" aria-hidden="true"></i> ${escapeHtml(String(film.rating || '—'))}</span>
                </div>
                <p class="film-director"><i class="fas fa-user-tie" aria-hidden="true"></i> ${escapeHtml(film.director || '—')}</p>
                <p class="film-genre"><i class="fas fa-tag" aria-hidden="true"></i> ${escapeHtml(film.genres || '')}</p>
                <div class="film-actions">
                    <button class="btn-small btn-watch" aria-label="Смотреть ${escapeHtml(film.title)}">Смотреть</button>
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
            showToast({message: `Постер для "${film.title}" не доступен. Показана заглушка.`, type: 'info', timeout: 4000});
        });

        const favBtn = wrapper.querySelector('.btn-favorite');
        favBtn.addEventListener('click', () => {
            const pressed = favBtn.getAttribute('aria-pressed') === 'true';
            favBtn.setAttribute('aria-pressed', String(!pressed));
            favBtn.classList.toggle('active', !pressed);
            favBtn.innerHTML = favoriteIcon(!pressed);
            const favs = JSON.parse(localStorage.getItem('vt_favs') || '[]');
            if (!pressed) {
                favs.push(film.id);
                showToast({message: `"${film.title}" добавлен в избранное`, type: 'success'});
            } else {
                const idx = favs.indexOf(film.id);
                if (idx !== -1) favs.splice(idx, 1);
                showToast({message: `"${film.title}" удалён из избранного`, type: 'info'});
            }
            localStorage.setItem('vt_favs', JSON.stringify(favs));
        });

        const watchBtn = wrapper.querySelector('.btn-watch');
        watchBtn.addEventListener('click', () => {
            showToast({message: `Открываем страницу фильма "${film.title}".`, type: 'success'});
        });

        return wrapper;
    }

    function favoriteIcon(active) {
        return active ? '<i class="fas fa-heart" aria-hidden="true"></i>' : '<i class="far fa-heart" aria-hidden="true"></i>';
    }

    function renderFilmsList(list) {
        genreFilms.innerHTML = '';
        if (!Array.isArray(list) || list.length === 0) {
            genreFilms.innerHTML = `<div class="error" role="status">Фильмы данного жанра не найдены. Попробуйте убрать фильтры или выбрать другой жанр.</div>`;
            genreStatus.textContent = '';
            return;
        }

        if (currentView === 'list') genreFilms.classList.add('list-view'); else genreFilms.classList.remove('list-view');

        const fragment = document.createDocumentFragment();
        list.forEach(f => fragment.appendChild(createFilmCard(f)));
        genreFilms.appendChild(fragment);

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

        genreStatus.textContent = `${list.length} ${pluralFilms(list.length)}. Отфильтровано: рейтинг ≥ ${currentMinRating || '—'}${currentYear ? ', год: ' + currentYear : ''}.`;
    }

    function pluralFilms(n) {
        n = Number(n || 0);
        if (n === 0) return 'фильмов';
        if (n === 1) return 'фильм';
        if (n > 1 && n < 5) return 'фильма';
        return 'фильмов';
    }

    function applyFiltersAndSort() {
        let result = filmsData.slice();

        const minR = Number(currentMinRating || 0);
        if (minR > 0) result = result.filter(f => Number(f.rating || 0) >= minR);

        if (currentYear) result = result.filter(f => String(f.year) === String(currentYear));

        if (currentSort === 'popular') {
            result.sort((a, b) => (Number(b.rating || 0) - Number(a.rating || 0)));
        } else if (currentSort === 'new') {
            result.sort((a, b) => (Number(b.is_new || 0) - Number(a.is_new || 0)) || (Number(b.year || 0) - Number(a.year || 0)));
        } else if (currentSort === 'year') {
            result.sort((a, b) => (Number(b.year || 0) - Number(a.year || 0)));
        }

        renderFilmsList(result);
        try { localStorage.setItem('vt_films_genre_sort', currentSort); } catch (e) {}
        try { localStorage.setItem('vt_films_genre_view', currentView); } catch (e) {}
        try { localStorage.setItem('vt_films_min_rating', currentMinRating); } catch (e) {}
        try { localStorage.setItem('vt_films_year', currentYear); } catch (e) {}
    }

    function fetchFilmsByGenre() {
        renderSkeletons(6);
        genreHeader.innerHTML = '';
        fetch(`api/films_by_genre.php?genre=${encodeURIComponent(genreName)}`, {cache: 'no-store'})
            .then(resp => {
                if (!resp.ok) throw new Error('Ошибка сети: ' + resp.status);
                return resp.json();
            })
            .then(data => {
                if (!data || !data.genre) throw new Error('Неверный формат ответа от сервера');
                renderGenreInfo(data.genre);
                filmsData = Array.isArray(data.films) ? data.films : [];
                populateYearSelect(filmsData);
                currentMinRating = localStorage.getItem('vt_films_min_rating') || currentMinRating;
                currentYear = localStorage.getItem('vt_films_year') || currentYear;
                minRatingEl.value = currentMinRating;
                yearSelect.value = currentYear || '';
                applyFiltersAndSort();
                genreFilms.setAttribute('aria-busy', 'false');
                genreStatus.textContent = '';
            })
            .catch(err => {
                console.error('Ошибка загрузки:', err);
                genreFilms.innerHTML = `
                    <div class="error" role="alert">
                        Не удалось загрузить фильмы жанра «${escapeHtml(genreName)}». Проверьте подключение.
                        <div style="margin-top:0.6rem">
                            <button class="btn-small retry-btn" type="button">Повторить</button>
                        </div>
                    </div>
                `;
                genreFilms.setAttribute('aria-busy', 'false');
                genreStatus.textContent = 'Ошибка при загрузке';
                const retry = document.querySelector('.retry-btn');
                if (retry) retry.addEventListener('click', fetchFilmsByGenre);
                showToast({message: 'Ошибка загрузки фильмов. Нажмите «Повторить» для повторной попытки.', type: 'error', timeout: 7000});
            });
    }

    function renderGenreInfo(genre) {
        const iconClass = genre.icon ? `fas ${escapeHtml(genre.icon)}` : 'fas fa-film';
        genreHeader.innerHTML = `
            <div class="genre-header" style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;">
                <div class="genre-icon large" aria-hidden="true" style="font-size:48px;color:var(--primary-color);">
                    <i class="${iconClass}"></i>
                </div>
                <div class="genre-info" style="max-width:900px;">
                    <h2 style="margin:0 0 8px 0;">${escapeHtml(genre.name)}</h2>
                    <p class="genre-description" style="margin:0 0 8px 0;color:var(--muted);">${escapeHtml(genre.bio || 'Описание жанра недоступно.')}</p>
                    <div class="genre-stats" style="display:flex;gap:12px;color:var(--muted);font-size:0.95rem;">
                        <span title="Количество фильмов"><i class="fas fa-film" aria-hidden="true"></i> ${escapeHtml(String(genre.film_count || 0))} ${pluralFilms(genre.film_count || 0)}</span>
                        <span title="Средний рейтинг"><i class="fas fa-star" aria-hidden="true"></i> Средний рейтинг: ${Number(genre.avg_rating || 0).toFixed(1)}</span>
                        <span title="Самый старый год"><i class="fas fa-calendar-alt" aria-hidden="true"></i> Самый старый: ${escapeHtml(String(genre.oldest_year || '—'))}</span>
                    </div>
                </div>
                <div style="margin-left:auto; display:flex; gap:8px; align-items:center;">
                    <button class="btn-small" id="subscribeGenre" aria-label="Подписаться на жанр">Подписаться</button>
                    <button class="btn-small" id="shareGenre" aria-label="Поделиться жанром">Поделиться</button>
                </div>
            </div>
        `;

        const subBtn = document.getElementById('subscribeGenre');
        if (subBtn) subBtn.addEventListener('click', () => {
            showToast({message: `Вы подписались на обновления жанра "${genre.name}".`, type: 'success'});
        });
        const shareBtn = document.getElementById('shareGenre');
        if (shareBtn) shareBtn.addEventListener('click', () => {
            const url = `${location.origin}${location.pathname}?genre=${encodeURIComponent(genre.name)}`;
            navigator.clipboard?.writeText(url).then(() => {
                showToast({message: 'Ссылка на жанр скопирована в буфер обмена', type: 'success'});
            }).catch(() => {
                showToast({message: 'Не удалось скопировать ссылку. Скопируйте вручную: ' + url, type: 'info', timeout: 8000});
            });
        });

        titleEl.textContent = `Фильмы — ${genre.name}`;
    }

    function populateYearSelect(list) {
        const years = Array.from(new Set(list.map(f => f.year).filter(Boolean))).sort((a,b)=>b-a);
        yearSelect.innerHTML = `<option value="">—</option>` + years.map(y => `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`).join('');
        if (currentYear) yearSelect.value = currentYear;
    }

    function initControls() {
        sortButtons.forEach(btn => {
            const key = btn.dataset.sort;
            const pressed = key === currentSort;
            btn.classList.toggle('active', pressed);
            btn.setAttribute('aria-pressed', String(pressed));
            btn.addEventListener('click', () => {
                currentSort = key;
                sortButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
                btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
                applyFiltersAndSort();
                showToast({message: `Сортировка: ${btn.textContent.trim()}`, type: 'success'});
            });
        });

        viewButtons.forEach(btn => {
            const view = btn.dataset.view;
            const pressed = view === currentView;
            btn.classList.toggle('active', pressed);
            btn.setAttribute('aria-pressed', String(pressed));
            btn.addEventListener('click', () => {
                currentView = view;
                viewButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
                btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
                applyFiltersAndSort();
            });
        });

        minRatingEl.value = currentMinRating || '0';
        minRatingEl.addEventListener('change', () => {
            currentMinRating = minRatingEl.value;
            applyFiltersAndSort();
        });

        yearSelect.addEventListener('change', () => {
            currentYear = yearSelect.value;
            applyFiltersAndSort();
        });

        clearFiltersBtn.addEventListener('click', () => {
            currentMinRating = '0';
            currentYear = '';
            minRatingEl.value = '0';
            yearSelect.value = '';
            applyFiltersAndSort();
            showToast({message: 'Фильтры сброшены', type: 'info'});
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) { searchInput.focus(); searchInput.select(); }
            }
        });
    }

    initControls();
    fetchFilmsByGenre();
});
