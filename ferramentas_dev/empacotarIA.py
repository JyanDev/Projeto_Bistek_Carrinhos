import os

# --- CONFIGURAÇÕES ---
# Nome do arquivo final
OUTPUT_FILENAME = "PROJETO_COMPLETO_CONTEXTO.txt"

# Pastas que a gente NÃO quer ler (Lixo e configs)
IGNORE_DIRS = {
    'venv', 'venv_btcar', '__pycache__', '.git', '.idea', '.vscode', 'build', 'dist', 'node_modules'
}

# Tipos de arquivos que a gente QUER ler
INCLUDE_EXTS = {'.py', '.html', '.css', '.js', '.json', '.md', '.txt'}

# Arquivos específicos para ignorar
IGNORE_FILES = {
    OUTPUT_FILENAME,     # Não ler o próprio arquivo que estamos criando
    'empacotador.py',    # Não precisa ler este script
    'package-lock.json', # Geralmente é muito grande e inútil pra lógica
    '.DS_Store',
    'Thumbs.db'
}

def is_text_file(filepath):
    """Verifica pela extensão se é um arquivo de texto válido"""
    return any(filepath.endswith(ext) for ext in INCLUDE_EXTS)

def pack_project():
    print(f"📦 Iniciando empacotamento do projeto...")

    total_files = 0

    with open(OUTPUT_FILENAME, 'w', encoding='utf-8') as out:
        # Cabeçalho para a IA entender o contexto
        out.write("--- INICIO DO CONTEXTO DO PROJETO ---\n")
        out.write("Este arquivo contem todos os codigos fontes concatenados.\n")
        out.write("Formato:\n")
        out.write("=== ARQUIVO: [caminho] ===\n")
        out.write("[conteudo]\n\n")

        # Caminha por todas as pastas
        for root, dirs, files in os.walk("."):
            # Remove pastas ignoradas da busca (modifica a lista dirs in-place)
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for file in files:
                if file in IGNORE_FILES:
                    continue

                if not is_text_file(file):
                    continue

                filepath = os.path.join(root, file)

                # Normaliza o caminho para barras normais (melhor pra IA ler)
                clean_path = filepath.replace("\\", "/")
                if clean_path.startswith("./"):
                    clean_path = clean_path[2:]

                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()

                        # ESCREVE NO FORMATO OTIMIZADO
                        out.write(f"\n{'='*10} ARQUIVO: {clean_path} {'='*10}\n")
                        out.write(content)
                        out.write(f"\n\n")

                        print(f"✅ Adicionado: {clean_path}")
                        total_files += 1

                except Exception as e:
                    print(f"❌ Erro ao ler {clean_path}: {e}")

        out.write("\n--- FIM DO CONTEXTO DO PROJETO ---\n")

    print(f"\n✨ Sucesso! {total_files} arquivos empacotados em '{OUTPUT_FILENAME}'.")
    print("👉 Agora basta arrastar esse arquivo txt para o chat.")

if __name__ == "__main__":
    pack_project()