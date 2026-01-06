
import { GenerateContentResponse, Type } from "@google/genai";
import { getAiClient, withRetry, cleanJsonString } from "./client";

export const generateImage = async (prompt: string, aspectRatio: string = '1:1'): Promise<string> => {
    const ai = getAiClient();
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio
            }
        }
    }));
    
    // find image part
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data;
            }
        }
    }
    throw new Error("No image generated");
};

export const extractTextFromImage = async (base64: string) => {
    const ai = getAiClient();
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: base64 } },
                { text: "Extract all text from this image." }
            ]
        }
    }));
    return response.text || '';
};

export const extractYouTubeMetadata = async (base64: string) => {
    const ai = getAiClient();
    const prompt = `Analyze this image (a screenshot of a YouTube video row). 
    Extract the Video Title.
    Also generate a short description (1-2 sentences) describing the video content based on the title and thumbnail visual elements.
    If visible, also extract:
    - Views count (as a number)
    - Upload date (as a string)
    
    Return JSON: { "title": string, "description": string, "views"?: number, "uploadDate"?: string }`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: base64 } },
                { text: prompt }
            ]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    views: { type: Type.NUMBER, nullable: true },
                    uploadDate: { type: Type.STRING, nullable: true }
                },
                required: ['title', 'description']
            }
        }
    }));
    return JSON.parse(cleanJsonString(response.text || '{}'));
};
