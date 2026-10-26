"use client";

import { createContext, useContext } from "react";

/**
 * A mídia do quadro do `ScrollExpandMedia` está coberta? No modo entrada, a
 * tela do aparelho cobre a sala no fim da aproximação (`k` a partir de
 * `ENTRADA.salaCobertaK`, src/lib/heroEntrada.ts) e em P = 1 recolhido: o
 * vídeo da sala, que ninguém vê, pausa (o `HeroVideoClip` avisa o
 * `HeroVideoProvider`). Fora do modo entrada, e fora do hero, é sempre
 * `false`.
 */
export const MidiaCobertaContext = createContext(false);

/** Se a mídia do quadro está coberta (ver `MidiaCobertaContext`). */
export function useMidiaCoberta() {
  return useContext(MidiaCobertaContext);
}
