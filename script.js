// Глобальные переменные
let selectedProduct = null;
let selectedPrice = 0;
let currentUser = localStorage.getItem('mta_user') || null;

window.onload = function() {
    renderPurchasedGoods();
    checkMaintenanceMode();
    applyDiscountStyles();
    injectFloatingChatWidget();
    injectReviewsAndGuaranteeBlocks();
    checkUserAuthState();
};

// Функция переключения вкладок
function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Сброс стилей кнопок навигации
    const navButtons = document.querySelectorAll('.container > div:first-child button');
    navButtons.forEach(btn => {
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.color = '#94a3b8';
        btn.style.boxShadow = 'none';
        btn.style.border = '1px solid rgba(255,255,255,0.1)';
    });

    const activeBtn = document.getElementById('nav-' + tabId);
    if (activeBtn) {
        activeBtn.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
        activeBtn.style.color = '#fff';
    }
}

// Выбор товара
function selectProduct(name, price, link) {
    selectedProduct = name;
    selectedPrice = price;

    const textEl = document.getElementById('selected-product-text');
    if (textEl) {
        textEl.innerText = `Выбран товар: ${name} — ${price} ₽`;
        textEl.style.color = '#00ffff';
    }

    switchTab('payment');
}

// Модальное окно выбора сервера / валюты
function openCurrencyModal() {
    const modal = document.getElementById('currency-modal');
    if (modal) modal.style.display = 'flex';
}

function closeCurrencyModal() {
    const modal = document.getElementById('currency-modal');
    if (modal) modal.style.display = 'none';
}

// Регистрация и Авторизация с привязкой Telegram
function userAuthAction() {
    const loginInput = document.getElementById('user-login');
    const tgInput = document.getElementById('telegram-id');
    
    if (!loginInput || !loginInput.value.trim()) {
        alert('Введите логин для входа/регистрации!');
        return;
    }

    const username = loginInput.value.trim();
    const telegramId = tgInput ? tgInput.value.trim() : 'Не указан';

    // Сохраняем в localStorage
    const userData = {
        username: username,
        telegramId: telegramId,
        authTime: new Date().toLocaleString()
    };

    localStorage.setItem('mta_user', JSON.stringify(userData));
    currentUser = userData;

    alert(`Успешный вход! Добро пожаловать, ${username}`);
    checkUserAuthState();
    
    // Отправка уведомления/данных через ТГ бота (если привязан)
    if (telegramId && telegramId !== 'Не указан') {
        console.log(`Telegram бот синхронизирован с аккаунтом ${username} (ID: ${telegramId})`);
    }
}

// Проверка состояния авторизации в профиле
function checkUserAuthState() {
    const authCard = document.querySelector('.auth-card');
    if (!authCard) return;

    let savedUser = localStorage.getItem('mta_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch(e) {
            currentUser = { username: savedUser, telegramId: 'Нет' };
        }

        authCard.innerHTML = `
            <h2 style="margin-bottom: 15px; text-align: center; color: var(--accent-cyan);">Личный кабинет</h2>
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <p style="color: #fff; margin-bottom: 5px;">Логин: <b>${currentUser.username}</b></p>
                <p style="color: var(--text-muted); font-size: 0.9rem;">Telegram ID: <b>${currentUser.telegramId || 'Не привязан'}</b></p>
            </div>
            <button class="btn-primary" style="width: 100%; background: #ef4444; color: #fff;" onclick="logoutUser()">Выйти из аккаунта</button>
        `;
    }
}

function logoutUser() {
    localStorage.removeItem('mta_user');
    currentUser = null;
    location.reload(); // Перезагрузка для сброса формы авторизации
}

// Имитация оплаты
function simulatePayment() {
    const statusEl = document.getElementById('status-message');
    if (!statusEl) return;

    if (!localStorage.getItem('mta_user')) {
        alert('Сначала войдите в аккаунт, чтобы совершить покупку!');
        switchTab('profile');
        return;
    }

    if (!selectedProduct) {
        statusEl.style.display = 'block';
        statusEl.style.color = '#ef4444';
        statusEl.innerText = 'Ошибка: Товар не выбран!';
        return;
    }

    // Сохраняем купленный товар
    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    purchases.push({
        product: selectedProduct,
        price: selectedPrice,
        date: new Date().toLocaleDateString(),
        key: 'KEY-' + Math.random().toString(36).substring(2, 9).toUpperCase()
    });
    localStorage.setItem('mta_purchases', JSON.stringify(purchases));

    statusEl.style.display = 'block';
    statusEl.style.color = '#22c55e';
    statusEl.innerText = 'Оплата прошла успешно! Проверьте вкладку «Мои товары».';
    
    renderPurchasedGoods();
}

