let currentOrder = null;

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    // Подсветка кнопки
    if (tabId === 'cheats') document.querySelectorAll('nav button')[0].classList.add('active');
    if (tabId === 'payment') document.querySelectorAll('nav button')[1].classList.add('active');
    if (tabId === 'admin') document.querySelectorAll('nav button')[2].classList.add('active');
}

function selectProduct(productName) {
    currentOrder = productName;
    document.getElementById('selected-product-text').innerHTML = `Выбран товар: <b>${productName}</b>`;
    switchTab('payment');
}

function simulatePayment() {
    if (!currentOrder) {
        alert('Сначала выберите товар!');
        return;
    }
    let orders = JSON.parse(localStorage.getItem('mta_orders') || '[]');
    orders.push({ id: Date.now(), product: currentOrder, status: 'pending' });
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

function adminLogin() {
    let l = document.getElementById('admin-login').value;
    let p = document.getElementById('admin-pass').value;

    if (l === 'prov' && p === 'prov111') {
        document.getElementById('admin-login-box').style.display = 'none';
        document.getElementById('admin-panel-box').style.display = 'block';
        loadOrders();
        setInterval(loadOrders, 2000); 
    } else {
        alert('Неверный логин или пароль!');
    }
}

function loadOrders() {
    let orders = JSON.parse(localStorage.getItem('mta_orders') || '[]');
    let list = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted);">Новых заказов пока нет...</p>';
        return;
    }

    let html = '';
    // Показываем в обратном порядке (новые сверху)
    [...orders].reverse().forEach((ord) => {
        html += `
            <div class="order-item">
                <div>
                    <strong>Товар:</strong> ${ord.product}<br>
                    <small style="color: var(--text-muted);">Статус: ${ord.status === 'pending' ? 'Ожидает оплаты/подтверждения' : 'Одобрен'}</small>
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
