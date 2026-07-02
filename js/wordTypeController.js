/**
 * wordTypeController.js
 * Manages the Word Type Identification Puzzle setup wizard and token selection grid
 * inside a completely isolated screen environment.
 */
import { ui } from './uiController.js';

class WordTypeController {
    constructor() {
        this.currentParagraph = null;
        this.selectedWordType = null;
        this.highlightedIndices = new Set();
        this.gameActive = false;
        
        this.gameArena = null;
        
        // Independent local game clock configurations
        this.wtTimerInterval = null;
        this.wtSecondsElapsed = 0;
    }

    init() {
        this.injectStyles();
        
        // Attach the home navigation listener once to the new dedicated button
        const retBtn = document.getElementById("wt-return-btn");
        if (retBtn && !retBtn.dataset.bound) {
            retBtn.dataset.bound = "true";
            retBtn.addEventListener('click', () => {
                ui.playAlert();
                ui.showConfirmation("Are you sure you want to return to the home screen?", () => {
                    this.resetAndRestoreUI(); // <-- FIX: Safely unbind resize listeners and wipe state
                    if (ui.app) {
                        ui.app.resetToHome();
                    }
                });
            });
        }

        const solBtn = document.getElementById("wt-solution-btn");
        if (solBtn && !solBtn.dataset.bound) {
            solBtn.dataset.bound = "true";
            solBtn.addEventListener('click', () => {
                ui.playAlert();
                this.showSolution();
            });
        }

        const hintBtn = document.getElementById("wt-hint-btn");
        if (hintBtn && !hintBtn.dataset.bound) {
            hintBtn.dataset.bound = "true";
            hintBtn.addEventListener('click', () => {
                ui.playAlert();
                this.provideHint();
            });
        }

        const changeBtn = document.getElementById("wt-change-btn");
        if (changeBtn && !changeBtn.dataset.bound) {
            changeBtn.dataset.bound = "true";
            changeBtn.addEventListener('click', () => {
                ui.playAlert();
                // Only proceed if there is an active paragraph to reset with
                if (this.currentParagraph) {
                    this.stopTimer();
                    this.start(this.currentParagraph);
                }
            });
        }
    }

    start(paragraphData) {
        if (!paragraphData) return;
        
        this.currentParagraph = paragraphData;
        this.highlightedIndices.clear();
        this.selectedWordType = null;
        this.gameActive = false;

        this.showSetupModal();
    }

