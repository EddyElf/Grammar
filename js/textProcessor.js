/**
 * textProcessor.js
 * Handles data loading, text validation, tokenization, and grammar rule parsing.
 */
export class TextProcessor {
    /**
     * Dynamically fetches the target topic JSON and filters out the requested puzzle number.
     * Falls back to a random puzzle item if requested or if validation fails.
     */
    async loadPuzzle(grade, subject, puzzleNumber) {
        // Map raw dropdown parameters into your exact asset file structure
        // Changed from 'assets/' to 'data/' to match your folder name!
        const formattedSubject = subject.toLowerCase().replace('-', '_');
        const filePath = `data/g${grade}_${formattedSubject}.json`; 

        console.log(`Loading puzzle dataset from: ${filePath}`);
        
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Could not find or load data file: ${filePath}`);
        }
        
        const puzzleDataset = await response.json(); // Array of puzzles
        if (!puzzleDataset || puzzleDataset.length === 0) {
            throw new Error("Target dataset is empty.");
        }

        let chosenPuzzle = null;

        // If a specific puzzle number was successfully confirmed and validated
        if (puzzleNumber !== "random") {
            const targetId = parseInt(puzzleNumber, 10);
            // Search the data matrix for the specific puzzle ID
            chosenPuzzle = puzzleDataset.find(puzzle => puzzle.id === targetId);
        }

        // FALLBACK CHECK: If "random" was chosen, OR if the typed number (e.g. 150) 
        // doesn't exist in your current JSON array yet, select a random one!
        if (!chosenPuzzle) {
            const randomIndex = Math.floor(Math.random() * puzzleDataset.length);
            chosenPuzzle = puzzleDataset[randomIndex];
            console.log(`Playing puzzle ID: ${chosenPuzzle.id} (Selected via Random Mode or Fallback)`);
        } else {
            console.log(`Playing puzzle ID: ${chosenPuzzle.id} (Selected via Explicit Choice)`);
        }

        // Return a single puzzle object matching your game schema
        return chosenPuzzle; 
    }
    /**
     * Strict verification matching case, punctuation, and spacing.
     */
    verifySolution(playerInput, solutionText) {
        if (!playerInput || !solutionText) return false;
        return playerInput.trim() === solutionText.trim();
    }

    /**
     * Converts a raw paragraph string into a clean array of words for matching wordType arrays.
     */
    tokenizeRawText(rawText) {
        if (!rawText) return [];
        // Strips redundant spaces and splits by space
        return rawText.trim().replace(/\s+/g, " ").split(" ");
    }

    /**
     * Checks if a specific word index matches a desired part of speech (Noun, Verb, Adjective, etc.)
     */
    isWordType(targetIndex, expectedType, wordTypesArray) {
        return wordTypesArray.some(item => 
            item.wordIndex === targetIndex && 
            item.type.toLowerCase() === expectedType.toLowerCase()
        );
    }
}