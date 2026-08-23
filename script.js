// НАСТРОЙКИ TELEGRAM БОТА
const TELEGRAM_BOT_TOKEN = '8659237947:AAHQu9Y1_450Cq2jQY7ISaIqHsmmvaKvIE4';
const TELEGRAM_CHAT_ID = '755271846';

let isUserRegMode = false;
let currentUser = localStorage.getItem('mta_current_user') || null;

window.onload = function() {
    checkUserSession();
    // Проверяем статус заказа каждые 4 секунды
    setInterval(checkOrderApprovalStatus, 4000);
};

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'cheats') document.querySelectorAll('nav button')[0].classList.add('active');
    if (tabId === 'paid-goods') {
        document.querySelectorAll('nav button')[1].classList.add('active');
        renderPaidGoodsTab();
    }
    if (tabId === 'profile') document.querySelectorAll('nav button')[2].classList.add('active');
}

// Рендер вкладки "Оплаченные товары" с проверкой авторизации и покупок
function renderPaidGoodsTab() {
    let container = document.getElementById('paid-goods-content');
    if (!container) return;

    // Если пользователь не вошел в аккаунт
    if (!currentUser) {
        container.innerHTML = `
            <div class="payment-box" style="text-align: center;">
                <h3 style="margin-bottom: 15px;">🔒 Требуется авторизация</h3>
                <p style="color: var(--text-muted); margin-bottom: 20px;">Войдите в личный кабинет, чтобы просматривать свои купленные товары.</p>
                <button class="btn-primary" onclick="switchTab('profile')">Войти / Регистрация</button>
            </div>
        `;
        return;
    }

    // Загружаем купленные товары пользователя из localStorage
    let allUserGoods = JSON.parse(localStorage.getItem(`mta_paid_goods_${currentUser}`) || '[]');

    if (allUserGoods.length === 0) {
        container.innerHTML = `
            <div class="payment-box" style="text-align: center;">
                <h3 style="margin-bottom: 15px; color: var(--accent-cyan);">📦 Ваши оплаченные товары</h3>
                <p style="color: var(--text-muted); font-size: 1.05rem; line-height: 1.6;">
                    У вас нету оплаченного товара 🫥<br>Купите товар чтобы играть в фарминцию с кайфом!
                </p>
                <button class="btn-primary" onclick="switchTab('cheats')" style="margin-top: 20px;">Перейти к выбору товаров</button>
            </div>
        `;
    } else {
        let html = `<div class="payment-box"><h3 style="margin-bottom: 20px;">📦 Ваши оплаченные товары</h3>`;
        allUserGoods.forEach(item => {
            html += `
                <div style="background: rgba(255,255,255,0.05); padding: 15px; margin-bottom: 15px; border-radius: 12px; border: 1px solid var(--border-color);">
                    <p style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; color: white;">${item.product}</p>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 12px;">Дата: ${item.date}</p>
                    <a href="${item.link}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, var(--accent), var(--accent-cyan)); color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; box-shadow: 0 4px 15px rgba(139,92,246,0.3);">📥 Скачать софт / Получить товар</a>
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
    }
}

// Авторизация пользователей
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

// Выбор товара (сохраняем для корзины)
function selectProduct(name, price) {
    if (!currentUser) {
        alert('Сначала войдите в личный кабинет или зарегистрируйтесь!');
        switchTab('profile');
        return;
    }
    let orderText = `${name} - ${price}р`;
    localStorage.setItem('mta_current_order', orderText);
    alert('Товар выбран! Теперь перейдите во вкладку "Оплаченные" для завершения покупки.');
    switchTab('paid-goods');
}

// Модальное окно валюты
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
    switchTab('paid-goods');
}

// Отправка уведомления с кнопками в Telegram
function sendTelegramNotification(orderText, username, orderId) {
    const message = `🔔 <b>Новая заявка на оплату!</b>\n\n` +
                    `👤 <b>Покупатель:</b> ${username}\n` +
                    `🛒 <b>Товар:</b> ${orderText}\n` +
                    `🆔 <b>ID заказа:</b> ${orderId}`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: "✅ Одобрить", callback_data: `approve_${orderId}` },
                { text: "❌ Отклонить", callback_data: `reject_${orderId}` }
            ]
        ]
    };

    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            reply_markup: keyboard
        })
    })
    .catch(error => console.error('Ошибка отправки в Telegram:', error));
}

function simulatePayment() {
    let savedOrder = localStorage.getItem('mta_current_order');
    if (!savedOrder) {
        alert('Сначала выберите товар!');
        return;
    }
    let orderId = 'order_' + Date.now();
    localStorage.setItem('mta_current_order_id', orderId);
    localStorage.setItem('mta_order_status', 'pending');
    localStorage.setItem('mta_pending_product', savedOrder);
    
    sendTelegramNotification(savedOrder, currentUser || 'Гость', orderId);
    alert('Заявка на оплату отправлена администратору!');
}

// Проверка нажатия кнопок админа в Telegram
function checkOrderApprovalStatus() {
    let orderId = localStorage.getItem('mta_current_order_id');
    let currentStatus = localStorage.getItem('mta_order_status');
    if (!orderId || currentStatus === 'approved' || currentStatus === 'rejected') return;

    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-1`)
    .then(res => res.json())
    .then(data => {
        if (!data.ok || !data.result) return;
        
        data.result.forEach(update => {
            if (update.callback_query) {
                let dataStr = update.callback_query.data;

                if (dataStr === `approve_${orderId}`) {
                    localStorage.setItem('mta_order_status', 'approved');
                    
                    // Добавляем товар в список купленных пользователем
                    let productName = localStorage.getItem('mta_pending_product') || 'Товар';
                    let userGoods = JSON.parse(localStorage.getItem(`mta_paid_goods_${currentUser}`) || '[]');
                    userGoods.push({
                        product: productName,
                        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
                        link: 'https://github.com/Onyokot/ProvHack?ysclid=mt5z8xg8az668141499'
                    });
                    localStorage.setItem(`mta_paid_goods_${currentUser}`, JSON.stringify(userGoods));

                    // Обновляем вкладку, если она открыта
                    renderPaidGoodsTab();
                    alert('Администратор одобрил вашу оплату! Товар появился во вкладке "Оплаченные".');
                } else if (dataStr === `reject_${orderId}`) {
                    localStorage.setItem('mta_order_status', 'rejected');
                    alert('Администратор отклонил платеж: оплата не прошла!');
                }
            }
        });
    })
    .catch(err => console.log(err));
}
