# Healthcare AI GYM — Project Page

[![arXiv](https://img.shields.io/badge/arXiv-2605.02943-b31b1b.svg)](https://arxiv.org/abs/2605.02943)
[![Page](https://img.shields.io/badge/project-page-0d9488.svg)](https://minstar.github.io/helathcare-ai-gym/)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

Project / landing page for the paper **“Healthcare AI GYM for Medical Agents”** (arXiv 2605.02943).

🔗 **Live page:** https://minstar.github.io/helathcare-ai-gym/

---

## What's here

A self-contained static site (no build step, no dependencies) that introduces the paper:

- **Animated “overall workflow”** — Figure 1 (Agent ↔ GYM ↔ Tools/KB ↔ Reward → RL) rebuilt as an
  interactive SVG that plays *like a video*: play / pause / step controls, traveling data particles
  along each connection, active-node highlighting, and a synced caption explaining every step.
- **Animated TT-OPD training pipeline** — Figure 2 (rollout → classification → EMA teacher → update).
- Abstract, five contributions, the environment (10 domains · 135 tools · 828K-passage KB · 5D reward),
  the TT-OPD method and its three self-distillation failure modes, the full benchmark table, and a
  **tool-internalization analysis** (Progressive Spec Withdrawal + a 31.5K-call tool-hallucination taxonomy).

```
index.html            # the page (inline SVG scenes)
assets/style.css      # styles
assets/app.js         # animation engine + interactions (vanilla JS)
assets/img/           # training-dynamics figure
```

## View locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

(Any static file server works — the page has zero runtime dependencies. A server is only needed so the
browser loads `assets/` over `http://` rather than `file://`.)

## Deploy on GitHub Pages

1. Push to `main` (already the case for this repo).
2. **Settings → Pages → Build and deployment → Source: “Deploy from a branch”**, branch **`main`**, folder **`/ (root)`**.
3. The site goes live at `https://minstar.github.io/helathcare-ai-gym/` within a minute.

`.nojekyll` is included so the files are served verbatim (no Jekyll processing).

## Citation

```bibtex
@article{jeong2026healthcareaigym,
  title   = {Healthcare AI GYM for Medical Agents},
  author  = {Jeong, Minbyul},
  journal = {arXiv preprint arXiv:2605.02943},
  year    = {2026}
}
```

## License

Apache License 2.0 — see [LICENSE](LICENSE).
All patient data referenced is **synthetic**. Research artifact only — **not** for clinical use.
