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

// ===== VARIÁVEIS DE FÍSICA E JOGO =====
let vY = 0;
const GRAVITY = -0.025;
const JUMP_FORCE = 3;
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

// ===== SISTEMA DE CANHÕES =====
let placedCannons = [];
let buildMode = false;
let removeMode = false;
let ghostCannon = null;
let selectedCannonIndex = 0;

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
const keys = {};
const PLAYER_SPEED = 0.3, ARENA_SIZE = 250;
let gamePaused = false;

// ===== ESCADA DO FAROL =====
let onStairs = false;
let currentStairIndex = -1;
let lastStairMove = 0;

// ===== INICIALIZAÇÃO =====
async function init() {
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

    if (isMobile) setupMobileControls();

    updateUI();
    startWave();
    animate();
    
    console.log("✅ TheDeep inicializado com patch visual cinematográfico!");
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
        createPalmTree(pos.x, 0, pos.z);
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

// ===== OCEANO (PATCH VISUAL) =====
function createSea() {
    const seaGeo = new THREE.PlaneGeometry(2000, 2000, 150, 150);
    const seaMat = new THREE.MeshStandardMaterial({
        color: 0x006994,
        roughness: 0.3,
        metalness: 0.6,
        transparent: true,
        opacity: 0.9
    });
    
    sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -8;
    sea.receiveShadow = true;
    scene.add(sea);
}

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
    
    // NUVENS TEMPESTUOSAS GIGANTES
    for (let i = 0; i < 40; i++) {
        const cloudGeo = new THREE.SphereGeometry(70 + Math.random() * 50, 10, 10);
        const cloudMat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.85, fog: false });
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set((Math.random() - 0.5) * 1000, 140 + Math.random() * 2000, (Math.random() - 0.5) * 1000);
        cloud.scale.set(2.5, 0.7, 2.5);
        clouds.push(cloud);
        scene.add(cloud);
    }
    
    // FURACÕES GIGANTES CINEMATOGRÁFICOS
    for (let i = 0; i < 4; i++) {
        const tornadoHeight = 280;
        const tornadoRadius = 45;
        const tornadoGeo = new THREE.ConeGeometry(tornadoRadius, tornadoHeight, 64, 120, true);
        const tornadoMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, roughness: 0.9, metalness: 0.1
        });
        const tornado = new THREE.Mesh(tornadoGeo, tornadoMat);
        const angle = (i / 4) * Math.PI * 2;
        const dist = ARENA_SIZE * 0.85;
        tornado.rotation.x = Math.PI;
        tornado.position.set(Math.cos(angle) * dist, -5 + tornadoHeight / 2, Math.sin(angle) * dist);
        tornado.castShadow = true;
        tornado.userData.baseX = tornado.position.x;
        tornado.userData.baseZ = tornado.position.z;
        tornado.userData.phase = Math.random() * Math.PI * 2;
        scene.add(tornado);
        tornadoes.push(tornado);
    }
}

// ===== RAIOS (PATCH VISUAL) =====
function createLightningBolt() {
    if (currentBolt) scene.remove(currentBolt);

    const lightningColors = [0x00ddff, 0xffff00, 0xffffff, 0x88ffff, 0xffffaa];
    const boltColor = lightningColors[Math.floor(Math.random() * lightningColors.length)];
    
    const boltMaterial = new THREE.MeshBasicMaterial({ color: boltColor });
    const boltGroup = new THREE.Group();

    let startPoint = new THREE.Vector3((Math.random() - 0.5) * 400, 160, (Math.random() - 0.5) * 400);
    let endPoint = new THREE.Vector3();
    let direction = new THREE.Vector3();
    
    for (let i = 0; i < 12; i++) {
        direction.set((Math.random() - 0.5) * 30, -18 - Math.random() * 15, (Math.random() - 0.5) * 30);
        endPoint.copy(startPoint).add(direction);

        const segmentGeo = new THREE.CylinderGeometry(0.4, 0.4, direction.length(), 6);
        const segment = new THREE.Mesh(segmentGeo, boltMaterial);
        segment.position.copy(startPoint).add(direction.clone().multiplyScalar(0.5));
        segment.lookAt(endPoint);
        segment.rotateX(Math.PI / 2);
        boltGroup.add(segment);

        startPoint.copy(endPoint);
    }

    scene.add(boltGroup);
    currentBolt = boltGroup;

    lightningLight.color.setHex(boltColor);
    lightningLight.intensity = 8;
    lightningLight.position.copy(startPoint);

    setTimeout(() => { lightningLight.intensity = 0; }, 100);
    setTimeout(() => { if (currentBolt === boltGroup) { scene.remove(boltGroup); currentBolt = null; } }, 200 + Math.random() * 200);
}

