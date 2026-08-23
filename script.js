// ОТПРАВКА ЧЕРЕЗ БЕСПЛАТНЫЙ CORS-ПРОКСИ (чтобы браузер не блокировал запрос)
function sendTelegramNotification(orderText, username) {
    const message = `🔔 <b>Новая заявка на оплату!</b>\n\n` +
                    `👤 <b>Покупатель:</b> ${username}\n` +
                    `🛒 <b>Товар:</b> ${orderText}\n\n` +
                    `⚠️ <i>Проверьте поступление средств в Т-Банк.</i>`;

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=` + 
                        encodeURIComponent(message) + `&parse_mode=HTML`;

    // Публичный прокси обходит блокировку браузера
    const proxyUrl = `https://api.allorigins.win/get?url=` + encodeURIComponent(telegramUrl);

    fetch(proxyUrl)
        .then(response => {
            if (response.ok) {
                console.log('Уведомление успешно отправлено через прокси!');
            } else {
                console.error('Ошибка отправки');
            }
        })
        .catch(error => console.error('Ошибка сети:', error));
}
