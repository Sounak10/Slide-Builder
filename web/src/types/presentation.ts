export type PresentationEvent =
  | {
      event: "presentation_loaded";
      markdown: string;
    }
  | {
      event: "presentation_updated";
      markdown: string;
    }
  | {
      event: "goto_slide";
      slide: number;
    };

export type ActivityItem = {
  id: string;
  label: string;
  detail?: string;
  timestamp: number;
};

export type PresentationStatus = "idle" | "generating" | "ready";
