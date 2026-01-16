// ===========================================
// 1. CONFIGURAÇÃO DE CONEXÃO INTELIGENTE
// ===========================================
// Agora ele tenta conectar no mesmo link que você abriu no navegador
const SOCKET_URL = window.location.origin;

let socket = null;
let isOfflineMode = false;
let connectionTimeout = null;

// Elementos Globais
const mapCanvas = document.getElementById('map-canvas');
const overlayCanvas = document.getElementById('overlay-canvas');
const mapCtx = mapCanvas ? mapCanvas.getContext('2d') : null;
const overlayCtx = overlayCanvas ? overlayCanvas.getContext('2d') : null;

// Estados
let mapData = null;
let currentX = 0, currentY = 0, targetX = 0, targetY = 0;
let lastCartJSON = "";

// Variáveis OFFLINE (Simulação)
let simX = 15, simY = 16; // Posição inicial no meio dos corredores
let simCart = [];
const keysPressed = { UP: false, DOWN: false, LEFT: false, RIGHT: false };

// USUÁRIO PADRÃO (OFFLINE)
const OFFLINE_USER = {
    nome: "Sem nome (Modo Offline)",
    cpf_display: "123.456.789-01",
    tipo: "Cliente - Acesso Local"
};

// MAPA REAL (Cópia exata do seu JSON para garantir fidelidade offline)
const REAL_MAP_DATA = {
    "width": 30, "height": 18,
    "grid": [[{"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 12}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 12}, {"type": 3, "zone_id": 0}], [{"type": 1, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 3, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 3, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 3, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 0}], [{"type": 1, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 0}], [{"type": 1, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 3, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 3, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 1, "zone_id": 1}, {"type": 3, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 12}, {"type": 2, "zone_id": 0}], [{"type": 1, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 1}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 2}, {"type": 2, "zone_id": 2}, {"type": 2, "zone_id": 2}, {"type": 2, "zone_id": 2}, {"type": 2, "zone_id": 2}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 11}, {"type": 2, "zone_id": 11}, {"type": 2, "zone_id": 11}, {"type": 2, "zone_id": 11}, {"type": 2, "zone_id": 11}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 2}, {"type": 2, "zone_id": 2}, {"type": 2, "zone_id": 2}, {"type": 2, "zone_id": 2}, {"type": 2, "zone_id": 2}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 11}, {"type": 2, "zone_id": 11}, {"type": 2, "zone_id": 11}, {"type": 2, "zone_id": 11}, {"type": 2, "zone_id": 11}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 3}, {"type": 2, "zone_id": 3}, {"type": 2, "zone_id": 3}, {"type": 2, "zone_id": 3}, {"type": 2, "zone_id": 3}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 10}, {"type": 2, "zone_id": 10}, {"type": 2, "zone_id": 10}, {"type": 2, "zone_id": 10}, {"type": 2, "zone_id": 10}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 3}, {"type": 2, "zone_id": 3}, {"type": 2, "zone_id": 3}, {"type": 2, "zone_id": 3}, {"type": 2, "zone_id": 3}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 10}, {"type": 2, "zone_id": 10}, {"type": 2, "zone_id": 10}, {"type": 2, "zone_id": 10}, {"type": 2, "zone_id": 10}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 4}, {"type": 2, "zone_id": 4}, {"type": 2, "zone_id": 4}, {"type": 2, "zone_id": 4}, {"type": 2, "zone_id": 4}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 9}, {"type": 2, "zone_id": 9}, {"type": 2, "zone_id": 9}, {"type": 2, "zone_id": 9}, {"type": 2, "zone_id": 9}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 4}, {"type": 2, "zone_id": 4}, {"type": 2, "zone_id": 4}, {"type": 2, "zone_id": 4}, {"type": 2, "zone_id": 4}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 9}, {"type": 2, "zone_id": 9}, {"type": 2, "zone_id": 9}, {"type": 2, "zone_id": 9}, {"type": 2, "zone_id": 9}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 5}, {"type": 2, "zone_id": 5}, {"type": 2, "zone_id": 5}, {"type": 2, "zone_id": 5}, {"type": 2, "zone_id": 5}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 8}, {"type": 2, "zone_id": 8}, {"type": 2, "zone_id": 8}, {"type": 2, "zone_id": 8}, {"type": 2, "zone_id": 8}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 5}, {"type": 2, "zone_id": 5}, {"type": 2, "zone_id": 5}, {"type": 2, "zone_id": 5}, {"type": 2, "zone_id": 5}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 8}, {"type": 2, "zone_id": 8}, {"type": 2, "zone_id": 8}, {"type": 2, "zone_id": 8}, {"type": 2, "zone_id": 8}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 6}, {"type": 2, "zone_id": 6}, {"type": 2, "zone_id": 6}, {"type": 2, "zone_id": 6}, {"type": 2, "zone_id": 6}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 7}, {"type": 2, "zone_id": 7}, {"type": 2, "zone_id": 7}, {"type": 2, "zone_id": 7}, {"type": 2, "zone_id": 7}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 6}, {"type": 2, "zone_id": 6}, {"type": 2, "zone_id": 6}, {"type": 2, "zone_id": 6}, {"type": 2, "zone_id": 6}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 7}, {"type": 2, "zone_id": 7}, {"type": 2, "zone_id": 7}, {"type": 2, "zone_id": 7}, {"type": 2, "zone_id": 7}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 3, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 2, "zone_id": 0}, {"type": 1, "zone_id": 0}], [{"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}, {"type": 1, "zone_id": 0}]]
};

