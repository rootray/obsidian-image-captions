// src/ImageViewPlugin.ts

import {
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/state";
import { Plugin } from "obsidian";
import { CaptionWidget } from "./CaptionWidget";

export function buildImageViewPlugin(plugin: Plugin) {
  class ImageViewPluginValue {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged |

| update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    private buildDecorations(view: EditorView): DecorationSet {
      const widgets: Range<Decoration> =;

      for (const { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
          from,
          to,
          enter: (node) => {
            // Target nodes that are image links in Markdown
            if (node.name.includes("Image")) {
              const text = view.state.doc.sliceString(node.from, node.to);

              // Differentiate between external![alt](src) and internal![[file|alt]]
              // We only target external images, as internal ones are handled by Obsidian
              if (text.startsWith("![") && text.includes("](")) {
                // Extract the alt text which serves as the caption
                const altTextMatch = text.match(/^!\[(.*?)\]/);
                const caption = altTextMatch? altTextMatch : "";

                if (caption) {
                  // Find the line where the image is located
                  const line = view.state.doc.lineAt(node.from);

                  // Create the caption widget decoration
                  const captionWidget = Decoration.widget({
                    widget: new CaptionWidget(caption, plugin),
                    side: 1, // Place the widget after the image line
                    block: true,
                  });

                  // Add the decoration to the end of the line
                  widgets.push(captionWidget.range(line.to));
                }
              }
            }
          },
        });
      }

      return Decoration.set(widgets, true);
    }
  }

  return ViewPlugin.fromClass(ImageViewPluginValue, {
    decorations: (v) => v.decorations,
  });
}