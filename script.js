// Глобальные переменные
let selectedProduct = null;
let selectedPrice = 0;
let selectedLink = '';
let isRegisterMode = false;
let currentUser = localStorage.getItem('mta_user') ? JSON.parse(localStorage.getItem('mta_user')) : null;

window.onload = function() {
    renderPurchasedGoods();
    checkUserAuthState();
    checkMaintenanceMode();
    renderAdminOrders();
    
    // Динамический расчет цены при изменении количества валюты
    const amountInput = document.getElementById('currency-amount');
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            let val = parseInt(this.value) || 1;
            if (val < 1) val = 1;
            let total = val * 200;
            const priceEl = document.getElementById('calc-price');
            if (priceEl) priceEl.innerText = `Итого: ${total} ₽`;
        });
    }
};

// Переключение вкладок
function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    const navButtons = document.querySelectorAll('nav button');
    navButtons.forEach(btn => btn.classList.remove('active'));

    // Ищем кнопку по ID
    let btnId = 'nav-' + tabId;
    if (tabId === 'admin-panel') btnId = 'nav-admin';
    
    const activeBtn = document.getElementById(btnId);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Выбор обычного товара
function selectProduct(name, price, link) {
    selectedProduct = name;
    selectedPrice = price;
    selectedLink = link;

    const textEl = document.getElementById('selected-product-text');
    if (textEl) {
        textEl.innerHTML = `Выбран товар: <b style="color: #00ffff;">${name}</b> — ${price} ₽`;
    }

    switchTab('payment');
}

// Открытие / закрытие модалки выбора валюты
function openCurrencyModal() {
    const modal = document.getElementById('currency-modal');
    if (modal) modal.style.display = 'flex';
}

function closeCurrencyModal() {
    const modal = document.getElementById('currency-modal');
    if (modal) modal.style.display = 'none';
}

// Подтверждение выбора валюты из модалки
function confirmCurrency() {
    const serverSelect = document.getElementById('server-select');
    const amountInput = document.getElementById('currency-amount');
    
    const server = serverSelect ? serverSelect.value : '1';
    const millions = amountInput ? (parseInt(amountInput.value) || 1) : 1;
    
    selectedPrice = millions * 200;
    selectedProduct = `${millions} млн игровой валюты (Сервер №${server})`;
    selectedLink = `Выдача на сервере ${server}`;

    const textEl = document.getElementById('selected-product-text');
    if (textEl) {
        textEl.innerHTML = `Выбран товар: <b style="color: #00ffff;">${selectedProduct}</b> — ${selectedPrice} ₽`;
    }

    closeCurrencyModal();
    switchTab('payment');
}

// Переключение между Войти / Зарегистрироваться в профиле
function toggleUserRegMode() {
    isRegisterMode = !isRegisterMode;
    const title = document.getElementById('user-auth-title');
    const btn = document.getElementById('user-auth-btn');
    const toggleText = document.getElementById('user-toggle-text');

    if (isRegisterMode) {
        if (title) title.innerText = 'Регистрация аккаунта';
        if (btn) btn.innerText = 'Зарегистрироваться';
        if (toggleText) toggleText.innerText = 'Уже есть аккаунт? Войти';
    } else {
        if (title) title.innerText = 'Вход в аккаунт';
        if (btn) btn.innerText = 'Войти';
        if (toggleText) toggleText.innerText = 'Нет аккаунта? Зарегистрироваться';
    }
}

// Логика авторизации с проверкой админа (Admin / 6277)
function userAuthAction() {
    const loginInput = document.getElementById('user-login');
    const passInput = document.getElementById('user-pass');

    if (!loginInput || !loginInput.value.trim() || !passInput || !passInput.value.trim()) {
        alert('Заполните все поля!');
        return;
    }

    const username = loginInput.value.trim();
    const password = passInput.value.trim();

    // Проверка на главного администратора
    if (username === 'Admin' && password === '6277') {
        currentUser = { username: 'Admin', isAdmin: true };
    } else if (isRegisterMode) {
        currentUser = { username: username, isAdmin: false };
        alert('Регистрация успешна!');
    } else {
        // Обычный вход (для теста пускаем с любым паролем, если не админ)
        currentUser = { username: username, isAdmin: false };
    }

    localStorage.setItem('mta_user', JSON.stringify(currentUser));
    checkUserAuthState();
    alert('Успешный вход!');
}

// Проверка состояния сессии пользователя и отображение админки
function checkUserAuthState() {
    const authBox = document.getElementById('user-auth-box');
    const cabinetBox = document.getElementById('user-cabinet-box');
    const usernameEl = document.getElementById('current-username');
    const adminNavBtn = document.getElementById('nav-admin');

    let saved = localStorage.getItem('mta_user');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
        } catch(e) {
            currentUser = { username: saved, isAdmin: false };
        }

        if (authBox) authBox.style.display = 'none';
        if (cabinetBox) cabinetBox.style.display = 'block';
        if (usernameEl) usernameEl.innerText = currentUser.username;

        // Если это администратор — показываем кнопку «Админ» в шапке
        if (currentUser.username === 'Admin' && adminNavBtn) {
            adminNavBtn.style.display = 'inline-block';
        } else if (adminNavBtn) {
            adminNavBtn.style.display = 'none';
        }
    } else {
        if (authBox) authBox.style.display = 'block';
        if (cabinetBox) cabinetBox.style.display = 'none';
        if (adminNavBtn) adminNavBtn.style.display = 'none';
    }
}

