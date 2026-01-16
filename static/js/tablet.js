const socket = io();
let mapData = null;
let currentX = 0, currentY = 0, targetX = 0, targetY = 0;

// Elementos
const mapCanvas = document.getElementById('map-canvas');
const overlayCanvas = document.getElementById('overlay-canvas');
const mapCtx = mapCanvas ? mapCanvas.getContext('2d') : null;
const overlayCtx = overlayCanvas ? overlayCanvas.getContext('2d') : null;

// --- SOCKETS ---
socket.on('update_state', (data) => {
    // Texto
    document.getElementById('location-name').innerText = data.setor;
    document.getElementById('offer-text').innerText = data.oferta;

    // Tema
    if (data.theme === 'red') document.body.classList.add('theme-red');
    else document.body.classList.remove('theme-red');

    // Carrinho
    renderCart(data.cart, data.total);

    // Desenhos Overlay
    renderOverlay(data.drawings || []);

    // Movimento
    targetX = data.pos_x;
    targetY = data.pos_y;
    if (currentX === 0 && currentY === 0) { currentX = targetX; currentY = targetY; }

    if (!mapData) loadMapData();
});

// --- RENDERIZADORES ---
function drawMap(px, py) {
    if(!mapCanvas || !mapData) return;
    const w = mapCanvas.parentElement.clientWidth;
    const h = mapCanvas.parentElement.clientHeight;
    mapCanvas.width = w; mapCanvas.height = h;

    const TILE = Math.min(w / mapData.width, h / mapData.height);
    const offsetX = (w - (mapData.width * TILE)) / 2;
    const offsetY = (h - (mapData.height * TILE)) / 2;

    mapCtx.fillStyle = "#ffffff";
    mapCtx.fillRect(0, 0, w, h);

    for (let x = 0; x < mapData.width; x++) {
        for (let y = 0; y < mapData.height; y++) {
            let dx = offsetX + (x * TILE);
            let dy = offsetY + (y * TILE);
            if (mapData.grid[x][y].type === 1) { mapCtx.fillStyle = "#333"; mapCtx.fillRect(dx, dy, TILE+0.5, TILE+0.5); }
            if (mapData.grid[x][y].type === 3) { mapCtx.fillStyle = "#0288D1"; mapCtx.fillRect(dx, dy, TILE, TILE); }
        }
    }
    // Player
    let finalX = offsetX + (px * (TILE/30));
    let finalY = offsetY + (py * (TILE/30));
    mapCtx.beginPath(); mapCtx.arc(finalX, finalY, TILE/2, 0, Math.PI*2);
    mapCtx.fillStyle = "#d32f2f"; mapCtx.fill();
    mapCtx.strokeStyle = "white"; mapCtx.lineWidth = 2; mapCtx.stroke();
}

function renderOverlay(drawings) {
    if(!overlayCanvas) return;
    overlayCanvas.width = 1280; overlayCanvas.height = 800;
    overlayCtx.clearRect(0, 0, 1280, 800);
    if (drawings.length > 0) {
        overlayCtx.lineWidth = 5; overlayCtx.lineCap = "round";
        drawings.forEach(d => {
            overlayCtx.beginPath();
            overlayCtx.arc(d.x * 1280, d.y * 800, 5, 0, Math.PI*2);
            overlayCtx.fillStyle = d.color; overlayCtx.fill();
        });
    }
}

// Loop de Animação
function gameLoop() {
    if (mapData) {
        currentX += (targetX - currentX) * 0.1;
        currentY += (targetY - currentY) * 0.1;
        drawMap(currentX, currentY);
    }
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// --- UTILITÁRIOS ---
function updateClock() {
    document.getElementById('clock-display').innerText = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}
setInterval(updateClock, 1000);

function loadMapData() { fetch('/api/mapa').then(r => r.json()).then(m => mapData = m); }

// --- CARRINHO ---
function renderCart(items, total) {
    const c = document.getElementById('cart-container');
    const t = document.getElementById('total-price');
    if(!c) return;
    if(c.childElementCount === items.length && t.innerText.includes(total.toFixed(2))) return;

    c.innerHTML = "";
    if (items.length === 0) c.innerHTML = "<div style='text-align:center; padding:30px; color:#aaa;'>Carrinho Vazio</div>";

    items.slice().reverse().forEach(item => {
        // Adicionada classe 'animate-entry' para efeito wow
        c.innerHTML += `
        <div class="cart-item animate-entry">
            <div style="display:flex; align-items:center; gap:8px">
                <span class="material-icons" style="color:#004B50">${item.icon||'local_offer'}</span>
                <span>${item.nome}</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px">
                <b>R$ ${item.preco.toFixed(2)}</b>
                <span onclick="socket.emit('action_remove', {id: ${item.id}})" style="color:#d32f2f; cursor:pointer;">✕</span>
            </div>
        </div>`;
    });
    t.innerText = `R$ ${total.toFixed(2)}`;
}

// --- LOGIN ---
function doLogin() {
    const cpf = document.getElementById('cpf-input').value;
    fetch('/api/login', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({cpf})
    }).then(r => r.json()).then(data => {
        if(data.success) {
            document.getElementById('login-overlay').style.opacity = '0';
            setTimeout(() => document.getElementById('login-overlay').style.display = 'none', 500); // Fade out suave
            document.getElementById('user-display').innerText = data.user.nome.split(' ')[0];

            // Footer Info
            const tipo = data.user.tipo === 'cliente' ? 'Cliente' : (data.user.tipo === 'admin' ? 'ADMIN' : data.user.tipo);
            document.getElementById('footer-type').innerText = tipo;
            if(data.user.tipo === 'cliente') document.getElementById('footer-cpf').innerText = " | " + data.user.cpf_display;
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    });
}

// --- REDIMENSIONAMENTO INTELIGENTE (Tablet/PC) ---
function resizeAppSmart() {
    const app = document.getElementById('app-container');
    const winW = window.innerWidth; const winH = window.innerHeight;
    const baseW = 1280; const baseH = 800;

    const isSmallScreen = winW <= 1366;
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    if (isSmallScreen || isTouchDevice) {
        // Stretch (Mobile/Tablet)
        app.style.transformOrigin = 'top left';
        app.style.transform = `scale(${winW / baseW}, ${winH / baseH})`;
        app.style.left = '0px'; app.style.top = '0px'; app.style.position = 'absolute';
        app.style.borderRadius = '0px'; app.style.boxShadow = 'none';
    } else {
        // Contain (PC)
        let scale = Math.min(winW / baseW, winH / baseH) * 0.95;
        app.style.transformOrigin = 'center center';
        app.style.transform = `scale(${scale})`;
        app.style.left = 'auto'; app.style.top = 'auto'; app.style.position = 'relative';
        app.style.borderRadius = '20px'; app.style.boxShadow = '0 0 50px rgba(0,0,0,0.5)';
    }
    app.style.display = 'none'; app.offsetHeight; app.style.display = 'grid';
}

window.addEventListener('resize', resizeAppSmart);
window.addEventListener('load', resizeAppSmart);
window.addEventListener('orientationchange', () => setTimeout(resizeAppSmart, 200));