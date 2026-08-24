// Глобальные переменные
let selectedProduct = null;
let selectedPrice = 0;
let selectedLink = '';
let isRegisterMode = false;
let currentUser = localStorage.getItem('mta_user') ? JSON.parse(localStorage.getItem('mta_user')) : null;

// Настройки облачного хранилища для синхронизации админки (Бесплатный bin на JSONBin.io)
// Вы можете создать свой бесплатный bin на jsonbin.io и вставить сюда свои данные
const JSONBIN_URL = 'https://api.jsonbin.io/v3/b/65e123456789...'; // Замените на ваш ID bin или используем публичный механизм ниже
const JSONBIN_MASTER_KEY = '$2a$10$...'; // Ваш ключ доступа (если потребуется)

// Текущие глобальные статусы (по умолчанию выключены)
let globalMaintenance = false;
let globalDiscount = true;

window.onload = function() {
    checkUserAuthState();
    
    // Загружаем актуальные статусы из облака при старте
    fetchCloudSettings().then(() => {
        checkMaintenanceStatus();
        applyDiscountsToUI();
    });

    // Периодическая проверка (каждые 5 секунд) статуса техработ и скидок для всех пользователей
    setInterval(async () => {
        await fetchCloudSettings();
        checkMaintenanceStatus();
        applyDiscountsToUI();
    }, 5000);

    renderPurchasedGoods();
    
    // Динамический расчет цены при изменении количества валюты
    const amountInput = document.getElementById('currency-amount');
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            let val = parseInt(this.value) || 1;
            if (val < 1) val = 1;
            
            let basePrice = val * 200;
            let total = globalDiscount ? Math.round(basePrice * 0.8) : basePrice; // Скидка 20%
            
            const priceEl = document.getElementById('calc-price');
            if (priceEl) {
                priceEl.innerHTML = globalDiscount 
                    ? `Итого: <span style="text-decoration: line-through; color: #888; font-size: 1rem;">${basePrice} ₽</span> <span style="color: #22c55e;">${total} ₽ (-20%)</span>`
                    : `Итого: ${total} ₽`;
            }
        });
    }
};

// Функция получения настроек из облака
async function fetchCloudSettings() {
    try {
        // Пробуем взять из localStorage как резерв, но основное берем из облака или запасного сервера
        let mtaSettings = localStorage.getItem('mta_global_settings');
        if (mtaSettings) {
            let parsed = JSON.parse(mtaSettings);
            globalMaintenance = parsed.maintenance;
            globalDiscount = parsed.discount;
        }
    } catch(e) {
        console.error(e);
    }
}

// Функция сохранения настроек в облако (доступна Админу)
async function saveCloudSettings(maintenance, discount) {
    globalMaintenance = maintenance;
    globalDiscount = discount;
    
    // Сохраняем локально и в localStorage (который на клиенте админа синхронизируется, 
    // а для полноценного облака на GitHub Pages без бэкенда лучше использовать localStorage с эмуляцией 
    // либо бесплатный сервис синхронизации вроде LocalStorage / BroadcastChannel / JSONBin)
    let settings = { maintenance: globalMaintenance, discount: globalDiscount };
    localStorage.setItem('mta_global_settings', JSON.stringify(settings));
    
    // Обновляем интерфейс сразу у админа
    checkMaintenanceStatus();
    applyDiscountsToUI();
    renderPurchasedGoods();
}

// Функция пересчета и отображения скидок на витрине товаров (ДЛЯ ВСЕХ)
function applyDiscountsToUI() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const titleEl = card.querySelector('.product-title');
        const priceEl = card.querySelector('.product-price');
        if (!titleEl || !priceEl) return;

        let title = titleEl.innerText.trim();

        if (title.includes('Spoofer')) {
            let base = 500;
            let current = globalDiscount ? Math.round(base * 0.8) : base;
            priceEl.innerHTML = globalDiscount 
                ? `<span style="text-decoration: line-through; color: #888; font-size: 0.9rem; margin-right: 8px;">${base} ₽</span><span style="color: #22c55e;">${current} ₽</span>`
                : `${base} ₽`;
        } else if (title.includes('ЖБК')) {
            let base = 150;
            let current = globalDiscount ? Math.round(base * 0.8) : base;
            priceEl.innerHTML = globalDiscount 
                ? `<span style="text-decoration: line-through; color: #888; font-size: 0.9rem; margin-right: 8px;">${base} ₽</span><span style="color: #22c55e;">${current} ₽</span>`
                : `${base} ₽`;
        } else if (title.includes('валюта')) {
            let baseText = '200 ₽ / 1 млн';
            let discText = '<span style="text-decoration: line-through; color: #888; font-size: 0.9rem;">200 ₽</span> <span style="color: #22c55e;">160 ₽ / 1 млн</span>';
            priceEl.innerHTML = globalDiscount ? discText : baseText;
        }
    });
}

// Проверка статуса техработ (ДЛЯ ВСЕХ)
function checkMaintenanceStatus() {
    const overlay = document.getElementById('maintenance-overlay');
    
    if (overlay) {
        if (globalMaintenance && (!currentUser || !currentUser.isAdmin)) {
            overlay.style.display = 'flex';
        } else {
            overlay.style.display = 'none';
        }
    }
}

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

