document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const directorId = urlParams.get('director');

    if (!directorId) {
        document.getElementById('directorData').innerHTML = '<p>Режиссер не найден</p>';
        return;
    }

    fetch(`api/films_by_director.php?director=${directorId}`)
        .then(response => response.json())
        .then(data => {
            renderDirector(data.director);
            renderFilms(data.films);
            setupSorting(data.films);
        })
        .catch(error => {
            console.error('Ошибка:', error);
            document.getElementById('directorData').innerHTML = '<p>Ошибка загрузки данных</p>';
        });

    function renderDirector(director) {
        if (!director) {
            document.getElementById('directorData').innerHTML = '<p>Режиссер не найден</p>';
            return;
        }

        document.getElementById('directorData').innerHTML = `
            <div class="director-photo large">
                <img alt="${director.title}" src="${director.poster}">
            </div>
            <div class="director-details">
                <h2>${director.title}</h2>
                <div class="director-meta">
                    <span><i class="fas fa-birthday-cake"></i> ${director.birthday}</span>
                    <span><i class="fas fa-film"></i> ${director.filmsCount} фильмов</span>
                    <span><i class="fas fa-star"></i> Рейтинг: ${director.rating}</span>
                </div>
                <p class="director-bio">${director.bio}</p>
            </div>
        `;
    }

    function renderFilms(films) {
        const filmsContainer = document.getElementById('directorFilms');
        filmsContainer.innerHTML = films.map(film => `
            <div class="film-card" data-id="${film.id}">
                <div class="film-poster">
                    <img src="${film.poster}" alt="${film.title}">
                    ${(film.is_new == 1) ? '<span class="film-badge">Новинка</span>' : ''}
                </div>
                <div class="film-info">
                    <h3>${film.title}</h3>
                    <div class="film-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${film.year}</span>
                        <span class="film-rating"><i class="fas fa-star"></i> ${film.rating}</span>
                    </div>
                    <p class="film-genre"><i class="fas fa-tag"></i> ${film.genre}</p>
                    <div class="film-actions">
                        <button class="btn-small btn-watch">Смотреть</button>
                        <button class="btn-small btn-favorite"><i class="far fa-heart"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function setupSorting(films) {
        document.querySelectorAll('.sort-controls button').forEach(button => {
            button.addEventListener('click', (e) => {
                const sortType = e.target.dataset.sort;
                let sortedFilms = [...films];

                switch (sortType) {
                    case 'year':
                        sortedFilms.sort((a, b) => b.year - a.year);
                        break;
                    case 'rating':
                        sortedFilms.sort((a, b) => b.rating - a.rating);
                        break;
                    case 'title':
                        sortedFilms.sort((a, b) => a.title.localeCompare(b.title));
                        break;
                }

                renderFilms(sortedFilms);
                document.querySelectorAll('.sort-controls button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }
});