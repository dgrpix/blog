# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Build and Development Commands

```bash
# Start local dev server (live reload) — always use port 1314
hugo server -p 1314

# Build for production
hugo
```

The site builds to `public/`. Hugo Extended is required (uses SCSS via PaperMod theme).

## Git

Always use `git pull --rebase`, never plain `git pull`. The CMS commits directly to main, so pulls are frequently needed before pushing. At the start of each session (or after any gap), run `git pull --rebase` before making changes — stash first if there are unstaged changes.

At the start of each session, also kill any running Hugo servers and start a fresh one: on Windows `taskkill /F /IM hugo.exe`, on Mac `pkill hugo`, then `hugo server -p 1314`. Always use port 1314 — port 1313 may be in use by another process. Only one person uses this machine and only one project is active, so this is always safe.

All pushes to `main` are automatically deployed to production via GitHub Actions.

## Deployment

GitHub Actions builds the site with Hugo and rsyncs `public/` to:
- **Host:** watermelon.sbg.org
- **Port:** 22743
- **User:** root
- **Path:** /var/www/dgrpix/
- **Deploy key:** `~/.ssh/dgrpix_deploy` (passwordless, stored as `SSH_KEY` secret in GitHub repo)

## Server Environment

- **OS:** Ubuntu 24.04.4 LTS (Noble Numbat), host "watermelon"
- **Web server:** Apache 2.4.58
- **Site root:** `/var/www/dgrpix`
- **Apache vhost config:** `/etc/apache2/sites-enabled/016-dgrpix.conf` (files directly in sites-enabled, not symlinked from sites-available)

## DNS & Domains

- **Canonical URL:** https://dgrpix.com
- **Three domains:** dgrpix.com, dgrpix.org, dgrpix.net — all managed at Porkbun
- dgrpix.com has the A record; .org and .net use ALIAS to dgrpix.com
- Wildcard CNAME on all three domains points to dgrpix.com
- All variants (www, naked, .org, .net) redirect to https://dgrpix.com

## SSL

Let's Encrypt via Certbot, webroot method. Certs are at `/etc/letsencrypt/live/`. Three separate certs: dgrpix.com, dgrpix.net, dgrpix.org.

## CMS

Sveltia CMS is available at https://dgrpix.com/admin. It commits directly to the GitHub repo (`dgrpix/blog`). Authentication uses a GitHub Personal Access Token — click "Sign In with Token" on the login screen. There is no Netlify dependency.

## Architecture

Hugo static site with PaperMod theme. Custom CSS overrides live in `assets/css/extended/custom.css`. Static files (including apps) are in `static/` and served as-is.

## Doug's Preferences

- Prefers step-by-step walkthroughs — present one step at a time and wait for confirmation before proceeding
- Will correct you if something is wrong — take the correction and move on
- Fahrenheit for temperatures, US-based conventions

## Apps

### FlipBoss (`static/apps/flipboss/`)

A card-dealing web app for TIBGD poker group flips. Fully client-side JavaScript, no server required.

**Versioning:** Bump the `VERSION` constant at the top of `index.html` with every change. Format is `v0.XXXX` (zero-padded integer).

**Data files** (`static/apps/flipboss/data/`):
- `donkeys.csv` — player list with active/inactive flag
- `spitecards.csv` — spite card assignments (card notation → player name) and specials
- `cardmap.csv` — mapping of card notation (e.g. `Ac`, `Kh`) to random.org image filenames

Card notation uses two-character format: rank + suit (e.g. `As`, `Kh`, `Td`, `9c`). Tens use `T`.

**Email output:** Copies formatted HTML to clipboard for pasting into Gmail. Card images are served from `https://www.random.org/playing-cards/`. The email uses `display:inline-block;vertical-align:top` on card wrappers and `display:block` on img tags to avoid baseline gap issues in email clients.

**Note:** `static/apps/flipboss.php` is the legacy PHP version, now superseded by the JS app. PHP on watermelon can be removed once the JS version is fully proven.

### SlotTracker (`static/apps/slottracker/`)

A personal slot machine session tracking PWA. Backend is PocketBase running in Container Station on a QNAP NAS, exposed only over Tailscale.

**Versioning:** Bump the `VERSION` constant at the top of `app.js` with every change. Format is `v0.XXXX` (zero-padded integer).

**Tech:** Vanilla JS PWA, no build step, dark theme. Hash-based router, panel switcher (no modals). AbortController + setTimeout for all fetches (not `AbortSignal.timeout` — iOS compat). Protected files fetched with Bearer token → blob URL for display. Image compression via Canvas API (max 1400px, JPEG 0.82) before upload. Auto-reauth on 401.

