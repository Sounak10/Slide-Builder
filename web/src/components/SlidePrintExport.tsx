"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { Streamdown } from "streamdown";

type SlidePrintExportProps = {
  exportId: string;
};

type ExportState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      markdown: string;
    }
  | {
      status: "error";
      message: string;
    };

const streamdownPlugins = { cjk, code, math, mermaid };

function removeSpeakerNotes(slide: string) {
  const lines = slide.split("\n");
  const notesStartIndex = lines.findIndex((line) => /^notes?:\s*$/i.test(line.trim()));

  if (notesStartIndex === -1) {
    return slide.trim();
  }

  return lines.slice(0, notesStartIndex).join("\n").trim();
}

function splitRevealMarkdown(markdown: string) {
  const slides: string[] = [];
  const currentSlide: string[] = [];
  let fence: string | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    const fenceMatch = trimmedLine.match(/^(```+|~~~+)/);

    if (fenceMatch) {
      const marker = fenceMatch[1].startsWith("`") ? "```" : "~~~";
      fence = fence === marker ? null : marker;
    }

    if (!fence && (trimmedLine === "---" || trimmedLine === "--")) {
      const slide = removeSpeakerNotes(currentSlide.join("\n"));

      if (slide) {
        slides.push(slide);
      }

      currentSlide.length = 0;
      continue;
    }

    currentSlide.push(line);
  }

  const finalSlide = removeSpeakerNotes(currentSlide.join("\n"));

  if (finalSlide) {
    slides.push(finalSlide);
  }

  return slides.length > 0 ? slides : [markdown];
}

function stripRevealSlideAttributes(slide: string) {
  return slide.replace(/^\s*<!--\s*\.slide:[\s\S]*?-->\s*/u, "").trim();
}

function isStyledHtmlSlide(slide: string) {
  return stripRevealSlideAttributes(slide).includes('class="slide-shell');
}

async function waitForSlideAssets() {
  await document.fonts?.ready;

  const images = Array.from(document.images);
  await Promise.all(
    images.map((image) => {
      if (image.complete) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  );
}

export function SlidePrintExport({ exportId }: SlidePrintExportProps) {
  const [exportState, setExportState] = useState<ExportState>({ status: "loading" });
  const hasPrintedRef = useRef(false);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadExport() {
      try {
        const response = await fetch(`/api/export/slides/${exportId}`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("This slide export expired or could not be found.");
        }

        const body = (await response.json()) as { markdown?: string };

        if (!body.markdown) {
          throw new Error("This slide export does not contain any markdown.");
        }

        setExportState({ status: "ready", markdown: body.markdown });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setExportState({
          status: "error",
          message: error instanceof Error ? error.message : "Could not load slide export.",
        });
      }
    }

    loadExport();

    return () => {
      abortController.abort();
    };
  }, [exportId]);

  const printOnce = useCallback(async () => {
    if (hasPrintedRef.current) {
      return;
    }

    hasPrintedRef.current = true;
    await waitForSlideAssets();
    window.print();
  }, []);

  const slides = useMemo(
    () => (exportState.status === "ready" ? splitRevealMarkdown(exportState.markdown) : []),
    [exportState],
  );

  useEffect(() => {
    if (exportState.status !== "ready") {
      return;
    }

    const printFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(printOnce);
    });

    return () => {
      window.cancelAnimationFrame(printFrame);
    };
  }, [exportState.status, printOnce]);

  if (exportState.status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-8 text-white">
        <p className="text-sm font-medium tracking-wide text-cyan-100">
          Preparing your slides for PDF export...
        </p>
      </main>
    );
  }

  if (exportState.status === "error") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-8 text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/8 p-6 text-center">
          <h1 className="text-2xl font-semibold">Export unavailable</h1>
          <p className="mt-2 text-sm text-slate-300">{exportState.message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="slide-print-export min-h-screen bg-white text-slate-950">
      {slides.map((slide, index) => (
        <article className="slide-print-export-page" key={`${index}-${slide.slice(0, 24)}`}>
          {isStyledHtmlSlide(slide) ? (
            <div
              className="slide-print-export-content"
              dangerouslySetInnerHTML={{ __html: stripRevealSlideAttributes(slide) }}
            />
          ) : (
            <Streamdown
              className="slide-print-export-content"
              plugins={streamdownPlugins}
            >
              {slide}
            </Streamdown>
          )}
        </article>
      ))}
    </main>
  );
}
