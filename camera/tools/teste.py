import socket
import time

# Configurações obtidas na engenharia reversa do app e tráfego
SERVER_IP = "152.32.197.30"
PORT = 6611

# 1. Token de Handshake Base64 extraído do seu dump de rede
TOKEN_BASE64 = b"YWFhYWFhYWEtMWEwYTM0YWQ4OmNfYmVpMHhlNWJsd2R3bnp3N2hndGptbzJ4OmQyNGJkYWNhZDFkODVlZGM2cm5iOmFrMWsyYThmcjVrcmJyMW1yNGVrZzF0bXU5d2Znb2I2XXEE"
HANDSHAKE_PACKET = TOKEN_BASE64 + b"XXEE"

def build_netip_packet(json_payload):
    """
    Monta o cabeçalho NetIP clássico de 20 bytes exigido pela plataforma Xiongmai.
    A análise do tráfego demonstrou dados em texto plano após o cabeçalho binário.
    """
    payload_bytes = json_payload.encode('utf-8')
    payload_len = len(payload_bytes)
    
    # Estrutura padrão do cabeçalho NetIP:
    # 0xff (Sinalizador), 0x00, 0x00, 0x00, SessionID (tratado de forma simplificada), etc.
    header = bytearray(20)
    header[0] = 0xFF
    # Define o tamanho do payload nos bytes de tamanho do cabeçalho (Little Endian)
    header[16] = payload_len & 0xFF
    header[17] = (payload_len >> 8) & 0xFF
    
    return bytes(header) + payload_bytes

def start_stream():
    # Criando o socket TCP e conectando ao servidor global
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((SERVER_IP, PORT))
    print("[+] Conectado ao servidor Tris Home.")
    
    # Passo 1: Enviar Handshake Inicial (Autenticação Base64 + XXEE)
    s.sendall(HANDSHAKE_PACKET)
    print("[+] Handshake inicial enviado.")
    
    # Aguarda e lê a resposta de roteamento da mídia
    response = s.recv(1024)
    print(f"[<-] Resposta do Servidor: {response.decode('utf-8', errors='ignore')}")
    
    # Passo 2: Estrutura exata extraída da sua captura para Live View (OPMonitor)
    # Substitua o SessionID pelo valor retornado de forma dinâmica ou utilize o capturado para testes rápidos
    live_view_json = '{"Name":"OPMonitor","OPMonitor":{"Action":"Claim","Parameter":{"Channel":0,"CombinMode":"CONNECT_ALL","StreamType":"Main","TransMode":"TCP"}},"DHParameter":{"RandomStrA":"4ht5"},"SessionID":"0x000001869f"}'
    
    # Constrói o pacote adicionando os 20 bytes obrigatórios do protocolo NetIP antes do JSON
    packet = build_netip_packet(live_view_json)
    
    print("[+] Solicitando transmissão de vídeo ao vivo (Live View)...")
    s.sendall(packet)
    
    # Passo 3: Gravação do fluxo de vídeo bruto recebido
    print("[+] Capturando frames H.264... Pressione Ctrl+C para encerrar.")
    with open("camera_stream.h264", "wb") as f:
        try:
            while True:
                data = s.recv(4096)
                if not data:
                    break
                # Escreve o binário recebido diretamente no arquivo de vídeo bruto
                f.write(data)
        except KeyboardInterrupt:
            print("\n[-] Captura interrompida pelo usuário.")
        finally:
            s.close()
            print("[+] Conexão encerrada. Arquivo 'camera_stream.h264' salvo.")

if __name__ == "__main__":
    start_stream()