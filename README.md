# studyBuddy — Project structure guide

studyBuddy is a free, NCERT-aligned study site for Class 10 & 12 students:
chapter-wise notes, PYQs, MCQs and sample papers. Every chapter (and every
poem) has its **own standalone page** — students click a chapter and land on
a dedicated Notes / PYQs / MCQs / Sample Papers page for just that chapter,
with Previous / Next buttons to move through the subject in order.

## Folder map

```
/
├── index.html                 Homepage (Class 10 / Class 12 subject cards) — open to everyone
├── sitemap.xml                Lists every page on the site (auto-generated)
├── robots.txt
├── AUTH_SETUP.md               Supabase + Google login setup & testing guide — read this first
│
├── assets/                    Shared site code — you usually won't touch this
│   ├── css/
│   │   ├── style.css          Homepage + shared site styling (navbar, footer, hamburger menu)
│   │   └── subject.css        Styling for subject list pages + chapter pages
│   ├── js/
│   │   ├── subject.js         Tabs, MCQ scoring, mobile nav
│   │   └── supabase-client.js Auth config + helpers (sbRequireAuth, sbSignOut) — used by every chapter page
│   └── icons/
│       └── favicon.svg
│
├── auth/                      Login / Register page — real Supabase auth, email + Google
│   ├── index.html
│   ├── callback.html          Google OAuth lands here, then forwards the user onward
│   ├── auth-style.css
│   └── auth-script.js
│
├── pages/
│   ├── class10/
│   │   ├── maths.html              ← subject LIST page (just chapter cards, no content) — open to everyone
│   │   ├── maths/                  ← one HTML file per chapter, each a full page — LOGIN REQUIRED
│   │   │   ├── chapter-01-real-numbers.html
│   │   │   ├── chapter-02-polynomials.html
│   │   │   └── ... (one per chapter)
│   │   ├── science.html
│   │   ├── science/
│   │   ├── english.html
│   │   ├── english/                ← includes both prose chapters AND poems
│   │   │   ├── chapter-01-a-letter-to-god.html
│   │   │   ├── poem-01-dust-of-snow.html
│   │   │   └── ...
│   │   ├── social-science.html
│   │   ├── social-science/
│   │   ├── hindi.html
│   │   ├── hindi/
│   │   ├── it-computer.html
│   │   └── it-computer/
│   └── class12/  (same pattern: maths, physics, chemistry, biology, english, hindi)
│
└── materials/                 PDF storage — drop your real PDF files here.
    └── ... (mirrors the pages/ structure exactly, chapter by chapter —
             see materials/README.md for the full folder list)
```

## How the site works (so you know where to click)

1. **Home page** (`index.html`) shows Class 10 / Class 12 tabs and a card for
   every subject.
2. Clicking a subject card opens its **list page** (e.g. `pages/class10/maths.html`)
   — a simple page showing every chapter as a clickable card, grouped under
   section headings for subjects that have them (e.g. English: First Flight —
   Prose / First Flight — Poems / Footprints; Social Science: History /
   Civics / Geography / Economics).
3. Clicking a chapter card opens **that chapter's own page**
   (e.g. `pages/class10/maths/chapter-01-real-numbers.html`) — a full page with
   four tabs: **Notes, PYQs, MCQs, Sample Papers**, plus **Previous / Next**
   buttons at the bottom to move to the adjacent chapter without going back
   to the list. **This step requires a free account** — see "Accounts &
   login" below.

## Accounts & login

The homepage and every subject list page are open to everyone — no login
needed to browse what's available. Opening an actual chapter (its Notes,
PYQs, MCQs, Sample Papers) requires a free account, either by email +
password or "Continue with Google". This is built on Supabase Auth.

- A logged-out visitor clicking a chapter is sent to `auth/index.html`,
  then automatically returned to that exact chapter after logging in.
- Once logged in, a student stays logged in until they click **Logout**
  in the navbar — there's no automatic expiry.
