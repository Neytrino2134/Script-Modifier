
export interface Frame {
    sceneNumber: number;
    frameNumber: number;
    characters: string[];
    duration: number;
    imagePrompt: string;
    environmentPrompt: string;
    videoPrompt: string;
    shotType: string; // New technical field
    soundNotes?: string;
    // description field is intentionally removed
}

export interface AnalyzedCharacter {
    name: string;
    imagePrompt: string;
    fullDescription: string;
    id?: string;
    index?: string;
}

export interface AnalyzerUiState {
    isSettingsCollapsed: boolean;
    isCharStyleCollapsed?: boolean;
    [key: string]: any;
}

export type EditableFramePart = 'imagePrompt' | 'environmentPrompt' | 'videoPrompt' | 'shotType';
