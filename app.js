// =============================
// 集研BOOK 詳細図集ビューア（5PDF版）
// ・PDF切替：目次 / 意匠（外部・内部・建具） / 構造
// ・ページ指定ジャンプ（同じタブで開く）
// ・左の検索結果からジャンプ
// ・登録なしキーワードは pdf.js で全文検索
// =============================

// ---- 1. 検索インデックス ----
// ★page の値は実際の PDF を見ながら自由に修正してください。
const SEARCH_INDEX = [
  {
    keyword: ["目次", "mokuji"],
    label: "全体目次",
    pdf: "shuken-book-shousai-mokuji.pdf",
    page: 1
  },
  {
    keyword: ["外部", "外部仕上", "バルコニー", "屋根"],
    label: "外部仕上げ（意匠・外部）",
    pdf: "shuken-book-shousai-ishou-gaibu.pdf",
    page: 1
  },
  {
    keyword: ["内部", "内部仕上", "天井", "壁", "床"],
    label: "内部仕上げ（意匠・内部）",
    pdf: "shuken-book-shousai-ishou-naibu.pdf",
    page: 1
  },
  {
    keyword: ["建具", "窓", "ドア", "サッシ"],
    label: "建具詳細（意匠・建具）",
    pdf: "shuken-book-shousai-ishou-tategu.pdf",
    page: 1
  },
  {
    keyword: ["構造", "基礎", "フーチング"],
    label: "基礎・フーチング（構造）",
    pdf: "shuken-book-shousai-kouzou.pdf",
    page: 1
  },
  {
    keyword: ["スラブ"],
    label: "スラブ配筋標準（構造）",
    pdf: "shuken-book-shousai-kouzou.pdf",
    page: 7
  },
  {
    keyword: ["階段"],
    label: "階段配筋標準（構造）",
    pdf: "shuken-book-shousai-kouzou.pdf",
    page: 15
  }
  // ★必要に応じてここにどんどん追加してOK
];

// 全文検索対象のPDF一覧
const PDF_FILES = [
  { file: "shuken-book-shousai-mokuji.pdf",        label: "目次" },
  { file: "shuken-book-shousai-ishou-gaibu.pdf",   label: "意匠：外部" },
  { file: "shuken-book-shousai-ishou-naibu.pdf",   label: "意匠：内部" },
  { file: "shuken-book-shousai-ishou-tategu.pdf",  label: "意匠：建具" },
  { file: "shuken-book-shousai-kouzou.pdf",        label: "構造" }
];

// ---- 2. 状態 ----
let currentPdf  = "shuken-book-shousai-mokuji.pdf"; // 初期：目次
let currentPage = 1;

// ---- 3. 要素取得 ----
const pdfButtons        = document.querySelectorAll(".pdf-btn");
const currentFileLabel  = document.getElementById("currentFileLabel");
const pageInput         = document.getElementById("pageInput");
const pageJumpBtn       = document.getElementById("pageJumpBtn");

const searchInput = document.getElementById("searchInput");
const searchBtn   = document.getElementById("searchBtn");
const searchInfo  = document.getElementById("searchInfo");
const resultList  = document.getElementById("resultList");
const tagButtons  = document.querySelectorAll(".tag-btn");

const installBtn  = document.getElementById("installBtn");

// ---- 4. 共通：PDF をページ付きで開く（同じタブ） ----
function openPdfAtPage(pdfFile, page) {
  if (!page || page <= 0) page = 1;
  const url = `${pdfFile}#page=${page}`;
  console.log("PDFオープン:", url);

  // 同じタブで開く → ブラウザの「戻る」で検索画面に戻れる
  window.location.href = url;
}

// ---- 5. PDFボタンの見た目更新 ----
function getPdfLabel(pdfFile) {
  if (pdfFile.includes("mokuji")) return "目次";
  if (pdfFile.includes("gaibu"))  return "意匠：外部";
  if (pdfFile.includes("naibu"))  return "意匠：内部";
  if (pdfFile.includes("tategu")) return "意匠：建具";
  if (pdfFile.includes("kouzou")) return "構造";
  return pdfFile;
}