// ===========================================
// 2. CONEXÃO & DETECÇÃO DE REDE
// ===========================================
function initConnection() {
    console.log(`🚀 Iniciando. Tentando: ${SOCKET_URL}`);

    // Arquivo local -> Offline direto
    if (window.location.protocol === 'file:') {
        activateOfflineMode();
        return;
    }

    // Conecta na origem (localhost ou cloudflare)
    socket = io(SOCKET_URL, {
        reconnection: false,
        timeout: 2000,
        transports: ['websocket', 'polling']
    });

    // Se não conectar em 2.5s, assume que a rede caiu
    connectionTimeout = setTimeout(() => {
        if (!socket.connected) {
            socket.close();
            activateOfflineMode();
        }
    }, 2500);

    // Sucesso
    socket.on('connect', () => {
        clearTimeout(connectionTimeout);
        console.log("✅ Conectado Online!");
        document.getElementById('connection-status').innerText = 'Online';
        document.getElementById('status-dot').className = 'dot online';
        document.getElementById('offline-banner').style.display = 'none';
        setupSocketEvents();
        loadMapData();
    });

    // Erro
    socket.on('connect_error', () => {
        clearTimeout(connectionTimeout);
        activateOfflineMode();
    });
}

// ===========================================
// 3. MODO SOBREVIVÊNCIA (SIMULAÇÃO)
// ===========================================
function activateOfflineMode() {
    if (isOfflineMode) return;
    isOfflineMode = true;

    console.warn("🛡️ SIMULAÇÃO ATIVADA");

    const banner = document.getElementById('offline-banner');
    if(banner) {
        banner.style.display = 'block';
        banner.innerText = "⚠️ MODO OFFLINE: Use W, A, S, D para mover";
    }

    document.getElementById('connection-status').innerText = 'Simulação Local';
    document.getElementById('status-dot').className = 'dot offline';

    // Carrega o mapa REAL que injetamos via código
    mapData = REAL_MAP_DATA;

    // Inicia na posição simulada
    currentX = simX; currentY = simY;
    drawMap(simX, simY);
    updateOfflineInfo(simX, simY);
}

