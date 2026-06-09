const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'evidenze_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Email Transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ==================== UTILITY ====================

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return null;
  }
};

// Middleware: Autenticazione
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token mancante' });
  
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Token non valido' });
  
  req.user = decoded;
  next();
};

// ==================== DATABASE INIT ====================

const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        cognome VARCHAR(255) NOT NULL,
        ruolo VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS evidenze (
        id SERIAL PRIMARY KEY,
        titolo VARCHAR(255) NOT NULL,
        descrizione TEXT,
        categoria VARCHAR(100),
        priorita VARCHAR(20) DEFAULT 'media',
        data_scadenza DATE NOT NULL,
        stato VARCHAR(50) DEFAULT 'aperta',
        assegnato_a INTEGER REFERENCES users(id),
        creato_da INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notificata_email BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS allegati (
        id SERIAL PRIMARY KEY,
        evidenza_id INTEGER NOT NULL REFERENCES evidenze(id) ON DELETE CASCADE,
        nome_file VARCHAR(255) NOT NULL,
        url_file TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Database inizializzato con successo');
  } catch (error) {
    console.error('❌ Errore inizializzazione database:', error);
  }
};

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nome, cognome } = req.body;
    
    if (!email || !password || !nome || !cognome) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password, nome, cognome) VALUES ($1, $2, $3, $4) RETURNING id, email, nome, cognome',
      [email, hashedPassword, nome, cognome]
    );

    const token = generateToken(result.rows[0]);
    res.json({ message: 'Registrazione completata', token, user: result.rows[0] });
  } catch (error) {
    console.error('Errore registrazione:', error);
    res.status(500).json({ error: 'Errore durante la registrazione' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = generateToken(user);
    res.json({ 
      message: 'Login completato', 
      token, 
      user: { id: user.id, email: user.email, nome: user.nome, cognome: user.cognome } 
    });
  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({ error: 'Errore durante il login' });
  }
});

// ==================== EVIDENZE ROUTES ====================

app.get('/api/evidenze', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, u.nome, u.cognome, u.email
      FROM evidenze e
      LEFT JOIN users u ON e.creato_da = u.id
      ORDER BY e.data_scadenza ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Errore lettura evidenze:', error);
    res.status(500).json({ error: 'Errore durante la lettura' });
  }
});

app.post('/api/evidenze', authMiddleware, async (req, res) => {
  try {
    const { titolo, descrizione, categoria, priorita, data_scadenza, assegnato_a } = req.body;
    
    if (!titolo || !data_scadenza) {
      return res.status(400).json({ error: 'Titolo e data scadenza obbligatori' });
    }

    const result = await pool.query(
      `INSERT INTO evidenze (titolo, descrizione, categoria, priorita, data_scadenza, assegnato_a, creato_da)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [titolo, descrizione, categoria, priorita, data_scadenza, assegnato_a, req.user.id]
    );

    const nuovaEvidenza = result.rows[0];
    io.emit('nuova_evidenza', nuovaEvidenza);
    
    res.status(201).json(nuovaEvidenza);
  } catch (error) {
    console.error('Errore creazione evidenza:', error);
    res.status(500).json({ error: 'Errore durante la creazione' });
  }
});

app.put('/api/evidenze/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { titolo, descrizione, categoria, priorita, data_scadenza, stato, assegnato_a } = req.body;

    const result = await pool.query(
      `UPDATE evidenze 
       SET titolo = COALESCE($1, titolo), 
           descrizione = COALESCE($2, descrizione),
           categoria = COALESCE($3, categoria),
           priorita = COALESCE($4, priorita),
           data_scadenza = COALESCE($5, data_scadenza),
           stato = COALESCE($6, stato),
           assegnato_a = COALESCE($7, assegnato_a),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [titolo, descrizione, categoria, priorita, data_scadenza, stato, assegnato_a, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evidenza non trovata' });
    }

    io.emit('evidenza_aggiornata', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Errore aggiornamento evidenza:', error);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento' });
  }
});

app.delete('/api/evidenze/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM evidenze WHERE id = $1', [id]);
    
    io.emit('evidenza_eliminata', { id });
    res.json({ message: 'Evidenza eliminata' });
  } catch (error) {
    console.error('Errore eliminazione evidenza:', error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione' });
  }
});

// ==================== SCHEDULER EMAIL ====================

const scheduleEmailNotifications = () => {
  // Esegui ogni giorno alle 08:00
  schedule.scheduleJob('0 8 * * *', async () => {
    console.log('🔔 Checking evidenze per notifiche email...');
    
    try {
      const result = await pool.query(`
        SELECT e.*, u.email
        FROM evidenze e
        JOIN users u ON e.assegnato_a = u.id
        WHERE e.stato = 'aperta'
        AND e.notificata_email = FALSE
        AND e.data_scadenza = CURRENT_DATE + INTERVAL '3 days'
      `);

      for (const evidenza of result.rows) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: evidenza.email,
          subject: `⚠️ Evidenza in scadenza: ${evidenza.titolo}`,
          html: `
            <h2>Promemoria Evidenza</h2>
            <p>Caro ${evidenza.email.split('@')[0]},</p>
            <p>L'evidenza <strong>"${evidenza.titolo}"</strong> scade tra <strong>3 giorni</strong>.</p>
            <p><strong>Data scadenza:</strong> ${evidenza.data_scadenza}</p>
            <p><strong>Priorità:</strong> ${evidenza.priorita}</p>
            <p>Ti preghiamo di verificare lo stato della stessa nel sistema.</p>
            <p>Cordiali saluti,<br>Sistema di gestione evidenze</p>
          `
        };

        transporter.sendMail(mailOptions, async (error) => {
          if (error) {
            console.error(`❌ Errore invio email per evidenza ${evidenza.id}:`, error);
          } else {
            console.log(`✅ Email inviata per evidenza ${evidenza.id}`);
            // Marca come notificata
            await pool.query('UPDATE evidenze SET notificata_email = TRUE WHERE id = $1', [evidenza.id]);
          }
        });
      }
    } catch (error) {
      console.error('❌ Errore scheduler email:', error);
    }
  });

  console.log('📅 Scheduler email configurato');
};

// ==================== WEBSOCKET ====================

io.on('connection', (socket) => {
  console.log(`👤 Utente connesso: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`👤 Utente disconnesso: ${socket.id}`);
  });

  socket.on('evidenza_update', (data) => {
    socket.broadcast.emit('evidenza_update', data);
  });
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await initDatabase();
  scheduleEmailNotifications();
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer().catch(console.error);

module.exports = app;
