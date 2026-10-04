import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import axe from "axe-core";
import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { selectInterest } from "@/lib/interest";
import { Contato } from "./Contato";

const { form } = landingContent.contato;
const consentLabel = form.consentLabelPrefix + form.consentLinkLabel + form.consentLabelSuffix;

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(form.fields.name.label), { target: { value: "Maria Souza" } });
  fireEvent.change(screen.getByLabelText(form.fields.company.label), {
    target: { value: "Distribuidora Souza Ltda" },
  });
  fireEvent.change(screen.getByLabelText(form.fields.whatsapp.label), {
    target: { value: "(83) 99999-0000" },
  });
  fireEvent.change(screen.getByLabelText(form.fields.interest.label), {
    target: { value: "replay" },
  });
  fireEvent.change(screen.getByLabelText(form.fields.problem.label), {
    target: { value: "Perco tempo montando a rota de entrega manualmente todo dia." },
  });
  fireEvent.click(screen.getByLabelText(consentLabel));
}

// A mensagem de erro de envio tem um link no meio (LinkedText): o texto
// aprovado inteiro só aparece no textContent do parágrafo.
function paragraphWithText(text: string) {
  return screen.getByText((_content, element) => element?.tagName === "P" && element.textContent === text);
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
    expect(document.activeElement, "o foco não chegou ao elemento esperado").toBe(target);
  });
}

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container);
  expect(results.violations).toEqual([]);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("<Contato /> — estados do formulário", () => {
  it("erro de validação: foca o primeiro campo inválido e não tem violações de acessibilidade", async () => {
    const { container } = render(<Contato />);
    fireEvent.click(screen.getByRole("button", { name: form.submitLabel }));

    await waitFor(() => {
      expect(screen.getByText(form.fields.name.errorEmpty)).toBeTruthy();
    });

    expect(document.activeElement).toBe(screen.getByLabelText(form.fields.name.label));
    await expectNoAxeViolations(container);
  });

  it("enviando: mantém o foco no botão (não usa disabled nativo) e não tem violações", async () => {
    let resolveFetch!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));

    const { container } = render(<Contato />);
    fillValidForm();
    const submitButton = screen.getByRole("button", { name: form.submitLabel });
    submitButton.focus();
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: form.submittingLabel })).toBeTruthy();
    });
    const submittingButton = screen.getByRole("button", { name: form.submittingLabel });
    expect(submittingButton.getAttribute("aria-busy")).toBe("true");
    expect(document.activeElement).toBe(submittingButton);

    await expectNoAxeViolations(container);

    resolveFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await waitFor(() => expect(screen.getByText(form.success.title)).toBeTruthy());
  });

  it("sucesso: leva o foco ao título de confirmação e não tem violações (regressão B1/N2)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );

    const { container } = render(<Contato />);
    fillValidForm();
    const nameInput = screen.getByLabelText(form.fields.name.label) as HTMLInputElement;
    fireEvent.click(screen.getByRole("button", { name: form.submitLabel }));

    await waitFor(() => {
      expect(screen.getByText(form.success.title)).toBeTruthy();
    });

    expect(screen.getByText(form.success.text.replace("{nome}", "Maria Souza"))).toBeTruthy();
    expect(nameInput.isConnected).toBe(false);
    await expectFocusOn(() => screen.getByRole("heading", { name: form.success.title }));

    await expectNoAxeViolations(container);
  });

  it("falha genérica: foca a mensagem de erro, com link para o WhatsApp, e não tem violações", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "falha" }), { status: 500 })),
    );

    const { container } = render(<Contato />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: form.submitLabel }));

    await waitFor(() => {
      expect(paragraphWithText(form.submitError)).toBeTruthy();
    });

    // O formulário serve a todos os interesses: as duas saídas para o
    // WhatsApp usam a mensagem geral, não a de um produto.
    const generalLink = siteConfig.whatsapp.linkWithMessage(landingContent.whatsappMessages.general);
    const errorLink = within(paragraphWithText(form.submitError)).getByRole("link");
    expect(errorLink.getAttribute("href")).toBe(generalLink);
    const alternativeLink = screen.getByRole("link", { name: form.whatsappAlternativeLinkLabel });
    expect(alternativeLink.getAttribute("href")).toBe(generalLink);
    await expectFocusOn(() => paragraphWithText(form.submitError));

    await expectNoAxeViolations(container);
  });

  it("limite de tentativas: foca a mensagem de erro e não tem violações", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "limite" }), { status: 429 })),
    );

    const { container } = render(<Contato />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: form.submitLabel }));

    await waitFor(() => {
      expect(paragraphWithText(form.rateLimitError)).toBeTruthy();
    });

    await expectFocusOn(() => paragraphWithText(form.rateLimitError));
    await expectNoAxeViolations(container);
  });

  it("uma chamada da página marca o interesse, e a seguinte troca a escolha", async () => {
    const { container } = render(<Contato />);
    const select = screen.getByLabelText(form.fields.interest.label) as HTMLSelectElement;
    act(() => selectInterest("aplicativo"));
    expect(select.value).toBe("aplicativo");
    act(() => selectInterest("outro"));
    expect(select.value).toBe("outro");
    await expectNoAxeViolations(container);
  });

  it("depois do envio com sucesso, uma chamada não esconde a mensagem de sucesso", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    render(<Contato />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: form.submitLabel }));
    await waitFor(() => expect(screen.getByText(form.success.title)).toBeTruthy());
    act(() => selectInterest("replay"));
    expect(screen.getByText(form.success.title)).toBeTruthy();
    expect(screen.queryByLabelText(form.fields.interest.label)).toBeNull();
  });

  it("enviar sem escolher o interesse mostra o erro do campo", async () => {
    const { container } = render(<Contato />);
    fireEvent.click(screen.getByRole("button", { name: form.submitLabel }));
    await waitFor(() => expect(screen.getByText(form.fields.interest.errorEmpty)).toBeTruthy());
    await expectNoAxeViolations(container);
  });

  it("com só o interesse faltando, o erro fica ligado ao select e o foco vai para ele", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<Contato />);
    fillValidForm();
    const select = screen.getByLabelText(form.fields.interest.label) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: form.submitLabel }));

    const error = await screen.findByText(form.fields.interest.errorEmpty);
    // Só o interesse é inválido: nenhum outro campo ganha erro.
    expect(container.querySelectorAll('[aria-invalid="true"]')).toHaveLength(1);
    expect(select.getAttribute("aria-invalid")).toBe("true");
    const describedBy = select.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(error.closest(`#${describedBy}`)).not.toBeNull();
    expect(document.activeElement).toBe(select);
    expect(fetchMock).not.toHaveBeenCalled();
    await expectNoAxeViolations(container);
  });
});
