import pygame
import sys
import datetime
from gps_engine import GPSEngine

# --- CONFIGURAÇÕES DE UI ---
SCREEN_WIDTH = 1250
SCREEN_HEIGHT = 650
COLOR_BG = (240, 240, 240)
COLOR_HEADER = (255, 255, 255)
COLOR_TEXT_DARK = (50, 50, 50)
COLOR_ACCENT = (200, 50, 50) # Vermelho Bistek
COLOR_BTN = (0, 150, 0)

# Estados da Aplicação
STATE_LOGIN = 1
STATE_DASHBOARD = 2

# Lista de Compras Mockada
SHOPPING_LIST = [
    {"item": "Arroz Tio João 5kg", "qtd": 1, "price": 28.90},
    {"item": "Feijão Preto 1kg", "qtd": 2, "price": 8.50},
    {"item": "Azeite Gallo 500ml", "qtd": 1, "price": 42.00},
    {"item": "Coca-Cola 2L", "qtd": 3, "price": 9.99},
    {"item": "Sabão em Pó Omo", "qtd": 1, "price": 35.90},
    {"item": "Leite Integral CX", "qtd": 12, "price": 4.59},
]

class SmartCartUI:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Bistek Tablet OS v1.0")
        self.clock = pygame.time.Clock()

        # Fontes
        self.font_big = pygame.font.SysFont("Arial", 28, bold=True)
        self.font_med = pygame.font.SysFont("Arial", 20)
        self.font_small = pygame.font.SysFont("Arial", 16)

        # Inicializa GPS Engine
        self.gps = GPSEngine()

        # Variáveis de Estado
        self.state = STATE_LOGIN
        self.user_name = ""
        self.input_cpf = ""
        self.map_expanded = False

        # Layout Rects
        self.btn_aux_rect = pygame.Rect(SCREEN_WIDTH - 350, SCREEN_HEIGHT - 200, 330, 80)
        self.minimap_rect = pygame.Rect(SCREEN_WIDTH - 220, 20, 200, 150) # Canto superior direito

    def get_date_string(self):
        now = datetime.datetime.now()
        return now.strftime("%d/%m/%Y | %H:%M")

    def draw_login(self):
        self.screen.fill((200, 50, 50)) # Fundo Vermelho Bistek

        # Box Central
        center_x = SCREEN_WIDTH // 2
        center_y = SCREEN_HEIGHT // 2
        panel = pygame.Rect(center_x - 200, center_y - 150, 400, 300)
        pygame.draw.rect(self.screen, (255, 255, 255), panel, border_radius=15)

        # Título
        title = self.font_big.render("CLUBE BISTEK", True, COLOR_ACCENT)
        self.screen.blit(title, (center_x - title.get_width()//2, panel.y + 30))

        # Input CPF
        lbl = self.font_small.render("Digite seu CPF (ou 'admin'):", True, (100, 100, 100))
        self.screen.blit(lbl, (panel.x + 40, panel.y + 100))

        # Caixa de Texto
        pygame.draw.rect(self.screen, (230, 230, 230), (panel.x + 40, panel.y + 130, 320, 40), border_radius=5)
        txt_surf = self.font_med.render(self.input_cpf, True, (0, 0, 0))
        self.screen.blit(txt_surf, (panel.x + 50, panel.y + 140))

        # Botão Entrar
        btn_rect = pygame.Rect(panel.x + 40, panel.y + 200, 320, 50)
        pygame.draw.rect(self.screen, COLOR_BTN, btn_rect, border_radius=5)
        btn_lbl = self.font_med.render("ACESSAR", True, (255, 255, 255))
        self.screen.blit(btn_lbl, (center_x - btn_lbl.get_width()//2, btn_rect.y + 15))

        # Instrução
        hint = self.font_small.render("Pressione ENTER para confirmar", True, (150, 150, 150))
        self.screen.blit(hint, (center_x - hint.get_width()//2, panel.bottom + 10))

    def draw_dashboard(self):
        self.screen.fill(COLOR_BG)

        # --- COLUNA ESQUERDA: LISTA DE COMPRAS ---
        list_width = SCREEN_WIDTH * 0.6
        pygame.draw.rect(self.screen, (255, 255, 255), (20, 20, list_width, SCREEN_HEIGHT - 100), border_radius=10)

        # Cabeçalho da Lista
        headers = ["PRODUTO", "QTD", "UNIT (R$)", "TOTAL (R$)"]
        x_positions = [40, 400, 500, 650]
        for i, h in enumerate(headers):
            surf = self.font_small.render(h, True, (150, 150, 150))
            self.screen.blit(surf, (x_positions[i], 40))

        pygame.draw.line(self.screen, (230, 230, 230), (20, 70), (20 + list_width, 70), 2)

        # Itens
        y_pos = 90
        subtotal = 0
        for item in SHOPPING_LIST:
            total_item = item["qtd"] * item["price"]
            subtotal += total_item

            self.screen.blit(self.font_med.render(item["item"][:30], True, (0,0,0)), (x_positions[0], y_pos))
            self.screen.blit(self.font_med.render(str(item["qtd"]), True, (0,0,0)), (x_positions[1], y_pos))
            self.screen.blit(self.font_med.render(f"{item['price']:.2f}", True, (0,0,0)), (x_positions[2], y_pos))
            self.screen.blit(self.font_med.render(f"{total_item:.2f}", True, (0,0,0)), (x_positions[3], y_pos))
            y_pos += 40

        # Subtotal
        pygame.draw.rect(self.screen, (240, 240, 240), (20, SCREEN_HEIGHT - 180, list_width, 80), border_radius=0)
        lbl_sub = self.font_big.render("SUBTOTAL:", True, COLOR_ACCENT)
        val_sub = self.font_big.render(f"R$ {subtotal:.2f}", True, COLOR_ACCENT)
        self.screen.blit(lbl_sub, (40, SCREEN_HEIGHT - 150))
        self.screen.blit(val_sub, (list_width - 200, SCREEN_HEIGHT - 150))

        # --- COLUNA DIREITA: GPS & INFO ---
        # Oferta Dinâmica
        gps_info = self.gps.get_info()

        offer_rect = pygame.Rect(list_width + 40, 200, 420, 200)
        pygame.draw.rect(self.screen, (255, 255, 220), offer_rect, border_radius=10)
        pygame.draw.rect(self.screen, (200, 150, 0), offer_rect, 2, border_radius=10)

        # Texto da Oferta
        lbl_loc = self.font_small.render(" LOCALIZAÇÃO ATUAL:", True, (100, 100, 100))
        self.screen.blit(lbl_loc, (offer_rect.x + 20, offer_rect.y + 20))

        txt_setor = self.font_big.render(gps_info["setor"], True, (0, 0, 0))
        self.screen.blit(txt_setor, (offer_rect.x + 20, offer_rect.y + 45))

        # Quebra de linha da oferta
        words = gps_info["oferta"].split(" ")
        line = ""
        ty = offer_rect.y + 90
        for word in words:
            test = line + word + " "
            if self.font_med.size(test)[0] < 380:
                line = test
            else:
                self.screen.blit(self.font_med.render(line, True, COLOR_ACCENT), (offer_rect.x + 20, ty))
                line = word + " "
                ty += 25
        self.screen.blit(self.font_med.render(line, True, COLOR_ACCENT), (offer_rect.x + 20, ty))

        # Botão Auxiliares
        pygame.draw.rect(self.screen, (100, 100, 200), self.btn_aux_rect, border_radius=10)
        btn_txt = self.font_big.render(" Auxiliares", True, (255, 255, 255))
        self.screen.blit(btn_txt, (self.btn_aux_rect.centerx - btn_txt.get_width()//2, self.btn_aux_rect.centery - 10))

        # --- FOOTER ---
        pygame.draw.rect(self.screen, (30, 30, 30), (0, SCREEN_HEIGHT - 60, SCREEN_WIDTH, 60))

        # Info Cliente
        cpf_mask = "***.***.***-**" if self.user_name != "Jyan S." else "000.000.000-00 (ADMIN)"
        user_info = f"CLIENTE: {self.user_name}  |  CPF: {cpf_mask}"
        surf_user = self.font_med.render(user_info, True, (200, 200, 200))
        self.screen.blit(surf_user, (20, SCREEN_HEIGHT - 40))

        # Info Loja
        loja_info = f"{self.get_date_string()}  |  Aberto: 08:00 - 22:00"
        surf_loja = self.font_med.render(loja_info, True, (200, 200, 200))
        self.screen.blit(surf_loja, (SCREEN_WIDTH - surf_loja.get_width() - 20, SCREEN_HEIGHT - 40))

        # --- MINIMAPA ---
        # Pega a "foto" do motor GPS
        raw_map = self.gps.render_map_surface()

        if self.map_expanded:
            # Modo Tela Cheia (Overlay)
            overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 180)) # Escurece o fundo
            self.screen.blit(overlay, (0,0))

            # Mapa Grande Centralizado
            scale_w = SCREEN_WIDTH - 100
            scale_h = SCREEN_HEIGHT - 100
            scaled_map = pygame.transform.scale(raw_map, (scale_w, scale_h))
            map_rect = scaled_map.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2))

            # Moldura
            pygame.draw.rect(self.screen, (255, 255, 255), map_rect.inflate(20, 20), border_radius=10)
            self.screen.blit(scaled_map, map_rect)

            hint = self.font_med.render("Clique para Minimizar", True, (0,0,0))
            self.screen.blit(hint, (SCREEN_WIDTH//2 - hint.get_width()//2, map_rect.bottom + 15))

            self.expanded_rect = map_rect # Salva para checar clique depois

        else:
            # Modo Canto (Widget)
            scaled_map = pygame.transform.scale(raw_map, (self.minimap_rect.width, self.minimap_rect.height))

            # Moldura e Sombra
            shadow = pygame.Rect(self.minimap_rect.x+5, self.minimap_rect.y+5, self.minimap_rect.width, self.minimap_rect.height)
            pygame.draw.rect(self.screen, (100, 100, 100), shadow, border_radius=10)
            pygame.draw.rect(self.screen, (255, 255, 255), self.minimap_rect, border_radius=10)

            # Clipando o mapa nas bordas arredondadas (truque visual simples: desenha por cima)
            self.screen.blit(scaled_map, self.minimap_rect)
            pygame.draw.rect(self.screen, (200, 50, 50), self.minimap_rect, 3, border_radius=10) # Borda

            lbl_map = self.font_tag = pygame.font.SysFont("Arial", 12, bold=True).render("MAPA (Clique)", True, (255,255,255))
            pygame.draw.rect(self.screen, (200, 50, 50), (self.minimap_rect.x, self.minimap_rect.bottom - 20, self.minimap_rect.width, 20), border_bottom_left_radius=10, border_bottom_right_radius=10)
            self.screen.blit(lbl_map, (self.minimap_rect.centerx - lbl_map.get_width()//2, self.minimap_rect.bottom - 18))

    def run(self):
        while True:
            # --- INPUT HANDLER ---
            events = pygame.event.get()
            for event in events:
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()

                # Input Login
                if self.state == STATE_LOGIN:
                    if event.type == pygame.KEYDOWN:
                        if event.key == pygame.K_BACKSPACE:
                            self.input_cpf = self.input_cpf[:-1]
                        elif event.key == pygame.K_RETURN:
                            # Lógica de Login
                            if self.input_cpf.lower() == "admin":
                                self.user_name = "Jyan S."
                            else:
                                self.user_name = "Cliente Clube"
                            self.state = STATE_DASHBOARD
                        else:
                            if len(self.input_cpf) < 15:
                                self.input_cpf += event.unicode

                # Input Dashboard
                elif self.state == STATE_DASHBOARD:
                    if event.type == pygame.MOUSEBUTTONDOWN:
                        mx, my = pygame.mouse.get_pos()

                        if self.map_expanded:
                            # Se clicar em qualquer lugar fecha
                            self.map_expanded = False
                        else:
                            # Verifica clique no Minimapa
                            if self.minimap_rect.collidepoint(mx, my):
                                self.map_expanded = True

                            # Verifica clique no Botão Auxiliar
                            if self.btn_aux_rect.collidepoint(mx, my):
                                print("Abrir menu auxiliar...") # Futuro popup

            # --- UPDATE ---
            if self.state == STATE_DASHBOARD:
                # Passa o controle do teclado para o motor GPS mesmo desenhando a UI
                keys = pygame.key.get_pressed()
                self.gps.update(keys)

            # --- DRAW ---
            if self.state == STATE_LOGIN:
                self.draw_login()
            else:
                self.draw_dashboard()

            pygame.display.flip()
            self.clock.tick(60)

if __name__ == "__main__":
    app = SmartCartUI()
    app.run()