    showSetupModal() {
        document.getElementById("word-type-modal")?.remove();

        ui.playTrumpets();

        const modalOverlay = document.createElement("div");
        modalOverlay.id = "word-type-modal";
        modalOverlay.className = "modal-overlay";

        modalOverlay.innerHTML = `
            <div class="modal-box instructions-box" style="max-width: 54rem; text-align: left; padding: clamp(1rem, 3vh, 1.25rem) clamp(1rem, 3vw, 1.75rem); box-sizing: border-box; max-height: 92vh; display: flex; flex-direction: column; overflow-y: auto;">
                <h2 style="text-align: center; color: #801380; margin-bottom: 0.5rem; font-size: clamp(1.5rem, 5vh, 2.6rem);">Word Type Identification Game Play</h2>
                
                <div class="instructions-content" style="color: #801380;">
                    <p style="color: #008000 !important; text-align: center !important; font-weight: 700; margin-bottom: 0.5rem; font-size: clamp(0.8rem, 2vh, 0.9rem);">YOUR MISSION IS TO CHOOSE A WORD TYPE AND HIGHLIGHT EVERY INSTANCE OF IT WITHIN THE PUZZLE.</p>
                    
                    <ul style="margin-left: 1.25rem; margin-bottom: 0.5rem; color: #801380; line-height: 1.4;">
                        <li style="color: #801380; font-size: clamp(0.75rem, 1.8vh, 0.88rem); margin-bottom: 0.25rem;"><strong>To Highlight:</strong> Click any word to highlight it. Click a highlighted word again to clear its highlight.</li>
                        <li style="color: #801380; font-size: clamp(0.75rem, 1.8vh, 0.88rem); margin-bottom: 0.25rem;"><strong>Watch Out:</strong> The game checks your selection automatically. It ends when only the correct word types are chosen.</li>
                        <li style="color: #801380; font-size: clamp(0.75rem, 1.8vh, 0.88rem); margin-bottom: 0.25rem;"><strong>Need Help?</strong> Click the Hint button to view an explicit breakdown of the total word counts hidden in the text.</li>
                        <li style="color: #801380; font-size: clamp(0.75rem, 1.8vh, 0.88rem); margin-bottom: 0.25rem;"><strong>Want to Quit Early?</strong>
                            <ul style="list-style-type: circle; margin-left: 1.15rem; margin-top: 0.15rem;">
                                <li style="color: #801380; font-size: clamp(0.7rem, 1.6vh, 0.85rem); margin-bottom: 0.15rem;">Click Return Home to discard the current game and return to the main configuration menu.</li>
                                <li style="color: #801380; font-size: clamp(0.7rem, 1.6vh, 0.85rem); margin-bottom: 0.15rem;">Click the Show Solution button to halt the clock and reveal all correct word highlights automatically.</li>
                                <li style="color: #801380; font-size: clamp(0.7rem, 1.6vh, 0.85rem); margin-bottom: 0.15rem;">Click the Words button to clear the current board and select a brand new target word type.</li>
                            </ul>
                        </li>
                    </ul>
                    
                    <p style="color: #008000 !important; text-align: center !important; font-weight: 900; text-transform: uppercase; margin-top: 0.75rem; margin-bottom: 0.75rem; font-size: clamp(0.85rem, 2.2vh, 1rem); letter-spacing: 0.03em;">PLEASE CHOOSE THE WORD TYPE TO SEARCH FOR:</p>
                </div>

                <div class="word-type-options" style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-bottom: 1rem;">
                    <button class="btn primary-btn type-opt-btn" data-type="Noun">Nouns</button>
                    <button class="btn primary-btn type-opt-btn" data-type="Verb">Verbs</button>
                    <button class="btn primary-btn type-opt-btn" data-type="Adjective">Adjectives</button>
                    <button class="btn primary-btn type-opt-btn" data-type="Adverb">Adverbs</button>
                    <button class="btn primary-btn type-opt-btn" data-type="Preposition">Prepositions</button>
                </div>

                <div class="modal-buttons" style="justify-content: center; margin-top: 0.5rem;">
                    <button id="word-type-begin-btn" class="btn primary-btn" disabled style="opacity: 0.5; cursor: not-allowed; width: 100%; max-width: 12rem; font-weight: 900; font-size: clamp(1rem, 3vh, 1.35rem); letter-spacing: 0.18rem; padding: 0.25rem 0.5rem;">BEGIN</button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        const optionButtons = modalOverlay.querySelectorAll(".type-opt-btn");
        const beginBtn = modalOverlay.querySelector("#word-type-begin-btn");

        optionButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                optionButtons.forEach(b => {
                    b.style.backgroundColor = "#008000"; 
                    b.style.color = "#ffd700";           
                });

                btn.style.backgroundColor = "#ffd700";   
                btn.style.color = "#008000";             

                this.selectedWordType = btn.getAttribute("data-type");
                
                beginBtn.removeAttribute("disabled");
                beginBtn.style.opacity = "1";
                beginBtn.style.cursor = "pointer";
            });
        });

        beginBtn.addEventListener("click", () => {
            modalOverlay.remove();
            this.setupGameBoard();
        });
    }

    setupGameBoard() {
        document.getElementById("wt-overlay")?.classList.add("hidden");

        this.gameActive = true;
        this.gameArena = document.getElementById("wt-game-arena");
        const statusBar = document.getElementById("wt-status-text");

        // Clean UI Screen Transition
        ui.switchScreen('play-screen', 'word-type-screen');

        if (this.gameArena) {
            // 1. YOUR IDEA: Keep the arena completely blank/hidden while we 
            //    calculate font metrics in the background. No giant text flashes.
            this.gameArena.style.visibility = "hidden";
            this.gameArena.innerHTML = "";
            this.gameArena.classList.add("word-grid-mode");
        }

        // Split text cleanly into tokens using the solved paragraph sequence
        const wordTokens = this.currentParagraph.extendedText.trim().replace(/\s+/g, " ").split(" ");

        wordTokens.forEach((token, index) => {
            const tokenSpan = document.createElement("span");
            tokenSpan.className = "word-token";
            tokenSpan.setAttribute("data-index", index);
            tokenSpan.textContent = token;
            
            // Clear out sizing upfront by defaulting to a safe baseline size
            tokenSpan.style.fontSize = "12px";

            tokenSpan.addEventListener("click", () => this.handleWordClick(index, tokenSpan));
            if (this.gameArena) {
                this.gameArena.appendChild(tokenSpan);
            }
        });

        // Initialize status bar shape profile
        if (statusBar) {
            statusBar.removeAttribute("style");
            statusBar.className = "word-type-status-bar";
            statusBar.innerHTML = `You are looking for ${this.selectedWordType.toLowerCase()}s`;
        }

        // --- DYNAMIC AUTO-SCALING TIMING & RESIZE BINDINGS ---
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
        }

        this._resizeHandler = () => this.adjustTokenFontSize();
        window.addEventListener('resize', this._resizeHandler);

        // 2. DOUBLE ANIMATION FRAME: Replaces arbitrary timeouts. It guarantees the 
        //    browser has fully rendered the screen structure and stabilized flex layout boundaries.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.adjustTokenFontSize();
                if (this.gameArena) {
                    // 3. REVEAL: Pop the text into view perfectly calculated
                    this.gameArena.style.visibility = "visible";
                }
            });
        });

        this.startTimer();
        
        // Check win condition immediately in case there are 0 words of this type
        this.checkWinCondition();
    }

    // --- METHOD: High-performance boundary-safe font auto-scaling with Scroll Fallback ---
    adjustTokenFontSize() {
        if (!this.gameArena) return;

        const tokens = this.gameArena.querySelectorAll(".word-token");
        if (tokens.length === 0) return;

        // FIX: Clear scroll states and enforce hidden bounds during measurement 
        // to prevent scrollbar widths from throwing off the bounding box math.
        this.gameArena.scrollTop = 0;
        this.gameArena.scrollLeft = 0;
        this.gameArena.style.overflowY = "hidden";

        // 1. Snapshot the outer container box dimensions
        const arenaHeight = this.gameArena.clientHeight;
        const arenaWidth = this.gameArena.clientWidth;

        if (arenaHeight <= 0 || arenaWidth <= 0) {
            requestAnimationFrame(() => this.adjustTokenFontSize());
            return;
        }

        // 2. Compute dynamic padding values to map the actual inner Safe Content Zone
        const computedStyle = window.getComputedStyle(this.gameArena);
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

        const maxSafeRight = arenaWidth - paddingRight;
        const maxSafeBottom = arenaHeight - paddingBottom;

        let minFont = 12;   
        let maxFont = 180;   
        let optimalFont = minFont;
        
        // Track whether a scrollbar safety valve is required
        let requiresScrollSafetyValve = false;

        // Perform a precise binary search loop against the container constraints
        while (minFont <= maxFont) {
            let mid = Math.floor((minFont + maxFont) / 2);
            
            // Apply trial font size to elements
            tokens.forEach(t => t.style.fontSize = `${mid}px`);

            let hasOverflow = false;

            // Check if any element breaches the boundaries
            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                
                const tokenBottom = token.offsetTop + token.offsetHeight;
                const tokenRight = token.offsetLeft + token.offsetWidth;

                // Evaluate limits against the safe content bounding box instead of outer box
                if (tokenBottom > maxSafeBottom || tokenRight > maxSafeRight) {
                    hasOverflow = true;
                    break;
                }
            }

            // SAFETY VALVE CHECK: If it overflows at the absolute minimum floor, flag it
            if (mid === 12 && hasOverflow) {
                requiresScrollSafetyValve = true;
            }

            if (!hasOverflow) {
                optimalFont = mid;     // Size fits beautifully! Save as candidate
                minFont = mid + 1;     // Try pushing for a larger fill size
            } else {
                maxFont = mid - 1;     // Too large! Step down
            }
        }

        // 4. Final smooth paint application of the perfect calculated size
        tokens.forEach(t => t.style.fontSize = `${optimalFont}px`);

        // 5. ENGAGE SAFETY VALVE: If the text is physically incapable of fitting inside
        // the viewport at 12px, cleanly provision a vertical scrollbar.
        if (requiresScrollSafetyValve) {
            this.gameArena.style.overflowY = "auto";
        }
    }

    startTimer() {
        this.stopTimer();
        this.wtSecondsElapsed = 0;
        
        const timerDisplay = document.getElementById("wt-timer");
        if (timerDisplay) timerDisplay.textContent = "00:00";

        this.wtTimerInterval = setInterval(() => {
            this.wtSecondsElapsed++;
            const mins = String(Math.floor(this.wtSecondsElapsed / 60)).padStart(2, '0');
            const secs = String(this.wtSecondsElapsed % 60).padStart(2, '0');
            
            if (timerDisplay) {
                timerDisplay.textContent = `${mins}:${secs}`;
            }
        }, 1000);
    }

    stopTimer() {
        if (this.wtTimerInterval) {
            clearInterval(this.wtTimerInterval);
            this.wtTimerInterval = null;
        }
    }

    handleWordClick(index, element) {
        if (!this.gameActive) return;

        if (this.highlightedIndices.has(index)) {
            this.highlightedIndices.delete(index);
            element.classList.remove("highlighted");
            ui.playRemove();
        } else {
            this.highlightedIndices.add(index);
            element.classList.add("highlighted");
            ui.playEnter();
        }

        this.checkWinCondition();
    }

    showSolution() {
        if (!this.currentParagraph || !this.selectedWordType) return;

        this.gameActive = false;
        this.stopTimer();
        this.highlightedIndices.clear();

        const targetIndices = this.currentParagraph.wordTypes
            .filter(item => item.type.toLowerCase() === this.selectedWordType.toLowerCase())
            .map(item => item.wordIndex);

        if (this.gameArena) {
            const tokens = this.gameArena.querySelectorAll(".word-token");
            tokens.forEach(token => {
                const idx = parseInt(token.getAttribute("data-index"), 10);
                token.style.pointerEvents = "none";

                if (targetIndices.includes(idx)) {
                    this.highlightedIndices.add(idx);
                    token.classList.add("highlighted");
                } else {
                    token.classList.remove("highlighted");
                }
            });
        }

        // UNIFIED SLIDE OVERLAY ACTION: Displays the specific plural word type title
        const overlay = document.getElementById("wt-overlay");
        if (overlay) {
            overlay.textContent = `${this.selectedWordType.toUpperCase()}S`;
            overlay.classList.remove("hidden");
        }
    }

    provideHint() {
        if (!this.currentParagraph || !this.currentParagraph.wordTypeHintLines) return;

        let listItemsHtml = "";
        this.currentParagraph.wordTypeHintLines.forEach(line => {
            const cleanLine = line.replace("Word Types: ", "");
            listItemsHtml += `
                <li style="font-size: 1.25rem; margin-bottom: 0.6rem; color: #000000;">
                    <strong>${cleanLine}</strong>
                </li>
            `;
        });

        document.getElementById("wt-hint-modal")?.remove();

        const modalOverlay = document.createElement("div");
        modalOverlay.id = "wt-hint-modal";
        modalOverlay.className = "modal-overlay";

        modalOverlay.innerHTML = `
            <div class="modal-box" style="max-width: 26rem; text-align: center; padding: 2rem;">
                <h2 style="margin-bottom: 1.25rem; font-size: 1.5rem; color: #000000;">Word Types:</h2>
                
                <ul style="list-style: none; padding: 0; margin: 1.5rem auto; max-width: 12rem; text-align: left;">
                    ${listItemsHtml}
                </ul>

                <div class="modal-buttons" style="justify-content: center; margin-top: 1.5rem;">
                    <button id="wt-hint-close-btn" class="btn primary-btn" style="width: 100%; max-width: 8rem;">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        document.getElementById("wt-hint-close-btn").addEventListener("click", () => {
            modalOverlay.remove();
        });
    }

