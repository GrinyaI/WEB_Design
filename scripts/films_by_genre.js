document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const genreName = urlParams.get('genre');

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
                    <p class="film-genre"><i class="fas fa-tag"></i> ${film.genres}</p>
                    <div class="film-actions">
                        <button class="btn-small btn-watch">Смотреть</button>
                        <button class="btn-small btn-favorite"><i class="far fa-heart"></i></button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderGenreInfo(genre) {
        const genreHeader = document.querySelector('.genre-header');
        genreHeader.innerHTML = `
            <div class="genre-info">
                <div class="genre-icon large">
                    <i class="fas ${genre.icon}"></i>
                </div>
                <div>
                    <h2>${genre.name}</h2>
                    <p class="genre-description">${genre.bio}</p>
                    <div class="genre-stats">
                        <span><i class="fas fa-film"></i> ${genre.film_count} фильмов</span>
                        <span><i class="fas fa-star"></i> Средний рейтинг: ${parseFloat(genre.avg_rating).toFixed(1)}</span>
                        <span><i class="fas fa-calendar-alt"></i> Самый старый: ${genre.oldest_year}</span>
                    </div>
                </div>
            </div>
            <div class="genre-actions">
                <button class="btn-small btn-sort"><i class="fas fa-sort"></i> Сортировать</button>
                <button class="btn-small btn-filter"><i class="fas fa-filter"></i> Фильтры</button>
            </div>
        `;
    }

    fetch(`api/films_by_genre.php?genre=${encodeURIComponent(genreName)}`)
        .then(response => response.json())
        .then(data => {
            renderGenreInfo(data.genre);
            const filmsContainer = document.getElementById('genreFilms');
            if (data.films.length == 0) {
                filmsContainer.innerHTML = '<p>Фильмы данного жанра не найдены</p>';
            } else {
            filmsContainer.innerHTML = data.films.map(film => createFilmCard(film)).join('');
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки:', error);
            document.getElementById('genreFilms').innerHTML = '<p>Ошибка загрузки данных</p>';
        });
});