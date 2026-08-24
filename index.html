// Глобальные переменные
let selectedProduct = null;
let selectedPrice = 0;
let selectedLink = '';
let isRegisterMode = false;
let currentUser = localStorage.getItem('mta_user') ? JSON.parse(localStorage.getItem('mta_user')) : null;

window.onload = function() {
    renderPurchasedGoods();
    checkUserAuthState();
    checkMaintenanceStatus();
    
    // Динамический расчет цены при изменении количества валюты
    const amountInput = document.getElementById('currency-amount');
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            let val = parseInt(this.value) || 1;
            if (val < 1) val = 1;
            
            let isDiscount = localStorage.getItem('mta_discount') === 'true';
            let pricePerMillion = isDiscount ? 150 : 200; // Пример со скидкой
            let total = val * pricePerMillion;
            
            const priceEl = document.getElementById('calc-price');
            if (priceEl) priceEl.innerText = `Итого: ${total} ₽ ${isDiscount ? '(Скидка!)' : ''}`;
        });
    }
};

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
}

// Выбор обычного товара
function selectProduct(name, price, link) {
    let isDiscount = localStorage.getItem('mta_discount') === 'true';
    if (isDiscount) {
        price = Math.round(price * 0.8); // Скидка 20% для примера
    }

    selectedProduct = name;
    selectedPrice = price;
    selectedLink = link;

    const textEl = document.getElementById('selected-product-text');
    if (textEl) {
        textEl.innerHTML = `Выбран товар: <b style="color: #00ffff;">${name}</b> — ${price} ₽`;
    }

    switchTab('payment');
}

// Открытие / закрытие модалки выбора валюты
function openCurrencyModal() {
    const modal = document.getElementById('currency-modal');
    if (modal) modal.style.display = 'flex';
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
    
    let isDiscount = localStorage.getItem('mta_discount') === 'true';
    let basePrice = millions * 200;
    selectedPrice = isDiscount ? Math.round(basePrice * 0.8) : basePrice;
    
    selectedProduct = `${millions} млн игровой валюты (Сервер №${server})`;
    selectedLink = `Выдача на сервере ${server}`;

    const textEl = document.getElementById('selected-product-text');
    if (textEl) {
        textEl.innerHTML = `Выбран товар: <b style="color: #00ffff;">${selectedProduct}</b> — ${selectedPrice} ₽`;
    }

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

// Логика авторизации (Админ: Admin / 6277)
function userAuthAction() {
    const loginInput = document.getElementById('user-login');
    const passInput = document.getElementById('user-pass');

    if (!loginInput || !loginInput.value.trim() || !passInput || !passInput.value.trim()) {
        alert('Заполните все поля!');
        return;
    }

    const username = loginInput.value.trim();
    const password = passInput.value.trim();

    if (username === 'Admin' && password === '6277') {
        currentUser = { username: 'Admin', isAdmin: true };
        alert('Вход в режим администратора выполнен!');
    } else if (isRegisterMode) {
        currentUser = { username: username, isAdmin: false };
        alert('Регистрация успешна!');
    } else {
        currentUser = { username: username, isAdmin: false };
        alert('Успешный вход!');
    }

    localStorage.setItem('mta_user', JSON.stringify(currentUser));
    checkUserAuthState();
    renderPurchasedGoods();
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
            currentUser = { username: saved, isAdmin: false };
        }

        if (authBox) authBox.style.display = 'none';
        if (cabinetBox) cabinetBox.style.display = 'block';
        if (usernameEl) {
            if (currentUser.isAdmin) {
                usernameEl.innerHTML = `${currentUser.username} <span style="color: #ef4444; font-size: 0.8rem;">(Админ)</span>`;
            } else {
                usernameEl.innerText = currentUser.username;
            }
        }
    } else {
        if (authBox) authBox.style.display = 'block';
        if (cabinetBox) cabinetBox.style.display = 'none';
    }
}

// Выход из аккаунта
function userLogout() {
    localStorage.removeItem('mta_user');
    currentUser = null;
    const loginInput = document.getElementById('user-login');
    const passInput = document.getElementById('user-pass');
    if (loginInput) loginInput.value = '';
    if (passInput) passInput.value = '';
    
    checkUserAuthState();
    renderPurchasedGoods();
    switchTab('cheats');
}

