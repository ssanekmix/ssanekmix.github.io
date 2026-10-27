// IndexedDB transactions persist private data only on the user's device.
export async function openStorage() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("personal-chess-academy", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("records");
    request.onerror = () =>
      reject(
        Error(
          "Браузер не разрешил хранение данных. Проверьте настройки приватности.",
        ),
      );
    request.onblocked = () =>
      reject(
        Error("Закройте другие вкладки академии для обновления хранилища."),
      );
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve({
        read: () =>
          new Promise((ok, no) => {
            const tx = db.transaction("records", "readonly"),
              r = tx.objectStore("records").get("state");
            r.onsuccess = () => ok(r.result);
            r.onerror = () => no(r.error);
          }),
        write: (value) =>
          new Promise((ok, no) => {
            const tx = db.transaction("records", "readwrite");
            tx.objectStore("records").put(value, "state");
            tx.oncomplete = () => ok();
            tx.onerror = () =>
              no(
                Error(
                  "Не удалось сохранить данные. Проверьте свободное место и экспортируйте резервную копию.",
                ),
              );
            tx.onabort = tx.onerror;
          }),
        restore: (value, backup) =>
          new Promise((ok, no) => {
            const tx = db.transaction("records", "readwrite");
            tx.objectStore("records").put(backup, "before-restore");
            tx.objectStore("records").put(value, "state");
            tx.oncomplete = () => ok();
            tx.onerror = () =>
              no(
                Error(
                  "Не удалось восстановить данные; предыдущие данные сохранены.",
                ),
              );
            tx.onabort = tx.onerror;
          }),
        backup: () =>
          new Promise((ok, no) => {
            const tx = db.transaction("records", "readonly"),
              r = tx.objectStore("records").get("before-restore");
            r.onsuccess = () => ok(r.result);
            r.onerror = () => no(r.error);
          }),
        close: () => db.close(),
      });
    };
  });
}
