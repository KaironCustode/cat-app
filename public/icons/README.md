# PWA Icons

This directory should contain the following icon files for PWA support:

- `icon-192.png` - 192x192px (standard)
- `icon-512.png` - 512x512px (standard)
- `icon-192-maskable.png` - 192x192px (maskable for Android)
- `icon-512-maskable.png` - 512x512px (maskable for Android)
- `apple-touch-icon.png` - 180x180px (for iOS)

## How to Generate Icons

You can use the existing `Shenzy Icona.png` (1536x1024) as the source:

1. Use an online tool like:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - Or any image editor (Photoshop, GIMP, etc.)

2. For maskable icons:
   - The icon should have a "safe zone" - important content should be within 80% of the center
   - Android will crop the edges, so keep important elements centered

3. For Apple touch icon:
   - 180x180px
   - No transparency (use solid background)
   - Square format (iOS will round the corners automatically)

## Quick Command (if you have ImageMagick installed)

```bash
# From public directory
convert "Shenzy Icona.png" -resize 192x192 icons/icon-192.png
convert "Shenzy Icona.png" -resize 512x512 icons/icon-512.png
convert "Shenzy Icona.png" -resize 192x192 icons/icon-192-maskable.png
convert "Shenzy Icona.png" -resize 512x512 icons/icon-512-maskable.png
convert "Shenzy Icona.png" -resize 180x180 -background "#FFFBF7" -gravity center -extent 180x180 icons/apple-touch-icon.png
```

## Temporary Solution

Until icons are generated, the PWA will still work but may show a default icon. The manifest.json references these files, so they need to exist for full PWA functionality.
