
import { GenerateContentResponse, Type } from "@google/genai";
import { getAiClient, withRetry, cleanJsonString } from "./client";
import { getLanguageName } from "../../utils/languageUtils";

export const generateCharacters = async (prompt: string, count: number, language: string, type: string, style: string, customStyle: string) => {
    const ai = getAiClient();
    // For visual concept, we keep 'gray background' in two main languages as visual models understand EN best, 
    // but the phrase 'на сером фоне' is specifically requested for RU users. 
    // For other languages, we default to English phrase which models handle well.
    const bgPhrase = language === 'ru' ? 'на сером фоне, концепт персонажа' : 'on a gray background, character concept';
    const languageName = getLanguageName(language);

    const systemInstruction = `You are a creative character designer. Generate ${count} distinct characters based on the user's prompt. Language: ${languageName}. Type: ${type}. Style: ${customStyle || style}. 
    
    IMPORTANT: For the "fullDescription" field, strictly use the following Markdown headers to separate sections, regardless of the target language (translate header titles if appropriate for ${languageName} but keep structure):
    #### Appearance
    #### Personality
    #### Clothing
    
    Ensure all three sections are present and detailed.

    For the "prompt" field, generate a detailed visual description for image generation and APPEND: ", ${bgPhrase}".

    Return JSON array.`;
    
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    characters: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                fullDescription: { type: Type.STRING },
                                prompt: { type: Type.STRING, description: "Visual generation prompt for this character" },
                            },
                            required: ["name", "fullDescription", "prompt"]
                        }
                    }
                }
            }
        }
    }));
    
    const json = JSON.parse(cleanJsonString(response.text || '{}'));
    return json.characters || [];
};

export const analyzeCharacter = async (description: string) => {
    const ai = getAiClient();
    const prompt = `Analyze the character description and separate it into: Character (physical appearance) and Clothing.
    Description: "${description}"
    Return JSON.`;
    
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    }));
    return JSON.parse(cleanJsonString(response.text || '{}'));
};
