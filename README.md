📅 HARMONOGRAM - System Zarządzania Budową
System zarządzania projektami budowlanymi dla firm wykonawczych instalacji elektrycznych.
Wersja: 1.0 (faza testów)  
Autor: Seweryn Baran  
Licencja: Komercyjna — wymagany klucz licencyjny
---
🏗️ Opis systemu
HARMONOGRAM to moduł systemu KRES (Kompleksowy Rejestr Ewidencji Stanów) służący do:
Planowania harmonogramu robót — etapy, zadania, podpunkty z datami i godzinami
Śledzenia postępu prac — ręczne zatwierdzanie przez kierownika realizacji
Zarządzania materiałami — kody KRES, stany magazynowe, walidacja duplikatów
Eksportu dokumentów — harmonogram do WORD (.doc) na narady z Generalnym Wykonawcą
Kalendarza i przypomnień — widok miesięczny z zadaniami, notatkami i reminderami
Administracji — zarządzanie użytkownikami, rolami i licencjami
---
📋 Moduły
Moduł	Plik	Opis
Logowanie	`index.html`	Ekran logowania
Dashboard	`dashboard.html`	Karty projektów z postępem
Projekty	`projekty.html`	Lista projektów (CRUD)
Harmonogram	`harmonogram.html`	Etapy, zadania, Gantt, export WORD
Kalendarz	`kalendarz.html`	Widok miesięczny z zadaniami
Reminder	`reminder.html`	Przypomnienia z datetime
Magazyn	`magazyn.html`	Materiały KRES z walidacją kodów
Admin	`admin.html`	Zarządzanie użytkownikami
---
🔧 Architektura
Frontend: HTML/CSS/JS — hostowany na GitHub Pages
Backend: Google Apps Script (JSONP API)
Baza danych: Google Sheets (przejściowo, migracja na SQL planowana)
Serwer licencji: Osobny Apps Script + Google Sheets
Ochrona licencji: `licencja.js` — sprawdzanie przy starcie każdej strony
---
👥 Role użytkowników
Rola	Uprawnienia
Kierownik	Harmonogram, zatwierdzanie postępu, kalendarz, reminder, magazyn
Dyrektor	Podgląd wszystkich projektów, zarządzanie użytkownikami
Administrator	Pełny dostęp, nie wlicza się do limitu stanowisk
---
🔐 Bezpieczeństwo
Hasła hashowane SHA-256 + salt
Sesje z tokenami UUID (ważność 7 lub 30 dni)
Serwer licencyjny na osobnym koncie Google
Zabezpieczenie kasowania — wpisanie nazwy do potwierdzenia
---
📦 Kody KRES
Format: `XX YYY ZZ`
`XX` — Grupa główna (10-90)
`YYY` — Indeks produktu (001-999)
`ZZ` — Wariant (10, 20, 30...)
System automatycznie podpowiada pierwszy wolny indeks i waliduje duplikaty.
---
🚀 Deployment
Pliki HTML → GitHub Pages
Code.gs + Auth.gs → Google Apps Script (konto firmowe)
Serwer licencji → Google Apps Script (konto administratora)
Baza danych → Google Sheets
---
System HARMONOGRAM jest częścią projektu KRES.  
Copyright © 2025 Seweryn Baran. Wszelkie prawa zastrzeżone.
