// =================================
// SCRIPT DE TESTE - ELEMENTOS VISUAIS
// Cole este código no console do navegador (F12) para testar elementos individualmente
// =================================

console.log("🎮 TheDeep - Teste de Elementos Visuais");
console.log("========================================");

// ===== TESTE 1: Verificar Farol =====
function testarFarol() {
    console.log("\n💡 TESTE DO FAROL:");
    
    if (beaconPivot) {
        console.log("✅ beaconPivot existe");
        console.log("📍 Posição:", beaconPivot.position);
        console.log("🔄 Rotação Y:", beaconPivot.rotation.y.toFixed(2));
        
        const children = beaconPivot.children;
        console.log("👶 Filhos:", children.length);
        
        children.forEach((child, i) => {
            if (child.type === 'SpotLight') {
                console.log(`  🔦 SpotLight encontrado (${i})`);
                console.log(`     - Intensidade: ${child.intensity}`);
                console.log(`     - Distância: ${child.distance}`);
                console.log(`     - Cor:`, child.color);
            }
            if (child.type === 'Mesh') {
                console.log(`  📐 Feixe volumétrico encontrado (${i})`);
                console.log(`     - Opacidade: ${child.material.opacity}`);
            }
        });
    } else {
        console.log("❌ beaconPivot NÃO encontrado!");
    }
    
    if (volumetricBeam) {
        console.log("✅ volumetricBeam existe");
    } else {
        console.log("⚠️ volumetricBeam não definido (pode estar dentro do beaconPivot)");
    }
}

// ===== TESTE 2: Verificar Ilha =====
function testarIlha() {
    console.log("\n🏔️ TESTE DA ILHA:");
    
    if (island) {
        console.log("✅ Ilha principal encontrada");
        console.log("📍 Posição Y:", island.position.y);
        console.log("📏 Geometria:", island.geometry.type);
        console.log("🎨 Cor:", island.material.color);
        
        const raio = island.geometry.parameters.radiusTop;
        console.log("⚪ Raio topo:", raio);
    } else {
        console.log("❌ Ilha NÃO encontrada!");
    }
    
    // Contar rochas
    let rochas = 0;
    scene.children.forEach(obj => {
        if (obj.geometry && 
            (obj.geometry.type === 'BoxGeometry' || 
             obj.geometry.type === 'DodecahedronGeometry')) {
            rochas++;
        }
    });
    console.log("🪨 Total de rochas na cena:", rochas);
}

// ===== TESTE 3: Verificar Navio =====
function testarNavio() {
    console.log("\n⛵ TESTE DO NAVIO:");
    
    let navioEncontrado = false;
    scene.children.forEach(obj => {
        if (obj.type === 'Group' && obj.children.length > 5) {
            // Provável grupo do navio
            const temMastro = obj.children.some(child => 
                child.geometry && child.geometry.type === 'CylinderGeometry'
            );
            const temCasco = obj.children.some(child => 
                child.geometry && child.geometry.type === 'BoxGeometry'
            );
            
            if (temMastro && temCasco) {
                navioEncontrado = true;
                console.log("✅ Navio encontrado!");
                console.log("📍 Posição:", obj.position);
                console.log("👶 Componentes:", obj.children.length);
                
                obj.children.forEach((child, i) => {
                    console.log(`  ${i}. ${child.geometry ? child.geometry.type : 'Sem geometria'}`);
                });
            }
        }
    });
    
    if (!navioEncontrado) {
        console.log("❌ Navio NÃO encontrado!");
        console.log("💡 Verifique se createShipwreck() foi chamado");
    }
}

// ===== TESTE 4: Verificar Oceano =====
function testarOceano() {
    console.log("\n🌊 TESTE DO OCEANO:");
    
    if (sea) {
        console.log("✅ Oceano encontrado");
        console.log("📍 Posição Y:", sea.position.y);
        console.log("📏 Subdivisões:", 
            sea.geometry.parameters.widthSegments + "x" + 
            sea.geometry.parameters.heightSegments
        );
        console.log("🎨 Cor:", sea.material.color);
        console.log("✨ Metalness:", sea.material.metalness);
        console.log("🔮 Roughness:", sea.material.roughness);
        
        // Verificar se tem animação
        if (sea.geometry.userData.originalPositions) {
            console.log("✅ Ondas animadas ativas");
        } else {
            console.log("⚠️ Ondas animadas podem não estar ativas");
        }
    } else {
        console.log("❌ Oceano NÃO encontrado!");
    }
}

