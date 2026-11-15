# Color Hunt — standalone website

A static site (no server code) backed by a free Supabase project for shared data and photo storage.

## 1. Set up Supabase (about 5 minutes)
1. Create a free project at https://supabase.com.
2. Open **SQL Editor → New query**, paste everything in `supabase-setup.sql`, and click **Run**.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key.
4. Paste both into `config.js`.

## 2. Host it (any static host works)
- **Netlify:** drag this whole folder onto https://app.netlify.com/drop
- **GitHub Pages:** push this folder to a repo → Settings → Pages → Deploy from branch (root).
- **Vercel / Cloudflare Pages:** import the folder as a static site with no build step.

## Notes
- Anyone with the link can create or join hunts and upload photos. That's fine for testing with friends; add sign-in before going public.
- Supabase's free tier includes 1 GB of file storage — roughly 2,000–3,000 photos at the size the app saves.