// ===========================================
// 4. MOVIMENTAÇÃO SUAVE (GAME LOOP)
// ===========================================
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w' || e.key === 'ArrowUp') keysPressed.UP = true;
    if (key === 's' || e.key === 'ArrowDown') keysPressed.DOWN = true;
    if (key === 'a' || e.key === 'ArrowLeft') keysPressed.LEFT = true;
    if (key === 'd' || e.key === 'ArrowRight') keysPressed.RIGHT = true;

    // Atalhos
    if (key === 'enter') handleAction('scan');
    if (key === 'backspace') handleAction('remove');
    if (key === 't') handleAction('theme');
    if (key === 'b') handleAction('bg');

    // Se estiver online, manda pro server
    if (!isOfflineMode && socket) {
        if(keysPressed.UP) socket.emit('input_change', { key: 'UP', pressed: true });
        if(keysPressed.DOWN) socket.emit('input_change', { key: 'DOWN', pressed: true });
        if(keysPressed.LEFT) socket.emit('input_change', { key: 'LEFT', pressed: true });
        if(keysPressed.RIGHT) socket.emit('input_change', { key: 'RIGHT', pressed: true });
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w' || e.key === 'ArrowUp') keysPressed.UP = false;
    if (key === 's' || e.key === 'ArrowDown') keysPressed.DOWN = false;
    if (key === 'a' || e.key === 'ArrowLeft') keysPressed.LEFT = false;
    if (key === 'd' || e.key === 'ArrowRight') keysPressed.RIGHT = false;

    if (!isOfflineMode && socket) {
        if(!keysPressed.UP) socket.emit('input_change', { key: 'UP', pressed: false });
        if(!keysPressed.DOWN) socket.emit('input_change', { key: 'DOWN', pressed: false });
        if(!keysPressed.LEFT) socket.emit('input_change', { key: 'LEFT', pressed: false });
        if(!keysPressed.RIGHT) socket.emit('input_change', { key: 'RIGHT', pressed: false });
    }
});

function handleAction(action) {
    if (isOfflineMode) {
        if(action === 'scan') {
            simCart.push({id: Date.now(), nome: "Produto Demo " + (simCart.length+1), preco: (Math.random()*20)+5, icon: "local_mall"});
            renderCart(simCart, simCart.reduce((a,b)=>a+b.preco, 0));
        }
        if(action === 'remove') {
            simCart.pop();
            renderCart(simCart, simCart.reduce((a,b)=>a+b.preco, 0));
        }
        if(action === 'theme') toggleLocalTheme();
        if(action === 'bg') toggleLocalBg();
    } else if (socket) {
        if(action === 'scan') socket.emit('action_scan');
        if(action === 'remove') {
            const lastId = getLastItemId();
            if(lastId) socket.emit('action_remove', { id: lastId });
        }
        if(action === 'theme') socket.emit('action_cycle_theme');
        if(action === 'bg') socket.emit('action_cycle_bg');
    }
}

