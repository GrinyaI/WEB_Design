document.addEventListener('DOMContentLoaded', function () {
    const popularFilmsContainer = document.getElementById('popularFilms');
    const newFilmsContainer = document.getElementById('newFilms');
    const randomFilmBtn = document.getElementById('randomFilmBtn');
    const topFilmsBtn = document.getElementById('topFilmsBtn');
    const sliderPrev = document.querySelector('.slider-prev');
    const sliderNext = document.querySelector('.slider-next');
    const toastContainer = document.getElementById('toastContainer');

    let filmsData = [];
    let isFetching = false;

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

    window.showToast = showToast;

    function escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    function renderSkeletons(container, count = 4) {
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

    renderSkeletons(popularFilmsContainer, 4);
    renderSkeletons(newFilmsContainer, 6);

    function setBusy(b) {
        isFetching = b;
        document.querySelectorAll('main [aria-busy]').forEach(el => el.setAttribute('aria-busy', b.toString()));
    }

    setBusy(true);
    fetch('api/index.php')
        .then(response => {
            if (!response.ok) throw new Error('Ошибка сети при получении данных');
            return response.json();
        })
        .then(data => {
            filmsData = [...(data.popular || []), ...(data.new || [])];
            renderFilms(data.popular || [], data.new || []);
            initSlider();
            setBusy(false);
        })
        .catch(err => {
            console.error(err);
            showToast({message: 'Не удалось загрузить список фильмов. Попробуйте обновить страницу или проверьте соединение.', type: 'error', timeout: 7000});
            popularFilmsContainer.innerHTML = '<div class="error">Сервис временно недоступен. Попробуйте позже.</div>';
            newFilmsContainer.innerHTML = '';
            setBusy(false);
        });

    function createFilmCard(film) {
        const genres = film.genres || 'Нет данных';
        const isNew = film.is_new == 1;
        const poster = film.poster_url || 'img/placeholder.jpg';

        const wrapper = document.createElement('div');
        wrapper.className = 'film-card';
        wrapper.setAttribute('data-id', film.id);
        wrapper.setAttribute('role', 'listitem');

        wrapper.innerHTML = `
            <div class="film-poster" aria-hidden="false">
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
                <p class="film-genre"><i class="fas fa-tag" aria-hidden="true"></i> ${escapeHtml(genres)}</p>
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
            showToast({message: `Постер для "${film.title}" не доступен. Отображается заглушка.`, type: 'info', timeout: 4200});
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

    function renderFilms(popular = [], newFilms = []) {
        popularFilmsContainer.innerHTML = '';
        newFilmsContainer.innerHTML = '';

        if (popular.length === 0) {
            popularFilmsContainer.innerHTML = '<div class="error">Популярные фильмы временно отсутствуют.</div>';
        } else {
            const frag = document.createDocumentFragment();
            popular.forEach(f => frag.appendChild(createFilmCard(f)));
            popularFilmsContainer.appendChild(frag);
        }

        if (newFilms.length === 0) {
            newFilmsContainer.innerHTML = '<div class="error">Новые поступления не найдены.</div>';
        } else {
            const frag2 = document.createDocumentFragment();
            newFilms.forEach(f => frag2.appendChild(createFilmCard(f)));
            newFilmsContainer.appendChild(frag2);
        }

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

    function initSlider() {
        const container = popularFilmsContainer;
        sliderNext.addEventListener('click', () => {
            container.scrollBy({left: 600, behavior: 'smooth'});
        });
        sliderPrev.addEventListener('click', () => {
            container.scrollBy({left: -600, behavior: 'smooth'});
        });
    }

    function getRandomFilm() {
        if (!filmsData.length) { showToast({message: 'Фильмы ещё не загружены.', type: 'error'}); return; }
        const randomIndex = Math.floor(Math.random() * filmsData.length);
        const film = filmsData[randomIndex];
        showToast({message: `Случайный фильм: ${film.title} — ${film.director || 'режиссер неизвестен'} (${film.rating || '—'}/10)`, type: 'info', timeout: 6000});
    }

    function showTopFilms() {
        if (!filmsData.length) { showToast({message: 'Фильмы ещё не загружены.', type: 'error'}); return; }
        const topFilms = [...filmsData].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
        const list = topFilms.map(f => `• ${f.title} (${f.rating || '—'}/10)`).join('\n');
        showToast({message: `Топ 3 фильма:\n${list}`, type: 'success', timeout: 7000});
    }

    randomFilmBtn.addEventListener('click', getRandomFilm);
    topFilmsBtn.addEventListener('click', showTopFilms);

    document.querySelectorAll('nav a').forEach(a => {
        a.addEventListener('focus', () => a.classList.add('focus'));
        a.addEventListener('blur', () => a.classList.remove('focus'));
    });

    const style = document.createElement('style');
    style.innerHTML = `
        .film-card.focus-temp { box-shadow: 0 0 0 4px rgba(246,185,59,0.12); transform: translateY(-4px); }
    `;
    document.head.appendChild(style);
});
