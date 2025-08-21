// src/CaptionWidget.ts

import { WidgetType } from "@codemirror/view";
import { MarkdownRenderer, Plugin } from "obsidian";

export class CaptionWidget extends WidgetType {
  constructor(
    private readonly captionText: string,
    private readonly plugin: Plugin
  ) {
    super();
  }

  eq(other: CaptionWidget): boolean {
    return other.captionText === this.captionText;
  }

  toDOM(): HTMLElement {
    const figcaption = document.createElement("figcaption");
    figcaption.classList.add("image-captions-caption");

    // Use Obsidian's MarkdownRenderer to process caption content
    // This enables support for Markdown like **bold** and [[links]]
    MarkdownRenderer.render(
      this.plugin.app,
      this.captionText,
      figcaption,
      "", // An empty source path
      this.plugin   // The component context
    );

    // The renderer wraps content in a <p> tag, which is undesirable here.
    // We extract the inner content to live directly in the figcaption.
    if (figcaption.firstChild && figcaption.firstChild.nodeName === "P") {
      figcaption.innerHTML = (figcaption.firstChild as HTMLParagraphElement).innerHTML;
    }

    return figcaption;
  }
}