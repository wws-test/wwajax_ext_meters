// 声明变量db，用于存储indexedDB数据库实例
let db;

// 声明常量dbName，用于存储数据库名称
const dbName = 'myDatabase';

// 声明常量storeName，用于存储对象存储名称
const storeName = 'myObjectStore';

// 定义函数saveSettings，用于保存设置
function saveSettings(projectidValue, userValue) {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    // 保存projectid
    store.put({key: 'projectid', value: projectidValue});
    // 保存user
    store.put({key: 'user', value: userValue});
    alert('保存成功');
}

// 定义函数loadSettings，用于加载设置
function loadSettings() {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    // 加载projectid
    const projectidRequest = store.get('projectid');
    // 加载user
    const userRequest = store.get('user');

    projectidRequest.onsuccess = function () {
        if (projectidRequest.result) {
            document.getElementById('input1').value = projectidRequest.result.value;
        }
    };

    userRequest.onsuccess = function () {
        if (userRequest.result) {
            document.getElementById('input2').value = userRequest.result.value;
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('options-form');
    
    // 加载已保存的配置
    chrome.storage.local.get(['projectid', 'user', 'aiConfig'], (result) => {
        if (result.projectid) {
            document.getElementById('projectId').value = result.projectid;
        }
        if (result.user) {
            document.getElementById('userId').value = result.user;
        }
        if (result.aiConfig) {
            try {
                const aiConfig = JSON.parse(result.aiConfig);
                document.getElementById('apiKey').value = aiConfig.apiKey || '';
                document.getElementById('apiUrl').value = aiConfig.url || '';
                document.getElementById('model').value = aiConfig.model || '';
                document.getElementById('temperature').value = aiConfig.temperature || '0.5';
            } catch (error) {
                console.error('解析AI配置失败:', error);
            }
        }
    });

    // 保存配置
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const projectId = document.getElementById('projectId').value;
        const userId = document.getElementById('userId').value;
        const apiKey = document.getElementById('apiKey').value;
        const apiUrl = document.getElementById('apiUrl').value;
        const model = document.getElementById('model').value;
        const temperature = document.getElementById('temperature').value;
        // 保存基础配置
        chrome.storage.local.set({
            projectid: projectId,
            user: userId
        });

        // 保存AI配置
        if (apiKey) {
            const aiConfig = {
                apiKey,
                url: apiUrl,
                model,
                temperature: parseFloat(temperature) || 0.5
            };
            chrome.storage.local.set({
                aiConfig: JSON.stringify(aiConfig)
            });
        }
        // 显示保存成功提示
        const status = document.createElement('div');
        status.textContent = '配置已保存';
        status.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #52c41a;
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            animation: fadeInOut 2s forwards;
        `;

        document.body.appendChild(status);

        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-20px); }
                10% { opacity: 1; transform: translateY(0); }
                90% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-20px); }
            }
        `;
        document.head.appendChild(style);

        // 移除提示
        setTimeout(() => {
            document.body.removeChild(status);
            document.head.removeChild(style);
        }, 2000);
    });
});
