# Auth setup & testing guide

studyBuddy now requires a free account to open any chapter (Notes / PYQs /
MCQs / Sample Papers). The homepage and subject list pages stay open to
everyone. This is built on **Supabase Auth** with email/password signup AND
"Continue with Google".

I could not test the live connection myself — my environment has no network
access to your Supabase project. Everything below is correct *code*, verified
for syntax and logic, but you need to do the steps in this guide once to
actually turn the lights on, then test it yourself using the checklist at the
bottom.

## 1. One-time Supabase dashboard setup

Go to **supabase.com → your project → Authentication**.

### a) URL Configuration (Authentication → URL Configuration)
- **Site URL**: set this to your real deployed domain once you have one,
  e.g. `https://studybuddy.co.in` (use `http://localhost:PORT` temporarily
  if you're testing locally first with a local server).
- **Redirect URLs**: add the exact callback URL the Google button uses:
  `https://studybuddy.co.in/auth/callback.html`
  (and also add `http://localhost:PORT/auth/callback.html` if testing
  locally — you can have multiple URLs in this list, one per line/entry).

This step matters a lot — if it's wrong, Google login will appear to work
but the user will land on the wrong page or get stuck on a blank screen.

### b) Email auth (Authentication → Providers → Email)
This is already on by default. Decide one thing:
- **"Confirm email" toggle**: if ON, new users must click a link in their
  inbox before they can log in (more secure, slightly more friction). If
  OFF, they're logged in immediately after signing up. Either way works
  with the code already written — I handled both cases — just know which
  one you've chosen so the behavior makes sense when you test it.

### c) Google provider (Authentication → Providers → Google)
This is OFF by default and requires you to do a bit of one-time setup in
**Google Cloud Console** (separate from Supabase, free, takes ~10 minutes):

1. Go to [console.cloud.google.com](https://console.cloud.google.com) →
   create a project (or use an existing one).
2. Go to **APIs & Services → OAuth consent screen** → fill in an app name,
   support email, and add your domain once you have one. For testing you
   can leave it in "Testing" mode with your own Google account added as a
   test user.
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth
   client ID** → Application type: **Web application**.
   - **Authorized redirect URIs**: add the EXACT URL shown in your Supabase
     dashboard under Authentication → Providers → Google (it looks like
     `https://vvtnwqxyztdvwvsfqewh.supabase.co/auth/v1/callback`). Copy it
     from Supabase rather than typing it by hand — it must match exactly.
4. Google will give you a **Client ID** and **Client Secret**. Copy both
   into Supabase's Google provider settings (Authentication → Providers →
   Google → paste Client ID + Client Secret → toggle it ON → Save).

Until you complete this, the "Continue with Google" button will show an
error message on click (the code handles this gracefully — it won't crash,
it'll just tell the user Google sign-in isn't available yet).

## 2. What's already wired up in the code (no action needed)

- `assets/js/supabase-client.js` — holds your project URL + anon key, and
  three helper functions used everywhere: `sbGetSession()`,
  `sbRequireAuth()`, `sbSignOut()`.
- Every one of the 198 chapter pages loads this file and calls
  `sbRequireAuth()` before showing any content. If there's no session, the
  visitor is redirected to `auth/index.html?redirect=<the page they wanted>`
  — and after logging in, they're sent straight back to that exact page.
- The homepage (`index.html`) and all 12 subject list pages
  (`pages/classNN/subject.html`) do **not** check auth at all — anyone can
  browse subjects and chapter titles freely, per your instruction.
- `auth/index.html` — the Login/Register page. Login form now uses
  **email**, not username (Supabase requires this). Both panels have a
  "Continue with Google" button above the email form.
- `auth/callback.html` — the page Google/Supabase redirects back to after
  the OAuth flow finishes. It waits for the session to be ready, then
  forwards the user on to wherever they were trying to go.
- Every chapter page's navbar now has a working **Logout** link.

## 3. Testing checklist (do this yourself once deployed, or with a local server)

A static site needs to be served over `http://` or `https://` for Supabase
Auth to work correctly — **double-clicking the HTML file directly
(`file://...`) will NOT work** for any of this, because redirects and
session storage need a real origin. Use a local server for testing, e.g.:
```
cd StudyBuddy-master
python3 -m http.server 8000
```
Then visit `http://localhost:8000` — and remember to add
`http://localhost:8000/auth/callback.html` to Supabase's Redirect URLs list
(step 1a above) before testing Google login locally.

Run through this in order:

- [ ] Visit the homepage — loads normally, no login prompt.
- [ ] Click into any subject (e.g. Class 10 Maths) — list page loads
      normally, no login prompt, all chapter titles visible.
- [ ] Click any chapter card — you should be redirected to the Login page
      (you'll briefly see a spinner first, then land on `auth/index.html`).
- [ ] On the Login page, click **Sign Up**, fill in name/email/password,
      submit. Either:
      - You're logged in immediately and sent back to the chapter you
        clicked (if email confirmation is OFF), or
      - You see a "check your email" message (if email confirmation is ON)
        — go confirm it, then come back and log in normally.
- [ ] After logging in, confirm you land on the **exact chapter** you
      originally clicked, not just the homepage.
- [ ] Refresh that chapter page — you should stay logged in (no redirect
      back to login).
- [ ] Click **Logout** in the navbar — confirm you're sent to the homepage.
- [ ] Try opening a chapter page directly again — confirm you're sent back
      to login (since you just logged out).
- [ ] Log back in using the same email/password — confirm it works.
- [ ] Once Google is configured (step 1c), click **Continue with Google**
      from the login page — confirm the Google consent screen appears, and
      after approving, you land back on studyBuddy logged in.
- [ ] Try Google sign-in from a chapter page's auto-redirect (not just the
      raw login page) — confirm you land back on that specific chapter
      after Google login, not just the homepage.

## 4. If something doesn't work

- **Google button shows an error immediately**: Google provider isn't
  configured yet in Supabase (step 1c), or the Client ID/Secret were pasted
  with extra spaces. Check Supabase → Providers → Google is toggled ON.
- **Stuck on a blank/spinner screen after Google login**: almost always a
  Redirect URL mismatch — re-check step 1a, the URL must match character
  for character, including `https://` vs `http://` and no trailing slash
  difference.
- **Logged in but immediately bounced back to login on a chapter page**:
  check your browser isn't blocking third-party cookies/storage if you're
  testing across two different ports/domains; same-origin (one domain
  serving everything) is the simplest setup and avoids this entirely.
- **Email/password signup gives a vague error**: open the browser console
  (F12) — Supabase's real error message will be more specific than what's
  shown on screen, common ones are "Password should be at least 6
  characters" or "User already registered."
