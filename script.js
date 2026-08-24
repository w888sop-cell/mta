// Глобальные переменные
let selectedProduct = null;
let selectedPrice = 0;
let currentUser = localStorage.getItem('mta_user') || null;

window.onload = function() {
    renderPurchasedGoods();
    checkMaintenanceMode();
    applyDiscountStyles();
    injectFloatingChatWidget(); // Внедрение плавающего виджета чата
    injectReviewsAndGuaranteeBlocks();
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

// Имитация оплаты
function simulatePayment() {
    const statusEl = document.getElementById('status-message');
    if (!statusEl) return;

    if (!selectedProduct) {
        statusEl.style.display = 'block';
        statusEl.style.color = '#ef4444';
        statusEl.innerText = 'Ошибка: Товар не выбран!';
        return;
    }

    statusEl.style.display = 'block';
    statusEl.style.color = '#22c55e';
    statusEl.innerText = 'Оплата успешно прошла! Товар добавлен в "Мои товары".';
}

// Создание плавающего виджета чата техподдержки
function injectFloatingChatWidget() {
    if (document.getElementById('mta-chat-widget-container')) return;

    let widgetContainer = document.createElement('div');
    widgetContainer.id = 'mta-chat-widget-container';
    widgetContainer.innerHTML = `
        <!-- Плавающая кнопка -->
        <button id="mta-chat-toggle-btn" onclick="toggleChatWindow()" style="
            position: fixed;
            bottom: 25px;
            right: 25px;
            width: 55px;
            height: 55px;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            color: #fff;
            border: none;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.5);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
        ">💬</button>

        <!-- Окно чата -->
        <div id="mta-chat-window" style="
            display: none;
            position: fixed;
            bottom: 90px;
            right: 25px;
            width: 320px;
            height: 400px;
            background: #121420;
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            z-index: 99999;
            flex-direction: column;
            overflow: hidden;
            font-family: inherit;
        ">
            <div style="background: #1a1a2e; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="font-weight: bold; color: #fff;">Поддержка</span>
                <button onclick="toggleChatWindow()" style="background: none; border: none; color: #aaa; font-size: 18px; cursor: pointer;">✕</button>
            </div>

            <!-- История сообщений (диалог) -->
            <div id="mta-chat-messages" style="
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
                background: #0e0e0e;
            ">
                <p style="color: #888; text-align: center; font-size: 0.85rem;">Напишите ваше сообщение...</p>
            </div>

            <!-- Поле ввода -->
            <div style="padding: 10px; background: #1a1a2e; display: flex; gap: 8px;">
                <input type="text" id="mta-chat-input" placeholder="Сообщение..." style="
                    flex: 1;
                    padding: 8px 12px;
                    background: #222;
                    border: 1px solid #444;
                    color: #fff;
                    border-radius: 6px;
                    outline: none;
                ">
                <button onclick="sendChatMessage()" style="
                    background: #8b5cf6;
                    color: #fff;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                ">➤</button>
            </div>
        </div>
    `;
    document.body.appendChild(widgetContainer);
}

// Открытие / открытие окна чата
function toggleChatWindow() {
    let win = document.getElementById('mta-chat-window');
    if (!win) return;

    if (win.style.display === 'flex') {
        win.style.display = 'none';
    } else {
        win.style.display = 'flex';
        renderChatMessages();
    }
}

// Отправка сообщения в диалог чата
function sendChatMessage() {
    currentUser = localStorage.getItem('mta_user');
    if (!currentUser) {
        alert('Сначала войдите в аккаунт в разделе Профиль!');
        switchTab('profile');
        toggleChatWindow();
        return;
    }

    const inputEl = document.getElementById('mta-chat-input');
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;

    // Очищаем поле ввода
    inputEl.value = '';
    
    // Отрисовываем обновленные сообщения
    renderChatMessages(text);
}

function renderChatMessages(newMsg = null) {
    const container = document.getElementById('mta-chat-messages');
    if (!container) return;

    if (newMsg) {
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = 'background: #8b5cf6; color: #fff; padding: 8px 12px; border-radius: 10px; align-self: flex-end; max-width: 80%; font-size: 0.9rem;';
        msgDiv.innerText = newMsg;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }
}

// Заглушки для вспомогательных функций
function renderPurchasedGoods() {}
function checkMaintenanceMode() {}
function applyDiscountStyles() {}
function injectReviewsAndGuaranteeBlocks() {}

function userAuthAction() {
    const input = document.getElementById('user-login');
    if (input && input.value.trim()) {
        localStorage.setItem('mta_user', input.value.trim());
        alert('Вы успешно вошли как: ' + input.value.trim());
    }
}