// ===== FAROL (PATCH VISUAL CORRIGIDO) =====
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
    const doorGeo = new THREE.BoxGeometry(8, 7, 4);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 3.5, -LIGHTHOUSE_RADIUS_BASE + 2);
    scene.add(door);

    // ===== TORRE PRINCIPAL (CINZA CLARO) =====
    const towerGeo = new THREE.CylinderGeometry(LIGHTHOUSE_RADIUS_TOP, LIGHTHOUSE_RADIUS_BASE, LIGHTHOUSE_HEIGHT, 64);
    const towerMat = new THREE.MeshStandardMaterial({ 
        color: 0x888888,  // Cinza mais claro para contrastar com as faixas
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
    const totalStripeHeight = LIGHTHOUSE_HEIGHT * 0.7; // 70% da altura tem faixas
    const stripeHeight = totalStripeHeight / numRedStripes;
    const startY = 15; // Começa um pouco acima da base

    for (let i = 0; i < numRedStripes; i++) {
        const y = startY + (i * stripeHeight * 1.2); // Espaço entre faixas
        
        const stripeGeo = new THREE.CylinderGeometry(
            LIGHTHOUSE_RADIUS_BASE + 0.1, // Levemente maior que a torre
            LIGHTHOUSE_RADIUS_BASE + 0.1, 
            stripeHeight, 
            64
        );
        const stripeMat = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,     // Vermelho vibrante
            roughness: 0.6,
            metalness: 0.2
        });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = y;
        stripe.castShadow = true;
        stripe.receiveShadow = true;
        scene.add(stripe);
    }

    // ===== TOPO REALISTA =====
    towerTopY = LIGHTHOUSE_HEIGHT + 10;

    // Plataforma onde você anda (MAIOR e mais visível)
    const platformGeo = new THREE.CylinderGeometry(LIGHTHOUSE_RADIUS_TOP + 8, LIGHTHOUSE_RADIUS_TOP + 8, 3, 64);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = towerTopY + 1.5;
    platform.receiveShadow = true;
    scene.add(platform);
    lighthousePlatform = platform;

    // Lanterna (parte de vidro e metal)
    const lanternBaseGeo = new THREE.CylinderGeometry(LIGHTHOUSE_RADIUS_TOP + 4, LIGHTHOUSE_RADIUS_TOP + 6, 8, 64);
    const lanternBaseMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
    const lanternBase = new THREE.Mesh(lanternBaseGeo, lanternBaseMat);
    lanternBase.position.y = towerTopY + 6;
    scene.add(lanternBase);

    // Vidro da lanterna (transparente)
    const glassGeo = new THREE.CylinderGeometry(LIGHTHOUSE_RADIUS_TOP + 3.8, LIGHTHOUSE_RADIUS_TOP + 3.8, 7, 32);
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        transmission: 0.9,
        roughness: 0,
        metalness: 0.1
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.y = towerTopY + 6;
    scene.add(glass);

    // Cúpula vermelha do topo
    const domeGeo = new THREE.SphereGeometry(LIGHTHOUSE_RADIUS_TOP + 5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.7, roughness: 0.2 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = towerTopY + 11;
    scene.add(dome);

    // Grade de proteção (balaustrada)
    const railGeo = new THREE.TorusGeometry(LIGHTHOUSE_RADIUS_TOP + 8.5, 0.3, 8, 64);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.y = towerTopY + 3;
    rail.rotation.x = Math.PI / 2;
    scene.add(rail);

    // Colunas da grade
    for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 3, 8),
            railMat
        );
        post.position.x = Math.cos(angle) * (LIGHTHOUSE_RADIUS_TOP + 8.5);
        post.position.z = Math.sin(angle) * (LIGHTHOUSE_RADIUS_TOP + 8.5);
        post.position.y = towerTopY + 2.5;
        scene.add(post);
    }

    // ===== LUZ DO FAROL =====
    beaconPivot = new THREE.Object3D();
    beaconPivot.position.set(0, towerTopY + 6, 0);
    scene.add(beaconPivot);

    const beamLight = new THREE.SpotLight(0xffffaa, 20, 600, Math.PI / 8, 0.3, 1);
    beamLight.position.set(0, 0, 0);
    beamLight.castShadow = true;
    beamLight.shadow.mapSize.width = 2048;
    beamLight.shadow.mapSize.height = 2048;
    beaconPivot.add(beamLight);

    // Feixe volumétrico visível
    const beamLength = 500;
    const beamGeo = new THREE.CylinderGeometry(3, 30, beamLength, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
        color: 0xffffaa,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    volumetricBeam = new THREE.Mesh(beamGeo, beamMat);
    volumetricBeam.position.z = -beamLength / 2;
    volumetricBeam.rotation.x = Math.PI / 2;
    beaconPivot.add(volumetricBeam);

    // Lâmpada central
    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffaa, emissive: 0xffffaa })
    );
    beaconPivot.add(bulb);

    // ===== ESCADA INTERNA =====
    createLighthouseStairs();

    // Chão interno
    const floorGeo = new THREE.CircleGeometry(LIGHTHOUSE_RADIUS_BASE - 1, 64);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 });
    lighthouseFloor = new THREE.Mesh(floorGeo, floorMat);
    lighthouseFloor.rotation.x = -Math.PI / 2;
    lighthouseFloor.position.y = 0.1;
    lighthouseFloor.receiveShadow = true;
    scene.add(lighthouseFloor);
}

