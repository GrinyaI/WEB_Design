document.addEventListener('DOMContentLoaded', function () {
    let filmsData = [];

    fetch('api/index.php')
        .then(response => response.json())
        .then(data => {
            filmsData = [...data.popular, ...data.new];
            renderFilms(data.popular, data.new);
            initSlider();
        });

    const popularFilmsContainer = document.getElementById('popularFilms');
    const newFilmsContainer = document.getElementById('newFilms');
    const randomFilmBtn = document.getElementById('randomFilmBtn');
    const topFilmsBtn = document.getElementById('topFilmsBtn');
    const sliderPrev = document.querySelector('.slider-prev');
    const sliderNext = document.querySelector('.slider-next');

    function createFilmCard(film) {
        return `
            <div class="film-card" data-id="${film.id}">
                <div class="film-poster">
                    <img src="${film.poster_url || 'img/placeholder.jpg'}" alt="${film.title}">
                    ${(film.is_new == 1) ? '<span class="film-badge">Новинка</span>' : ''}
                </div>
                <div class="film-info">
                    <h3>${film.title}</h3>
                    <div class="film-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${film.year}</span>
                        <span class="film-rating"><i class="fas fa-star"></i> ${film.rating}</span>
                    </div>
                    <p class="film-director"><i class="fas fa-user-tie"></i> ${film.director}</p>
                    <p class="film-genre"><i class="fas fa-tag"></i> ${film.genres || 'Нет данных'}</p>
                    <div class="film-actions">
                        <button class="btn-small btn-watch">Смотреть</button>
                        <button class="btn-small btn-favorite"><i class="far fa-heart"></i></button>
                    </div>
                </div>
            </div>
        `;
    }

    function getRandomFilm() {
        const randomIndex = Math.floor(Math.random() * filmsData.length);
        const film = filmsData[randomIndex];
        alert(`Случайный фильм: ${film.title}\nРежиссер: ${film.director}\nРейтинг: ${film.rating}`);
    }


    function showTopFilms() {
        const topFilms = [...filmsData].sort((a, b) => b.rating - a.rating).slice(0, 3);
        const topFilmsList = topFilms.map(film => `• ${film.title} (${film.rating}/10)`).join('\n');
        alert(`Топ 3 фильма:\n${topFilmsList}`);
    }

    function renderFilms(popular, newFilms) {
        popularFilmsContainer.innerHTML = popular.map(film => createFilmCard(film)).join('');
        newFilmsContainer.innerHTML = newFilms.map(film => createFilmCard(film)).join('');
    }

    function initSlider() {
        let currentPosition = 0;
        const cards = document.querySelectorAll('.film-card');
        const cardWidth = cards[0]?.offsetWidth + 24;

        sliderNext.addEventListener('click', () => {
            if (currentPosition > -((cards.length - 4) * cardWidth)) {
                currentPosition -= cardWidth;
                popularFilmsContainer.style.transform = `translateX(${currentPosition}px)`;
            }
        });

        sliderPrev.addEventListener('click', () => {
            if (currentPosition < 0) {
                currentPosition += cardWidth;
                popularFilmsContainer.style.transform = `translateX(${currentPosition}px)`;
            }
        });
    }

    randomFilmBtn.addEventListener('click', getRandomFilm);
    topFilmsBtn.addEventListener('click', showTopFilms);
});