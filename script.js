// ===========================
// THEDEEP - TOWER DEFENSE V2
// COM PATCH VISUAL CINEMATOGRÁFICO
// ===========================

const textureLoader = new THREE.TextureLoader();
const textureCache = {};
const enemyRaycaster = new THREE.Raycaster();
const enemyDownVector = new THREE.Vector3(0, -1, 0);

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (window.innerWidth <= 768);
let lastTouchX = null, lastTouchY = null;
let lastLightningTime = 0;
let sea, lightningLight, tornadoes = [], island, rain, clouds = [], currentBolt = null;
let scene, camera, renderer, player, listener;
let wavesPaused = false;
let enemies = [], projectiles = [];
let MONSTER_STATS = {};
let volumetricBeam = null; // ADICIONADO para feixe volumétrico
let ambientMusic, rainSound, soundEffects = {};
let audioSettings = {
    music: 0.3,
    rain: 0.5,
    cannon: 0.6,
    monster: 0.5,
    lightning: 0.4
};

// ===== VARIÁVEIS DE FÍSICA E JOGO =====
let vY = 0;
const GRAVITY = -0.050;
const JUMP_FORCE = 0.7;
const AIR_CONTROL = 1.5;
const PLAYER_EYE = 3.0;

// ===== VARIÁVEIS DO FAROL =====
const LIGHTHOUSE_HEIGHT = 80;
const LIGHTHOUSE_RADIUS_BASE = 25;
const LIGHTHOUSE_RADIUS_TOP = 20;
let TOWER_RADIUS = LIGHTHOUSE_RADIUS_BASE;
let TOWER_HEIGHT = LIGHTHOUSE_HEIGHT;
let TOWER_POS = new THREE.Vector3(0, 0, 0);
let towerTopY = TOWER_HEIGHT;
let stairSteps = [];
let lighthousePlatform = null;
let lighthouseFloor = null;
let stairWaypoints = [];
const DOOR_POSITION = new THREE.Vector3(0, 2, -LIGHTHOUSE_RADIUS_BASE);
const DOOR_WIDTH = Math.PI / 4;
let beaconPivot = null;

// ===== SISTEMA DE FAROL HP =====
let lighthouseHP = 1000;
const lighthouseMaxHP = 1000;
// ===== SISTEMA DE CURA DO FAROL =====
let lastHealWave = 0;
let playerHP = 100;
const playerMaxHP = 100;

// ===== SISTEMA DE CANHÕES =====
let placedCannons = [];
const MAX_CANNONS = 20; // Limite máximo de canhões que podem ser colocados
let buildMode = false;
let removeMode = false;
let ghostCannon = null;
let selectedCannonIndex = 0;
// ===== POSIÇÃO DO BARCO =====
const SHIPWRECK_POSITION = new THREE.Vector3(-75, -2, 45);
const SHIPWRECK_RADIUS = 30;

// ===== 10 TIPOS DE CANHÕES (BRONZE → DIAMANTE) =====
const cannonTypes = [
    { id: 0, name: "Canhão de Bronze", cost: 0, damage: 10, fireRate: 1000, range: 30, projectileSpeed: 0.4, color: 0xCD7F32, description: "Canhão inicial de bronze", owned: true, upgradeLevel: 0, maxLevel: 3, material: "Bronze" },
    { id: 1, name: "Canhão de Prata", cost: 50, damage: 20, fireRate: 850, range: 35, projectileSpeed: 0.5, color: 0xC0C0C0, description: "Upgrade de prata", owned: false, upgradeLevel: 0, maxLevel: 3, material: "Prata" },
    { id: 2, name: "Canhão de Ouro", cost: 120, damage: 35, fireRate: 700, range: 40, projectileSpeed: 0.6, color: 0xFFD700, description: "Poder dourado", owned: false, upgradeLevel: 0, maxLevel: 3, material: "Ouro" },
    { id: 3, name: "Canhão de Platina", cost: 200, damage: 55, fireRate: 600, range: 45, projectileSpeed: 0.7, color: 0xE5E4E2, description: "Platina reluzente", owned: false, upgradeLevel: 0, maxLevel: 3, material: "Platina" },
    { id: 4, name: "Canhão de Esmeralda", cost: 350, damage: 80, fireRate: 550, range: 50, projectileSpeed: 0.8, color: 0x50C878, description: "Poder esmeralda", owned: false, upgradeLevel: 0, maxLevel: 3, material: "Esmeralda" },
    { id: 5, name: "Canhão de Rubi", cost: 500, damage: 120, fireRate: 500, range: 55, projectileSpeed: 0.9, color: 0xE0115F, description: "Fúria rubra", owned: false, upgradeLevel: 0, maxLevel: 3, material: "Rubi" },
    { id: 6, name: "Canhão de Safira", cost: 750, damage: 170, fireRate: 450, range: 60, projectileSpeed: 1.0, color: 0x0F52BA, description: "Safira oceânica", owned: false, upgradeLevel: 0, maxLevel: 3, material: "Safira" },
    { id: 7, name: "Canhão de Ametista", cost: 1000, damage: 240, fireRate: 400, range: 65, projectileSpeed: 1.1, color: 0x9966CC, description: "Místico ametista", owned: false, upgradeLevel: 0, maxLevel: 3, material: "Ametista" },
    { id: 8, name: "Canhão de Obsidiana", cost: 1500, damage: 350, fireRate: 350, range: 70, projectileSpeed: 1.2, color: 0x3B2F2F, description: "Obsidiana sombria", owned: false, upgradeLevel: 0, maxLevel: 3, material: "Obsidiana" },
    { id: 9, name: "Canhão de Diamante", cost: 2500, damage: 600, fireRate: 300, range: 80, projectileSpeed: 1.5, color: 0xB9F2FF, description: "PODER SUPREMO", owned: false, upgradeLevel: 0, maxLevel: 3, material: "Diamante" }
];

let selectedCannonForMenu = null;

// ===== CONFIGURAÇÃO DOS RAIOS =====
const LIGHTNING_DESTROY_CHANCE = 0.15; // 15% de chance de destruir um canhão

async function loadCannonData() {
    const response = await fetch("cannons.json");
    const cannons = await response.json();
    cannonTypes.length = 0;
    cannons.forEach(c => {
        c.color = parseInt(c.color.replace('#', '0x'));
        c.projectile.color = parseInt(c.projectile.color.replace('#', '0x'));
        c.projectile.glowColor = parseInt(c.projectile.glowColor.replace('#', '0x'));
        c.projectile.trailColor = parseInt(c.projectile.trailColor.replace('#', '0x'));
        cannonTypes.push(c);
    });
}

// ===== CARREGAR MONSTROS =====
async function loadMonsterData() {
    const response = await fetch("monsters.json");
    const monsters = await response.json();
    MONSTER_STATS = {};
    monsters.forEach(m => { MONSTER_STATS[m.sprite] = m; });
}

const SPRITE_POOL = [
    "sprites/monster1.png", "sprites/monster2.png", "sprites/monster3.png", "sprites/monster4.png",
    "sprites/monster5.png", "sprites/monster6.png", "sprites/monster7.png", "sprites/monster8.png"
];

function pickRandomSprite() {
    return SPRITE_POOL[Math.floor(Math.random() * SPRITE_POOL.length)];
}

// ===== VARIÁVEIS DE JOGO =====
let kills = 0, gold = 100, wave = 1, enemyCount = 3;
let waveInProgress = false;
let nextWaveTimer = 0;
let gameActive = true, shopOpen = false, lastShot = 0;
let gameStarted = false;
const keys = {};
const PLAYER_SPEED = 0.3, ARENA_SIZE = 250;
let gamePaused = false;

// ===== ESCADA DO FAROL =====
let onStairs = false;
let currentStairIndex = -1;
let lastStairMove = 0;

// ===== SISTEMA DE ÁUDIO COMPLETO =====
function setupAudio() {
    const audioLoader = new THREE.AudioLoader();
    
    // Música ambiente (loop contínuo)
    ambientMusic = new THREE.Audio(listener);
    audioLoader.load('sounds/ambient_deep.mp3', (buffer) => {
        ambientMusic.setBuffer(buffer);
        ambientMusic.setLoop(true);
        ambientMusic.setVolume(audioSettings.music);
        ambientMusic.play();
    });
    
    // Som de chuva (loop contínuo)
    rainSound = new THREE.Audio(listener);
    audioLoader.load('sounds/harpoon.mp3', (buffer) => {
        rainSound.setBuffer(buffer);
        rainSound.setLoop(true);
        rainSound.setVolume(audioSettings.rain);
        rainSound.play();
    });
    const heartbeatSound = new THREE.Audio(listener);
        audioLoader.load('sounds/growl4.mp3', (buffer) => { // Usando growl4 como batimento
        heartbeatSound.setBuffer(buffer);
        heartbeatSound.setLoop(true);
        heartbeatSound.setVolume(0);
        heartbeatSound.play();
        soundEffects.heartbeat = heartbeatSound;
    });
    
    // Sons de efeito (SEM loop)
    const soundFiles = {
        cannon: { file: 'sounds/piercing.mp3', volume: audioSettings.cannon },
        monsterHit: { file: 'sounds/smg.mp3', volume: audioSettings.monster },
        monsterDeath: { file: 'sounds/monster-growl-251374.mp3', volume: audioSettings.monster },
        wave: { file: 'sounds/sonicmp3', volume: 0.5 },
        lightning: { file: 'sounds/trident.mp3', volume: audioSettings.lightning },
        thunder: { file: 'sounds/trident.mp3', volume: audioSettings.lightning } // ✅ ADICIONE ESTA LINHA
    };
    
    Object.keys(soundFiles).forEach(key => {
        const sound = new THREE.Audio(listener);
        audioLoader.load(soundFiles[key].file, (buffer) => {
            sound.setBuffer(buffer);
            sound.setVolume(soundFiles[key].volume);
            soundEffects[key] = sound;
        });
    });
    
    setupSettingsMenu();
}

function playSound(soundName) {
    if (soundEffects[soundName] && soundEffects[soundName].buffer) {
        if (soundEffects[soundName].isPlaying) {
            soundEffects[soundName].stop();
        }
        soundEffects[soundName].play();
    }
}

