import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { usePageHelp } from "@/hooks/use-page-help";

const key = "launchpilot:supplier-health:help:v1";
beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("First-visit page help", () => {
  it("opens on the first visit and stays dismissed on subsequent visits", async () => {
    const first = renderHook(() => usePageHelp(key));
    await waitFor(() => expect(first.result.current.open).toBe(true));
    act(() => first.result.current.onOpenChange(false));
    expect(localStorage.getItem(key)).toBe("seen");
    first.unmount();
    const second = renderHook(() => usePageHelp(key));
    expect(second.result.current.open).toBe(false);
  });

  it("reopens dismissed help with the question-mark hotkey", () => {
    localStorage.setItem(key, "seen");
    const { result } = renderHook(() => usePageHelp(key));
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" })));
    expect(result.current.open).toBe(true);
  });

  it("does not open when typing a question mark into an input", () => {
    localStorage.setItem(key, "seen");
    const { result } = renderHook(() => usePageHelp(key));
    const input = document.createElement("input");
    document.body.append(input);
    act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true })));
    expect(result.current.open).toBe(false);
    input.remove();
  });
});