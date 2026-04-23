import {gameState, STORAGE_KEY_PROGRESS} from "../constants";

export function loadProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (typeof data.highestUnlockedLevel === "number") {
            gameState.highestUnlockedLevel = Math.max(0, data.highestUnlockedLevel);
        }
    } catch {}
}

export function saveProgress() {
    try {
        localStorage.setItem(
            STORAGE_KEY_PROGRESS,
            JSON.stringify({highestUnlockedLevel: gameState.highestUnlockedLevel})
        );
    } catch {}
}

export function unlockLevel(index: number) {
    const max = Math.max(0, gameState.levels.length - 1);
    const clamped = Math.min(Math.max(index, 0), max);
    if (clamped > gameState.highestUnlockedLevel) {
        gameState.highestUnlockedLevel = clamped;
        saveProgress();
    }
}
