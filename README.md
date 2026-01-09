# 🛒 Bistek Smart Cart - Indoor Location Engine (PoC)

> **Protótipo de Software para Carrinhos Inteligentes com Geolocalização Indoor**
> *Projeto de Inovação / Intraempreendedorismo - Desenvolvido por Jyan Jagielo*

## 🎯 Objetivo do Projeto
Este projeto é uma **Prova de Conceito (PoC)** desenvolvida para demonstrar a viabilidade técnica de um sistema de "Carrinho Inteligente" (Smart Cart) de baixo custo.

O objetivo é solucionar dois grandes desafios do varejo físico:
1.  **Melhorar a Experiência do Cliente (CX):** Oferecendo soma em tempo real e localização de produtos.
2.  **Marketing Contextual:** Disparar ofertas baseadas na localização exata do cliente dentro da loja (ex: Oferta de vinhos ao entrar na Adega).

## 💡 O Diferencial Técnico
Diferente de soluções que exigem hardware caro ou GPS (que não funciona bem em locais fechados), este motor utiliza um **Algoritmo de Grade (Tilemap) + Beacons Virtuais**.

O software simula a triangulação de sinal para identificar em qual corredor o cliente está, disparando eventos na interface do tablet acoplado ao carrinho.

## 🛠️ Tecnologias Utilizadas
* **Linguagem:** Python 3
* **Engine Gráfica:** Pygame (para simulação física e renderização de UI)
* **Estrutura de Dados:** JSON (armazenamento de mapas e layouts de loja)
* **Arquitetura:** Separação completa entre *Backend Lógico* (Physics Engine) e *Frontend* (Tablet UI).

## 📂 Estrutura do Projeto

### 1. `mapa_build.py` (O Construtor)
Uma ferramenta visual desenvolvida para desenhar o layout da loja.
* Permite "pintar" paredes, corredores e posicionar Beacons.
* Sistema de **Zonas de Gatilho**: O usuário define áreas lógicas (ex: Zona 3 = Padaria) e salva em JSON.
* Funcionalidades: Save/Load, Undo (Ctrl+Z) e Grid System.

### 2. `gps_engine.py` (O Motor Lógico)
O "cérebro" do sistema que roda em background.
* **Simulação de Sinal:** Calcula a distância entre o carrinho e os Beacons virtuais.
* **Raycasting:** Verifica se há paredes bloqueando o sinal (visada direta).
* **Triggers:** Cruza a posição (X, Y) do carrinho com o banco de dados de promoções.

### 3. `main_tablet.py` (A Interface do Cliente)
Simula a tela touch que o cliente veria no carrinho.
* **Dashboard:** Lista de compras e subtotal em tempo real.
* **Smart Alerts:** Pop-ups de ofertas que mudam automaticamente conforme o cliente "anda" pela loja virtual.
* **Mini-Mapa:** Visualização em tempo real da posição na loja.

## 🚀 Como Executar

### Pré-requisitos
Ter o Python instalado e a biblioteca Pygame:
```bash
pip install pygame
```
### Passo 1: Criar o Mapa (Opcional)
Se quiser desenhar sua própria loja:
```bash
python mapa_build.py
```
Use o mouse para desenhar e ENTER para confirmar zonas. Pressione 'S' para salvar o loja_mapa_v3.json.

### Passo 2: Rodar a Simulação
Para iniciar o sistema do carrinho:

```bash
python main_tablet.py
```
### Controles:
Use as setas do teclado (ou WASD) para mover o "carrinho" pela loja e veja a interface reagir às mudanças de corredor.

### Login Admin: Digite admin no CPF para ver o modo debug.


Desenvolvido com foco em inovação para o varejo.