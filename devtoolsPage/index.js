chrome.devtools.panels.create('U-Network', 'icon.png', '../html/iframePage/dist/uNetwork.html', function (panel) {
    console.log('U-Network面板创建成功！');

    panel.onShown.addListener(function (panelWindow) {
        const request = indexedDB.open('myDatabase', 1);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            const objectStore = db.createObjectStore('myObjectStore', {keyPath: 'key'});
        };

        request.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction('myObjectStore', 'readwrite');
            const objectStore = transaction.objectStore('myObjectStore');

            const data = {key: 'projectid', value: 'd8a8f43c-c912-4d2e-999b-402bd32f350d'};
            const user = {key: 'user', value: 'admin'}
            const request = objectStore.put(data);
            const request2 = objectStore.put(user);

            request.onsuccess = function (event) {
                console.log('Value is set in IndexedDB');
            };
            request2.onsuccess = function (event) {
                console.log('Value is set in IndexedDB1');
            }

            transaction.oncomplete = function (event) {
                db.close();
            };
        };

    });
});