// ===== MENU DE CONFIGURAÇÕES =====
function setupSettingsMenu() {
    const openBtn = document.getElementById('openSettings');
    const closeBtn = document.getElementById('closeSettings');
    const menu = document.getElementById('settingsMenu');

    // Sliders
    const musicSlider = document.getElementById('musicVolume');
    const rainSlider = document.getElementById('rainVolume');
    const cannonSlider = document.getElementById('cannonVolume');
    const monsterSlider = document.getElementById('monsterVolume');
    const lightningSlider = document.getElementById('lightningVolume');

    // Labels de valor
    const musicValue = document.getElementById('musicVolumeValue');
    const rainValue = document.getElementById('rainVolumeValue');
    const cannonValue = document.getElementById('cannonVolumeValue');
    const monsterValue = document.getElementById('monsterVolumeValue');
    const lightningValue = document.getElementById('lightningVolumeValue');

    // Atualizar música
    musicSlider.addEventListener('input', (e) => {
        const vol = e.target.value / 100;
        audioSettings.music = vol;
        if (ambientMusic) ambientMusic.setVolume(vol);
        musicValue.textContent = e.target.value + '%';
    });

    // Atualizar chuva
    rainSlider.addEventListener('input', (e) => {
        const vol = e.target.value / 100;
        audioSettings.rain = vol;
        if (rainSound) rainSound.setVolume(vol);
        rainValue.textContent = e.target.value + '%';
    });

    // Atualizar canhões
    cannonSlider.addEventListener('input', (e) => {
        const vol = e.target.value / 100;
        audioSettings.cannon = vol;
        if (soundEffects.cannon) soundEffects.cannon.setVolume(vol);
        cannonValue.textContent = e.target.value + '%';
    });

    // Atualizar monstros
    monsterSlider.addEventListener('input', (e) => {
        const vol = e.target.value / 100;
        audioSettings.monster = vol;
        if (soundEffects.monsterHit) soundEffects.monsterHit.setVolume(vol);
        if (soundEffects.monsterDeath) soundEffects.monsterDeath.setVolume(vol);
        monsterValue.textContent = e.target.value + '%';
    });

    // Atualizar raios
    lightningSlider.addEventListener('input', (e) => {
        const vol = e.target.value / 100;
        audioSettings.lightning = vol;
        if (soundEffects.lightning) soundEffects.lightning.setVolume(vol);
        lightningValue.textContent = e.target.value + '%';
    });

    // Abrir menu
    openBtn.addEventListener('click', () => {
        menu.style.display = 'block';
        document.exitPointerLock();
    });

    // Fechar menu
    closeBtn.addEventListener('click', () => {
        menu.style.display = 'none';
        if (gameStarted) {
            renderer.domElement.requestPointerLock();
        } else {
            document.getElementById('mainMenu').style.display = 'flex';
        }
    });

    // Tecla ESC também fecha
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.style.display === 'block') {
            menu.style.display = 'none';
        }
    });
}


// ===== INICIALIZAÇÃO =====

async function init() {
    await loadCannonData();
    await loadMonsterData();

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000814, 0.003);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, PLAYER_EYE, 50);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    listener = new THREE.AudioListener();
    camera.add(listener);

    createLights();
    createIsland();
    createShipwreck();
    createSea();
    createLighthouse();
    createWeather();
    createPlayer();
    setupControls();
    setupShop();
    setupCannonMenu();
    setupSettingsMenu();

    if (isMobile) setupMobileControls();

    updateUI();
    
    setupIntroSequence();
    
    animate();
    
    console.log("✅ TheDeep inicializado - aguardando introdução!");
}

// ===== SISTEMA DE RECORDS =====
function loadRecords() {
    const saved = localStorage.getItem('thedeep_records');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveRecord(wave, kills) {
    let records = loadRecords();
    records.push({ wave, kills, date: new Date().toLocaleDateString('pt-BR') });
    records.sort((a, b) => b.wave - a.wave || b.kills - a.kills);
    records = records.slice(0, 5);
    localStorage.setItem('thedeep_records', JSON.stringify(records));
}

function displayRecords() {
    const records = loadRecords();
    const recordsList = document.getElementById('recordsList');
    
    if (!recordsList) return;
    
    if (records.length === 0) {
        recordsList.innerHTML = '<p style="color: #888; text-align: center;">Nenhum record ainda. Seja o primeiro!</p>';
        return;
    }
    
    let html = '';
    records.forEach((record, index) => {
        html += `
            <div style="background: rgba(0, 40, 60, 0.8); padding: 15px; margin: 10px 0; border-radius: 8px; border: 2px solid #00f5ff;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 24px; font-weight: bold; color: #ffd700;">#${index + 1}</span>
                    <div style="text-align: center; flex: 1;">
                        <div style="color: #00f5ff; font-size: 18px;">Onda ${record.wave}</div>
                        <div style="color: #aaa; font-size: 14px;">${record.kills} Mortes | ${record.date}</div>
                    </div>
                </div>
            </div>
        `;
    });
    recordsList.innerHTML = html;
}

function setupIntroSequence() {
    const warningScreen = document.getElementById('epilepsyWarning');
    const introScreen = document.getElementById('introVideo');
    const video = document.getElementById('gameIntroVideo');
    const acceptBtn = document.getElementById('acceptWarning');
    const skipBtn = document.getElementById('skipIntro');

    let loopCount = 0;
    const maxLoops = 60;

    acceptBtn.addEventListener('click', () => {
        warningScreen.style.display = 'none';
        introScreen.style.display = 'flex';
        video.play();
    });

    video.addEventListener('ended', () => {
        loopCount += video.duration;
        if (loopCount < maxLoops) {
            video.currentTime = 0;
            video.play();
        } else {
            showMainMenu();
        }
    });

    skipBtn.addEventListener('click', showMainMenu);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && introScreen.style.display === 'flex') {
            showMainMenu();
        }
    });
    
    document.getElementById('newGameBtn').addEventListener('click', startNewGame);
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('settingsMenu').style.display = 'block';
    });
    document.getElementById('recordsBtn').addEventListener('click', () => {
        displayRecords();
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('recordsMenu').style.display = 'flex';
    });
    document.getElementById('backFromRecords').addEventListener('click', () => {
        document.getElementById('recordsMenu').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'flex';
    });
}

function showMainMenu() {
    document.getElementById('introVideo').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    const video = document.getElementById('gameIntroVideo');
    video.loop = true;
    video.play();
}

function startNewGame() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('openSettings').style.display = 'block';
    document.getElementById('ui').style.display = 'block';
    gameStarted = true;
    
    kills = 0;
    gold = 100;
    wave = 1;
    enemyCount = 3;
    lighthouseHP = lighthouseMaxHP;
    playerHP = playerMaxHP;
    lastHealWave = 0;
    
    // CORRIGIDO: Remover inimigos da cena antes de limpar o array
    enemies.forEach(enemy => {
        if (enemy && enemy.parent) {
            scene.remove(enemy);
        }
    });
    enemies = [];
    
    // CORRIGIDO: Remover projéteis da cena antes de limpar o array
    projectiles.forEach(projectile => {
        if (projectile && projectile.parent) {
            scene.remove(projectile);
        }
    });
    projectiles = [];
    
    placedCannons.forEach(cannon => scene.remove(cannon));
    placedCannons = [];
    gameActive = true;
    
    cannonTypes.forEach((type, index) => {
        type.owned = (index === 0);
    });
    
    setupAudio();
    updateUI();
    startWave();
    renderer.domElement.requestPointerLock();
}

function returnToMenu() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('openSettings').style.display = 'none';
    document.getElementById('ui').style.display = 'none';
    
    gameActive = false;
    gameStarted = false;
    
    // CORRIGIDO: Remover inimigos da cena
    enemies.forEach(enemy => {
        if (enemy && enemy.parent) {
            scene.remove(enemy);
        }
    });
    enemies = [];
    
    // CORRIGIDO: Remover projéteis da cena
    projectiles.forEach(projectile => {
        if (projectile && projectile.parent) {
            scene.remove(projectile);
        }
    });
    projectiles = [];
    
    // Remover canhões da cena
    placedCannons.forEach(cannon => scene.remove(cannon));
    placedCannons = [];
    
    if (ambientMusic && ambientMusic.isPlaying) ambientMusic.stop();
    if (rainSound && rainSound.isPlaying) rainSound.stop();
    
    const video = document.getElementById('gameIntroVideo');
    video.loop = true;
    video.play();
}

function startGameAfterIntro() {
    document.getElementById('introVideo').style.display = 'none';
    document.getElementById('openSettings').style.display = 'block';
    gameStarted = true;
    setupAudio(); // Inicia música AGORA!
    startWave();
    renderer.domElement.requestPointerLock();
    console.log("🎮 Jogo iniciado!");
}

// ===== LUZES =====
function createLights() {
    const ambientLight = new THREE.AmbientLight(0x1a3a52, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -150;
    dirLight.shadow.camera.right = 150;
    dirLight.shadow.camera.top = 150;
    dirLight.shadow.camera.bottom = -150;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    lightningLight = new THREE.PointLight(0x00ffff, 0, 300);
    lightningLight.position.set(0, 100, 0);
    scene.add(lightningLight);
}

// ===== ILHA =====
function createIsland() {
    // Ilha principal - areia bege
    const islandGeo = new THREE.CylinderGeometry(100, 90, 15, 32);
    const islandMat = new THREE.MeshStandardMaterial({
        color: 0xC2B280,
        roughness: 0.9,
        metalness: 0.1
    });
    island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -7.5;
    island.receiveShadow = true;
    island.castShadow = true;
    scene.add(island);

    // Palmeiras espalhadas pela ilha
    const palmPositions = [
        { x: 70, z: 0 }, { x: -65, z: 30 }, { x: 50, z: 50 },
        { x: -40, z: -60 }, { x: 0, z: 75 }, { x: -70, z: -20 },
        { x: 60, z: -45 }, { x: -50, z: 55 }, { x: 35, z: -65 },
        { x: -20, z: 70 }, { x: 75, z: 25 }, { x: -60, z: -50 }
    ];

    palmPositions.forEach(pos => {
        createPalmTree(pos.x, -7.5, pos.z);
    });
}

// Função para criar palmeira estilo cartoon
function createPalmTree(x, y, z) {
    const palmGroup = new THREE.Group();
    
    // Tronco da palmeira - segmentado (estilo da imagem)
    const trunkHeight = 15 + Math.random() * 5;
    const segments = 6;
    const segmentHeight = trunkHeight / segments;
    
    for (let i = 0; i < segments; i++) {
        const segRadius = 0.8 - (i * 0.08);
        const segGeo = new THREE.CylinderGeometry(segRadius - 0.1, segRadius, segmentHeight, 8);
        const segMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B5A2B, 
            roughness: 0.9 
        });
        const seg = new THREE.Mesh(segGeo, segMat);
        seg.position.y = i * segmentHeight + segmentHeight / 2;
        seg.castShadow = true;
        palmGroup.add(seg);
    }
    
    // Folhas da palmeira - longas e curvadas (7 folhas)
    const leafCount = 7;
    for (let i = 0; i < leafCount; i++) {
        const leafAngle = (i / leafCount) * Math.PI * 2;
        const leafGroup = new THREE.Group();
        
        // Cada folha é feita de vários segmentos para curvar
        const leafSegments = 5;
        const leafLength = 8;
        const segLen = leafLength / leafSegments;
        
        for (let j = 0; j < leafSegments; j++) {
            const leafGeo = new THREE.BoxGeometry(0.15, segLen, 1.5 - j * 0.2);
            const leafMat = new THREE.MeshStandardMaterial({ 
                color: 0x228B22, 
                roughness: 0.7
            });
            const leafSeg = new THREE.Mesh(leafGeo, leafMat);
            leafSeg.position.y = j * segLen;
            leafSeg.rotation.x = j * 0.15; // Curva para baixo
            leafSeg.castShadow = true;
            leafGroup.add(leafSeg);
        }
        
        leafGroup.position.y = trunkHeight;
        leafGroup.rotation.z = Math.PI / 2 - 0.3; // Inclinada para fora
        leafGroup.rotation.y = leafAngle;
        palmGroup.add(leafGroup);
    }
    
    // Leve inclinação do tronco
    palmGroup.rotation.x = (Math.random() - 0.5) * 0.15;
    palmGroup.rotation.z = (Math.random() - 0.5) * 0.15;
    
    palmGroup.position.set(x, y, z);
    scene.add(palmGroup);
}

