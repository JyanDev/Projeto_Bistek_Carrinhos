import pygame
import json
import sys

# --- CONFIGURAÇÕES ---
SCREEN_WIDTH = 1200
SCREEN_HEIGHT = 750 # Aumentei um pouco
TILE_SIZE = 40
GRID_WIDTH = SCREEN_WIDTH // TILE_SIZE
GRID_HEIGHT = SCREEN_HEIGHT // TILE_SIZE

# Cores
COLOR_BG = (30, 30, 30)
COLOR_GRID = (50, 50, 50)
COLOR_WALL = (100, 100, 100)
COLOR_FLOOR = (255, 255, 255)
COLOR_BEACON = (0, 200, 255)
COLOR_ZONE = (148, 0, 211, 100) # Roxo Translúcido (Alpha)
COLOR_TEXT = (255, 255, 0)

# Tipos
TYPE_EMPTY = 0
TYPE_WALL = 1
TYPE_FLOOR = 2
TYPE_BEACON = 3
# Zonas são uma propriedade extra, não um tipo de bloco

class MapBuilderV3:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Bistek Map Builder V3 - Zone Painter")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("Arial", 16)

        # Grid agora armazena o tipo E o ID da zona
        self.grid = [[{"type": TYPE_EMPTY, "zone_id": 0} for _ in range(GRID_HEIGHT)] for _ in range(GRID_WIDTH)]

        self.current_tool = TYPE_WALL
        self.current_zone_id = 1
        self.zone_history = [] # Para o CTRL+Z (armazena lista de celulas modificadas)
        self.temp_cells = []   # Celulas sendo pintadas agora antes do ENTER
        self.running = True

    def draw_grid(self):
        self.screen.fill(COLOR_BG)

        for x in range(GRID_WIDTH):
            for y in range(GRID_HEIGHT):
                rect = pygame.Rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
                cell = self.grid[x][y]

                # Desenha Tipos Base
                if cell["type"] == TYPE_WALL:
                    pygame.draw.rect(self.screen, COLOR_WALL, rect)
                elif cell["type"] == TYPE_FLOOR:
                    pygame.draw.rect(self.screen, COLOR_FLOOR, rect)
                elif cell["type"] == TYPE_BEACON:
                    pygame.draw.rect(self.screen, COLOR_BEACON, rect)
                    pygame.draw.circle(self.screen, (255, 255, 255), rect.center, 5)

                # Desenha Linhas
                pygame.draw.rect(self.screen, COLOR_GRID, rect, 1)

                # Desenha Zonas (Overlay Transparente)
                if cell["zone_id"] > 0:
                    s = pygame.Surface((TILE_SIZE, TILE_SIZE), pygame.SRCALPHA)
                    s.fill(COLOR_ZONE)
                    self.screen.blit(s, (x*TILE_SIZE, y*TILE_SIZE))
                    # Mostra o número da zona pequeno
                    num = self.font.render(str(cell["zone_id"]), True, (255, 255, 255))
                    self.screen.blit(num, (x*TILE_SIZE+10, y*TILE_SIZE+10))

        # Desenha células temporárias (antes do Enter)
        for cx, cy in self.temp_cells:
             s = pygame.Surface((TILE_SIZE, TILE_SIZE), pygame.SRCALPHA)
             s.fill((255, 0, 255, 150)) # Roxo mais claro
             self.screen.blit(s, (cx*TILE_SIZE, cy*TILE_SIZE))

    def save_map(self):
        filename = "loja_mapa_v3.json"
        data = {
            "dimensions": {"width": GRID_WIDTH, "height": GRID_HEIGHT},
            "tile_size": TILE_SIZE,
            "grid": self.grid
        }
        with open(filename, "w") as f:
            json.dump(data, f)
        print(f"✅ Mapa salvo com sucesso em: {filename}")

    def undo_zone(self):
        if self.zone_history:
            last_batch = self.zone_history.pop()
            # Reverte o ID da zona para 0 nessas células
            for x, y in last_batch:
                self.grid[x][y]["zone_id"] = 0
            if self.current_zone_id > 1:
                self.current_zone_id -= 1
            print("↺ Desfeito última zona.")

    def run(self):
        while self.running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT: self.running = False

                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_1: self.current_tool = TYPE_WALL
                    if event.key == pygame.K_2: self.current_tool = TYPE_FLOOR
                    if event.key == pygame.K_3: self.current_tool = TYPE_BEACON
                    if event.key == pygame.K_4: self.current_tool = 4 # Modo Zona
                    if event.key == pygame.K_s: self.save_map()

                    # Confirmar Zona (ENTER)
                    if event.key == pygame.K_RETURN and self.current_tool == 4:
                        if self.temp_cells:
                            # Comita as células temporárias para o grid
                            committed = []
                            for x, y in self.temp_cells:
                                self.grid[x][y]["zone_id"] = self.current_zone_id
                                committed.append((x, y))

                            self.zone_history.append(committed)
                            self.temp_cells = []
                            self.current_zone_id += 1
                            print(f"Zona {self.current_zone_id - 1} criada!")

                    # Desfazer (CTRL + Z)
                    if event.key == pygame.K_z and (pygame.key.get_mods() & pygame.KMOD_CTRL):
                        self.undo_zone()

            # Mouse Logic
            if pygame.mouse.get_pressed()[0]:
                mx, my = pygame.mouse.get_pos()
                gx, gy = mx // TILE_SIZE, my // TILE_SIZE

                if 0 <= gx < GRID_WIDTH and 0 <= gy < GRID_HEIGHT:
                    # Se for ferramenta de construção normal
                    if self.current_tool in [TYPE_WALL, TYPE_FLOOR, TYPE_BEACON]:
                        self.grid[gx][gy]["type"] = self.current_tool
                    # Se for ferramenta de ZONA
                    elif self.current_tool == 4:
                        if (gx, gy) not in self.temp_cells and self.grid[gx][gy]["zone_id"] == 0:
                            self.temp_cells.append((gx, gy))

            # Botão Direito (Apagar)
            if pygame.mouse.get_pressed()[2]:
                mx, my = pygame.mouse.get_pos()
                gx, gy = mx // TILE_SIZE, my // TILE_SIZE
                if 0 <= gx < GRID_WIDTH and 0 <= gy < GRID_HEIGHT:
                    if self.current_tool == 4:
                         if (gx, gy) in self.temp_cells: self.temp_cells.remove((gx, gy))
                    else:
                        self.grid[gx][gy]["type"] = TYPE_EMPTY
                        self.grid[gx][gy]["zone_id"] = 0

            self.draw_grid()

            # HUD
            tool_name = ["Vazio", "Parede", "Chão", "Beacon", f"ZONA #{self.current_zone_id} (Pinte e aperte ENTER)"][self.current_tool]
            if self.current_tool == 4 and not self.temp_cells: tool_name += " - Aguardando pintura..."

            text = self.font.render(f"Ferramenta: {tool_name} | S: Salvar | Ctrl+Z: Desfazer Zona", True, COLOR_TEXT)
            self.screen.blit(text, (10, 10))
            pygame.display.flip()
            self.clock.tick(60)

if __name__ == "__main__":
    MapBuilderV3().run()