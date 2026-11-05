# ASTRA: Digital Accounting Education Hub

A gamified, static website (HTML + CSS + vanilla JS, no build step) with supplementary resources and practical learning activities for digital accounting education.

## Sections
- **Home**: overview cards plus two warm-up games (*Balance the Entry* and *Think Critically*).
- **Students**: *Five Habits That Pay Off*. Play the Bayanihan Bakeshop case study (5 challenges); each one you clear unlocks a habit for your inventory. Below it are the **Side Quests**: 3 accounting competency mini-games with 10 activities each, an answer key, and explanations.
- **Resource Hub**: tutorials, spreadsheet exercises, videos, case studies, and templates, shown in a spreadsheet-style panel.
- **Educators**: seven suggested teaching approaches, each with "How to apply?" steps.
- **PLV Admins**: five suggested university policies.

Extras: a 3D loading screen (spinning calculator-key cube), 3D tilt cards, the timed **Debit or Credit Rush** game on Home, 10 collectible **badges** (click the XP screen in the header), confetti, an optional sound toggle, and keyboard shortcuts (1–4 / A–D to answer, Enter for next, ←/→ in Rush).

XP, rank, unlocked habits, and best scores are saved in the visitor's browser (`localStorage`). "Reset my progress" in the footer clears them.

## Editing content
All text, questions, answers, and links are in **`js/data.js`**. `js/app.js` only renders the content and runs the games.

- Quiz answers use a zero-based `answer` index (0 = A, 1 = B, …). Side-quest choices are shuffled when a game is played.
- Add a resource link by adding `{ tag, label, url, kind }` to a `HUB_TABS` entry (`kind`: `"video"`, `"site"` or `"internal"`).

## Run locally
Open `index.html` in a browser, or run:

```bash
npx serve .
```

## Deploy
Import the repo into Vercel or Netlify, or turn on GitHub Pages. No build settings are needed.

## Logo
`assets/logo/astra-mark.svg` is the ASTRA mark: a raised calculator key with a four-point star (*astra* means "stars") and the + − × ÷ operators in the corners. `astra-logo-horizontal.svg` is the mark with the wordmark. `assets/favicon.svg` is a copy of the mark.
