const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCTpg0I1WHmRgbpDWVdoMVJ4E9rE1qUO8nss3m6TD_yf7GzLBLQZj53abuRvM8tlqW2g/exec';

let isUserRegMode = false;
let currentUser = localStorage.getItem('mta_current_user') || null;

window.onload = function() {
    checkUserSession();
    renderPurchasedGoods();
};

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    
    let targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');
    
    if (tabId === 'cheats') document.getElementById('nav-cheats')?.classList.add('active');
    if (tabId === 'payment') {
        document.getElementById('nav-payment')?.classList.add('active');
        updateSelectedProductText();
    }
    if (tabId === 'my-goods') {
        document.getElementById('nav-goods')?.classList.add('active');
        renderPurchasedGoods();
    }
    if (tabId === 'profile') document.getElementById('nav-profile')?.classList.add('active');
}

function updateSelectedProductText() {
    let savedOrder = localStorage.getItem('mta_current_order');
    let textEl = document.getElementById('selected-product-text');
    if (textEl) {
        textEl.innerHTML = savedOrder ? `Выбран товар: <b>${savedOrder}</b>` : `Выбран товар: <b>Ничего не выбрано</b>`;
    }
}

function toggleUserRegMode() {
    isUserRegMode = !isUserRegMode;
    let titleEl = document.getElementById('user-auth-title');
    let btnEl = document.getElementById('user-auth-btn');
    let toggleEl = document.getElementById('user-toggle-text');
    
    if (titleEl) titleEl.innerText = isUserRegMode ? 'Регистрация аккаунта' : 'Вход в аккаунт';
    if (btnEl) btnEl.innerText = isUserRegMode ? 'Зарегистрироваться' : 'Войти';
    if (toggleEl) toggleEl.innerText = isUserRegMode ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться';
}

function userAuthAction() {
    let lInput = document.getElementById('user-login');
    let pInput = document.getElementById('user-pass');
    if (!lInput || !pInput) return;

    let l = lInput.value.trim();
    let p = pInput.value.trim();

    if (!l || !p) {
        alert('Заполните все поля!');
        return;
    }

    let users = JSON.parse(localStorage.getItem('mta_site_users') || '{}');

    if (isUserRegMode) {
        if (users[l]) {
            alert('Такой логин уже занят!');
            return;
        }
        users[l] = p;
        localStorage.setItem('mta_site_users', JSON.stringify(users));
        alert('Регистрация успешна! Теперь войдите.');
        toggleUserRegMode();
    } else {
        if (users[l] && users[l] === p) {
            currentUser = l;
            localStorage.setItem('mta_current_user', l);
            checkUserSession();
            alert('Успешный вход!');
        } else {
            alert('Неверный логин или пароль!');
        }
    }
}

function userLogout() {
    currentUser = null;
    localStorage.removeItem('mta_current_user');
    checkUserSession();
}

function checkUserSession() {
    let authBox = document.getElementById('user-auth-box');
    let cabinetBox = document.getElementById('user-cabinet-box');
    let usernameEl = document.getElementById('current-username');

    if (currentUser) {
        if (authBox) authBox.style.display = 'none';
        if (cabinetBox) cabinetBox.style.display = 'block';
        if (usernameEl) usernameEl.innerText = currentUser;
    } else {
        if (authBox) authBox.style.display = 'block';
        if (cabinetBox) cabinetBox.style.display = 'none';
    }
}

function selectProduct(name, price, downloadLink) {
    if (!currentUser) {
        alert('Сначала войдите в личный кабинет или зарегистрируйтесь!');
        switchTab('profile');
        return;
    }
    localStorage.setItem('mta_current_order', `${name} - ${price}р`);
    localStorage.setItem('mta_current_link', downloadLink || 'https://t.me/your_telegram');
    switchTab('payment');
}

function openCurrencyModal() {
    if (!currentUser) {
        alert('Сначала войдите в личный кабинет или зарегистрируйтесь!');
        switchTab('profile');
        return;
    }
    let modal = document.getElementById('currency-modal');
    if (modal) modal.style.display = 'flex';
}

function closeCurrencyModal() {
    let modal = document.getElementById('currency-modal');
    if (modal) modal.style.display = 'none';
}

let currencyAmountInput = document.getElementById('currency-amount');
if (currencyAmountInput) {
    currencyAmountInput.addEventListener('input', (e) => {
        let val = Math.max(1, e.target.value);
        let calcPrice = document.getElementById('calc-price');
        if (calcPrice) calcPrice.innerText = `Итого: ${val * 200} ₽`;
    });
}

function confirmCurrency() {
    let server = document.getElementById('server-select').value;
    let amount = document.getElementById('currency-amount').value;
    let totalPrice = amount * 200;
    
    localStorage.setItem('mta_current_order', `Валюта (Сервер ${server}, ${amount} млн) - ${totalPrice}р`);
    localStorage.setItem('mta_current_link', 'https://t.me/your_telegram');
    closeCurrencyModal();
    switchTab('payment');
}

// ОТПРАВКА ЧЕРЕЗ GOOGLE APPS SCRIPT (РАБОТАЕТ У ВСЕХ НА 100%)
function simulatePayment() {
    let savedOrder = localStorage.getItem('mta_current_order');
    if (!savedOrder) {
        alert('Сначала выберите товар!');
        return;
    }
    
    let username = currentUser || 'Гость';

    // Отправляем запрос на ваш Google-сервер
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            username: username,
            orderText: savedOrder
        })
    }).catch(err => console.log('Telegram send error:', err));

    let statusArea = document.getElementById('status-message');
    if (statusArea) {
        statusArea.style.display = 'block';
        statusArea.style.border = '1px solid var(--border-color, #444)';
        statusArea.style.padding = '10px';
        statusArea.style.borderRadius = '8px';
        statusArea.innerHTML = `⏳ <b>Заявка отправлена!</b> Администратор проверяет оплату. Как только он подтвердит её, товар появится во вкладке "Мои товары".`;
    }
}

function renderPurchasedGoods() {
    let container = document.getElementById('purchased-list');
    if (!container) return;

    let myGoods = JSON.parse(localStorage.getItem('mta_my_goods') || '[]');
    if (myGoods.length === 0) {
        container.innerHTML = `<p style="color: #888;">У вас пока нет купленных товаров.</p>`;
        return;
    }

    let html = '';
    myGoods.forEach(item => {
        html += `
            <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid #444; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <p style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: #00ffff;">${item.name}</p>
                <a href="${item.link}" target="_blank" class="btn-primary" style="display: inline-block; text-align: center; text-decoration: none; padding: 10px 20px; font-size: 0.9rem;">📥 Скачать / Получить</a>
            </div>
        `;
    });
    container.innerHTML = html;
}
