// ===========================
// PATCH VISUAL CINEMATOGRÁFICO - THEDEEP
// Cole este código SUBSTITUINDO as funções correspondentes no script.js original
// ===========================

// ===== SUBSTITUIR: function createIsland() =====
function createIsland() {
    // Ilha principal MUITO MAIOR - rocha escura como na imagem
    const islandGeo = new THREE.CylinderGeometry(85, 95, 25, 32);
    const islandMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 1.0,
        metalness: 0.0
    });
    island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -7.5;
    island.receiveShadow = true;
    island.castShadow = true;
    scene.add(island);

    // Rochas GIGANTES formando a ilha rochosa
    const rockPositions = [
        { angle: 0, dist: 90, size: [15, 25, 18], height: 5 },
        { angle: Math.PI / 3, dist: 95, size: [20, 30, 15], height: 8 },
        { angle: Math.PI * 2 / 3, dist: 88, size: [18, 28, 20], height: 6 },
        { angle: Math.PI, dist: 92, size: [22, 35, 17], height: 10 },
        { angle: Math.PI * 4 / 3, dist: 87, size: [16, 27, 19], height: 7 },
        { angle: Math.PI * 5 / 3, dist: 94, size: [19, 32, 16], height: 9 }
    ];

    rockPositions.forEach(pos => {
        const rockGeo = new THREE.BoxGeometry(...pos.size);
        const rockMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.95 
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(
            Math.cos(pos.angle) * pos.dist,
            pos.height,
            Math.sin(pos.angle) * pos.dist
        );
        rock.rotation.set(
            Math.random() * 0.3,
            Math.random() * Math.PI * 2,
            Math.random() * 0.3
        );
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
    });

    // Rochas menores espalhadas
    for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 70 + Math.random() * 25;
        const rockGeo = new THREE.DodecahedronGeometry(3 + Math.random() * 6);
        const rockMat = new THREE.MeshStandardMaterial({ 
            color: 0x3a3a3a,
            roughness: 0.9 
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(
            Math.cos(angle) * distance,
            -3 + Math.random() * 4,
            Math.sin(angle) * distance
        );
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
    }
}

// ===== SUBSTITUIR: function createShipwreck() =====
function createShipwreck() {
    const shipGroup = new THREE.Group();
    
    // Casco do navio (MAIOR e mais destruído)
    const hullGeo = new THREE.BoxGeometry(28, 12, 55);
    const hullMat = new THREE.MeshStandardMaterial({ 
        color: 0x2a1506,
        roughness: 0.95 
    });
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
            color: 0xaaaaaa, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
            roughness: 0.9
        });
        const sail = new THREE.Mesh(sailGeo, sailMat);
        sail.position.set(
            Math.random() * 10 - 5,
            10 + i * 5,
            -8 + i * 8
        );
        sail.rotation.set(
            Math.random() * 0.5,
            Math.random() * 1,
            Math.random() * 0.3
        );
        shipGroup.add(sail);
    }
    
    // Deck (tábuas quebradas)
    for (let i = 0; i < 8; i++) {
        const plankGeo = new THREE.BoxGeometry(24, 0.8, 4);
        const plankMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a2a1a,
            roughness: 0.9 
        });
        const plank = new THREE.Mesh(plankGeo, plankMat);
        plank.position.set(
            Math.random() * 4 - 2,
            6,
            -20 + i * 5
        );
        plank.rotation.y = Math.random() * 0.3;
        plank.receiveShadow = true;
        shipGroup.add(plank);
    }
    
    // Destroços ao redor
    for (let i = 0; i < 15; i++) {
        const debrisGeo = new THREE.BoxGeometry(
            2 + Math.random() * 3,
            0.5 + Math.random(),
            2 + Math.random() * 4
        );
        const debris = new THREE.Mesh(debrisGeo, hullMat);
        debris.position.set(
            Math.random() * 30 - 15,
            -2 + Math.random() * 2,
            Math.random() * 40 - 20
        );
        debris.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        debris.castShadow = true;
        shipGroup.add(debris);
    }
    
    // Posicionar o navio DESTRUÍDO na ilha rochosa
    shipGroup.position.set(-75, -2, 45);
    shipGroup.rotation.y = Math.PI / 3;
    scene.add(shipGroup);
}

// ===== SUBSTITUIR: function createSea() =====
function createSea() {
    const seaGeo = new THREE.PlaneGeometry(2000, 2000, 200, 200);
    
    // Armazenar posições para ondas
    const positions = seaGeo.attributes.position.array;
    seaGeo.userData.originalPositions = new Float32Array(positions);
    
    const seaMat = new THREE.MeshStandardMaterial({
        color: 0x001233,
        roughness: 0.4,
        metalness: 0.6,
        transparent: true,
        opacity: 0.95
    });
    
    sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -10;
    sea.receiveShadow = true;
    scene.add(sea);
}

