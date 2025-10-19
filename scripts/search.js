document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchBtn = document.getElementById('searchBtn');

    function displaySearchResults(results) {
        searchResults.innerHTML = results.map(film => `
            <div class="search-result-item" data-id="${film.id}">
                <div class="search-result-poster">
                    <img src="${film.poster}" alt="${film.title}" width="50">
                </div>
                <div class="search-result-info">
                    <h4>${film.title}</h4>
                    <p>${film.director} • ${film.year}</p>
                    <p class="search-genres">${film.genres}</p>
                </div>
            </div>
        `).join('') || '<div class="search-result-item">Ничего не найдено</div>';

        searchResults.classList.add('show');
    }

    function performSearch(query) {
        if (!query) {
            searchResults.classList.remove('show');
            return;
        }

        fetch(`api/search.php?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                displaySearchResults(data);
            })
            .catch(error => {
                console.error('Ошибка поиска:', error);
                searchResults.innerHTML = '<div class="search-result-item">Ошибка загрузки</div>';
                searchResults.classList.add('show');
            });
    }

    searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });

    searchBtn.addEventListener('click', () => {
        performSearch(searchInput.value);
    });

    document.addEventListener('click', (e) => {
        if (!searchResults.contains(e.target) && e.target !== searchInput && e.target !== searchBtn) {
            searchResults.classList.remove('show');
        }
    });
});