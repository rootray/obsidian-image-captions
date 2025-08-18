// Live Preview external image captions (DOM scanning approach, fixed renderMarkdown signature)
// Adds a caption element after external <img> tags inside the editor.
// Respects plugin.livePreviewPatchSettings.enableLivePreviewExternalCaptions.

import { MarkdownRenderer, Plugin } from 'obsidian'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'

function parseAlt (altRaw: string): { caption: string, width?: string } {
  let alt = (altRaw ?? '').trim()
  let width: string | undefined
  const pipe = alt.lastIndexOf('|')
  if (pipe !== -1) {
    const tail = alt.slice(pipe + 1).trim()
    const m = tail.match(/^(\d+)(?:px)?(?:x\d+)?$/)
    if (m) width = `${m[1]}px`
    alt = alt.slice(0, pipe).trim()
  }
  return { caption: alt, width }
}

function isExternal (src: string | null): boolean {
  return !!src && /^https?:\/\//i.test(src)
}

async function ensureCaptionAfterImage (plugin: Plugin, img: HTMLImageElement) {
  const anyPlugin: any = plugin as any
  const enabled = anyPlugin?.livePreviewPatchSettings?.enableLivePreviewExternalCaptions ?? true
  // Remove caption if disabled
  if (!enabled) {
    const next = img.nextElementSibling as HTMLElement | null
    if (next && next.classList.contains('image-captions-caption')) next.remove()
    return
  }

  const altRaw = img.getAttribute('alt') || ''
  const { caption, width } = parseAlt(altRaw)
  if (!caption) {
    const next = img.nextElementSibling as HTMLElement | null
    if (next && next.classList.contains('image-captions-caption')) next.remove()
    return
  }

  // Add or update caption element
  let cap = img.nextElementSibling as HTMLElement | null
  if (!cap || !cap.classList.contains('image-captions-caption')) {
    cap = document.createElement('div')
    cap.className = 'image-captions-caption'
    img.insertAdjacentElement('afterend', cap)
  }

  // Render markdown inside caption (correct API: renderMarkdown(markdown, el, sourcePath, component))
  const sourcePath = plugin.app.workspace.getActiveFile()?.path ?? ''
  if ((cap as any).replaceChildren) (cap as any).replaceChildren()
  else cap.innerHTML = ''
  await MarkdownRenderer.renderMarkdown(caption, cap, sourcePath, plugin)

  // Sync width with image or explicit width
  const apply = () => {
    if (width) {
      cap!.style.width = width
    } else {
      const w = img.getBoundingClientRect().width
      if (w > 0) cap!.style.width = `${Math.round(w)}px`
    }
    cap!.style.marginTop = '4px'
    cap!.style.textAlign = 'center'
  }
  apply()
  new ResizeObserver(apply).observe(img)
}

export function createExternalImageLivePreviewExtension (plugin: Plugin) {
  // We scan the editor DOM on each update and when the viewport changes.
  return ViewPlugin.fromClass(class {
    constructor (readonly view: EditorView) {
      this.scan()
    }
    update (u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged || u.geometryChanged) this.scan()
    }
    private async scan () {
      // Only operate inside Live Preview editors (source views)
      const root = this.view.scrollDOM.closest('.markdown-source-view')
      if (!root) return

      const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[]
      for (const img of imgs) {
        const src = img.getAttribute('src')
        if (!isExternal(src)) continue
        await ensureCaptionAfterImage(plugin, img)
      }
    }
  })
}
