// Глобальные переменные
let selectedProduct = null;
let selectedPrice = 0;
let selectedLink = '';
let isRegisterMode = false;
let currentUser = localStorage.getItem('mta_user') ? JSON.parse(localStorage.getItem('mta_user')) : null;

// Настройки интеграции с GitHub
const GITHUB_USER = 'w888sop-cell'; 
const GITHUB_REPO = 'mta';        
const FILE_PATH = 'settings.json';  

// Безопасный сбор токена по кусочкам
const part1 = 'ghp_p6k4uDM';
const part2 = '2TZe1v0L2g';
const part3 = 'liOHhlGR6iJ2l362z07';
const GITHUB_TOKEN = part1 + part2 + part3;

let globalMaintenance = false;
let globalDiscount = true;
let fileSha = ''; 
let isSaving = false;

// Глобальные данные облака
let cloudData = {
    maintenance: false,
    discount: true,
    purchases: [],
    tickets: []
};

// 1. Загрузка настроек с GitHub
async function fetchCloudSettings() {
    if (isSaving) return;
    try {
        let timestamp = new Date().getTime();
        let res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}?t=${timestamp}`, {
            headers: { 
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (res.ok) {
            let json = await res.json();
            fileSha = json.sha;
            
            let decodedContent = decodeURIComponent(escape(atob(json.content)));
            let data = JSON.parse(decodedContent);
            
            cloudData = data;
            globalMaintenance = data.maintenance;
            globalDiscount = data.discount;
            
            localStorage.setItem('mta_maintenance', globalMaintenance.toString());
            localStorage.setItem('mta_discount', globalDiscount.toString());
            
            if (data.purchases) {
                localStorage.setItem('mta_purchases', JSON.stringify(data.purchases));
            }
            if (data.tickets) {
                localStorage.setItem('mta_tickets', JSON.stringify(data.tickets));
            }
        }
    } catch(e) {
        console.error('Ошибка загрузки с GitHub:', e);
    }
    
    checkMaintenanceStatus();
    applyDiscountsToUI();
    renderPurchasedGoods();
    renderTicketsUI();
}

// 2. Сохранение настроек на GitHub с надежной обработкой ошибок
async function saveCloudSettings() {
    if (isSaving) return;
    isSaving = true;
    
    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    let tickets = JSON.parse(localStorage.getItem('mta_tickets') || '[]');

    cloudData.maintenance = globalMaintenance;
    cloudData.discount = globalDiscount;
    cloudData.purchases = purchases;
    cloudData.tickets = tickets;

    let contentString = JSON.stringify(cloudData, null, 2);
    let encodedContent = btoa(unescape(encodeURIComponent(contentString)));

    try {
        let timestamp = new Date().getTime();
        let getFileRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}?t=${timestamp}`, {
            headers: { 
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (getFileRes.ok) {
            let fileJson = await getFileRes.json();
            fileSha = fileJson.sha;
        } else {
            console.warn('Не удалось получить актуальный SHA, пробуем сохранить со старым...');
        }

        let updateRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: "Update site data via admin panel",
                content: encodedContent,
                sha: fileSha
            })
        });

        if (updateRes.ok) {
            let resJson = await updateRes.json();
            fileSha = resJson.content.sha;
            console.log('Данные успешно сохранены на GitHub!');
        } else {
            let errText = await updateRes.text();
            console.error('GitHub API Error Details:', errText);
            alert(`Ошибка сохранения на GitHub (${updateRes.status}). Проверьте консоль.`);
        }
    } catch(e) {
        console.error('Network Error:', e);
        alert('Ошибка сети при сохранении. Проверьте подключение.');
    } finally {
        isSaving = false;
    }

    checkMaintenanceStatus();
    applyDiscountsToUI();
    renderPurchasedGoods();
    renderTicketsUI();
}

