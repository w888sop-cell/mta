// Симуляция проверки оплаты (теперь товар НЕ выдается сразу, а уходит на проверку админу)
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

    // Сохраняем покупку со статусом "Ожидает проверки"
    let pendingPurchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');
    
    // Проверяем, нет ли уже такого же активного заказа
    let orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);

    pendingPurchases.push({
        orderId: orderId,
        product: selectedProduct,
        price: selectedPrice,
        link: 'Ожидает подтверждения администратором',
        key: 'Ожидается',
        status: 'pending',
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem('mta_purchases', JSON.stringify(pendingPurchases));

    statusEl.style.display = 'block';
    statusEl.style.background = 'rgba(59, 130, 246, 0.2)';
    statusEl.style.color = '#3b82f6';
    statusEl.innerText = 'Заявка на оплату отправлена! Администратор проверит перевод и выдаст товар.';

    sendAdminLog(`Создал заявку на оплату #${orderId} для товара: ${selectedProduct} (${selectedPrice} ₽)`);
    sendTelegramNotification(`🔔 *Новая заявка на оплату!* (#${orderId})\n\n👤 Пользователь: ${currentUser.username}\n📦 Товар: ${selectedProduct}\n💰 Сумма: ${selectedPrice} ₽\n\n_Проверьте поступление средств и выдайте товар вручную._`);

    renderPurchasedGoods();
}
