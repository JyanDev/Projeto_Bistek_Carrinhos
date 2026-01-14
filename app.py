from flask import Flask, render_template, jsonify, request
from gps_engine import GPSEngine
import json
import random
import time
import sys
import subprocess
from threading import Thread

app = Flask(__name__)

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

# --- TÚNEL HÍBRIDO ---
def start_tunnel():
    print("🚇 Iniciando Túnel Cloudflare...")
    time.sleep(3)
    try:
        subprocess.Popen(["cloudflared", "tunnel", "--url", "http://localhost:5000"])
    except:
        print("⚠️ Cloudflared não encontrado. Rodando local.")

engine = GPSEngine()
cart_state = {
    "user": None,
    "cart_items": [],
    "total": 0.00,
    "theme": "green"
}

@app.route('/')
def tablet_view(): return render_template('tablet.html')

@app.route('/controle')
def remote_view(): return render_template('remote.html')

# --- API: CADASTRO ---
@app.route('/api/register', methods=['POST'])
def register_user():
    global DB
    data = request.json
    cpf_clean = data.get('cpf', '').replace('.', '').replace('-', '')
    nome = data.get('nome')
    is_employee = data.get('is_employee')

    if cpf_clean in DB["users"]:
        return jsonify({"success": False, "message": "CPF já cadastrado."})

    # Define o tipo de usuário
    user_type = "cliente"
    if is_employee:
        cargo = data.get('cargo', 'Funcionário')
        matricula = data.get('matricula', '')
        user_type = f"Funcionário - {cargo} (Mat: {matricula})"

    # Cria e Salva
    new_user = {"nome": nome, "tipo": user_type}
    DB["users"][cpf_clean] = new_user

    if save_db(DB):
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "message": "Erro ao gravar no banco."})

# --- API: LOGIN ---
@app.route('/api/login', methods=['POST'])
def login():
    global DB
    DB = load_db()

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
        # Admin também zera pra começar limpo
        cart_state["cart_items"] = []
        cart_state["total"] = 0.00

        cart_state['user'] = DB["users"].get("admin", {"nome": "Admin", "tipo": "admin"})
        return jsonify({"success": True, "user": cart_state['user']})
    else:
        return jsonify({"success": False})
# --- OUTRAS ROTAS (Cart, Move, Status) ---
@app.route('/api/status')
def get_status():
    info = engine.get_info()
    return jsonify({
        "pos_x": engine.player_rect.centerx,
        "pos_y": engine.player_rect.centery,
        "setor": info["setor"],
        "oferta": info["oferta"],
        "theme": cart_state["theme"],
        "cart": cart_state["cart_items"],
        "total": cart_state["total"],
        "user": cart_state["user"]
    })

@app.route('/api/cart/add_random', methods=['POST'])
def add_random_item():
    if not DB["products"]: return jsonify({"error": "Vazio"})
    p = random.choice(DB["products"])
    item = {"id": int(time.time()*1000), "nome": p["nome"], "preco": p["preco"], "icon": p.get("icon", "shopping_bag")}
    cart_state["cart_items"].append(item)
    cart_state["total"] += item["preco"]
    return jsonify({"success": True})

@app.route('/api/cart/remove', methods=['POST'])
def remove_item():
    item_id = request.json.get('id')
    for i, item in enumerate(cart_state["cart_items"]):
        if item["id"] == item_id:
            cart_state["total"] -= item["preco"]
            cart_state["cart_items"].pop(i)
            break
    return jsonify({"success": True})

@app.route('/api/move', methods=['POST'])
def move_cart():
    d = request.json.get('direction')
    keys = {"UP": d=="up", "DOWN": d=="down", "LEFT": d=="left", "RIGHT": d=="right"}
    engine.update_manual(keys)
    return jsonify({"status": "moved"})

@app.route('/api/toggle_theme', methods=['POST'])
def toggle_theme():
    cart_state["theme"] = "red" if cart_state["theme"] == "green" else "green"
    return jsonify({"theme": cart_state["theme"]})

@app.route('/api/mapa')
def get_map_data():
    return jsonify({"grid": engine.grid, "width": engine.grid_w, "height": engine.grid_h, "tile_size": 30})

@app.route('/reset_posicao')
def reset_posicao():
    # Zera para a entrada da loja (ajuste o X,Y conforme seu mapa)
    gps_engine.posicao_atual = [50, 50]
    gps_engine.rota_calculada = []
    return jsonify({"status": "resetado"})
@app.route('/modo_demo')
def modo_demo():
    # Define uma rota fixa bonita que passa por 3 corredores
    rota_bonita = [[50,50], [100,50], [100, 200], [300, 200]]
    gps_engine.rota_calculada = rota_bonita
    return jsonify({"status": "demo iniciada"})
if __name__ == '__main__':
    Thread(target=start_tunnel).start()
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)