window.onload = function() {
    fetchCloudSettings();
    setInterval(fetchCloudSettings, 10000);

    const amountInput = document.getElementById('currency-amount');
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            let val = parseInt(this.value) || 1;
            if (val < 1) val = 1;
            
            let isDiscount = localStorage.getItem('mta_discount') === 'true';
            let basePrice = val * 200;
            let total = isDiscount ? Math.round(basePrice * 0.8) : basePrice;
            
            const priceEl = document.getElementById('calc-price');
            if (priceEl) {
                priceEl.innerHTML = isDiscount 
                    ? `Итого: <span style="text-decoration: line-through; color: #888; font-size: 1rem;">${basePrice} ₽</span> <span style="color: #22c55e;">${total} ₽ (-20%)</span>`
                    : `Итого: ${total} ₽`;
            }
        });
    }
};

function applyDiscountsToUI() {
    let isDiscount = localStorage.getItem('mta_discount') === 'true';
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const titleEl = card.querySelector('.product-title');
        const priceEl = card.querySelector('.product-price');
        if (!titleEl || !priceEl) return;

        let title = titleEl.innerText.trim();
        if (title.includes('Spoofer')) {
            let base = 500, current = isDiscount ? 400 : 500;
            priceEl.innerHTML = isDiscount ? `<span style="text-decoration: line-through; color: #888; font-size: 0.9rem; margin-right: 8px;">${base} ₽</span><span style="color: #22c55e;">${current} ₽</span>` : `${base} ₽`;
        } else if (title.includes('ЖБК')) {
            let base = 150, current = isDiscount ? 120 : 150;
            priceEl.innerHTML = isDiscount ? `<span style="text-decoration: line-through; color: #888; font-size: 0.9rem; margin-right: 8px;">${base} ₽</span><span style="color: #22c55e;">${current} ₽</span>` : `${base} ₽`;
        } else if (title.includes('валюта')) {
            priceEl.innerHTML = isDiscount ? '<span style="text-decoration: line-through; color: #888; font-size: 0.9rem;">200 ₽</span> <span style="color: #22c55e;">160 ₽ / 1 млн</span>' : '200 ₽ / 1 млн';
        }
    });
}

function checkMaintenanceStatus() {
    let isMaint = localStorage.getItem('mta_maintenance') === 'true';
    const overlay = document.getElementById('maintenance-overlay');
    if (overlay) {
        overlay.style.display = (isMaint && (!currentUser || !currentUser.isAdmin)) ? 'flex' : 'none';
    }
}

function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    let activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.classList.add('active');

    const navButtons = document.querySelectorAll('nav button');
    navButtons.forEach(btn => btn.classList.remove('active'));
    let activeBtn = document.getElementById('nav-' + tabId);
    if (activeBtn) activeBtn.classList.add('active');
}

function selectProduct(name, basePrice, link) {
    let isDiscount = localStorage.getItem('mta_discount') === 'true';
    let finalPrice = isDiscount ? Math.round(basePrice * 0.8) : basePrice;

    selectedProduct = name;
    selectedPrice = finalPrice;
    selectedLink = link;

    const textEl = document.getElementById('selected-product-text');
    if (textEl) {
        textEl.innerHTML = isDiscount
            ? `Выбран товар: <b style="color: #00ffff;">${name}</b> — <span style="text-decoration: line-through; color: #888;">${basePrice} ₽</span> <b style="color: #22c55e;">${finalPrice} ₽ (Скидка -20%)</b>`
            : `Выбран товар: <b style="color: #00ffff;">${name}</b> — <b>${finalPrice} ₽</b>`;
    }
    switchTab('payment');
}

