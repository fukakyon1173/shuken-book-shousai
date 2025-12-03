// 現在表示中のPDF
let currentPdf = "shuken-book-shousai-ishou.pdf";

// 要素取得
const pdfFrame = document.getElementById("pdfFrame");
const pageInput = document.getElementById("pageInput");
const pageJumpBtn = document.getElementById("pageJumpBtn");

// PDF切り替えボタン
const pdfButtons = document.querySelectorAll(".pdf-btn");

// PDF切り替え
pdfButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentPdf = btn.dataset.file;
    pdfFrame.src = `${currentPdf}#page=1&zoom=page-width`;
    pageInput.value = 1;
  });
});

// ページジャンプ
function setPdfPage(page) {
  if (!page || page <= 0) return;
  pdfFrame.src = `${currentPdf}#page=${page}&zoom=page-width`;
}

pageJumpBtn.addEventListener("click", () => {
  const page = Number(pageInput.value);
  setPdfPage(page);
});

// PWA インストール処理
let deferredPrompt = null;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "inline-block";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.style.display = "none";
});

// Service Worker 登録
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}
