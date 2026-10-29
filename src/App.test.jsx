import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import App from "./App";
import comms from "./utils/comms";

vi.mock("./components/CodeEditor", () => ({
  default: ({ value, onChange }) => (
    <textarea
      aria-label="ECL code"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
  const getComputedStyle = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) => getComputedStyle(element));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("submits editor code and polls for completed results", async () => {
  const post = vi.spyOn(comms, "postAPIData")
    .mockResolvedValueOnce({ status: "submitted", workunitId: "W20261029-100000" })
    .mockResolvedValueOnce({ status: "completed", results: [], messages: [] });
  render(<App />);
  fireEvent.change(screen.getByLabelText("ECL code"), {
    target: { value: "OUTPUT('test');" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));

  await screen.findByText("completed");
  expect(post).toHaveBeenNthCalledWith(1, "execute_ecl", { code: "OUTPUT('test');" });
  expect(post).toHaveBeenNthCalledWith(2, "executed_result", {
    workunitId: "W20261029-100000",
  });
});

test("shows request errors and enables Submit again", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(comms, "postAPIData").mockRejectedValue(new Error("Request failed (HTTP 401)"));
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));

  await screen.findByText("Request failed (HTTP 401)");
  expect(screen.getByText("failed")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("button", { name: "Submit" })).not.toBeDisabled());
});

test("stops polling when the result API reports an error", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const post = vi.spyOn(comms, "postAPIData")
    .mockResolvedValueOnce({ status: "submitted", workunitId: "W20261029-100000" })
    .mockResolvedValueOnce({ status: "error", message: "HPCC is unavailable" });
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));

  await screen.findByText("HPCC is unavailable");
  expect(screen.getByText("failed")).toBeInTheDocument();
  expect(post).toHaveBeenCalledTimes(2);
});
