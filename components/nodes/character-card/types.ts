
export interface CharacterData {
    type?: string; // "character-card"
    nodeTitle?: string;
    id: string;
    name: string;
    index: string;
    image: string | null;
    thumbnails: Record<string, string | null>;
    selectedRatio: string;
    prompt: string;
    additionalPrompt?: string;
    fullDescription: string;
    targetLanguage?: string;
    isOutput?: boolean;
    isActive?: boolean;
    isDescriptionCollapsed?: boolean;
    isImageCollapsed?: boolean;
    isPromptCollapsed?: boolean;
    // Internal fields for drag/drop or full resolution storage
    imageSources?: Record<string, string | null>;
    _fullResActive?: string | null;
    imageBase64?: string | null; // Legacy support
    alias?: string; // Legacy support
}
