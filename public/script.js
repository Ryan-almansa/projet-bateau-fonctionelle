// =========================================================
// CONFIGURATION AUTOMATIQUE DE L'IP
// =========================================================
// Cela permet de fonctionner sur localhost OU 172.29.19.42 sans rien toucher
const API_URL = `http://${window.location.hostname}:3000`;

// =========================================================
// 1. FONCTION INSCRIPTION (REGISTER)
// =========================================================
async function register() {
    const elPrenom = document.getElementById('reg-prenom');
    const elNom = document.getElementById('reg-nom');
    const elEmail = document.getElementById('reg-email');
    const elMdp = document.getElementById('reg-mdp');
    const msg = document.getElementById('error-msg');

    if (!elPrenom.value || !elNom.value || !elEmail.value || !elMdp.value) {
        msg.innerText = "Veuillez remplir tous les champs.";
        msg.style.color = "#ff4d4d"; // Rouge
        return;
    }

    const bodyData = {
        prenom: elPrenom.value,
        nom: elNom.value,
        email: elEmail.value,
        mdp: elMdp.value
    };

    try {
        // Utilisation de API_URL au lieu de l'IP en dur
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();
        
        msg.innerText = data.message;
        msg.style.color = data.success ? "#10b981" : "#ff4d4d"; // Vert ou Rouge

        if (data.success) {
            // Vide les champs si succès
            elPrenom.value = ""; elNom.value = ""; elEmail.value = ""; elMdp.value = "";
        }

    } catch (err) {
        console.error("Erreur register:", err);
        msg.innerText = "Erreur : Impossible de contacter le serveur.";
        msg.style.color = "#ff4d4d";
    }
}

// =========================================================
// 2. FONCTION CONNEXION (LOGIN)
// =========================================================
async function login() {
    const elEmail = document.getElementById('login-email');
    const elMdp = document.getElementById('login-mdp');
    const msg = document.getElementById('error-msg');

    if (!elEmail.value || !elMdp.value) {
        msg.innerText = "Veuillez entrer un email et un mot de passe.";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: elEmail.value, mdp: elMdp.value })
        });

        const data = await response.json();

        if (data.success) {
            // Sauvegarde le token
            localStorage.setItem('myToken', data.token);
            msg.innerText = "";
            showDashboard(data.token);
        } else {
            msg.innerText = data.message;
            msg.style.color = "#ff4d4d";
        }
    } catch (err) {
        console.error("Erreur login:", err);
        msg.innerText = "Erreur de connexion (Serveur injoignable).";
        msg.style.color = "#ff4d4d";
    }
}

// =========================================================
// 3. GESTION DU DASHBOARD ET DE LA CARTE
// =========================================================
let map;
let boatMarker;
// Position de départ (Marseille)
let boatPos = [43.2965, 5.3698]; 

function showDashboard(token) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    document.getElementById('display-token').innerText = "Connecté";
    
    // Initialise la carte seulement si elle n'existe pas déjà
    if (!map) {
        setTimeout(initMap, 500); // Petit délai pour éviter les bugs d'affichage
    }
}

function initMap() {
    if (map) return; // Sécurité

    // Création de la carte
    map = L.map('map').setView(boatPos, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Icône personnalisée pour le bateau
    const boatIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2904/2904913.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    // Création du marqueur
    boatMarker = L.marker(boatPos, { icon: boatIcon }).addTo(map)
        .bindPopup('<b>Navire G-Deux</b><br>En mouvement...')
        .openPopup();

    // Lance l'animation
    simulateMovement();
}

// === C'EST ICI QUE J'AI FAIT LA MODIFICATION ===
// Remplace l'ancienne fonction par celle-ci
function updateBoatPosition() {
    console.log("Récupération de la position réelle depuis la base de données...");

    // On appelle l'API pour récupérer la DERNIÈRE position enregistrée
    fetch(`${API_URL}/api/boat-position`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.position) {
                // Conversion des données de la table positions_gps
                const newLat = parseFloat(data.position.latitude);
                const newLon = parseFloat(data.position.longitude);
                const newPos = [newLat, newLon];

                // Mise à jour du marqueur sur la carte
                if (boatMarker) {
                    boatMarker.setLatLng(newPos);
                    
                    // Optionnel : Recentrer la carte si le bateau bouge beaucoup
                    // map.panTo(newPos); 

                    // Mise à jour du popup avec les vraies coordonnées
                    boatMarker.getPopup().setContent(
                        `<b>L'Hermione</b><br>
                        Lat: ${newLat.toFixed(6)}<br>
                        Lon: ${newLon.toFixed(6)}<br>
                        <small>Mis à jour le : ${data.position.date_heure}</small>`
                    ).openOn(map);
                }
            }
        })
        .catch(err => console.error("Erreur lors de la récupération GPS:", err));
}

// Modifie l'appel dans initMap
function initMap() {
    if (map) return;

    // On centre par défaut sur la première position de ta base (Marseille environ)
    map = L.map('map').setView([43.31, 5.39], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    const boatIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2904/2904913.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    boatMarker = L.marker([43.31, 5.39], { icon: boatIcon }).addTo(map)
        .bindPopup('Chargement de la position...')
        .openPopup();

    // Appeler immédiatement puis toutes les 3 secondes
    updateBoatPosition();
    setInterval(updateBoatPosition, 3000); 
}

function logout() {
    localStorage.removeItem('myToken');
    location.reload();
}

// Vérification de connexion au chargement de la page
window.onload = () => {
    const savedToken = localStorage.getItem('myToken');
    if (savedToken) showDashboard(savedToken);
};