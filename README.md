# 🎭 Rangmanch Theatre Co. — Website

A cinematic, dark-theme website for our independent Indian theatre production company — built to showcase our shows, our people, and (soon) sell tickets directly.

> **Note:** "Rangmanch Theatre Co." is a placeholder brand. Show titles, dates, artists, photos, and contact details are sample content to be replaced with the company's real information.

## ✨ Features

- **Curtain-raise hero** — animated stage curtains, drifting spotlight, floating dust motes, and live counters
- **Now Showing** — show cards with poster art, dates, venues, prices, and booking buttons
- **Direct booking preview** — a working seat-selection modal (premium/regular pricing, sold seats, live ₹ total), ready to be wired to a real backend
- **Partner booking links** — BookMyShow and District buttons on every show
- **About, Past Productions, Cast & Crew, Gallery, Press Reviews** — the full company story
- **Newsletter signup** — start building the audience list early
- Fully responsive (mobile menu included), keyboard-accessible, honors `prefers-reduced-motion`

## 🗂 Project structure

```
├── index.html          # Single-page site — all sections
├── css/style.css       # Dark auditorium theme (gold + crimson on near-black)
├── js/main.js          # Nav, scroll reveals, counters, booking modal, newsletter
└── .claude/launch.json # Local dev server config
```

No frameworks, no build step — plain HTML/CSS/JS. Fonts: Playfair Display (display), Inter (body), JetBrains Mono (labels), via Google Fonts.

## 🚀 Run locally

```bash
python3 -m http.server 4173
# then open http://localhost:4173
```

Or use any static file server — there is nothing to build.

## 🎟 Ticketing roadmap

1. **Now** — booking buttons link out to BookMyShow and District listings; the on-site seat picker is a front-end preview.
2. **Next** — direct booking with a seat-allotment split: a block of seats reserved for direct sales, the rest listed on partner platforms (no double-booking risk, no API needed).
3. **Later** — official partner/API integration for true real-time shared inventory, plus payment gateway (Razorpay/UPI) on our own platform.

## 🖼 Replacing placeholder content

- Swap the company name, shows, dates, venues, and prices in `index.html`
- Drop real production stills into an `images/` folder and point the gallery tiles at them
- Update the BookMyShow/District links to your actual event URLs
- Update contact details and social links in the footer

## 🌏 Launch plan

Launching in India first; international touring and diaspora audiences next.