// ===== SUBSTITUIR: function createWeather() =====
function createWeather() {
    // CHUVA INTENSA
    const rainCount = 30000;
    const rainGeo = new THREE.BufferGeometry();
    const rainVertices = [];
    for (let i = 0; i < rainCount; i++) {
        rainVertices.push(
            Math.random() * 800 - 400,
            Math.random() * 180,
            Math.random() * 800 - 400
        );
    }
    rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(rainVertices, 3));
    const rainMaterial = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 0.5,
        transparent: true,
        opacity: 0.8
    });
    rain = new THREE.Points(rainGeo, rainMaterial);
    scene.add(rain);
    
    // Luz dos raios (colorida)
    lightningLight = new THREE.PointLight(0xaaddff, 0, ARENA_SIZE * 3);
    lightningLight.position.set(0, 180, 0);
    scene.add(lightningLight);
    
    // NUVENS TEMPESTUOSAS GIGANTES
    for (let i = 0; i < 40; i++) {
        const cloudGeo = new THREE.SphereGeometry(70 + Math.random() * 50, 10, 10);
        const cloudMat = new THREE.MeshBasicMaterial({
            color: 0x222222,
            transparent: true,
            opacity: 0.85,
            fog: false
        });
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set(
            (Math.random() - 0.5) * 1000,
            140 + Math.random() * 80,
            (Math.random() - 0.5) * 1000
        );
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
            color: 0x0a0a0a,
            transparent: true,
            opacity: 0.55,
            side: THREE.DoubleSide,
            roughness: 0.9,
            metalness: 0.1
        });
        const tornado = new THREE.Mesh(tornadoGeo, tornadoMat);
        const angle = (i / 4) * Math.PI * 2;
        const dist = ARENA_SIZE * 0.85;
        tornado.rotation.x = Math.PI;
        tornado.position.set(
            Math.cos(angle) * dist,
            -5 + tornadoHeight / 2,
            Math.sin(angle) * dist
        );
        tornado.castShadow = true;
        tornado.userData.baseX = tornado.position.x;
        tornado.userData.baseZ = tornado.position.z;
        tornado.userData.phase = Math.random() * Math.PI * 2;
        scene.add(tornado);
        tornadoes.push(tornado);
    }
}