// LOOP PRINCIPAL (Roda 60x por segundo)
function gameLoop() {
    // 1. Lógica Offline (Calcula posição localmente)
    if (isOfflineMode && mapData) {
        const speed = 0.15; // Velocidade suave
        let nextX = simX;
        let nextY = simY;

        if (keysPressed.UP) nextY -= speed;
        if (keysPressed.DOWN) nextY += speed;
        if (keysPressed.LEFT) nextX -= speed;
        if (keysPressed.RIGHT) nextX += speed;

        // Colisão Básica (Não atravessa paredes TYPE 1)
        let gridX = Math.round(nextX);
        let gridY = Math.round(nextY);

        if(gridX >= 0 && gridX < mapData.width && gridY >= 0 && gridY < mapData.height) {
            let cell = mapData.grid[gridX] ? mapData.grid[gridX][gridY] : null;
            if (cell && cell.type !== 1) {
                simX = nextX;
                simY = nextY;
            }
        }

        drawMap(simX, simY);
        updateOfflineInfo(simX, simY);
    }
    // 2. Lógica Online (Apenas interpolação visual)
    else if (!isOfflineMode && mapData) {
        currentX += (targetX - currentX) * 0.15;
        currentY += (targetY - currentY) * 0.15;
        drawMap(currentX / 30, currentY / 30);
    }

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// ===========================================
// 5. RENDERIZADORES & MAPA
// ===========================================
function drawMap(gridX, gridY) {
    if(!mapCanvas || !mapData) return;
    const w = mapCanvas.parentElement.clientWidth;
    const h = mapCanvas.parentElement.clientHeight;
    mapCanvas.width = w; mapCanvas.height = h;

    const TILE = Math.min(w / mapData.width, h / mapData.height);
    const offsetX = (w - (mapData.width * TILE)) / 2;
    const offsetY = (h - (mapData.height * TILE)) / 2;

    // Fundo
    mapCtx.fillStyle = "#ffffff"; mapCtx.fillRect(0, 0, w, h);

    for (let x = 0; x < mapData.width; x++) {
        for (let y = 0; y < mapData.height; y++) {
            let dx = offsetX + (x * TILE); let dy = offsetY + (y * TILE);
            let cell = mapData.grid[x] ? mapData.grid[x][y] : null;
            if(!cell) continue;

            let type = cell.type || 2;

            // Paredes (Cinza Escuro)
            if (type === 1) {
                mapCtx.fillStyle = "#2d3436";
                mapCtx.fillRect(dx, dy, TILE+0.5, TILE+0.5);
            }
            // Beacons/Prateleiras Especiais (Verde)
            if (type === 3) {
                mapCtx.fillStyle = "#00b894";
                mapCtx.fillRect(dx, dy, TILE, TILE);
                mapCtx.strokeStyle = "rgba(0, 184, 148, 0.5)";
                mapCtx.lineWidth = 2;
                mapCtx.strokeRect(dx, dy, TILE, TILE);
            }
        }
    }

    // Desenha o Jogador (Bolinha Vermelha)
    let finalX = offsetX + (gridX * TILE);
    let finalY = offsetY + (gridY * TILE);

    // Sombra do jogador
    mapCtx.beginPath(); mapCtx.arc(finalX, finalY + 2, TILE/2, 0, Math.PI*2);
    mapCtx.fillStyle = "rgba(0,0,0,0.3)"; mapCtx.fill();

    // Jogador
    mapCtx.beginPath(); mapCtx.arc(finalX, finalY, TILE/2, 0, Math.PI*2);
    mapCtx.fillStyle = "#d32f2f"; mapCtx.fill();
    mapCtx.strokeStyle = "white"; mapCtx.lineWidth = 2; mapCtx.stroke();
}

function updateOfflineInfo(x, y) {
    let setor = "Corredor Central";
    // Lógica aproximada baseada no mapa V3
    if (x < 3) setor = "Entrada / Caixas";
    else if (x > 27) setor = "Padaria & Frios";
    else if (y < 4) setor = "Hortifruti";
    else if (y > 15) setor = "Bebidas";
    else if (x > 12 && x < 18) setor = "Mercearia";

    document.getElementById('location-name').innerText = setor;
    document.getElementById('offer-text').innerText = "Modo Offline Ativo";
}

// ===========================================
// 6. LOGIN, RELÓGIO E UTILS
// ===========================================

// Login Modificado para Offline
function performLogin() {
    if(isOfflineMode) {
        // LOGIN AUTOMÁTICO OFFLINE
        closeAuthModal();
        updateUserInfo(OFFLINE_USER);
        const status = document.getElementById('connection-status');
        status.innerText = "Logado (Offline)";
        status.style.color = "#FFD700";
        return;
    }

    // Login Online
    const cpf = document.getElementById('login-cpf').value;
    fetch('/api/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cpf})})
    .then(r => r.json()).then(data => {
        if(data.success) { closeAuthModal(); updateUserInfo(data.user); }
        else { document.getElementById('auth-error').style.display='block'; document.getElementById('auth-error').innerText="Erro no Login"; }
    });
}

// Resto das funções auxiliares...
function toggleAuthMode(mode) {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const errorMsg = document.getElementById('auth-error');
    errorMsg.style.display = 'none';
    if (mode === 'register') { loginView.classList.add('hidden'); registerView.classList.remove('hidden'); }
    else { registerView.classList.add('hidden'); loginView.classList.remove('hidden'); }
}
function toggleMatricula() {
    const isColab = document.getElementById('reg-is-colab').checked;
    document.getElementById('matricula-group').style.display = isColab ? 'block' : 'none';
}
function performRegister() {
    if(isOfflineMode) return;
    const nome = document.getElementById('reg-nome').value;
    const cpf = document.getElementById('reg-cpf').value;
    const isColab = document.getElementById('reg-is-colab').checked;
    const matricula = document.getElementById('reg-matricula').value;
    const payload = { nome, cpf, is_employee: isColab, matricula, cargo: isColab ? "Operador" : "" };
    fetch('/api/register', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)})
    .then(r => r.json()).then(data => {
        if(data.success) { performLogin(); }
        else { document.getElementById('auth-error').innerText=data.message; }
    });
}
function closeAuthModal() {
    const overlay = document.getElementById('login-overlay');
    overlay.style.opacity = '0';
    setTimeout(() => overlay.style.display = 'none', 500);
}
function updateUserInfo(user) {
    document.getElementById('user-name-display').innerText = user.nome.split(' ')[0];
    let docDisplay = maskCPF(user.cpf_display || "");
    if (user.tipo.includes("Mat:")) {
        const match = user.tipo.match(/Mat: (\d+)/);
        if (match) docDisplay = "MAT: " + match[1];
    }
    document.getElementById('user-doc-display').innerText = docDisplay;
    document.getElementById('footer-type').innerText = user.tipo.split(' - ')[0];
}
function maskCPF(cpf) {
    if (!cpf || cpf.length < 11) return "***.***.***-**";
    const clean = cpf.replace(/\D/g, '');
    return `***.${clean.substring(3, 6)}.${clean.substring(6, 9)}-**`;
}
function renderCart(items, total) {
    const c = document.getElementById('cart-container');
    const t = document.getElementById('total-price');
    if(!c) return;
    const currentJSON = JSON.stringify(items);
    if (currentJSON === lastCartJSON) {
        if(t && t.innerText !== `R$ ${total.toFixed(2)}`) t.innerText = `R$ ${total.toFixed(2)}`;
        return;
    }
    lastCartJSON = currentJSON;
    c.innerHTML = "";
    if (items.length === 0) c.innerHTML = "<div style='text-align:center; padding:40px; opacity:0.5'>Lista Vazia</div>";
    items.slice().reverse().forEach((item, index) => {
        c.innerHTML += `
        <div class="cart-item">
            <div class="item-left">
                <span class="item-number">${index + 1}</span>
                <span class="material-icons" style="font-size:16px; opacity:0.7; margin-right:5px">${item.icon||'local_offer'}</span>
                <span class="item-name">${item.nome}</span>
            </div>
            <div class="item-right"><b>R$ ${item.preco.toFixed(2)}</b>
            <span onclick="deleteItem(${item.id})" style="color:#d32f2f; cursor:pointer;" class="material-icons">close</span></div>
        </div>`;
    });
    if(t) t.innerText = `R$ ${total.toFixed(2)}`;
    const searchInput = document.getElementById('cart-search');
    if(searchInput && searchInput.value) filterCart();
}
function filterCart() {
    const input = document.getElementById('cart-search');
    const filter = input.value.toLowerCase();
    const items = document.getElementsByClassName('cart-item');
    for (let i = 0; i < items.length; i++) {
        const name = items[i].getElementsByClassName('item-name')[0];
        if (name) items[i].style.display = name.innerText.toLowerCase().indexOf(filter) > -1 ? "" : "none";
    }
}
function deleteItem(id) {
    if(isOfflineMode) {
        simCart = simCart.filter(i => i.id !== id);
        renderCart(simCart, simCart.reduce((a,b)=>a+b.preco, 0));
    } else {
        socket.emit('action_remove', { id: id });
    }
}
function getLastItemId() {
    const items = document.querySelectorAll('.cart-item span[onclick]');
    if (items.length > 0) return parseInt(items[0].getAttribute('onclick').match(/\d+/)[0]);
    return null;
}
function renderOverlay(drawings) {
    if(!overlayCanvas) return;
    overlayCanvas.width = 1280; overlayCanvas.height = 800;
    overlayCtx.clearRect(0, 0, 1280, 800);
    if (drawings.length > 0) {
        overlayCtx.lineWidth = 6; overlayCtx.lineCap = "round";
        drawings.forEach(d => { overlayCtx.beginPath(); overlayCtx.arc(d.x * 1280, d.y * 800, 3, 0, Math.PI*2); overlayCtx.fillStyle = d.color; overlayCtx.fill(); });
    }
}
function loadMapData() {
    // No online tenta baixar, se falhar já temos o REAL_MAP_DATA no offline
    fetch('/api/mapa').then(r => r.json()).then(m => mapData = m).catch(() => console.log("Sem mapa online"));
}
function setupSocketEvents() {
    socket.on('update_state', (data) => {
        document.getElementById('location-name').innerText = data.setor;
        document.getElementById('offer-text').innerText = data.oferta;
        renderCart(data.cart, data.total);
        renderOverlay(data.drawings || []);
        applyStyle(data.theme, data.bg_mode);
        targetX = data.pos_x; targetY = data.pos_y;
        if (currentX === 0 && currentY === 0) { currentX = targetX; currentY = targetY; }
        if (!mapData) loadMapData();
    });
}
function updateClock() {
    const now = new Date();
    document.getElementById('clock-display').innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const closeTime = new Date(); closeTime.setHours(22, 0, 0);
    let diff = closeTime - now;
    const elCount = document.getElementById('clock-countdown');
    if (diff > 0 && diff < 43200000) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        elCount.innerText = `FECHA EM ${h}H ${m}M`;
        elCount.style.color = (h === 0 && m < 30) ? 'red' : 'var(--bistek-green)';
    } else { elCount.innerText = "FECHADO"; elCount.style.color = 'red'; }
}
setInterval(updateClock, 1000);