// ===== BARCO NAUFRAGADO (PATCH VISUAL) =====
function createShipwreck() {
    const shipGroup = new THREE.Group();
    
    // Casco do navio (MAIOR e mais destruído)
    const hullGeo = new THREE.BoxGeometry(28, 12, 55);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x2a1506, roughness: 0.95 });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 3;
    hull.rotation.z = -0.4;
    hull.rotation.x = 0.2;
    hull.castShadow = true;
    hull.receiveShadow = true;
    shipGroup.add(hull);
    
    // Parte quebrada do casco
    const brokenHullGeo = new THREE.BoxGeometry(15, 8, 25);
    const brokenHull = new THREE.Mesh(brokenHullGeo, hullMat);
    brokenHull.position.set(-10, 0, 15);
    brokenHull.rotation.set(0.8, 0.5, -0.3);
    brokenHull.castShadow = true;
    shipGroup.add(brokenHull);
    
    // Mastro principal QUEBRADO
    const mastGeo = new THREE.CylinderGeometry(1.2, 1.5, 25, 12);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x2a1506 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 12, -8);
    mast.rotation.x = 0.7;
    mast.rotation.z = -0.3;
    mast.castShadow = true;
    shipGroup.add(mast);
    
    // Segundo mastro (menor, mais quebrado)
    const mast2Geo = new THREE.CylinderGeometry(0.8, 1, 15, 12);
    const mast2 = new THREE.Mesh(mast2Geo, mastMat);
    mast2.position.set(5, 8, 10);
    mast2.rotation.x = 1.2;
    mast2.rotation.y = 0.5;
    mast2.castShadow = true;
    shipGroup.add(mast2);
    
    // Velas RASGADAS
    for (let i = 0; i < 3; i++) {
        const sailGeo = new THREE.PlaneGeometry(16, 20);
        const sailMat = new THREE.MeshStandardMaterial({ 
            color: 0xaaaaaa, side: THREE.DoubleSide, transparent: true, opacity: 0.6, roughness: 0.9
        });
        const sail = new THREE.Mesh(sailGeo, sailMat);
        sail.position.set(Math.random() * 10 - 5, 10 + i * 5, -8 + i * 8);
        sail.rotation.set(Math.random() * 0.5, Math.random() * 1, Math.random() * 0.3);
        shipGroup.add(sail);
    }
    
    // Deck (tábuas quebradas)
    for (let i = 0; i < 8; i++) {
        const plankGeo = new THREE.BoxGeometry(24, 0.8, 4);
        const plankMat = new THREE.MeshStandardMaterial({ color: 0x4a2a1a, roughness: 0.9 });
        const plank = new THREE.Mesh(plankGeo, plankMat);
        plank.position.set(Math.random() * 4 - 2, 6, -20 + i * 5);
        plank.rotation.y = Math.random() * 0.3;
        plank.receiveShadow = true;
        shipGroup.add(plank);
    }
    
    // Destroços ao redor
    for (let i = 0; i < 15; i++) {
        const debrisGeo = new THREE.BoxGeometry(2 + Math.random() * 3, 0.5 + Math.random(), 2 + Math.random() * 4);
        const debris = new THREE.Mesh(debrisGeo, hullMat);
        debris.position.set(Math.random() * 30 - 15, -2 + Math.random() * 2, Math.random() * 40 - 20);
        debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        debris.castShadow = true;
        shipGroup.add(debris);
    }
    
    shipGroup.position.set(-75, -2, 45);
    shipGroup.rotation.y = Math.PI / 3;
    scene.add(shipGroup);
}

function createSea() {
    const seaGeo = new THREE.PlaneGeometry(2000, 2000, 180, 180);
    const seaMat = new THREE.MeshStandardMaterial({
        color: 0x0088cc,
        roughness: 0.15,
        metalness: 0.8,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide
    });

    sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -10;  // ABAIXO DA ILHA
    sea.receiveShadow = true;
    sea.castShadow = false;
    scene.add(sea);
}
// ===== CLIMA (PATCH VISUAL) =====
// ===== CLIMA (PATCH VISUAL) =====
function createWeather() {
    // CHUVA INTENSA
    const rainCount = 30000;
    const rainGeo = new THREE.BufferGeometry();
    const rainVertices = [];
    for (let i = 0; i < rainCount; i++) {
        rainVertices.push(Math.random() * 800 - 400, Math.random() * 180, Math.random() * 800 - 400);
    }
    rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(rainVertices, 3));
    const rainMaterial = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.5, transparent: true, opacity: 0.8 });
    rain = new THREE.Points(rainGeo, rainMaterial);
    scene.add(rain);
    
    // Luz dos raios (colorida)
    lightningLight = new THREE.PointLight(0xaaddff, 0, ARENA_SIZE * 3);
    lightningLight.position.set(0, 180, 0);
    scene.add(lightningLight);
    
    // NUVENS DE TEMPESTADE DENSAS E BAIXAS (3 camadas!)
    // Camada 1: Nuvens baixas e densas (mais próximas)
    for (let i = 0; i < 60; i++) {
        const cloudGeo = new THREE.SphereGeometry(40 + Math.random() * 35, 10, 10);
        const cloudMat = new THREE.MeshBasicMaterial({ 
            color: 0x1a1a1a,  // Mais escuras
            transparent: true, 
            opacity: 0.9,      // Mais opacas
            fog: false 
        });
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set(
            (Math.random() - 0.5) * 800,  // Mais próximas
            80 + Math.random() * 1200,       // Mais baixas
            (Math.random() - 0.5) * 500
        );
        cloud.scale.set(2.2, 0.6, 2.2);
        clouds.push(cloud);
        scene.add(cloud);
    }
    
    // Camada 2: Nuvens médias (cinza escuro)
    for (let i = 0; i < 50; i++) {
        const cloudGeo = new THREE.SphereGeometry(50 + Math.random() * 40, 10, 10);
        const cloudMat = new THREE.MeshBasicMaterial({ 
            color: 0x2a2a2a, 
            transparent: true, 
            opacity: 0.85,
            fog: false 
        });
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set(
            (Math.random() - 0.5) * 600,
            120 + Math.random() * 800,
            (Math.random() - 0.5) * 600
        );
        cloud.scale.set(2.5, 0.7, 2.5);
        clouds.push(cloud);
        scene.add(cloud);
    }
    
    // Camada 3: Nuvens altas (fundo da tempestade)
    for (let i = 0; i < 40; i++) {
        const cloudGeo = new THREE.SphereGeometry(60 + Math.random() * 50, 10, 10);
        const cloudMat = new THREE.MeshBasicMaterial({ 
            color: 0x333333, 
            transparent: true, 
            opacity: 0.75,
            fog: false 
        });
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set(
            (Math.random() - 0.5) * 800,
            160 + Math.random() * 800,
            (Math.random() - 0.5) * 800
        );
        cloud.scale.set(3, 0.8, 3);
        clouds.push(cloud);
        scene.add(cloud);
    }
    
    for (let i = 0; i < 4; i++) {
        const tornadoHeight = 200;
        const tornadoRadiusBottom = 25;  // Base MUITO mais larga
        const tornadoRadiusTop = 80;     // Topo mais fino (mas não pontiagudo)
        
        const tornadoGeo = new THREE.CylinderGeometry(
            tornadoRadiusTop,      // Raio do topo
            tornadoRadiusBottom,   // Raio da base
            tornadoHeight,         // Altura
            64,                    // Segmentos radiais
            120,                   // Segmentos de altura (mais suave)
            true                   // Aberto
        );
        
        const tornadoMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a, 
            transparent: true, 
            opacity: 0.5,          // Mais transparente
            side: THREE.DoubleSide, 
            roughness: 0.9, 
            metalness: 0.1
        });
        
        const tornado = new THREE.Mesh(tornadoGeo, tornadoMat);
        const angle = (i / 4) * Math.PI * 2;
        const dist = ARENA_SIZE * 0.85;
        tornado.position.set(Math.cos(angle) * dist, tornadoHeight / 2, Math.sin(angle) * dist);
        tornado.castShadow = true;
        tornado.userData.baseX = tornado.position.x;
        tornado.userData.baseZ = tornado.position.z;
        tornado.userData.phase = Math.random() * Math.PI * 2;
        scene.add(tornado);
        tornadoes.push(tornado);
    }
}

