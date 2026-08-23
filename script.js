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

    if (l === 'Admin' && p === '6277') {
        currentUser = 'Admin';
        localStorage.setItem('mta_current_user', 'Admin');
        checkUserSession();
        alert('Успешный вход в панель администратора!');
        renderPurchasedGoods();
        return;
    }

    let users = JSON.parse(localStorage.getItem('mta_site_users') || '{}');

    if (isUserRegMode) {
        if (l === 'Admin') {
            alert('Этот логин зарезервирован!');
            return;
        }
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
            renderPurchasedGoods();
        } else {
            alert('Неверный логин или пароль!');
        }
    }
}

function userLogout() {
    currentUser = null;
    localStorage.removeItem('mta_current_user');
    checkUserSession();
    
    let container = document.getElementById('purchased-list');
    if (container) {
        container.innerHTML = `<p style="color: #888;">Войдите в свой аккаунт, чтобы увидеть товар.</p>`;
    }
}

function checkUserSession() {
    currentUser = localStorage.getItem('mta_current_user');
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
    currentUser = localStorage.getItem('mta_current_user');
    if (!currentUser) {
        alert('Сначала войдите в личный кабинет или зарегистрируйтесь!');
        switchTab('profile');
        return;
    }
    localStorage.setItem('mta_current_order', `${name} - ${price}р`);
    localStorage.setItem('mta_current_link', downloadLink || '#');
    updateSelectedProductText();
    switchTab('payment');
}

function openCurrencyModal() {
    currentUser = localStorage.getItem('mta_current_user');
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
    localStorage.setItem('mta_current_link', '#');
    closeCurrencyModal();
    updateSelectedProductText();
    switchTab('payment');
}

// Отправка заявки в Telegram с точным текстом предупреждения
function simulatePayment() {
    currentUser = localStorage.getItem('mta_current_user');
    let savedOrder = localStorage.getItem('mta_current_order');
    if (!savedOrder) {
        alert('Сначала выберите товар!');
        return;
    }
    
    let username = currentUser || 'Гость';
    let token = '8659237947:AAHQu9Y1_450Cq2jQY7ISaIqHsmmvaKvIE4';
    let chatId = '755271846';

    let text = `🔔 Новая заявка на оплату!\n\n👤 Покупатель: ${username}\n🛒 Товар: ${savedOrder}\n\n⚠️ Проверьте Т-Банк и выдайте товар в админ-панели на сайте.`;
    
    let url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=` + encodeURIComponent(text);
    
    let img = new Image();
    img.src = url;

    let statusArea = document.getElementById('status-message');
    if (statusArea) {
        statusArea.style.display = 'block';
        statusArea.style.border = '1px solid #ff4444';
        statusArea.style.padding = '15px';
        statusArea.style.borderRadius = '10px';
        statusArea.style.background = 'rgba(255, 68, 68, 0.1)';
        statusArea.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <h2 style="color: #ff3333; font-size: 1.4rem; text-transform: uppercase; font-weight: 900; line-height: 1.4; margin: 0;">
                    🚨 УВАЖАЕМЫЙ ПОКУПАТЕЛЬ!!!<br>Включите VPN и нажмите кнопку «Я оплатил»!!<br>БЕЗ VPN Ваш товар не подтверждается и не отображается!!! 🚨
                </h2>
            </div>
            <p style="text-align: center; font-size: 1.1rem; color: #fff; margin-top: 10px;">
                ⏳ <b>Заявка отправлена в Telegram!</b> Администратор проверяет поступление средств.
            </p>
        `;
    }
}

// Отображение товаров и админ-панели
function renderPurchasedGoods() {
    let container = document.getElementById('purchased-list');
    if (!container) return;

    currentUser = localStorage.getItem('mta_current_user');
    if (!currentUser) {
        container.innerHTML = `<p style="color: #888;">Войдите в свой аккаунт, чтобы увидеть товар.</p>`;
        return;
    }

    let allUsersGoods = JSON.parse(localStorage.getItem('mta_users_goods') || '{}');
    let myGoods = allUsersGoods[currentUser] || [];

    let html = '';

    if (currentUser === 'Admin') {
        html += `
            <div style="background: rgba(255, 0, 0, 0.1); border: 1px solid #ff4444; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <p style="color: #ff4444; font-weight: bold; margin-bottom: 10px;">👑 Админ-панель (Ручная выдача)</p>
                <input type="text" id="admin-target-user" placeholder="Логин игрока (кому выдать)" style="width: 100%; padding: 8px; margin-bottom: 8px; background: #222; border: 1px solid #444; color: #fff; border-radius: 5px;">
                <input type="text" id="admin-target-item" placeholder="Название товара (например: Читы - 500р)" style="width: 100%; padding: 8px; margin-bottom: 8px; background: #222; border: 1px solid #444; color: #fff; border-radius: 5px;">
                <input type="text" id="admin-target-link" placeholder="Ссылка на скачивание / получение" style="width: 100%; padding: 8px; margin-bottom: 10px; background: #222; border: 1px solid #444; color: #fff; border-radius: 5px;">
                <button onclick="adminGiveProduct()" style="background: #28a745; color: #fff; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%;">✅ Выдать товар игроку</button>
            </div>
        `;
    }

    if (myGoods.length === 0) {
        html += `<p style="color: #888;">У вас пока нет купленных товаров.</p>`;
    } else {
        myGoods.forEach(item => {
            html += `
                <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid #444; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <p style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: #00ffff;">${item.name}</p>
                    <a href="${item.link}" target="_blank" class="btn-primary" style="display: inline-block; text-align: center; text-decoration: none; padding: 10px 20px; font-size: 0.9rem;">📥 Скачать / Получить</a>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}

function adminGiveProduct() {
    let targetUser = document.getElementById('admin-target-user').value.trim();
    let targetItem = document.getElementById('admin-target-item').value.trim();
    let targetLink = document.getElementById('admin-target-link').value.trim() || '#';

    if (!targetUser || !targetItem) {
        alert('Заполните логин игрока и название товара!');
        return;
    }

    let allUsersGoods = JSON.parse(localStorage.getItem('mta_users_goods') || '{}');
    if (!allUsersGoods[targetUser]) {
        allUsersGoods[targetUser] = [];
    }

    allUsersGoods[targetUser].push({ name: targetItem, link: targetLink });
    localStorage.setItem('mta_users_goods', JSON.stringify(allUsersGoods));

    alert(`Товар успешно выдан игроку ${targetUser}!`);
    renderPurchasedGoods();
}
