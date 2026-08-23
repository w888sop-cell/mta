let currentOrder = null;
let isRegisterMode = false;

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'cheats') document.querySelectorAll('nav button')[0].classList.add('active');
    if (tabId === 'payment') document.querySelectorAll('nav button')[1].classList.add('active');
    if (tabId === 'admin') document.querySelectorAll('nav button')[2].classList.add('active');
}

// Выбор обычного товара
function selectProduct(name, price) {
    currentOrder = `${name} - ${price}р`;
    document.getElementById('selected-product-text').innerHTML = `Выбран товар: <b>${currentOrder}</b>`;
    switchTab('payment');
}

// Модальное окно валюты
function openCurrencyModal() {
    document.getElementById('currency-modal').style.display = 'flex';
}

function closeCurrencyModal() {
    document.getElementById('currency-modal').style.display = 'none';
}

// Динамический расчет цены валюты (200р за единицу/миллион)
document.getElementById('currency-amount')?.addEventListener('input', (e) => {
    let val = Math.max(1, e.target.value);
    document.getElementById('calc-price').innerText = `Итого: ${val * 200} ₽`;
});

function confirmCurrency() {
    let server = document.getElementById('server-select').value;
    let amount = document.getElementById('currency-amount').value;
    let totalPrice = amount * 200;
    
    currentOrder = `Валюта (${server}, ${amount} млн) - ${totalPrice}р`;
    document.getElementById('selected-product-text').innerHTML = `Выбран товар: <b>${currentOrder}</b>`;
    closeCurrencyModal();
    switchTab('payment');
}

// Оплата и отправка заявки
function simulatePayment() {
    if (!currentOrder) {
        alert('Сначала выберите товар!');
        return;
    }
    let orders = JSON.parse(localStorage.getItem('mta_orders') || '[]');
    let newOrder = { id: Date.now(), product: currentOrder, status: 'pending' };
    orders.push(newOrder);
    localStorage.setItem('mta_orders', JSON.stringify(orders));
}

function checkStatus() {
    if (!currentOrder) {
        alert('Вы ничего не покупали.');
        return;
    }
    let orders = JSON.parse(localStorage.getItem('mta_orders') || '[]');
    let myOrder = orders.reverse().find(o => o.product === currentOrder);

    let statusArea = document.getElementById('status-message');
    statusArea.style.display = 'block';

    if (myOrder && myOrder.status === 'approved') {
        statusArea.style.border = '1px solid var(--accent)';
        statusArea.innerHTML = `Оплата подтверждена!<br><br>Ссылка на софт: <a href="https://github.com/Onyokot/ProvHack?ysclid=mt5z8xg8az668141499" target="_blank" style="color: var(--accent);">Открыть репозиторий</a><br>Инструкция внутри.`;
    } else {
        statusArea.style.border = '1px solid var(--text-muted)';
        statusArea.innerHTML = `Дождитесь ответа админа. Платеж проверяется...`;
    }
}

// Регистрация и авторизация администратора
function toggleRegisterMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-title').innerText = isRegisterMode ? 'Регистрация администратора' : 'Вход для администратора';
    document.getElementById('auth-action-btn').innerText = isRegisterMode ? 'Зарегистрироваться' : 'Войти';
}

function adminLogin() {
    let l = document.getElementById('admin-login').value.trim();
    let p = document.getElementById('admin-pass').value.trim();

    if (!l || !p) {
        alert('Заполните все поля!');
        return;
    }

    let users = JSON.parse(localStorage.getItem('mta_admin_users') || '{"prov": "prov111"}');

    if (isRegisterMode) {
        if (users[l]) {
            alert('Такой логин уже занят!');
            return;
        }
        users[l] = p;
        localStorage.setItem('mta_admin_users', JSON.stringify(users));
        alert('Успешная регистрация! Теперь войдите.');
        toggleRegisterMode();
    } else {
        if (users[l] && users[l] === p) {
            document.getElementById('admin-auth-box').style.display = 'none';
            document.getElementById('admin-panel-box').style.display = 'block';
            loadOrders();
            setInterval(loadOrders, 2000);
        } else {
            alert('Неверный логин или пароль!');
        }
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
                    <strong>Заказ:</strong> ${ord.product}<br>
                    <small style="color: var(--text-muted);">Статус: ${ord.status === 'pending' ? 'Ожидает подтверждения' : 'Одобрен'}</small>
                </div>
                ${ord.status === 'pending' ? `<button class="admin-btn" onclick="approveOrder(${ord.id})" style="padding: 5px 10px; font-size: 12px;">Платеж пришел</button>` : '<span style="color: var(--accent);">Выдан</span>'}
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