- **Before any of this works live, you need to do a short one-time setup
  in your Supabase dashboard (and Google Cloud Console for the Google
  button).** Full step-by-step instructions, plus a testing checklist, are
  in [`AUTH_SETUP.md`](./AUTH_SETUP.md) — read that file before deploying.

## How to add material — two options

### Option A — Upload real PDF files
1. Find the matching chapter folder inside `materials/` (it mirrors the site
   exactly — see `materials/README.md` for the full folder list with chapter
   names).
2. Drop your PDF into the right sub-folder: `notes/`, `pyqs/`, `mcqs/`, or
   `sample-papers/`. Name it something simple, e.g. `notes.pdf` or
   `pyq-2024.pdf`.
3. Open that chapter's own HTML page in `pages/classNN/subject/`. Every spot
   meant for material has an `<!-- ADD MATERIAL: ... -->` comment right above
   it telling you exactly which materials/ folder it maps to.
4. For **Notes**: replace the placeholder paragraph inside `notes-content`
   with either your typed-out notes, or a link/embed to your PDF.
   For **PYQs / Sample Papers**: replace `PASTE_PYQ_DRIVE_LINK_HERE` or
   `PASTE_SAMPLE_PAPER_DRIVE_LINK_HERE` with the relative path to your PDF,
   e.g.:
   ```html
   <a href="../../../materials/class10/science/physics/chapter-01-reflection-of-light-by-curved-surfaces/pyqs/pyq.pdf" target="_blank" class="resource-btn btn-primary">
   ```
   (Note the chapter page is one folder deeper than the old subject pages
   were, so relative paths use `../../../` to reach the project root — every
   placeholder comment already shows the correct path for that exact chapter,
   so you can copy it directly.)

### Option B — Use Google Drive (or any external) links
Same step 4 above, but instead of a local PDF path, paste your Drive
share-link (with "Anyone with the link can view" turned on) in place of the
`PASTE_..._DRIVE_LINK_HERE` placeholder.

### MCQs
MCQs are typed directly into the page (not PDFs), so students can click an
option and instantly see if they're right. Find the `mcq-question` block on
that chapter's page and replace the sample question, the four options, and
the `data-correct="A"` attribute (set it to whichever letter is actually
correct). You can add more than one question per chapter — just duplicate
the whole `<div class="mcq-question" data-correct="...">...</div>` block.

## Adding a brand-new chapter or subject later

This site is generated from a single data file so chapter lists, slugs,
materials folders, and the Previous/Next chain all stay consistent. If CBSE
updates the syllabus:

1. Edit the chapter list for that subject (titles, section grouping) in the
   site's source data model.
2. Regenerate that subject's list page + all of its chapter pages, and the
   matching `materials/` folders, from that data — this keeps every filename,
   breadcrumb, and Prev/Next link correct automatically.
3. Do not hand-edit chapter cards on a list page or duplicate chapter blocks
   manually — regenerating from the data model avoids numbering mistakes
   across dozens of files.

(If you don't have the generation scripts handy, the fallback is: duplicate
an existing chapter HTML file in that subject's folder, update its title,
breadcrumb, `<title>`, meta description, and Prev/Next links by hand, and add
a matching subject-list card + materials folder. Keep the `<head>`'s auth
gate script and `auth-gate-loader` div intact — they're what makes the page
require login — don't strip them out when copying.)

## Notes on what changed from the previous version
The previous version had one page per subject with a sidebar listing every
chapter and tabs that swapped content in place. This version splits that into
a simple list page (just cards, no content) plus one full page per chapter —
better for sharing a single chapter's link, better for SEO (each chapter is
its own indexable page), and clearer print/copy behavior since there's no
sidebar to account for. Visual design (colors, fonts, card style, MCQ
behavior, mobile hamburger menu) is unchanged. There is no personal progress
tracking on this site — it exists purely to host and serve study material.

Chapter pages now require a free account (email/password or Google) to open
— added so material isn't fully open to anonymous scraping while keeping
subject browsing free. See `AUTH_SETUP.md` for the one-time setup this
needs in your Supabase dashboard before it works live.
