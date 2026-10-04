import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { onInterestSelected } from "@/lib/interest";
import { InterestLink } from "./InterestLink";

describe("<InterestLink />", () => {
  it("é um link comum para o formulário e, no clique, marca o interesse dele", () => {
    const handler = vi.fn();
    const unsubscribe = onInterestSelected(handler);
    render(<InterestLink interest="aplicativo">Quero um aplicativo</InterestLink>);

    const link = screen.getByRole("link", { name: "Quero um aplicativo" });
    expect(link.getAttribute("href")).toBe("#contato");
    expect(handler).not.toHaveBeenCalled();

    fireEvent.click(link);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith("aplicativo");
    unsubscribe();
  });
});
