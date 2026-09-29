# COD Mobile · Ping Tester + Player Stats

Fast static site that:

- Measures browser latency to the main cloud regions COD Mobile uses (US, EU, Asia, Middle East, SA, Oceania)
- Looks up basic player stats (level, multiplayer rank, rating, country) by **nickname** or **UID**

> **Not affiliated with Activision or TiMi.**  
> Real game traffic is proprietary UDP. The ping numbers are regional HTTPS estimates (same approach used by most public CODM ping tools). In-game HUD ping is the final word.

## Live demo

After you enable GitHub Pages (see below):

**https://aross197.github.io/codm-ping-stats/**

## Enable GitHub Pages (30 seconds)

1. Go to the repo → **Settings** → **Pages**
2. Under **Source**, choose **Deploy from a branch**
3. Branch: `main` / folder: `/ (root)` → **Save**
4. Wait ~30–60 s, then open the URL above

## How to use

### Ping test
- Click **Test All** or individual **Test** buttons
- Green = good (<60 ms), yellow = ok, red = high

### Player stats
1. Open COD Mobile → tap your avatar → **Basic** tab → copy **UID**, or just type your exact nickname
2. Paste into the lookup box and hit **Lookup**

Data comes from a public unofficial endpoint that reads the same webstore profile the official top-up sites use. It is limited to level / rank / rating (not full match history).

## Tech

- Pure HTML / CSS / JS (no build step)
- Works on phone browsers so you can check before queueing
- Regions use AWS DynamoDB public endpoints as stable latency proxies

## License

MIT — do whatever you want with it.
