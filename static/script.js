// --- 1. LÓGICA DE ESCALA (MOBILE PERFECT) ---
function resizeApp() {
    const app = document.getElementById('app-container');
    const targetWidth = 1280;
    const targetHeight = 800;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    const scaleX = winWidth / targetWidth;
    const scaleY = winHeight / targetHeight;

    // Margem de segurança de 5% (0.95)
    let scale = Math.min(scaleX, scaleY) * 0.95;

    // Aplica o Zoom
    app.style.transform = `scale(${scale})`;

    // Força reflow (ajuda no Chrome Mobile)
    app.style.display = 'none';
    app.offsetHeight;
    app.style.display = 'flex';
}
window.addEventListener('resize', () => setTimeout(resizeApp, 100));
window.addEventListener('orientationchange', () => setTimeout(resizeApp, 200));
window.addEventListener('load', () => { resizeApp(); loadMapData(); });

// --- 2. UTILITÁRIOS ---
function formatCensoredCPF(cpf) {
    if (!cpf || cpf.length < 11) return "***.***.***-**";
    const middle = cpf.substring(3, 6) + "." + cpf.substring(6, 9);
    return `***.${middle}-**`;
}
function formatCensoredMatricula(mat) {
    if (!mat || mat.length < 6) return mat;
    return `${mat.substring(0, 3)}***${mat.substring(mat.length - 3)}`;
}
function updateClock() {
    const now = new Date();
    document.getElementById('clock-display').innerText = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}
setInterval(updateClock, 1000); updateClock();

// --- 3. LOGIN & CADASTRO ---
function toggleRegisterView(showRegister) {
    document.getElementById('login-form-container').style.display = showRegister ? 'none' : 'block';
    document.getElementById('register-form-container').style.display = showRegister ? 'block' : 'none';
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('reg-error').style.display = 'none';
}
function toggleEmployeeFields() {
    document.getElementById('employee-fields').style.display = document.getElementById('check-employee').checked ? 'block' : 'none';
}
function doRegister() {
    const cpf = document.getElementById('reg-cpf').value;
    const nome = document.getElementById('reg-nome').value;
    const isEmployee = document.getElementById('check-employee').checked;
    const matricula = document.getElementById('reg-matricula').value;
    const cargo = document.getElementById('reg-cargo').value;

    if (!cpf || !nome) return alert("Preencha CPF e Nome.");

    fetch('/api/register', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ cpf, nome, is_employee: isEmployee, matricula, cargo })
    }).then(r => r.json()).then(data => {
        if(data.success) { alert("Sucesso!"); toggleRegisterView(false); }
        else { document.getElementById('reg-error').innerText = data.message; document.getElementById('reg-error').style.display = 'block'; }
    });
}
function doLogin() {
    const cpf = document.getElementById('cpf-input').value;
    fetch('/api/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({cpf}) })
    .then(r => r.json()).then(data => {
        if(data.success) {
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('user-display').innerText = data.user.nome;

            let typeText = "", idText = "";
            const u = data.user;
            if (u.tipo === 'cliente') {
                typeText = "Tipo: Cliente Bistek";
                idText = `CPF: ${formatCensoredCPF(u.cpf_display)}`;
            } else if (u.tipo === 'admin') {
                typeText = "Tipo: Administrador"; idText = "Acesso Total";
            } else if (u.tipo.includes("Funcionário")) {
                const match = u.tipo.match(/Funcionário - (.*) \(Mat: (.*)\)/);
                if (match) {
                    typeText = `Tipo: Funcionário - ${match[1]}`;
                    idText = `Mat: ${formatCensoredMatricula(match[2])}`;
                } else { typeText = u.tipo; }
            }
            document.getElementById('footer-type').innerText = typeText;
            document.getElementById('footer-cpf').innerText = idText;
        } else { document.getElementById('login-error').style.display = 'block'; }
    });
}
document.getElementById('cpf-input')?.addEventListener("keypress", (e) => { if (e.key === "Enter") doLogin(); });

// --- 4. CORE ---
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');
let mapData = null;
let currentX=0, currentY=0, targetX=0, targetY=0;

function updateDashboard() {
    fetch('/api/status').then(r => r.json()).then(data => {
        document.getElementById('location-name').innerText = data.setor;
        document.getElementById('offer-text').innerText = data.oferta;
        if (data.theme === 'red') document.body.classList.add('theme-red'); else document.body.classList.remove('theme-red');
        renderCart(data.cart, data.total);
        targetX = data.pos_x; targetY = data.pos_y;
        if (currentX === 0 && currentY === 0) { currentX = targetX; currentY = targetY; }
        if (!mapData) loadMapData();
    }).catch(e=>{});
}
setInterval(updateDashboard, 500);

function deleteItem(id) { fetch('/api/cart/remove', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id}) }); }