// ===== ESCADA DO FAROL (FUNÇÃO NOVA) =====
function createLighthouseStairs() {
    const stairCount = 80;
    const stairHeight = LIGHTHOUSE_HEIGHT / stairCount;
    const innerRadius = LIGHTHOUSE_RADIUS_BASE - 3;
    
    stairWaypoints = [];
    stairSteps = [];

    for (let i = 0; i < stairCount; i++) {
        const angle = (i / stairCount) * Math.PI * 8; // 4 voltas completas
        const radius = innerRadius - 1;
        
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = 2 + (i * stairHeight);

        // Degrau individual
        const stepGeo = new THREE.BoxGeometry(2, 0.2, 1);
        const stepMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const step = new THREE.Mesh(stepGeo, stepMat);
        step.position.set(x, y, z);
        step.rotation.y = angle + Math.PI / 2;
        step.castShadow = true;
        step.receiveShadow = true;
        
        scene.add(step);
        stairSteps.push(step);

        // Waypoint para navegação
        const waypoint = {
            position: new THREE.Vector3(x, y + PLAYER_EYE, z),
            angle: angle
        };
        stairWaypoints.push(waypoint);
    }

    console.log(`✅ Escada criada com ${stairCount} degraus e ${stairWaypoints.length} waypoints`);
}

// ===== JOGADOR =====
function createPlayer() {
    player = new THREE.Group();
    player.position.set(0, PLAYER_EYE, 40);
    scene.add(player);
    player.add(camera);
    camera.position.set(0, 0, 0);
}

// ===== CONTROLES =====
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
        if (e.key.toLowerCase() === 'e') toggleShop();
        if (e.key.toLowerCase() === 'p') togglePause();
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

    document.getElementById('restartButton').addEventListener('click', restartGame);

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