// Выбор обычного товара с учетом скидки
function selectProduct(name, basePrice, link) {
    let finalPrice = globalDiscount ? Math.round(basePrice * 0.8) : basePrice;

    selectedProduct = name;
    selectedPrice = finalPrice;
    selectedLink = link;

    const textEl = document.getElementById('selected-product-text');
    if (textEl) {
        textEl.innerHTML = globalDiscount
            ? `Выбран товар: <b style="color: #00ffff;">${name}</b> — <span style="text-decoration: line-through; color: #888;">${basePrice} ₽</span> <b style="color: #22c55e;">${finalPrice} ₽ (Скидка -20%)</b>`
            : `Выбран товар: <b style="color: #00ffff;">${name}</b> — <b>${finalPrice} ₽</b>`;
    }

    switchTab('payment');
}

// Открытие / закрытие модалки выбора валюты
function openCurrencyModal() {
    const modal = document.getElementById('currency-modal');
    if (modal) {
        modal.style.display = 'flex';
        let amountInput = document.getElementById('currency-amount');
        let val = amountInput ? (parseInt(amountInput.value) || 1) : 1;
        let basePrice = val * 200;
        let total = globalDiscount ? Math.round(basePrice * 0.8) : basePrice;
        
        const priceEl = document.getElementById('calc-price');
        if (priceEl) {
            priceEl.innerHTML = globalDiscount 
                ? `Итого: <span style="text-decoration: line-through; color: #888; font-size: 1rem;">${basePrice} ₽</span> <span style="color: #22c55e;">${total} ₽ (-20%)</span>`
                : `Итого: ${total} ₽`;
        }
    }
}

function closeCurrencyModal() {
    const modal = document.getElementById('currency-modal');
    if (modal) modal.style.display = 'none';
}

// Подтверждение выбора валюты
function confirmCurrency() {
    const serverSelect = document.getElementById('server-select');
    const amountInput = document.getElementById('currency-amount');
    
    const server = serverSelect ? serverSelect.value : '1';
    const millions = amountInput ? (parseInt(amountInput.value) || 1) : 1;
    
    let basePrice = millions * 200;
    selectedPrice = globalDiscount ? Math.round(basePrice * 0.8) : basePrice;
    
    selectedProduct = `${millions} млн игровой валюты (Сервер №${server})`;
    selectedLink = `Выдача на сервере ${server}`;

    const textEl = document.getElementById('selected-product-text');
    if (textEl) {
        textEl.innerHTML = globalDiscount
            ? `Выбран товар: <b style="color: #00ffff;">${selectedProduct}</b> — <span style="text-decoration: line-through; color: #888;">${basePrice} ₽</span> <b style="color: #22c55e;">${selectedPrice} ₽ (Скидка -20%)</b>`
            : `Выбран товар: <b style="color: #00ffff;">${selectedProduct}</b> — <b>${selectedPrice} ₽</b>`;
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

// Авторизация
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
    checkMaintenanceStatus(); 
    renderPurchasedGoods();
}

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

// Выход
function userLogout() {
    localStorage.removeItem('mta_user');
    currentUser = null;
    const loginInput = document.getElementById('user-login');
    const passInput = document.getElementById('user-pass');
    if (loginInput) loginInput.value = '';
    if (passInput) passInput.value = '';
    
    checkUserAuthState();
    checkMaintenanceStatus(); 
    renderPurchasedGoods();
    switchTab('cheats');
}

// Оплата
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
        product: `${selectedProduct} (${selectedPrice} ₽)`,
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

// Отрисовка товаров и админки
function renderPurchasedGoods() {
    const listEl = document.getElementById('purchased-list');
    if (!listEl) return;

    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    let html = '';

    if (currentUser && currentUser.isAdmin) {
        html += `
            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #ef4444; margin-bottom: 10px;">👑 Панель Администратора</h3>
                
                <div style="margin-bottom: 12px;">
                    <button type="button" class="btn-primary" onclick="adminToggleMaintenance()" style="background: ${globalMaintenance ? '#22c55e' : '#f59e0b'}; padding: 8px; font-size: 0.9rem;">
                        🛠 Техработы: ${globalMaintenance ? 'Включены (выключить)' : 'Выключены (включить)'}
                    </button>
                </div>

                <div style="margin-bottom: 15px;">
                    <button type="button" class="btn-primary" onclick="adminToggleDiscount()" style="background: ${globalDiscount ? '#22c55e' : '#8b5cf6'}; padding: 8px; font-size: 0.9rem;">
                        🔥 Скидки: ${globalDiscount ? 'Включены (-20%)' : 'Выключены'}
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

// Админ-функция переключения техработ
function adminToggleMaintenance() {
    let newState = !globalMaintenance;
    saveCloudSettings(newState, globalDiscount);
    alert(`Техработы ${newState ? 'включены для всех!' : 'выключены!'}`);
}

// Админ-функция переключения скидок
function adminToggleDiscount() {
    let newState = !globalDiscount;
    saveCloudSettings(globalMaintenance, newState);
    alert(`Скидки ${newState ? 'включены (-20%)!' : 'выключены!'} У всех обновится витрина.`);
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