    checkWinCondition() {
        const targetIndices = this.currentParagraph.wordTypes
            .filter(item => item.type.toLowerCase() === this.selectedWordType.toLowerCase())
            .map(item => item.wordIndex);

        if (this.highlightedIndices.size !== targetIndices.length) return;

        const matchesPerfectly = targetIndices.every(idx => this.highlightedIndices.has(idx));

        if (matchesPerfectly) {
            this.handleVictory();
        }
    }

    handleVictory() {
        this.gameActive = false;
        this.stopTimer();
        
        if (this.gameArena) {
            const tokens = this.gameArena.querySelectorAll(".word-token");
            tokens.forEach(t => t.style.pointerEvents = "none");
        }

        // UNIFIED SLIDE OVERLAY ACTION: Custom victory string phrase
        const overlay = document.getElementById("wt-overlay");
        if (overlay) {
            overlay.textContent = `Congratulations you found all the ${this.selectedWordType.toLowerCase()}s!`;
            overlay.classList.remove("hidden");
        }

        ui.playCheers();
    }

    resetAndRestoreUI() {
        this.stopTimer();
        this.gameActive = false;
        this.highlightedIndices.clear();
        
        // REMOVE RESIZE EVENT LISTENER
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }

        const screen = document.getElementById("word-type-screen");
        if (screen) {
            screen.classList.add("hidden");
        }
        
