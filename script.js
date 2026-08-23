// НАДЕЖНАЯ ОТПРАВКА УВЕДОМЛЕНИЙ В TELEGRAM
function sendTelegramNotification(orderText, username) {
    const message = `🔔 <b>Новая заявка на оплату!</b>\n\n` +
                    `👤 <b>Покупатель:</b> ${username}\n` +
                    `🛒 <b>Товар:</b> ${orderText}\n\n` +
                    `⚠️ <i>Проверьте поступление средств в Т-Банк.</i>`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        })
    })
    .then(response => {
        if (!response.ok) {
            console.error('Ошибка отправки в Telegram:', response.status);
        }
    })
    .catch(error => {
        console.error('Ошибка сети:', error);
    });
}
