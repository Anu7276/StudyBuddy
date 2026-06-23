/* ==========================================================================
   studyBuddy — auth/auth-script.js
   Handles the Login/Register panel flip animation plus real Supabase Auth:
   email/password signup & login, Google OAuth, and redirect-back logic.
   ========================================================================== */

const container    = document.querySelector('.container');
const LoginLink    = document.querySelector('.SignInLink');
const RegisterLink = document.querySelector('.SignUpLink');

RegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.add('active');
});

LoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.remove('active');
});

// --------------------------------------------------------------------------
// Work out where to send the user after a successful login.
// sbRequireAuth() appends ?redirect=<page> when it sends them here.
// --------------------------------------------------------------------------
function getPostLoginRedirect() {
    const params   = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    if (redirect) {
        return redirect; // e.g. /pages/class10/maths/chapter-01-real-numbers.html
    }
    return sbHomeUrl();
}

// --------------------------------------------------------------------------
// UI helpers
// --------------------------------------------------------------------------
function showMessage(containerEl, text, type) {
    containerEl.textContent = text;
    containerEl.className   = "auth-message " + type;
    containerEl.style.display = "block";
}

function setButtonLoading(btn, loadingText) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled    = true;
}

function clearButtonLoading(btn) {
    if (btn.dataset.originalText) {
        btn.textContent = btn.dataset.originalText;
    }
    btn.disabled = false;
}

// --------------------------------------------------------------------------
// If the user is already logged in and somehow lands here, skip login.
// --------------------------------------------------------------------------
(async function redirectIfAlreadyLoggedIn() {
    try {
        const session = await sbGetSession();
        if (session) {
            // Also honour the 24-hour login window: if it's expired (or
            // sb_login_time was never set), sign out and stay on the login
            // page so the student logs in fresh.
            const stored = localStorage.getItem("sb_login_time");
            const elapsed = stored ? Date.now() - parseInt(stored, 10) : Infinity;
            const expired = elapsed > 24 * 60 * 60 * 1000;
            if (expired) {
                localStorage.removeItem("sb_login_time");
                try { await sbClient.auth.signOut(); } catch (_) { /* best-effort */ }
                return; // Stay on login page
            }
            window.location.replace(getPostLoginRedirect());
        }
    } catch (e) {
        // Ignore — let the user log in manually
    }
})();

// --------------------------------------------------------------------------
// EMAIL / PASSWORD LOGIN
// --------------------------------------------------------------------------
const loginForm    = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginMessage.style.display = "none";

    const email     = document.getElementById("login-email").value.trim();
    const password  = document.getElementById("login-password").value;
    const submitBtn = document.getElementById("login-submit-btn");

    if (!email || !password) {
        showMessage(loginMessage, "Please enter your email and password.", "error");
        return;
    }

    setButtonLoading(submitBtn, "Logging in…");

    try {
        const { data, error } = await sbClient.auth.signInWithPassword({ email, password });

        clearButtonLoading(submitBtn);

        if (error) {
            let msg = error.message || "Login failed. Please check your details and try again.";
            // Make common errors more user-friendly
            if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
                msg = "Incorrect email or password. Please try again.";
            } else if (msg.includes("Email not confirmed")) {
                msg = "Please check your email and confirm your account before logging in.";
            }
            showMessage(loginMessage, msg, "error");
            return;
        }

        if (data && data.session) {
            localStorage.setItem("sb_login_time", Date.now().toString());
            window.location.href = getPostLoginRedirect();
        }
    } catch (err) {
        clearButtonLoading(submitBtn);
        showMessage(loginMessage, "Connection error. Please check your internet and try again.", "error");
        console.error("Login error:", err);
    }
});

// --------------------------------------------------------------------------
// EMAIL / PASSWORD SIGNUP
// --------------------------------------------------------------------------
const registerForm    = document.getElementById("register-form");
const registerMessage = document.getElementById("register-message");

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    registerMessage.style.display = "none";

    const name      = document.getElementById("register-name").value.trim();
    const email     = document.getElementById("register-email").value.trim();
    const password  = document.getElementById("register-password").value;
    const submitBtn = document.getElementById("register-submit-btn");

    if (!name || !email || !password) {
        showMessage(registerMessage, "Please fill in all fields.", "error");
        return;
    }
    if (password.length < 6) {
        showMessage(registerMessage, "Password must be at least 6 characters.", "error");
        return;
    }

    setButtonLoading(submitBtn, "Creating account…");

    try {
        const { data, error } = await sbClient.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name },
                emailRedirectTo: sbPublicAuthCallbackUrl(),
            },
        });

        clearButtonLoading(submitBtn);

        if (error) {
            let msg = error.message || "Could not create account. Please try again.";
            if (msg.includes("already registered") || msg.includes("User already registered")) {
                msg = "An account with this email already exists. Please log in instead.";
            } else if (msg.includes("Password should be at least")) {
                msg = "Password must be at least 6 characters long.";
            }
            showMessage(registerMessage, msg, "error");
            return;
        }

        if (data && data.session) {
            // Email confirmation OFF — user is logged in immediately.
            localStorage.setItem("sb_login_time", Date.now().toString());
            window.location.href = getPostLoginRedirect();
        } else {
            // Email confirmation ON — user must confirm before logging in.
            showMessage(
                registerMessage,
                "✅ Account created! Please check your inbox (" + email + ") for a confirmation link before logging in.",
                "success"
            );
            registerForm.reset();
        }
    } catch (err) {
        clearButtonLoading(submitBtn);
        showMessage(registerMessage, "Connection error. Please check your internet and try again.", "error");
        console.error("Signup error:", err);
    }
});

// --------------------------------------------------------------------------
// CONTINUE WITH GOOGLE (both login and register panels)
// --------------------------------------------------------------------------
async function handleGoogleLogin() {
    loginMessage.style.display    = "none";
    registerMessage.style.display = "none";

    const redirectTarget = getPostLoginRedirect();

    // Always send OAuth back to the public site. If Supabase is still
    // configured with localhost as the Site URL, it may fall back there.
    const callbackUrl = sbPublicAuthCallbackUrl()
        + "?redirect=" + encodeURIComponent(redirectTarget);

    try {
        const { error } = await sbClient.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: callbackUrl,
                queryParams: {
                    access_type: "offline",
                    prompt: "select_account",
                },
            },
        });

        if (error) {
            let msg = "Google sign-in failed: " + error.message;
            if (error.message.includes("provider is not enabled")) {
                msg = "Google sign-in is not yet enabled. Please use email/password for now, or contact the site admin.";
            }
            showMessage(loginMessage, msg, "error");
        }
        // On success the browser is redirected to Google automatically.
    } catch (err) {
        showMessage(loginMessage, "Connection error. Please try again.", "error");
        console.error("Google OAuth error:", err);
    }
}

document.getElementById("google-login-btn").addEventListener("click", handleGoogleLogin);
document.getElementById("google-register-btn").addEventListener("click", handleGoogleLogin);