// Отрисовка купленных товаров
function renderPurchasedGoods() {
    const goodsTab = document.getElementById('my-goods');
    if (!goodsTab) return;

    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    
    if (purchases.length === 0) {
        goodsTab.innerHTML = `
            <div class="hero-banner" style="text-align: center;">
                <h2>Купленные товары</h2>
                <p style="color: var(--text-muted); margin-top: 10px;">У вас пока нет активных покупок.</p>
            </div>
        `;
        return;
    }

    let html = `<div class="hero-banner"><h2>Купленные товары</h2><div style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">`;
    purchases.forEach(item => {
        html += `
            <div style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 10px; border: 1px solid var(--border-color);">
                <p style="color: #fff; font-weight: bold;">${item.product}</p>
                <p style="color: var(--accent-cyan); font-size: 0.85rem; margin-top: 4px;">Ключ / Ссылка: <code>${item.key}</code></p>
                <span style="color: var(--text-muted); font-size: 0.75rem;">Дата: ${item.date}</span>
            </div>
        `;
    });
    html += `</div></div>`;
    goodsTab.innerHTML = html;
}

// Создание плавающего виджета чата техподдержки
function injectFloatingChatWidget() {
    if (document.getElementById('mta-chat-widget-container')) return;

    let widgetContainer = document.createElement('div');
    widgetContainer.id = 'mta-chat-widget-container';
    widgetContainer.innerHTML = `
        <button id="mta-chat-toggle-btn" onclick="toggleChatWindow()" style="
            position: fixed; bottom: 25px; right: 25px; width: 55px; height: 55px;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: #fff;
            border: none; border-radius: 50%; font-size: 24px; cursor: pointer;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.5); z-index: 99999;
            display: flex; align-items: center; justify-content: center;
        ">💬</button>

        <div id="mta-chat-window" style="
            display: none; position: fixed; bottom: 90px; right: 25px; width: 320px; height: 400px;
            background: #121420; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 99999; flex-direction: column; overflow: hidden;
        ">
            <div style="background: #1a1a2e; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="font-weight: bold; color: #fff;">Техподдержка (Telegram Bot)</span>
                <button onclick="toggleChatWindow()" style="background: none; border: none; color: #aaa; font-size: 18px; cursor: pointer;">✕</button>
            </div>

            <div id="mta-chat-messages" style="flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #0e0e0e;">
                <p style="color: #888; text-align: center; font-size: 0.85rem;">Задайте вопрос оператору...</p>
            </div>

            <div style="padding: 10px; background: #1a1a2e; display: flex; gap: 8px;">
                <input type="text" id="mta-chat-input" placeholder="Сообщение..." style="flex: 1; padding: 8px 12px; background: #222; border: 1px solid #444; color: #fff; border-radius: 6px; outline: none;">
                <button onclick="sendChatMessage()" style="background: #8b5cf6; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">➤</button>
            </div>
        </div>
    `;
    document.body.appendChild(widgetContainer);
}

function toggleChatWindow() {
    let win = document.getElementById('mta-chat-window');
    if (!win) return;
    win.style.display = (win.style.display === 'flex') ? 'none' : 'flex';
}

function sendChatMessage() {
    const inputEl = document.getElementById('mta-chat-input');
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;

    const container = document.getElementById('mta-chat-messages');
    if (container) {
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = 'background: #8b5cf6; color: #fff; padding: 8px 12px; border-radius: 10px; align-self: flex-end; max-width: 80%; font-size: 0.9rem;';
        msgDiv.innerText = text;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }
    inputEl.value = '';
}

function checkMaintenanceMode() {}
function applyDiscountStyles() {}
function injectReviewsAndGuaranteeBlocks() {}
