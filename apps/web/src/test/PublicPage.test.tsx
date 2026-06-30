import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PublicPage } from "../routes/PublicPage";

describe("PublicPage", () => {
  it("renders the search interface", async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<PublicPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText("곡명, 아티스트, 독음, TJ 번호")).toBeInTheDocument();
    expect(await screen.findByText("フォニイ")).toBeInTheDocument();
  });
});

