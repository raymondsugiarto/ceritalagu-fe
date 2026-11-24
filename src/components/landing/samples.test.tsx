import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/en.json";
import { sampleApi } from "@/lib/playground-api";
import { Samples } from "./samples";

vi.mock("@/lib/playground-api", () => ({
  sampleApi: { list: vi.fn() },
}));

const samples = [
  { id: "1", title: "First song", caption: "", audio_url: "/first.mp3", duration_sec: 60 },
  { id: "2", title: "Second song", caption: "", audio_url: "/second.mp3", duration_sec: 90 },
];

describe("landing sample players", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  async function render() {
    await act(async () => {
      root.render(
        <NextIntlClientProvider locale="en" messages={messages} timeZone="Asia/Jakarta">
          <Samples />
        </NextIntlClientProvider>,
      );
    });
  }

  it("pauses the previous sample when another starts", async () => {
    vi.mocked(sampleApi.list).mockResolvedValue(
      samples.map((sample) => ({ ...sample, lyrics: "" })),
    );
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    });
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      this.dispatchEvent(new Event("pause"));
    });

    await render();
    const [first, second] = container.querySelectorAll("audio");
    expect(first).toBeDefined();
    expect(second).toBeDefined();

    await act(async () => {
      first?.dispatchEvent(new Event("play"));
      second?.dispatchEvent(new Event("play"));
    });

    expect(pause).toHaveBeenCalledOnce();
    expect(pause.mock.instances[0]).toBe(first);
    expect(container.querySelector('[aria-label="Play First song"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Pause Second song"]')).not.toBeNull();
  });

  it("shows a playback error instead of silently failing", async () => {
    vi.mocked(sampleApi.list).mockResolvedValue(
      samples.map((sample) => ({ ...sample, lyrics: "" })),
    );
    await render();
    await act(async () => {
      container.querySelector("audio")?.dispatchEvent(new Event("error"));
    });
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Audio could not be played",
    );
  });
});
