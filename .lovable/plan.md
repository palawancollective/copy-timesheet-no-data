

## Fix: Logo Transparency Issue

### Problem
The logo images currently stored as `logo-dark.png` and `logo-light.png` appear to have a non-transparent background (visible as a square/circle behind the logo artwork). This makes them look boxed-in rather than seamlessly blending with the header.

### Solution
The uploaded image files themselves contain a background. You need to **re-upload truly transparent PNG versions** of the logos.

### What I will do

1. **Replace the logo asset files** - Copy the new transparent PNGs you provide to `src/assets/logo-dark.png` and `src/assets/logo-light.png`, overwriting the current ones.

2. **No code changes needed** - The header and branding settings code already renders the images correctly with `object-contain` and no background styling. Once the image files themselves are transparent, they will display seamlessly.

### What you need to do

Please upload two new logo files that are **truly transparent PNGs** (no background at all -- not a white background, not a dark background, just the logo artwork on a fully transparent canvas):
- One for **dark mode** (light-colored logo artwork)
- One for **light mode** (dark-colored logo artwork)

**Tip**: You can use a free tool like [remove.bg](https://remove.bg) to strip the background from your current logos if needed.

