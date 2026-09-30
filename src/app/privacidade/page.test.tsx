import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { siteConfig } from "@/config/site";
import PrivacidadePage from "./page";

describe("<PrivacidadePage />", () => {
  it("exibe a data de 'Última atualização' derivada de siteConfig.privacyPolicyVersion", () => {
    render(<PrivacidadePage />);

    const [year, month, day] = siteConfig.privacyPolicyVersion.split("-");
    const expectedDate = `${day}/${month}/${year}`;

    expect(screen.getByText(new RegExp(expectedDate))).toBeTruthy();
  });
});
