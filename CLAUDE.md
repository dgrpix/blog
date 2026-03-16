# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Build and Development Commands

```bash
# Start local dev server (live reload)
hugo server

# Build for production
hugo
```

The site builds to `public/`. Hugo Extended is required (uses SCSS via PaperMod theme).

## Git

Always use `git pull --rebase`, never plain `git pull`. The CMS commits directly to main, so pulls are frequently needed before pushing.

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

### Anthem Weather (`static/apps/anthemweather/`)

Static weather app for a cruise itinerary. Self-contained HTML/CSS/JS.
