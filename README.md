# PanBase project page

Source of the project page for **Change the Base, Change the Game: Rethinking Pan-sharpening**
(PanBase; Jeonghyeok Do, Geunhyuk Youk, Munchurl Kim; KAIST; arXiv preprint, 2026).

- Live page: https://kaist-viclab.github.io/PanBase_site/
- Code repository: https://github.com/KAIST-VICLab/PanBase
- Model weights: https://huggingface.co/JeonghyeokDo/PanBase

The page is plain HTML, CSS and JavaScript with no build step and no dependencies other than Google Fonts.
GitHub Pages serves it from the repository root (`.nojekyll` turns off Jekyll processing).

## Preview locally

Serve the folder over HTTP rather than opening `index.html` from disk, so that every path resolves as it does on GitHub Pages:

```bash
cd PanBase_site
python3 -m http.server 8000
# then open localhost:8000 in a browser
```

## Layout

```
index.html                the page (results first: headline figure, interactive gallery and paper figures, quantitative results, then a compact method overview)
static/css/family.css     styles shared with the other KAIST-VICLab family pages (the same file on each)
static/js/family.js       scripts shared with those pages: navigation, abstract toggle, pending links, BibTeX copy,
                          image lightbox, tabs, table scroll cues
static/css/style.css      PanBase brand colours (top of the file) and the gallery, configuration picker, comparison slider and table extras
static/js/main.js         interactive gallery (tile strips in carousels, loaded only when shown), image / error-map view,
                          comparison slider with a choice of both sides, crop or whole image
static/images/            paper figures: *_1200.jpg / *_2000.jpg are inline, *_full.jpg open in the lightbox;
                          og.jpg (social preview) and the logo files
static/tiles/             gallery tiles, one folder per comparison, sensor and test image: <tile>.png is the crop of the
                          paper figure at native resolution (the base comparison uses the figure's x4 Lanczos tiles,
                          <tile>.jpg), <tile>_full.jpg the whole test image, err_<tile>.* the absolute error map
static/paper/PanBase.pdf  the paper (PDF), opened by the Paper button and the navigation bar's Paper link
```

## Logo

The PanBase logo is included: `static/images/logo.svg` is the hero title (its text is outlined, so no font is needed),
`icon.svg` is the navigation and footer mark, and `icon_square.svg` (the SVG favicon), `favicon-32.png`, `favicon-64.png` and
`apple-touch-icon.png` are the browser and home-screen icons. The page title and headings use the typeface of the family
pages, Outfit (loaded from Google Fonts), and the logo's ink, `#1C2738`. The accent colour is the paper's colour for PanBase
in its tables (BlueGreen): `#037879` for text, rules and borders, and `#F3FBFB`, the tint of the PanBase rows in the paper,
for highlighted rows and fills. The logo uses the same BlueGreen for "Base" and the layers under its tile. All colours of
the page are set at the top of `static/css/style.css`.

## arXiv link

The paper was submitted to arXiv and its identifier is not known yet. Until it is, the arXiv button, the footer's arXiv
link and the BibTeX entry carry a placeholder identifier; such a link is shown as pending (the arXiv button carries a
"soon" badge) and does not navigate. Setting the identifier in `index.html` is enough; no CSS or JavaScript file needs
editing. The Paper button and the navigation bar's Paper link open the hosted PDF, `static/paper/PanBase.pdf`.