#### Backend architecture

PocketBase is reachable only over the Tailscale tailnet `siamese-egret.ts.net` (Apple Sign In). The PB container does not have a route from the public internet; access requires Tailscale to be connected on the client device.

```
[ MacBook / iPhone / Mac mini ]
            │
            └── Tailscale (peer-to-peer, magicDNS)
                    │
                    ▼
       https://pocketbase.siamese-egret.ts.net  (Let's Encrypt cert via Tailscale HTTPS)
                    │
                    ▼
    [ ts-pocketbase sidecar ]  ── runs `tailscale serve`, terminates TLS
                    │
                    │  Docker bridge network (slottracker app)
                    ▼
    [ slottracker-pb container ]  ── PocketBase, listening on :8090
```

Both containers live in one Container Station "Application" called `slottracker`:

- **`slottracker-pb`** — image `ghcr.io/muchobien/pocketbase:latest`. Listens on `:8090` inside the Docker network. Host port `8090` is also mapped (legacy; can be removed once nothing depends on the public path anymore).
- **`ts-pocketbase`** — image `tailscale/tailscale:latest` in userspace networking mode (`TS_USERSPACE=true`, no `NET_ADMIN`/`/dev/net/tun` needed). Joins the tailnet as hostname `pocketbase` (so the URL is `pocketbase.siamese-egret.ts.net`). Reads its serve config from a JSON file mounted in.

The host `crate` Tailscale node (the QNAP itself) is reserved for system-level access — SSH, future QTS UI Serve, etc. Per-service hostnames live in sidecars so future apps each get their own `*.siamese-egret.ts.net` URL without conflict.

#### File system paths on the QNAP

| Path | Purpose | Notes |
|---|---|---|
| `/share/Container/container-station-data/application/slottracker/docker-compose.yml` | The compose file Container Station uses | Edit via `vi`; Container Station re-reads it on Recreate |
| `/share/Public/pocketbase-data/slottracker/` | PocketBase data bind mount (`data.db`, `auxiliary.db`, `logs.db`, `storage/`, etc.) | **Not** a Docker named volume — visible on disk, snapshottable, rsync-able |
| `/share/Public/pocketbase-docker-tailscale-sidecar-config/serve.json` | Tailscale Serve config consumed by the sidecar | |
| Docker named volume `slottracker_ts_pocketbase_state` | Tailscale daemon state for the sidecar (auth state, certs) | Opaque; only relevant for re-auth recovery |

#### Critical gotcha: the muchobien/pocketbase data path

The `ghcr.io/muchobien/pocketbase` image writes data to **`/pb_data`** (root level), not `/pb/pb_data`. Online tutorials and the original SlotTracker compose got this wrong, and the result was that PocketBase silently wrote to `/pb_data` in the container's writable layer for months — until a recreate destroyed the writable layer and all the data with it.

The compose mount target MUST be `/pb_data:/pb_data`, not `/pb/pb_data:/pb_data`. Verify with:
```bash
docker exec slottracker-pb ls -la /pb_data
```
The host bind mount path should reflect the same files.

#### Container Station gotcha: don't drop runtime config in app dirs

Container Station re-syncs `/share/Container/container-station-data/application/<app>/` on its own schedule and will wipe files you put there that aren't part of its compose state. Specifically, when `serve.json` was placed in this directory, repeated Recreate operations replaced the file with an empty directory (Docker's auto-create-source behavior on a path that briefly didn't exist).

**Rule:** runtime config files referenced by bind mounts go under `/share/Public/` or another non-Container-Station-managed path. Reference them with absolute paths in the compose, never `./relative` paths.

#### Tailscale setup notes

- **Tailnet:** `siamese-egret.ts.net`, IdP: **Sign in with Apple**
- **Five nodes**, all with key expiry **disabled** where unattended: `dgrm4` (Mac mini, system daemon via `brew install tailscale`), `dgrmbp5m` (MacBook, GUI app), iPhone, `crate` (QNAP host, qpkg from `pkgs.tailscale.com/stable/qnap/` not the App Center version), `pocketbase` (sidecar in the slottracker stack)
- **HTTPS certs** enabled tailnet-wide → Let's Encrypt issues certs for `<host>.siamese-egret.ts.net` automatically on first request
- The Tailscale CLI on macOS GUI installs is bundled in the .app and does **not** work via raw symlink — use the GUI's Preferences → "Install CLI…" to drop the proper wrapper at `/usr/local/bin/tailscale`. On the Mac mini we instead use `brew install tailscale` (formula, not cask) which gives a system LaunchDaemon and CLI on PATH.
- The QNAP host's `tailscale` binary lives at `/share/CACHEDEV1_DATA/.qpkg/Tailscale/tailscale` (not on PATH; invoke by full path or with `sudo`).

