import pygame
import json
import math
import sys

# --- CONFIGURAÇÕES ---
WINDOW_WIDTH = 1250
WINDOW_HEIGHT = 550
SIDEBAR_WIDTH = 350
TILE_SIZE = 30

# Cores
COLOR_BG = (20, 20, 20)
COLOR_WALL = (60, 60, 60)
COLOR_FLOOR = (230, 230, 230)
COLOR_BEACON = (0, 150, 255)
COLOR_PLAYER = (255, 50, 50)
COLOR_ZONE_DEBUG = (148, 0, 211) # Roxo para debug (opcional)

# --- BACKEND SIMULADO ---
# Aqui você cadastra o que cada zona pintada representa
DB_PROMOCOES = {
    0: {"setor": "Corredor Geral", "oferta": "Bem-vindo ao Bistek!"},
    1: {"setor": "Adega & Destilados", "oferta": "🍷 Vinhos Chilenos - 2ª unidade com 50% OFF"},
    2: {"setor": "Bebidas geladas & quentes ", "oferta": "Água da pedra - 12ª unidades por R$ 19,90"},
    3: {"setor": "Bazar", "oferta": "Taça e copos da marca VDRID com - 30% OFF"},
    4: {"setor": "laticínios", "oferta": "Leite desnatado - Tudo com 20% OFF"},
    5: {"setor": "Rações e pets", "oferta": "Leve 3 sachê pra gato, Pague 2"},
    6: {"setor": "Padaria & Matinais", "oferta": "🍞 Pão de Forma + Café - Combo R$ 19,90"},
    7: {"setor": "Açougue", "oferta": "🥩 Picanha Maturada - R$ 49,90/kg"},
    8: {"setor": "Higiene", "oferta": "🧼 Leve 3 Sabonetes, Pague 2"},
    9: {"setor": "Produtos de Limpeza", "oferta": "Veja 2L com 5% OFF pra clientes bistek clube"},
    10: {"setor": "Grãos e Massas", "oferta": "Feijão namorados - 70% OFF"},
    11: {"setor": "Hortifruti", "oferta": "🥦 Quarta Verde - Tudo com 20% OFF"},
    12: {"setor": "Floricultura", "oferta": "Sem ofertas neste corredor!"},
    # Adicione mais conforme você pintar (6, 7, 8...)
}