// ===== TESTE 5: Verificar Furacões =====
function testarFuracoes() {
    console.log("\n🌪️ TESTE DOS FURACÕES:");
    
    if (tornadoes && tornadoes.length > 0) {
        console.log(`✅ ${tornadoes.length} furacões encontrados`);
        
        tornadoes.forEach((tornado, i) => {
            console.log(`\n  Furacão ${i + 1}:`);
            console.log(`    📍 Posição: (${tornado.position.x.toFixed(1)}, ${tornado.position.y.toFixed(1)}, ${tornado.position.z.toFixed(1)})`);
            console.log(`    📏 Altura:`, tornado.geometry.parameters.height);
            console.log(`    ⚪ Raio:`, tornado.geometry.parameters.radius);
            console.log(`    🔄 Fase:`, tornado.userData.phase.toFixed(2));
        });
    } else {
        console.log("❌ Furacões NÃO encontrados!");
    }
}

// ===== TESTE 6: Verificar Raios =====
function testarRaios() {
    console.log("\n⚡ TESTE DOS RAIOS:");
    
    if (lightningLight) {
        console.log("✅ Luz dos raios existe");
        console.log("💡 Intensidade atual:", lightningLight.intensity);
        console.log("📍 Posição:", lightningLight.position);
        console.log("🎨 Cor:", lightningLight.color);
    } else {
        console.log("❌ Luz dos raios NÃO encontrada!");
    }
    
    if (currentBolt) {
        console.log("⚡ Raio ativo no momento!");
        console.log("   Segmentos:", currentBolt.children.length);
    } else {
        console.log("💤 Nenhum raio ativo (normal entre raios)");
    }
    
    console.log("🕐 Último raio:", Date.now() - lastLightningTime, "ms atrás");
}

// ===== TESTE 7: Verificar Nuvens =====
function testarNuvens() {
    console.log("\n☁️ TESTE DAS NUVENS:");
    
    if (clouds && clouds.length > 0) {
        console.log(`✅ ${clouds.length} nuvens encontradas`);
        
        // Estatísticas
        let minY = Infinity, maxY = -Infinity;
        let totalRadius = 0;
        
        clouds.forEach(cloud => {
            minY = Math.min(minY, cloud.position.y);
            maxY = Math.max(maxY, cloud.position.y);
            totalRadius += cloud.geometry.parameters.radius;
        });
        
        const avgRadius = totalRadius / clouds.length;
        
        console.log("📊 Estatísticas:");
        console.log(`   Altura mín: ${minY.toFixed(1)}`);
        console.log(`   Altura máx: ${maxY.toFixed(1)}`);
        console.log(`   Raio médio: ${avgRadius.toFixed(1)}`);
        console.log(`   Cor: ${clouds[0].material.color.getHexString()}`);
        console.log(`   Opacidade: ${clouds[0].material.opacity}`);
    } else {
        console.log("❌ Nuvens NÃO encontradas!");
    }
}

// ===== TESTE 8: Verificar Chuva =====
function testarChuva() {
    console.log("\n🌧️ TESTE DA CHUVA:");
    
    if (rain) {
        console.log("✅ Sistema de chuva ativo");
        const particulas = rain.geometry.attributes.position.count;
        console.log("💧 Partículas:", particulas);
        console.log("📏 Tamanho:", rain.material.size);
        console.log("🎨 Cor:", rain.material.color);
        console.log("✨ Opacidade:", rain.material.opacity);
    } else {
        console.log("❌ Chuva NÃO encontrada!");
    }
}

