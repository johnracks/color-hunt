# Color Hunt — To-do list

## Next features

### Map of finds
**Done in the book as a paid upgrade (map pages per color + overview).** Still to do: an interactive map in the app.

Show every hunter's photos on a map, pinned where they were taken.
- Data is already being collected: each new photo with location info saves `lat`, `lng`, `place` and `takenAt`.
- Map page per hunt (`#h1234-map`): pins colored by each hunter's color, tap a pin to see the photo.
- Library: free map tiles from OpenStreetMap through Leaflet or MapLibre (no key needed for light use).
- Optional extras: a "route" line in the order photos were taken, a map page in the photo book, and a per-hunter filter.
- Note: iPhones often remove location from photos picked in a browser. Consider letting hunters tap "add location" by hand.

### Before charging money
- [ ] Connect Stripe Checkout for map pages and printed books (prices live in `PRICES` in the app; set `paymentsLive: true` in config.js when ready).
- [ ] Pick a print-on-demand partner (Lulu, Prodigi, Gelato) and send saved print orders (`hunts/{code}/orders`) to it after payment.
- [ ] Map tiles: switch from the free OpenStreetMap tiles to a commercial provider (for example MapTiler or Stadia Maps, free tiers with an API key). OSM's free tiles aren't meant for paid apps or heavy use.

### Sign-in options
- [ ] Sign in with Shop: waiting on Shopify sign-in, then create a Shop sign-in app and add it as a custom provider in Supabase.
- [ ] Google sign-in: free; create OAuth credentials in Google Cloud, then switch on in Supabase.
- [ ] Apple sign-in: needs an Apple Developer membership ($99/year).
- [ ] Custom email sender (for example Resend or Postmark) so "Forgot password" emails reach everyone.

### Polish & safety
- [ ] Only the organizer (and each hunter for their own photos) can edit or delete — right now any signed-in user could.
- [ ] Remove the test hunt (code 6867).
- [ ] Optional custom domain (for example colorhunt.fun).

## Ways to make money (options to explore)

1. **Printed photo books (most natural fit).** Order a hardcover book straight from the app. Use a print-on-demand service with an API (Lulu, Prodigi, Peecho or Gelato). They print and ship; you add a markup ($10–25 per book).
2. **Free to play, pay for extras ("Pro" hunts).** Free: up to 6 hunters and 20 photos each. Pro, one-time $4.99–$9.99 per hunt: unlimited hunters, more photos, full-quality print PDF, no Color Hunt branding, extra book themes.
3. **Book themes and layouts.** Sell theme packs (holiday, wedding, kids, vintage film) for $1.99–$3.99.
4. **Events & business plans.** Branded hunts for weddings, conferences, schools, team-building and tourism boards, with custom logo and colors, a live slideshow, and bulk downloads. Charge per event ($49–$199) or monthly.
5. **Sponsored and partner hunts.** Partner with towns, parks, museums or brands for themed hunts (for example "Find our colors downtown"), with prizes. They pay for placement.
6. **Tips / "support the app".** A small, optional tip jar. Low effort, low income.

**How payments would work:** Stripe Checkout for one-time purchases and subscriptions. A Supabase Edge Function confirms the payment and unlocks the hunt. Print orders are sent to the printer's API after checkout.
