import { ui } from './uiController.js';
import { wordTypeController as wc } from './wordTypeController.js';

export const GameState = {
    MAIN_MENU: "MainMenu",
    PLAYING: "Playing",
    PARAGRAPH_COMPLETE: "ParagraphComplete",
    GAME_OVER: "GameOver",
    WORD_TYPE_PUZZLE: "WordTypePuzzle"
};

export class GameManager {
    constructor(inputHandler, textProcessor) {
        this.inputHandler = inputHandler;
        this.textProcessor = textProcessor;

        this.currentState = GameState.MAIN_MENU;
        this.activeDataset = [];
        this.currentParagraphIndex = 0;
        this.playerScore = 0;
        this.previousValidText = ""; 

        this.timerInterval = null;
        this.secondsElapsed = 0;

        this.inputHandler.onInputSubmitted = (text) => this.evaluateSubmission(text);
    }

    /**
     * Called directly by uiController when the user confirms the switch
     */
    switchToWordTypeMode() {
        // Prevent transitioning only if we are already inside the word type puzzle layout
        if (this.currentState === GameState.WORD_TYPE_PUZZLE) return;

        // If the player finished the entire game cleanly, clamp the index to the 
        // last completed paragraph so they can still study its word types.
        let targetIndex = this.currentParagraphIndex;
        if (targetIndex >= this.activeDataset.length) {
            targetIndex = this.activeDataset.length - 1;
        }

        const targetParagraph = this.activeDataset[targetIndex];
        if (!targetParagraph) {
            console.error("No active puzzle paragraph available for Word Type extraction.");
            return;
        }

        // 1. Clear the main grammar clock interval cleanly
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // 2. Pivot the internal state flag to lock out grammar actions
        this.currentState = GameState.WORD_TYPE_PUZZLE;

        // 3. Pass control over to our word type controller module using the alias
        wc.init();
        wc.start(targetParagraph);
    }

    startGame(loadedJsonData) {
        if (!loadedJsonData) {
            console.error("No JSON data provided to GameManager.");
            return;
        }

        this.activeDataset = Array.isArray(loadedJsonData) ? loadedJsonData : [loadedJsonData];
        
        this.activeDataset.forEach(paragraph => {
            if (paragraph.rawText) {
                paragraph.rawText = paragraph.rawText.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
            }
            if (paragraph.solutionText) {
                paragraph.solutionText = paragraph.solutionText.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
            }
            if (paragraph.extendedText) {
                paragraph.extendedText = paragraph.extendedText.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
            }
        });

        this.currentParagraphIndex = 0;
        this.secondsElapsed = 0;
        this.currentState = GameState.MAIN_MENU;

        const initialParagraph = this.activeDataset[this.currentParagraphIndex];
        this.previousValidText = initialParagraph.rawText;

        ui.loadPuzzleText(initialParagraph.rawText, (text) => this.evaluateSubmission(text));
        ui.updateTimer("00:00");
    }

    startClock() {
        this.currentState = GameState.PLAYING;
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            this.secondsElapsed++;
            const mins = String(Math.floor(this.secondsElapsed / 60)).padStart(2, '0');
            const secs = String(this.secondsElapsed % 60).padStart(2, '0');
            ui.updateTimer(`${mins}:${secs}`);
        }, 1000);
    }

    resetEngine() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.secondsElapsed = 0;
        this.currentParagraphIndex = 0;
        this.activeDataset = [];
        this.previousValidText = "";
        this.currentState = GameState.MAIN_MENU;

        // Clean up the Word Type view grids if the user exits back home mid-game
        wc.resetAndRestoreUI();
    }

    evaluateSubmission(currentInputText) {
        if (this.currentState !== GameState.PLAYING) return;

        const targetParagraph = this.activeDataset[this.currentParagraphIndex];
        if (!targetParagraph) return;

        const normalizedInput = currentInputText.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');

        if (this.textProcessor.verifySolution(normalizedInput, targetParagraph.solutionText)) {
            this.advanceParagraph();
            return;
        }

        if (!this.isValidIncrementalInput(normalizedInput, targetParagraph.solutionText)) {
            ui.showIncorrectFeedback();
            ui.revertTextArea(this.previousValidText);
        } else {
            this.previousValidText = normalizedInput;
        }
    }

    revealSolution() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const currentParagraph = this.activeDataset[this.currentParagraphIndex];
        if (!currentParagraph || !currentParagraph.solutionText) return;

        ui.revertTextArea(currentParagraph.solutionText);
        ui.displayGameOver("ANSWER");
        this.currentState = GameState.GAME_OVER;
    }

    showHint() {
        const targetParagraph = this.activeDataset[this.currentParagraphIndex];
        if (!targetParagraph || !targetParagraph.hintLines) return;
        
        let hintHtml = `<div style="text-align: left; font-size: 1.35rem; line-height: 1.6;">`;
        targetParagraph.hintLines.forEach(line => {
            hintHtml += `• <strong>${line}</strong><br>`;
        });
        hintHtml += `</div>`;
        
        ui.showHint(hintHtml);
    }

    isValidIncrementalInput(currentInput, solutionText) {
        const currentTokens = currentInput.trim().split(/\s+/);
        const solutionTokens = solutionText.trim().split(/\s+/);
        
        const targetParagraph = this.activeDataset[this.currentParagraphIndex];
        if (!targetParagraph || !targetParagraph.rawText) return false;
        const rawTokens = targetParagraph.rawText.trim().split(/\s+/);

        if (currentTokens.length !== solutionTokens.length || rawTokens.length !== solutionTokens.length) {
            return false;
        }

        for (let i = 0; i < currentTokens.length; i++) {
            const curToken = currentTokens[i];
            const solToken = solutionTokens[i];
            const rawToken = rawTokens[i];

            if (curToken === solToken || curToken === rawToken) continue;

            const curLetters = curToken.replace(/[^a-zA-Z0-9]/g, "");
            const rawLetters = rawToken.replace(/[^a-zA-Z0-9]/g, "");
            const solLetters = solToken.replace(/[^a-zA-Z0-9]/g, "");

            // Ensure base letter sequence matches
            if (curLetters.toLowerCase() !== rawLetters.toLowerCase()) return false;

            // Allow partial capitalization by verifying each character matches raw or solution case
            for (let j = 0; j < curLetters.length; j++) {
                const char = curLetters[j];
                if (char !== rawLetters[j] && char !== solLetters[j]) {
                    return false;
                }
            }

            if (!this.isSubsequence(curToken, solToken)) return false;
        }
        return true;
    }

    isSubsequence(sub, main) {
        let subIdx = 0;
        let mainIdx = 0;
        const subLower = sub.toLowerCase();
        const mainLower = main.toLowerCase();

        while (subIdx < subLower.length && mainIdx < mainLower.length) {
            if (subLower[subIdx] === mainLower[mainIdx]) subIdx++;
            mainIdx++;
        }
        return subIdx === subLower.length;
    }

    advanceParagraph() {
        this.currentParagraphIndex++;
        if (this.currentParagraphIndex >= this.activeDataset.length) {
            this.currentState = GameState.GAME_OVER;
            if (this.timerInterval) clearInterval(this.timerInterval);

            ui.playCheers();
            ui.displayGameOver("CONGRATULATIONS!"); 
        } else {
            this.inputHandler.clearInput();
            const nextParagraph = this.activeDataset[this.currentParagraphIndex];
            this.previousValidText = nextParagraph.rawText;
            ui.loadPuzzleText(nextParagraph.rawText, (text) => this.evaluateSubmission(text));
        }
    }
}
