// =============================
//  集研BOOK 詳細図集 ビューア
//  ・PDF切り替え（意匠 / 構造）
//  ・ページジャンプ
//  ・キーワード検索 → 左に結果リスト表示
// =============================

// ---- 1. 検索インデックス ----
// ここに「キーワード → PDFファイル＆ページ」を登録していきます。
// page の値は実際の PDF を見ながら好きなように変えてください。
const SEARCH_INDEX = [
  {
    keyword: ["スラブ", "slab"],
    label: "スラブ配筋標準（意匠）",
    pdf: "shuken-book-shousai-ishou.pdf",
    page: 7   // ← 実際のページに合わせて変更
  },
  {
    keyword: ["梁", "ばり"],
    label: "梁配筋（意匠）",
    pdf: "shuken-book-shousai-ishou.pdf",
    page: 15  // ← 実際のページに合わせて変更
  },
  {
    keyword: ["階段"],
    label: "階段配筋標準（構造）",
    pdf: "shuken-book-shousai-kouzou.pdf",
    page: 30  // ← 実際のページに合わせて変更
  },
  {
    keyword: ["基礎", "フーチング"],
    label: "基礎・フーチング詳細（構造）",
    pdf: "shuken-book-shousai-kouzou.pdf",
    page: 5   // ← 実際のページに合わせて変更
  }
  // ★必要に応じてどんどん追加してOK
];

// ---- 2. 状態 ----
let currentPdf  = "shuken-book-shousai-ishou.pdf"; // 初期は意匠
let currentPage = 1;

// ---- 3. 要素取得 ----
const pdfFrame    = document.getElementById("pdfFrame");
const pageInput   = document.getElementById("pageInput");
const pageJumpBtn = document.getElementById("pageJumpBtn");
const pdfButtons  = document.querySelectorAll(".pdf-btn");

const searchInput = document.getElementById("searchInput");
const searchBtn   = document.getElementById("searchBtn");
const searchInfo  = document.getElementById("searchInfo");
const resultList  = document.getElementById("resultList");
const tagButtons  = document.querySelectorAll(".tag-btn");

const installBtn  = document.getElementById("installBtn");

// ---- 4. PDF表示更新関数 ----
function refreshPdf() {
  if (!pdfFrame) return;
  const fragment = `#page=${currentPage}&zoom=page-width`;
  const url = `${currentPdf}${fragment}`;
  console.log("PDF更新:", url);
  pdfFrame.setAttribute("src", url);
}

// ---- 5. PDF切り替え ----
function updatePdfButtonsActive() {
  pdfButtons.forEach(btn => {
    if (btn.dataset.file === currentPdf) {
      btn.classList.add("pdf-btn-active");
    } else {
      btn.classList.remove("pdf-btn-active");
    }
  });
}

pdfButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const file = btn.dataset.file;
    if (!file) return;
    currentPdf  = file;
    currentPage = 1;
    if (pageInput) pageInput.value = String(currentPage);
    updatePdfButtonsActive();
    refreshPdf();
  });
});

updatePdfButtonsActive();
if (pageInput) {
  pageInput.value = String(currentPage);
}

// ---- 6. ページジャンプ ----
function setPdfPage(page) {
  if (!page || page <= 0) return;
  currentPage = page;
  if (pageInput) pageInput.value = String(currentPage);
  refreshPdf();
}

if (pageJumpBtn && pageInput) {
  pageJumpBtn.addEventListener("click", () => {
    const page = Number(pageInput.value);
    setPdfPage(page);
  });

  pageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const page = Number(pageInput.value);
      setPdfPage(page);
    }
  });
}

// ---- 7. 検索ロジック ----
function searchIndex(term) {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  return SEARCH_INDEX.filter(item => {
    const labelMatch = item.label.toLowerCase().includes(q);
    const keywordMatch = item.keyword.some(k => k.toLowerCase().includes(q));
    return labelMatch || keywordMatch;
  });
}

function renderResults(results, term) {
  if (!resultList || !searchInfo) return;

  resultList.innerHTML = "";

  if (!term || !term.trim()) {
    searchInfo.textContent = "キーワードを入力して検索してください。";
    return;
  }

  if (results.length === 0) {
    searchInfo.textContent = `「${term}」に一致する登録項目はありません。`;
    return;
  }

  searchInfo.textContent = `「${term}」の検索結果：${results.length}件`;

  results.forEach((item) => {
    const li = document.createElement("li");
    li.className = "result-item";

    const title = document.createElement("div");
    title.className = "result-title";
    title.textContent = item.label;

    const meta = document.createElement("div");
    meta.className = "result-meta";
    const kind = item.pdf.includes("ishou") ? "意匠" : "構造";
    meta.textContent = `${kind} / p.${item.page}`;

    li.appendChild(title);
    li.appendChild(meta);

    li.addEventListener("click", () => {
      currentPdf  = item.pdf;
      currentPage = item.page;
      if (pageInput) pageInput.value = String(currentPage);
      updatePdfButtonsActive();
      refreshPdf();
    });

    resultList.appendChild(li);
  });
}

function doSearch() {
  if (!searchInput) return;
  const term = searchInput.value;
  const results = searchIndex(term);
  renderResults(results, term);
}

// 検索ボタン
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

// クイックタグ
tagButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tag = btn.dataset.tag || "";
    if (searchInput) {
      searchInput.value = tag;
    }
    doSearch();
  });
});

// ---- 8. PWA インストール処理 ----
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

// ---- 9. Service Worker 登録 ----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .catch(err => console.error("SW registration failed:", err));
  });
}