// ===== TESTE 9: Performance =====
function testarPerformance() {
    console.log("\n⚙️ TESTE DE PERFORMANCE:");
    
    // Contar objetos
    let meshCount = 0;
    let lightCount = 0;
    let geometryCount = 0;
    
    function contarRecursivo(obj) {
        if (obj.type === 'Mesh') meshCount++;
        if (obj.type.includes('Light')) lightCount++;
        if (obj.geometry) geometryCount++;
        
        if (obj.children) {
            obj.children.forEach(child => contarRecursivo(child));
        }
    }
    
    contarRecursivo(scene);
    
    console.log("📊 Objetos na cena:");
    console.log(`   Meshes: ${meshCount}`);
    console.log(`   Luzes: ${lightCount}`);
    console.log(`   Geometrias: ${geometryCount}`);
    console.log(`   Total children: ${scene.children.length}`);
    
    // Renderer info
    if (renderer.info) {
        console.log("\n🎮 Renderer Info:");
        console.log("   Geometrias:", renderer.info.memory.geometries);
        console.log("   Texturas:", renderer.info.memory.textures);
        console.log("   Calls:", renderer.info.render.calls);
        console.log("   Triangles:", renderer.info.render.triangles);
    }
}

// ===== TESTE COMPLETO =====
function testarTudo() {
    console.log("🚀 INICIANDO TESTES COMPLETOS\n");
    console.log("============================\n");
    
    testarFarol();
    testarIlha();
    testarNavio();
    testarOceano();
    testarFuracoes();
    testarRaios();
    testarNuvens();
    testarChuva();
    testarPerformance();
    
    console.log("\n============================");
    console.log("✅ TESTES CONCLUÍDOS!");
    console.log("\n💡 Comandos disponíveis:");
    console.log("   testarFarol()");
    console.log("   testarIlha()");
    console.log("   testarNavio()");
    console.log("   testarOceano()");
    console.log("   testarFuracoes()");
    console.log("   testarRaios()");
    console.log("   testarNuvens()");
    console.log("   testarChuva()");
    console.log("   testarPerformance()");
    console.log("   testarTudo()");
}

// ===== COMANDOS DE DEBUG =====
function mostrarFarol() {
    if (beaconPivot) {
        console.log("💡 Teleportando para o farol...");
        player.position.set(0, towerTopY + 10, 0);
        camera.rotation.x = -Math.PI / 4;
    }
}

function mostrarNavio() {
    console.log("⛵ Teleportando para o navio...");
    player.position.set(-75, 20, 45);
    player.rotation.y = Math.PI / 3;
}

function mostrarIlha() {
    console.log("🏔️ Vista aérea da ilha...");
    player.position.set(0, 100, 100);
    camera.rotation.x = -Math.PI / 4;
}

function forcaRaio() {
    console.log("⚡ Forçando raio...");
    createLightningBolt();
}

function aumentarIntensidadeFarol() {
    if (beaconPivot && beaconPivot.children[0]) {
        beaconPivot.children[0].intensity += 2;
        console.log("💡 Intensidade aumentada para:", beaconPivot.children[0].intensity);
    }
}

function diminuirIntensidadeFarol() {
    if (beaconPivot && beaconPivot.children[0]) {
        beaconPivot.children[0].intensity = Math.max(0, beaconPivot.children[0].intensity - 2);
        console.log("💡 Intensidade diminuída para:", beaconPivot.children[0].intensity);
    }
}

// ===== INFORMAÇÕES =====
console.log("\n📚 COMANDOS DISPONÍVEIS:");
console.log("========================");
console.log("\n🔍 Testes:");
console.log("  testarTudo()          - Executa todos os testes");
console.log("  testarFarol()         - Testa farol e luz");
console.log("  testarIlha()          - Testa ilha e rochas");
console.log("  testarNavio()         - Testa navio destruído");
console.log("  testarOceano()        - Testa mar e ondas");
console.log("  testarFuracoes()      - Testa furacões");
console.log("  testarRaios()         - Testa sistema de raios");
console.log("  testarNuvens()        - Testa nuvens");
console.log("  testarChuva()         - Testa chuva");
console.log("  testarPerformance()   - Analisa performance");
console.log("\n🎮 Navegação:");
console.log("  mostrarFarol()        - Teleporta para o farol");
console.log("  mostrarNavio()        - Teleporta para o navio");
console.log("  mostrarIlha()         - Vista aérea da ilha");
console.log("\n⚡ Efeitos:");
console.log("  forcaRaio()           - Força um raio imediatamente");
console.log("  aumentarIntensidadeFarol()  - +2 intensidade");
console.log("  diminuirIntensidadeFarol()  - -2 intensidade");
console.log("\n💡 Digite testarTudo() para começar!");
console.log("========================\n");
