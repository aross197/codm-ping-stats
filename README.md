# NIGHT RAID · COD Mobile Clan HQ

A dark, neon clan website for Call of Duty: Mobile — roster, server pings, and player lookup.

**Live (after enabling Pages):** https://aross197.github.io/codm-ping-stats/

## Features

- **Clan branding** — name, tag, motto, about text (edit `config.js`)
- **Roster** — add members by nickname/UID, refresh stats, remove
- **Hero stats** — member count, average rating, best region ping
- **Server ping tester** — 11 regions used by COD Mobile
- **Player lookup** — level, rank, rating, country

## Customize your clan

Open `config.js` and change:

```js
const CLAN = {
  name: 'NIGHT RAID',
  tag: 'NR',
  motto: 'Strike fast. Leave nothing.',
  about: 'Your clan description…',
};
```

## Enable GitHub Pages

1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` · folder: `/ (root)` → Save
4. Open https://aross197.github.io/codm-ping-stats/

## Notes

- Roster is stored in the browser (localStorage) on each device
- Pings are HTTPS estimates to regional cloud endpoints — in-game HUD is authoritative
- Stats come from a public unofficial webstore-style API
- Not affiliated with Activision / TiMi

## License

MIT
