// НАСТРОЙКИ TELEGRAM БОТА
const TELEGRAM_BOT_TOKEN = '8659237947:AAHQu9Y1_450Cq2jQY7ISaIqHsmmvaKvIE4';
const TELEGRAM_CHAT_ID = '755271846';

let isUserRegMode = false;
let currentUser = localStorage.getItem('mta_current_user') || null;

window.onload = function() {
    checkUserSession();
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
    if (tabId === 'profile') document.querySelectorAll('nav button')[2].classList.add('active');
}

function updateSelectedProductText() {
    let savedOrder = localStorage.getItem('mta_current_order');
    let textEl = document.getElementById('selected-product-text');
    if (savedOrder) {
        textEl.innerHTML = `Выбран товар: <b>${savedOrder}</b>`;
    } else {
        textEl.innerHTML = `Выбран товар: <b>Ничего не выбрано</b>`;
    }
}

function toggleUserRegMode() {
    isUserRegMode = !isUserRegMode;
    document.getElementById('user-auth-title').innerText = isUserRegMode ? 'Регистрация аккаунта' : 'Вход в аккаунт';
    document.getElementById('user-auth-btn').innerText = isUserRegMode ? 'Зарегистрироваться' : 'Войти';
    document.getElementById('user-toggle-text').innerText = isUserRegMode ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться';
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
    if (currentUser) {
        document.getElementById('user-auth-box').style.display = 'none';
        document.getElementById('user-cabinet-box').style.display = 'block';
        document.getElementById('current-username').innerText = currentUser;
    } else {
        document.getElementById('user-auth-box').style.display = 'block';
        document.getElementById('user-cabinet-box').style.display = 'none';
    }
}

function selectProduct(name, price) {
    if (!currentUser) {
        alert('Сначала войдите в личный кабинет или зарегистрируйтесь!');
        switchTab('profile');
        return;
    }
    let orderText = `${name} - ${price}р`;
    localStorage.setItem('mta_current_order', orderText);
    switchTab('payment');
}

function openCurrencyModal() {
    if (!currentUser) {
        alert('Сначала войдите в личный кабинет или зарегистрируйтесь!');
        switchTab('profile');
        return;
    }
    document.getElementById('currency-modal').style.display = 'flex';
}

function closeCurrencyModal() {
    document.getElementById('currency-modal').style.display = 'none';
}

document.getElementById('currency-amount')?.addEventListener('input', (e) => {
    let val = Math.max(1, e.target.value);
    document.getElementById('calc-price').innerText = `Итого: ${val * 200} ₽`;
});

function confirmCurrency() {
    let server = document.getElementById('server-select').value;
    let amount = document.getElementById('currency-amount').value;
    let totalPrice = amount * 200;
    
    let orderText = `Валюта (Сервер ${server}, ${amount} млн) - ${totalPrice}р`;
    localStorage.setItem('mta_current_order', orderText);
    closeCurrencyModal();
    switchTab('payment');
}

// ОТПРАВКА УВЕДОМЛЕНИЯ В TELEGRAM
function sendTelegramNotification(orderText, username) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=` + 
                encodeURIComponent(`🔔 Новый заказ!\n\nПокупатель: ${username}\nТовар: ${orderText}`);

    // Используем Image для обхода блокировок fetch на мобильных устройствах
    let img = new Image();
    img.src = url;
}

function simulatePayment() {
    let savedOrder = localStorage.getItem('mta_current_order');
    if (!savedOrder) return;
    sendTelegramNotification(savedOrder, currentUser || 'Гость');
}

function checkStatus() {
    let savedOrder = localStorage.getItem('mta_current_order');
    if (!savedOrder) {
        alert('Вы ничего не выбрали для покупки.');
        return;
    }
    
    // Отправляем уведомление в Telegram
    sendTelegramNotification(savedOrder, currentUser || 'Гость');

    let statusArea = document.getElementById('status-message');
    statusArea.style.display = 'block';
    statusArea.style.border = '1px solid var(--text-muted)';
    statusArea.innerHTML = `⏳ <b>Заявка успешно отправлена!</b><br>` +
                           `Администратор проверяет поступление средств.<br>` +
                           `После подтверждения оплаты вы получите товар в Telegram или на сайте.`;
}
