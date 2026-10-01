/**
 * Só um vídeo toca por vez na página (MASTER §8.8): Rota de Vendas, Fleet
 * Analytics BI e o vídeo de fundo do hero dividem a mesma regra, mas quem
 * decide é a pessoa. Um vídeo com `controls` só toca porque ela pediu; o
 * hero toca sozinho (scroll, aba visível). Por isso as duas pontas:
 * pausar os outros quando um toca, e o hero nunca tocar sozinho por cima de
 * um vídeo que a pessoa está ouvindo.
 */

/** Pausa todo `<video>` da página, exceto o que acabou de tocar. */
export function pauseOtherVideos(playing: HTMLVideoElement) {
  document.querySelectorAll("video").forEach((video) => {
    if (video !== playing && !video.paused) video.pause();
  });
}

/** Há algum vídeo com `controls` (iniciado pela pessoa) tocando agora? */
export function isUserVideoPlaying() {
  return Array.from(document.querySelectorAll<HTMLVideoElement>("video[controls]")).some(
    (video) => !video.paused,
  );
}

/**
 * Para `useSyncExternalStore`: avisa sempre que algum `<video>` da página
 * começa ou para de tocar, para quem lê `isUserVideoPlaying()` reavaliar
 * (nem "play" nem "pause" borbulham, por isso a captura no documento).
 */
export function subscribeToVideoPlayback(callback: () => void) {
  document.addEventListener("play", callback, true);
  document.addEventListener("pause", callback, true);
  return () => {
    document.removeEventListener("play", callback, true);
    document.removeEventListener("pause", callback, true);
  };
}
