"use client";

import { useEffect, useRef } from "react";
import { Deck, Markdown } from "@revealjs/react";
import type { RevealApi } from "reveal.js";

type PresentationProps = {
  markdown: string;
  currentSlide: number;
};

const emptyDeck = `
<!-- .slide: data-background-gradient="linear-gradient(135deg,#083344 0%,#0891b2 48%,#67e8f9 100%)" -->
<div class="slide-shell slide-accent-cyan slide-layout-hero">
<div class="slide-orb slide-orb-one"></div>
<div class="slide-orb slide-orb-two"></div>
<div class="slide-content">
<p class="slide-kicker">Ready when you are</p>
<h1>Your voice-built deck lands here</h1>
<p class="slide-lede">Start a voice session, name the topic, and refine the story out loud.</p>
<div class="slide-empty-action">Waiting for your topic</div>
</div>
</div>
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
          width: 1280,
          height: 720,
          margin: 0.02,
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
