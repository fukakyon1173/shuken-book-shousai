// 現在表示中のPDFとページ・検索キーワード
let currentPdf = "shuken-book-shousai-ishou.pdf";
let currentPage = 1;
let currentSearch = "";

// 要素取得
const pdfFrame   = document.getElementById("pdfFrame");
const pageInput  = document.getElementById("pageInput");
const pageJumpBtn = document.getElementById("pageJumpBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn   = document.getElementById("searchBtn");
const pdfButtons  = document.querySelectorAll(".pdf-btn");

// 共通：iframe の src を更新
function refreshPdf() {
  let fragment = `#page=${currentPage}&zoom=page-width`;
  if (currentSearch) {
    // ChromeなどのPDFビューアは search パラメータで検索できる
    fragment += `&search=${encodeURIComponent(currentSearch)}`;
  }
  pdfFrame.src = `${currentPdf}${fragment}`;
}

// --- PDF切り替え ---
pdfButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentPdf = btn.dataset.file;
    currentPage = 1;           // PDF切り替え時は1ページ目へ
    pageInput.value = currentPage;
    refreshPdf();
  });
});

// --- ページジャンプ ---
function setPdfPage(page) {
  if (!page || page <= 0) return;
  currentPage = page;
  refreshPdf();
}

pageJumpBtn.addEventListener("click", () => {
  const page = Number(pageInput.value);
  setPdfPage(page);
});

// Enterキーでページジャンプ
pageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const page = Number(pageInput.value);
    setPdfPage(page);
  }
});

// --- キーワード検索 ---
function doSearch() {
  const term = searchInput.value.trim();
  currentSearch = term; // 空文字なら検索クリア
  // 検索時は1ページ目からにしておく
  if (term) currentPage = 1;
  pageInput.value = currentPage;
  refreshPdf();
}

searchBtn.addEventListener("click", () => {
  doSearch();
});

// Enterキーで検索
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    doSearch();
  }
});

// --- PWA インストール処理 ---
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

// --- Service Worker 登録 ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}
