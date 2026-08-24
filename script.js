let selectedProduct = null;
let currentUser = localStorage.getItem('valerskiy_user') || null;

window.onload = function() {
    updateAuthUI();
};

// Переключение вкладок
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.custom-nav-tabs button').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    
    let btnId = 'nav-cheats';
    if(tabId === 'payment') btnId = 'nav-payment';
    if(tabId === 'my-goods') btnId = 'nav-goods';
    if(tabId === 'profile') btnId = 'nav-profile';
    
    let targetNavBtn = document.getElementById(btnId);
    if(targetNavBtn) targetNavBtn.classList.add('active');
}

// Выбор товара из каталога
function selectProduct(name, price, link) {
    selectedProduct = { name, price, link };
    document.getElementById('selected-product-text').innerHTML = `Выбран товар: <b>${name}</b> (${price} ₽)`;
    switchTab('payment');
}

// Имитация оплаты
function simulatePayment() {
    if (!selectedProduct) {
        alert("Сначала выберите товар!");
        switchTab('cheats');
        return;
    }
    let msg = document.getElementById('status-message');
    msg.style.display = 'block';
    msg.style.color = 'var(--accent-cyan)';
    msg.innerHTML = `Заказ на «${selectedProduct.name}» создан. Ожидание оплаты...`;
}

// Авторизация профиля
function userAuthAction() {
    let loginInput = document.getElementById('user-login').value.trim();
    if (!loginInput) {
        alert("Введите логин!");
        return;
    }

    currentUser = loginInput;
    localStorage.setItem('valerskiy_user', currentUser);
    updateAuthUI();
    alert(`Добро пожаловать, ${currentUser}!`);
}

function userLogout() {
    currentUser = null;
    localStorage.removeItem('valerskiy_user');
    updateAuthUI();
    switchTab('cheats');
}

function updateAuthUI() {
    let authBox = document.getElementById('user-auth-box');
    let cabinetBox = document.getElementById('user-cabinet-box');

    if (currentUser) {
        if(authBox) authBox.style.display = 'none';
        if(cabinetBox) cabinetBox.style.display = 'block';
        let usernameEl = document.getElementById('current-username');
        if(usernameEl) usernameEl.innerText = currentUser;
    } else {
        if(authBox) authBox.style.display = 'block';
        if(cabinetBox) cabinetBox.style.display = 'none';
    }
}
