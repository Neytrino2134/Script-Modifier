
export interface GeneratorUiState {
    isSummaryCollapsed: boolean;
    collapsedCharacters: string[];
    collapsedScenes: number[];
    isStyleCollapsed: boolean;
    isSettingsCollapsed: boolean;
    isCharactersSectionCollapsed: boolean;
    isScenesSectionCollapsed: boolean;
    [key: string]: any;
}
