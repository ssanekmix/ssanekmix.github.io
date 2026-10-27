import { createRuntime } from "./runtime.js";
function download(data, name) {
  const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
try {
  const runtime = await createRuntime();
  window.academyAPI = runtime.api;
  await import("../academy/static/app.js");
  const exportLink = document.querySelector('a[href="#export"]');
  exportLink.onclick = async (e) => {
    e.preventDefault();
    download(await runtime.api("/export"), "academy-browser-backup.json");
  };
  const previous = document.createElement("button");
  previous.textContent = "Скачать копию до последнего восстановления";
  previous.onclick = async () => {
    try {
      download(
        await runtime.api("/export-previous"),
        "academy-before-restore.json",
      );
    } catch (e) {
      alert(e.message);
    }
  };
  exportLink.parentElement.append(previous);
  const footer = document.querySelector("footer");
  footer.innerHTML =
    'На вашем устройстве · без установки · без регистрации · <a href="./web/vendor/SOURCE.md">Stockfish 17.1 WebAssembly: лицензия и исходники</a> · <a href="./README.md">Инструкция</a>';
  let promptInstall = null;
  const install = document.getElementById("install-app");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    promptInstall = e;
    install.hidden = false;
  });
  install.onclick = async () => {
    if (promptInstall) {
      await promptInstall.prompt();
      promptInstall = null;
      install.hidden = true;
    }
  };
  window.addEventListener("pagehide", () => runtime.shutdown(), { once: true });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) location.reload();
  });
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register(new URL("../sw.js", import.meta.url), {
        scope: new URL("../", import.meta.url).pathname,
      })
      .then(async (registration) => {
        await navigator.serviceWorker.ready;
        document.getElementById("offline-status").textContent =
          " ✓ Приложение сохранено для работы без интернета";
      })
      .catch(() => {
        document.getElementById("offline-status").textContent =
          " Для автономного запуска откройте приложение по HTTPS.";
      });
  }
} catch (e) {
  const notice = document.getElementById("notice");
  notice.className = "visible error";
  notice.textContent = "Не удалось запустить академию: " + e.message;
  document.getElementById("health").textContent = "Ошибка запуска";
  console.error(e);
}
