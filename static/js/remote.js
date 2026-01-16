const socket = io();
const led = document.getElementById('statusLed');

socket.on('connect', () => { led.classList.add('connected'); vibrate(50); });
socket.on('disconnect', () => led.classList.remove('connected'));

// Hack para espelhamento limpo
const iframe = document.getElementById('mirrorIframe');
iframe.onload = function() {
    try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const overlay = doc.getElementById('login-overlay');
        if(overlay) overlay.style.display = 'none';
        doc.body.style.cursor = 'none';
    } catch (e) {}
};

// --- D-PAD ---
document.querySelectorAll('.d-btn').forEach(btn => {
    const key = btn.getAttribute('data-key');
    if(!key) return;
    const press = (e) => { if(e.type === 'touchstart') e.preventDefault(); btn.classList.add('active'); vibrate(15); socket.emit('input_change', { key: key, pressed: true }); };
    const release = (e) => { if(e.type === 'touchend') e.preventDefault(); btn.classList.remove('active'); socket.emit('input_change', { key: key, pressed: false }); };

    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release, { passive: false });
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
});

// Ações
window.triggerScan = function() { socket.emit('action_scan'); vibrate([30, 50]); }
window.triggerReset = function() { if(confirm("Resetar?")) socket.emit('action_reset'); }
window.triggerTheme = function() { socket.emit('action_theme'); }

// --- DESENHO (INTERPOLADO) ---
const drawingModeEl = document.getElementById('drawing-mode');
const layer = document.getElementById('layer');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const viewport = document.getElementById('viewport');

let currentTool = 'draw', scale = 1, pX = 0, pY = 0;
let isDragging = false, startDist = 0, lastX = 0, lastY = 0;

window.toggleDrawingMode = function(show) {
    drawingModeEl.style.display = show ? 'flex' : 'none';
    if(show) {
        // Fit inicial
        scale = Math.min(viewport.clientWidth / 1280, viewport.clientHeight / 800) * 0.95;
        pX = 0; pY = 0; updateTransform();
        if(iframe.contentWindow) iframe.contentWindow.location.reload();
    }
}

window.setTool = function(tool) {
    currentTool = tool;
    document.getElementById('btn-draw').className = `tool-btn ${tool==='draw'?'active':''}`;
    document.getElementById('btn-move').className = `tool-btn ${tool==='move'?'active':''}`;
}

window.clearDrawings = function() { socket.emit('draw_clear'); ctx.clearRect(0, 0, canvas.width, canvas.height); vibrate(50); }

function updateTransform() { layer.style.transform = `translate(${pX}px, ${pY}px) scale(${scale})`; }
function getDist(t1, t2) { return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); }
function getCanvasPoint(touch) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (touch.clientX - rect.left) * (canvas.width / rect.width),
        y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    };
}
function vibrate(ptrn) { if(navigator.vibrate) navigator.vibrate(ptrn); }

// Eventos Touch Desenho
viewport.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 2) { startDist = getDist(e.touches[0], e.touches[1]); isDragging = false; return; }
    if (currentTool === 'move') { isDragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }
    else if (currentTool === 'draw') {
        const p = getCanvasPoint(e.touches[0]);
        lastX = p.x; lastY = p.y;
        drawLocal(p.x, p.y, p.x, p.y);
        emitInterpolated(p.x, p.y, p.x, p.y);
    }
}, { passive: false });

viewport.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 2) {
        const newDist = getDist(e.touches[0], e.touches[1]);
        scale = Math.min(Math.max(scale * (newDist / startDist), 0.2), 3.0);
        startDist = newDist; updateTransform(); return;
    }
    if (currentTool === 'move' && isDragging) {
        pX += e.touches[0].clientX - lastX; pY += e.touches[0].clientY - lastY;
        lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
        updateTransform();
    } else if (currentTool === 'draw') {
        const p = getCanvasPoint(e.touches[0]);
        drawLocal(lastX, lastY, p.x, p.y);
        emitInterpolated(lastX, lastY, p.x, p.y);
        lastX = p.x; lastY = p.y;
    }
}, { passive: false });

viewport.addEventListener('touchend', () => { isDragging = false; });

function drawLocal(x1, y1, x2, y2) {
    ctx.beginPath(); ctx.strokeStyle = document.getElementById('color-input').value;
    ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function emitInterpolated(x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(dist / 5);
    const color = document.getElementById('color-input').value;
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        socket.emit('draw_add', { x: (x1+(x2-x1)*t)/1280, y: (y1+(y2-y1)*t)/800, color: color });
    }
}