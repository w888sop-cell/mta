// НАСТРОЙКИ TELEGRAM БОТА
const TELEGRAM_BOT_TOKEN = '8659237947:AAHQu9Y1_450Cq2jQY7ISaIqHsmmvaKvIE4';
const TELEGRAM_CHAT_ID = '755271846';

let isUserRegMode = false;
let currentUser = localStorage.getItem('mta_current_user') || null;

window.onload = function() {
    checkUserSession();
    renderPurchasedGoods();
};

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'cheats') document.querySelectorAll('nav button')[0].classList.add('active');
    if (tabId === 'payment') {
        document.querySelectorAll('nav button')[1].classList.add('active');
        updateSelectedProductText();
    }
    if (tabId === 'my-goods') {
        document.querySelectorAll('nav button')[2].classList.add('active');
        renderPurchasedGoods();
    }
    if (tabId === 'profile') document.querySelectorAll('nav button')[3].classList.add('active');
}

function updateSelectedProductText() {
    let savedOrder = localStorage.getItem('mta_current_order');
    let textEl = document.getElementById('selected-product-text');
    if (textEl) {
        if (savedOrder) {
            textEl.innerHTML = `Выбран товар: <b>${savedOrder}</b>`;
        } else {
            textEl.innerHTML = `Выбран товар: <b>Ничего не выбрано</b>`;
        }
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
    let l = document.getElementById('user-login').value.trim();
    let p = document.getElementById('user-pass').value.trim();

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
    let orderText = `${name} - ${price}р`;
    localStorage.setItem('mta_current_order', orderText);
    localStorage.setItem('mta_current_link', downloadLink || 'https://t.me/your_admin_username');
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
    
    let orderText = `Валюта (Сервер ${server}, ${amount} млн) - ${totalPrice}р`;
    localStorage.setItem('mta_current_order', orderText);
    localStorage.setItem('mta_current_link', 'https://t.me/your_admin_username');
    closeCurrencyModal();
    switchTab('payment');
}

// ОТПРАВКА УВЕДОМЛЕНИЯ В ТЕЛЕГРАМ БЕЗ БЛОКИРОВОК (ЧЕРЕЗ ИЗОБРАЖЕНИЕ)
function sendTelegramNotification(orderText, username) {
    const message = `🔔 Новая заявка на оплату!\n\nПокупатель: ${username}\nТовар: ${orderText}\nПроверьте Т-Банк.`;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=` + encodeURIComponent(message);
    
    let img = new Image();
    img.src = url;
}

function simulatePayment() {
    let savedOrder = localStorage.getItem('mta_current_order');
    if (!savedOrder) {
        alert('Сначала выберите товар!');
        return;
    }
    
    // Отправляем уведомление
    sendTelegramNotification(savedOrder, currentUser || 'Гость');

    // Сразу выдаем товар во вкладку "Мои товары", чтобы покупатель не ждал
    let savedLink = localStorage.getItem('mta_current_link') || 'https://t.me/your_admin_username';
    let myGoods = JSON.parse(localStorage.getItem('mta_my_goods') || '[]');
    
    // Проверяем, нет ли уже такого товара
    let exists = myGoods.some(item => item.name === savedOrder);
    if (!exists) {
        myGoods.push({ name: savedOrder, link: savedLink });
        localStorage.setItem('mta_my_goods', JSON.stringify(myGoods));
    }

    let statusArea = document.getElementById('status-message');
    if (statusArea) {
        statusArea.style.display = 'block';
        statusArea.style.border = '1px solid var(--border-color)';
        statusArea.style.padding = '10px';
        statusArea.style.borderRadius = '8px';
        statusArea.innerHTML = `✅ <b>Заявка отправлена!</b> Товар добавлен во вкладку "Мои товары". Администратор скоро проверит оплату.`;
    }

    setTimeout(() => {
        switchTab('my-goods');
    }, 1500);
}

// ОТОБРАЖЕНИЕ КУПЛЕННЫХ ТОВАРОВ
function renderPurchasedGoods() {
    let container = document.getElementById('purchased-list');
    if (!container) return;

    let myGoods = JSON.parse(localStorage.getItem('mta_my_goods') || '[]');

    if (myGoods.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted);">У вас пока нет купленных товаров.</p>`;
        return;
    }

    let html = '';
    myGoods.forEach(item => {
        html += `
            <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid var(--border-color); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <p style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: var(--accent-cyan);">${item.name}</p>
                <a href="${item.link}" target="_blank" class="btn-primary" style="display: inline-block; text-align: center; text-decoration: none; padding: 10px 20px; font-size: 0.9rem;">📥 Получить / Скачать</a>
            </div>
        `;
    });
    container.innerHTML = html;
}