// Симуляция оплаты
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

    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    purchases.push({
        username: currentUser.username,
        product: selectedProduct,
        link: 'Ожидает выдачи администратором',
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem('mta_purchases', JSON.stringify(purchases));

    statusEl.style.display = 'block';
    statusEl.style.background = 'rgba(59, 130, 246, 0.2)';
    statusEl.style.color = '#3b82f6';
    statusEl.innerText = 'Заявка отправлена! Ожидайте проверки и выдачи товара в разделе «Мои товары».';

    renderPurchasedGoods();
}

// Отрисовка товаров в «Мои товары» + встроенная панель администратора
function renderPurchasedGoods() {
    const listEl = document.getElementById('purchased-list');
    if (!listEl) return;

    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    let html = '';

    // ЕСЛИ АДМИН — показываем панель управления прямо в «Моих товарах»
    if (currentUser && currentUser.isAdmin) {
        let isMaint = localStorage.getItem('mta_maintenance') === 'true';
        let isDisc = localStorage.getItem('mta_discount') === 'true';

        html += `
            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #ef4444; margin-bottom: 10px;">👑 Панель Администратора</h3>
                
                <div style="margin-bottom: 12px;">
                    <button type="button" class="btn-primary" onclick="adminToggleMaintenance()" style="background: ${isMaint ? '#22c55e' : '#f59e0b'}; padding: 8px; font-size: 0.9rem;">
                        🛠 Техработы: ${isMaint ? 'Включены (выключить)' : 'Выключены (включить)'}
                    </button>
                </div>

                <div style="margin-bottom: 15px;">
                    <button type="button" class="btn-primary" onclick="adminToggleDiscount()" style="background: ${isDisc ? '#22c55e' : '#8b5cf6'}; padding: 8px; font-size: 0.9rem;">
                        🔥 Скидки: ${isDisc ? 'Включены (-20%)' : 'Выключены'}
                    </button>
                </div>

                <h4 style="margin-bottom: 8px; font-size: 1rem; color: #fff;">Выдать товар пользователю:</h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <input type="text" id="admin-target-user" placeholder="Логин пользователя" style="padding: 8px; border-radius: 6px; border: 1px solid #444; background: #222; color: #fff;">
                    <input type="text" id="admin-target-product" placeholder="Название товара" style="padding: 8px; border-radius: 6px; border: 1px solid #444; background: #222; color: #fff;">
                    <input type="text" id="admin-target-link" placeholder="Ссылка / Данные выдачи" style="padding: 8px; border-radius: 6px; border: 1px solid #444; background: #222; color: #fff;">
                    <button type="button" class="btn-primary" onclick="adminIssueProduct()" style="background: #22c55e; padding: 8px; font-size: 0.9rem;">➕ Выдать товар</button>
                </div>
            </div>
            <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">
        `;
    }

    // Фильтруем товары для обычного юзера или показываем все для админа
    let userPurchases = purchases;
    if (!currentUser || !currentUser.isAdmin) {
        let currentLogin = currentUser ? currentUser.username : '';
        userPurchases = purchases.filter(item => item.username === currentLogin);
    }

    if (userPurchases.length === 0) {
        html += `<p style="color: #888;">Здесь появятся ваши товары после проверки оплаты администратором.</p>`;
    } else {
        userPurchases.forEach((item, index) => {
            html += `
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <p style="font-size: 0.8rem; color: #8b5cf6; margin-bottom: 3px;">Пользователь: <b>${item.username}</b></p>
                    <p style="font-weight: 700; color: #fff; margin-bottom: 5px;">${item.product}</p>
                    <p style="font-size: 0.9rem; color: #00ffff; margin-bottom: 5px;">Ссылка / Данные: <a href="${item.link}" target="_blank" style="color: #00ffff;">${item.link}</a></p>
                    <span style="font-size: 0.75rem; color: #666;">Дата: ${item.date}</span>
                    ${currentUser && currentUser.isAdmin ? `<button type="button" onclick="adminDeletePurchase(${index})" style="background: #ef4444; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; float: right; font-size: 0.75rem;">Удалить</button>` : ''}
                </div>
            `;
        });
    }

    listEl.innerHTML = html;
}

// Функции администратора
function adminToggleMaintenance() {
    let current = localStorage.getItem('mta_maintenance') === 'true';
    localStorage.setItem('mta_maintenance', (!current).toString());
    renderPurchasedGoods();
    checkMaintenanceStatus();
}

function checkMaintenanceStatus() {
    let isMaint = localStorage.getItem('mta_maintenance') === 'true';
    if (isMaint) {
        document.body.style.opacity = '0.4';
        alert('Внимание: Сайт находится в режиме технических работ!');
    } else {
        document.body.style.opacity = '1';
    }
}

function adminToggleDiscount() {
    let current = localStorage.getItem('mta_discount') === 'true';
    localStorage.setItem('mta_discount', (!current).toString());
    alert(`Скидки ${!current ? 'включены' : 'выключены'}!`);
    renderPurchasedGoods();
}

function adminIssueProduct() {
    const user = document.getElementById('admin-target-user').value.trim();
    const product = document.getElementById('admin-target-product').value.trim();
    const link = document.getElementById('admin-target-link').value.trim();

    if (!user || !product || !link) {
        alert('Заполните все поля для выдачи товара!');
        return;
    }

    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    purchases.push({
        username: user,
        product: product,
        link: link,
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem('mta_purchases', JSON.stringify(purchases));

    alert('Товар успешно выдан пользователю!');
    renderPurchasedGoods();
}

function adminDeletePurchase(index) {
    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    purchases.splice(index, 1);
    localStorage.setItem('mta_purchases', JSON.stringify(purchases));
    renderPurchasedGoods();
}
