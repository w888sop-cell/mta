// ОТПРАВКА УВЕДОМЛЕНИЯ В TELEGRAM ДЛЯ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
function sendTelegramNotification(orderText, username) {
    const message = `🔔 <b>Новая заявка на оплату!</b>\n\n` +
                    `👤 <b>Покупатель:</b> ${username}\n` +
                    `🛒 <b>Товар:</b> ${orderText}\n\n` +
                    `⚠️ <i>Проверьте поступление средств в Т-Банк и выдайте товар вручную или через ЛК.</i>`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=` + 
                encodeURIComponent(message) + `&parse_mode=HTML`;

    let img = new Image();
    img.src = url;
}

function simulatePayment() {
    let savedOrder = localStorage.getItem('mta_current_order');
    if (!savedOrder) {
        alert('Сначала выберите товар!');
        return;
    }
    
    // Отправляем уведомление вам в Telegram с именем пользователя
    sendTelegramNotification(savedOrder, currentUser || 'Гость');

    let statusArea = document.getElementById('status-message');
    statusArea.style.display = 'block';
    statusArea.style.border = '1px solid var(--border-color)';
    statusArea.style.padding = '10px';
    statusArea.style.borderRadius = '8px';
    statusArea.innerHTML = `⏳ <b>Заявка отправлена!</b> Администратор проверяет поступление средств. После подтверждения товар появится во вкладке "Мои товары".`;
}