// ===== RAIOS (PATCH VISUAL MELHORADO) =====
function createLightningBolt(fromPos, toPos) {
    if (currentBolt) scene.remove(currentBolt);

    const lightningColors = [0x00ddff, 0xffff00, 0xffffff, 0x88ffff, 0xffffaa, 0xaaaaff];
    const boltColor = lightningColors[Math.floor(Math.random() * lightningColors.length)];
    
    const boltGroup = new THREE.Group();

    // Ponto inicial e final
    let startPoint = fromPos || new THREE.Vector3(
        (Math.random() - 0.5) * 400, 
        180 + Math.random() * 40, 
        (Math.random() - 0.5) * 400
    );
    let endPoint = toPos || new THREE.Vector3(
        (Math.random() - 0.5) * 300,
        0,
        (Math.random() - 0.5) * 300
    );
    
    // Material do raio (mais brilhante)
    const boltMaterial = new THREE.MeshBasicMaterial({ 
        color: boltColor,
        transparent: true,
        opacity: 0.95
    });
    
    // RAIO PRINCIPAL (mais segmentos e mais grosso)
    let currentPoint = startPoint.clone();
    const mainSegments = 18; // Mais segmentos = mais detalhado
    
    for (let i = 0; i < mainSegments; i++) {
        const progress = i / mainSegments;
        const targetPoint = new THREE.Vector3(
            startPoint.x + (endPoint.x - startPoint.x) * progress,
            startPoint.y + (endPoint.y - startPoint.y) * progress,
            startPoint.z + (endPoint.z - startPoint.z) * progress
        );
        
        // Adiciona "zigzag" mais intenso
        targetPoint.x += (Math.random() - 0.5) * 35;
        targetPoint.z += (Math.random() - 0.5) * 35;
        targetPoint.y += (Math.random() - 0.5) * 20;
        
        const direction = new THREE.Vector3().subVectors(targetPoint, currentPoint);
        const distance = direction.length();
        
        // Raio GROSSO (era 0.4, agora 0.8-1.2)
        const thickness = 0.8 + Math.random() * 0.4;
        const segmentGeo = new THREE.CylinderGeometry(thickness, thickness, distance, 8);
        const segment = new THREE.Mesh(segmentGeo, boltMaterial);
        
        segment.position.copy(currentPoint).add(direction.clone().multiplyScalar(0.5));
        segment.lookAt(targetPoint);
        segment.rotateX(Math.PI / 2);
        boltGroup.add(segment);
        
        // RAMIFICAÇÕES (raios secundários)
        if (i > 2 && i < mainSegments - 3 && Math.random() < 0.4) {
            const branchLength = 3 + Math.random() * 4;
            const branchPoint = currentPoint.clone();
            
            for (let j = 0; j < branchLength; j++) {
                const branchDir = new THREE.Vector3(
                    (Math.random() - 0.5) * 25,
                    -15 - Math.random() * 10,
                    (Math.random() - 0.5) * 25
                );
                const branchEnd = branchPoint.clone().add(branchDir);
                const branchDist = branchDir.length();
                
                const branchThickness = thickness * 0.5; // Ramificações mais finas
                const branchGeo = new THREE.CylinderGeometry(branchThickness, branchThickness * 0.3, branchDist, 6);
                const branchSeg = new THREE.Mesh(branchGeo, boltMaterial);
                
                branchSeg.position.copy(branchPoint).add(branchDir.clone().multiplyScalar(0.5));
                branchSeg.lookAt(branchEnd);
                branchSeg.rotateX(Math.PI / 2);
                boltGroup.add(branchSeg);
                
                branchPoint.copy(branchEnd);
            }
        }
        
        currentPoint.copy(targetPoint);
    }
    
    // GLOW/BRILHO EXTERNO (halo ao redor do raio)
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: boltColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    
    currentPoint = startPoint.clone();
    for (let i = 0; i < mainSegments; i++) {
        const progress = i / mainSegments;
        const targetPoint = new THREE.Vector3(
            startPoint.x + (endPoint.x - startPoint.x) * progress,
            startPoint.y + (endPoint.y - startPoint.y) * progress,
            startPoint.z + (endPoint.z - startPoint.z) * progress
        );
        
        targetPoint.x += (Math.random() - 0.5) * 35;
        targetPoint.z += (Math.random() - 0.5) * 35;
        
        const direction = new THREE.Vector3().subVectors(targetPoint, currentPoint);
        const distance = direction.length();
        
        const glowGeo = new THREE.CylinderGeometry(2.5, 2.5, distance, 8);
        const glowMesh = new THREE.Mesh(glowGeo, glowMaterial);
        glowMesh.position.copy(currentPoint).add(direction.clone().multiplyScalar(0.5));
        glowMesh.lookAt(targetPoint);
        glowMesh.rotateX(Math.PI / 2);
        boltGroup.add(glowMesh);
        
        currentPoint.copy(targetPoint);
    }

    scene.add(boltGroup);
    currentBolt = boltGroup;

    // Luz MUITO mais intensa
    lightningLight.color.setHex(boltColor);
    lightningLight.intensity = 20; // Era 8, agora 20!
    lightningLight.position.copy(startPoint);

    // Flash mais longo
    setTimeout(() => { lightningLight.intensity = 10; }, 80);
    setTimeout(() => { lightningLight.intensity = 0; }, 200);
    
    // ===== VERIFICAR SE DESTRÓI CANHÕES =====
    checkLightningCannonDamage(endPoint);
    
    // Raio dura mais tempo
    setTimeout(() => { 
        if (currentBolt === boltGroup) { 
            scene.remove(boltGroup); 
            currentBolt = null; 
        } 
    }, 300 + Math.random() * 200);
}

// ===== SISTEMA DE DANO DE RAIOS AOS CANHÕES =====
function checkLightningCannonDamage(lightningEndPoint) {
    const destroyRadius = 8; // Raio de destruição ao redor do raio
    
    placedCannons.forEach((cannon, index) => {
        const dx = cannon.position.x - lightningEndPoint.x;
        const dz = cannon.position.z - lightningEndPoint.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Se o canhão está perto o suficiente do raio
        if (distance < destroyRadius) {
            // Chance de destruição baseada na distância (mais perto = maior chance)
            const distanceFactor = 1 - (distance / destroyRadius);
            const destroyChance = LIGHTNING_DESTROY_CHANCE * distanceFactor;
            
            if (Math.random() < destroyChance) {
                // DESTRUIR CANHÃO!
                destroyCannonByLightning(cannon, index);
            }
        }
    });
}

function destroyCannonByLightning(cannon, index) {
    const type = cannonTypes[cannon.userData.type];
    
    // Efeito visual de explosão
    createCannonExplosionEffect(cannon.position);
    
    // Remover canhão da cena
    scene.remove(cannon);
    placedCannons.splice(index, 1);
    
    // Feedback para o jogador
    console.log(`⚡ RAIO DESTRUIU UM ${type.name}!`);
    
    // Efeito sonoro (usar som de raio ou explosão)
    playSound('lightning');
    
    // Atualizar UI
    updateUI();
}

function createCannonExplosionEffect(position) {
    const explosionGroup = new THREE.Group();
    
    // Partículas de explosão
    for (let i = 0; i < 15; i++) {
        const particleGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 6, 6);
        const particleMat = new THREE.MeshBasicMaterial({ 
            color: Math.random() > 0.5 ? 0xffff00 : 0xff8800 
        });
        const particle = new THREE.Mesh(particleGeo, particleMat);
        
        // Posição aleatória ao redor do canhão
        particle.position.set(
            position.x + (Math.random() - 0.5) * 3,
            position.y + Math.random() * 2,
            position.z + (Math.random() - 0.5) * 3
        );
        
        explosionGroup.add(particle);
    }
    
    scene.add(explosionGroup);
    
    // Remover após 1 segundo
    setTimeout(() => {
        scene.remove(explosionGroup);
    }, 1000);
}

// ===== FAROL (PATCH VISUAL) =====
function createLighthouse() {
    TOWER_POS.set(0, 0, 0);

    // ===== BASE SÓLIDA =====
    const baseGeo = new THREE.CylinderGeometry(LIGHTHOUSE_RADIUS_BASE, LIGHTHOUSE_RADIUS_BASE, 10, 64);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 5;
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);

    // ===== PORTA (SUL) =====
    const doorAngle = 3 * Math.PI / 2;
    const doorGeo = new THREE.BoxGeometry(8, 7, 4);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 3.5, -LIGHTHOUSE_RADIUS_BASE + 2);
    scene.add(door);

// ===== TORRE PRINCIPAL (CINZA ESCURO) =====
    const towerGeo = new THREE.CylinderGeometry(LIGHTHOUSE_RADIUS_TOP, LIGHTHOUSE_RADIUS_BASE, LIGHTHOUSE_HEIGHT, 64);
    const towerMat = new THREE.MeshStandardMaterial({ 
        color: 0x222222,      // cinza bem escuro (quase preto)
        roughness: 0.8,
        metalness: 0.1 
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = LIGHTHOUSE_HEIGHT / 2 + 10;
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    // ===== FAIXAS VERMELHAS CLÁSSICAS (5 faixas perfeitas) =====
    const numRedStripes = 5;
    const stripeHeight = LIGHTHOUSE_HEIGHT / (numRedStripes * 2 + 1); // espaçamento perfeito

    for (let i = 0; i < numRedStripes; i++) {
        const y = 10 + stripeHeight * (i * 2 + 1); // centraliza cada faixa vermelha

        // Raio no topo e na base da faixa (pra acompanhar o cone da torre)
        const progress = y / (LIGHTHOUSE_HEIGHT + 10);
        const topRadius = LIGHTHOUSE_RADIUS_BASE - progress * (LIGHTHOUSE_RADIUS_BASE - LIGHTHOUSE_RADIUS_TOP);
        const bottomRadius = LIGHTHOUSE_RADIUS_BASE - (y - stripeHeight) / (LIGHTHOUSE_HEIGHT + 10) * (LIGHTHOUSE_RADIUS_BASE - LIGHTHOUSE_RADIUS_TOP);

        const stripeGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, stripeHeight + 2, 64);
        const stripeMat = new THREE.MeshStandardMaterial({ 
            color: 0xcc0000,     // vermelho farol clássico
            roughness: 0.6,
            metalness: 0.2
        });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = y;
        stripe.castShadow = true;
        stripe.receiveShadow = true;
        scene.add(stripe);
    }

    // ===== TOPO REALISTA (COM PLATAFORMA PRA ANDAR!) =====
    towerTopY = LIGHTHOUSE_HEIGHT + 10;

    // Plataforma preta onde você anda
    const platformGeo = new THREE.CylinderGeometry(LIGHTHOUSE_RADIUS_TOP + 6, LIGHTHOUSE_RADIUS_TOP + 6, 2, 64);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = towerTopY + 1;
    platform.receiveShadow = true;
    scene.add(platform);
    lighthousePlatform = platform;

    // Lanterna (parte preta)
    const lanternGeo = new THREE.CylinderGeometry(LIGHTHOUSE_RADIUS_TOP + 3, LIGHTHOUSE_RADIUS_TOP + 5, 6, 64);
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.y = towerTopY + 5;
    scene.add(lantern);

    // Cúpula vermelha
    const domeGeo = new THREE.SphereGeometry(LIGHTHOUSE_RADIUS_TOP + 4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.1);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.7, roughness: 0.2 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = towerTopY + 8.5;
    scene.add(dome);

    // Vidros da lanterna
    const glassGeo = new THREE.CylinderGeometry(LIGHTHOUSE_RADIUS_TOP + 3.2, LIGHTHOUSE_RADIUS_TOP + 3.2, 5.5, 32, 1, true);
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        transmission: 0.95,
        roughness: 0,
        metalness: 0.1
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.y = towerTopY + 5;
    scene.add(glass);

    // Grade pequena de proteção (exatamente como na foto)
    const railGeo = new THREE.TorusGeometry(LIGHTHOUSE_RADIUS_TOP + 6.5, 0.2, 8, 64);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.y = towerTopY + 2;
    rail.rotation.x = Math.PI / 2;
    scene.add(rail);

    // Colunas da grade
    for (let i = 0; i < 12; i++) {
        const angle = i / 12 * Math.PI * 2;
        const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 4, 0.3),
            railMat
        );
        post.position.x = Math.cos(angle) * (LIGHTHOUSE_RADIUS_TOP + 6.5);
        post.position.z = Math.sin(angle) * (LIGHTHOUSE_RADIUS_TOP + 6.5);
        post.position.y = towerTopY + 4;
        scene.add(post);
    }

    // ===== LUZ PERFEITA =====
    beaconPivot = new THREE.Object3D();
    beaconPivot.position.set(0, towerTopY + 5, 0);
    scene.add(beaconPivot);

    const beamLight = new THREE.SpotLight(0xffffaa, 14, 600, Math.PI / 10, 0.4, 1);
    beamLight.position.set(0, 0, 0);
    beamLight.castShadow = true;
    beamLight.shadow.mapSize.width = 2048;
    beamLight.shadow.mapSize.height = 2048;
    beaconPivot.add(beamLight);

    // Feixe volumétrico grosso
    const beamLength = 400;
    const beamGeo = new THREE.CylinderGeometry(2.5, 25, beamLength, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
        color: 0xffffcc,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    volumetricBeam = new THREE.Mesh(beamGeo, beamMat);
    volumetricBeam.position.z = -beamLength / 2;
    volumetricBeam.rotation.x = Math.PI / 2;
    beaconPivot.add(volumetricBeam);

    // Lâmpada visível
    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffaa })
    );
    beaconPivot.add(bulb);

    // Chão interno
    const floorGeo = new THREE.CircleGeometry(LIGHTHOUSE_RADIUS_BASE - 1, 64);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    lighthouseFloor = new THREE.Mesh(floorGeo, floorMat);
    lighthouseFloor.rotation.x = -Math.PI / 2;
    lighthouseFloor.position.y = 0.1;
    scene.add(lighthouseFloor);
}

