# Gordita setup (font files not included)

The four attached desktop OpenType files were verified: Gordita Regular, Medium, Bold, and Black. The V3.1 screenshots were rendered with them, but **font binary files are not redistributed in this download**.

To preview with your own licensed font files, copy your `.otf` files into this `assets/fonts/` folder and rename as:

- `Gordita-Regular.otf` ← `Gordita-regular(2).otf`
- `Gordita-Medium.otf` ← `Gordita-medium(2).otf`
- `Gordita-Bold.otf` ← `Gordita-bold(2).otf`
- `Gordita-Black.otf` ← `Gordita-black(2).otf`

Those exact paths are referenced in the CSS. If omitted, the site gracefully falls back to Outfit and system fonts. The Regular file is also used for the lightest styled text because no separate Light font was supplied.

Before uploading a public site or public GitHub repository, verify that your Gordita license includes webfont embedding and permits any public redistribution required by your hosting method. Desktop-font ownership alone does not necessarily grant web usage. Licensed WOFF2 would be preferable for production.
