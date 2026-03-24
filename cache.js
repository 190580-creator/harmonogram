// ============================================================================
// CACHE.JS - Moduł Cache Danych HARMONOGRAM
// Podłącz: <script src="cache.js"></script> w każdym HTML (po licencja.js)
// ============================================================================
// Jedno zapytanie getAllData zamiast 5 osobnych.
// Cache ważny 5 min — kolejne przejścia nie odpytują serwera.
// Po zapisie (dodaj/edytuj/usuń) cache jest czyszczony.
// ============================================================================

(function() {
  var API_BASE = 'https://script.google.com/macros/s/AKfycbx2tlGCQScIFrtnuawW_Q62QQmG2WuUyI1AMZ64x1t1KApuM1jQCM5RIHPMx8fkZ1s-/exec';
  var CACHE_KEY = 'harmonogram_data_cache';
  var CACHE_TTL = 300000; // 5 minut

  // Pobierz cache
  function getCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (Date.now() - data._cachedAt > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return data;
    } catch(e) { return null; }
  }

  // Zapisz cache
  function setCache(data) {
    try {
      data._cachedAt = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch(e) {}
  }

  // Wyczyść cache (po zapisie danych)
  function clearCache() {
    localStorage.removeItem(CACHE_KEY);
  }

  // JSONP helper
  function jpCache(action, params, cb) {
    var cbN = 'cb_cache_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
    var url = API_BASE + '?action=' + action + '&callback=' + cbN;
    for (var k in params) url += '&' + k + '=' + encodeURIComponent(params[k]);
    window[cbN] = function(r) { cb(r); delete window[cbN]; };
    var s = document.createElement('script'); s.src = url;
    s.onerror = function() { cb({ success: false }); };
    document.body.appendChild(s);
  }

  // Pobierz wszystkie dane (z cache lub z serwera)
  function fetchAllData(callback) {
    var cached = getCache();
    if (cached && cached.success) {
      callback(cached);
      return;
    }
    var user = null;
    try { user = JSON.parse(localStorage.getItem('harmonogram_user')); } catch(e) {}
    jpCache('getAllData', { user: JSON.stringify(user) }, function(r) {
      if (r.success) setCache(r);
      callback(r);
    });
  }

  // Eksportuj do window
  window.dataCache = {
    fetch: fetchAllData,
    clear: clearCache,
    get: getCache,
    set: setCache
  };
})();
