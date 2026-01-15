import subprocess
import time
import re
import requests
import sys

# --- SUA CONFIGURAÇÃO ---
DISCORD_WEBHOOK = "https://ptb.discord.com/api/webhooks/1460514042513981440/xL_yANDF81MAzozHfFvWXH9twH-Db-NQCLd1xIJo_I8NXkJhCa11HBfMfADf1FIgEfoF"
# ------------------------

def get_tunnel_url():
    print("⏳ Aguardando 30s para o túnel iniciar...")
    time.sleep(30)

    try:
        # Pega as últimas 100 linhas
        cmd = ['journalctl', '-u', 'bistek', '-n', '100', '--no-pager']
        result = subprocess.check_output(cmd, text=True)

        # Encontra TODOS os links .trycloudflare.com
        urls_encontradas = re.findall(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', result)

        # Procura o link certo (que NÃO seja api)
        for url in urls_encontradas:
            if "api.trycloudflare.com" not in url:
                return url

        return None

    except Exception as e:
        print(f"Erro ao ler logs: {e}")
        return None


def send_discord(url_publica):
    data = {
        "content": "@here 🛒 **O Clube Bistek está Online!**",
        "embeds": [{
            "title": "Acesse o Tablet Agora",
            "description": f"🔗 **Link Público:** {url_publica}\n\n🏠 **Link Local:** http://192.168.1.14:5000",
            "color": 13632027
        }]
    }
    try:
        requests.post(DISCORD_WEBHOOK, json=data)
        print("✅ Notificação enviada para o Discord!")
    except Exception as e:
        print(f"❌ Erro ao enviar pro Discord: {e}")

if __name__ == "__main__":
    link = get_tunnel_url()
    if link:
        print(f"🔗 Link encontrado: {link}")
        send_discord(link)
    else:
        print("❌ Nenhum link encontrado nos logs recentes.")
