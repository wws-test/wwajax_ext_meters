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

      const data = { key: 'projectid', value: '00bac8fa-6c80-492a-83d7-8f74d5846e80' };
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

