document.addEventListener('DOMContentLoaded', function () {
    const directorsContainer = document.getElementById('allDirectors');

    fetch('api/directors.php')
        .then(response => response.json())
        .then(data => {
            renderDirectors(data);
        })
        .catch(error => {
            console.error('Ошибка загрузки режиссеров:', error);
            directorsContainer.innerHTML = '<p class="error">Ошибка загрузки данных</p>';
        });

    function createDirectorCard(director) {
        return `
            <div class="director-card" data-id="${director.id}">
                <div class="director-photo">
                    <img alt="${director.title}" src="${director.poster || 'img/placeholder.jpg'}">
                </div>
                <div class="director-info">
                    <h3>${director.title}</h3>
                    <div class="director-meta">
                        <span><i class="fas fa-film"></i> ${director.films || 0} фильмов</span>
                        <span><i class="fas fa-star"></i> ${director.rating || 'N/A'}</span>
                    </div>
                    <p class="director-bio">${director.bio || 'Нет информации'}</p>
                    <div class="director-genres">
                        <span class="genre-tag">${director.genres || 'Нет данных'}</span>
                    </div>
                    <button class="btn-small btn-view-films" data-director-id="${director.id}">
                            Фильмы режиссера
                        </button>
                </div>
            </div>
        `;
    }

    function renderDirectors(directors) {
        directorsContainer.innerHTML = directors.map(director =>
            createDirectorCard(director)
        ).join('');


        document.querySelectorAll('.btn-view-films').forEach(button => {
            button.addEventListener('click', () => {
                const directorId = button.dataset.directorId;
                window.location.href = `films_by_director.html?director=${directorId}`;
            });
        });
    }
});