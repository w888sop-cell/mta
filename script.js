// Глобальные переменные
let selectedProduct = null;
let selectedPrice = 0;
let selectedLink = '';
let isRegisterMode = false;
let currentUser = localStorage.getItem('mta_user') ? JSON.parse(localStorage.getItem('mta_user')) : null;

// ==========================================
// ТВОИ ДАННЫЕ TELEGRAM БОТА (Вставь их сюда)
// ==========================================
const TG_BOT_TOKEN = 'ВСТАВЬ_СВОЙ_ТОКЕН_СЮДА'; 
const TG_CHAT_ID = 'ВСТАВЬ_СВОЙ_CHAT_ID_СЮДА';   

window.onload = function() {
    renderPurchasedGoods();
    checkUserAuthState();
    checkMaintenanceMode();
    applyDiscountStyles();
    
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

    sendAdminLog('Открыл (перезагрузил) сайт');
};

// Функция отправки логов администратору в Telegram
function sendAdminLog(actionDescription) {
    let username = 'Гость';
    
    if (currentUser && currentUser.username) {
        username = currentUser.username;
    } else {
        let saved = localStorage.getItem('mta_user');
        if (saved) {
            try {
                let parsed = JSON.parse(saved);
                username = parsed.username || 'Неизвестный';
            } catch(e) {
                username = saved;
            }
        }
    }

    const timeString = new Date().toLocaleTimeString();
    const dateString = new Date().toLocaleDateString();
    
    const logText = `📋 *Лог активности*\n\n` +
                    `👤 Пользователь: \`${username}\`\n` +
                    `⚡ Действие: ${actionDescription}\n` +
                    `🕒 Время: ${timeString} (${dateString})`;

    sendTelegramNotification(logText);
}

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

    let tabNames = {
        'cheats': 'Читы (Товары)',
        'payment': 'Оплата',
        'my-goods': 'Мои товары',
        'profile': 'Профиль'
    };
    sendAdminLog(`Перешел на вкладку: ${tabNames[tabId] || tabId}`);
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

    sendAdminLog(`Выбрал товар: ${name} (${price} ₽)`);
    switchTab('payment');
}

// Открытие / закрытие модалки выбора валюты
function openCurrencyModal() {
    const modal = document.getElementById('currency-modal');
    if (modal) modal.style.display = 'flex';
    sendAdminLog('Открыл модальное окно выбора игровой валюты');
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

    sendAdminLog(`Выбрал игровую валюту: ${millions} млн на Сервере №${server} (${selectedPrice} ₽)`);
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

    sendAdminLog(`Выполнил ${isRegisterMode ? 'регистрацию' : 'вход'} под логином: ${username}`);
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
    sendAdminLog(`Вышел из аккаунта (${currentUser ? currentUser.username : 'Неизвестно'})`);
    
    localStorage.removeItem('mta_user');
    currentUser = null;
    const loginInput = document.getElementById('user-login');
    const passInput = document.getElementById('user-pass');
    if (loginInput) loginInput.value = '';
    if (passInput) passInput.value = '';
    
    checkUserAuthState();
}

// Отправка запроса на оплату (создание заявки на проверку админу)
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
        product: selectedProduct,
        price: selectedPrice,
        link: 'Ожидает подтверждения администратором',
        key: 'Ожидается',
        status: 'pending',
        date: purchaseDate
    });
    localStorage.setItem('mta_purchases', JSON.stringify(purchases));

    statusEl.style.display = 'block';
    statusEl.style.background = 'rgba(59, 130, 246, 0.2)';
    statusEl.style.color = '#3b82f6';
    statusEl.innerText = 'Заявка отправлена! Администратор проверит перевод и выдаст товар.';

    sendAdminLog(`Создал заявку на оплату #${orderId} для товара: ${selectedProduct} (${selectedPrice} ₽)`);
    sendTelegramNotification(`🔔 *Новая заявка на оплату!* (#${orderId})\n\n👤 Пользователь: ${currentUser.username}\n📦 Товар: ${selectedProduct}\n💰 Сумма: ${selectedPrice} ₽\n\n_Проверьте перевод средств._`);

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

// Админ-функции (Техработы и Скидки)
function checkMaintenanceMode() {
    // Место под логику техработ, если активировано
}

function applyDiscountStyles() {
    // Место под логику скидок
}

// Функция отправки сообщений в Telegram (исправлена отправка)
function sendTelegramNotification(text) {
    if (!TG_BOT_TOKEN || TG_BOT_TOKEN.includes('ВСТАВЬ') || !TG_CHAT_ID || TG_CHAT_ID.includes('ВСТАВЬ')) {
        console.warn('⚠️ Telegram бот не настроен! Укажи TG_BOT_TOKEN и TG_CHAT_ID в начале script.js');
        return;
    }

    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TG_CHAT_ID,
            text: text,
            parse_mode: 'Markdown'
        })
    })
    .then(response => {
        if (!response.ok) {
            console.error('Ошибка Telegram API:', response.statusText);
        }
    })
    .catch(err => console.error('Ошибка отправки в Telegram:', err));
}
