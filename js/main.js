/**
 * main.js
 * The Orchestrating Hub of the application.
 */

import { ui } from './uiController.js';
import { GameManager } from './gameManager.js';
import { InputHandler } from './inputHandler.js';
import { TextProcessor } from './textProcessor.js';

class AppController {
    constructor() {
        this.config = { gradeLevel: "", subject: "", puzzleNumber: "", skipGrammar: false };
        
        // Correctly instantiate modules and create dependency chains
        this.processor = new TextProcessor();
        this.inputHandler = new InputHandler();
        this.gameManager = new GameManager(this.inputHandler, this.processor);
    }

    init() {
        console.log("Grammar Game Engine Initialized.");
        ui.init(this);
        // Note: Make sure inputHandler or ui bridges the on-screen bottom-bar buttons!
    }

    /**
     * Transitions the application to the Play Screen by loading a JSON puzzle.
     */
    /**
     * Transitions the application to the Play Screen by loading a JSON puzzle.
     */
    async startGame() {
        const uiConfig = ui.getGameConfigurations();
        
        this.config.gradeLevel = uiConfig.gradeLevel;
        this.config.subject = uiConfig.subject;
        this.config.skipGrammar = uiConfig.skipGrammar;

        // Validation Check: Enforce that both dropdowns are selected
        if (!this.config.gradeLevel || !this.config.subject) {
            ui.showWarning("<strong>Please select a grade and a subject to start.</strong>");
            return;
        }

        // Determine Puzzle Number selection & fallback verification
        let selectedNumber = "random";

        if (uiConfig.selectionMode === 'specific') {
            const parsedInt = parseInt(uiConfig.puzzleNumber, 10);
            
            // Check if it's a valid integer between 1 and 180
            if (!isNaN(parsedInt) && parsedInt >= 1 && parsedInt <= 180 && String(parsedInt) === uiConfig.puzzleNumber) {
                selectedNumber = String(parsedInt);
                console.log(`Valid puzzle selection input confirmed: Puzzle #${selectedNumber}`);
            } else {
                console.log(`Invalid puzzle choice raw value: "${uiConfig.puzzleNumber}". Falling back to a random selection.`);
                // Show a quick console warning or notification if desired
            }
        }

        this.config.puzzleNumber = selectedNumber;
        console.log("Fetching puzzle data for:", this.config);

        try {
            // Fetch the specific pre-authored puzzle from our JSON system
            // Note: Also corrected global module imports context mismatch here
            const puzzleData = await this.processor.loadPuzzle(
                this.config.gradeLevel, 
                this.config.subject, 
                this.config.puzzleNumber
            );
            
            // Move to the game layout screen
            ui.switchScreen('welcome-screen', 'play-screen');

            // Trigger the directions splash instructions panel overlay
            ui.showInstructions();

            // Hand the exact puzzle data to the Game Manager
            this.gameManager.startGame(puzzleData, this.config.skipGrammar);
            
        } catch (error) {
            console.error(error);
            ui.showWarning("Failed to load the selected puzzle file. Make sure the JSON file exists.");
        }
    }

    endGame(finalTimeFormatted) {
        ui.switchScreen('play-screen', 'finish-screen');
        ui.displayFinishMessage(finalTimeFormatted);
    }

    resetToHome() {
        this.gameManager.resetEngine(); // <-- Updated from game.resetEngine();
        ui.switchScreen('play-screen', 'welcome-screen');
        ui.switchScreen('finish-screen', 'welcome-screen');
        ui.clearInputs();
    }
}

const app = new AppController();

document.addEventListener("DOMContentLoaded", () => {
    app.init();
});