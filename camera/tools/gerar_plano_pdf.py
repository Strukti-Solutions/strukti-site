# -*- coding: utf-8 -*-
"""Gera o PDF do plano do sistema de replay para quadras."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, ListFlowable, ListItem, HRFlowable)
import datetime

ACCENT = colors.HexColor("#2F6BFF")
DARK = colors.HexColor("#1A1D24")
MUT = colors.HexColor("#5B616E")
LINE = colors.HexColor("#D7DBE3")
SOFT = colors.HexColor("#F2F5FA")

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold",
                    fontSize=15, textColor=ACCENT, spaceBefore=16, spaceAfter=7, leading=19)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
                    fontSize=11.5, textColor=DARK, spaceBefore=9, spaceAfter=3, leading=15)
BODY = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica",
                      fontSize=10, textColor=DARK, leading=15, spaceAfter=5, alignment=TA_LEFT)
BULLET = ParagraphStyle("Bullet", parent=BODY, leftIndent=12, spaceAfter=3)
SMALL = ParagraphStyle("Small", parent=BODY, fontSize=8.5, textColor=MUT)
TITLE = ParagraphStyle("Title", parent=styles["Title"], fontName="Helvetica-Bold",
                       fontSize=24, textColor=DARK, leading=28, spaceAfter=4)
SUB = ParagraphStyle("Sub", parent=BODY, fontSize=12, textColor=MUT, spaceAfter=2)
CELL = ParagraphStyle("Cell", parent=BODY, fontSize=9, leading=13, spaceAfter=0)
CELLB = ParagraphStyle("CellB", parent=CELL, fontName="Helvetica-Bold")
CELLW = ParagraphStyle("CellW", parent=CELL, textColor=colors.white, fontName="Helvetica-Bold")


def P(t, s=BODY): return Paragraph(t, s)
def bullets(items):
    return ListFlowable([ListItem(P(i, BULLET), leftIndent=6, value="•") for i in items],
                        bulletType="bullet", start="•", leftIndent=8, spaceBefore=2, spaceAfter=6)

def table(data, col_widths, header=True):
    t = Table(data, colWidths=col_widths, hAlign="LEFT")
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SOFT]),
    ]
    if header:
        cmds += [("BACKGROUND", (0, 0), (-1, 0), DARK),
                 ("LINEBELOW", (0, 0), (-1, 0), 0.4, DARK)]
    t.setStyle(TableStyle(cmds))
    return t


def build():
    doc = SimpleDocTemplate("Plano_Replay_Quadras.pdf", pagesize=A4,
                            leftMargin=20*mm, rightMargin=20*mm,
                            topMargin=18*mm, bottomMargin=16*mm,
                            title="Sistema de Replay para Quadras Esportivas",
                            author="StrukTI")
    e = []

    # Capa / cabeçalho
    e.append(P("Sistema de Replay para Quadras Esportivas", TITLE))
    e.append(P("Plano de produto: arquitetura, custos, precificação e requisitos técnicos", SUB))
    e.append(Spacer(1, 4))
    e.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=8))
    e.append(P("StrukTI &nbsp;·&nbsp; " + datetime.date.today().strftime("%d/%m/%Y"), SMALL))
    e.append(Spacer(1, 6))
    e.append(P("<b>Conceito.</b> Ao acionar uma flag (botão físico na quadra ou comando virtual), "
               "os últimos 15 s (ou mais, configurável) de todas as câmeras são guardados e "
               "enviados ao cliente final ou a um app. Como o acesso via nuvem do fabricante é "
               "inviável (CGNAT + protocolo proprietário nativo), o modelo correto é <b>edge "
               "(processamento local na quadra)</b> — já validado neste projeto com acesso direto "
               "às câmeras na rede local.", BODY))

    # 1
    e.append(P("1. A virada de chave no raciocínio", H1))
    e.append(P("<b>a) Trocar as câmeras XM/Inova para o produto.</b> Serviram para provar o conceito, "
               "mas têm três defeitos fatais em produção: um stream por vez, sem RTSP padrão e "
               "gravação presa na nuvem. Produtize em câmeras <b>RTSP/ONVIF</b> (H.264/H.265, "
               "com sub-stream e PoE). O cliente DVRIP já construído vira fallback.", BODY))
    e.append(P("<b>b) Não construir o buffer na mão.</b> O jeito profissional de guardar “os últimos "
               "15 s de tudo” é gravação contínua em anel com o <b>ffmpeg</b> (segmentos de 2–4 s, "
               "cópia sem recodificar, descartando os antigos). CPU baixíssima = muitas câmeras por "
               "caixa barata. No gatilho, apenas <b>concatena</b> os últimos segmentos.", BODY))
    e.append(P("<b>c) O produto é o APP e o “momento”, não a captura.</b> Captura é commodity "
               "(ffmpeg / MediaMTX / go2rtc / Frigate). O valor está na experiência: receber o "
               "replay em segundos, multi-ângulo, câmera lenta, pronto para postar.", BODY))

    # 2
    e.append(P("2. Arquitetura (edge → nuvem → app)", H1))
    flow = Table([[P("[Câmeras RTSP]", CELLB)], [P("↓ LAN", SMALL)],
                  [P("[Caixa Edge na quadra]  ← [Botão ESP32 Wi-Fi]", CELLB)],
                  [P("↓ internet", SMALL)],
                  [P("[Servidor / Nuvem]", CELLB)], [P("↓", SMALL)],
                  [P("[App do cliente final]", CELLB)]], colWidths=[150*mm])
    flow.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"),
                              ("BACKGROUND", (0, 0), (-1, -1), SOFT),
                              ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                              ("TOPPADDING", (0, 0), (-1, -1), 3),
                              ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    e.append(flow)
    e.append(Spacer(1, 6))
    e.append(P("<b>Edge (1 caixa por quadra/arena):</b>", H2))
    e.append(bullets([
        "Ingest RTSP das câmeras via <b>MediaMTX</b> ou <b>go2rtc</b> (restream + estabilidade).",
        "<b>Ring buffer</b>: ffmpeg grava segmentos (<i>-f segment -segment_time 2 -c copy</i>), mantendo só os últimos ~60 s.",
        "<b>Gatilho</b>: botão → ESP32 → <b>MQTT local (Mosquitto)</b> → serviço no edge.",
        "No gatilho: pega os últimos X s de cada câmera, gera MP4 (ou grade multi-ângulo / slow-mo) e enfileira o upload (resiliente, offline-first).",
    ]))
    e.append(P("<b>Nuvem:</b> API (auth + multi-tenant por arena/quadra), object storage "
               "(<b>Cloudflare R2 / Backblaze B2</b> — egress barato), fila e CDN. <b>App:</b> "
               "Flutter/React Native (ou PWA no MVP) para o cliente ver, baixar e compartilhar.", BODY))
    e.append(P("<b>Ponto mais difícil — “de quem é o replay?”</b> Como o clipe chega no jogador certo: "
               "QR na quadra escaneado no momento, vínculo com a reserva/agendamento da arena, ou "
               "código do botão. <b>Resolver cedo: é o coração da UX e da cobrança.</b>", BODY))

    # 3
    e.append(P("3. Requisitos técnicos", H1))
    e.append(table([
        [P("Camada", CELLW), P("Requisito", CELLW)],
        [P("Câmeras", CELLB), P("RTSP/ONVIF, H.264/H.265, main+sub-stream, 1080p30, FOV amplo, PoE. 2–4 por quadra (ângulos).", CELL)],
        [P("Edge", CELLB), P("Mini-PC Intel N100 (8 GB, SSD 256 GB) aguenta ~8–16 câmeras em cópia; Raspberry Pi 5 para 2–4. SSD (não SD) para buffer e fila.", CELL)],
        [P("Rede", CELLB), P("Switch PoE, Wi-Fi/LAN dedicado às câmeras. Upload: clipe de 15 s ≈ 5–30 MB/câmera — dimensionar a banda de subida.", CELL)],
        [P("Software", CELLB), P("MediaMTX/go2rtc (ingest), ffmpeg (anel + corte + concat), Mosquitto (MQTT), orquestrador (Python/Node), uploader com retry; backend (API + R2); app.", CELL)],
        [P("Confiabilidade", CELLB), P("Watchdog, reconexão automática de câmera, buffer sobrevive a reboot, fila offline. Fleet management (OTA/monitoramento) ao escalar.", CELL)],
        [P("Latência", CELLB), P("Do botão ao clipe pronto: segundos.", CELL)],
    ], [32*mm, 123*mm]))

    # 4
    e.append(P("4. Custos (estimativa, BRL)", H1))
    e.append(P("<b>CAPEX por quadra:</b>", H2))
    e.append(table([
        [P("Item", CELLW), P("Faixa", CELLW)],
        [P("Câmeras RTSP (2–4×)", CELL), P("R$ 500 – 2.000", CELL)],
        [P("Caixa edge (N100 + SSD)", CELL), P("R$ 1.000 – 1.800", CELL)],
        [P("Switch PoE + cabos", CELL), P("R$ 300 – 600", CELL)],
        [P("Botão ESP32 + caixa", CELL), P("R$ 50 – 120", CELL)],
        [P("Instalação", CELL), P("R$ 200 – 600", CELL)],
        [P("Total por quadra", CELLB), P("~ R$ 2.000 – 5.000", CELLB)],
    ], [95*mm, 60*mm]))
    e.append(Spacer(1, 5))
    e.append(bullets([
        "<b>OPEX (nuvem):</b> R2/B2 + CDN + API. ~R$ 30–300/mês por arena (depende de clipes/dia e retenção).",
        "<b>Desenvolvimento (MVP):</b> se você mesmo faz, é tempo; terceirizado, ~R$ 20k–60k (app + backend + firmware).",
    ]))

    # 5
    e.append(P("5. Precificação e modelo de cobrança", H1))
    e.append(P("Precifique pelo <b>valor</b> (o jogador quer o replay para postar), não pelo custo.", BODY))
    e.append(table([
        [P("Modelo", CELLW), P("Como funciona", CELLW), P("Faixa", CELLW)],
        [P("B2B SaaS (base)", CELLB), P("Mensalidade por quadra; hardware em comodato ou vendido à parte. Receita previsível.", CELL), P("R$ 150–500 /quadra/mês", CELL)],
        [P("B2C premium (upside)", CELLB), P("Freemium: clipe grátis com marca d’água; HD/sem marca pago, ou assinatura do jogador. Revenue share com a arena.", CELL), P("R$ 5–15 /clipe ou R$ 15–25 /mês", CELL)],
        [P("Por evento", CELLB), P("Pacote fechado para torneios.", CELL), P("sob medida", CELL)],
    ], [34*mm, 86*mm, 35*mm]))
    e.append(Spacer(1, 4))
    e.append(P("<b>Recomendado: híbrido.</b> A arena paga uma base (cobre infra e dá previsibilidade) "
               "e você monetiza o jogador (clipes premium) — alinha incentivos e a receita cresce com "
               "o uso, não com o custo. Comece com 1–2 arenas piloto.", BODY))

    # 6
    e.append(P("6. Riscos e pontos de atenção", H1))
    e.append(bullets([
        "<b>Câmera errada = dor crônica</b> — troque pelas RTSP antes de escalar.",
        "<b>Vínculo clipe→cliente</b> é o maior desafio de produto — prototipe primeiro.",
        "<b>LGPD / direito de imagem:</b> filmagem de pessoas exige aviso no local, base legal, política de retenção e termos. É requisito, não detalhe.",
        "<b>Rede e energia na quadra</b> — um nobreak pequeno no edge ajuda.",
        "<b>Escala = frota de edges</b> — invista em atualização OTA e monitoramento cedo.",
    ]))

    # 7
    e.append(P("7. Próximo passo", H1))
    e.append(P("Montar o <b>MVP do edge</b> reaproveitando o que já existe (cliente local + de-wrap "
               "H.264 + site): ring buffer com ffmpeg, gatilho ESP32→MQTT, corte dos 15 s de cada "
               "câmera, upload para um servidor e vínculo do clipe ao cliente. O código atual já é "
               "um MVP funcional de uma quadra; a próxima milha é a câmera RTSP + buffer + gatilho.", BODY))

    doc.build(e)
    print("OK -> Plano_Replay_Quadras.pdf")


if __name__ == "__main__":
    build()
