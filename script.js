let currentOrder = null;
let isUserRegMode = false;
let currentUser = localStorage.getItem('mta_current_user') || null;
let lastOrdersCount = 0; // Для отслеживания новых заказов у админа

// Инициализация интерфейса при загрузке
window.onload = function() {
    checkUserSession();
    setInterval(globalUpdater, 2000);
};

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'cheats') document.querySelectorAll('nav button')[0].classList.add('active');
    if (tabId === 'payment') document.querySelectorAll('nav button')[1].classList.add('active');
    if (tabId === 'profile') document.querySelectorAll('nav button')[2].classList.add('active');
    if (tabId === 'admin') {
        document.querySelectorAll('nav button')[3].classList.add('active');
        if (document.getElementById('admin-panel-box').style.display === 'block') {
            loadOrders();
        }
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
        loadUserOrders();
    } else {
        document.getElementById('user-auth-box').style.display = 'block';
        document.getElementById('user-cabinet-box').style.display = 'none';
    }
}

// Выбор обычного товара
function selectProduct(name, price) {
    if (!currentUser) {
        alert('Сначала войдите в личный кабинет или зарегистрируйтесь!');
        switchTab('profile');
        return;
    }
    currentOrder = `${name} - ${price}р`;
    document.getElementById('selected-product-text').innerHTML = `Выбран товар: <b>${currentOrder}</b>`;
    switchTab('payment');
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
    
    currentOrder = `Валюта (Сервер ${server}, ${amount} млн) - ${totalPrice}р`;
    document.getElementById('selected-product-text').innerHTML = `Выбран товар: <b>${currentOrder}</b>`;
    closeCurrencyModal();
    switchTab('payment');
}

// Создание заказа при оплате
function simulatePayment() {
    if (!currentOrder) {
        alert('Сначала выберите товар!');
        return;
    }
    let orders = JSON.parse(localStorage.getItem('mta_orders') || '[]');
    
    // Проверяем, не отправлял ли пользователь точно такой же активный заказ только что
    let existing = orders.find(o => o.user === currentUser && o.product === currentOrder && o.status === 'pending');
    if (!existing) {
        let newOrder = { 
            id: Date.now(), 
            user: currentUser, 
            product: currentOrder, 
            status: 'pending',
            notified: false 
        };
        orders.push(newOrder);
        localStorage.setItem('mta_orders', JSON.stringify(orders));
    }
}

function checkStatus() {
    if (!currentOrder) {
        alert('Вы ничего не покупали.');
        return;
    }
    // На всякий случай дублируем отправку заказа при клике "Я оплатил"
    simulatePayment();

    let orders = JSON.parse(localStorage.getItem('mta_orders') || '[]');
    let myOrder = orders.reverse().find(o => o.product === currentOrder && o.user === currentUser);

    let statusArea = document.getElementById('status-message');
    statusArea.style.display = 'block';

    if (myOrder && myOrder.status === 'approved') {
        statusArea.style.border = '1px solid var(--accent)';
        statusArea.innerHTML = `Оплата подтверждена!<br><br>Ссылка на софт: <a href="https://github.com/Onyokot/ProvHack?ysclid=mt5z8xg8az668141499" target="_blank" style="color: var(--accent);">Открыть репозиторий</a><br>Инструкция внутри.`;
    } else {
        statusArea.style.border = '1px solid var(--text-muted)';
        statusArea.innerHTML = `Заявка отправлена! Дождитесь ответа админа. Платеж проверяется...`;
    }
}