// ===== JOGADOR =====
function createPlayer() {
    player = new THREE.Group();
    player.position.set(0, PLAYER_EYE, 40);
    scene.add(player);
    player.add(camera);
    camera.position.set(0, 0, 0);
}
// ===== VERIFICAR SE ESTÁ NO BARCO =====
function isPlayerNearShipwreck() {
    const dx = player.position.x - SHIPWRECK_POSITION.x;
    const dz = player.position.z - SHIPWRECK_POSITION.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance < SHIPWRECK_RADIUS;
}

// ===== VERIFICAR SE ESTÁ NO FAROL =====
function isPlayerInsideLighthouse() {
    const dx = player.position.x;
    const dz = player.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance < LIGHTHOUSE_RADIUS_BASE && player.position.y < 15;
}

// ===== SISTEMA DE CURA DO FAROL =====
function checkLighthouseHeal() {
    if (wave - lastHealWave >= 5 && isPlayerInsideLighthouse()) {
        const healAmount = 20;
        const oldHP = playerHP;
        playerHP = Math.min(playerMaxHP, playerHP + healAmount);
        
        if (playerHP > oldHP) {
            lastHealWave = wave;
            
            const healParticles = new THREE.Group();
            for (let i = 0; i < 20; i++) {
                const particleGeo = new THREE.SphereGeometry(0.3, 8, 8);
                const particleMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                const particle = new THREE.Mesh(particleGeo, particleMat);
                particle.position.set(
                    player.position.x + (Math.random() - 0.5) * 3,
                    player.position.y + Math.random() * 2,
                    player.position.z + (Math.random() - 0.5) * 3
                );
                healParticles.add(particle);
            }
            scene.add(healParticles);
            setTimeout(() => scene.remove(healParticles), 1000);
            console.log(`💚 CURADO! +${healAmount} HP (${oldHP} → ${playerHP})`);
        }
        updateUI();
    }
}
// ===== CONTROLES (VERSÃO CORRIGIDA E MELHORADA) =====
function setupControls() {
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;

        // C = Build Mode / R = Remove Mode
        if (e.key.toLowerCase() === 'c') toggleBuildMode();
        if (e.key.toLowerCase() === 'r') toggleRemoveMode();

        // 1-9 e 0 = SELECIONA CANHÃO (agora funciona mesmo se não tiver owned ainda!)
        if (e.key >= '1' && e.key <= '9') {
            const index = parseInt(e.key) - 1;
            if (cannonTypes[index]) {  // Só verifica se existe, não se tá owned
                selectedCannonIndex = index;
                updateUI();
                updateGhostCannon();  // Função nova (mais abaixo) que recria o ghost direitinho
            }
        }
        if (e.key === '0') {
            if (cannonTypes[9]) {
                selectedCannonIndex = 9;
                updateUI();
                updateGhostCannon();
            }
        }

        // E = Loja / P = Pause
        if (e.key.toLowerCase() === 'e') {
            if (isPlayerNearShipwreck()) {
                toggleShop();
            } else {
                console.log("🚫 Você precisa estar no barco naufragado para abrir a loja!");
            }
        }
        if (e.key.toLowerCase() === 'p') togglePause();
        if (e.key === 'Escape' && gameStarted && !shopOpen) {
        const menu = document.getElementById('settingsMenu');
        if (menu.style.display === 'none' || !menu.style.display) {
            menu.style.display = 'block';
            document.exitPointerLock();
        } else {
            menu.style.display = 'none';
            renderer.domElement.requestPointerLock();
        }
    }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    // Mouse look (pointer lock)
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            const sensitivity = 0.002;
            player.rotation.y -= e.movementX * sensitivity;
            camera.rotation.x -= e.movementY * sensitivity;
            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        }
    });

    // Clique = colocar ou remover canhão
    document.addEventListener('click', () => {
        if (shopOpen || document.getElementById('cannonMenu').style.display === 'block') return;

        if (!document.pointerLockElement) {
            renderer.domElement.requestPointerLock();
            return;
        }

        if (buildMode) placeCannon();
        else if (removeMode) removeCannon();
    });

    document.getElementById('restartButton').addEventListener('click', returnToMenu);

    // SCROLL DO MOUSE = troca canhão (agora funciona mesmo se não tiver todos desbloqueados)
    document.addEventListener('wheel', (e) => {
        if (shopOpen || !buildMode) return;

        const direction = e.deltaY > 0 ? 1 : -1;
        let attempts = 0;

        while (attempts < cannonTypes.length) {
            selectedCannonIndex = (selectedCannonIndex + direction + cannonTypes.length) % cannonTypes.length;
            attempts++;
            // Permite selecionar qualquer canhão (mesmo não owned) pra ver no ghost
            updateUI();
            updateGhostCannon();
            break; // Sai no primeiro giro (mais fluido)
        }
    });
}

// ✅ CORREÇÃO (substitua a função updateGhostCannon completa):
function updateGhostCannon() {
    if (!buildMode) return;

    if (ghostCannon) {
        scene.remove(ghostCannon);
        ghostCannon = null;
    }

    const type = cannonTypes[selectedCannonIndex];
    if (!type) return;

    // Cria ghost visual simples
    const cannonGeo = new THREE.CylinderGeometry(1, 1.5, 3, 8);
    const cannonMat = new THREE.MeshBasicMaterial({ 
        color: type.color, 
        transparent: true, 
        opacity: type.owned && gold >= type.cost ? 0.6 : 0.3,
        wireframe: true 
    });
    
    ghostCannon = new THREE.Mesh(cannonGeo, cannonMat);
    
    // Cor de emissão baseada em se pode comprar ou não
    if (type.owned && gold >= type.cost) {
        cannonMat.emissive = new THREE.Color(0x00ff00);
    } else {
        cannonMat.emissive = new THREE.Color(0xff0000);
    }
    cannonMat.emissiveIntensity = 0.5;
    
    scene.add(ghostCannon);
}

// ===== MODO CONSTRUÇÃO =====
function toggleBuildMode() {
    removeMode = false;
    buildMode = !buildMode;
    const indicator = document.getElementById('buildModeIndicator');
    if (buildMode) {
        indicator.style.display = 'block';
        // ✅ MODO CONSTRUÇÃO VERDE
        indicator.style.background = 'rgba(0, 255, 0, 0.15)';
        indicator.style.borderColor = '#00ff00';
        indicator.style.color = '#00ff00';
        indicator.innerHTML = '🔨 MODO CONSTRUÇÃO<div style="font-size: 16px; margin-top: 10px;">🖱️ Clique para colocar canhão</div>';
        document.body.style.cursor = 'crosshair';
        createGhostCannon();
    } else {
        // ✅ Reset para padrão quando desativado
        indicator.style.background = '';
        indicator.style.borderColor = '';
        indicator.style.color = '';
        indicator.style.display = 'none';
        document.body.style.cursor = 'default';
        if (ghostCannon) { scene.remove(ghostCannon); ghostCannon = null; }
    }
}

function toggleRemoveMode() {
    buildMode = false;
    if (ghostCannon) { scene.remove(ghostCannon); ghostCannon = null; }
    removeMode = !removeMode;
    const indicator = document.getElementById('buildModeIndicator');
    if (removeMode) {
        // ✅ MODO REMOÇÃO VERMELHO
        indicator.style.display = 'block';
        indicator.style.background = 'rgba(255, 0, 0, 0.15)';
        indicator.style.borderColor = '#ff0000';
        indicator.style.color = '#ff0000';
        indicator.innerHTML = '🗑️ MODO REMOÇÃO<div style="font-size: 16px; margin-top: 10px;">🖱️ Clique em um canhão para remover</div>';
        document.body.style.cursor = 'not-allowed';
    } else {
        // ✅ Reset para padrão quando desativado
        indicator.style.background = '';
        indicator.style.borderColor = '';
        indicator.style.color = '';
        indicator.style.display = 'none';
        document.body.style.cursor = 'default';
    }
}

