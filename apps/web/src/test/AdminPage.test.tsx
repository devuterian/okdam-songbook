import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPage } from "../routes/AdminPage";

function renderAdmin() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<div>공개 화면</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminPage", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("offers performer toggles without a ponya option", async () => {
    const user = userEvent.setup();
    renderAdmin();

    expect(screen.getByRole("button", { name: "마리" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "여울" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "성욱" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: "뽀냐" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "마리" }));
    await user.click(screen.getByRole("button", { name: "여울" }));
    expect(screen.getByRole("button", { name: "마리" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "여울" })).toHaveAttribute("aria-pressed", "true");
  });
});
