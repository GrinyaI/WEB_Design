document.addEventListener('DOMContentLoaded', function () {
    const genresContainer = document.getElementById('genresContainer');

    function fetchGenres() {
        fetch('api/genres.php')
            .then(response => response.json())
            .then(data => {
                renderGenres(data);
            })
            .catch(error => {
                console.error('Ошибка загрузки жанров:', error);
                genresContainer.innerHTML = '<p>Ошибка загрузки данных</p>';
            });
    }

    function renderGenres(genres) {
        if (!Array.isArray(genres) || genres.length === 0) {
            genresContainer.innerHTML = '<p>Нет доступных жанров</p>';
            return;
        }


        const maxFilms = Math.max(...genres.map(g => g.film_count)) || 1;

        const html = genres.map(genre => {
            const popularityPercent = ((genre.film_count / maxFilms) * 100).toFixed(1);

            return `
                <div class="genre-card" data-genre="${genre.name}" data-popularity="${popularityPercent}">
                    <div class="genre-icon">
                        <i class="fas ${genre.icon}"></i>
                    </div>
                    <h3>${genre.name}</h3>
                    <p class="film-count">${getFilmCountText(genre.film_count)}</p>
                    <div class="genre-progress">
                        <div class="progress-bar" style="width: ${popularityPercent}%"></div>
                    </div>
                    <button class="btn-small btn-view">
                        <a href="films_by_genre.html?genre=${encodeURIComponent(genre.name)}">Смотреть все</a>
                    </button>
                </div>
            `;
        }).join('');

        genresContainer.innerHTML = html;
    }

    function getFilmCountText(count) {
        if (count === 0) return 'Нет фильмов';
        if (count === 1) return '1 фильм';
        if (count < 5) return `${count} фильма`;
        return `${count} фильмов`;
    }

    fetchGenres();
});