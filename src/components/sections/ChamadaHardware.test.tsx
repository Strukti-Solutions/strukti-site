import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { landingContent } from "@/content/landing";
import { ChamadaHardware } from "./ChamadaHardware";

const { chamadaHardware } = landingContent;

describe("<ChamadaHardware />", () => {
  it("leva ao formulário", async () => {
    const { container } = render(<ChamadaHardware />);
    expect(screen.getByRole("heading", { level: 2, name: chamadaHardware.title })).toBeTruthy();
    expect(screen.getByRole("link", { name: chamadaHardware.cta }).getAttribute("href")).toBe("#contato");
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
