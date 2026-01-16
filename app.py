from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit
from gps_engine import GPSEngine
import json
import random
import time
import os
import subprocess
from threading import Thread, Lock

# Configuração Flask + SocketIO
app = Flask(__name__)
app.config['SECRET_KEY'] = 'bistek_secret'
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

# --- GERENCIAMENTO DE DADOS ---
def load_db():
    try:
        with open("database.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Erro ao ler DB: {e}")
        return {"users": {}, "products": []}

def save_db(data):
    try:
        with open("database.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"❌ Erro ao salvar DB: {e}")
        return False

DB = load_db()
engine = GPSEngine()

# --- CONFIGURAÇÃO: POSIÇÃO INICIAL / RESET ---
# Defina aqui o X e Y de onde o carrinho deve nascer (Entrada da Loja)
POSICAO_INICIAL = (200, 550)

# Estado Global
cart_state = {
    "user": None,
    "cart_items": [],
    "total": 0.00,
    "theme": "green",
    "moving": {"UP": False, "DOWN": False, "LEFT": False, "RIGHT": False},
    "drawings": [],
    "theme": "green",      # Opções: green, red, purple
    "bg_mode": "image"
}

thread = None
thread_lock = Lock()

# --- PHYSICS LOOP (Background) ---
def background_physics():
    while True:
        socketio.sleep(0.033) # 30 FPS

        # 1. Atualiza Física
        engine.update_manual(cart_state["moving"])

        # 2. Prepara Pacote
        info = engine.get_info()
        data_packet = {
            "pos_x": engine.player_rect.centerx,
            "pos_y": engine.player_rect.centery,
            "setor": info["setor"],
            "oferta": info["oferta"],
            "theme": cart_state["theme"],
            "cart": cart_state["cart_items"],
            "total": cart_state["total"],
            "user": cart_state["user"],
            "drawings": cart_state["drawings"],
            "theme": cart_state["theme"],
            "bg_mode": cart_state.get("bg_mode", "image")
        }

        # 3. Envia Broadcast
        socketio.emit('update_state', data_packet)

# --- ROTAS DE PÁGINAS ---

@app.route('/')
def tablet_view(): return render_template('tablet.html')

@app.route('/controle')
def remote_view(): return render_template('remote.html')

@app.route('/favicon.ico')
def favicon(): return "", 200 # Cala a boca do erro de favicon

# --- ROTAS HTTP (ESSENCIAIS RESTAURADAS) ---

@app.route('/api/login', methods=['POST'])
def login():
    global DB
    DB = load_db() # Recarrega para garantir
    data = request.json
    cpf_clean = data.get('cpf', '').replace('.', '').replace('-', '')

    user = DB["users"].get(cpf_clean)

    if user:
        # ZERA O CARRINHO AO TROCAR DE USUÁRIO
        cart_state["cart_items"] = []
        cart_state["total"] = 0.00
        cart_state['user'] = user
        cart_state['user']['cpf_display'] = cpf_clean
        return jsonify({"success": True, "user": user})
    elif cpf_clean.lower() == "admin":
        cart_state["cart_items"] = []
        cart_state["total"] = 0.00
        cart_state['user'] = DB["users"].get("admin", {"nome": "Admin", "tipo": "admin"})
        return jsonify({"success": True, "user": cart_state['user']})
    else:
        return jsonify({"success": False})

@app.route('/api/register', methods=['POST'])
def register_user():
    global DB
    data = request.json
    cpf_clean = data.get('cpf', '').replace('.', '').replace('-', '')
    nome = data.get('nome')
    is_employee = data.get('is_employee')

    if cpf_clean in DB["users"]:
        return jsonify({"success": False, "message": "CPF já cadastrado."})

    user_type = "cliente"
    if is_employee:
        cargo = data.get('cargo', 'Funcionário')
        matricula = data.get('matricula', '')
        user_type = f"Funcionário - {cargo} (Mat: {matricula})"

    new_user = {"nome": nome, "tipo": user_type}
    DB["users"][cpf_clean] = new_user

    if save_db(DB):
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "message": "Erro ao gravar."})

@app.route('/api/mapa')
def get_map_data():
    return jsonify({"grid": engine.grid, "width": engine.grid_w, "height": engine.grid_h, "tile_size": 30})


# --- EVENTOS SOCKET (Comandos) ---
@socketio.on('connect')
def test_connect():
    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(background_physics)
    print('🔌 Cliente Conectado!')

@socketio.on('input_change')
def handle_input(data):
    key = data.get('key')
    pressed = data.get('pressed')
    if key in cart_state["moving"]:
        cart_state["moving"][key] = pressed

@socketio.on('action_scan')
def handle_scan():
    if not DB["products"]: return
    p = random.choice(DB["products"])
    item = {"id": int(time.time()*1000), "nome": p["nome"], "preco": p["preco"], "icon": p.get("icon", "shopping_bag")}
    cart_state["cart_items"].append(item)
    cart_state["total"] += item["preco"]

@socketio.on('action_remove')
def handle_remove(data):
    item_id = data.get('id')
    for i, item in enumerate(cart_state["cart_items"]):
        if item["id"] == item_id:
            cart_state["total"] -= item["preco"]
            cart_state["cart_items"].pop(i)
            break

@socketio.on('action_reset')
def handle_reset():
    # Usa a variável que definimos lá em cima
    engine.player_rect.center = POSICAO_INICIAL
    cart_state["moving"] = {k:False for k in cart_state["moving"]}

@socketio.on('action_theme')
def handle_theme():
    cart_state["theme"] = "red" if cart_state["theme"] == "green" else "green"

# --- INICIALIZAÇÃO ---
def start_tunnel():
    print("🚇 Iniciando Túnel Cloudflare...")
    time.sleep(3)
    try:
        subprocess.Popen(["cloudflared", "tunnel", "--url", "http://localhost:5000"])
    except:
        print("⚠️ Cloudflared não encontrado.")
# NOVO: Alavanca de Fundo (Imagem vs Branco)
@socketio.on('action_cycle_theme')
def cycle_theme():
    # Ciclo: Green -> Red -> Purple -> Green
    modes = ['green', 'red', 'purple']
    current = cart_state['theme']
    try:
        next_idx = (modes.index(current) + 1) % len(modes)
    except:
        next_idx = 0
    cart_state['theme'] = modes[next_idx]

@socketio.on('action_cycle_bg')
def cycle_bg():
    # Ciclo: Image -> Clean -> Dark -> Image
    modes = ['image', 'clean', 'dark']
    current = cart_state['bg_mode']
    try:
        next_idx = (modes.index(current) + 1) % len(modes)
    except:
        next_idx = 0
    cart_state['bg_mode'] = modes[next_idx]
@socketio.on('draw_add')
def handle_draw_add(data):
    """Recebe: {'x': 10, 'y': 20, 'color': '#ff0000'}"""
    # Adiciona na lista global para mandar para o Tablet
    cart_state["drawings"].append(data)

@socketio.on('draw_clear')
def handle_draw_clear():
    """Apaga todos os desenhos (Botão Borracha)"""
    cart_state["drawings"] = []

if __name__ == '__main__':
    Thread(target=start_tunnel).start()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)