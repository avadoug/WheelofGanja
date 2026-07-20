# Assets and theme guide

## Social artwork

The original social card is `public/og.png`. Replace it with another landscape PNG and keep the metadata dimensions in `index.html` synchronized.

## Stage themes

Theme selection writes a `data-theme` value on the root document. Each theme overrides shared CSS variables in `src/styles.css`:

```css
:root[data-theme="new-theme"] {
  --green: #77efb0;
  --green-deep: #19875b;
  --violet: #a671ff;
  --gold: #f2cb6f;
  --stage-glow: rgba(90, 255, 170, 0.14);
}
```

Add a matching picker entry in `src/components/SiteApp.tsx`. Keep text contrast at WCAG AA or better and never communicate wedge meaning by color alone.

## Characters

Bud Blazington and Sativa Starling are assembled with semantic-free CSS portrait layers. To replace them with raster art:

1. Add optimized WebP or PNG files under `public/characters`.
2. Preserve the `aria-hidden` illustration treatment; names and actions must remain in surrounding text.
3. Provide multiple states only where the state changes gameplay meaningfully.
4. Avoid real-person likenesses, celebrity references, and sexualized presentation.

## Audio

The shipped build uses short Web Audio oscillator cues so it works without asset downloads. A replacement audio library should be original or properly licensed, lazy-loaded after interaction, optional, captioned where meaning matters, and separated into the existing mixer groups.

## Performance budget

- Prefer WebP/AVIF for stage imagery.
- Keep the first view's essential images under roughly 500 KB when practical.
- Lazy-load non-active themes and long sound files.
- Test mid-range mobile hardware and Reduced Motion mode.
