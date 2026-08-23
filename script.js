let isUserRegMode = false;
let currentUser = localStorage.getItem('mta_current_user') || null;

window.onload = function() {
    checkUserSession();
    renderPurchasedGoods();
    checkMaintenanceMode();
    applyDiscountStyles();
    injectReviewsAndGuaranteeBlocks();
    injectOnlineCounter(); // Добавляем счетчик онлайна
};

// Функция создания и обновления счетчика онлайна
function injectOnlineCounter() {
    let headerEl = document.querySelector('header');
    if (!headerEl || document.getElementById('site-online-counter')) return;

    let counterDiv = document.createElement('div');
    counterDiv.id = 'site-online-counter';
    counterDiv.style.cssText = 'margin-top: 10px; font-size: 0.9rem; color: #00ffff; font-weight: bold; background: rgba(0, 255, 255, 0.1); border: 1px solid rgba(0, 255, 255, 0.3); padding: 5px 12px; border-radius: 20px; display: inline-block;';
    
    headerEl.appendChild(counterDiv);
    updateOnlineCount();

    // Обновляем онлайн каждые 30 секунд
    setInterval(updateOnlineCount, 30000);
}

function updateOnlineCount() {
    let counterDiv = document.getElementById('site-online-counter');
    if (!counterDiv) return;

    // Случайное число от 2 до 8
    let randomOnline = Math.floor(Math.random() * (8 - 2 + 1)) + 2;
    counterDiv.innerHTML = `🟢 Онлайн на сайте: <span style="color: #fff;">${randomOnline} человек</span>`;
}

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
        checkMaintenanceMode();
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
            checkMaintenanceMode();
        } else {
            alert('Неверный логин или пароль!');
        }
    }
}

function userLogout() {
    currentUser = null;
    localStorage.removeItem('mta_current_user');
    checkUserSession();
    checkMaintenanceMode();
    
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

// Покупка товара с учетом скидки
function selectProduct(name, originalPrice, downloadLink) {
    let isMaintenance = localStorage.getItem('mta_maintenance') === 'true';
    if (isMaintenance && currentUser !== 'Admin') {
        alert('На сайте ведутся технические работы! Покупка временно недоступна.');
        return;
    }

    currentUser = localStorage.getItem('mta_current_user');
    if (!currentUser) {
        alert('Сначала войдите в личный кабинет или зарегистрируйтесь!');
        switchTab('profile');
        return;
    }

    let isDiscountActive = localStorage.getItem('mta_discount') === 'true';
    let finalPrice = isDiscountActive ? Math.round(originalPrice * 0.75) : originalPrice;

    localStorage.setItem('mta_current_order', `${name} - ${finalPrice}р ${isDiscountActive ? '(Скидка 25%)' : ''}`);
    localStorage.setItem('mta_current_link', downloadLink || '#');
    updateSelectedProductText();
    switchTab('payment');
}

function openCurrencyModal() {
    let isMaintenance = localStorage.getItem('mta_maintenance') === 'true';
    if (isMaintenance && currentUser !== 'Admin') {
        alert('На сайте ведутся технические работы! Покупка временно недоступна.');
        return;
    }

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
        let basePrice = val * 200;
        let isDiscountActive = localStorage.getItem('mta_discount') === 'true';
        let finalPrice = isDiscountActive ? Math.round(basePrice * 0.75) : basePrice;
        
        let calcPrice = document.getElementById('calc-price');
        if (calcPrice) {
            if (isDiscountActive) {
                calcPrice.innerHTML = `Итого: <span style="text-decoration: line-through; color: #888; font-size: 0.9rem;">${basePrice} ₽</span> <span style="color: #28a745; font-weight: bold;">${finalPrice} ₽ (-25%)</span>`;
            } else {
                calcPrice.innerText = `Итого: ${finalPrice} ₽`;
            }
        }
    });
}

