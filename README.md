# Gordita setup (font files not included)

The four attached desktop OpenType files were verified: Gordita Regular, Medium, Bold, and Black. The V3.1 screenshots were rendered with them, but **font binary files are not redistributed in this download**.

To preview with your own licensed font files, copy your `.otf` files into this `assets/fonts/` folder and rename as:

- `Gordita-Regular.otf` ← `Gordita-regular(2).otf`
- `Gordita-Medium.otf` ← `Gordita-medium(2).otf`
- `Gordita-Bold.otf` ← `Gordita-bold(2).otf`
- `Gordita-Black.otf` ← `Gordita-black(2).otf`

Those exact paths are referenced in the CSS. If omitted, the site gracefully falls back to Outfit and system fonts. The Regular file is also used for the lightest styled text because no separate Light font was supplied.

Before uploading a public site or public GitHub repository, verify that your Gordita license includes webfont embedding and permits any public redistribution required by your hosting method. Desktop-font ownership alone does not necessarily grant web usage. Licensed WOFF2 would be preferable for production.


## Portfolio content dashboard

The portfolio content dashboard lives at `/admin/`, currently:

`https://mxgcreate.github.io/maxgrunner-portfolio/admin/`

It uses [Sveltia CMS](https://sveltiacms.app/) with the GitHub repository as the content store. The dashboard URL is discoverable on the public site, but only GitHub users with repository write access and a valid token can save changes. Do not put credentials into the repository or send them over chat.

### First sign-in

1. Open the dashboard and select **Sign In with Token**.
2. Follow its GitHub token link, or create a **fine-grained personal access token** under GitHub Settings → Developer settings → Personal access tokens.
3. Limit repository access to `MXGCREATE/maxgrunner-portfolio` and grant **Contents: Read and write** (Metadata: Read is automatically included). Do not select unrelated repositories or broad scopes.
4. Paste the token **into the CMS sign-in dialog only**. Treat it like a password and revoke it from GitHub if you suspect exposure.

GitHub Pages cannot perform a GitHub OAuth code exchange by itself. A friendlier OAuth login would require a separately hosted OAuth authenticator (e.g. Sveltia Authenticator on Cloudflare Workers).

### Editing and publishing

- **Portfolio Videos:** Add, edit, duplicate, delete and drag-and-drop reorder entries in `data/projects.json`.
- **Site Text:** Edit homepage, About, gallery headings and contact copy in `data/site.json`.
- **Thumbnails:** Paste an HTTPS thumbnail URL, or upload an image into `assets/thumbnails`. Uploaded images override the URL.
- **Featured carousel:** Set `featured_film_order` to a unique position from 1 to 3. Leave empty for gallery only.
- **Vimeo:** Paste a Vimeo page link, including any unlisted hash. The public site generates the iframe link automatically.
- **Publish:** Save changes in the CMS to commit to `main`. GitHub Pages redeploys the site from that commit. Check the Actions tab if it doesn't appear shortly.

The **source of truth** is `data/projects.json`, which `app.js` loads at runtime. `data/projects.js` is only a backward-compatibility fallback snapshot; the browser normally ignores it. The master project JSON is kept in manual display order: do not sort it by numeric `id` or stale `selected_work_order` values. The existing imported metadata fields are retained even if they are not shown in the editor.

The image path resolver supports both GitHub Pages' project subpath and a custom root domain. After the domain switch, update `site_url` and `display_url` in `admin/config.yml` to your live custom domain.

### Safety / limitations

- The CMS editor itself is publicly addressable; **write access is restricted by GitHub**, not a secret URL.
- An editor's Save/Publish action makes a Git commit and triggers a deployment; it is **not** a private draft review system.
- Each featured slot should have one project. If you remove every featured project, the featured carousel will be hidden.
- Keep your Vimeo videos' privacy/embed settings compatible with the custom domain.
- For the unreleased Caleborate / Real Person Tour documentary, confirm the rights and approval to display it publicly.

## Category-specific video ordering

Use **Arrange Videos → Category order** in the Sveltia dashboard. Each of the three lists (Commercial, Documentary, Music & Culture) contains the matching video titles. Drag an item's handle to reorder it and select **Save**. This commits `data/gallery-order.json` and publishes through GitHub Pages.

The public site applies each list **within the corresponding category filter**. In the All Work view, each category occupies the same slots as before, and its videos are reordered within those slots, preserving the overall interleaving of categories. A new video or one whose title no longer appears in the ordering file is still shown at the end of its category; add it to the list to choose an exact position.

**Portfolio Videos** is still the place to add/edit/delete videos, select a category, and update Vimeo links or metadata. It also has Sveltia's built-in list reorder control, but use **Arrange Videos** for the intentional per-category published order. Avoid placing a title into two category lists. Renaming a project should be followed by a quick check that its title still appears in the matching Arrange Videos list.