// NOVA FUNÇÃO: recria o ghost cannon sem dar erro
function updateGhostCannon() {
    if (!buildMode) return;

    if (ghostCannon) {
        scene.remove(ghostCannon);
        ghostCannon = null;
    }

    const type = cannonTypes[selectedCannonIndex];
    if (!type) return;

    // Cria ghost (mesmo que não tenha ouro suficiente)
    ghostCannon = createCannonMesh(type, true); // true = ghost
    ghostCannon.material.transparent = true;
    ghostCannon.material.opacity = type.owned && gold >= type.cost ? 0.6 : 0.3;
    ghostCannon.material.emissive = type.owned && gold >= type.cost 
        ? new THREE.Color(0x00ff00) 
        : new THREE.Color(0xff0000);
    ghostCannon.material.emissiveIntensity = 0.5;
    scene.add(ghostCannon);
}

// Função auxiliar para criar mesh do canhão
function createCannonMesh(type, isGhost = false) {
    const cannonGeo = new THREE.CylinderGeometry(1, 1.5, 3, 8);
    const cannonMat = new THREE.MeshBasicMaterial({ 
        color: type.color, 
        transparent: isGhost, 
        opacity: isGhost ? 0.5 : 1.0,
        wireframe: isGhost
    });
    return new THREE.Mesh(cannonGeo, cannonMat);
}

// ===== MODO CONSTRUÇÃO =====
function toggleBuildMode() {
    removeMode = false;
    buildMode = !buildMode;
    const indicator = document.getElementById('buildModeIndicator');
    if (buildMode) {
        indicator.style.display = 'block';
        indicator.innerHTML = '🔨 MODO CONSTRUÇÃO<div style="font-size: 16px; margin-top: 10px;">🖱️ Clique para colocar canhão</div>';
        document.body.style.cursor = 'crosshair';
        updateGhostCannon();
    } else {
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
        indicator.style.display = 'block';
        indicator.style.background = 'rgba(255, 0, 0, 0.15)';
        indicator.style.borderColor = '#ff0000';
        indicator.style.color = '#ff0000';
        indicator.innerHTML = '🗑️ MODO REMOÇÃO<div style="font-size: 16px; margin-top: 10px;">🖱️ Clique em um canhão para remover</div>';
        document.body.style.cursor = 'not-allowed';
    } else {
        indicator.style.display = 'none';
        indicator.style.background = 'rgba(0, 255, 0, 0.15)';
        indicator.style.borderColor = '#00ff00';
        indicator.style.color = '#00ff00';
        document.body.style.cursor = 'default';
    }
}

