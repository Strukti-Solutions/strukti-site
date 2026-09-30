import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Diagnostico } from "./Diagnostico";

function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Seu nome"), { target: { value: "Maria Souza" } });
  fireEvent.change(screen.getByLabelText("Nome da empresa"), {
    target: { value: "Distribuidora Souza Ltda" },
  });
  fireEvent.change(screen.getByLabelText("WhatsApp com DDD"), {
    target: { value: "(83) 99999-0000" },
  });
  fireEvent.change(screen.getByLabelText("Qual problema você quer resolver?"), {
    target: { value: "Perco tempo montando a rota de entrega manualmente todo dia." },
  });
  fireEvent.click(screen.getByLabelText(/aviso de privacidade/, { exact: false }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("<Diagnostico />", () => {
  it("mostra a mensagem de sucesso e limpa os campos após um envio bem-sucedido (regressão B1)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );

    render(<Diagnostico />);
    fillValidForm();

    const nameInput = screen.getByLabelText("Seu nome") as HTMLInputElement;
    fireEvent.click(screen.getByRole("button", { name: "Pedir diagnóstico gratuito" }));

    await waitFor(() => {
      expect(screen.getByText("Pedido recebido!")).toBeTruthy();
    });

    expect(screen.getByText(/Obrigado, Maria Souza\./)).toBeTruthy();
    // O formulário de sucesso substitui o form; não há mais o campo "name" no DOM.
    expect(nameInput.isConnected).toBe(false);
  });

  it("mostra a mensagem de limite de taxa quando a API responde 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "limite" }), { status: 429 })),
    );

    render(<Diagnostico />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Pedir diagnóstico gratuito" }));

    await waitFor(() => {
      expect(screen.getByText(/Foram muitas tentativas seguidas/)).toBeTruthy();
    });
  });

  it("valida no cliente e leva o foco ao primeiro campo inválido", async () => {
    render(<Diagnostico />);
    fireEvent.click(screen.getByRole("button", { name: "Pedir diagnóstico gratuito" }));

    await waitFor(() => {
      expect(screen.getByText("Escreva o seu nome.")).toBeTruthy();
    });

    expect(document.activeElement).toBe(screen.getByLabelText("Seu nome"));
  });
});
