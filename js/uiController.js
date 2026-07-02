export const ui = {
    app: null, 
    onTextChange: null, 
    currentRawText: "", // Internal baseline cache anchor for rendering highlights

    elements: {
        welcomeScreen: document.getElementById('welcome-screen'),
        playScreen: document.getElementById('play-screen'),
        finishScreen: document.getElementById('finish-screen'),
        modalOverlay: document.getElementById('modal-overlay'),
        modalText: document.getElementById('modal-text'),
        modalButtons: document.getElementById('modal-buttons'),
        instructionsModal: document.getElementById('instructions-modal'),
        instructionsBeginBtn: document.getElementById('instructions-begin-btn'),
        gradeLevel: document.getElementById('grade-level'),
        subjectMatter: document.getElementById('subject-matter'),
        extraConfigs: document.getElementById('extra-configs'),
        modeRandom: document.getElementById('mode-random'),
        modeSpecific: document.getElementById('mode-specific'),
        numberContainer: document.getElementById('number-input-container'),
        puzzleNumber: document.getElementById('puzzle-number'),
        gameArena: document.getElementById('game-arena'), 
        wordTypeBtn: document.getElementById('word-type-btn'),
        gameHintBtn: document.getElementById('game-hint-btn'),
        startBtn: document.getElementById('start-btn'),
        restartBtn: document.getElementById('restart-btn'),
        answerKeyBtn: document.getElementById('answer-key-btn'),
        bookStoreBtn: document.getElementById('book-store-btn'), 
        gameTimer: document.getElementById('game-timer'),
        hintBox: document.getElementById('hint-box'),
        finishMessage: document.getElementById('finish-message'),
        finalTime: document.getElementById('final-time')
    },

    init(appInstance) {
        this.app = appInstance;

        if (this.elements.startBtn) this.elements.startBtn.addEventListener('click', () => this.app.startGame());
        if (this.elements.restartBtn) this.elements.restartBtn.addEventListener('click', () => this.app.resetToHome());
        
        if (this.elements.answerKeyBtn) {
            this.elements.answerKeyBtn.addEventListener('click', () => {
                window.open('assets/AnswerKey.pdf', '_blank');
            });
        }
        
        // Add the Book Store handler (Opens the Amazon Store page in a new tab)
        if (this.elements.bookStoreBtn) {
            this.elements.bookStoreBtn.addEventListener('click', () => {
                window.open('https://www.amazon.com/stores/author/B0DBMR79KF/about', '_blank');
            });
        }
        
        if (this.elements.instructionsBeginBtn) {
            this.elements.instructionsBeginBtn.addEventListener('click', () => {
                this.hideInstructions();
                if (this.app && this.app.gameManager) {
                    this.app.gameManager.startClock();
                }
            });
        }

        if (this.elements.gameHintBtn) {
            this.elements.gameHintBtn.addEventListener('click', () => {
                this.playAlert(); // <-- Add this single line here
                if (this.app && this.app.gameManager) {
                    this.app.gameManager.showHint();
                }
            });
        }

        const validateDropdowns = () => {
            const gradeSelected = this.elements.gradeLevel && this.elements.gradeLevel.value !== "";
            const subjectSelected = this.elements.subjectMatter && this.elements.subjectMatter.value !== "";

            if (gradeSelected && subjectSelected) {
                if (this.elements.modeRandom) this.elements.modeRandom.disabled = false;
                if (this.elements.modeSpecific) this.elements.modeSpecific.disabled = false;
                
                if (this.elements.modeSpecific && this.elements.modeSpecific.checked) {
                    if (this.elements.puzzleNumber) this.elements.puzzleNumber.disabled = false;
                } else {
                    if (this.elements.puzzleNumber) this.elements.puzzleNumber.disabled = true;
                    if (this.elements.puzzleNumber) this.elements.puzzleNumber.value = ''; 
                }
            } else {
                if (this.elements.modeRandom) this.elements.modeRandom.disabled = true;
                if (this.elements.modeSpecific) this.elements.modeSpecific.disabled = true;
                if (this.elements.puzzleNumber) this.elements.puzzleNumber.disabled = true;
            }
        };

        if (this.elements.gradeLevel) this.elements.gradeLevel.addEventListener('change', validateDropdowns);
        if (this.elements.subjectMatter) this.elements.subjectMatter.addEventListener('change', validateDropdowns);

        if (this.elements.modeRandom) {
            this.elements.modeRandom.addEventListener('change', () => {
                if (this.elements.puzzleNumber) {
                    this.elements.puzzleNumber.disabled = true;
                    this.elements.puzzleNumber.value = ''; 
                }
            });
        }

        if (this.elements.modeSpecific) {
            this.elements.modeSpecific.addEventListener('change', () => {
                if (this.elements.puzzleNumber) {
                    this.elements.puzzleNumber.disabled = false;
                    this.elements.puzzleNumber.focus(); 
                }
            });
        }

        if (this.elements.wordTypeBtn) {
            this.elements.wordTypeBtn.addEventListener('click', () => {
                this.playAlert(); // <-- Add this single line here
                this.showConfirmation("Proceed to Word Type Identification Puzzle?", () => {
                    if (this.app && this.app.gameManager) {
                        this.app.gameManager.switchToWordTypeMode();
                    }
                });
            });
        }

        const returnBtn = document.getElementById('return-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                this.playAlert(); // <-- Add this single line here
                this.showConfirmation("Are you sure you want to return to the home screen?", () => {
                    this.app.resetToHome();
                });
            });
        }

        const solutionBtn = document.getElementById('solution-btn');
        if (solutionBtn) {
            solutionBtn.addEventListener('click', () => {
                this.playAlert(); // <-- Add this single line here
                this.showConfirmation("Are you sure you want to see the solution?", () => {
                    if (this.app && this.app.gameManager) {
                        this.app.gameManager.revealSolution();
                    }
                });
            });
        }

        this.bindGrammarButtons();
        this.bindNavigationArrows();
    },

    bindGrammarButtons() {
        const buttons = document.querySelectorAll('.grammar-btn');
        
        const actionMap = {
            'period': '.', 'question': '?', 'exclamation': '!', 'comma': ',',
            'apostrophe': "'", 'semicolon': ';', 'quote': '"', 'colon': ':',
            'hyphen': '-', 'open-paren': '(', 'close-paren': ')'
        };

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const textarea = document.getElementById('puzzle-text-input');
                if (!textarea || textarea.readOnly) return;

                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const action = btn.getAttribute('data-action');

                let newText = text;
                let newCursorPos = start;

                if (action === 'capitalize') {
                    if (start < text.length) {
                        const char = text[start];
                        const transformedChar = (char === char.toUpperCase()) ? char.toLowerCase() : char.toUpperCase();
                        newText = text.slice(0, start) + transformedChar + text.slice(start + 1);
                        newCursorPos = start + 1; 
                    }
                } else {
                    const insertChar = actionMap[action] || '';
                    if (insertChar) {
                        newText = text.slice(0, start) + insertChar + text.slice(end);
                        newCursorPos = start + insertChar.length;
                    }
                }

                textarea.value = newText;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                textarea.focus();
                textarea.dispatchEvent(new Event('input'));
            });
        });
    },

    bindNavigationArrows() {
        const arrowButtons = document.querySelectorAll('.nav-arrow-btn');
        arrowButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.getAttribute('data-dir');
                this.handleCursorNavigation(direction);
            });
        });
    },

    handleCursorNavigation(direction) {
        const textarea = document.getElementById('puzzle-text-input');
        const backdrop = document.getElementById('puzzle-text-backdrop');
        if (!textarea || !backdrop) return;

        let pos = textarea.selectionStart;
        const textLength = textarea.value.length;
        const spans = backdrop.querySelectorAll('span');

        if (direction === 'left') {
            pos = Math.max(0, pos - 1);
        } else if (direction === 'right') {
            pos = Math.min(textLength, pos + 1);
        } else if ((direction === 'up' || direction === 'down') && spans.length > 0) {
            const currentIdx = Math.min(pos, spans.length - 1);
            const currentSpan = spans[currentIdx];
            
            if (currentSpan) {
                const currentTop = currentSpan.offsetTop;
                const currentLeft = currentSpan.offsetLeft;
                let targetSpanIndex = null;
                let bestDistance = Infinity;

                if (direction === 'up') {
                    let targetTop = -1;
                    for (let i = currentIdx; i >= 0; i--) {
                        if (spans[i].offsetTop < currentTop) {
                            targetTop = spans[i].offsetTop;
                            break;
                        }
                    }
                    if (targetTop !== -1) {
                        for (let i = 0; i < spans.length; i++) {
                            if (spans[i].offsetTop === targetTop) {
                                const dist = Math.abs(spans[i].offsetLeft - currentLeft);
                                if (dist < bestDistance) {
                                    bestDistance = dist;
                                    targetSpanIndex = i;
                                }
                            }
                        }
                    } else {
                        pos = 0; 
                    }
                } else if (direction === 'down') {
                    let targetTop = -1;
                    for (let i = currentIdx; i < spans.length; i++) {
                        if (spans[i].offsetTop > currentTop) {
                            targetTop = spans[i].offsetTop;
                            break;
                        }
                    }
                    if (targetTop !== -1) {
                        for (let i = 0; i < spans.length; i++) {
                            if (spans[i].offsetTop === targetTop) {
                                const dist = Math.abs(spans[i].offsetLeft - currentLeft);
                                if (dist < bestDistance) {
                                    bestDistance = dist;
                                    targetSpanIndex = i;
                                }
                            }
                        }
                    } else {
                        pos = textLength; 
                    }
                }

                if (targetSpanIndex !== null) {
                    pos = targetSpanIndex;
                }
            }
        }

        textarea.focus();
        textarea.setSelectionRange(pos, pos);
        backdrop.scrollTop = textarea.scrollTop;
        backdrop.scrollLeft = textarea.scrollLeft;
    },

    loadPuzzleText(text, onChangeCallback) {
        this.onTextChange = onChangeCallback;
        if (!this.elements.gameArena) return;
        
        this.currentRawText = text;
        
        this.elements.gameArena.innerHTML = `
            <div id="puzzle-text-backdrop" class="puzzle-backdrop"></div>
            <textarea id="puzzle-text-input" class="puzzle-textarea" spellcheck="false">${text}</textarea>
        `;
        
        const textarea = document.getElementById('puzzle-text-input');
        const backdrop = document.getElementById('puzzle-text-backdrop');
        
        if (textarea && backdrop) {
            const adjustFontSize = () => {
                this.updateBackdropHtml(textarea.value);

                let minFontSize = 13; 
                let maxFontSize = 99; // Restored back to a high cap for large screens
                let optimalFontSize = minFontSize;

                // Reset manual layout modifiers so flexbox computes bounded space cleanly
                this.elements.gameArena.style.height = '';
                const arenaHeight = this.elements.gameArena.clientHeight;
                
                backdrop.style.height = 'auto';
                
                // Highly optimized binary search loop (runs in max 7 steps)
                while (minFontSize <= maxFontSize) {
                    const midFontSize = Math.floor((minFontSize + maxFontSize) / 2);
                    
                    textarea.style.fontSize = midFontSize + 'px';
                    backdrop.style.fontSize = midFontSize + 'px';
                    
                    if (backdrop.scrollHeight <= arenaHeight) {
                        optimalFontSize = midFontSize; // It fits! Save this as a candidate...
                        minFontSize = midFontSize + 1;  // ...and try to see if a larger size fits.
                    } else {
                        maxFontSize = midFontSize - 1;  // Too big! Try smaller sizes.
                    }
                }

                // Apply the absolute best fit discovered
                textarea.style.fontSize = optimalFontSize + 'px';
                backdrop.style.fontSize = optimalFontSize + 'px';

                backdrop.style.height = '100%';
            };

            adjustFontSize();
            this.updateBackdropHtml(textarea.value);

            textarea.addEventListener('input', () => {
                const textBeforeCheck = textarea.value; // Cache the new input text

                adjustFontSize(); 
                this.updateBackdropHtml(textarea.value);
                backdrop.scrollTop = textarea.scrollTop;
                backdrop.scrollLeft = textarea.scrollLeft;

                if (this.onTextChange) this.onTextChange(textarea.value);

                // If the game manager didn't revert the text, the answer was correct!
                if (textarea.value === textBeforeCheck) {
                    this.playEnter();
                }
            });

            textarea.addEventListener('beforeinput', (e) => {
                e.preventDefault(); 
            });

            textarea.addEventListener('keydown', (e) => {
                const allowedNavigation = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
                if (!allowedNavigation.includes(e.key)) {
                    e.preventDefault();
                }
            });
            
            textarea.addEventListener('scroll', () => {
                backdrop.scrollTop = textarea.scrollTop;
                backdrop.scrollLeft = textarea.scrollLeft;
            });
            
            window.addEventListener('resize', adjustFontSize);

            if (this.onTextChange) this.onTextChange(textarea.value);
        }
    },

    updateBackdropHtml(currentText) {
        const backdrop = document.getElementById('puzzle-text-backdrop');
        if (!backdrop || !this.currentRawText) return;

        let html = "";
        let r = 0;
        const rawText = this.currentRawText;

        for (let c = 0; c < currentText.length; c++) {
            const char = currentText[c];
            let displayedChar = char;
            
            if (char === '<') displayedChar = '&lt;';
            else if (char === '>') displayedChar = '&gt;';
            else if (char === '&') displayedChar = '&amp;';
            else if (char === '\n') displayedChar = '<br>';

            if (r < rawText.length && char === rawText[r]) {
                html += `<span>${displayedChar}</span>`;
                r++;
            } else if (r < rawText.length && char.toLowerCase() === rawText[r]) {
                html += `<span class="corrected-marker">${displayedChar}</span>`;
                r++;
            } else {
                html += `<span class="corrected-marker">${displayedChar}</span>`;
            }
        }

        if (currentText.endsWith('\n')) {
            html += '<span><br></span>';
        }

        backdrop.innerHTML = html;
    },

    getGameConfigurations() {
        return {
            gradeLevel: this.elements.gradeLevel ? this.elements.gradeLevel.value : "",
            subject: this.elements.subjectMatter ? this.elements.subjectMatter.value : "",
            selectionMode: (this.elements.modeSpecific && this.elements.modeSpecific.checked) ? 'specific' : 'random',
            puzzleNumber: this.elements.puzzleNumber ? this.elements.puzzleNumber.value.trim() : "",
            skipGrammar: false
        };
    },

    switchScreen(fromId, toId) {
        const fromEl = document.getElementById(fromId);
        const toEl = document.getElementById(toId);
        if (fromEl) fromEl.classList.add('hidden');
        if (toEl) toEl.classList.remove('hidden');
    },

    showInstructions() {
        this.playIntro(); // <-- Add this single line here
        if (this.elements.instructionsModal) {
            this.elements.instructionsModal.classList.remove('hidden');
        }
    },

    hideInstructions() {
        if (this.elements.instructionsModal) this.elements.instructionsModal.classList.add('hidden');
    },

    showWarning(message) {
        if (!this.elements.modalText || !this.elements.modalButtons || !this.elements.modalOverlay) return;
        this.elements.modalText.innerHTML = message;
        this.elements.modalButtons.innerHTML = ''; 
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn modal-confirm-btn';
        closeBtn.textContent = 'OK';
        closeBtn.addEventListener('click', () => this.hideModal());
        
        this.elements.modalButtons.appendChild(closeBtn);
        this.elements.modalOverlay.classList.remove('hidden');
    },

    showConfirmation(message, onConfirm) {
        if (!this.elements.modalText || !this.elements.modalButtons || !this.elements.modalOverlay) return;
        this.elements.modalText.textContent = message;
        this.elements.modalButtons.innerHTML = '';

        const yesBtn = document.createElement('button');
        yesBtn.className = 'btn modal-confirm-btn';
        yesBtn.textContent = 'Yes';
        yesBtn.addEventListener('click', () => {
            this.hideModal();
            onConfirm();
        });

        const noBtn = document.createElement('button');
        noBtn.className = 'btn modal-confirm-btn';
        noBtn.textContent = 'No';
        noBtn.addEventListener('click', () => this.hideModal());

        this.elements.modalButtons.appendChild(yesBtn);
        this.elements.modalButtons.appendChild(noBtn);
        this.elements.modalOverlay.classList.remove('hidden');
    },

    hideModal() {
        if (this.elements.modalOverlay) this.elements.modalOverlay.classList.add('hidden');
    },

    updateTimer(timeString) {
        if (this.elements.gameTimer) this.elements.gameTimer.textContent = timeString;
    },

    updateHintBox(count) {
        if (this.elements.hintBox) this.elements.hintBox.textContent = `${count} changes remaining`;
    },

    displayGameOver(message) {
        const textarea = document.getElementById('puzzle-text-input');
        if (textarea) textarea.readOnly = true;

        const bottomBar = document.querySelector('.bottom-bar');
        if (bottomBar) {
            const existingOverlay = document.getElementById('congrats-banner');
            if (existingOverlay) existingOverlay.remove();

            const overlay = document.createElement('div');
            overlay.id = 'congrats-banner';
            overlay.className = 'congrats-overlay';
            
            overlay.style.fontSize = 'clamp(1.5rem, 5vw, 2.5rem)';
            overlay.style.fontWeight = '900';
            overlay.style.lineHeight = '1';
            overlay.style.letterSpacing = '1px';
            overlay.style.padding = '0 1rem';
            overlay.style.textAlign = 'center';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.height = '100%';
            overlay.style.width = '100%';
            overlay.style.boxSizing = 'border-box';
            
            overlay.textContent = message;
            bottomBar.appendChild(overlay);
        }
    },

    clearInputs() {
        if (this.elements.gradeLevel) this.elements.gradeLevel.selectedIndex = 0;     
        if (this.elements.subjectMatter) this.elements.subjectMatter.selectedIndex = 0;   
        if (this.elements.modeRandom) this.elements.modeRandom.checked = true; 
        if (this.elements.puzzleNumber) this.elements.puzzleNumber.value = "";    
        
        if (this.elements.modeRandom) this.elements.modeRandom.disabled = true;
        if (this.elements.modeSpecific) this.elements.modeSpecific.disabled = true;
        if (this.elements.puzzleNumber) this.elements.puzzleNumber.disabled = true;

        if (this.elements.gameTimer) this.elements.gameTimer.textContent = "00:00"; 
        if (this.elements.gameArena) this.elements.gameArena.innerHTML = ""; 
        this.currentRawText = "";

        const existingOverlay = document.getElementById('congrats-banner');
        if (existingOverlay) existingOverlay.remove();
    },

    showHint(message) {
        if (!this.elements.modalText || !this.elements.modalButtons || !this.elements.modalOverlay) return;
        
        this.elements.modalText.innerHTML = message;
        this.elements.modalButtons.innerHTML = ''; 
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn modal-confirm-btn';
        closeBtn.textContent = 'Got it!';
        closeBtn.addEventListener('click', () => this.hideModal());
        
        this.elements.modalButtons.appendChild(closeBtn);
        this.elements.modalOverlay.classList.remove('hidden');
    },

    revertTextArea(validText) {
        const textarea = document.getElementById('puzzle-text-input');
        if (!textarea) return;
        
        const currentCursor = textarea.selectionStart;
        textarea.value = validText;
        
        const safeCursorPos = Math.max(0, currentCursor - 1);
        textarea.setSelectionRange(safeCursorPos, safeCursorPos);
        textarea.focus();

        this.updateBackdropHtml(validText);
    },

    showIncorrectFeedback() {
        this.playBuzzer();

        let toast = document.getElementById('incorrect-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'incorrect-toast';
            
            Object.assign(toast.style, {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#ffd700',
                color: '#801380',
                padding: '18px 45px',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                zIndex: '9999',
                pointerEvents: 'none',
                transition: 'opacity 0.15s ease',
                border: '0.25rem solid #008000'
            });
            document.getElementById('play-screen').appendChild(toast);
        }

        toast.textContent = 'INCORRECT';
        toast.style.display = 'block';
        toast.style.opacity = '1';

        if (this.toastTimeout) clearTimeout(this.toastTimeout);

        this.toastTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => { toast.style.display = 'none'; }, 150);
        }, 1000);
    },

    playBuzzer() {
        try {
            const audio = new Audio('assets/wrong.mp3'); 
            audio.volume = 0.25; 
            audio.play().catch(err => {
                console.warn("Playback prevented until user clicks the screen:", err);
            });
        } catch (error) {
            console.warn("Audio playback unsupported:", error);
        }
    },

    playCheers() {
        try {
            const audio = new Audio('assets/cheers.mp3'); 
            audio.volume = 0.30; 
            audio.play().catch(err => {
                console.warn("Playback blocked by browser autoplay security rules:", err);
            });
        } catch (error) {
            console.warn("Audio playback engine failure:", error);
        }
    },

    playAlert() {
        try {
            const audio = new Audio('assets/alert.mp3');
            audio.volume = 0.25;
            audio.play().catch(err => console.warn("Audio playback prevented:", err));
        } catch (error) {
            console.warn("Audio playback unsupported:", error);
        }
    },

    playEnter() {
        try {
            const audio = new Audio('assets/enter.mp3');
            audio.volume = 0.30;
            audio.play().catch(err => console.warn("Audio playback prevented:", err));
        } catch (error) {
            console.warn("Audio playback unsupported:", error);
        }
    },

    playIntro() {
        try {
            const audio = new Audio('assets/intro.mp3');
            audio.volume = 0.30;
            audio.play().catch(err => console.warn("Audio playback prevented:", err));
        } catch (error) {
            console.warn("Audio playback unsupported:", error);
        }
    },

    playTrumpets() {
        try {
            const audio = new Audio('assets/trumpets.mp3');
            audio.volume = 0.30;
            audio.play().catch(err => console.warn("Audio playback prevented:", err));
        } catch (error) {
            console.warn("Audio playback unsupported:", error);
        }
    },

    playRemove() {
        try {
            const audio = new Audio('assets/remove.mp3');
            audio.volume = 0.25;
            audio.play().catch(err => console.warn("Audio playback prevented:", err));
        } catch (error) {
            console.warn("Audio playback unsupported:", error);
        }
    }

};