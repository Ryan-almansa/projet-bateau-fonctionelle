// --- FONCTION INSCRIPTION (REGISTER) ---
async function register() {
    const elPrenom = document.getElementById('reg-prenom');
    const elNom = document.getElementById('reg-nom');
    const elEmail = document.getElementById('reg-email');
    const elMdp = document.getElementById('reg-mdp');
    const msg = document.getElementById('error-msg');

    if (!elPrenom || !elNom || !elEmail || !elMdp) return;

    const bodyData = {
        prenom: elPrenom.value,
        nom: elNom.value,
        email: elEmail.value,
        mdp: elMdp.value
    };

    if (!bodyData.prenom || !bodyData.nom || !bodyData.email || !bodyData.mdp) {
        msg.innerText = "Veuillez remplir tous les champs.";
        msg.style.color = "#ff4d4d";
        return;
    }

    try {
        const response = await fetch('http://172.29.19.42:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        // SECURITÉ : On vérifie si c'est bien du JSON avant de parser
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("Le serveur n'a pas renvoyé de JSON ! (Vérifiez votre serveur Node)");
        }

        const data = await response.json();
        msg.innerText = data.message;
        msg.style.color = data.success ? "#10b981" : "#ff4d4d";

        if (data.success) {
            elPrenom.value = ""; elNom.value = ""; elEmail.value = ""; elMdp.value = "";
        }
    } catch (err) {
        msg.innerText = "Erreur d'inscription (voir console)";
        console.error("Erreur register:", err);
    }
}

// --- FONCTION CONNEXION (LOGIN) ---
async function login() {
    const elEmail = document.getElementById('login-email');
    const elMdp = document.getElementById('login-mdp');
    const msg = document.getElementById('error-msg');

    if (!elEmail || !elMdp) return;

    try {
        const response = await fetch('http://172.29.19.42:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: elEmail.value, mdp: elMdp.value })
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            msg.innerText = "Erreur : Le serveur ne répond pas au bon format.";
            return;
        }

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('myToken', data.token);
            showDashboard(data.token);
        } else {
            msg.innerText = data.message;
            msg.style.color = "#ff4d4d";
        }
    } catch (err) {
        msg.innerText = "Erreur de connexion (serveur injoignable)";
        console.error("Erreur login:", err);
    }
}

// --- GESTION DU DASHBOARD ET DE LA CARTE ---
let map;
let boatMarker;
let boatPos = [43.2965, 5.3698]; 

function showDashboard(token) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    document.getElementById('display-token').innerText = token;
    
    if (!map) {
        setTimeout(initMap, 300);
    }
}

function initMap() {
    if (!document.getElementById('map')) return;

    map = L.map('map').setView(boatPos, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    const boatIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2904/2904913.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    boatMarker = L.marker(boatPos, { icon: boatIcon }).addTo(map)
        .bindPopup('<b>Navire G-Deux</b><br>Statut : Récupération GPS...')
        .openPopup();

    simulateMovement();
}

function simulateMovement() {
    setInterval(async () => {
        try {
            const response = await fetch('http://172.29.19.42:3000/api/boat-position');
            
            // Si la BDD est vide, le serveur renvoie 404, on ignore proprement
            if (!response.ok) return; 

            const data = await response.json();
            if (data.success && data.position) {
                const newPos = [parseFloat(data.position.latitude), parseFloat(data.position.longitude)];
                boatMarker.setLatLng(newPos);
                console.log("GPS BDD mis à jour :", newPos);
            }
        } catch (err) {
            console.log("En attente de données GPS du C++...");
        }
    }, 3000); // On interroge toutes les 3 secondes
}

function logout() {
    localStorage.removeItem('myToken');
    location.reload();
}

window.onload = () => {
    const savedToken = localStorage.getItem('myToken');
    if (savedToken) showDashboard(savedToken);
};