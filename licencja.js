// ============================================================================
// HARMONOGRAM - Moduł Licencji
// Copyright © 2025 Seweryn Baran
// ============================================================================
// Podłącz do HTML: <script src="licencja.js"></script>
// Musi być PRZED głównym <script> strony
// ============================================================================

(function() {
  const LICENSE_SERVER = 'https://script.google.com/macros/s/AKfycbx5m2PXW8CJN7gEhxh9V3jNcWjckqqBxfpxTnhOq4sxeEIIvwguLvOdDvKYrZncF5aK7w/exec';
  const LICENSE_KEY = 'FAKE-KEY-TEST';
  const CHECK_INTERVAL = 3600000; // Sprawdzaj co godzinę (ms)
  const CACHE_KEY = 'harmonogram_license';
  const CACHE_TTL = 3600000; // Cache na 1 godzinę

  // Sprawdź cache — żeby nie odpytywać serwera przy każdym przejściu między stronami
  function getCachedLicense() {
    try {
      var cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      var data = JSON.parse(cached);
      if (Date.now() - data.timestamp > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return data.result;
    } catch(e) { return null; }
  }

  function cacheLicenseResult(result) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        result: result,
        timestamp: Date.now()
      }));
    } catch(e) {}
  }

  // Blokada interfejsu
  function blockInterface(message, detail) {
    // Usuń całą zawartość body
    document.body.innerHTML = '';
    document.body.style.cssText = 'margin:0;padding:0;font-family:Segoe UI,sans-serif;background:#f5f7fa;display:flex;align-items:center;justify-content:center;min-height:100vh;';
    
    var box = document.createElement('div');
    box.style.cssText = 'background:white;padding:50px;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.15);text-align:center;max-width:500px;width:90%;';
    box.innerHTML = 
      '<div style="font-size:64px;margin-bottom:20px">🔒</div>' +
      '<h1 style="color:#dc3545;font-size:24px;margin-bottom:15px">Licencja nieaktywna</h1>' +
      '<p style="color:#666;font-size:16px;margin-bottom:20px">' + message + '</p>' +
      (detail ? '<p style="color:#999;font-size:13px;margin-bottom:25px">' + detail + '</p>' : '') +
      '<div style="padding:15px;background:#f8f9fa;border-radius:10px;margin-bottom:20px">' +
        '<div style="font-size:12px;color:#999">Klucz licencji</div>' +
        '<div style="font-family:monospace;font-size:14px;color:#333;margin-top:5px">' + LICENSE_KEY + '</div>' +
      '</div>' +
      '<p style="color:#999;font-size:12px">Skontaktuj się z dostawcą systemu:<br><strong>Seweryn Baran</strong></p>';
    
    document.body.appendChild(box);
  }

  // Sprawdzanie licencji
  function checkLicense(callback) {
    // Najpierw sprawdź cache
    var cached = getCachedLicense();
    if (cached) {
      if (cached.valid) {
        if (callback) callback(true);
        return;
      } else {
        blockInterface(cached.message || 'Licencja nieaktywna', 'Kod błędu: CACHED');
        return;
      }
    }

    // Odpytaj serwer licencji (JSONP nie zadziała bo serwer zwraca JSON, nie JSONP)
    // Używamy fetch z no-cors fallback
    var url = LICENSE_SERVER + '?action=check&key=' + encodeURIComponent(LICENSE_KEY);
    
    // Próbuj fetch
    if (window.fetch) {
      fetch(url)
        .then(function(response) { return response.json(); })
        .then(function(result) {
          cacheLicenseResult(result);
          if (result.valid) {
            if (callback) callback(true);
          } else {
            blockInterface(
              result.message || 'Licencja nieaktywna',
              result.expiresAt ? 'Wygasła: ' + result.expiresAt : ''
            );
          }
        })
        .catch(function(err) {
          // Błąd połączenia — pozwól działać (grace period)
          // Żeby system nie blokował się przy braku internetu
          console.warn('License check failed (offline?): ' + err.message);
          if (callback) callback(true);
        });
    } else {
      // Stara przeglądarka bez fetch — pozwól działać
      if (callback) callback(true);
    }
  }

  // Periodyczne sprawdzanie (co godzinę)
  function startPeriodicCheck() {
    setInterval(function() {
      checkLicense();
    }, CHECK_INTERVAL);
  }

  // Eksportuj do window
  window._checkLicense = checkLicense;

  // Automatyczne sprawdzenie przy ładowaniu
  // Czekamy aż DOM będzie gotowy
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      checkLicense(function(valid) {
        if (valid) startPeriodicCheck();
      });
    });
  } else {
    checkLicense(function(valid) {
      if (valid) startPeriodicCheck();
    });
  }
})();