function placeCannon() {
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
        if (ghostCannon) { scene.remove(ghostCannon); updateGhostCannon(); }
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
    const cannon = new THREE.Group();
    cannon.position.copy(position);
    cannon.position.y = 0.5;
    const baseGeo = new THREE.CylinderGeometry(1, 1.2, 0.5, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.5 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.castShadow = true;
    base.receiveShadow = true;
    cannon.add(base);
    const cannonGeo = new THREE.CylinderGeometry(0.35, 0.5, 2, 8);
    const cannonMat = new THREE.MeshStandardMaterial({ color: type.color, metalness: 0.7, roughness: 0.3 });
    const cannonMesh = new THREE.Mesh(cannonGeo, cannonMat);
    cannonMesh.rotation.z = Math.PI / 2;
    cannonMesh.position.y = 0.5;
    cannonMesh.castShadow = true;
    cannon.add(cannonMesh);
    cannon.userData = { type: typeIndex, lastShot: 0, target: null, cannonMesh, damage: type.damage, fireRate: type.fireRate, range: type.range, projectileSpeed: type.projectileSpeed, color: type.color, upgradeLevel: 0 };
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
    shopOpen = !shopOpen;
    const shop = document.getElementById('shop');
    if (shopOpen) { shop.style.display = 'block'; updateShop(); document.exitPointerLock(); }
    else { shop.style.display = 'none'; renderer.domElement.requestPointerLock(); }
}

function togglePause() { gamePaused = !gamePaused; document.getElementById('pauseMessage').style.display = gamePaused ? 'block' : 'none'; }

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
    const cannonData = cannon.userData;
    const projectile = new THREE.Mesh(new THREE.SphereGeometry(0.4), new THREE.MeshBasicMaterial({ color: cannonData.color }));
    projectile.position.copy(cannon.position);
    projectile.position.y += 2;
    const dx = target.position.x - projectile.position.x;
    const dz = target.position.z - projectile.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    projectile.userData = { vx: (dx / dist) * cannonData.projectileSpeed, vz: (dz / dist) * cannonData.projectileSpeed, damage: cannonData.damage, lifetime: 200, fromCannon: true };
    scene.add(projectile);
    projectiles.push(projectile);
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
    // Percorre de trás pra frente pra poder remover sem pular inimigos
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Segurança (caso o inimigo tenha sido removido em outro lugar)
        if (!enemy || !enemy.position) continue;

        const dx = player.position.x - enemy.position.x;
        const dz = player.position.z - enemy.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 3) {  // Dá um espacinho pra não ficar colado em você
            const speed = enemy.userData.speed * 1.5;  // 50% mais rápido atrás do player
            enemy.position.x += (dx / dist) * speed;
            enemy.position.z += (dz / dist) * speed;

            // Faz o inimigo olhar pra você (opcional, mas fica mais foda)
            enemy.rotation.y = Math.atan2(dx, dz);
        } else {
            // TOCOU EM VOCÊ → DANO NO FAROL (não no player!)
            damageLighthouse(enemy.userData.damage || 10);

            // Efeitos visuais/som (se quiser colocar depois)
            // createBloodEffect(enemy.position);
            // playSound('hit');

            // Remove o inimigo da cena e da array
            scene.remove(enemy);
            enemies.splice(i, 1);  // splice é mais seguro que filter aqui

            // Dá ouro por matar (opcional)
            addGold(enemy.userData.gold || 5);
        }

        // Animação do inimigo (se tiver tentacles, olhos, etc.)
        if (enemy.userData.animTime !== undefined) {
            enemy.userData.animTime += 0.05;
            // exemplo: enemy.scale.y = 1 + Math.sin(enemy.userData.animTime) * 0.05;
        }
    }
}

function addGold(amount) {
    gold += amount;
    updateUI();
}

function damageLighthouse(damage) { lighthouseHP -= damage; if (lighthouseHP < 0) lighthouseHP = 0; updateLighthouseHP(); if (lighthouseHP <= 0) gameOver(); }

function updateLighthouseHP() {
    document.getElementById('lighthouseHP').textContent = Math.floor(lighthouseHP);
    const hpBar = document.getElementById('lighthouseHPBar');
    const percent = (lighthouseHP / lighthouseMaxHP) * 100;
    hpBar.style.width = percent + '%';
    hpBar.style.background = percent > 50 ? 'linear-gradient(90deg, #00ff00, #00cc00)' : percent > 25 ? 'linear-gradient(90deg, #ffff00, #ffaa00)' : 'linear-gradient(90deg, #ff0000, #cc0000)';
}

