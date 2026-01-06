
export interface CharacterData {
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
    isDescriptionCollapsed?: boolean;
    isImageCollapsed?: boolean;
    // Internal fields for drag/drop
    imageSources?: Record<string, string | null>;
    _fullResActive?: string | null;
    imageBase64?: string | null; // Legacy support
    alias?: string; // Legacy support
}