function placeCannon() {
    // Verificar se atingiu o limite máximo de canhões
    if (placedCannons.length >= MAX_CANNONS) {
        console.log(`⚠️ Limite máximo de ${MAX_CANNONS} canhões atingido!`);
        return;
    }
    
    const type = cannonTypes[selectedCannonIndex];
    if (gold < type.cost) return;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects([island, lighthouseFloor]);
    if (intersects.length > 0) {
        const point = intersects[0].point;
        const distFromCenter = Math.sqrt(point.x * point.x + point.z * point.z);
        if (distFromCenter < LIGHTHOUSE_RADIUS_BASE + 5) return;
        for (let cannon of placedCannons) {
            const dx = cannon.position.x - point.x;
            const dz = cannon.position.z - point.z;
            if (Math.sqrt(dx * dx + dz * dz) < 8) return;
        }
        gold -= type.cost;
        createCannon(point, selectedCannonIndex);
        updateUI();
        if (ghostCannon) { scene.remove(ghostCannon); createGhostCannon(); }
    }
}

function removeCannon() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(placedCannons, true);
    if (intersects.length > 0) {
        let cannon = intersects[0].object;
        while (cannon.parent && !cannon.userData.type && cannon.userData.type !== 0) cannon = cannon.parent;
        if (cannon.userData && (cannon.userData.type || cannon.userData.type === 0)) {
            const type = cannonTypes[cannon.userData.type];
            gold += Math.floor(type.cost * 0.5);
            scene.remove(cannon);
            placedCannons = placedCannons.filter(c => c !== cannon);
            updateUI();
        }
    }
}

function createCannon(position, typeIndex) {
    const type = cannonTypes[typeIndex];
    const visual = type.visual;
    const cannon = new THREE.Group();
    cannon.position.copy(position);
    cannon.position.y = visual.baseHeight / 2;
    
    // Base decorada
    const baseGeo = new THREE.CylinderGeometry(visual.baseRadius, visual.baseRadius * 1.1, visual.baseHeight, 12);
    const baseMat = new THREE.MeshStandardMaterial({ 
        color: type.color, 
        metalness: visual.metalness, 
        roughness: visual.roughness,
        emissive: type.color,
        emissiveIntensity: visual.glowIntensity * 0.3
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.castShadow = true;
    base.receiveShadow = true;
    cannon.add(base);
    
    // Ornamentos na base (se tiver)
    if (visual.hasOrnaments) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const ornGeo = new THREE.BoxGeometry(0.15, visual.baseHeight * 0.8, 0.15);
            const ornMat = new THREE.MeshStandardMaterial({ 
                color: 0x333333, 
                metalness: 0.9, 
                roughness: 0.1 
            });
            const orn = new THREE.Mesh(ornGeo, ornMat);
            orn.position.x = Math.cos(angle) * visual.baseRadius;
            orn.position.z = Math.sin(angle) * visual.baseRadius;
            orn.castShadow = true;
            cannon.add(orn);
        }
    }
    
    // Cano do canhão (com ponta identificável)
    const barrelGroup = new THREE.Group();
    const cannonGeo = new THREE.CylinderGeometry(visual.barrelRadius, visual.barrelRadius * 0.8, visual.barrelLength, 12);
    const cannonMat = new THREE.MeshStandardMaterial({ 
        color: type.color, 
        metalness: visual.metalness, 
        roughness: visual.roughness,
        emissive: type.color,
        emissiveIntensity: visual.glowIntensity * 0.5
    });
    const cannonMesh = new THREE.Mesh(cannonGeo, cannonMat);
    cannonMesh.rotation.z = Math.PI / 2;
    cannonMesh.position.x = visual.barrelLength / 2;
    cannonMesh.castShadow = true;
    barrelGroup.add(cannonMesh);
    
    // Ponta do canhão (boca de fogo) - ORIGEM DOS PROJÉTEIS
    const muzzleGeo = new THREE.CylinderGeometry(visual.barrelRadius * 1.2, visual.barrelRadius, 0.3, 12);
    const muzzleMat = new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        metalness: 1.0, 
        roughness: 0.0,
        emissive: type.color,
        emissiveIntensity: visual.glowIntensity
    });
    const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
    muzzle.rotation.z = Math.PI / 2;
    muzzle.position.x = visual.barrelLength;
    barrelGroup.add(muzzle);
    
    // Luz na ponta (se tiver glow)
    if (visual.glowIntensity > 0) {
        const muzzleLight = new THREE.PointLight(type.color, visual.glowIntensity, 5);
        muzzleLight.position.x = visual.barrelLength + 0.2;
        barrelGroup.add(muzzleLight);
    }
    
    barrelGroup.position.y = visual.baseHeight / 2;
    cannon.add(barrelGroup);
    
    cannon.userData = { 
        type: typeIndex, 
        lastShot: 0, 
        target: null, 
        cannonMesh: barrelGroup, 
        muzzlePosition: new THREE.Vector3(visual.barrelLength + 0.2, 0, 0),
        damage: type.damage, 
        fireRate: type.fireRate, 
        range: type.range, 
        projectileSpeed: type.projectileSpeed, 
        color: type.color, 
        upgradeLevel: 0 
    };
    
    scene.add(cannon);
    placedCannons.push(cannon);
}

// ===== MENU DO CANHÃO =====
function setupCannonMenu() {
    document.getElementById('closeCannonMenu').addEventListener('click', () => {
        document.getElementById('cannonMenu').style.display = 'none';
        selectedCannonForMenu = null;
        renderer.domElement.requestPointerLock();
    });
    document.getElementById('upgradeCannonBtn').addEventListener('click', () => { if (selectedCannonForMenu) upgradeCannon(selectedCannonForMenu); });
    document.getElementById('sellCannonBtn').addEventListener('click', () => { if (selectedCannonForMenu) sellCannon(selectedCannonForMenu); });
    renderer.domElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(placedCannons, true);
        if (intersects.length > 0) {
            let cannon = intersects[0].object;
            while (cannon.parent && !cannon.userData.type && cannon.userData.type !== 0) cannon = cannon.parent;
            if (cannon.userData && (cannon.userData.type || cannon.userData.type === 0)) openCannonMenu(cannon);
        }
    });
}

function openCannonMenu(cannon) {
    selectedCannonForMenu = cannon;
    const menu = document.getElementById('cannonMenu');
    const info = document.getElementById('cannonMenuInfo');
    const type = cannonTypes[cannon.userData.type];
    const upgradeCost = Math.floor(type.cost * 0.5 * (cannon.userData.upgradeLevel + 1));
    const sellValue = Math.floor(type.cost * 0.5 + upgradeCost * cannon.userData.upgradeLevel * 0.5);
    info.innerHTML = `<strong>${type.name}</strong><br>Nível: ${cannon.userData.upgradeLevel + 1}/${type.maxLevel + 1}<br>Dano: ${cannon.userData.damage}<br>Alcance: ${cannon.userData.range}m`;
    document.getElementById('upgradeCost').textContent = upgradeCost;
    document.getElementById('sellValue').textContent = sellValue;
    const upgradeBtn = document.getElementById('upgradeCannonBtn');
    if (cannon.userData.upgradeLevel >= type.maxLevel) { upgradeBtn.disabled = true; upgradeBtn.textContent = 'Nível Máximo'; }
    else { upgradeBtn.disabled = false; upgradeBtn.innerHTML = `⬆️ Upgrade (Custo: <span id="upgradeCost">${upgradeCost}</span>💰)`; }
    menu.style.display = 'block';
    document.exitPointerLock();
}

function upgradeCannon(cannon) {
    const type = cannonTypes[cannon.userData.type];
    const upgradeCost = Math.floor(type.cost * 0.5 * (cannon.userData.upgradeLevel + 1));
    if (gold >= upgradeCost && cannon.userData.upgradeLevel < type.maxLevel) {
        gold -= upgradeCost;
        cannon.userData.upgradeLevel++;
        cannon.userData.damage = Math.floor(type.damage * (1 + cannon.userData.upgradeLevel * 0.5));
        cannon.userData.range = type.range * (1 + cannon.userData.upgradeLevel * 0.2);
        cannon.userData.fireRate = type.fireRate * (1 - cannon.userData.upgradeLevel * 0.1);
        updateUI();
        document.getElementById('cannonMenu').style.display = 'none';
        selectedCannonForMenu = null;
        renderer.domElement.requestPointerLock();
    }
}

function sellCannon(cannon) {
    const type = cannonTypes[cannon.userData.type];
    const upgradeCost = Math.floor(type.cost * 0.5 * (cannon.userData.upgradeLevel + 1));
    gold += Math.floor(type.cost * 0.5 + upgradeCost * cannon.userData.upgradeLevel * 0.5);
    scene.remove(cannon);
    placedCannons = placedCannons.filter(c => c !== cannon);
    updateUI();
    document.getElementById('cannonMenu').style.display = 'none';
    selectedCannonForMenu = null;
    renderer.domElement.requestPointerLock();
}

// ===== LOJA =====
function setupShop() {
    const shopGrid = document.getElementById('cannonGrid');
    cannonTypes.forEach((type, index) => {
        const card = document.createElement('div');
        card.className = 'cannon-card';
        if (type.owned) card.classList.add('owned');
        card.innerHTML = `<div class="cannon-name">${type.name}</div><div class="cannon-stats">💥 Dano: ${type.damage}</div><div class="cannon-stats">⚡ Taxa: ${(1000 / type.fireRate).toFixed(1)}/s</div><div class="cannon-stats">🎯 Alcance: ${type.range}m</div><div class="cannon-stats">${type.description}</div><div class="cannon-cost">${type.owned ? '✅ Desbloqueado' : type.cost + ' 💰'}</div>`;
        card.addEventListener('click', () => { if (!type.owned && gold >= type.cost) { gold -= type.cost; type.owned = true; updateShop(); updateUI(); } });
        shopGrid.appendChild(card);
    });
    document.getElementById('closeShop').addEventListener('click', toggleShop);
}

function updateShop() {
    const cards = document.querySelectorAll('.cannon-card');
    cannonTypes.forEach((type, index) => {
        const card = cards[index];
        if (type.owned) { card.classList.add('owned'); card.querySelector('.cannon-cost').textContent = '✅ Desbloqueado'; }
    });
    document.getElementById('shopGoldAmount').textContent = gold;
}

function toggleShop() {
    if (!shopOpen && !isPlayerNearShipwreck()) {
        console.log("🚫 Você precisa estar no barco naufragado para abrir a loja!");
        return;
    }
    
    shopOpen = !shopOpen;
    const shopElement = document.getElementById('shop');
    
    if (shopOpen) {
        shopElement.style.display = 'block';
        updateShop();
        document.exitPointerLock();
    } else {
        shopElement.style.display = 'none';
        renderer.domElement.requestPointerLock();
    }
}

