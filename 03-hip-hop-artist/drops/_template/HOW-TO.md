# Shipping a new drop page

1. Copy this `_template` folder and rename it to the new slug, e.g. `drops/cold-front/`.
2. Edit `drop.json`: title, date, video, streaming links, lyrics, credits, capsule items, and the three `more` drops.
3. Replace `og.png` with a 1200x630 share card (title in the display gothic).
4. Update the three `og:` lines in `index.html` `<head>` (share scrapers do not run JavaScript).
5. Only if you want to preview by double-clicking the file (no web server): paste the same JSON into the `<script id="drop-mirror">` block at the bottom of `index.html`.
6. Point the homepage at the new drop: in `/index.html`, change `data-drop-src` to `drops/<slug>/drop.json` and refresh its mirror block.

Nothing else changes. The page structure, styles and behaviour all come from the shared `styles.css` and `script.js`.

Demo note: this is a fictional demonstration site by ThinkFirst Studios. Not a real artist.
