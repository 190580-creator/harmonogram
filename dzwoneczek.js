// ============================================================================
// DZWONECZEK - Moduł Powiadomień HARMONOGRAM
// Podłącz: <script src="dzwoneczek.js"></script> w każdym HTML
// Wymaga: API URL w zmiennej API lub API_URL, user w localStorage
// ============================================================================

(function() {
  var API_BASE = 'https://script.google.com/macros/s/AKfycbx2tlGCQScIFrtnuawW_Q62QQmG2WuUyI1AMZ64x1t1KApuM1jQCM5RIHPMx8fkZ1s-/exec';
  var user = null;
  try { user = JSON.parse(localStorage.getItem('harmonogram_user')); } catch(e) {}
  if (!user) return;

  // Wstrzyknij CSS
  var style = document.createElement('style');
  style.textContent = 
    '.bell-wrap{position:relative;cursor:pointer;z-index:500}' +
    '.bell-icon{font-size:24px;transition:transform .3s}' +
    '.bell-icon:hover{transform:scale(1.15)}' +
    '.bell-badge{position:absolute;top:-5px;right:-8px;background:#dc3545;color:#fff;border-radius:50%;width:20px;height:20px;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #764ba2}' +
    '.bell-badge.hidden{display:none}' +
    '.notif-panel{display:none;position:absolute;top:45px;right:0;width:380px;max-height:450px;background:#fff;border-radius:15px;box-shadow:0 10px 40px rgba(0,0,0,.2);z-index:600;overflow:hidden}' +
    '.notif-panel.open{display:block}' +
    '.notif-header{padding:15px 20px;background:#f8f9fa;border-bottom:1px solid #e9ecef;font-weight:700;color:#333;font-size:15px;display:flex;justify-content:space-between}' +
    '.notif-list{max-height:380px;overflow-y:auto}' +
    '.notif-item{padding:12px 20px;border-bottom:1px solid #f0f0f0;transition:background .2s}' +
    '.notif-item:hover{background:#f9f9f9}' +
    '.ni-icon{font-size:20px;margin-right:10px}' +
    '.ni-text{font-size:13px;color:#333;font-weight:600}' +
    '.ni-sub{font-size:11px;color:#999;margin-top:3px}' +
    '.notif-empty{padding:30px;text-align:center;color:#999;font-size:14px}';
  document.head.appendChild(style);

  // Wstrzyknij HTML dzwoneczka do headera
  function injectBell() {
    var userInfo = document.querySelector('.user-info');
    if (!userInfo) return;
    // Sprawdź czy dzwoneczek już istnieje (np. w dashboard)
    if (document.getElementById('bellIcon')) return;

    var bellWrap = document.createElement('div');
    bellWrap.className = 'bell-wrap';
    bellWrap.onclick = function() { toggleNotifPanel(); };
    bellWrap.innerHTML = 
      '<span class="bell-icon" id="bellIcon">🔔</span>' +
      '<span class="bell-badge hidden" id="bellBadge">0</span>' +
      '<div class="notif-panel" id="notifPanel">' +
        '<div class="notif-header"><span>Powiadomienia</span><span id="notifCount"></span></div>' +
        '<div class="notif-list" id="notifList"><div class="notif-empty">Ładowanie...</div></div>' +
      '</div>';
    userInfo.insertBefore(bellWrap, userInfo.firstChild);
  }

  function toggleNotifPanel() {
    var p = document.getElementById('notifPanel');
    if (p) { p.classList.toggle('open'); if (p.classList.contains('open')) loadNotifications(); }
  }

  // Zamknij panel po kliknięciu poza
  document.addEventListener('click', function(e) {
    var panel = document.getElementById('notifPanel');
    var wrap = document.querySelector('.bell-wrap');
    if (panel && wrap && !wrap.contains(e.target)) panel.classList.remove('open');
  });

  // JSONP helper
  function jp(action, params, cb) {
    var cbN = 'cb_bell_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
    var url = API_BASE + '?action=' + action + '&callback=' + cbN;
    for (var k in params) url += '&' + k + '=' + encodeURIComponent(params[k]);
    window[cbN] = function(r) { cb(r); delete window[cbN]; };
    var s = document.createElement('script'); s.src = url;
    s.onerror = function() { cb({ success: false }); };
    document.body.appendChild(s);
  }

  function escB(s) { s = String(s||''); return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;'); }

  // Dismissed notifications
  function getDismissed() {
    try {
      var data = JSON.parse(localStorage.getItem('harmonogram_dismissed') || '{}');
      var now = Date.now();
      for (var k in data) { if (now - data[k] > 86400000) delete data[k]; }
      localStorage.setItem('harmonogram_dismissed', JSON.stringify(data));
      return data;
    } catch(e) { return {}; }
  }
  function addDismissed(key) {
    try {
      var data = getDismissed();
      data[key] = Date.now();
      localStorage.setItem('harmonogram_dismissed', JSON.stringify(data));
    } catch(e) {}
  }

  function loadNotifications() {
    var notifications = [];
    var userName = user ? user.name : '';
    var dismissed = getDismissed();
    var loaded = 0;

    function checkDone() {
      loaded++;
      if (loaded >= 2) renderNotifications(notifications);
    }

    jp('getReminders', {}, function(r) {
      if (r.success && r.reminders) {
        var today = new Date(); today.setHours(0,0,0,0);
        r.reminders.forEach(function(rem) {
          if (rem.status === 'Wykonane') return;
          var forMe = !rem.dlaKogo || rem.dlaKogo === userName || rem.dodal === userName;
          if (!forMe) return;
          var remDate = rem.dataOd ? new Date(rem.dataOd) : null;
          if (remDate) remDate.setHours(0,0,0,0);
          var isOverdue = remDate && remDate < today;
          var isToday = remDate && remDate.getTime() === today.getTime();
          var isFuture3 = remDate && remDate <= new Date(today.getTime() + 3*24*60*60*1000);
          if (isOverdue || isToday || isFuture3) {
            var dk = 'rem_' + rem.id + '_' + (rem.dataOd||'') + '_' + (rem.tytul||'').substring(0,20);
            if (dismissed[dk]) return;
            notifications.push({
              dismissKey: dk,
              icon: isOverdue ? '🔴' : isToday ? '⏰' : '📌',
              text: rem.tytul,
              sub: (isOverdue ? 'Po terminie! ' : isToday ? 'Dziś ' : 'Za kilka dni ') + (rem.dataOd||'') + (rem.godzina ? ' ' + rem.godzina : '') + (rem.dlaKogo ? ' | Dla: ' + rem.dlaKogo : ''),
              link: 'reminder.html',
              priority: isOverdue ? 0 : isToday ? 1 : 2
            });
          }
        });
      }
      checkDone();
    });

    jp('getNotatki', {}, function(r) {
      if (r.success && r.notatki) {
        var weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        r.notatki.forEach(function(n) {
          if (n.adresat && n.adresat === userName) {
            var nDate = new Date(n.data);
            if (nDate >= weekAgo) {
              var dk = 'note_' + n.id + '_' + (n.data||'') + '_' + (n.tytul||'').substring(0,20);
              if (dismissed[dk]) return;
              notifications.push({
                dismissKey: dk,
                icon: '📝',
                text: n.tytul,
                sub: 'Notatka na ' + (n.data||'') + (n.projektNazwa ? ' | ' + n.projektNazwa : ''),
                link: 'kalendarz.html',
                priority: 3
              });
            }
          }
        });
      }
      checkDone();
    });
  }

  function renderNotifications(notifs) {
    notifs.sort(function(a,b) { return a.priority - b.priority; });
    var badge = document.getElementById('bellBadge');
    var count = notifs.length;
    if (badge) {
      badge.textContent = count;
      badge.className = 'bell-badge' + (count === 0 ? ' hidden' : '');
    }
    var countEl = document.getElementById('notifCount');
    if (countEl) countEl.textContent = count > 0 ? count + ' nowych' : '';

    var list = document.getElementById('notifList');
    if (!list) return;
    if (count === 0) {
      list.innerHTML = '<div class="notif-empty">✅ Brak nowych powiadomień</div>';
      return;
    }
    list.innerHTML = notifs.map(function(n) {
      return '<div class="notif-item">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<span class="ni-icon">' + n.icon + '</span>' +
          '<div style="flex:1">' +
            '<div class="ni-text">' + escB(n.text) + '</div>' +
            '<div class="ni-sub">' + escB(n.sub) + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:5px">' +
            '<button onclick="event.stopPropagation();window.location.href=\'' + n.link + '\'" style="padding:4px 8px;border:1px solid #ddd;border-radius:5px;background:#fff;cursor:pointer;font-size:11px" title="Otwórz">📂</button>' +
            '<button onclick="event.stopPropagation();window._dismissNotif(this,\'' + escB(n.dismissKey) + '\')" style="padding:4px 8px;border:1px solid #28a745;border-radius:5px;background:#d4edda;cursor:pointer;font-size:11px;color:#155724" title="Przeczytane">✓</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  window._dismissNotif = function(btn, key) {
    addDismissed(key);
    var item = btn.closest('.notif-item');
    if (item) {
      item.style.opacity = '0.3';
      setTimeout(function() {
        item.remove();
        var items = document.querySelectorAll('#notifList .notif-item');
        var badge = document.getElementById('bellBadge');
        if (badge) {
          badge.textContent = items.length;
          badge.className = 'bell-badge' + (items.length === 0 ? ' hidden' : '');
        }
        if (items.length === 0) {
          var list = document.getElementById('notifList');
          if (list) list.innerHTML = '<div class="notif-empty">✅ Brak nowych powiadomień</div>';
        }
      }, 300);
    }
  };

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { injectBell(); loadNotifications(); });
  } else {
    injectBell(); loadNotifications();
  }
})();
