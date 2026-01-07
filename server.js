require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');

// 1. INITIALISATION SERVEUR    


const app = express();
app.use(bodyParser.json());
app.use(cors());

// 2. CONNEXION MARIADB (Utilisation des variables du .env)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.log("precess.env.DB_HOST:", process.env.DB_HOST);  
        console.log("precess.env.DB_USER:", process.env.DB_USER);  
        console.log("precess.env.DB_NAME:", process.env.DB_NAME);       
        console.log("precess.env.DB_PASS:", process.env.DB_PASS );       
        console.error('ERREUR BDD :', err.message);
        // Astuce : Afficher les variables pour débugger si besoin (sauf le mdp !)
        console.log('Tentative sur :', process.env.DB_HOST); 
    } else {
        console.log('>>> Connecté à la base MariaDB');
    }
});

// 3. ROUTES API (IMPORTANT : ELLES DOIVENT ÊTRE ICI)

// --- Inscription ---
app.post('/api/register', (req, res) => {
    const { prenom, nom, email, mdp } = req.body;
    console.log(`[REGISTER] Demande pour : ${email}`);

    const query = 'INSERT INTO User (prenom, nom, email, mdp) VALUES (?, ?, ?, ?)';
    db.query(query, [prenom, nom, email, mdp], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(400).json({ success: false, message: "Erreur ou Email pris" });
        }
        res.json({ success: true, message: "Compte créé !" });
    });
});

// --- Connexion ---
app.post('/api/login', (req, res) => {
    const { email, mdp } = req.body;
    console.log(`[LOGIN] Demande pour : ${email}`);

    const query = 'SELECT * FROM User WHERE email = ? AND mdp = ?';
    db.query(query, [email, mdp], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Erreur serveur" });

        if (results.length > 0) {
            // On renvoie le JSON attendu par le script
            res.json({ success: true, token: "TOKEN_" + results[0].id });
        } else {
            res.status(401).json({ success: false, message: "Identifiants incorrects" });
        }
    });
});

// --- Position GPS (Pour la carte) ---
app.get('/api/boat-position', (req, res) => {
    const query = 'SELECT latitude, longitude FROM positions_gps ORDER BY date_heure DESC LIMIT 1';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length === 0) return res.status(404).json({ success: false });
        res.json({ success: true, position: results[0] });
    });
});

// 4. SERVIR LE SITE WEB (FICHIERS STATIQUES)
app.use(express.static(path.join(__dirname, 'public')));

// 5. CORRECTION DU BUG "PATH ERROR" (*)
// Au lieu de '*', on utilise une expression régulière /(.*)/ pour capturer toutes les autres routes
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// 6. LANCEMENT
const PORT = 3000;
app.listen(PORT, () => {
    console.log("========================================");
    console.log(`SERVEUR EN LIGNE : http://localhost:${PORT}`);
    console.log("========================================");
});