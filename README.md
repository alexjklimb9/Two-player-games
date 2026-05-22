# Two Player Games

A local co-op collection designed for two players sharing one phone.

## Active entry points

- `index.html`: Home screen + shared game shell that loads selected game scripts.
- `levels.html`: Level selection UI for each game mode.

## Core assets

- `style.css`: Shared app UI/layout styles.
- `level-cards.css`: Level card visuals.
- `hero-loader.js`: Populates game cards with hero art assets.
- `assets/heroes/`: SVG card art.

## Active runtime scripts loaded by `index.html`

- `balance-board-v2.js`
- `seesaw-entry-v2.js`
- `asteroids-crew-v3.js`
- `core-defense-clean-v2.js`
- `dual-gravity-v3.js`

## Versioned files

This repo contains versioned script snapshots (`*-vNN.js`) from game iteration.
To keep editing safe, this cleanup preserves them, while documenting the currently loaded files above.


## Known maintenance notes

- `levels.html` and `index.html` now both use cache version `v=161` for consistency.
- `dual-gravity-v3.js` no longer attempts to load missing `dual-gravity-level1-polish-v91.js`.
- Historical versioned files are still present; only scripts referenced by `index.html` are active entry launchers.
