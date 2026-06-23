/* ==========================================================================
   studyBuddy — subject.js (Workspace Core Logic)
   No personal progress tracking — this site serves study material only.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const tabButtons = document.querySelectorAll(".tab-btn");

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================
    initializeMCQQuizzes();

    // ==========================================================================
    // TAB SWITCHING LOGIC (Notes / PYQs / MCQs / Sample Papers)
    // ==========================================================================
    function switchTab(tabId) {
        // Deactivate all tab buttons
        tabButtons.forEach(btn => btn.classList.remove("active"));

        // Activate target button
        const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (targetBtn) targetBtn.classList.add("active");

        // Find active chapter panel
        const activeChapterPanel = document.querySelector(".chapter-content-panel.active");
        if (!activeChapterPanel) return;

        // Hide all tab panels in active chapter
        activeChapterPanel.querySelectorAll(".tab-panel").forEach(panel => {
            panel.classList.remove("active");
        });

        // Show target tab panel in active chapter
        const targetPanel = activeChapterPanel.querySelector(`.tab-panel[data-panel="${tabId}"]`);
        if (targetPanel) {
            targetPanel.classList.add("active");
        }
    }

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            switchTab(btn.dataset.tab);
        });
    });

    // ==========================================================================
    // MCQ QUIZ HANDLER
    // ==========================================================================
    function initializeMCQQuizzes() {
        const questions = document.querySelectorAll(".mcq-question");
        questions.forEach(q => {
            const options = q.querySelectorAll(".mcq-option");
            options.forEach(opt => {
                opt.addEventListener("click", () => {
                    handleMCQClick(opt, q);
                });
            });
        });

        // Initial score update
        document.querySelectorAll(".chapter-content-panel").forEach(panel => {
            updateChapterMCQScore(panel);
        });
    }

    function handleMCQClick(clickedOpt, question) {
        if (question.dataset.answered === "true") return;

        question.dataset.answered = "true";
        const correctLetter = question.dataset.correct.trim().toUpperCase();
        const clickedLetter = clickedOpt.dataset.option.trim().toUpperCase();
        const options = question.querySelectorAll(".mcq-option");
        const feedback = question.querySelector(".mcq-feedback");

        options.forEach(opt => {
            opt.disabled = true;
            const letter = opt.dataset.option.trim().toUpperCase();
            if (letter === correctLetter) {
                opt.classList.add("correct");
            } else if (letter === clickedLetter) {
                opt.classList.add("incorrect");
            }
        });

        if (feedback) {
            feedback.style.display = "block";
            if (clickedLetter === correctLetter) {
                feedback.textContent = "Correct!";
                feedback.className = "mcq-feedback correct";
            } else {
                feedback.textContent = `Incorrect. The correct answer was ${correctLetter}.`;
                feedback.className = "mcq-feedback incorrect";
            }
        }

        // Update score
        const panel = question.closest(".chapter-content-panel");
        if (panel) {
            updateChapterMCQScore(panel);
        }
    }

    function updateChapterMCQScore(panel) {
        const scoreContainer = panel.querySelector(".mcq-score-container");
        if (!scoreContainer) return;

        const questions = panel.querySelectorAll(".mcq-question");
        const total = questions.length;
        let answeredCount = 0;
        let correctCount = 0;

        questions.forEach(q => {
            if (q.dataset.answered === "true") {
                answeredCount++;
                const correctOption = q.querySelector(".mcq-option.correct");
                const hasIncorrectSelection = q.querySelector(".mcq-option.incorrect");
                if (correctOption && !hasIncorrectSelection) {
                    correctCount++;
                }
            }
        });

        if (answeredCount > 0) {
            scoreContainer.style.display = "block";
            const curSpan = scoreContainer.querySelector(".mcq-score-current");
            const totSpan = scoreContainer.querySelector(".mcq-score-total");
            if (curSpan) curSpan.textContent = correctCount;
            if (totSpan) totSpan.textContent = total;
        } else {
            scoreContainer.style.display = "none";
        }
    }

    // ==========================================================================
    // COPY NOTES HANDLER
    // ==========================================================================
    document.querySelectorAll(".btn-copy-notes").forEach(btn => {
        btn.addEventListener("click", () => {
            const activeChapterPanel = document.querySelector(".chapter-content-panel.active");
            if (!activeChapterPanel) return;

            const notesContent = activeChapterPanel.querySelector(".notes-content");
            if (!notesContent) return;

            const textToCopy = notesContent.innerText;
            const originalHTML = btn.innerHTML;

            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    btn.innerHTML = `
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        Copied!
                    `;
                    btn.style.color = "#15803d";
                    btn.style.borderColor = "#86efac";
                    btn.style.backgroundColor = "#dcfce7";

                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.removeAttribute("style");
                    }, 2000);
                })
                .catch(err => {
                    console.error("Failed to copy notes: ", err);
                    alert("Unable to copy notes automatically. Please select and copy manually.");
                });
        });
    });

    // ==========================================================================
    // PRINT NOTES HANDLER
    // ==========================================================================
    document.querySelectorAll(".btn-print-notes").forEach(btn => {
        btn.addEventListener("click", () => {
            window.print();
        });
    });

    // ==========================================================================
    // PLACEHOLDER LINK INTERCEPTION & TOAST
    // ==========================================================================
    document.addEventListener("click", (e) => {
        const anchor = e.target.closest("a");
        if (anchor && anchor.getAttribute("href") && anchor.getAttribute("href").startsWith("PASTE_")) {
            e.preventDefault();
            showToast("Content coming soon");
        }
    });

    function showToast(message) {
        let toast = document.getElementById("toast-notification");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast-notification";
            toast.style.cssText = `
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: #0f172a;
                color: #ffffff;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 0.9rem;
                font-weight: 600;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                z-index: 9999;
                transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
                opacity: 0;
                pointer-events: none;
                font-family: 'Inter', sans-serif;
                border: 1px solid rgba(255, 255, 255, 0.1);
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = message;

        // Force reflow
        toast.offsetHeight;

        toast.style.transform = "translateX(-50%) translateY(0)";
        toast.style.opacity = "1";

        clearTimeout(toast.timeoutId);
        toast.timeoutId = setTimeout(() => {
            toast.style.transform = "translateX(-50%) translateY(100px)";
            toast.style.opacity = "0";
        }, 3000);
    }

    // ==========================================================================
    // BOOK / SECTION FILTERS (used on subject list pages with multiple books,
    // e.g. English: First Flight vs Footprints — currently the list page shows
    // every section at once, so this is a no-op unless .book-filter-btn exists)
    // ==========================================================================
    const filterButtons = document.querySelectorAll(".book-filter-btn");
    if (filterButtons.length > 0) {
        function applyFilter(bookId) {
            filterButtons.forEach(btn => {
                btn.classList.toggle("active", btn.dataset.filter === bookId);
            });
            document.querySelectorAll("[data-book]").forEach(el => {
                el.style.display = el.dataset.book === bookId ? "" : "none";
            });
        }

        filterButtons.forEach(btn => {
            btn.addEventListener("click", () => applyFilter(btn.dataset.filter));
        });

        const hash = window.location.hash.substring(1);
        let activeBtn = hash
            ? document.querySelector(`.book-filter-btn[data-filter="${hash}"]`)
            : null;
        if (!activeBtn) {
            activeBtn = document.querySelector(".book-filter-btn.active");
        }
        if (activeBtn) {
            applyFilter(activeBtn.dataset.filter);
        }
    }

    // ==========================================================================
    // MOBILE NAVBAR HAMBURGER (Home / Class X links collapse on small screens)
    // ==========================================================================
    const navHamburger = document.getElementById("hamburger");
    const navOth = document.querySelector(".navbar .oth");
    if (navHamburger && navOth) {
        navHamburger.addEventListener("click", () => {
            navOth.classList.toggle("open");
            navHamburger.classList.toggle("active");
        });
    }

    // ==========================================================================
    // CHAPTER PAGE: PREV / NEXT KEYBOARD SHORTCUTS (optional convenience)
    // ==========================================================================
    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        if (e.key === "ArrowLeft") {
            const prevBtn = document.querySelector(".chapter-nav-btn.prev:not(.disabled)");
            if (prevBtn) prevBtn.click();
        } else if (e.key === "ArrowRight") {
            const nextBtn = document.querySelector(".chapter-nav-btn.next:not(.disabled)");
            if (nextBtn) nextBtn.click();
        }
    });
});
