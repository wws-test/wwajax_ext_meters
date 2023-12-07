chrome.devtools.panels.create('U-Network', 'icon.png', '../html/iframePage/dist/uNetwork.html', function (panel) {
  console.log('U-Network面板创建成功！');

  panel.onShown.addListener(function(panelWindow) {
    const request = indexedDB.open('myDatabase', 1);

    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      const objectStore = db.createObjectStore('myObjectStore', { keyPath: 'key' });
    };

    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction('myObjectStore', 'readwrite');
      const objectStore = transaction.objectStore('myObjectStore');

      const data = { key: 'projectid', value: '0f414c3b-6d4d-47e0-8263-1bfb649a55d7' };
      const request = objectStore.put(data);

      request.onsuccess = function(event) {
        console.log('Value is set in IndexedDB');
      };

      transaction.oncomplete = function(event) {
        db.close();
      };
    };

  });
});

