# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: mission planners.** They compare candidate landing sites near the lunar south pole and
  pick a landing date. Their questions: where should we land, when, how much sunlight will the site
  get, when will Earth be in view, and which candidate is best overall for our mission length.
- **Also served: teachers and the public.** Teachers explain why sunlight and seeing Earth decide where
  missions land; the public explores the Moon. They are served by plain words on the first view, with
  exact numbers and explanations one step away.

## Product Purpose

Lunalyze (team RGX, NASA Space Apps 2026, challenge "Lunar Landing Site Navigator") answers one
question: **which landing site, and which week?**

For up to 3 sites, a landing date and time, a flexible date window, and a mission length, it shows
where the Sun and Earth are relative to each site's local horizon, how much of the time the site is
in sunlight (solar power) and has Earth in view (direct-to-Earth contact), and the longest stretch
with neither. Success: a user can say which site and date fits their mission, and why, from what is
on screen.

## Positioning

A decision-support tool, not a Moon visualisation. It answers "which site, and when?" for the user's
own mission length, counting the hills that hide the Sun and Earth, and ends in a plain verdict per
site: **"Fits your mission"** or **"Risky"**, with a one-line reason.

## Operating Context

- Browser-only app, one screen (**Compare**). Before any site is picked it shows a setup step: places,
  date and time (UTC), how flexible the date is (that day / within a month / any time that year), and
  how long the mission stays (½, 1, 2 or 3 Moon days; one Moon day is about 29.5 Earth days).
- The whole scenario lives in the URL, so a shared link opens the same comparison.
- Built in a two-day hackathon by two people; submission and demo video on 2026-11-15.

## Capabilities and Constraints

- Comparison regions: scenario bar, site columns, horizon strip, countdown chips, metric cards,
  timeline lanes, site picker. The south-pole map, 3D view and best-date suggestions are later
  priorities (docs/DESIGN.md, docs/PLAN.md).
- Every number on screen comes from the calculation code in `backend/lib/`; visuals never produce numbers.
- Test data (`fixture: true`) is fake terrain and is always labelled as such on screen.
- Sites come from a fixed list of 13 notable places; typing your own location is not supported yet.
- The fit rule: a site fits when no period without Sun and Earth exceeds 50 hours during the stay.
- English only. All copy goes through translation files.
- Terminology on screen is plain language: "Time in sunlight", "Time Earth is in view", "Moon day",
  "Sunset in…", "hidden by hills". No jargon such as azimuth, ephemeris or illumination fraction.

## Brand Commitments

- Name: Lunalyze. Tagline: "Turning lunar terrain data into confident landing decisions"
- Voice: plain, clear and calm. Explain, don't impress.
- NASA data is credited (LRO LOLA polar height maps, PGDA 69, PGDA 90, JPL Horizons). No NASA logos
  on AI-made content.
- Images are used only with the right to use them. The landing image is NASA/JPL Galileo PIA00131,
  credited on screen.

## Evidence on Hand

- Site list with coordinates: `backend/public/data/sites.json` (13 sites).
- Test data for 3 sites (Point A, Malapert M1, Apollo 11) covering March 2028; real horizon data is
  in progress.
- Sun and Earth positions are checked against NASA JPL Horizons to within 0.01°.
- No user research, testimonials or mission partners exist; do not invent them.

## Product Principles

1. **Answer the question.** Everything on screen helps decide which site and which week; anything else
   is cut first.
2. **Plain words first, detail one step away.** Non-experts read the verdict; planners open the numbers.
3. **Honest data.** Fake data says so; every number has a unit, a time range and a source.
4. **Compare, don't just explore.** Side-by-side comparison is the core experience.
5. **Same meaning, same look.** Sun, Earth, visible and hidden look the same everywhere.

## Accessibility & Inclusion

- WCAG 2.1 AA.
- Meaning is never carried by colour alone: Sun and Earth differ by label and marker shape; hidden is
  dashed, visible is solid.
- Native controls with keyboard support; the time scrubber takes arrow = 1 hour, shift+arrow = 1 day.