class SmartCartFinal:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("Bistek Smart Cart - Final Logic")
        self.clock = pygame.time.Clock()

        self.font_title = pygame.font.SysFont("Verdana", 20, bold=True)
        self.font_ui = pygame.font.SysFont("Verdana", 16)

        self.load_map()
        self.scan_beacons()

        # Player Setup
        self.player_rect = pygame.Rect(0, 0, 20, 20)
        start_pos = self.find_start_pos()
        self.player_rect.center = start_pos
        self.player_speed = 5

        # Lógica de Conexão
        self.signal_radius = 4 * TILE_SIZE # 4 Metros
        self.connected_beacon = None
        self.current_zone_id = 0

        # Margens Dinâmicas (Centralizar mapa na área esquerda)
        map_view_w = WINDOW_WIDTH - SIDEBAR_WIDTH
        self.offset_x = (map_view_w - (self.grid_w * TILE_SIZE)) // 2
        self.offset_y = (WINDOW_HEIGHT - (self.grid_h * TILE_SIZE)) // 2

        # Walls para colisão
        self.walls = []
        self.build_walls()

    def load_map(self):
        try:
            # Tenta carregar a versão V3, se não tiver, tenta a V1
            fname = "loja_mapa_v3.json"
            try:
                f = open(fname, "r")
            except:
                f = open("loja_mapa.json", "r")
                print("Aviso: Usando mapa antigo. Use o MapBuilderV3 para zonas.")

            data = json.load(f)
            self.grid = data["grid"]
            self.grid_w = data["dimensions"]["width"]
            self.grid_h = data["dimensions"]["height"]
            f.close()
        except Exception as e:
            print(f"Erro Crítico: {e}")
            sys.exit()

    def scan_beacons(self):
        self.beacons = []
        for x in range(self.grid_w):
            for y in range(self.grid_h):
                if self.grid[x][y].get("type") == 3: # TYPE_BEACON
                    # Posição central absoluta
                    cx = x * TILE_SIZE + TILE_SIZE // 2
                    cy = y * TILE_SIZE + TILE_SIZE // 2
                    self.beacons.append((cx, cy))

    def find_start_pos(self):
        for x in range(self.grid_w):
            for y in range(self.grid_h):
                if self.grid[x][y].get("type") == 2: # Floor
                    return (x * TILE_SIZE + TILE_SIZE//2, y * TILE_SIZE + TILE_SIZE//2)
        return (100, 100)

    def build_walls(self):
        self.walls = []
        for x in range(self.grid_w):
            for y in range(self.grid_h):
                t = self.grid[x][y].get("type")
                if t == 1 or t == 3: # Wall or Beacon
                    self.walls.append(pygame.Rect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE))

    def check_collision(self, rect):
        for wall in self.walls:
            if rect.colliderect(wall): return True
        return False

    def raycast(self, start, end):
        # Raycast simples para validar visibilidade do Beacon
        x1, y1 = start
        x2, y2 = end
        dist = math.hypot(x2-x1, y2-y1)
        if dist == 0: return True
        steps = int(dist / (TILE_SIZE/2))
        for i in range(steps):
            t = i / steps
            px = x1 + (x2-x1)*t
            py = y1 + (y2-y1)*t
            gx, gy = int(px//TILE_SIZE), int(py//TILE_SIZE)
            if 0 <= gx < self.grid_w and 0 <= gy < self.grid_h:
                if self.grid[gx][gy].get("type") == 1: # Wall blocks signal
                    return False
        return True

    def update(self):
        # 1. Movimento WASD
        keys = pygame.key.get_pressed()
        mx, my = 0, 0
        if keys[pygame.K_w] or keys[pygame.K_UP]: my = -self.player_speed
        if keys[pygame.K_s] or keys[pygame.K_DOWN]: my = self.player_speed
        if keys[pygame.K_a] or keys[pygame.K_LEFT]: mx = -self.player_speed
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]: mx = self.player_speed

        # Colisão X
        if mx != 0:
            test_rect = self.player_rect.move(mx, 0)
            if not self.check_collision(test_rect): self.player_rect.move_ip(mx, 0)
        # Colisão Y
        if my != 0:
            test_rect = self.player_rect.move(0, my)
            if not self.check_collision(test_rect): self.player_rect.move_ip(0, my)

        # 2. Lógica de Localização Híbrida
        px, py = self.player_rect.center

        # A) Detectar Beacon (Hardware Trigger)
        near_beacon = False
        for bx, by in self.beacons:
            dist = math.hypot(bx-px, by-py)
            if dist < self.signal_radius:
                if self.raycast((px, py), (bx, by)):
                    near_beacon = True
                    break
        self.connected_beacon = near_beacon

        # B) Detectar Zona do Piso (Software Logic)
        gx, gy = int(px // TILE_SIZE), int(py // TILE_SIZE)
        if 0 <= gx < self.grid_w and 0 <= gy < self.grid_h:
            # Pega o ID da zona onde o jogador está pisando
            z_id = self.grid[gx][gy].get("zone_id", 0)
            self.current_zone_id = z_id

    def draw(self):
        self.screen.fill(COLOR_BG)

        # --- MAPA ---
        # Surface temporária para o mapa
        map_surf = pygame.Surface((self.grid_w*TILE_SIZE, self.grid_h*TILE_SIZE))
        map_surf.fill(COLOR_BG)

        for x in range(self.grid_w):
            for y in range(self.grid_h):
                rect = pygame.Rect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE)
                cell = self.grid[x][y]

                # Desenha chão/parede
                if cell.get("type") == 1: pygame.draw.rect(map_surf, COLOR_WALL, rect)
                elif cell.get("type") == 2: pygame.draw.rect(map_surf, COLOR_FLOOR, rect)
                elif cell.get("type") == 3:
                    pygame.draw.rect(map_surf, COLOR_WALL, rect)
                    color = (0, 255, 0) if self.connected_beacon else COLOR_BEACON
                    pygame.draw.circle(map_surf, color, rect.center, 6)

                # Debug: Mostra zona pintada bem fraquinho
                if cell.get("zone_id", 0) > 0:
                    s = pygame.Surface((TILE_SIZE, TILE_SIZE), pygame.SRCALPHA)
                    s.fill((148, 0, 211, 40))
                    map_surf.blit(s, (x*TILE_SIZE, y*TILE_SIZE))

        # Desenha Player
        px, py = self.player_rect.center
        pygame.draw.circle(map_surf, (0,0,0), (px, py), 12)
        pygame.draw.circle(map_surf, COLOR_PLAYER, (px, py), 10)

        # Blit Centralizado
        self.screen.blit(map_surf, (self.offset_x, self.offset_y))

        # --- UI LATERAL ---
        ui_x = WINDOW_WIDTH - SIDEBAR_WIDTH
        pygame.draw.rect(self.screen, (245, 245, 245), (ui_x, 0, SIDEBAR_WIDTH, WINDOW_HEIGHT))
        pygame.draw.line(self.screen, (200, 200, 200), (ui_x, 0), (ui_x, WINDOW_HEIGHT), 2)

        # Conteúdo
        margin = 25
        y_cursor = 50

        title = self.font_title.render("🛒 BISTEK SCAN & GO", True, (0, 100, 0))
        self.screen.blit(title, (ui_x + margin, y_cursor))
        y_cursor += 50

        # Lógica de Display
        # Só mostra oferta se tiver Conexão com Beacon E estiver numa Zona válida
        if self.connected_beacon and self.current_zone_id > 0:
            data = DB_PROMOCOES.get(self.current_zone_id, DB_PROMOCOES[0])

            # Card Setor
            pygame.draw.rect(self.screen, (255, 255, 255), (ui_x + margin, y_cursor, SIDEBAR_WIDTH - 50, 100), border_radius=10)
            pygame.draw.rect(self.screen, (0, 150, 0), (ui_x + margin, y_cursor, SIDEBAR_WIDTH - 50, 100), 2, border_radius=10)

            lbl = self.font_ui.render("VOCÊ ESTÁ EM:", True, (100,100,100))
            val = self.font_title.render(data["setor"], True, (0,0,0))
            self.screen.blit(lbl, (ui_x + margin + 15, y_cursor + 15))
            self.screen.blit(val, (ui_x + margin + 15, y_cursor + 40))
            y_cursor += 120

            # Card Oferta
            pygame.draw.rect(self.screen, (255, 245, 200), (ui_x + margin, y_cursor, SIDEBAR_WIDTH - 50, 120), border_radius=10)

            # Word Wrap simples
            words = data["oferta"].split(" ")
            line = ""
            ty = y_cursor + 15
            for word in words:
                test = line + word + " "
                if self.font_title.size(test)[0] < SIDEBAR_WIDTH - 80:
                    line = test
                else:
                    self.screen.blit(self.font_title.render(line, True, (200, 50, 0)), (ui_x + margin + 15, ty))
                    line = word + " "
                    ty += 25
            self.screen.blit(self.font_title.render(line, True, (200, 50, 0)), (ui_x + margin + 15, ty))

            # Status Conexão
            y_cursor += 150
            status = self.font_ui.render("📡 Sinal Beacon: Forte", True, (0, 180, 0))
            self.screen.blit(status, (ui_x + margin, y_cursor))

        elif self.connected_beacon and self.current_zone_id == 0:
             # Perto do Beacon mas no corredor geral (sem zona pintada)
             lbl = self.font_ui.render("Navegando... Entre num corredor.", True, (100,100,100))
             self.screen.blit(lbl, (ui_x + margin, y_cursor))
        else:
             # Longe de tudo
             lbl = self.font_ui.render("Procurando sinal...", True, (150,150,150))
             self.screen.blit(lbl, (ui_x + margin, y_cursor))

        pygame.display.flip()

    def run(self):
        while True:
            for event in pygame.event.get():
                if event.type == pygame.QUIT: pygame.quit(); sys.exit()
            self.update()
            self.draw()
            self.clock.tick(60)

if __name__ == "__main__":
    SmartCartFinal().run()