function renderCart(items, total) {
    const c = document.getElementById('cart-container');
    if (!c) return;
    if (c.children.length === items.length && document.getElementById('total-price').innerText.includes(total.toFixed(2))) return;
    c.innerHTML = "";
    if (items.length === 0) c.innerHTML = "<div style='padding:40px; color:#aaa; text-align:center;'>Carrinho vazio</div>";
    items.slice().reverse().forEach(item => {
        const div = document.createElement('div'); div.className = 'cart-item';
        div.innerHTML = `<div style="display:flex; align-items:center; gap:12px;"><span class="material-icons" style="color:#555; font-size:24px;">${item.icon||'local_offer'}</span><span style="font-weight:600; color:#333;">${item.nome}</span></div><div style="display:flex; align-items:center; gap:15px;"><b style="color:#444;">R$ ${item.preco.toFixed(2)}</b><span onclick="deleteItem(${item.id})" class="material-icons" style="cursor:pointer; color:#d32f2f;">delete</span></div>`;
        c.appendChild(div);
    });
    document.getElementById('total-price').innerText = `R$ ${total.toFixed(2)}`;
}

function loadMapData() { fetch('/api/mapa').then(r => r.json()).then(m => { mapData = m; }); }
function gameLoop() {
    if (mapData) {
        currentX += (targetX - currentX) * 0.1; currentY += (targetY - currentY) * 0.1;
        drawMap(currentX, currentY);
    }
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

function drawMap(px, py) {
    const w = canvas.parentElement.clientWidth; const h = canvas.parentElement.clientHeight;
    canvas.width = w; canvas.height = h;
    const TILE = Math.min(w / mapData.width, h / mapData.height);
    const offsetX = (w - (mapData.width * TILE)) / 2;
    const offsetY = (h - (mapData.height * TILE)) / 2;

    ctx.fillStyle = "#e0e0e0"; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < mapData.width; x++) {
        for (let y = 0; y < mapData.height; y++) {
            let dx = offsetX + (x * TILE); let dy = offsetY + (y * TILE);
            if (mapData.grid[x][y].type === 1) { ctx.fillStyle = "#555"; ctx.fillRect(dx, dy, TILE+0.5, TILE+0.5); }
            if (mapData.grid[x][y].type === 3) { ctx.fillStyle = "#004B50"; ctx.fillRect(dx, dy, TILE, TILE); }
        }
    }

    // EFEITO SONAR
    let finalX = offsetX + (px * (TILE/mapData.tile_size));
    let finalY = offsetY + (py * (TILE/mapData.tile_size));
    const wave = (Date.now()/1000 * 2) % 1;
    ctx.beginPath(); ctx.arc(finalX, finalY, (TILE/2.5)+(TILE*1.5*wave), 0, Math.PI*2);
    ctx.fillStyle = `rgba(211, 47, 47, ${1-wave})`; ctx.fill();

    ctx.fillStyle = "#D32F2F"; ctx.beginPath(); ctx.arc(finalX, finalY, TILE/2.5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "white"; ctx.lineWidth = 3; ctx.stroke();
}