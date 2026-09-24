# ⚽ KickTime 2026

A personal World Cup 2026 planner. Because the tournament is played across the USA, Mexico and Canada, many matches kick off in the middle of the night for European fans. KickTime helps you catch the games that actually matter **to you** — at times that fit your daily life, spoiler-free.

> Also works great for anyone in any time zone: every kickoff is shown in your local time.

## The idea

At the start you tell the app two things:

1. **Your teams** — your absolute favorites (⭐) and other teams you find interesting (🔔).
2. **Your time windows** — when you actually have time to watch, separately for weekdays and weekends.

From that, the app builds a personal dashboard: a "Perfect Matches" feed of the games you shouldn't miss, a countdown to the next big kickoff, and smart filters so you never scroll through 100 irrelevant fixtures again.

## Features

- **Personal Dashboard** – Perfect Matches tailored to your favorites and availability, tournament phase overview, and a countdown until the next match.
- **Full Match Schedule** – Every World Cup match in your time zone, with search, filters (team, group, stage, "special matches"), broadcaster info and travel/weather notes for the host cities.
- **Group Tables** – Live standings for all 12 groups.
- **Tournament Tree** – From round of 32 to the final, with placeholders that automatically fill in with real teams as the bracket develops.
- **Tournament Status** – Who is still in, who is out? Tap any country for a detail sheet with squad, coach, FIFA ranking and World Cup titles.
- **Predictions** – Friendly prediction rounds for group and knockout games.
- **Spoiler Protection** – Results from matches that finished overnight stay hidden until you reveal them. A global switch syncs across every part of the app.
- **Live Scores & "Now on TV"** – Live scores fetched from the free OpenLigaDB API (refreshed on a strict 5-minute cycle), with a live bar showing what's on air right now and which channel (MagentaTV, ARD, ZDF) is broadcasting.
- **Push Notifications & Alarms** – Per-match reminders on your phone or desktop (Web Push with VAPID), plus a global push toggle.
- **Endgame Experience** – When the final ends, a winner celebration with confetti and a permanent Hall of Fame banner.

## Admin panel

A hidden admin area (protected by a PIN that lives only in server-side secrets) lets the operator:

- Manually correct live scores, match phases (1st half, half-time, 2nd half) and statuses
- Force-refresh data from the API or re-sync the group stage
- Monitor the system and browse the error log
- View visitor telemetry (online now, last 24h, 7 days, total)

Manual overrides are smart: the official API result always wins once it reports a higher score or a finished match, so corrections never stick wrongly. Finished results are stored persistently in the database so phase changes never wipe them.

## Tech stack

- **Frontend:** React 19, TanStack Start (SSR), TanStack Router & Query, Tailwind CSS v4, shadcn/ui, Framer Motion, Zustand
- **Backend:** Supabase (PostgreSQL, Edge Functions, pg_cron) and the free [OpenLigaDB API](https://api.openligadb.de) for live scores
- **Push:** Web Push (VAPID) via a Supabase Edge Function on a cron schedule
- **Hosting:** Cloudflare Workers (edge)


## Project structure (short version)

```
src/
├── routes/        # one file per page (dashboard, schedule, tables, bracket, ...)
├── components/    # UI building blocks (match cards, sheets, nav, admin, ...)
├── store/         # global app & match state (Zustand)
├── lib/           # logic: time, standings, bracket phases, overrides, push
├── data/          # static data: teams, groups, broadcasters, squads
└── integrations/  # Supabase clients

supabase/functions/  # edge functions: live scores, push reminders, admin override
```

A deep-dive into the full system architecture lives in [KICKTIME_ARCHITECTURE.md](./KICKTIME_ARCHITECTURE.md).

## License

Personal project — built for enjoying the World Cup 2026 without missing a beat. 🏆

Copyright Notice: All rights reserved. Downloading, copying, or re-hosting this project to publish or operate it as your own application is strictly prohibited.
