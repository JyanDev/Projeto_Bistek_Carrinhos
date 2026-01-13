import pygame
import json
import math

# Configurações do Motor Físico
TILE_SIZE = 30
COLOR_WALL = (60, 60, 60)
COLOR_FLOOR = (230, 230, 230)
COLOR_BEACON = (0, 150, 255)
COLOR_PLAYER = (255, 50, 50)

# Backend Simulado
DB_PROMOCOES = {
    0: {"setor": "Corredor Geral", "oferta": "Bem-vindo ao Bistek!"},
    1: {"setor": "Adega & Destilados", "oferta": " Vinhos Chilenos - 2ª unidade com 50% OFF"},
    2: {"setor": "Bebidas Geladas", "oferta": " Água da Pedra - 12 un por R$ 19,90"},
    3: {"setor": "Bazar", "oferta": " Taças VDRID com 30% OFF"},
    4: {"setor": "Laticínios", "oferta": " Leite Desnatado - 20% OFF"},
    5: {"setor": "Pets", "oferta": " Whiskas Sachê - Leve 3 Pague 2"},
    6: {"setor": "Padaria", "oferta": "Combo Café + Pão - R$ 19,90"},
    7: {"setor": "Açougue", "oferta": "Picanha Maturada - R$ 49,90/kg"},
    8: {"setor": "Higiene", "oferta": "Sabonetes - Leve 3 Pague 2"},
    9: {"setor": "Limpeza", "oferta": "Veja 2L - 5% OFF (Clube)"},
    10: {"setor": "Grãos", "oferta": "Feijão Namorados - 70% OFF"},
    11: {"setor": "Hortifruti", "oferta": " Quarta Verde - 20% OFF"},
    12: {"setor": "Floricultura", "oferta": " Sem ofertas hoje."},
}

