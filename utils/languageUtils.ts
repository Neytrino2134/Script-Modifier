
export const getLanguageName = (code: string): string => {
    const map: Record<string, string> = {
        'ru': 'Russian',
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'uz': 'Uzbek',
        'tr': 'Turkish',
        'sys': 'English' // Fallback for System language
    };
    return map[code] || 'English'; // Fallback to English
};