// ===== IA DOS CANHÕES =====
function updateCannons() {
    const now = Date.now();
    placedCannons.forEach(cannon => {
        const cannonData = cannon.userData;
        let closestEnemy = null, closestDist = cannonData.range;
        enemies.forEach(enemy => {
            const dx = enemy.position.x - cannon.position.x;
            const dz = enemy.position.z - cannon.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < closestDist) { closestDist = dist; closestEnemy = enemy; }
        });
        if (closestEnemy) {
            const dx = closestEnemy.position.x - cannon.position.x;
            const dz = closestEnemy.position.z - cannon.position.z;
            cannon.rotation.y = Math.atan2(dx, dz);
            if (now - cannonData.lastShot > cannonData.fireRate) { cannonData.lastShot = now; fireCannonProjectile(cannon, closestEnemy); }
        }
    });
}

function fireCannonProjectile(cannon, target) {
    const type = cannonTypes[cannon.userData.type];
    const projData = type.projectile;
    
    // Calcula posição da boca do canhão no mundo
    const muzzleWorldPos = new THREE.Vector3();
    const muzzleLocal = cannon.userData.muzzlePosition;
    const barrelGroup = cannon.userData.cannonMesh;
    
    // Posição mundial da boca do canhão
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    barrelGroup.matrixWorld.decompose(muzzleWorldPos, worldQuaternion, worldScale);
    
    const rotatedMuzzle = muzzleLocal.clone().applyQuaternion(worldQuaternion);
    muzzleWorldPos.add(rotatedMuzzle);
    
    // Cria geometria baseada no tipo - SIMPLIFICADA
    let projectileGeo;
    switch(projData.type) {
        case 'sphere':
            projectileGeo = new THREE.SphereGeometry(projData.size, 6, 6); // Era 8,8
            break;
        case 'cylinder':
            projectileGeo = new THREE.CylinderGeometry(projData.size * 0.5, projData.size * 0.5, projData.size * 2, 6); // Era 8
            break;
        case 'octahedron':
            projectileGeo = new THREE.OctahedronGeometry(projData.size);
            break;
        case 'icosahedron':
            projectileGeo = new THREE.IcosahedronGeometry(projData.size);
            break;
        case 'dodecahedron':
            projectileGeo = new THREE.DodecahedronGeometry(projData.size);
            break;
        case 'torus':
            projectileGeo = new THREE.TorusGeometry(projData.size * 0.6, projData.size * 0.3, 6, 8); // Era 8,12
            break;
        default:
            projectileGeo = new THREE.SphereGeometry(projData.size, 6, 6);
    }
    
    // Material BASIC ao invés de STANDARD (mais rápido)
    const projectileMat = new THREE.MeshBasicMaterial({ 
        color: projData.color
    });
    
    const projectile = new THREE.Mesh(projectileGeo, projectileMat);
    projectile.position.copy(muzzleWorldPos);
    
    // SEM LUZ INDIVIDUAL - economiza muito performance!
    
    const dx = target.position.x - muzzleWorldPos.x;
    const dz = target.position.z - muzzleWorldPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    projectile.userData = {
        vx: (dx / dist) * cannon.userData.projectileSpeed,
        vz: (dz / dist) * cannon.userData.projectileSpeed,
        damage: cannon.userData.damage,
        lifetime: 200,
        fromCannon: true,
        trail: projData.trail ? [] : null,
        trailColor: projData.trailColor,
        rotationSpeed: new THREE.Vector3(
            Math.random() * 0.2 - 0.1,
            Math.random() * 0.2 - 0.1,
            Math.random() * 0.2 - 0.1
        )
    };
    
    scene.add(projectile);
    projectiles.push(projectile);
    playSound('cannon');
}

// ===== INIMIGOS =====
function spawnEnemy() {
    const sprite = pickRandomSprite();
    const stats = MONSTER_STATS[sprite];
    if (!stats) return;
    const angle = Math.random() * Math.PI * 2;
    const enemy = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: loadTextureCached(sprite), transparent: true, side: THREE.DoubleSide }));
    enemy.position.set(Math.cos(angle) * 150, 2, Math.sin(angle) * 150);
    const damageMultiplier = 1 + (wave - 1) * 0.15;
    enemy.userData = { hp: stats.health * (1 + wave * 0.3), maxHp: stats.health * (1 + wave * 0.3), speed: stats.speed, damage: stats.damage * damageMultiplier, gold: stats.gold, sprite };
    scene.add(enemy);
    enemies.push(enemy);
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!enemy) continue;

        const dx = player.position.x - enemy.position.x;
        const dz = player.position.z - enemy.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 3) {
            const speed = enemy.userData.speed * 1.4;
            enemy.position.x += (dx / dist) * speed;
            enemy.position.z += (dz / dist) * speed;
            enemy.rotation.y = Math.atan2(dx, dz);
        } else {
            // TOCOU NO PLAYER → DANO!
            damagePlayer(enemy.userData.damage || 10);
            scene.remove(enemy);
            enemies.splice(i, 1);
            addGold(enemy.userData.gold || 5);
        }
    }
}

// DANO NO PLAYER (quando monstro toca)
function damagePlayer(damage) {
    playerHP -= damage;
    if (playerHP < 0) playerHP = 0;
    updatePlayerHP();  // Atualiza barra de vida
    if (playerHP <= 0) {
        gameOver();  // GAME OVER!
    }
}

// Atualiza a barra de vida do player na UI
// Atualiza a barra de vida do player na UI
function updatePlayerHP() {
    const hpText = document.getElementById('playerHP');
    const hpBar = document.getElementById('playerHPBar');
    const lowHealthEffect = document.getElementById('lowHealthEffect');

    if (hpText) hpText.textContent = Math.floor(playerHP);
    if (hpBar) {
        const percent = (playerHP / playerMaxHP) * 100;
        hpBar.style.width = percent + '%';
        hpBar.style.background = 
            percent > 50 ? 'linear-gradient(90deg, #00ff00, #00cc00)' :
            percent > 25 ? 'linear-gradient(90deg, #ffff00, #ffaa00)' :
                           'linear-gradient(90deg, #ff0000, #cc0000)';
    }
    
    // ✅ EFEITO DE VIDA BAIXA (abaixo de 40 HP)
    if (playerHP <= 40 && playerHP > 0) {
        // Mostra borda vermelha
        if (lowHealthEffect) lowHealthEffect.style.display = 'block';
        
        // Aumenta volume do batimento quanto menor a vida
        if (soundEffects.heartbeat) {
            const volume = (40 - playerHP) / 40; // 0 a 40 HP = 0 a 1 de volume
            soundEffects.heartbeat.setVolume(Math.min(volume * 0.6, 0.6));
        }
    } else {
        // Remove efeito quando vida acima de 40
        if (lowHealthEffect) lowHealthEffect.style.display = 'none';
        if (soundEffects.heartbeat) soundEffects.heartbeat.setVolume(0);
    }
    
    // Quando morre, para o batimento
    if (playerHP <= 0) {
        if (lowHealthEffect) lowHealthEffect.style.display = 'none';
        if (soundEffects.heartbeat) soundEffects.heartbeat.setVolume(0);
    }
}

// ===== PROJÉTEIS =====
function updateProjectiles() {
    projectiles = projectiles.filter(proj => {
        proj.position.x += proj.userData.vx;
        proj.position.z += proj.userData.vz;
        proj.userData.lifetime--;
        if (proj.userData.lifetime <= 0) { 
            if (proj.userData.trailLine) scene.remove(proj.userData.trailLine); // Limpa trail
            scene.remove(proj); 
            return false; 
        }
        // Rotação do projétil
        if (proj.userData.rotationSpeed) {
            proj.rotation.x += proj.userData.rotationSpeed.x;
            proj.rotation.y += proj.userData.rotationSpeed.y;
            proj.rotation.z += proj.userData.rotationSpeed.z;
        }
        
        // Trail (rastro) - OTIMIZADO
        if (proj.userData.trail) {
            const trailPoint = proj.position.clone();
            proj.userData.trail.push(trailPoint);
            
            if (proj.userData.trail.length > 5) { // Reduzido de 10 para 5
                proj.userData.trail.shift();
            }
            
            // Cria/atualiza linha APENAS UMA VEZ por projétil
            if (!proj.userData.trailLine && proj.userData.trail.length > 1) {
                const trailGeo = new THREE.BufferGeometry().setFromPoints(proj.userData.trail);
                const trailMat = new THREE.LineBasicMaterial({ 
                    color: proj.userData.trailColor,
                    transparent: true,
                    opacity: 0.4
                });
                proj.userData.trailLine = new THREE.Line(trailGeo, trailMat);
                scene.add(proj.userData.trailLine);
            } else if (proj.userData.trailLine) {
                // Atualiza geometria existente ao invés de criar nova
                proj.userData.trailLine.geometry.setFromPoints(proj.userData.trail);
            }
        }
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const dx = enemy.position.x - proj.position.x;
            const dz = enemy.position.z - proj.position.z;
            if (Math.sqrt(dx * dx + dz * dz) < 2) {
                enemy.userData.hp -= proj.userData.damage;
                    if (enemy.userData.hp <= 0) { 
                    kills++; 
                    gold += enemy.userData.gold; 
                    scene.remove(enemy); 
                    enemies.splice(i, 1); 
                    updateUI();
                    playSound('monsterDeath');
                    }
                if (proj.userData.trailLine) scene.remove(proj.userData.trailLine); // Limpa trail
                scene.remove(proj);
                return false;
            }
        }
        return true;
    });
}

// ===== ONDAS =====
function startWave() {
    waveInProgress = true;
    enemyCount = 3 + wave * 2;
    playSound('wave');
    const spawnInterval = setInterval(() => {
        if (!gameActive || !waveInProgress) { clearInterval(spawnInterval); return; }
        spawnEnemy();
        enemyCount--;
        if (enemyCount <= 0) clearInterval(spawnInterval);
    }, 2000);
}

function checkWaveComplete() {
    if (waveInProgress && enemies.length === 0 && enemyCount <= 0) {
        waveInProgress = false;
        wave++;
        updateUI();
        setTimeout(() => { if (gameActive) startWave(); }, 5000);
    }
}