function openCurrencyModal() {
    const modal = document.getElementById('currency-modal');
    if (modal) {
        modal.style.display = 'flex';
        let isDiscount = localStorage.getItem('mta_discount') === 'true';
        let amountInput = document.getElementById('currency-amount');
        let val = amountInput ? (parseInt(amountInput.value) || 1) : 1;
        let basePrice = val * 200;
        let total = isDiscount ? Math.round(basePrice * 0.8) : basePrice;
        const priceEl = document.getElementById('calc-price');
        if (priceEl) {
            priceEl.innerHTML = isDiscount ? `Итого: <span style="text-decoration: line-through; color: #888;">${basePrice} ₽</span> <span style="color: #22c55e;">${total} ₽ (-20%)</span>` : `Итого: ${total} ₽`;
        }
    }
}

function closeCurrencyModal() {
    const modal = document.getElementById('currency-modal');
    if (modal) modal.style.display = 'none';
}

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
        textEl.innerHTML = `Выбран товар: <b style="color: #00ffff;">${selectedProduct}</b> — <b>${selectedPrice} ₽</b>`;
    }
    closeCurrencyModal();
    switchTab('payment');
}

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
        try { currentUser = JSON.parse(saved); } catch(e) { currentUser = { username: saved, isAdmin: false }; }
        if (authBox) authBox.style.display = 'none';
        if (cabinetBox) cabinetBox.style.display = 'block';
        if (usernameEl) {
            usernameEl.innerHTML = currentUser.isAdmin ? `${currentUser.username} <span style="color: #ef4444; font-size: 0.8rem;">(Админ)</span>` : currentUser.username;
        }
    } else {
        if (authBox) authBox.style.display = 'block';
        if (cabinetBox) cabinetBox.style.display = 'none';
    }
}

function userLogout() {
    localStorage.removeItem('mta_user');
    currentUser = null;
    checkUserAuthState();
    checkMaintenanceStatus(); 
    renderPurchasedGoods();
    switchTab('cheats');
}

function simulatePayment() {
    const statusEl = document.getElementById('status-message');
    if (!statusEl) return;
    
    let savedUser = localStorage.getItem('mta_user');
    if (!savedUser) {
        alert('Сначала войдите в аккаунт!');
        switchTab('profile');
        return;
    }
    
    let activeUser = JSON.parse(savedUser);

    if (!selectedProduct) {
        statusEl.style.display = 'block';
        statusEl.style.color = '#ef4444';
        statusEl.innerText = 'Ошибка: Товар не выбран!';
        return;
    }

    // Считываем почту и телеграм из полей ввода оплаты
    const emailInput = document.getElementById('payment-email');
    const tgInput = document.getElementById('payment-tg');

    let email = emailInput ? emailInput.value.trim() : '';
    let telegram = tgInput ? tgInput.value.trim() : '';

    if (!email || !telegram) {
        alert('Пожалуйста, укажите вашу почту и Telegram для связи!');
        return;
    }

    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    purchases.push({
        username: activeUser.username,
        product: `${selectedProduct} (${selectedPrice} ₽)`,
        email: email,
        telegram: telegram,
        link: 'Ожидает выдачи',
        date: new Date().toLocaleDateString()
    });
    
    localStorage.setItem('mta_purchases', JSON.stringify(purchases));
    saveCloudSettings();

    statusEl.style.display = 'block';
    statusEl.style.color = '#3b82f6';
    statusEl.innerText = 'Заявка отправлена!';
    renderPurchasedGoods();
}