#### Common ops

All run from the QNAP SSH session (`ssh -p 22743 dgr@crate.siamese-egret.ts.net`) unless noted.

```bash
# Tail PocketBase logs
docker logs slottracker-pb --tail 100

# Tail Tailscale sidecar logs
docker logs ts-pocketbase --tail 100

# See sidecar's current Serve config from inside the sidecar
docker exec ts-pocketbase tailscale serve status

# See host-level (crate) Serve config — should be empty; we don't use crate for app HTTPS
sudo /share/CACHEDEV1_DATA/.qpkg/Tailscale/tailscale serve status

# Snapshot the PB data dir to a tarball
tar czf /share/Public/pb-backup-$(date +%Y%m%d).tar.gz /share/Public/pocketbase-data/slottracker/

# Recreate the slottracker stack after a compose edit (preferred over manual docker commands)
# → Container Station UI → slottracker → Recreate

# Force-pull a newer PocketBase image
docker pull ghcr.io/muchobien/pocketbase:latest
# then Recreate via Container Station UI
```

#### Collections (PocketBase schema)

PocketBase version is **0.36.7** as of 2026-05-05. Note the terminology shift in this version: what older docs call "Required" is now **"Nonempty"**; what older docs call "Date" fields are now **"Datetime"**.

Default `users` auth collection holds the SlotTracker app user (`slottracker@dgrpix.net`). Three custom collections hold app data:

- **`visits`** — `casino` (text, nonempty), `visit_photo` (file, image MIME), `start_time` (datetime), `end_time` (datetime)
- **`sessions`** — `casino` (text, nonempty), `machine_name` (text, nonempty), `denom` (number, *starting* denom), `bet_per_spin` (number, *starting* bet), `peak_denom` (number, optional, highest denom played), `peak_bet_per_spin` (number, optional, largest wager-per-spin), `start_balance` (number), `end_balance` (number, optional), `start_time` (datetime), `end_time` (datetime, optional), `machine_photo` (file, image MIME, optional), `visit` (relation → visits, optional)
- **`bonuses`** — `session` (relation → sessions, nonempty), `spins` (number, optional), `bonus_type` (select single: `free_games` / `hold_and_spin` / `other`), `start_balance` (number), `end_balance` (number, optional), `bonus_time` (datetime), `bonus_video_url` (URL/text, optional), `bonus_denom` (number, optional, denom when bonus hit), `bonus_bet_per_spin` (number, optional, bet when bonus hit)

API rules on all three: `@request.auth.id != ""` for **list / view / create / update**. Delete is superuser-only by default.

The `peak_*` fields on sessions and `bonus_denom` / `bonus_bet_per_spin` on bonuses were added 2026-05-05 to support a start-vs-peak denom/bet model. The app code in `app.js` does not yet write these — that's tracked as deferred work in the project memory file.

#### Common failure modes & fixes

- **Browser: "cert not publicly disclosed via CT"** after migration — almost always a stale cached cert in the browser. Test in a private/incognito window first; if it works there, the original tab is just cached.
- **App: "● Cannot reach PocketBase — connect to VPN"** — Tailscale isn't connected on the client device, OR the sidecar isn't running. Check the Tailscale toggle first, then `docker logs ts-pocketbase`.
- **Auth fails with "Reached PocketBase but authentication failed"** — credentials issue, OR the `users` collection / record was wiped. Verify the user record exists in the admin UI. The connection itself is fine if you got this message (auth path is reachable).
- **Data appears empty after a recreate** — verify the compose mount target is `/pb_data` (not `/pb/pb_data`). If the data is inside the container at `/pb_data` but not on the bind mount, copy it out before any further recreates: `docker cp slottracker-pb:/pb_data/. /share/Public/pocketbase-data/slottracker/`.
- **Container Station Recreate keeps wiping a config file** — file is in a Container-Station-managed directory. Move it under `/share/Public/` and update the compose to use the absolute path.

**Full project state and pending work:** see memory file `project_slottracker.md`.

### Anthem Weather (`static/apps/anthemweather/`)

Static weather app for a cruise itinerary. Self-contained HTML/CSS/JS.