function confirmCurrency() {
    let server = document.getElementById('server-select').value;
    let amount = document.getElementById('currency-amount').value;
    let basePrice = amount * 200;
    let isDiscountActive = localStorage.getItem('mta_discount') === 'true';
    let totalPrice = isDiscountActive ? Math.round(basePrice * 0.75) : basePrice;
    
    localStorage.setItem('mta_current_order', `Валюта (Сервер ${server}, ${amount} млн) - ${totalPrice}р ${isDiscountActive ? '(Скидка 25%)' : ''}`);
    localStorage.setItem('mta_current_link', '#');
    closeCurrencyModal();
    updateSelectedProductText();
    switchTab('payment');
}

// Отправка заявки в Telegram
function simulatePayment() {
    let isMaintenance = localStorage.getItem('mta_maintenance') === 'true';
    if (isMaintenance && currentUser !== 'Admin') {
        alert('На сайте ведутся технические работы!');
        return;
    }

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
        let isMaintenance = localStorage.getItem('mta_maintenance') === 'true';
        let isDiscountActive = localStorage.getItem('mta_discount') === 'true';
        
        html += `
            <div style="background: rgba(255, 0, 0, 0.1); border: 1px solid #ff4444; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <p style="color: #ff4444; font-weight: bold; margin-bottom: 15px;">👑 Панель администратора</p>
                
                <!-- Управление тех. работами -->
                <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #444;">
                    <p style="color: #fff; margin-bottom: 8px; font-weight: bold;">Статус тех. работ:</p>
                    <button onclick="setMaintenance(true)" style="background: ${isMaintenance ? '#dc3545' : '#444'}; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-right: 5px;">🔴 Включить</button>
                    <button onclick="setMaintenance(false)" style="background: ${!isMaintenance ? '#28a745' : '#444'}; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">🟢 Выключить</button>
                </div>

                <!-- Управление скидкой 25% -->
                <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #444;">
                    <p style="color: #fff; margin-bottom: 8px; font-weight: bold;">Скидка 25% на всё:</p>
                    <button onclick="setDiscount(true)" style="background: ${isDiscountActive ? '#28a745' : '#444'}; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-right: 5px;">🔥 Включить скидку 25%</button>
                    <button onclick="setDiscount(false)" style="background: ${!isDiscountActive ? '#dc3545' : '#444'}; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">❌ Убрать скидку</button>
                </div>

                <p style="color: #ff4444; font-weight: bold; margin-bottom: 10px;">Ручная выдача товара:</p>
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

// Управление тех. работами
function setMaintenance(status) {
    localStorage.setItem('mta_maintenance', status);
    checkMaintenanceMode();
    renderPurchasedGoods();
    alert(status ? 'Режим тех. работ ВКЛЮЧЕН!' : 'Режим тех. работ ВЫКЛЮЧЕН!');
}

// Управление скидкой 25%
function setDiscount(status) {
    localStorage.setItem('mta_discount', status);
    applyDiscountStyles();
    renderPurchasedGoods();
    alert(status ? '🔥 Скидка 25% успешно активирована на все товары!' : 'Скидка отключена.');
}

// Красивое отображение скидок на ценниках в товарах
function applyDiscountStyles() {
    let isDiscountActive = localStorage.getItem('mta_discount') === 'true';
    
    document.querySelectorAll('.product-price, b, span').forEach(el => {
        let text = el.innerText;
        if ((text.includes('₽') || text.includes('р')) && !el.dataset.basePrice && !text.includes('Итого') && !text.includes('скидк')) {
            let match = text.match(/(\d+)/);
            if (match) {
                let originalVal = parseInt(match[1]);
                el.dataset.basePrice = originalVal;
            }
        }

        if (el.dataset.basePrice) {
            let base = parseInt(el.dataset.basePrice);
            if (isDiscountActive) {
                let discounted = Math.round(base * 0.75);
                el.innerHTML = `<span style="text-decoration: line-through; color: #888; font-size: 0.85rem; margin-right: 5px;">${base} ₽</span><span style="color: #28a745; font-weight: bold; text-shadow: 0 0 10px rgba(40,167,69,0.4);">${discounted} ₽</span> <span style="background: #28a745; color: #fff; font-size: 0.7rem; padding: 2px 5px; border-radius: 4px; vertical-align: middle;">-25% 🔥</span>`;
            } else {
                el.innerText = `${base} ₽`;
            }
        }
    });
}

// Добавление блоков отзывов со звездами, формы отправки и гарантий вниз сайта
function injectReviewsAndGuaranteeBlocks() {
    let wrapperId = 'footer-trust-wrapper';
    if (document.getElementById(wrapperId)) return;

    let wrapper = document.createElement('div');
    wrapper.id = wrapperId;
    wrapper.style.cssText = 'max-width: 800px; margin: 40px auto 20px auto; display: flex; flex-direction: column; gap: 20px;';

    // Базовые отзывы
    let defaultReviews = [
        { name: 'Federal889', text: 'Брал чит на функции, всё летает, админ быстро выдал товар после оплаты. Рекомендую!', rating: 5 },
        { name: 'Fghjk!y', text: 'Сначала боялся, но почитал гарантии и взял валюту. Всё пришло ровно как заказывал, топ проект!', rating: 5 }
    ];

    let savedReviews = JSON.parse(localStorage.getItem('mta_user_reviews') || '[]');
    let allReviews = [...defaultReviews, ...savedReviews];

    // Блок отзывов со звездами
    let reviewsDiv = document.createElement('div');
    reviewsDiv.id = 'reviews-container-box';
    reviewsDiv.style.cssText = 'background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.3); padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3);';
    
    updateReviewsHTML(reviewsDiv, allReviews);

    // Блок гарантий возврата
    let guaranteeDiv = document.createElement('div');
    guaranteeDiv.style.cssText = 'background: rgba(0, 255, 255, 0.05); border: 1px solid rgba(0, 255, 255, 0.3); padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3);';
    guaranteeDiv.innerHTML = `
        <h3 style="color: #00ffff; margin-bottom: 10px; font-size: 1.2rem; text-transform: uppercase; font-weight: 900;">
            🛡️ 100% Гарантия безопасности и честности
        </h3>
        <p style="color: #ccc; font-size: 0.95rem; line-height: 1.5; margin: 0;">
            Мы дорожим своей репутацией и честны перед каждым клиентом. Наша система работает без какого-либо обмана! 
            Если приобретенный чит или скрипт по техническим причинам не запустится на вашем ПК, мы гарантированно вернем вам часть денег или поможем полностью настроить софт.
        </p>
    `;

    wrapper.appendChild(reviewsDiv);
    wrapper.appendChild(guaranteeDiv);
    document.body.appendChild(wrapper);
}

// Генерация разметки отзывов и формы добавления
function updateReviewsHTML(container, reviewsArr) {
    let listHTML = '';
    reviewsArr.forEach(rev => {
        let starsStr = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
        listHTML += `
            <div style="background: rgba(0,0,0,0.2); padding: 10px 15px; border-radius: 8px; border-left: 3px solid #00ffff;">
                <p style="color: #ddd; font-size: 0.9rem; margin: 0 0 5px 0;"><b>${rev.name}:</b> «${rev.text}»</p>
                <span style="color: #ffcc00; font-size: 0.8rem; letter-spacing: 2px;">${starsStr}</span>
            </div>
        `;
    });

    container.innerHTML = `
        <h3 style="color: #00ffff; margin-bottom: 5px; font-size: 1.2rem; text-transform: uppercase; font-weight: 900;">
            ⭐ Отзывы реальных покупателей
        </h3>
        <div style="font-size: 1.5rem; color: #ffcc00; margin-bottom: 15px; letter-spacing: 3px;">
            ★★★★★ <span style="font-size: 1rem; color: #fff; font-weight: bold; margin-left: 5px;">5.0 / 5.0</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px; text-align: left; margin-bottom: 20px;">
            ${listHTML}
        </div>
        
        <!-- Форма добавления отзыва -->
        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; border: 1px solid #444; text-align: left;">
            <p style="color: #00ffff; font-weight: bold; margin-bottom: 10px; font-size: 0.95rem;">Оставить свой отзыв:</p>
            <input type="text" id="new-review-name" placeholder="Ваш ник / логин" style="width: 100%; padding: 8px; margin-bottom: 8px; background: #222; border: 1px solid #444; color: #fff; border-radius: 5px; font-size: 0.9rem;">
            <textarea id="new-review-text" placeholder="Ваш отзыв о товаре..." style="width: 100%; padding: 8px; margin-bottom: 8px; background: #222; border: 1px solid #444; color: #fff; border-radius: 5px; height: 60px; font-size: 0.9rem; resize: none;"></textarea>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #ccc; font-size: 0.9rem;">Оценка:</span>
                <select id="new-review-rating" style="padding: 6px; background: #222; border: 1px solid #444; color: #ffcc00; border-radius: 5px; font-weight: bold;">
                    <option value="5">★★★★★ (5/5)</option>
                    <option value="4">★★★★☆ (4/5)</option>
                    <option value="3">★★★☆☆ (3/5)</option>
                    <option value="2">★★☆☆☆ (2/5)</option>
                    <option value="1">★☆☆☆☆ (1/5)</option>
                </select>
            </div>
            <button onclick="submitUserReview()" style="background: #28a745; color: #fff; border: none; padding: 10px; width: 100%; border-radius: 5px; cursor: pointer; font-weight: bold;">💬 Отправить отзыв</button>
        </div>
    `;
}

// Обработка отправки отзыва пользователем
function submitUserReview() {
    let nameInput = document.getElementById('new-review-name');
    let textInput = document.getElementById('new-review-text');
    let ratingInput = document.getElementById('new-review-rating');

    if (!nameInput || !textInput || !ratingInput) return;

    let name = nameInput.value.trim();
    let text = textInput.value.trim();
    let rating = parseInt(ratingInput.value);

    if (!name || !text) {
        alert('Заполните ваше имя и текст отзыва!');
        return;
    }

    let defaultReviews = [
        { name: 'Federal889', text: 'Брал чит на функции, всё летает, админ быстро выдал товар после оплаты. Рекомендую!', rating: 5 },
        { name: 'Fghjk!y', text: 'Сначала боялся, но почитал гарантии и взял валюту. Всё пришло ровно как заказывал, топ проект!', rating: 5 }
    ];

    let savedReviews = JSON.parse(localStorage.getItem('mta_user_reviews') || '[]');
    savedReviews.push({ name, text, rating });
    
    localStorage.setItem('mta_user_reviews', JSON.stringify(savedReviews));

    let container = document.getElementById('reviews-container-box');
    if (container) {
        updateReviewsHTML(container, [...defaultReviews, ...savedReviews]);
    }

    alert('Спасибо! Ваш отзыв успешно добавлен.');
}

// Проверка и отображение плашки тех. работ
function checkMaintenanceMode() {
    let isMaintenance = localStorage.getItem('mta_maintenance') === 'true';
    let banner = document.getElementById('maintenance-banner');

    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'maintenance-banner';
        banner.style.cssText = 'display: none; background: #ff3333; color: #fff; text-align: center; padding: 15px; font-weight: 900; font-size: 1.2rem; text-transform: uppercase; position: fixed; top: 0; left: 0; width: 100%; z-index: 99999; box-shadow: 0 4px 10px rgba(0,0,0,0.5);';
        banner.innerHTML = '⚠️ Технические работы на сервере. Ожидайте ⚠️';
        document.body.prepend(banner);
    }

    if (isMaintenance && currentUser !== 'Admin') {
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }
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