// Выход из аккаунта
function userLogout() {
    localStorage.removeItem('mta_user');
    currentUser = null;
    const loginInput = document.getElementById('user-login');
    const passInput = document.getElementById('user-pass');
    if (loginInput) loginInput.value = '';
    if (passInput) passInput.value = '';
    
    checkUserAuthState();
    switchTab('cheats');
}

// Симуляция оплаты / создание заказа
function simulatePayment() {
    const statusEl = document.getElementById('status-message');
    if (!statusEl) return;

    if (!localStorage.getItem('mta_user')) {
        alert('Сначала войдите в аккаунт в разделе «Профиль»!');
        switchTab('profile');
        return;
    }

    if (!selectedProduct) {
        statusEl.style.display = 'block';
        statusEl.style.background = 'rgba(239, 68, 68, 0.2)';
        statusEl.style.color = '#ef4444';
        statusEl.innerText = 'Ошибка: Вы не выбрали ни один товар!';
        return;
    }

    let orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    let purchaseDate = new Date().toLocaleDateString();

    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    purchases.push({
        orderId: orderId,
        username: currentUser.username,
        product: selectedProduct,
        price: selectedPrice,
        link: selectedLink || 'Доступ выдается администратором',
        key: 'Ожидается',
        status: 'pending',
        date: purchaseDate
    });
    localStorage.setItem('mta_purchases', JSON.stringify(purchases));

    statusEl.style.display = 'block';
    statusEl.style.background = 'rgba(59, 130, 246, 0.2)';
    statusEl.style.color = '#3b82f6';
    statusEl.innerText = 'Заявка отправлена! Администратор проверит перевод и выдаст товар.';

    renderPurchasedGoods();
    renderAdminOrders();
}

// Отрисовка купленных товаров у клиента
function renderPurchasedGoods() {
    const listEl = document.getElementById('purchased-list');
    if (!listEl) return;

    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');

    if (purchases.length === 0) {
        listEl.innerHTML = `<p style="color: #888;">Здесь появятся ваши товары после проверки оплаты администратором.</p>`;
        return;
    }

    let html = '';
    purchases.forEach(item => {
        let isPending = item.status === 'pending';
        let statusStyle = isPending ? 'color: #f59e0b;' : 'color: #22c55e;';
        let statusText = isPending ? '⏳ Ожидает проверки администратором' : '✅ Оплачено / Выдано';

        html += `
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                <p style="font-weight: 700; color: #fff; margin-bottom: 5px;">${item.product}</p>
                <p style="font-size: 0.9rem; ${statusStyle} margin-bottom: 5px;">Статус: <b>${statusText}</b></p>
                <p style="font-size: 0.9rem; color: #00ffff; margin-bottom: 5px;">Данные / Ссылка: <a href="${item.link}" target="_blank" style="color: #00ffff;">${item.link}</a></p>
                <p style="font-size: 0.85rem; color: #aaa; margin-bottom: 5px;">Ключ активации: <code>${item.key}</code></p>
                <span style="font-size: 0.75rem; color: #666;">Дата: ${item.date}</span>
            </div>
        `;
    });
    listEl.innerHTML = html;
}

// Отображение заказов в панели администратора
function renderAdminOrders() {
    const adminListEl = document.getElementById('admin-orders-list');
    if (!adminListEl) return;

    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    let pendingOrders = purchases.filter(item => item.status === 'pending');

    if (pendingOrders.length === 0) {
        adminListEl.innerHTML = `<p style="color: #888;">Нет активных заявок.</p>`;
        return;
    }

    let html = '';
    purchases.forEach((item, index) => {
        if (item.status === 'pending') {
            html += `
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <p style="font-weight: 700; color: #fff;">Заказ #${item.orderId} от ${item.username}</p>
                    <p style="color: #00ffff;">Товар: ${item.product} (${item.price} ₽)</p>
                    <button type="button" class="btn-primary" onclick="approveOrder(${index})" style="background: #22c55e; margin-top: 10px; padding: 6px 12px; font-size: 0.9rem;">✅ Подтвердить и выдать товар</button>
                </div>
            `;
        }
    });
    adminListEl.innerHTML = html;
}

// Подтверждение заказа администратором
function approveOrder(index) {
    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    let generatedKey = 'KEY-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    
    purchases[index].status = 'approved';
    purchases[index].key = generatedKey;
    
    localStorage.setItem('mta_purchases', JSON.stringify(purchases));
    
    alert('Заказ подтвержден! Товар выдан пользователю.');
    renderAdminOrders();
    renderPurchasedGoods();
}

// Управление техработами
function toggleMaintenance() {
    let current = localStorage.getItem('mta_maintenance') === 'true';
    localStorage.setItem('mta_maintenance', (!current).toString());
    checkMaintenanceMode();
}

function checkMaintenanceMode() {
    let isMaintenance = localStorage.getItem('mta_maintenance') === 'true';
    const statusEl = document.getElementById('maintenance-status');
    if (statusEl) {
        statusEl.innerText = `Статус техработ: ${isMaintenance ? 'Включены (Сайт на паузе)' : 'Выключены'}`;
    }
}
