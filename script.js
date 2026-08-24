// Пример: функция для переключения вкладок
function openTab(tabName) {
    // Скрываем все вкладки
    let tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.style.display = 'none');

    // Показываем нужную вкладку
    let activeTab = document.getElementById(tabName);
    if (activeTab) {
        activeTab.style.display = 'block';
    }
}