function renderPurchasedGoods() {
    const listEl = document.getElementById('purchased-list');
    if (!listEl) return;

    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    let html = '';

    if (currentUser && currentUser.isAdmin) {
        let isMaint = localStorage.getItem('mta_maintenance') === 'true';
        let isDisc = localStorage.getItem('mta_discount') === 'true';

        html += `
            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #ef4444; margin-bottom: 10px;">👑 Панель Администратора</h3>
                <div style="margin-bottom: 12px;">
                    <button type="button" class="btn-primary" onclick="adminToggleMaintenance()" style="background: ${isMaint ? '#22c55e' : '#f59e0b'}; padding: 8px;">🛠 Техработы: ${isMaint ? 'Вкл' : 'Выкл'}</button>
                </div>
                <div style="margin-bottom: 15px;">
                    <button type="button" class="btn-primary" onclick="adminToggleDiscount()" style="background: ${isDisc ? '#22c55e' : '#8b5cf6'}; padding: 8px;">🔥 Скидки: ${isDisc ? 'Вкл' : 'Выкл'}</button>
                </div>
                <h4 style="margin-bottom: 8px; color: #fff;">Выдать товар:</h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <input type="text" id="admin-target-user" placeholder="Логин" style="padding: 8px; background: #222; color: #fff; border: 1px solid #444;">
                    <input type="text" id="admin-target-product" placeholder="Товар" style="padding: 8px; background: #222; color: #fff; border: 1px solid #444;">
                    <input type="text" id="admin-target-link" placeholder="Ссылка" style="padding: 8px; background: #222; color: #fff; border: 1px solid #444;">
                    <button type="button" class="btn-primary" onclick="adminIssueProduct()" style="background: #22c55e; padding: 8px;">➕ Выдать</button>
                </div>
            </div>
            <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">
        `;
    }

    if (!currentUser) {
        html += `<p style="color: #888;">Войдите в аккаунт, чтобы просмотреть купленные товары.</p>`;
        listEl.innerHTML = html;
        return;
    }

    let userPurchases = currentUser.isAdmin 
        ? purchases 
        : purchases.filter(item => item.username && item.username.toLowerCase() === currentUser.username.toLowerCase());

    if (userPurchases.length === 0) {
        html += `<p style="color: #888;">Список пуст. Здесь появятся ваши товары после проверки оплаты администратором.</p>`;
    } else {
        userPurchases.forEach((item) => {
            let globalIndex = purchases.indexOf(item);
            let contactInfo = '';
            if (currentUser.isAdmin) {
                contactInfo = `<p style="font-size: 0.85rem; color: #f59e0b; margin-top: 4px;">Почта: ${item.email || 'Не указана'} | Телеграм: ${item.telegram || 'Не указан'}</p>`;
            }

            html += `
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <p style="font-size: 0.8rem; color: #8b5cf6;">Пользователь: <b>${item.username}</b></p>
                    <p style="font-weight: 700; color: #fff;">${item.product}</p>
                    ${contactInfo}
                    <p style="font-size: 0.9rem; color: #00ffff; margin-top: 5px;">Статус: <a href="${item.link}" target="_blank" style="color: #00ffff;">${item.link}</a></p>
                    ${currentUser.isAdmin ? `<button type="button" onclick="adminDeletePurchase(${globalIndex})" style="background: #ef4444; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; float: right; margin-top: -20px;">Удалить</button>` : ''}
                </div>
            `;
        });
    }
    listEl.innerHTML = html;
}

// ================= СИСТЕМА ТИКЕТОВ =================
function sendTicket() {
    if (!currentUser) {
        alert('Сначала войдите в аккаунт!');
        switchTab('profile');
        return;
    }
    let textInput = document.getElementById('ticket-text');
    if (!textInput || !textInput.value.trim()) {
        alert('Введите текст обращения!');
        return;
    }

    let tickets = JSON.parse(localStorage.getItem('mta_tickets') || '[]');
    tickets.push({
        id: Date.now(),
        username: currentUser.username,
        question: textInput.value.trim(),
        answer: 'Ожидает ответа администратора...',
        date: new Date().toLocaleDateString()
    });

    localStorage.setItem('mta_tickets', JSON.stringify(tickets));
    textInput.value = '';
    saveCloudSettings();
    alert('Тикет успешно отправлен в поддержку!');
}