        if (this.gameArena) {
            this.gameArena.style.visibility = ""; // Clean visibility back to default
            this.gameArena.innerHTML = "";
            this.gameArena.classList.remove("word-grid-mode");
        }
    }

    injectStyles() {
        if (document.getElementById("word-type-styles")) return;

        const styleSheet = document.createElement("style");
        styleSheet.id = "word-type-styles";
        styleSheet.textContent = `
            /* ==========================================================================
               SCREEN WRAPPER ISOLATION
               ========================================================================== */
            #word-type-screen {
                width: 100vw;      
                height: 100vh;    
                border-radius: 0;   
                box-shadow: none;
                padding: clamp(0.25rem, 1.5vh, 0.5rem) clamp(0.5rem, 1.5vw, 0.75rem);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                background: #cbd5e0;
                border: 0.5rem solid #ffd700;
            }

            /* ==========================================================================
               MIDDLE ROW: ARENA SYMMETRY (Perfect Containment Geometry)
               ========================================================================== */
            #wt-game-arena.word-grid-mode {
                position: relative;
                flex: 1;                     
                min-height: 0;
                background-color: #ffffff;
                border: 0.125rem solid #ffffff;
                border-radius: 0.375rem;
                display: flex;
                flex-wrap: wrap;
                align-content: flex-start;
                overflow: hidden;            
                margin-top: 0;
                margin-bottom: 0.5rem;
                box-sizing: border-box;
                padding: clamp(0.4rem, 2vh, 0.75rem) clamp(0.5rem, 2vw, 1.25rem); 
                gap: clamp(0.2rem, 1vh, 0.6rem) 0.6rem;                  
            }

            .word-token {
                font-family: "Times New Roman", Times, Baskerville, Georgia, serif;
                font-weight: 600;
                line-height: 1.5;
                color: #000000;
                cursor: pointer;
                padding: 0.125rem 0.375rem;
                border-radius: 0.25rem;
                border-bottom: 2px solid transparent;
                user-select: none;
                display: inline-block;
                
                /* FIX 1: Only animate colors, never layout dimensions */
                transition: background-color 0.1s ease, border-color 0.1s ease, color 0.1s ease;
                
                /* FIX 2: Standardize letter metrics so measurements are exact */
                font-variant-ligatures: none;
                font-feature-settings: "liga" 0;
                text-rendering: optimizeSpeed;
                font-kerning: none;
            }

            .word-token:hover {
                background-color: #80138037;
                color: #1a202c;
            }

            .word-token.highlighted {
                background-color: #80138037;
                border-bottom-color: #801380;
                color: #000000;
            }

            /* ==========================================================================
               BOTTOM ROW: BAR & STATUS BANNER SYMMETRY
               ========================================================================== */
            #word-type-screen .bottom-bar {
                padding: 0.25rem;
                margin: 0;
                gap: 0.35rem;
                position: relative;
                width: 100%;
                box-sizing: border-box;
            }
            .word-type-status-bar {
                width: 100%;
                min-height: clamp(2rem, 6vh, 2.8rem);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: clamp(1rem, 3.5vh, 1.65rem);
                font-weight: 900;
                letter-spacing: 0.02em;
                text-transform: uppercase;
                border-radius: 0.25rem;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                border: 0.18rem solid #801380;
                background-color: #008000;
                color: #ffd700;
                box-sizing: border-box;
                padding: clamp(0.2rem, 1vh, 0.5rem) 1rem;
                margin: 0;
            }

            /* ==========================================================================
               TOP ROW: TIMER CLOCK SYMMETRY
               ========================================================================== */
            #wt-timer {
                font-size: clamp(1.2rem, 4.5vh, 2.16rem);
                font-weight: 900;
                color: #ffd700;
                font-family: monospace;
                display: inline-flex;
                text-align: center;
                justify-content: center;
                align-items: center;
                background-color: #008000;
                border-radius: 1rem;
                width: 90%;
                border: 0.18rem solid #801380;
                height: clamp(1.8rem, 5vh, 2.25rem);
            }
        `;
        document.head.appendChild(styleSheet);
    }
}

export const wordTypeController = new WordTypeController();