// ===== SUBSTITUIR: function createLightningBolt() =====
function createLightningBolt() {
    if (currentBolt) {
        scene.remove(currentBolt);
    }

    // Cor aleatória entre azul, amarelo e branco
    const lightningColors = [
        0x00ddff, // Azul elétrico
        0xffff00, // Amarelo
        0xffffff, // Branco
        0x88ffff, // Azul claro
        0xffffaa  // Amarelo claro
    ];
    const boltColor = lightningColors[Math.floor(Math.random() * lightningColors.length)];
    
    const boltMaterial = new THREE.MeshBasicMaterial({ color: boltColor });
    const boltGroup = new THREE.Group();

    let startPoint = new THREE.Vector3(
        (Math.random() - 0.5) * 400,
        160,
        (Math.random() - 0.5) * 400
    );

    let endPoint = new THREE.Vector3();
    let direction = new THREE.Vector3();
    
    // Raio mais longo e ramificado
    for (let i = 0; i < 12; i++) {
        direction.set(
            (Math.random() - 0.5) * 30,
            -18 - Math.random() * 15,
            (Math.random() - 0.5) * 30
        );
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

    // Luz do raio com cor correspondente
    lightningLight.color.setHex(boltColor);
    lightningLight.intensity = 8;
    lightningLight.position.copy(startPoint);

    setTimeout(() => {
        lightningLight.intensity = 0;
    }, 100);

    setTimeout(() => {
        if (currentBolt === boltGroup) {
            scene.remove(boltGroup);
            currentBolt = null;
        }
    }, 200 + Math.random() * 200);
}

// ===== SUBSTITUIR: function createLighthouse() =====
function createLighthouse() {
    TOWER_POS.set(0, 0, 0);

    // Base do farol
    const baseGeo = new THREE.CylinderGeometry(LIGHTHOUSE_RADIUS_BASE, LIGHTHOUSE_RADIUS_BASE + 2, 10, 32);
    const baseMat = new THREE.MeshStandardMaterial({ 
        color: 0xdddddd,
        roughness: 0.7 
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.copy(TOWER_POS);
    base.position.y = 5;
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);

    // Torre principal
    const towerGeo = new THREE.CylinderGeometry(LIGHTHOUSE_RADIUS_TOP, LIGHTHOUSE_RADIUS_BASE, LIGHTHOUSE_HEIGHT, 32);
    const towerMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.6
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.copy(TOWER_POS);
    tower.position.y = LIGHTHOUSE_HEIGHT / 2 + 10;
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    // Faixas vermelhas
    const numStripes = 5;
    const stripeHeight = LIGHTHOUSE_HEIGHT / numStripes;
    for (let i = 0; i < numStripes; i++) {
        if (i % 2 === 1) {
            const stripeGeo = new THREE.CylinderGeometry(
                LIGHTHOUSE_RADIUS_BASE - (i * 1),
                LIGHTHOUSE_RADIUS_BASE - ((i + 1) * 1),
                stripeHeight,
                32
            );
            const stripeMat = new THREE.MeshStandardMaterial({ 
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.3,
                roughness: 0.5
            });
            const stripe = new THREE.Mesh(stripeGeo, stripeMat);
            stripe.position.copy(TOWER_POS);
            stripe.position.y = 10 + stripeHeight * i + stripeHeight / 2;
            stripe.castShadow = true;
            scene.add(stripe);
        }
    }

    // Escada funcional
    const stairCount = 75;
    const stairHeight = LIGHTHOUSE_HEIGHT / stairCount;
    const anglePerStep = (Math.PI * 3) / stairCount;
    
    stairSteps = [];
    stairWaypoints = [];
    
    for (let i = 0; i < stairCount; i++) {
        const stepGeo = new THREE.BoxGeometry(4, 0.8, 2);
        const stepMat = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            roughness: 0.8 
        });
        const step = new THREE.Mesh(stepGeo, stepMat);
        
        const angle = anglePerStep * i;
        const radius = LIGHTHOUSE_RADIUS_BASE - 4;
        
        step.position.set(
            Math.cos(angle) * radius,
            stairHeight * i,
            Math.sin(angle) * radius
        );
        step.rotation.y = angle;
        step.castShadow = true;
        step.receiveShadow = true;
        
        scene.add(step);
        stairSteps.push(step);
        
        stairWaypoints.push({
            position: new THREE.Vector3(
                Math.cos(angle) * radius,
                stairHeight * i + 1,
                Math.sin(angle) * radius
            ),
            angle: angle
        });
    }
    
    // Corrimão
    const railGeo = new THREE.TorusGeometry(LIGHTHOUSE_RADIUS_BASE - 2, 0.3, 8, 100);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
    for (let i = 0; i < 8; i++) {
        const rail = new THREE.Mesh(railGeo, railMat);
        rail.position.y = i * 18;
        rail.rotation.x = Math.PI / 2;
        scene.add(rail);
    }

    // Topo do farol
    towerTopY = LIGHTHOUSE_HEIGHT + 10;
    const topGeo = new THREE.CylinderGeometry(LIGHTHOUSE_RADIUS_TOP + 2, LIGHTHOUSE_RADIUS_TOP, 5, 32);
    const topMat = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.3
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.copy(TOWER_POS);
    top.position.y = towerTopY;
    top.castShadow = true;
    scene.add(top);

    // ===== SISTEMA DE LUZ CINEMATOGRÁFICO =====
    beaconPivot = new THREE.Object3D();
    beaconPivot.position.set(TOWER_POS.x, towerTopY + 3, TOWER_POS.z);
    scene.add(beaconPivot);

    // Luz principal SUPER POTENTE
    const beamLight = new THREE.SpotLight(0xffffaa, 12, 600, Math.PI / 5, 0.2, 1.5);
    beamLight.position.set(0, 0, 0);
    beamLight.castShadow = true;
    beamLight.shadow.mapSize.width = 4096;
    beamLight.shadow.mapSize.height = 4096;
    beamLight.shadow.camera.near = 0.5;
    beamLight.shadow.camera.far = 600;
    beaconPivot.add(beamLight);

    // FEIXE VOLUMÉTRICO GIGANTE E VISÍVEL
    const beamGeometry = new THREE.CylinderGeometry(2, 80, 500, 32, 1, true);
    const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffdd,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    volumetricBeam = new THREE.Mesh(beamGeometry, beamMaterial);
    volumetricBeam.position.set(0, -250, 0);
    volumetricBeam.rotation.x = Math.PI;
    beaconPivot.add(volumetricBeam);

    // Luz pontual intensa no topo
    const topLight = new THREE.PointLight(0xffffaa, 8, 200);
    topLight.position.set(TOWER_POS.x, towerTopY + 5, TOWER_POS.z);
    scene.add(topLight);

    // Chão interno
    const floorGeo = new THREE.CircleGeometry(LIGHTHOUSE_RADIUS_BASE - 1, 32);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x8b4513,
        roughness: 0.8 
    });
    lighthouseFloor = new THREE.Mesh(floorGeo, floorMat);
    lighthouseFloor.rotation.x = -Math.PI / 2;
    lighthouseFloor.position.set(TOWER_POS.x, 0.1, TOWER_POS.z);
    lighthouseFloor.receiveShadow = true;
    scene.add(lighthouseFloor);
}

// ADICIONAR esta variável no topo do script (se não existir):
// let volumetricBeam = null;

console.log("✅ Patch Visual Cinematográfico aplicado com sucesso!");
console.log("🌊 Ondas realistas ativadas");
console.log("⚡ Raios coloridos (azul/amarelo/branco) ativados");
console.log("🌪️ Furacões gigantes ativados");
console.log("💡 Feixe de luz do farol aprimorado");
console.log("🏔️ Ilha rochosa grande criada");
console.log("⛵ Navio à vela destruído adicionado");
