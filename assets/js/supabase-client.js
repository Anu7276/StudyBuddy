/* ==========================================================================
   studyBuddy — supabase-client.js
   Shared Supabase client + auth helpers used across the whole site.
   Loaded via CDN script tag BEFORE this file on every page that needs it.
   ========================================================================== */

// ---- studyBuddy Supabase project config ----
// The anon/publishable key below is SAFE to expose in frontend code.
// It is restricted by Row Level Security on the database side.
const SUPABASE_URL   = "https://vvtnwqxyztdvwvsfqewh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Rhu4YsS73R3pLhe5X3Q7KA_uOG2LSxr";

// Session expiry duration — 24 hours in milliseconds.
const SB_SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

// --------------------------------------------------------------------------
// Guard: Supabase Auth does NOT work over file:// protocol.
// If the user is opening HTML files directly from the filesystem, warn them.
// --------------------------------------------------------------------------
if (window.location.protocol === "file:") {
    console.warn(
        "⚠️ studyBuddy: Supabase Auth requires an http:// or https:// origin.\n" +
        "Open a terminal in the project folder and run:\n" +
        "  npx serve .\n" +
        "Then visit http://localhost:3000 in your browser."
    );
}

// --------------------------------------------------------------------------
// Initialise the Supabase client
// --------------------------------------------------------------------------
let sbClient;
try {
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            // Use localStorage so session persists across page loads.
            storage: window.localStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        }
    });
} catch (e) {
    console.error("studyBuddy: Failed to initialise Supabase client.", e);
}

// --------------------------------------------------------------------------
// Helper: get the current session or null.
// Use on pages that optionally show different UI for logged-in users.
// --------------------------------------------------------------------------
async function sbGetSession() {
    if (!sbClient) return null;
    try {
        const { data, error } = await sbClient.auth.getSession();
        if (error) {
            console.error("studyBuddy auth: getSession error", error);
            return null;
        }
        return data.session;
    } catch (e) {
        console.error("studyBuddy auth: getSession threw", e);
        return null;
    }
}

// --------------------------------------------------------------------------
// Internal helper: check whether the stored 24-hour login window is still
// valid. Returns true if the session is within the allowed window, false
// if it has expired or was never set (old session from before this feature).
// --------------------------------------------------------------------------
function sbIsLoginWindowValid() {
    const stored = localStorage.getItem("sb_login_time");
    if (!stored) return false; // Missing → treat as expired (safe default)
    const elapsed = Date.now() - parseInt(stored, 10);
    return elapsed <= SB_SESSION_DURATION_MS;
}

// --------------------------------------------------------------------------
// Helper: gate-keeper for pages that REQUIRE login (chapter pages).
// Checks BOTH a valid Supabase session AND a fresh 24-hour login window.
// If either check fails, signs out and redirects to the login page.
// Call at the very top of a protected page before rendering anything sensitive.
// --------------------------------------------------------------------------
async function sbRequireAuth() {
    const session = await sbGetSession();

    if (!session) {
        // No Supabase session at all.
        const here = window.location.pathname + window.location.search + window.location.hash;
        const loginUrl = sbAuthPageUrl() + "?redirect=" + encodeURIComponent(here);
        window.location.replace(loginUrl);
        throw new Error("Redirecting to login — not authenticated.");
    }

    if (!sbIsLoginWindowValid()) {
        // Supabase session exists but the 24-hour login window has expired
        // (or sb_login_time was never set — old session before this feature).
        console.info("studyBuddy auth: 24-hour session expired, signing out.");
        localStorage.removeItem("sb_login_time");
        try { await sbClient.auth.signOut(); } catch (_) { /* best-effort */ }
        const here = window.location.pathname + window.location.search + window.location.hash;
        const loginUrl = sbAuthPageUrl() + "?redirect=" + encodeURIComponent(here);
        window.location.replace(loginUrl);
        throw new Error("Redirecting to login — session expired.");
    }

    return session;
}

// --------------------------------------------------------------------------
// Path helpers — work out relative paths to key pages from anywhere in the
// folder tree (root, auth/, pages/classNN/, pages/classNN/subject/).
// --------------------------------------------------------------------------
function sbPathDepthFromRoot() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const folders = parts.slice(0, -1); // Drop the filename itself

    if (folders.length === 0) return 0; // e.g. /index.html — at site root
    if (folders[folders.length - 1] === "auth" || folders[0] === "auth") return 1;

    const pagesIdx = folders.indexOf("pages");
    if (pagesIdx !== -1) {
        return folders.length - pagesIdx;
    }

    return folders.length; // Fallback
}

function sbAuthPageUrl() {
    const depth = sbPathDepthFromRoot();
    if (depth === 0) return "auth/index.html";
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "auth" || parts[parts.length - 2] === "auth") return "index.html";
    return "../".repeat(depth) + "auth/index.html";
}

function sbHomeUrl() {
    const depth = sbPathDepthFromRoot();
    if (depth === 0) return "index.html";
    return "../".repeat(depth) + "index.html";
}

// --------------------------------------------------------------------------
// Helper: sign the user out, clear the 24-hour login window timestamp,
// and redirect to the homepage.
// --------------------------------------------------------------------------
async function sbSignOut() {
    localStorage.removeItem("sb_login_time");
    if (!sbClient) {
        window.location.href = sbHomeUrl();
        return;
    }
    try {
        await sbClient.auth.signOut();
    } catch (e) {
        console.warn("studyBuddy auth: signOut error (ignored):", e);
    }
    window.location.href = sbHomeUrl();
}

// --------------------------------------------------------------------------
// Helper: populate the #user-email-display element (if present on the page)
// with the currently logged-in user's email address.
// Call this once sbRequireAuth() has confirmed a valid session.
// --------------------------------------------------------------------------
async function sbShowUserEmail() {
    const emailDisplay = document.getElementById("user-email-display");
    if (!emailDisplay || !sbClient) return;
    try {
        const { data } = await sbClient.auth.getUser();
        if (data && data.user) {
            emailDisplay.textContent = data.user.email;
        }
    } catch (e) {
        console.warn("studyBuddy auth: could not fetch user email", e);
    }
}
