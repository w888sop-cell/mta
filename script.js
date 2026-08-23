// Отправка уведомления прямо с сайта через прокси (обход блокировки браузера)
function simulatePayment() {
    let savedOrderStr = localStorage.getItem('mta_current_order');
    if (!savedOrderStr) {
        alert('Сначала выберите товар!');
        return;
    }
    
    let orderData = JSON.parse(savedOrderStr);
    let username = currentUser || 'Гость';

    let token = '8659237947:AAHQu9Y1_450Cq2jQY7ISaIqHsmmvaKvIE4';
    let chatId = '755271846';

    let text = `🔔 <b>Новая заявка на оплату!</b>\n\n👤 <b>Покупатель:</b> ${username}\n🛒 <b>Товар:</b> ${orderData.name}\n💰 <b>Сумма:</b> ${orderData.price}р\n\n⚠️ <i>Проверьте поступление средств в Т-Банк.</i>`;

    // Прямая ссылка на Telegram API
    let telegramUrl = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&parse_mode=HTML&text=` + encodeURIComponent(text);

    // Отправляем через публичный прокси-сервер, чтобы браузер покупателя не блокировал запрос
    let proxyUrl = `https://api.allorigins.win/raw?url=` + encodeURIComponent(telegramUrl);

    fetch(proxyUrl)
        .then(response => {
            console.log('Запрос отправлен успешно!');
        })
        .catch(err => {
            console.log('Ошибка:', err);
        });

    // Красивое сообщение на сайте
    let statusArea = document.getElementById('status-message');
    if (statusArea) {
        statusArea.style.display = 'block';
        statusArea.style.border = '1px solid var(--border-color, #444)';
        statusArea.style.padding = '10px';
        statusArea.style.borderRadius = '8px';
        statusArea.innerHTML = `⏳ <b>Заявка успешно отправлена с сайта!</b> Администратор проверяет оплату. Как только он подтвердит её, товар появится во вкладке "Мои товары".`;
    }
}
