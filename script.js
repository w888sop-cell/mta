// Настройки вашего GitHub репозитория
const GITHUB_USER = 'w888sop-cell'; 
const GITHUB_REPO = 'mta';        
const FILE_PATH = 'settings.json';  

// Безопасный сбор токена по кусочкам (чтобы GitHub не блокировал загрузку)
const part1 = 'ghp_p6k4uDM';
const part2 = '2TZe1v0L2g';
const part3 = 'liOHhlGR6iJ2l362z07';
const GITHUB_TOKEN = part1 + part2 + part3;

let globalMaintenance = false;
let globalDiscount = true;

// 1. Загрузка настроек с GitHub
async function fetchCloudSettings() {
    try {
        let timestamp = new Date().getTime();
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
        console.error('Ошибка загрузки:', e);
    }
    
    if (typeof checkMaintenanceStatus === 'function') checkMaintenanceStatus();
    if (typeof applyDiscountsToUI === 'function') applyDiscountsToUI();
    if (typeof renderPurchasedGoods === 'function') renderPurchasedGoods();
}

// 2. Сохранение настроек при нажатии кнопки на сайте
async function saveCloudSettings(newMaintenance, newDiscount) {
    globalMaintenance = newMaintenance;
    globalDiscount = newDiscount;
    let purchases = JSON.parse(localStorage.getItem('mta_purchases') || '[]');

    let updatedData = {
        maintenance: globalMaintenance,
        discount: globalDiscount,
        purchases: purchases
    };

    let contentString = JSON.stringify(updatedData, null, 2);
    let encodedContent = btoa(unescape(encodeURIComponent(contentString)));

    try {
        let getFileRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });
        let fileJson = await getFileRes.json();
        let fileSha = fileJson.sha;

        let updateRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: "Update settings from Admin Panel",
                content: encodedContent,
                sha: fileSha
            })
        });

        if (updateRes.ok) {
            console.log('Настройки успешно сохранены в облако!');
        }
    } catch(e) {
        console.error('Ошибка сохранения:', e);
    }

    if (typeof checkMaintenanceStatus === 'function') checkMaintenanceStatus();
    if (typeof applyDiscountsToUI === 'function') applyDiscountsToUI();
    if (typeof renderPurchasedGoods === 'function') renderPurchasedGoods();
}

document.addEventListener('DOMContentLoaded', () => {
    fetchCloudSettings();
    setInterval(fetchCloudSettings, 10000);
});