const slides = [{ src: '/static/ads/slide1.jpg', fallback: 'https://img.freepik.com/fotos-gratis/variedade-de-deliciosos-produtos-lacteos_23-2148995052.jpg', title: 'Festival de Laticínios', desc: 'Ofertas exclusivas no Clube Bistek' },{ src: '/static/ads/slide2.jpg', fallback: 'https://img.freepik.com/fotos-gratis/arranjo-de-carne-fresca_23-2148995029.jpg', title: 'Açougue Premium', desc: 'Cortes selecionados e maturados' },{ src: '/static/ads/slide3.jpg', fallback: 'https://img.freepik.com/fotos-gratis/fundo-de-vinho-elegante-com-garrafa_23-2147932637.jpg', title: 'Adega Bistek', desc: 'Os melhores vinhos para o seu jantar' }];
let currentSlideIndex = 0;
setInterval(() => {
    const img = document.getElementById('hero-image'); // Verifique se o ID no HTML é 'hero-image' ou 'ad-image'
    const titleEl = document.getElementById('hero-title');
    const descEl = document.getElementById('hero-desc'); // Se tiver descrição no HTML

    if(!img) return;

    // 1. Inicia o Fade Out (Some a imagem atual)
    img.style.opacity = 0;

    // 2. Espera 500ms (tempo da transição CSS) para trocar o conteúdo
    setTimeout(() => {
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        const item = slides[currentSlideIndex];

        // Define o que acontece quando a NOVA imagem terminar de baixar
        img.onload = function() {
            img.style.opacity = 1; // Só aparece agora que carregou!
        };

        // Tratamento de erro (Fallback)
        img.onerror = function() {
            this.src = item.fallback;
            // Se o fallback carregar, mostramos ele
            this.onload = function() { img.style.opacity = 1; };
        };

        // Troca os textos (pode ser instantâneo pois está invisível)
        if(titleEl) titleEl.innerText = item.title;
        if(descEl) descEl.innerText = item.desc;

        // Inicia o carregamento da nova imagem (isso dispara o onload acima)
        img.src = item.src;

    }, 500); // Tempo deve bater com o CSS transition

}, 5000);

