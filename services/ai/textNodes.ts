
import { GenerateContentResponse } from "@google/genai";
import { getAiClient, withRetry, cleanJsonString } from "./client";

export const enhancePrompt = async (inputs: string[]) => {
    const ai = getAiClient();
    const prompt = `Enhance and combine these prompts into a detailed image generation prompt: ${inputs.join('\n')}`;
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    }));
    return response.text || '';
};

export const translateText = async (text: string, targetLang: string) => {
    const ai = getAiClient();
    const prompt = `Translate the following text to ${targetLang}:\n\n${text}`;
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    }));
    return response.text || '';
};

export const fixTextErrors = async (text: string) => {
    const ai = getAiClient();
    const prompt = `Fix grammar and spelling errors in the following text:\n\n${text}`;
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    }));
    return response.text || '';
};

export const analyzePrompt = async (promptText: string) => {
    const ai = getAiClient();
    const prompt = `Analyze the following prompt and split it into these components: Environment, Characters (array of names/descriptions), Action, Style.
    Prompt: "${promptText}"
    Return JSON.`;
    
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    }));
    return JSON.parse(cleanJsonString(response.text || '{}'));
};
