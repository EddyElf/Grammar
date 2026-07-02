export class InputHandler {
    constructor() {
        this.currentInput = "";
        this.onInputChanged = null;    // Callback function: (text) => {}
        this.onInputSubmitted = null;  // Callback function: (text) => {}
    }

    /**
     * Call this from your game engine loop or event listeners.
     */
    handleKeyboardInput(key, isBackspace, isEnter) {
        if (isEnter) {
            if (this.currentInput.trim().length > 0) {
                if (this.onInputSubmitted) this.onInputSubmitted(this.currentInput);
                this.clearInput();
            }
            return;
        }

        if (isBackspace) {
            if (this.currentInput.length > 0) {
                this.currentInput = this.currentInput.slice(0, -1);
                if (this.onInputChanged) this.onInputChanged(this.currentInput);
            }
            return;
        }

        // Add standard characters (ignoring system control keys like Shift/Alt)
        if (key.length === 1) {
            this.currentInput += key;
            if (this.onInputChanged) this.onInputChanged(this.currentInput);
        }
    }

    clearInput() {
        this.currentInput = "";
        if (this.onInputChanged) this.onInputChanged(this.currentInput);
    }

    getCurrentInput() {
        return this.currentInput;
    }
}