class GPSEngine:
    def __init__(self):
        self.load_map()
        self.scan_beacons()

        # Player Setup
        self.player_rect = pygame.Rect(0, 0, 20, 20)
        start_pos = self.find_start_pos()
        self.player_rect.center = start_pos
        self.player_speed = 5

        # Estado
        self.current_zone_id = 0
        self.connected_beacon = False
        self.signal_radius = 4 * TILE_SIZE
        self.walls = []
        self.build_walls()
    def update_manual(self, keys_dict):
        """
        Versão do update que aceita um dicionário simples em vez de pygame.key.get_pressed()
        keys_dict espera: {"UP": bool, "DOWN": bool, "LEFT": bool, "RIGHT": bool}
        """
        mx, my = 0, 0

        # A velocidade aqui pode ser ajustada. Como o celular manda um pulso,
        # talvez seja bom mover um pouco mais por clique (ex: self.player_speed * 2)
        speed = self.player_speed * 1 # Aumentei para ficar mais responsivo no toque

        if keys_dict.get("UP"): my = -speed
        if keys_dict.get("DOWN"): my = speed
        if keys_dict.get("LEFT"): mx = -speed
        if keys_dict.get("RIGHT"): mx = speed

        # Lógica de Movimento e Colisão (Idêntica ao update original)
        if mx != 0:
            test_rect = self.player_rect.move(mx, 0)
            if not self.check_collision(test_rect): self.player_rect.move_ip(mx, 0)
        if my != 0:
            test_rect = self.player_rect.move(0, my)
            if not self.check_collision(test_rect): self.player_rect.move_ip(0, my)

        # Atualiza Sensores (Beacons e Zonas)
        px, py = self.player_rect.center

        # 1. Beacon Check
        near_beacon = False
        for bx, by in self.beacons:
            dist = math.hypot(bx-px, by-py)
            if dist < self.signal_radius:
                if self.raycast((px, py), (bx, by)):
                    near_beacon = True
                    break
        self.connected_beacon = near_beacon

        # 2. Zone Check
        gx, gy = int(px // TILE_SIZE), int(py // TILE_SIZE)
        if 0 <= gx < self.grid_w and 0 <= gy < self.grid_h:
            self.current_zone_id = self.grid[gx][gy].get("zone_id", 0)
    def load_map(self):
        try:
            fname = "loja_mapa_v3.json"
            try:
                f = open(fname, "r")
            except:
                f = open("loja_mapa.json", "r")
            data = json.load(f)
            self.grid = data["grid"]
            self.grid_w = data["dimensions"]["width"]
            self.grid_h = data["dimensions"]["height"]
            f.close()
        except Exception as e:
            print(f"Erro GPS: {e}")
            self.grid = []

    def scan_beacons(self):
        self.beacons = []
        for x in range(self.grid_w):
            for y in range(self.grid_h):
                if self.grid[x][y].get("type") == 3:
                    cx = x * TILE_SIZE + TILE_SIZE // 2
                    cy = y * TILE_SIZE + TILE_SIZE // 2
                    self.beacons.append((cx, cy))

    def find_start_pos(self):
        for x in range(self.grid_w):
            for y in range(self.grid_h):
                if self.grid[x][y].get("type") == 2:
                    return (x * TILE_SIZE + TILE_SIZE//2, y * TILE_SIZE + TILE_SIZE//2)
        return (100, 100)

    def build_walls(self):
        self.walls = []
        for x in range(self.grid_w):
            for y in range(self.grid_h):
                t = self.grid[x][y].get("type")
                if t == 1 or t == 3:
                    self.walls.append(pygame.Rect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE))

    def check_collision(self, rect):
        for wall in self.walls:
            if rect.colliderect(wall): return True
        return False

    def raycast(self, start, end):
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
                if self.grid[gx][gy].get("type") == 1:
                    return False
        return True

    def update(self, keys):
        # Movimentação baseada nas teclas passadas pela UI
        mx, my = 0, 0
        if keys[pygame.K_w] or keys[pygame.K_UP]: my = -self.player_speed
        if keys[pygame.K_s] or keys[pygame.K_DOWN]: my = self.player_speed
        if keys[pygame.K_a] or keys[pygame.K_LEFT]: mx = -self.player_speed
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]: mx = self.player_speed

        if mx != 0:
            test_rect = self.player_rect.move(mx, 0)
            if not self.check_collision(test_rect): self.player_rect.move_ip(mx, 0)
        if my != 0:
            test_rect = self.player_rect.move(0, my)
            if not self.check_collision(test_rect): self.player_rect.move_ip(0, my)

        # Lógica de Sensores
        px, py = self.player_rect.center

        # Beacon Check
        near_beacon = False
        for bx, by in self.beacons:
            dist = math.hypot(bx-px, by-py)
            if dist < self.signal_radius:
                if self.raycast((px, py), (bx, by)):
                    near_beacon = True
                    break
        self.connected_beacon = near_beacon

        # Zone Check
        gx, gy = int(px // TILE_SIZE), int(py // TILE_SIZE)
        if 0 <= gx < self.grid_w and 0 <= gy < self.grid_h:
            self.current_zone_id = self.grid[gx][gy].get("zone_id", 0)

    def get_info(self):
        """Retorna as informações para a UI exibir"""
        if self.connected_beacon and self.current_zone_id > 0:
            return DB_PROMOCOES.get(self.current_zone_id, DB_PROMOCOES[0])
        elif self.connected_beacon:
            return {"setor": "Corredor", "oferta": "Navegue para ver ofertas."}
        else:
            return {"setor": "Sem Sinal", "oferta": "Procurando conexão..."}

    def render_map_surface(self):
        """Desenha o mapa numa 'foto' para a UI usar como Mini-mapa"""
        w, h = self.grid_w * TILE_SIZE, self.grid_h * TILE_SIZE
        surf = pygame.Surface((w, h))
        surf.fill((30, 30, 30))

        for x in range(self.grid_w):
            for y in range(self.grid_h):
                cell = self.grid[x][y]
                rect = pygame.Rect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE)

                if cell.get("type") == 1: pygame.draw.rect(surf, COLOR_WALL, rect)
                elif cell.get("type") == 2: pygame.draw.rect(surf, COLOR_FLOOR, rect)
                elif cell.get("type") == 3:
                    pygame.draw.rect(surf, COLOR_WALL, rect)
                    pygame.draw.circle(surf, COLOR_BEACON, rect.center, 5)

                if cell.get("zone_id", 0) > 0:
                    s = pygame.Surface((TILE_SIZE, TILE_SIZE), pygame.SRCALPHA)
                    s.fill((148, 0, 211, 50))
                    surf.blit(s, (x*TILE_SIZE, y*TILE_SIZE))

        # Desenha Player
        pygame.draw.circle(surf, COLOR_PLAYER, self.player_rect.center, 8)

        return surf