document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchBtn = document.getElementById('searchBtn');

    function debounce(fn, wait) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

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

    const toast = (msg, type = 'info', timeout = 4500) => {
        if (typeof window.showToast === 'function') {
            window.showToast({message: msg, type: type, timeout: timeout});
            return;
        }
        const container = document.getElementById('toastContainer') || (() => {
            const c = document.createElement('div');
            c.id = 'toastContainer';
            document.body.appendChild(c);
            return c;
        })();
        const el = document.createElement('div');
        el.className = 'toast ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : '');
        el.innerHTML = `<div class="toast-content">${escapeHtml(msg)}</div><button class="toast-close" aria-label="Закрыть уведомление">&times;</button>`;
        container.appendChild(el);
        const closeBtn = el.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => el.remove());
        if (timeout > 0) setTimeout(() => el.remove(), timeout);
    };

    function displaySearchResults(results) {
        searchResults.innerHTML = results.map(film => `
            <div class="search-result-item" data-id="${escapeHtml(film.id)}" role="option" tabindex="0">
                <div class="search-result-poster" aria-hidden="true">
                    <img src="${escapeHtml(film.poster || 'img/placeholder.jpg')}" alt="${escapeHtml(film.title)}" width="50">
                </div>
                <div class="search-result-info">
                    <h4>${escapeHtml(film.title)}</h4>
                    <p>${escapeHtml(film.director || '—')} • ${escapeHtml(film.year || '—')}</p>
                    <p class="search-genres">${escapeHtml(film.genres || '')}</p>
                </div>
            </div>
        `).join('') || '<div class="search-result-item">Ничего не найдено</div>';

        searchResults.classList.add('show');
        searchResults.setAttribute('aria-hidden', 'false');
    }

    function handleSearchError(err) {
        console.error('Ошибка поиска:', err);
        searchResults.innerHTML = '<div class="search-result-item">Ошибка загрузки результатов поиска</div>';
        searchResults.classList.add('show');
        searchResults.setAttribute('aria-hidden', 'false');
        toast('Не удалось выполнить поиск. Проверьте соединение.', 'error', 6000);
    }

    function performSearch(query) {
        const q = (query || '').trim();
        if (!q) {
            searchResults.classList.remove('show');
            searchResults.setAttribute('aria-hidden', 'true');
            return;
        }

        searchResults.innerHTML = `<div class="search-result-item">Поиск… <span class="spinner" aria-hidden="true" style="margin-left:8px"></span></div>`;
        searchResults.classList.add('show');
        searchResults.setAttribute('aria-hidden', 'false');

        fetch(`api/search.php?q=${encodeURIComponent(q)}`)
            .then(response => {
                if (!response.ok) throw new Error('Ошибка сети');
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data)) {
                    displaySearchResults([]);
                    toast('Сервер вернул неожиданный формат ответа.', 'error', 5000);
                    return;
                }
                displaySearchResults(data);
            })
            .catch(handleSearchError);
    }

    const debouncedSearch = debounce(performSearch, 250);

    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    searchBtn.addEventListener('click', () => {
        performSearch(searchInput.value);
    });

    searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (!item) return;
        const id = item.dataset.id;
        const card = document.querySelector(`.film-card[data-id="${CSS.escape(id)}"]`);
        if (card) {
            card.scrollIntoView({behavior: 'smooth', block: 'center'});
            card.classList.add('focus-temp');
            setTimeout(() => card.classList.remove('focus-temp'), 2000);
        } else {
            toast('Карточка фильма не отображается на текущей странице.', 'info', 4000);
        }
        searchResults.classList.remove('show');
        searchResults.setAttribute('aria-hidden', 'true');
    });

    searchResults.addEventListener('keydown', (e) => {
        const item = e.target.closest('.search-result-item');
        if (!item) return;
        if (e.key === 'Enter') {
            item.click();
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchResults.contains(e.target) && e.target !== searchInput && e.target !== searchBtn) {
            searchResults.classList.remove('show');
            searchResults.setAttribute('aria-hidden', 'true');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });
});
