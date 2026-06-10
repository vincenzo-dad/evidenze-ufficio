# 📋 Evidenze Ufficio

Applicazione web per la gestione collaborative di evidenze di ufficio con notifiche email automatiche.

## ✨ Caratteristiche

- ✅ **Gestione Evidenze** - Create, modifica, elimina evidenze
- ✅ **Multi-utente** - Modifiche in tempo reale con WebSocket
- ✅ **Autenticazione** - Login/Registrazione con JWT
- ✅ **Email Automatiche** - Notifiche 3 giorni prima scadenza
- ✅ **Filtri e Ricerca** - Organizza per stato e priorità
- ✅ **Responsive** - Funziona su mobile e desktop

## 🚀 Stack Tecnologico

**Backend:**
- Node.js + Express
- PostgreSQL
- Socket.io (real-time)
- Nodemailer (email)
- Node-schedule (scheduler)
- JWT (autenticazione)

**Frontend:**
- React 18
- Socket.io Client
- CSS3

## 📦 Installazione

### Prerequisiti
- Node.js >= 14
- PostgreSQL >= 12
- Account email (Gmail/Outlook) per le notifiche

### 1. Clona il repository
```bash
git clone https://github.com/vincenzo-dad/evidenze-ufficio.git
cd evidenze-ufficio
```

### 2. Setup Backend
```bash
cd server
npm install
```

Crea il file `.env`:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=evidenze_db
DB_PASSWORD=your_password
DB_PORT=5432

JWT_SECRET=your-super-secret-key

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

CLIENT_URL=http://localhost:3000
PORT=5000
```

**Per Gmail:**
1. Abilita 2FA nel tuo account Google
2. Genera una App Password: https://myaccount.google.com/apppasswords
3. Usa quella password nel `.env`

### 3. Setup Frontend
```bash
cd ../client
npm install
```

Crea il file `.env`:
```
REACT_APP_API_URL=http://localhost:5000
```

## 🏃 Avvio

### Modalità Sviluppo (da root directory)
```bash
npm run dev
```

Questo avvia:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### Produzione
```bash
# Build frontend
cd client
npm run build

# Avvia solo il server (serve anche il frontend)
cd ../server
npm start
```

## 📖 Utilizzo

1. **Registrati** con email e password
2. **Crea evidenze** con titolo, descrizione, categoria, priorità e scadenza
3. **Modifica** lo stato (aperta/completata/scaduta)
4. **Ricevi email** 3 giorni prima della scadenza
5. **Collabora** in tempo reale con altri utenti

## 🔒 Sicurezza

- Password hashate con bcryptjs
- JWT per autenticazione API
- CORS configurato
- Variabili sensibili in `.env`

## 📧 Email Scheduler

Lo scheduler esegue ogni giorno alle 08:00:
- Verifica evidenze non notificate con scadenza tra 3 giorni
- Invia email agli utenti assegnati
- Marca come notificate per evitare duplicati

## 🗄️ Schema Database

**users**
- id, email, password, nome, cognome, ruolo, created_at

**evidenze**
- id, titolo, descrizione, categoria, priorita, data_scadenza, stato, assegnato_a, creato_da, notificata_email

**allegati**
- id, evidenza_id, nome_file, url_file, created_at

## 🎨 Features Frontend

- Dashboard intuitiva
- Filtri per stato (aperta/completata/scaduta)
- Colori indicativi di urgenza
- Indicatore giorni alla scadenza
- Modifica inline
- Eliminazione con conferma

## 🐛 Troubleshooting

**Errore connessione database:**
- Verifica che PostgreSQL sia in esecuzione
- Controlla credenziali in `.env`

**Email non inviate:**
- Controlla credenziali Gmail
- Verifica App Password (non password normale)
- Controlla log del server

**WebSocket non funziona:**
- Verifica CORS in `server/index.js`
- Controlla che il client conosca l'URL del server

## 📝 TODO Futuri

- [ ] Caricamento allegati
- [ ] Assegnazione utenti
- [ ] Commenti/Note
- [ ] Notifiche in-app
- [ ] Export PDF
- [ ] Dark mode
- [ ] Statistiche

## 👨‍💻 Autore

Vincenzo DAD

## 📄 Licenza

MIT

---

**Domande?** Crea un'issue su GitHub!
