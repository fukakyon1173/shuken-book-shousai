// =============================
// 集研BOOK 詳細図集ビューア
// ・5つのPDF（目次／意匠 外部・内部・建具／構造）
// ・左側：全文検索結果（スニペット）一覧
// ・クリックで viewer.html で該当ページを表示
// =============================

// ---- 1. 検索対象PDFリスト ----
const PDF_FILES = [
  { file: "shuken-book-shousai-mokuji.pdf",       label: "目次" },
  { file: "shuken-book-shousai-ishou-gaibu.pdf",  label: "意匠：外部" },
  { file: "shuken-book-shousai-ishou-naibu.pdf",  label: "意匠：内部" },
  { file: "shuken-book-shousai-ishou-tategu.pdf", label: "意匠：建具" },
  { file: "shuken-book-shousai-kouzou.pdf",       label: "構造" }
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

// ---- 4. PDF を viewer.html 経由で開く ----
function openPdfAtPage(pdfFile, page) {
  if (!page || page <= 0) page = 1;
  const url = `viewer.html?file=${encodeURIComponent(pdfFile)}&page=${page}`;
  window.location.href = url;
}

// ---- 5. PDFボタン表示更新 ----
function getPdfLabel(pdfFile) {
  const info = PDF_FILES.find(p => p.file === pdfFile);
  return info ? info.label : pdfFile;
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

// ---- 7. ページ指定ジャンプ ----
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

// ---- 8. pdf.js 用キャッシュ ----
const pdfDocCache = {}; // { file名: PDFDocument }

async function loadPdfDocument(file) {
  if (pdfDocCache[file]) return pdfDocCache[file];
  const loadingTask = pdfjsLib.getDocument(file);
  const pdfDoc = await loadingTask.promise;
  pdfDocCache[file] = pdfDoc;
  return pdfDoc;
}

// ---- 9. 全文検索してスニペットを作る ----
// 戻り値: [{ pdf, label, page, snippet }, ...]
async function searchAllPdfsWithSnippets(term) {
  const q = term.trim().toLowerCase();
  const results = [];
  if (!q) return results;

  if (searchInfo) {
    searchInfo.textContent = `「${term}」をPDF全文から検索中…`;
  }

  const maxResults = 100; // ヒット数の上限

  for (const pdfInfo of PDF_FILES) {
    const pdfDoc = await loadPdfDocument(pdfInfo.file);
    const total = pdfDoc.numPages;

    for (let pageNum = 1; pageNum <= total; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(" ");

      const lowered = text.toLowerCase();
      const idx = lowered.indexOf(q);
      if (idx !== -1) {
        const CONTEXT = 40; // 前後の文脈文字数
        const start = Math.max(0, idx - CONTEXT);
        const end   = Math.min(text.length, idx + term.length + CONTEXT);
        const rawSnippet = text.slice(start, end).replace(/\s+/g, " ");

        results.push({
          pdf: pdfInfo.file,
          label: pdfInfo.label,
          page: pageNum,
          snippet: rawSnippet
        });

        if (results.length >= maxResults) return results;
      }
    }
  }

  return results;
}

// ---- 10. 検索結果の描画（左側リスト） ----
function renderResults(results, term) {
  if (!resultList || !searchInfo) return;

  resultList.innerHTML = "";

  if (!term || !term.trim()) {
    searchInfo.textContent = "キーワードを入力して検索してください。";
    return;
  }

  if (results.length === 0) {
    searchInfo.textContent = `「${term}」はPDF内で見つかりませんでした。`;
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
    meta.textContent = `p.${item.page} / ${item.pdf}`;

    const snippet = document.createElement("div");
    snippet.className = "result-snippet";
    snippet.textContent = item.snippet;

    li.appendChild(title);
    li.appendChild(meta);
    li.appendChild(snippet);

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

// ---- 11. 検索実行 ----
async function doSearch() {
  if (!searchInput) return;
  const term = searchInput.value.trim();
  if (!term) {
    renderResults([], term);
    return;
  }

  const results = await searchAllPdfsWithSnippets(term);
  renderResults(results, term);
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

// ---- 12. Service Worker 登録（必要なければこのブロックごと削除OK） ----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .catch(err => console.error("SW registration failed:", err));
  });
}