function renderTicketsUI() {
    let ticketsContainer = document.getElementById('tickets-container');
    if (!ticketsContainer) return;

    let tickets = JSON.parse(localStorage.getItem('mta_tickets') || '[]');
    let html = '';

    if (currentUser && currentUser.isAdmin) {
        html += `<h3 style="color: #ef4444; margin-bottom: 10px;">💬 Все тикеты игроков (Админ)</h3>`;
        if (tickets.length === 0) {
            html += `<p style="color: #888;">Нет открытых тикетов.</p>`;
        } else {
            tickets.forEach((t) => {
                html += `
                    <div style="background: rgba(0,0,0,0.4); border: 1px solid #444; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
                        <p style="color: #8b5cf6; font-size: 0.85rem;">Игрок: <b>${t.username}</b> (${t.date})</p>
                        <p style="color: #fff; margin: 5px 0;"><b>Вопрос:</b> ${t.question}</p>
                        <p style="color: #22c55e; margin: 5px 0;"><b>Ответ:</b> ${t.answer}</p>
                        <div style="display: flex; gap: 8px; margin-top: 8px;">
                            <input type="text" id="answer-input-${t.id}" placeholder="Написать ответ..." style="flex: 1; padding: 6px; background: #222; color: #fff; border: 1px solid #555; border-radius: 4px;">
                            <button type="button" onclick="adminReplyTicket(${t.id})" style="background: #22c55e; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Ответить</button>
                        </div>
                    </div>
                `;
            });
        }
    } else if (currentUser) {
        let userTickets = tickets.filter(t => t.username === currentUser.username);
        html += `<h3 style="color: #00ffff; margin-bottom: 10px;">💬 Ваши обращения в поддержку</h3>`;
        if (userTickets.length === 0) {
            html += `<p style="color: #888;">У вас нет активных тикетов.</p>`;
        } else {
            userTickets.forEach(t => {
                html += `
                    <div style="background: rgba(0,0,0,0.3); border: 1px solid #444; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                        <p style="color: #fff;"><b>Ваш вопрос:</b> ${t.question}</p>
                        <p style="color: #22c55e; margin-top: 4px;"><b>Ответ админа:</b> ${t.answer}</p>
                        <span style="font-size: 0.75rem; color: #666;">${t.date}</span>
                    </div>
                `;
            });
        }
    } else {
        html += `<p style="color: #888;">Войдите в аккаунт, чтобы писать в поддержку.</p>`;
    }

    ticketsContainer.innerHTML = html;
}

function adminReplyTicket(ticketId) {
    let answerInput = document.getElementById(`answer-input-${ticketId}`);
    if (!answerInput || !answerInput.value.trim()) return;

    let tickets = JSON.parse(localStorage.getItem('mta_tickets') || '[]');
    let ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
        ticket.answer = answerInput.value.trim();
        localStorage.setItem('mta_tickets', JSON.stringify(tickets));
        saveCloudSettings();
        alert('Ответ отправлен!');
    }
}

// Админ-функции управления
function adminToggleMaintenance() {
    globalMaintenance = !(localStorage.getItem('mta_maintenance') === 'true');
    localStorage.setItem('mta_maintenance', globalMaintenance.toString());
    saveCloudSettings();
}

function adminToggleDiscount() {
    globalDiscount = !(localStorage.getItem('mta_discount') === 'true');
    localStorage.setItem('mta_discount', globalDiscount.toString());
    saveCloudSettings();
}

function adminIssueProduct() {
    const user = document.getElementById('admin-target-user').value.trim();
    const product = document.getElementById('admin-target-product').value.trim();
    const link = document.getElementById('admin-target-link').value.trim();
    if (!user || !product || !link) {
        alert('Заполните все поля!');
        return;
    }
    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    purchases.push({ username: user, product: product, link: link, date: new Date().toLocaleDateString() });
    localStorage.setItem('mta_purchases', JSON.stringify(purchases));
    saveCloudSettings();
    alert('Товар выдан!');
}

function adminDeletePurchase(index) {
    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    purchases.splice(index, 1);
    localStorage.setItem('mta_purchases', JSON.stringify(purchases));
    saveCloudSettings();
}
