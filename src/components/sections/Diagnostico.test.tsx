import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axe from "axe-core";
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

// O foco no sucesso e nas falhas de envio é movido por um useEffect do
// componente. A atualização de estado vem da continuação do fetch (fora de
// evento do usuário), então o React agenda os efeitos passivos numa tarefa
// separada do Scheduler, depois do commit. O waitFor que procura o texto
// resolve assim que o DOM muda (MutationObserver), e com a CPU sem folga o
// Scheduler cede entre o commit e essa tarefa: o teste chegava a conferir o
// foco antes de o efeito rodar (Q1). Por isso o foco é aguardado com waitFor,
// sem afrouxar o que se exige: o foco tem que chegar ao elemento certo.
async function expectFocusOn(getElement: () => Element | null) {
  await waitFor(() => {
    const target = getElement();
    expect(target).not.toBeNull();
    expect(document.activeElement).toBe(target);
  });
}

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container);
  expect(results.violations).toEqual([]);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("<Diagnostico /> — estados do formulário", () => {
  it("erro de validação: foca o primeiro campo inválido e não tem violações de acessibilidade", async () => {
    const { container } = render(<Diagnostico />);
    fireEvent.click(screen.getByRole("button", { name: "Pedir diagnóstico gratuito" }));

    await waitFor(() => {
      expect(screen.getByText("Escreva o seu nome.")).toBeTruthy();
    });

    expect(document.activeElement).toBe(screen.getByLabelText("Seu nome"));
    await expectNoAxeViolations(container);
  });

  it("enviando: mantém o foco no botão (não usa disabled nativo) e não tem violações", async () => {
    let resolveFetch!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));

    const { container } = render(<Diagnostico />);
    fillValidForm();
    const submitButton = screen.getByRole("button", { name: "Pedir diagnóstico gratuito" });
    submitButton.focus();
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Enviando…" })).toBeTruthy();
    });
    const submittingButton = screen.getByRole("button", { name: "Enviando…" });
    expect(submittingButton.getAttribute("aria-busy")).toBe("true");
    expect(document.activeElement).toBe(submittingButton);

    await expectNoAxeViolations(container);

    resolveFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await waitFor(() => expect(screen.getByText("Pedido recebido!")).toBeTruthy());
  });

  it("sucesso: leva o foco ao título de confirmação e não tem violações (regressão B1/N2)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );

    const { container } = render(<Diagnostico />);
    fillValidForm();
    const nameInput = screen.getByLabelText("Seu nome") as HTMLInputElement;
    fireEvent.click(screen.getByRole("button", { name: "Pedir diagnóstico gratuito" }));

    await waitFor(() => {
      expect(screen.getByText("Pedido recebido!")).toBeTruthy();
    });

    expect(screen.getByText(/Obrigado, Maria Souza\./)).toBeTruthy();
    expect(nameInput.isConnected).toBe(false);
    await expectFocusOn(() => screen.getByRole("heading", { name: "Pedido recebido!" }));

    await expectNoAxeViolations(container);
  });

  it("falha genérica: foca a mensagem de erro, com link para o WhatsApp, e não tem violações", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "falha" }), { status: 500 })),
    );

    const { container } = render(<Diagnostico />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Pedir diagnóstico gratuito" }));

    await waitFor(() => {
      expect(screen.getByText(/Não foi possível enviar agora/)).toBeTruthy();
    });

    const link = screen.getByRole("link", { name: "fale com a gente pelo WhatsApp" });
    expect(link.getAttribute("href")).toContain("wa.me/5583999683670");
    await expectFocusOn(() => screen.getByText(/Não foi possível enviar agora/).closest("p"));

    await expectNoAxeViolations(container);
  });

  it("limite de tentativas: foca a mensagem de erro e não tem violações", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "limite" }), { status: 429 })),
    );

    const { container } = render(<Diagnostico />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Pedir diagnóstico gratuito" }));

    await waitFor(() => {
      expect(screen.getByText(/Foram muitas tentativas seguidas/)).toBeTruthy();
    });

    await expectFocusOn(() => screen.getByText(/Foram muitas tentativas seguidas/).closest("p"));
    await expectNoAxeViolations(container);
  });
});