// ===== UI =====
function updateUI() {
    document.getElementById('kills').textContent = kills;
    document.getElementById('gold').textContent = gold;
    document.getElementById('wave').textContent = wave;
    document.getElementById('cannonName').textContent = `💣 ${cannonTypes[selectedCannonIndex].name} (${placedCannons.length}/${MAX_CANNONS})`;
    document.getElementById('playerHP').textContent = playerHP;
const hpBar = document.getElementById('playerHPBar');
const hpPercent = (playerHP / playerMaxHP) * 100;
hpBar.style.width = hpPercent + '%';

if (hpPercent > 60) {
    hpBar.style.background = 'linear-gradient(90deg, #00ff00, #00cc00)';
} else if (hpPercent > 30) {
    hpBar.style.background = 'linear-gradient(90deg, #ffaa00, #ff8800)';
} else {
    hpBar.style.background = 'linear-gradient(90deg, #ff0000, #cc0000)';
}
}

// ===== GAME OVER =====
function gameOver() {
    gameActive = false;
    saveRecord(wave, kills);
    document.getElementById('finalWave').textContent = wave;
    document.getElementById('finalKills').textContent = kills;
    document.getElementById('gameOver').style.display = 'block';
    document.exitPointerLock();
    console.log("💀 GAME OVER! Record salvo.");
}

// ===== MOVIMENTO DO JOGADOR =====
function updatePlayer() {
    const distToCenter = Math.sqrt(player.position.x ** 2 + player.position.z ** 2);
    const nearStairs = distToCenter > (LIGHTHOUSE_RADIUS_BASE - 10) && distToCenter < (LIGHTHOUSE_RADIUS_BASE + 5) && player.position.y < LIGHTHOUSE_HEIGHT + 20;
    
    // ✅ DANO NA ÁGUA (se sair da ilha)
    if (distToCenter > 95 && player.position.y <= PLAYER_EYE) {
        damagePlayer(10);
        // Empurra de volta pra ilha
        const angle = Math.atan2(player.position.z, player.position.x);
        player.position.x = Math.cos(angle) * 95;
        player.position.z = Math.sin(angle) * 95;
        
        // Feedback visual (tela vermelha rápida)
        document.body.style.background = 'rgba(255, 0, 0, 0.3)';
        setTimeout(() => { document.body.style.background = ''; }, 200);
    }
    
    if (nearStairs && !onStairs) {
        let closestStair = -1, closestDist = Infinity;
        stairWaypoints.forEach((waypoint, index) => {
            const dx = waypoint.position.x - player.position.x;
            const dy = waypoint.position.y - player.position.y;
            const dz = waypoint.position.z - player.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < closestDist && dist < 8) { closestDist = dist; closestStair = index; }
        });
        if (closestStair !== -1) { onStairs = true; currentStairIndex = closestStair; }
    }
    if (onStairs) {
        const now = Date.now();
        const moveDelay = 200;
        if (keys['w'] && currentStairIndex < stairWaypoints.length - 1 && now - lastStairMove > moveDelay) {
            currentStairIndex++;
            player.position.copy(stairWaypoints[currentStairIndex].position);
            player.rotation.y = stairWaypoints[currentStairIndex].angle + Math.PI;
            lastStairMove = now;
        }
        if (keys['s'] && currentStairIndex > 0 && now - lastStairMove > moveDelay) {
            currentStairIndex--;
            player.position.copy(stairWaypoints[currentStairIndex].position);
            player.rotation.y = stairWaypoints[currentStairIndex].angle + Math.PI;
            lastStairMove = now;
        }
        if (keys[' '] || keys['a'] || keys['d'] || keys['shift']) {
            onStairs = false;
            currentStairIndex = -1;
            const pushDist = LIGHTHOUSE_RADIUS_BASE + 3;
            const angle = Math.atan2(player.position.z, player.position.x);
            player.position.x = Math.cos(angle) * pushDist;
            player.position.z = Math.sin(angle) * pushDist;
            player.position.y = PLAYER_EYE;
        }
    } else {
        const speed = PLAYER_SPEED;
        if (keys['w']) { player.position.x -= Math.sin(player.rotation.y) * speed; player.position.z -= Math.cos(player.rotation.y) * speed; }
        if (keys['s']) { player.position.x += Math.sin(player.rotation.y) * speed; player.position.z += Math.cos(player.rotation.y) * speed; }
        if (keys['a']) { player.position.x -= Math.cos(player.rotation.y) * speed; player.position.z += Math.sin(player.rotation.y) * speed; }
        if (keys['d']) { player.position.x += Math.cos(player.rotation.y) * speed; player.position.z -= Math.sin(player.rotation.y) * speed; }
        
        // ❌ REMOVA ESTA PARTE ANTIGA (que só limitava sem dar dano):
        // const dist = Math.sqrt(player.position.x ** 2 + player.position.z ** 2);
        // if (dist > 95) { const angle = Math.atan2(player.position.z, player.position.x); player.position.x = Math.cos(angle) * 95; player.position.z = Math.sin(angle) * 95; }
        
        if (keys[' '] && player.position.y <= PLAYER_EYE + 0.1) vY = JUMP_FORCE;
        vY += GRAVITY;
        player.position.y += vY;
        if (player.position.y < PLAYER_EYE) { player.position.y = PLAYER_EYE; vY = 0; }
    }
    if (buildMode && ghostCannon) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects([island, lighthouseFloor]);
        if (intersects.length > 0) { ghostCannon.position.copy(intersects[0].point); ghostCannon.position.y = 0.5; }
    }
}

// ===== MOBILE =====
function setupMobileControls() {
    const manager = nipplejs.create({ zone: document.getElementById('joystick-zone'), mode: 'static', position: { left: '75px', bottom: '105px' }, color: '#00f5ff', size: 150 });
    manager.on('move', (evt, data) => {
        const forward = Math.cos(data.angle.radian) * data.force;
        const strafe = Math.sin(data.angle.radian) * data.force;
        player.position.x += strafe * PLAYER_SPEED * 0.3;
        player.position.z -= forward * PLAYER_SPEED * 0.3;
    });
    document.getElementById('shoot-button').addEventListener('touchstart', (e) => { e.preventDefault(); toggleBuildMode(); });
    document.getElementById('shop-button').addEventListener('touchstart', (e) => { e.preventDefault(); toggleShop(); });
    document.getElementById('jump-button').addEventListener('touchstart', (e) => { e.preventDefault(); if (player.position.y <= PLAYER_EYE + 0.1) vY = JUMP_FORCE; });
    let touchStartX = 0, touchStartY = 0;
    renderer.domElement.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; });
    renderer.domElement.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = e.touches[0].clientY - touchStartY;
            player.rotation.y -= deltaX * 0.005;
            camera.rotation.x -= deltaY * 0.005;
            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    });
}

function loadTextureCached(path) { if (!textureCache[path]) textureCache[path] = textureLoader.load(path); return textureCache[path]; }

function animate() {
    requestAnimationFrame(animate);

    if (!gameActive || gamePaused || !gameStarted) return; // ADICIONE !gameStarted

    const currentTime = Date.now();

    updatePlayer();
    updateEnemies();
    updateCannons();
    updateProjectiles();
    checkWaveComplete();

    // Farol girando
    if (beaconPivot) beaconPivot.rotation.y += 0.003;

    // Chuva
    if (rain) {
        const positions = rain.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= 3.5;
            if (positions[i + 1] < -20) {
                positions[i + 1] = 150;
                positions[i] = Math.random() * 600 - 300;
                positions[i + 2] = Math.random() * 600 - 300;
            }
        }
        rain.geometry.attributes.position.needsUpdate = true;
    }

    // Nuvens
    clouds.forEach(cloud => {
        cloud.position.x += 0.12;
        cloud.position.z += 0.06;
        if (cloud.position.x > 450) cloud.position.x = -450;
        if (cloud.position.z > 450) cloud.position.z = -450;
    });

    // Tornados
    tornadoes.forEach(tornado => {
        tornado.userData.phase += 0.015;
        tornado.position.x = tornado.userData.baseX + Math.sin(tornado.userData.phase) * 18;
        tornado.position.z = tornado.userData.baseZ + Math.cos(tornado.userData.phase) * 18;
        tornado.rotation.y += 0.06;

        const vertices = tornado.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const angle = Math.atan2(vertices[i + 2], vertices[i]);
            const radius = Math.sqrt(vertices[i] * vertices[i] + vertices[i + 2] * vertices[i + 2]);
            const twist = vertices[i + 1] * 0.07;
            const newAngle = angle + 0.03 + twist;
            vertices[i] = Math.cos(newAngle) * radius;
            vertices[i + 2] = Math.sin(newAngle) * radius;
        }
        tornado.geometry.attributes.position.needsUpdate = true;

        if (!tornado.userData.lightningTimer) tornado.userData.lightningTimer = 0;
        if (!tornado.userData.lightningCooldown) tornado.userData.lightningCooldown = Math.random() * 10 + 8;

        tornado.userData.lightningTimer += 0.016;
        if (tornado.userData.lightningTimer >= tornado.userData.lightningCooldown) {
            tornado.userData.lightningTimer = 0;
            tornado.userData.lightningCooldown = Math.random() * 12 + 8;

            const from = new THREE.Vector3(
                tornado.position.x + (Math.random() - 0.5) * 20,
                tornado.position.y + 80 + Math.random() * 60,
                tornado.position.z + (Math.random() - 0.5) * 20
            );

            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 200;
            const to = new THREE.Vector3(
                Math.cos(angle) * dist,
                0,
                Math.sin(angle) * dist
            );

            createLightningBolt(from, to);
            lightningLight.intensity = 3; // ✅ Era 15, agora 3
            setTimeout(() => { lightningLight.intensity = 0; }, 180);
        }
    });

// Relâmpagos aleatórios
    if (currentTime - lastLightningTime > 600 && Math.random() < 0.008) {
        createLightningBolt();
        lightningLight.intensity = 1; // ✅ Era 10, agora 3
        lastLightningTime = currentTime;
        setTimeout(() => { lightningLight.intensity = 0; }, 50);
        setTimeout(() => { playSound('thunder'); }, 800 + Math.random() * 2000);
    }

    // ===== OCEANO COM ONDAS GIGANTES (CORRIGIDO!) =====
    if (sea) {
        const time = Date.now() * 0.001;
        const vertices = sea.geometry.attributes.position.array;
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];      // posição X
            const y = vertices[i + 1];  // posição Y (horizontal no plano)
            
            // ONDAS GIGANTES movendo o eixo Z (altura) - IGUAL AO ORIGINAL!
            vertices[i + 2] = Math.sin(x * 0.03 + time * 2) * 5 + 
                             Math.cos(y * 0.04 + time * 1.5) * 4 +
                             Math.sin((x + y) * 0.02 + time * 0.8) * 3 +
                             Math.cos(x * 0.08 + time * 3) * 2;
        }
        
        sea.geometry.attributes.position.needsUpdate = true;
        sea.geometry.computeVertexNormals();
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

// ===== INICIAR JOGO =====
init();