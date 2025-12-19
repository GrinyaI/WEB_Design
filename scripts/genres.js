document.addEventListener('DOMContentLoaded', function () {
    const genresContainer = document.getElementById('genresContainer');
    const genresStatus = document.getElementById('genresStatus');
    const toastContainer = document.getElementById('toastContainer');

    const sortButtons = Array.from(document.querySelectorAll('.sort-btn'));
    const viewButtons = Array.from(document.querySelectorAll('.view-btn'));
    const helpBtn = document.querySelector('.help-btn');

    let genresData = [];
    let currentSort = localStorage.getItem('vt_genres_sort') || 'name';
    let currentView = localStorage.getItem('vt_genres_view') || 'grid';

    function escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/[&<>"']/g, (m) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
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
        genresContainer.innerHTML = Array.from({length: count}).map(() => `
            <div class="genre-card skeleton-card" role="listitem" aria-hidden="true">
                <div class="skeleton-poster" style="height:120px;border-radius:8px"></div>
                <div style="padding:12px;">
                    <div class="skeleton-line" style="width:60%"></div>
                    <div class="skeleton-line" style="width:40%"></div>
                </div>
            </div>
        `).join('');
        genresContainer.setAttribute('aria-busy', 'true');
        genresStatus.textContent = 'Загрузка жанров…';
    }

    function fetchGenres() {
        renderSkeletons();
        fetch('api/genres.php', {cache: 'no-store'})
            .then(response => {
                if (!response.ok) throw new Error('Ошибка сети: ' + response.status);
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data)) throw new Error('Неверный формат данных');
                genresData = data.slice();
                applySortAndRender();
                genresContainer.setAttribute('aria-busy', 'false');
                genresStatus.textContent = '';
            })
            .catch(error => {
                console.error('Ошибка загрузки жанров:', error);
                genresContainer.innerHTML = `
                    <div class="error" role="alert">
                        Не удалось загрузить жанры. Проверьте подключение или повторите попытку.
                        <div style="margin-top:0.6rem">
                            <button class="btn-small retry-btn" type="button">Повторить</button>
                        </div>
                    </div>
                `;
                genresContainer.setAttribute('aria-busy', 'false');
                genresStatus.textContent = 'Ошибка при загрузке';
                const retry = document.querySelector('.retry-btn');
                if (retry) retry.addEventListener('click', fetchGenres);
                showToast({
                    message: 'Ошибка загрузки жанров. Нажмите «Повторить» для повторной попытки.',
                    type: 'error',
                    timeout: 7000
                });
            });
    }

    function makeGenreCard(genre) {
        const iconClass = genre.icon ? `fas ${escapeHtml(genre.icon)}` : 'fas fa-film';
        const countText = getFilmCountText(genre.film_count);
        const popularityPercent = Math.round(((genre.film_count || 0) / (maxFilms() || 1)) * 100);
        return `
            <div class="genre-card" role="listitem" data-genre="${escapeHtml(genre.name)}" data-popularity="${popularityPercent}">
                <div class="genre-icon" aria-hidden="true">
                    <i class="${iconClass}" onerror=""></i>
                </div>
                <h3 title="${escapeHtml(genre.name)}">${escapeHtml(genre.name)}</h3>
                <p class="film-count">${escapeHtml(countText)}</p>
                <div class="genre-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${popularityPercent}" aria-label="Популярность жанра ${escapeHtml(genre.name)}">
                    <div class="progress-bar" style="width: ${popularityPercent}%"></div>
                </div>
                <div style="margin-top:10px; display:flex; gap:8px;">
                    <button class="btn-small btn-view" data-genre="${escapeHtml(genre.name)}" aria-label="Открыть фильмы жанра ${escapeHtml(genre.name)}">Смотреть все</button>
                    <button class="btn-small btn-details" data-genre="${escapeHtml(genre.name)}" aria-label="Информация о жанре ${escapeHtml(genre.name)}">Инфо</button>
                </div>
            </div>
        `;
    }

    function makeGenreListItem(genre) {
        const popularityPercent = Math.round(((genre.film_count || 0) / (maxFilms() || 1)) * 100);
        return `
            <div class="genre-card genre-list-item" role="listitem" data-genre="${escapeHtml(genre.name)}" data-popularity="${popularityPercent}" style="display:flex;align-items:center;gap:12px;padding:12px;">
                <div style="width:72px;flex:0 0 72px;text-align:center;">
                    <div class="genre-icon" aria-hidden="true">
                        <i class="${genre.icon ? 'fas ' + escapeHtml(genre.icon) : 'fas fa-film'}"></i>
                    </div>
                </div>
                <div style="flex:1;">
                    <h3 style="margin:0">${escapeHtml(genre.name)}</h3>
                    <div style="color:var(--muted);font-size:0.95rem;margin-top:4px;">${escapeHtml(getFilmCountText(genre.film_count))} • популярность ${popularityPercent}%</div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn-small btn-view" data-genre="${escapeHtml(genre.name)}" aria-label="Открыть фильмы жанра ${escapeHtml(genre.name)}">Смотреть</button>
                    <button class="btn-small btn-details" data-genre="${escapeHtml(genre.name)}" aria-label="Информация о жанре ${escapeHtml(genre.name)}">Инфо</button>
                </div>
            </div>
        `;
    }

    function maxFilms() {
        return genresData.reduce((max, g) => Math.max(max, Number(g.film_count || 0)), 0);
    }

    function getFilmCountText(count) {
        count = Number(count || 0);
        if (count === 0) return 'Нет фильмов';
        if (count === 1) return '1 фильм';
        if (count > 1 && count < 5) return `${count} фильма`;
        return `${count} фильмов`;
    }

    function renderGenresList(sortedList) {
        if (!Array.isArray(sortedList) || sortedList.length === 0) {
            genresContainer.innerHTML = '<div class="error">Жанры не найдены.</div>';
            return;
        }
        if (currentView === 'grid') {
            genresContainer.innerHTML = sortedList.map(g => makeGenreCard(g)).join('');
        } else {
            genresContainer.innerHTML = sortedList.map(g => makeGenreListItem(g)).join('');
        }

        genresContainer.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const genre = btn.dataset.genre;
                showToast({message: `Открываем все фильмы жанра: ${genre}`, type: 'info'});
                window.location.href = `films_by_genre.html?genre=${encodeURIComponent(genre)}`;
            });
        });

        genresContainer.querySelectorAll('.btn-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const genre = btn.dataset.genre;
                showToast({
                    message: `Жанр: ${genre}. Показывается ${getFilmCountText(genresData.find(g => g.name === genre)?.film_count || 0)}.`,
                    type: 'info'
                });
            });
        });
    }

    function applySortAndRender() {
        const sorted = genresData.slice();
        if (currentSort === 'name') {
            sorted.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        } else if (currentSort === 'popularity') {
            sorted.sort((a, b) => (Number(b.film_count || 0) - Number(a.film_count || 0)));
        }
        renderGenresList(sorted);
        try {
            localStorage.setItem('vt_genres_sort', currentSort);
        } catch (e) {
        }
        try {
            localStorage.setItem('vt_genres_view', currentView);
        } catch (e) {
        }
    }

    function initControls() {
        sortButtons.forEach(btn => {
            const key = btn.dataset.sort;
            const pressed = key === currentSort;
            btn.classList.toggle('active', pressed);
            btn.setAttribute('aria-pressed', String(pressed));
            btn.addEventListener('click', () => {
                currentSort = key;
                sortButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
                applySortAndRender();
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
                viewButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
                genresContainer.classList.toggle('list-view', currentView === 'list');
                applySortAndRender();
            });
        });

        if (helpBtn) helpBtn.addEventListener('click', () => {
            showToast({
                message: 'На этой странице вы можете сортировать жанры, переключать вид (карточки/список) и перейти к списку фильмов по жанру.',
                type: 'info',
                timeout: 8000
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        });
    }

    initControls();
    fetchGenres();
});
