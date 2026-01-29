
import { GenerateContentResponse, Type } from "@google/genai";
import { getAiClient, withRetry, cleanJsonString } from "./ai/client";

export { getAiClient, withRetry, cleanJsonString };

// Export all from sub-modules
export * from "./ai/scriptNodes";
export * from "./ai/characterNodes";
export * from "./ai/imageNodes";
export * from "./ai/textNodes";
export * from "./ai/audioNodes";
export * from "./ai/ideaNodes";
export * from "./ai/youtubeNodes";

export const generateMp3Tags = async (
    files: { id: string; name: string }[],
    contextPrompt: string
): Promise<{ id: string; title: string; artist: string; album: string; genre: string; trackNumber: string }[]> => {
    const ai = getAiClient();
    
    const instructions = `
    You are a professional Music Metadata Editor and Librarian. 
    Your task is to generate cohesive and creative ID3 tags (Title, Artist, Album, Genre, Track Number) for a list of audio files based on the user's Context Prompt.
    
    Context Prompt: "${contextPrompt || 'Auto-detect based on filenames, ensure formatting is clean and professional.'}"
    
    Rules:
    1. If the context implies a specific album or artist, apply it consistently.
    2. Generate unique, creative Titles for each track if they are currently generic.
    3. Ensure Genre is standard ID3 compliant if possible (e.g., Pop, Rock, Electronic) or specific if requested.
    4. Infer the **Track Number** from the filename (e.g., "01_Song.mp3" -> "1"). If no number exists, guess a logical order.
    5. Return a JSON array matching the provided IDs.
    `;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                album: { type: Type.STRING },
                genre: { type: Type.STRING },
                trackNumber: { type: Type.STRING }
            },
            required: ["id", "title", "artist", "album", "genre", "trackNumber"]
        }
    };

    // Prepare minimal payload to save tokens
    const filesPayload = JSON.stringify(files);

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${instructions}\n\nFiles to tag:\n${filesPayload}`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema
        }
    }));

    return JSON.parse(cleanJsonString(response.text || '[]'));
};
