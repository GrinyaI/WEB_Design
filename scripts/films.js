document.addEventListener('DOMContentLoaded', function () {

    fetch('api/films.php')
        .then(response => response.json())
        .then(filmsData => {
            renderAllFilms(filmsData);
        });

    function createFilmCard(film) {
        return `
            <div class="film-card" data-id="${film.id}">
                <div class="film-poster">
                    <img src="${film.poster_url}" alt="${film.title}">
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

    function renderAllFilms(filmsData) {
        const filmsContainer = document.getElementById('allFilms');
        if (!filmsContainer) return;


        filmsContainer.innerHTML = filmsData.map(film =>
            createFilmCard(film)
        ).join('');
    }
});