// Загрузка заказов в личном кабинете пользователя
function loadUserOrders() {
    if (!currentUser) return;
    let orders = JSON.parse(localStorage.getItem('mta_orders') || '[]');
    let myOrders = orders.filter(o => o.user === currentUser);
    let list = document.getElementById('user-orders-list');

    if (myOrders.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted);">У вас пока нет заказов.</p>';
        return;
    }

    let html = '';
    [...myOrders].reverse().forEach(ord => {
        if (ord.status === 'approved') {
            html += `
                <div class="order-item" style="border: 1px solid var(--accent);">
                    <div>
                        <strong>${ord.product}</strong><br>
                        <span style="color: var(--accent);">Одобрено!</span><br>
                        <a href="https://github.com/Onyokot/ProvHack?ysclid=mt5z8xg8az668141499" target="_blank" style="color: var(--accent); font-size: 14px;">Ссылка на софт</a> (Инструкция внутри)
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="order-item">
                    <div>
                        <strong>${ord.product}</strong><br>
                        <small style="color: var(--text-muted);">Статус: Ожидает подтверждения админа</small>
                    </div>
                </div>
            `;
        }
    });
    list.innerHTML = html;
}

// Универсальный звук уведомления
function playNotificationSound(freq = 587.33) {
    try {
        let ctx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = ctx.createOscillator();
        let gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.5);
    } catch(e) {}
}

// Фоновый глобальный апдейтер
function globalUpdater() {
    // Проверка для обычного пользователя (звук при одобрении)
    if (currentUser) {
        let orders = JSON.parse(localStorage.getItem('mta_orders') || '[]');
        let myOrders = orders.filter(o => o.user === currentUser);
        
        let needsSound = myOrders.some(o => o.status === 'approved' && !o.notified);
        if (needsSound) {
            playNotificationSound(587.33); // Высокий звук для юзера
            orders = orders.map(o => {
                if (o.user === currentUser && o.status === 'approved') o.notified = true;
                return o;
            });
            localStorage.setItem('mta_orders', JSON.stringify(orders));
        }
        loadUserOrders();
    }

    // Проверка для администратора (звук и обновление при новом заказе)
    if (document.getElementById('admin-panel-box').style.display === 'block') {
        let orders = JSON.parse(localStorage.getItem('mta_orders') || '[]');
        if (orders.length > lastOrdersCount && lastOrdersCount !== 0) {
            playNotificationSound(440); // Звук для админа (нота A4)
        }
        lastOrdersCount = orders.length;
        loadOrders();
    }
}

// Админка
function adminLogin() {
    let l = document.getElementById('admin-login').value.trim();
    let p = document.getElementById('admin-pass').value.trim();

    if (!l || !p) {
        alert('Заполните все поля!');
        return;
    }

    if (l === 'prov' && p === 'prov111') {
        document.getElementById('admin-auth-box').style.display = 'none';
        document.getElementById('admin-panel-box').style.display = 'block';
        let orders = JSON.parse(localStorage.getItem('mta_orders') || '[]');
        lastOrdersCount = orders.length;
        loadOrders();
    } else {
        alert('Неверный логин или пароль администратора!');
    }
}

function adminLogout() {
    document.getElementById('admin-panel-box').style.display = 'none';
    document.getElementById('admin-auth-box').style.display = 'block';
    document.getElementById('admin-login').value = '';
    document.getElementById('admin-pass').value = '';
}

function loadOrders() {
    let orders = JSON.parse(localStorage.getItem('mta_orders') || '[]');
    let list = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted);">Новых заказов пока нет...</p>';
        return;
    }

    let html = '';
    [...orders].reverse().forEach((ord) => {
        html += `
            <div class="order-item">
                <div>
                    <strong>Покупатель:</strong> ${ord.user || 'Неизвестно'}<br>
                    <strong>Заказ:</strong> ${ord.product}<br>
                    <small style="color: var(--text-muted);">Статус: ${ord.status === 'pending' ? 'Ожидает подтверждения' : 'Одобрен'}</small>
                </div>
                ${ord.status === 'pending' ? `<button class="admin-btn" onclick="approveOrder(${ord.id})" style="padding: 5px 10px; font-size: 12px; width: auto;">Платеж пришел</button>` : '<span style="color: var(--accent);">Выдан</span>'}
            </div>
        `;
    });
    list.innerHTML = html;
}

function approveOrder(id) {
    let orders = JSON.parse(localStorage.getItem('mta_orders') || '[]');
    orders = orders.map(o => {
        if (o.id === id) o.status = 'approved';
        return o;
    });
    localStorage.setItem('mta_orders', JSON.stringify(orders));
    loadOrders();
}
