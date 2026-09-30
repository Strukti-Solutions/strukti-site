import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import axe from "axe-core";
import Home from "./page";

describe("página inicial — acessibilidade", () => {
  it("não tem violações detectáveis pelo axe-core", async () => {
    const { container } = render(<Home />);

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  }, 20_000);
});
