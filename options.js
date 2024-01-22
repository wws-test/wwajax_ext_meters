// 声明变量db，用于存储indexedDB数据库实例
let db;

// 声明常量dbName，用于存储数据库名称
const dbName = 'myDatabase';

// 声明常量storeName，用于存储对象存储名称
const storeName = 'myObjectStore';

// 定义函数openDB，用于打开数据库并加载设置
function openDB() {
    let request = indexedDB.open(dbName);

    request.onsuccess = function(event) {
        db = event.target.result;
        loadSettings();
    };

    request.onerror = function(event) {
        console.error('Database error:', event.target.errorCode);
    };
}

// 定义函数saveSettings，用于保存设置
function saveSettings(projectidValue, userValue) {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    // 保存projectid
    store.put({ key: 'projectid', value: projectidValue });
    // 保存user
    store.put({ key: 'user', value: userValue });
}

// 定义函数loadSettings，用于加载设置
function loadSettings() {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    // 加载projectid
    const projectidRequest = store.get('projectid');
    // 加载user
    const userRequest = store.get('user');

    projectidRequest.onsuccess = function() {
        if (projectidRequest.result) {
            document.getElementById('input1').value = projectidRequest.result.value;
        }
    };

    userRequest.onsuccess = function() {
        if (userRequest.result) {
            document.getElementById('input2').value = userRequest.result.value;
        }
    };
}

document.addEventListener('DOMContentLoaded', openDB);

document.getElementById('options-form').addEventListener('submit', function(event) {
    event.preventDefault();
    saveSettings(document.getElementById('input1').value, document.getElementById('input2').value);
});
