# ASTRA: Digital Accounting Education Hub

A gamified, static website (HTML + CSS + vanilla JS, no build step) with supplementary resources and practical learning activities for digital accounting education.

## Sections
- **Home**: overview cards plus two warm-up games (*Balance the Entry* and *Think Critically*).
- **Habit Hub** (Students section): *Five Habits That Pay Off*. Play the Bayanihan Bakeshop case study (5 challenges); each one you clear unlocks a habit for your inventory. Below it are the **Side Quests**: 3 accounting competency mini-games with 10 activities each, an answer key, and explanations.
- **For Accounting Students** (resource hub): tutorials, spreadsheet exercises, videos, case studies, and templates, shown in a spreadsheet-style panel.
- **Educators**: seven suggested teaching approaches, each with "How to apply?" steps.
- **PLV Admins**: five suggested university policies.

Home highlights: overview cards that flip in 3D and show the visitor's progress, a hanging balance scale where you drag amounts onto the pans, a 4-question Skill Check (intellectual, personal, technical, interpersonal) with an achievement summary, and an interactive background (cells light up around the cursor, floating + − × ÷ ₱ symbols react to it, and clicking empty space sends out a ripple). On phones the navigation becomes a burger menu.

Extras: a 3D loading screen (spinning calculator-key cube), 3D tilt cards, the timed **Debit or Credit Rush** game on Home, 10 collectible **badges** (click the XP screen in the header), confetti, a **Settings** panel (⚙ in the nav / burger menu: sound effects + volume, background music + volume (the soundtrack changes per section: Lo-fi on Home, Balance Sheet Bounce during Rush, Bakeshop Quest on Students, Audit Mode in side quests, Quiet Study in the Hub, Faculty Lounge for Educators, Boardroom for PLV Admins), animated background, 3D motion, confetti, loading screen, reset progress), and keyboard shortcuts (1–4 / A–D to answer, Enter for next, ←/→ in Rush).

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

## Live results (optional database)
The policy *Priority* and the approach *"Where are you with this approach?"* questions show live results from every visitor (for example, "Most users said: Medium"). Votes are stored by the small Vercel function in `api/votes.js`.

To turn it on:
1. In the Vercel dashboard, open the ASTRA project, then go to **Storage**, choose **Create Database**, and pick **Upstash for Redis** (free plan).
2. Connect it to this project for all environments. Vercel adds the `KV_REST_API_URL`/`KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`) variables automatically.
3. Redeploy. The live-results box appears under those questions.

Until a database is connected, the box stays hidden and everything else works normally. Each browser counts as one voter. Changing a choice moves that visitor's vote instead of adding another.
