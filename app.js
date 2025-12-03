// =============================
//  集研BOOK 詳細図集 ビューア
//  ・PDF切り替え（意匠 / 構造）
//  ・ページジャンプ
//  ・キーワード検索
// =============================

// 状態
let currentPdf    = "shuken-book-shousai-ishou.pdf"; // 初期は意匠
let currentPage   = 1;
let currentSearch = "";

// 要素取得（nullチェック付き）
const pdfFrame    = document.getElementById("pdfFrame");
const pageInput   = document.getElementById("pageInput");
const pageJumpBtn = document.getElementById("pageJumpBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn   = document.getElementById("searchBtn");
const pdfButtons  = document.querySelectorAll(".pdf-btn");
const installBtn  = document.getElementById("installBtn");

// もし必須要素が取れていなければ、何もせず終わる
if (!pdfFrame) {
  console.error("pdfFrame が見つかりません。index.html の id を確認してください。");
}

// -------------------------
// iframe の src を更新する共通関数
// -------------------------
function refreshPdf() {
  if (!pdfFrame) return;
  // #page= と search= を組み立て
  let fragment = `#page=${currentPage}&zoom=page-width`;
  if (currentSearch) {
    fragment += `&search=${encodeURIComponent(currentSearch)}`;
  }

  const url = `${currentPdf}${fragment}`;
  console.log("PDF更新:", url);
  pdfFrame.setAttribute("src", url);
}

// -------------------------
// PDF切り替え
// -------------------------
pdfButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const file = btn.dataset.file;
    if (!file) return;

    currentPdf  = file;
    currentPage = 1;
    if (pageInput) pageInput.value = String(currentPage);

    refreshPdf();
  });
});

// -------------------------
// ページジャンプ
// -------------------------
function setPdfPage(page) {
  if (!page || page <= 0) return;
  currentPage = page;
  refreshPdf();
}

if (pageJumpBtn && pageInput) {
  pageJumpBtn.addEventListener("click", () => {
    const page = Number(pageInput.value);
    setPdfPage(page);
  });

  // Enterキーでもジャンプ
  pageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const page = Number(pageInput.value);
      setPdfPage(page);
    }
  });

  // 初期値は1ページ目
  pageInput.value = String(currentPage);
}

// -------------------------
// キーワード検索
// -------------------------
function doSearch() {
  if (!searchInput) return;
  const term = searchInput.value.trim();
  currentSearch = term;      // 空文字なら検索解除
  if (term) currentPage = 1; // 検索時は1ページ目から
  if (pageInput) pageInput.value = String(currentPage);
  refreshPdf();
}

if (searchBtn && searchInput) {
  searchBtn.addEventListener("click", () => {
    doSearch();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      doSearch();
    }
  });
}

// -------------------------
// PWA インストール処理
// -------------------------
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) {
    installBtn.style.display = "inline-block";
  }
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.style.display = "none";
  });
}

// -------------------------
// Service Worker 登録
// -------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .catch(err => console.error("SW registration failed:", err));
  });
}
