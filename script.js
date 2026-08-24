// Настройки вашего GitHub репозитория
const GITHUB_USER = 'w888sop-cell'; 
const GITHUB_REPO = 'mta';        
const FILE_PATH = 'settings.json';  

// Глобальные переменные состояния
let globalMaintenance = false;
let globalDiscount = true;

// Загрузка настроек с сайта (работает у всех пользователей)
async function fetchCloudSettings() {
    try {
        let timestamp = new Date().getTime(); // Защита от кэширования браузером
        let res = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/${FILE_PATH}?t=${timestamp}`);
        if (res.ok) {
            let data = await res.json();
            globalMaintenance = data.maintenance;
            globalDiscount = data.discount;
            if (data.purchases) {
                localStorage.setItem('mta_purchases', JSON.stringify(data.purchases));
            }
        }
    } catch(e) {
        console.error('Ошибка загрузки настроек:', e);
    }
    
    // Применяем настройки к интерфейсу при загрузке страницы
    if (typeof checkMaintenanceStatus === 'function') checkMaintenanceStatus();
    if (typeof applyDiscountsToUI === 'function') applyDiscountsToUI();
    if (typeof renderPurchasedGoods === 'function') renderPurchasedGoods();
}

// Автоматически запускаем загрузку при открытии сайта
document.addEventListener('DOMContentLoaded', () => {
    fetchCloudSettings();
    // Проверяем обновление каждые 10 секунд
    setInterval(fetchCloudSettings, 10000);
});
