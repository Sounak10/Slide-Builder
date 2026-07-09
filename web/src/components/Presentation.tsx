"use client";

import { useEffect, useRef } from "react";
import { Deck, Markdown } from "@revealjs/react";
import type { RevealApi } from "reveal.js";

type PresentationProps = {
  markdown: string;
  currentSlide: number;
};

const emptyDeck = `
# Your AI presentation will appear here

Connect your microphone and ask the agent for any topic.
`;

export function Presentation({ markdown, currentSlide }: PresentationProps) {
  const deckRef = useRef<RevealApi | null>(null);
  const deckMarkdown = markdown || emptyDeck;

  useEffect(() => {
    deckRef.current?.slide(currentSlide);
  }, [currentSlide, deckMarkdown]);

  return (
    <div className="presentation-frame">
      <Deck
        deckRef={deckRef}
        className="h-full w-full"
        config={{
          embedded: true,
          hash: false,
          controls: false,
          progress: true,
          center: true,
          transition: "slide",
        }}
      >
        <Markdown
          key={deckMarkdown}
          separator="^\n---\n$"
          verticalSeparator="^\n--\n$"
          options={{ smartypants: true }}
        >
          {deckMarkdown}
        </Markdown>
      </Deck>
    </div>
  );
}