function updatePdfButtonsActive() {
  pdfButtons.forEach(btn => {
    if (btn.dataset.file === currentPdf) {
      btn.classList.add("pdf-btn-active");
    } else {
      btn.classList.remove("pdf-btn-active");
    }
  });

  if (currentFileLabel) {
    currentFileLabel.textContent =
      `現在：${getPdfLabel(currentPdf)}（${currentPdf}）`;
  }
}

// ---- 6. PDF切替ボタン ----
pdfButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const file = btn.dataset.file;
    if (!file) return;
    currentPdf  = file;
    currentPage = 1;
    if (pageInput) pageInput.value = String(currentPage);
    updatePdfButtonsActive();
  });
});

updatePdfButtonsActive();
if (pageInput) pageInput.value = String(currentPage);

// ---- 7. ページジャンプ ----
function setPdfPage(page) {
  currentPage = page || 1;
  if (pageInput) pageInput.value = String(currentPage);
  openPdfAtPage(currentPdf, currentPage);
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

// ---- 8. pdf.js 用キャッシュ＆全文検索 ----
const pdfDocCache = {}; // { file名: PDFDocument }

async function loadPdfDocument(file) {
  if (pdfDocCache[file]) return pdfDocCache[file];

  const loadingTask = pdfjsLib.getDocument(file);
  const pdfDoc = await loadingTask.promise;
  pdfDocCache[file] = pdfDoc;
  return pdfDoc;
}

// 指定キーワードを、全PDFから探して最初に見つかったページを開く
async function searchAllPdfsAndOpen(term) {
  const q = term.trim().toLowerCase();
  if (!q) return;

  if (searchInfo) {
    searchInfo.textContent = `「${term}」をPDF全文から検索中…`;
  }

  for (const pdfInfo of PDF_FILES) {
    const pdfDoc = await loadPdfDocument(pdfInfo.file);
    const total = pdfDoc.numPages;

    for (let pageNum = 1; pageNum <= total; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(" ");

      if (text.toLowerCase().includes(q)) {
        // 見つかったら、そのPDFのそのページを開く
        if (searchInfo) {
          searchInfo.textContent =
            `「${term}」は ${pdfInfo.label} の p.${pageNum} で見つかりました。`;
        }
        currentPdf  = pdfInfo.file;
        currentPage = pageNum;
        if (pageInput) pageInput.value = String(currentPage);
        updatePdfButtonsActive();
        openPdfAtPage(currentPdf, currentPage);
        return;
      }
    }
  }

  if (searchInfo) {
    searchInfo.textContent = `「${term}」はPDF内で見つかりませんでした。`;
  }
}

// ---- 9. 検索ロジック（登録済み＋全文検索） ----
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

  results.forEach(item => {
    const li = document.createElement("li");
    li.className = "result-item";

    const title = document.createElement("div");
    title.className = "result-title";
    title.textContent = item.label;

    const meta = document.createElement("div");
    meta.className = "result-meta";
    const kind =
      item.pdf.includes("mokuji") ? "目次" :
      item.pdf.includes("gaibu")  ? "意匠：外部" :
      item.pdf.includes("naibu")  ? "意匠：内部" :
      item.pdf.includes("tategu") ? "意匠：建具" :
      item.pdf.includes("kouzou") ? "構造" : "PDF";

    meta.textContent = `${kind} / p.${item.page}`;

    li.appendChild(title);
    li.appendChild(meta);

    li.addEventListener("click", () => {
      currentPdf  = item.pdf;
      currentPage = item.page;
      if (pageInput) pageInput.value = String(currentPage);
      updatePdfButtonsActive();
      openPdfAtPage(currentPdf, currentPage);
    });

    resultList.appendChild(li);
  });
}

async function doSearch() {
  if (!searchInput) return;
  const term = searchInput.value.trim();
  if (!term) {
    renderResults([], term);
    return;
  }

  // 1) まず登録済みインデックスから検索
  const indexResults = searchIndex(term);
  renderResults(indexResults, term);

  // 2) 登録済みでヒットがなかったら、全文検索に切り替え
  if (indexResults.length === 0) {
    await searchAllPdfsAndOpen(term);
  }
}

// 検索ボタン・Enterキー
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

// ---- 10. PWA インストール処理 ----
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

// ---- 11. Service Worker 登録 ----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .catch(err => console.error("SW registration failed:", err));
  });
}
