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
    applyAdminSettings();
    
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

    const activeBtn = document.getElementById('nav-' + tabId);
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

// Логика авторизации / регистрации
function userAuthAction() {
    const loginInput = document.getElementById('user-login');
    const passInput = document.getElementById('user-pass');

    if (!loginInput || !loginInput.value.trim() || !passInput || !passInput.value.trim()) {
        alert('Заполните все поля!');
        return;
    }

    const username = loginInput.value.trim();
    
    currentUser = { username: username };
    localStorage.setItem('mta_user', JSON.stringify(currentUser));

    alert(isRegisterMode ? 'Регистрация успешна!' : 'Успешный вход!');
    checkUserAuthState();
}

// Проверка состояния сессии пользователя
function checkUserAuthState() {
    const authBox = document.getElementById('user-auth-box');
    const cabinetBox = document.getElementById('user-cabinet-box');
    const usernameEl = document.getElementById('current-username');

    let saved = localStorage.getItem('mta_user');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
        } catch(e) {
            currentUser = { username: saved };
        }

        if (authBox) authBox.style.display = 'none';
        if (cabinetBox) cabinetBox.style.display = 'block';
        if (usernameEl) usernameEl.innerText = currentUser.username;
    } else {
        if (authBox) authBox.style.display = 'block';
        if (cabinetBox) cabinetBox.style.display = 'none';
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
}

// Симуляция проверки оплаты (оригинальная)
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

    let generatedKey = 'KEY-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    let purchaseDate = new Date().toLocaleDateString();

    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    purchases.push({
        product: selectedProduct,
        price: selectedPrice,
        link: selectedLink || 'Доступ выдается администратором',
        key: generatedKey,
        date: purchaseDate
    });
    localStorage.setItem('mta_purchases', JSON.stringify(purchases));

    statusEl.style.display = 'block';
    statusEl.style.background = 'rgba(34, 197, 94, 0.2)';
    statusEl.style.color = '#22c55e';
    statusEl.innerText = 'Оплата подтверждена! Товар добавлен в раздел «Мои товары».';

    renderPurchasedGoods();
}

// Отрисовка купленных товаров
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
        html += `
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                <p style="font-weight: 700; color: #fff; margin-bottom: 5px;">${item.product}</p>
                <p style="font-size: 0.9rem; color: #00ffff; margin-bottom: 5px;">Данные / Ссылка: <a href="${item.link}" target="_blank" style="color: #00ffff;">${item.link}</a></p>
                <p style="font-size: 0.85rem; color: #aaa; margin-bottom: 5px;">Ключ активации: <code>${item.key}</code></p>
                <span style="font-size: 0.75rem; color: #666;">Дата: ${item.date}</span>
            </div>
        `;
    });
    listEl.innerHTML = html;
}

// === ФУНКЦИИ АДМИН-ПАНЕЛИ (Техработы и Скидки) ===
function checkMaintenanceMode() {
    let isMaintenance = localStorage.getItem('mta_maintenance') === 'true';
    if (isMaintenance) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#0b0c10;color:#fff;font-family:sans-serif;text-align:center;"><h1>⚠️ На сайте ведутся технические работы. Скоро вернемся!</h1></div>';
    }
}

function applyAdminSettings() {
    // Проверка сохраненных настроек администратора в localStorage
    let discountActive = localStorage.getItem('mta_discount') === 'true';
    if (discountActive) {
        console.log('Режим скидок активирован администратором');
    }
}