// ===== PROJÉTEIS =====
function updateProjectiles() {
    projectiles = projectiles.filter(proj => {
        proj.position.x += proj.userData.vx;
        proj.position.z += proj.userData.vz;
        proj.userData.lifetime--;
        if (proj.userData.lifetime <= 0) { scene.remove(proj); return false; }
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const dx = enemy.position.x - proj.position.x;
            const dz = enemy.position.z - proj.position.z;
            if (Math.sqrt(dx * dx + dz * dz) < 2) {
                enemy.userData.hp -= proj.userData.damage;
                if (enemy.userData.hp <= 0) { kills++; gold += enemy.userData.gold; scene.remove(enemy); enemies.splice(i, 1); updateUI(); }
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
    document.getElementById('cannonName').textContent = '💣 ' + cannonTypes[selectedCannonIndex].name;
}

// ===== GAME OVER =====
function gameOver() {
    gameActive = false;
    document.getElementById('finalWave').textContent = wave;
    document.getElementById('finalKills').textContent = kills;
    document.getElementById('gameOver').style.display = 'block';
}

function restartGame() { location.reload(); }

// ===== MOVIMENTO DO JOGADOR (CORRIGIDO) =====
function updatePlayer() {
    const distToCenter = Math.sqrt(player.position.x ** 2 + player.position.z ** 2);
    
    // Detecção melhorada da escada
    const nearStairs = distToCenter > (LIGHTHOUSE_RADIUS_BASE - 8) && 
                      distToCenter < (LIGHTHOUSE_RADIUS_BASE + 2) && 
                      player.position.y < LIGHTHOUSE_HEIGHT + 10 &&
                      player.position.y > 0;

    if (nearStairs && !onStairs) {
        let closestStair = -1;
        let closestDist = 8; // Distância máxima para entrar na escada
        
        stairWaypoints.forEach((waypoint, index) => {
            const dx = waypoint.position.x - player.position.x;
            const dy = waypoint.position.y - player.position.y;
            const dz = waypoint.position.z - player.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (dist < closestDist) {
                closestDist = dist;
                closestStair = index;
            }
        });
        
        if (closestStair !== -1) {
            onStairs = true;
            currentStairIndex = closestStair;
            console.log(`🎯 Entrou na escada no degrau ${currentStairIndex}`);
        }
    }

    if (onStairs) {
        const now = Date.now();
        const moveDelay = 150; // Mais rápido
        
        // Subir (W)
        if (keys['w'] && currentStairIndex < stairWaypoints.length - 1 && now - lastStairMove > moveDelay) {
            currentStairIndex++;
            player.position.copy(stairWaypoints[currentStairIndex].position);
            player.rotation.y = stairWaypoints[currentStairIndex].angle + Math.PI;
            lastStairMove = now;
            console.log(`⬆️ Subiu para degrau ${currentStairIndex}`);
        }
        
        // Descer (S)
        if (keys['s'] && currentStairIndex > 0 && now - lastStairMove > moveDelay) {
            currentStairIndex--;
            player.position.copy(stairWaypoints[currentStairIndex].position);
            player.rotation.y = stairWaypoints[currentStairIndex].angle + Math.PI;
            lastStairMove = now;
            console.log(`⬇️ Desceu para degrau ${currentStairIndex}`);
        }

        // Sair da escada (ESPAÇO, A, D, SHIFT, ou se saiu da área)
        const currentWaypoint = stairWaypoints[currentStairIndex];
        const currentDist = Math.sqrt(
            (player.position.x - currentWaypoint.position.x) ** 2 +
            (player.position.z - currentWaypoint.position.z) ** 2
        );
        
        if (keys[' '] || keys['a'] || keys['d'] || keys['shift'] || currentDist > 5) {
            onStairs = false;
            currentStairIndex = -1;
            
            // Empurra o jogador para fora do farol
            const angle = Math.atan2(player.position.z, player.position.x);
            const pushDist = LIGHTHOUSE_RADIUS_BASE + 5;
            player.position.x = Math.cos(angle) * pushDist;
            player.position.z = Math.sin(angle) * pushDist;
            player.position.y = PLAYER_EYE;
            
            console.log("🚪 Saiu da escada");
        }
    } else {
        // Movimento normal no chão
        const speed = PLAYER_SPEED;
        if (keys['w']) { 
            player.position.x -= Math.sin(player.rotation.y) * speed; 
            player.position.z -= Math.cos(player.rotation.y) * speed; 
        }
        if (keys['s']) { 
            player.position.x += Math.sin(player.rotation.y) * speed; 
            player.position.z += Math.cos(player.rotation.y) * speed; 
        }
        if (keys['a']) { 
            player.position.x -= Math.cos(player.rotation.y) * speed; 
            player.position.z += Math.sin(player.rotation.y) * speed; 
        }
        if (keys['d']) { 
            player.position.x += Math.cos(player.rotation.y) * speed; 
            player.position.z -= Math.sin(player.rotation.y) * speed; 
        }
        
        // Limitar à área da ilha
        const dist = Math.sqrt(player.position.x ** 2 + player.position.z ** 2);
        if (dist > 95) { 
            const angle = Math.atan2(player.position.z, player.position.x); 
            player.position.x = Math.cos(angle) * 95; 
            player.position.z = Math.sin(angle) * 95; 
        }
        
        // Pulo e gravidade
        if (keys[' '] && player.position.y <= PLAYER_EYE + 0.1) vY = JUMP_FORCE;
        vY += GRAVITY;
        player.position.y += vY;
        if (player.position.y < PLAYER_EYE) { 
            player.position.y = PLAYER_EYE; 
            vY = 0; 
        }
    }

    // Atualizar ghost cannon no modo construção
    if (buildMode && ghostCannon) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects([island, lighthouseFloor]);
        if (intersects.length > 0) { 
            ghostCannon.position.copy(intersects[0].point); 
            ghostCannon.position.y = 0.5; 
        }
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

// ===== LOOP PRINCIPAL =====
function animate() {
    requestAnimationFrame(animate);

    if (!gameActive || gamePaused) return;

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
            lightningLight.intensity = 15;
            setTimeout(() => { lightningLight.intensity = 0; }, 180);
        }
    });

    // Relâmpagos aleatórios
    if (currentTime - lastLightningTime > 600 && Math.random() < 0.008) {
        createLightningBolt();
        lightningLight.intensity = 10;
        lastLightningTime = currentTime;
        setTimeout(() => { lightningLight.intensity = 0; }, 200);
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

// ========================================
// FUNÇÕES DE TESTE/DEBUG (do teste_visual.js)
// ========================================
function testarFarol() {
    console.log("\n💡 TESTE DO FAROL:");
    if (beaconPivot) {
        console.log("✅ beaconPivot existe");
        console.log("📍 Posição:", beaconPivot.position);
        console.log("🔄 Rotação Y:", beaconPivot.rotation.y.toFixed(2));
        console.log("👶 Filhos:", beaconPivot.children.length);
        beaconPivot.children.forEach((child, i) => {
            if (child.type === 'SpotLight') console.log(`  🔦 SpotLight (${i}) - Intensidade: ${child.intensity}`);
            if (child.type === 'Mesh') console.log(`  📐 Feixe volumétrico (${i}) - Opacidade: ${child.material.opacity}`);
        });
    } else console.log("❌ beaconPivot NÃO encontrado!");
}

function testarIlha() {
    console.log("\n🏔️ TESTE DA ILHA:");
    if (island) { console.log("✅ Ilha encontrada"); console.log("📍 Posição Y:", island.position.y); console.log("🎨 Cor:", island.material.color); }
    else console.log("❌ Ilha NÃO encontrada!");
}

function testarFuracoes() {
    console.log("\n🌪️ TESTE DOS FURACÕES:");
    if (tornadoes && tornadoes.length > 0) {
        console.log(`✅ ${tornadoes.length} furacões encontrados`);
        tornadoes.forEach((t, i) => console.log(`  Furacão ${i + 1}: Altura ${t.geometry.parameters.height}, Fase ${t.userData.phase.toFixed(2)}`));
    } else console.log("❌ Furacões NÃO encontrados!");
}

function testarTudo() {
    console.log("🚀 TESTES COMPLETOS\n========================");
    testarFarol(); testarIlha(); testarFuracoes();
    console.log("\n✅ Testes concluídos!");
}

function mostrarFarol() { if (beaconPivot) { player.position.set(0, towerTopY + 10, 0); camera.rotation.x = -Math.PI / 4; console.log("💡 Teleportado para o farol"); } }
function mostrarNavio() { player.position.set(-75, 20, 45); player.rotation.y = Math.PI / 3; console.log("⛵ Teleportado para o navio"); }
function forcaRaio() { createLightningBolt(); console.log("⚡ Raio forçado!"); }

console.log("🎮 TheDeep - Comandos de Debug disponíveis:");
console.log("  testarTudo(), testarFarol(), testarIlha(), testarFuracoes()");
console.log("  mostrarFarol(), mostrarNavio(), forcaRaio()");

// ===== INICIAR JOGO =====
init();