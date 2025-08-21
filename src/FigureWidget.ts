// src/FigureWidget.ts

import { WidgetType } from "@codemirror/view";
import { MarkdownRenderer, Plugin } from "obsidian";

export class FigureWidget extends WidgetType {
  constructor(
    private readonly src: string,
    private readonly alt: string,
    private readonly plugin: Plugin
  ) {
    super();
  }

  eq(other: FigureWidget): boolean {
    return other.src === this.src && other.alt === this.alt;
  }

  toDOM(): HTMLElement {
    const figure = document.createElement("figure");
    figure.classList.add("image-captions-figure");

    const img = document.createElement("img");
    img.src = this.src;

    // Logic to parse alt text for caption and width, mimicking the original plugin
    let captionText = this.alt;
    const parts = this.alt.split("|");
    if (parts.length > 1) {
      captionText = parts;
      const width = parts.trim();
      if (!isNaN(parseInt(width))) {
        img.style.width = `${width}px`;
      }
    }
    
    // Handle filename replacement token
    if (captionText.trim() === "%") {
        try {
            const url = new URL(this.src);
            const filename = url.pathname.split('/').pop()?.split('.').slice(0, -1).join('.') |

| "";
            captionText = filename;
        } catch (e) {
            captionText = "Invalid URL";
        }
    }

    img.alt = captionText;
    figure.appendChild(img);

    if (captionText) {
      const figcaption = document.createElement("figcaption");
      figcaption.classList.add("image-captions-caption");

      MarkdownRenderer.render(
        this.plugin.app,
        captionText,
        figcaption,
        "",
        this.plugin
      );

      if (figcaption.firstChild && figcaption.firstChild.nodeName === "P") {
        figcaption.innerHTML = (figcaption.firstChild as HTMLParagraphElement).innerHTML;
      }
      figure.appendChild(figcaption);
    }

    return figure;
  }
}