const themes = ['green', 'red', 'purple'];
const bgs = ['image', 'clean', 'dark'];
let lt_idx = 0, lb_idx = 0;
function toggleLocalTheme() { lt_idx = (lt_idx + 1) % themes.length; applyStyle(themes[lt_idx], bgs[lb_idx]); }
function toggleLocalBg() { lb_idx = (lb_idx + 1) % bgs.length; applyStyle(themes[lt_idx], bgs[lb_idx]); }
function applyStyle(theme, bgMode) {
    const body = document.body;
    const container = document.getElementById('app-container');
    body.className = '';
    if (theme === 'red') body.classList.add('theme-red');
    if (theme === 'purple') body.classList.add('theme-purple');
    container.className = '';
    if (bgMode === 'clean') container.classList.add('bg-clean');
    if (bgMode === 'dark') container.classList.add('bg-dark');

}

function resizeAppSmart() {
    const app = document.getElementById('app-container');
    if (!app) return;
    const winW = window.innerWidth; const winH = window.innerHeight;
    let scale = Math.min((winW*0.95)/1280, (winH*0.95)/800);
    app.style.transform = `translate(-50%, -50%) scale(${Math.max(scale, 0.1)})`;
}
window.addEventListener('resize', resizeAppSmart);
window.addEventListener('load', resizeAppSmart);
initConnection();