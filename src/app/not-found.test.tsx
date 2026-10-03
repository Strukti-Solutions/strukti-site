import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { landingContent } from "@/content/landing";
import NotFound from "./not-found";

describe("<NotFound />", () => {
  it("mostra o título, o link de volta e o WhatsApp com a mensagem geral", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: landingContent.notFound.title })).toBeTruthy();

    const homeLink = screen.getByRole("link", { name: landingContent.notFound.homeLink });
    expect(homeLink.getAttribute("href")).toBe("/");

    const whatsappLink = screen.getByRole("link", { name: landingContent.header.whatsappButton });
    expect(whatsappLink.getAttribute("href")).toContain(encodeURIComponent(landingContent.whatsappMessages.general));
  });

  it("não tem violações detectáveis pelo axe-core", async () => {
    const { container } = render(<NotFound />);

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  }, 20_000);
});
