// =============================
// 集研BOOK service worker（自動アップデート＋ネット優先）
// =============================

const CACHE_NAME = "shuken-book-cache-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./viewer.html",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.webmanifest"
  // 必要に応じて他の静的ファイルを追加
];

// インストール時：基本ファイルをキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  // 新しいSWを即座に有効化
  self.skipWaiting();
});

// 有効化時：古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 取得時：ネット優先＋オフライン時はキャッシュ利用
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // POSTなどはスキップ
  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 正常レスポンスだけキャッシュ
        const respClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, respClone);
        });
        return response;
      })
      .catch(() => {
        // オフラインなどで失敗したらキャッシュを探す
        return caches.match(request).then((cachedRes) => {
          if (cachedRes) return cachedRes;
          // それも無ければトップページ
          return caches.match("./");
        });
      })
  );
});
