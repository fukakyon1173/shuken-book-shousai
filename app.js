const pdfFile = "shuken-book-2023.pdf";
const pdfFrame = document.getElementById("pdfFrame");
const pageInput = document.getElementById("pageInput");
const pageJumpBtn = document.getElementById("pageJumpBtn");
const sectionButtons = document.querySelectorAll(".section-buttons .btn");

function setPdfPage(page) {
  if (!page || page <= 0) return;
  // ブラウザのPDFビューアに page パラメータを渡す
  pdfFrame.src = `${pdfFile}#page=${page}&zoom=page-width`;
}

// セクションボタンでジャンプ
sectionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const page = Number(btn.dataset.page);
    pageInput.value = page;
    setPdfPage(page);
  });
});

// ページ番号指定でジャンプ
pageJumpBtn.addEventListener("click", () => {
  const page = Number(pageInput.value);
  setPdfPage(page);
});

// -------- PWA: インストールボタン制御 --------
let deferredPrompt = null;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "inline-flex";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  console.log("install result:", result.outcome);
  deferredPrompt = null;
  installBtn.style.display = "none";
});

// -------- Service Worker 登録 --------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.error("SW registration failed:", err);
    });
  });
}
