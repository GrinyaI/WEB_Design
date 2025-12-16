document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginSocial = document.getElementById('loginSocial');
    const loginSocialBtn = document.getElementById('loginSocialBtn');
    const loggedIn = document.getElementById('loggedIn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    const userLeft = userInfo.querySelector('.user-left');
    const userRight = userInfo.querySelector('.user-right');
    const mainContent = document.getElementById('mainContent');
    const filmsTableBody = document.querySelector('#filmsTable tbody');
    const btnNew = document.getElementById('btnNew');
    const filterInput = document.getElementById('filterInput');

    const modal = document.getElementById('modal');
    const filmForm = document.getElementById('filmForm');
    const modalTitle = document.getElementById('modalTitle');
    const cancelBtn = document.getElementById('cancelBtn');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(loginForm);
        const res = await fetch('../api/admin_login.php', {method: 'POST', body: fd});
        const json = await res.json();
        if (res.ok && json.success) {
            loginForm.style.display = 'none';
            loginSocial.style.display = 'none';
            loggedIn.style.display = 'block';
            mainContent.style.display = 'block';
            renderUserInfo({ email: json.email || '', username: json.username || '', provider: json.provider || null, display: (json.email || json.username) });
            await loadFilms();
        } else {
            alert(json.error || 'Ошибка входа');
        }
    });

    loginSocialBtn.addEventListener('click', async () => {
        window.location.href = '/api/admin_oauth_login.php?provider=github';
    });

    logoutBtn?.addEventListener('click', async () => {
        await fetch('../api/admin_logout.php', {method: 'POST'});
        loginForm.style.display = 'flex';
        loginSocial.style.display = 'flex';
        loggedIn.style.display = 'none';
        mainContent.style.display = 'none';
        renderUserInfo({});
    });

    function renderUserInfo(me = {}) {
        userLeft.textContent = '';
        userRight.innerHTML = '';

        if (!me || (!me.email && !me.username && !me.display)) {
            userLeft.textContent = '';
            return;
        }

        if (me.email) {
            const mailIcon = document.createElement('i');
            mailIcon.className = 'fa-regular fa-envelope user-icon';
            mailIcon.setAttribute('aria-hidden', 'true');

            const emailSpan = document.createElement('span');
            emailSpan.className = 'user-email';
            emailSpan.textContent = me.email;

            const label = document.createElement('small');
            label.className = 'user-label';
            label.textContent = ' (email)';

            userLeft.appendChild(mailIcon);
            userLeft.appendChild(emailSpan);
            userLeft.appendChild(label);

            if (me.provider === 'github') {
                const prov = document.createElement('i');
                prov.className = 'fa-brands fa-github provider-icon';
                prov.setAttribute('title', 'GitHub');
                prov.setAttribute('aria-hidden', 'true');
                userRight.appendChild(prov);
            }
        } else {
            const userIcon = document.createElement('i');
            userIcon.className = 'fa-regular fa-user user-icon';
            userIcon.setAttribute('aria-hidden', 'true');

            const nameSpan = document.createElement('span');
            nameSpan.className = 'user-name';
            nameSpan.textContent = me.display || me.username || '';

            userLeft.appendChild(userIcon);
            userLeft.appendChild(nameSpan);
        }
    }

    async function loadFilms() {
        const res = await fetch('../api/admin_films.php');
        if (!res.ok) {
            filmsTableBody.innerHTML = '<tr><td colspan="9">Ошибка загрузки</td></tr>';
            return;
        }
        const data = await res.json();
        renderFilms(data);
    }

    function renderFilms(list) {
        filmsTableBody.innerHTML = '';
        if (!Array.isArray(list) || list.length === 0) {
            filmsTableBody.innerHTML = '<tr><td colspan="9">Нет фильмов</td></tr>';
            return;
        }
        for (const film of list.reverse()) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>${escapeHtml(film.id)}</td>
        <td>${film.poster_url ? `<img src="${escapeHtml(film.poster_url)}" alt="">` : ''}</td>
        <td>${escapeHtml(film.title)}</td>
        <td>${escapeHtml(film.year)}</td>
        <td>${escapeHtml(film.rating)}</td>
        <td>${escapeHtml(film.director || '')}</td>
        <td>${film.is_new == 1 ? 'Да' : 'Нет'}</td>
        <td>${film.is_popular == 1 ? 'Да' : 'Нет'}</td>
        <td>
          <button data-id="${film.id}" class="editBtn">Изменить</button>
          <button data-id="${film.id}" class="delBtn danger">Удалить</button>
        </td>
      `;
            filmsTableBody.appendChild(tr);
        }

        filmsTableBody.querySelectorAll('.editBtn').forEach(b => b.addEventListener('click', onEdit));
        filmsTableBody.querySelectorAll('.delBtn').forEach(b => b.addEventListener('click', onDelete));
    }

    function escapeHtml(s = '') {
        return String(s).replace(/[&<>"']/g, (m) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m]));
    }


    filterInput.addEventListener('input', () => {
        const q = filterInput.value.toLowerCase();
        document.querySelectorAll('#filmsTable tbody tr').forEach(row => {
            const txt = row.textContent.toLowerCase();
            row.style.display = txt.includes(q) ? '' : 'none';
        });
    });


    btnNew.addEventListener('click', () => {
        filmForm.reset();
        document.getElementById('filmId').value = '';
        modalTitle.textContent = 'Новый фильм';
        openModal();
    });


    cancelBtn.addEventListener('click', () => closeModal());

    function openModal() {
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        modal.setAttribute('aria-hidden', 'true');
    }


    filmForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(filmForm);
        const id = fd.get('id');
        fd.append('action', id ? 'update' : 'create');

        const res = await fetch('../api/admin_films.php', {method: 'POST', body: fd});
        const json = await res.json();
        if (res.ok && json.success) {
            await loadFilms();
            closeModal();
        } else {
            alert(json.error || 'Ошибка сохранения');
        }
    });


    async function onEdit(e) {
        const id = e.currentTarget.dataset.id;
        const res = await fetch(`../api/admin_films.php?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
            alert('Не удалось загрузить фильм');
            return;
        }
        const film = await res.json();
        document.getElementById('filmId').value = film.id;
        document.getElementById('title').value = film.title || '';
        document.getElementById('year').value = film.year || '';
        document.getElementById('rating').value = film.rating || '';
        document.getElementById('director_id').value = film.director_id || '';
        document.getElementById('is_new').checked = film.is_new == 1;
        document.getElementById('is_popular').checked = film.is_popular == 1;
        modalTitle.textContent = 'Редактировать фильм';
        openModal();
    }


    async function onDelete(e) {
        if (!confirm('Удалить фильм?')) return;
        const id = e.currentTarget.dataset.id;
        const fd = new FormData();
        fd.append('action', 'delete');
        fd.append('id', id);
        const res = await fetch('../api/admin_films.php', {method: 'POST', body: fd});
        const json = await res.json();
        if (res.ok && json.success) {
            await loadFilms();
        } else {
            alert(json.error || 'Ошибка удаления');
        }
    }


    (async () => {
        const res = await fetch('../api/admin_films.php');
        if (res.status === 401) {
            loginForm.style.display = 'flex';
            loginSocial.style.display = 'flex';
            loggedIn.style.display = 'none';
            mainContent.style.display = 'none';
        } else if (res.ok) {
            loginForm.style.display = 'none';
            loginSocial.style.display = 'none';
            loggedIn.style.display = 'block';
            mainContent.style.display = 'block';
            const data = await res.json();
            renderFilms(data);
            try {
                const meRes = await fetch('../api/admin_me.php');
                if (meRes.ok) {
                    const me = await meRes.json();
                    renderUserInfo({ email: me.email || '', username: me.username || '', provider: me.provider || null, display: me.display || '' });
                } else {
                    if (meRes.status === 401) {
                        renderUserInfo({});
                        loginForm.style.display = 'flex';
                        loginSocial.style.display = 'flex';
                        loggedIn.style.display = 'none';
                        mainContent.style.display = 'none';
                    }
                }
            } catch (err) {
                console.error('Не удалось получить данные пользователя', err);
            }
        } else {
            loginForm.style.display = 'flex';
            loginSocial.style.display = 'flex';
            loggedIn.style.display = 'none';
            mainContent.style.display = 'none';
        }
    })();

});