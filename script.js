// --- Хранилище данных и логов ---
let allUserLogs = JSON.parse(localStorage.getItem('nexus_logs')) || {};
let currentUser = localStorage.getItem('nexus_current_user') || null;
let selectedProduct = null;

// Имя администратора (можете изменить на свой логин)
const ADMIN_USERNAME = "admin";

// Инициализация при загрузке страницы
window.onload = function() {
    updateAuthUI();
    logAction("Открыл главную страницу сайта");
};

// --- Система логирования действий ---
function logAction(actionDescription) {
    let username = currentUser ? currentUser : "Гость (Неавторизован)";
    
    if (!allUserLogs[username]) {
        allUserLogs[username] = [];
    }

    let now = new Date();
    let timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let dateString = now.toLocaleDateString('ru-RU');

    allUserLogs[username].unshift({
        time: `${dateString} ${timeString}`,
        action: actionDescription,
        status: currentUser ? 'Авторизован' : 'Аноним'
    });

    // Сохраняем в localStorage
    localStorage.setItem('nexus_logs', JSON.stringify(allUserLogs));
    
    // Если открыта панель админа, обновляем её в реальном времени
    if (currentUser && currentUser.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
        renderAdminUsers();
    }
}

// --- Переключение вкладок с логированием ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    
    let btnId = 'nav-cheats';
    if(tabId === 'payment') btnId = 'nav-payment';
    if(tabId === 'my-goods') btnId = 'nav-goods';
    if(tabId === 'profile') btnId = 'nav-profile';
    if(tabId === 'admin-panel') btnId = 'nav-admin';
    
    let targetNavBtn = document.getElementById(btnId);
    if(targetNavBtn) targetNavBtn.classList.add('active');

    logAction(`Перешел во вкладку: [${tabId}]`);
    
    if (tabId === 'admin-panel' && currentUser && currentUser.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
        renderAdminUsers();
    }
}

// --- Авторизация и регистрация ---
let isRegMode = false;

function toggleUserRegMode() {
    isRegMode = !isRegMode;
    document.getElementById('user-auth-title').innerText = isRegMode ? "Регистрация аккаунта" : "Вход в аккаунт";
    document.getElementById('user-auth-btn').innerText = isRegMode ? "Зарегистрироваться" : "Войти";
    document.getElementById('user-toggle-text').innerText = isRegMode ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться";
    logAction(`Переключил режим формы на: ${isRegMode ? 'Регистрация' : 'Вход'}`);
}

function userAuthAction() {
    let loginInput = document.getElementById('user-login').value.trim();
    if (!loginInput) {
        alert("Введите логин!");
        return;
    }

    currentUser = loginInput;
    localStorage.setItem('nexus_current_user', currentUser);
    
    logAction(isRegMode ? `Зарегистрировал аккаунт и вошел` : `Успешно вошел в систему`);
    updateAuthUI();
    alert(`Добро пожаловать, ${currentUser}!`);
}

function userLogout() {
    logAction(`Вышел из аккаунта (${currentUser})`);
    currentUser = null;
    localStorage.removeItem('nexus_current_user');
    updateAuthUI();
    switchTab('cheats');
}

function updateAuthUI() {
    let authBox = document.getElementById('user-auth-box');
    let cabinetBox = document.getElementById('user-cabinet-box');
    let adminNavBtn = document.getElementById('nav-admin');

    if (currentUser) {
        authBox.style.display = 'none';
        cabinetBox.style.display = 'block';
        document.getElementById('current-username').innerText = currentUser;

        // ПРОВЕРКА НА АДМИНА
        if (currentUser.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
            adminNavBtn.style.display = 'inline-block';
        } else {
            adminNavBtn.style.display = 'none';
        }
    } else {
        authBox.style.display = 'block';
        cabinetBox.style.display = 'none';
        adminNavBtn.style.display = 'none';
    }
}

// --- Логика товаров и кнопок ---
function selectProduct(name, price, link) {
    selectedProduct = { name, price, link };
    document.getElementById('selected-product-text').innerHTML = `Выбран товар: <b>${name}</b> (${price} ₽)`;
    logAction(`Выбрал товар для покупки: "${name}" за ${price} ₽`);
    switchTab('payment');
}

function simulatePayment() {
    if (!selectedProduct) {
        alert("Сначала выберите товар во вкладке 'Софт & Системы'!");
        switchTab('cheats');
        return;
    }
    logAction(`Нажал кнопку оплаты защищенной заявки для товара: "${selectedProduct.name}"`);
    let msg = document.getElementById('status-message');
    msg.style.display = 'block';
    msg.style.color = 'var(--accent-cyan)';
    msg.innerHTML = `Заявка сформирована. Безопасный шлюз скрыл ваши личные данные. Ожидание ответа шлюза...`;
}

function openCurrencyModal() {
    logAction(`Открыл модальное окно выбора валюты`);
    document.getElementById('currency-modal').style.display = 'flex';
}

function closeCurrencyModal() {
    logAction(`Закрыл модальное окно валюты`);
    document.getElementById('currency-modal').style.display = 'none';
}

function confirmCurrency() {
    let amount = document.getElementById('currency-amount').value;
    let server = document.getElementById('server-select').value;
    logAction(`Подтвердил покупку валюты: ${amount} млн на сервере №${server}`);
    closeCurrencyModal();
    selectProduct(`Пакет валюты (${amount} млн)`, amount * 200, '#');
}

// --- Рендеринг Админ-панели ---
function renderAdminUsers() {
    let usersListContainer = document.getElementById('admin-users-list');
    if (!usersListContainer) return;
    
    usersListContainer.innerHTML = '';
    let usernames = Object.keys(allUserLogs);

    if (usernames.length === 0) {
        usersListContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Логов пока нет</p>';
        return;
    }

    usernames.forEach(username => {
        let btn = document.createElement('button');
        btn.className = 'admin-user-btn';
        btn.innerHTML = `👤 ${username} <span style="float: right; font-size: 0.75rem; color: var(--text-muted);">(${allUserLogs[username].length})</span>`;
        btn.onclick = function() {
            document.querySelectorAll('.admin-user-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showUserLogs(username);
        };
        usersListContainer.appendChild(btn);
    });
}

function showUserLogs(username) {
    document.getElementById('admin-selected-title').innerText = `Логи пользователя: ${username}`;
    let tbody = document.getElementById('admin-logs-tbody');
    tbody.innerHTML = '';

    let logs = allUserLogs[username];
    if (!logs || logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">У пользователя нет записей</td></tr>`;
        return;
    }

    logs.forEach(log => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color: var(--text-muted); font-size: 0.85rem;">${log.time}</td>
            <td style="font-weight: 500;">${log.action}</td>
            <td><span style="font-size: 0.75rem; background: rgba(0,255,255,0.1); color: var(--accent-cyan); padding: 2px 6px; border-radius: 4px;">${log.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function clearLogs() {
    if (confirm("Вы уверены, что хотите удалить все сохраненные логи?")) {
        localStorage.removeItem('nexus_logs');
        allUserLogs = {};
        renderAdminUsers();
        document.getElementById('admin-selected-title').innerText = 'Выберите пользователя слева';
        document.getElementById('admin-logs-tbody').innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Логи очищены</td></tr>`;
    }
}
