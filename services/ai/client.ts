
import { GoogleGenAI } from "@google/genai";

export const getAiClient = () => {
    // Check LocalStorage first (User entered key), then Environment Variable (Build time key)
    const apiKey = localStorage.getItem('gemini-api-key') || process.env.API_KEY;

    if (!apiKey) {
        throw new Error("API Key not found. Please set it in Settings.");
    }

    return new GoogleGenAI({ apiKey });
};

export const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await fn();
    } catch (e: any) {
        if (retries > 0 && (e.status === 429 || e.status >= 500)) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw e;
    }
};

// Helper to clean JSON string from Markdown blocks and surrounding text
export const cleanJsonString = (str: string): string => {
    if (!str) return '{}';
    
    // 1. Remove Markdown code blocks markers
    let cleaned = str.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // 2. Find the outer-most JSON structure (Array or Object)
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    // Determine if it's likely an array or an object based on which opener comes first
    // We only extract if we find a valid pair
    let startIndex = -1;
    let endIndex = -1;

    // Check if Array appears first and is valid
    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        if (lastBracket !== -1 && lastBracket > firstBracket) {
            startIndex = firstBracket;
            endIndex = lastBracket + 1;
        }
    } 
    // Check if Object appears first and is valid
    else if (firstBrace !== -1) {
        if (lastBrace !== -1 && lastBrace > firstBrace) {
            startIndex = firstBrace;
            endIndex = lastBrace + 1;
        }
    }

    if (startIndex !== -1 && endIndex !== -1) {
        return cleaned.substring(startIndex, endIndex);
    }

    // Fallback: just trim whitespace if no clear structure found (might fail parse, but better than nothing)
    return cleaned.trim();
};

export const safeJsonParse = (text: string, fallback: any = null): any => {
    const cleaned = cleanJsonString(text);
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // Attempt to fix unquoted keys: { key: "value" } -> { "key": "value" }
        // Regex looks for words followed by colon, not preceded by quote
        // CAUTION: Simple regex, might have false positives in string content if not careful
        const fixedQuotes = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');
        try {
            return JSON.parse(fixedQuotes);
        } catch (e2) {
             // Attempt to fix trailing commas: , } -> } and , ] -> ]
             const fixedCommas = fixedQuotes.replace(/,\s*([\]}])/g, '$1');
             try {
                 return JSON.parse(fixedCommas);
             } catch (e3) {
                 console.error("JSON Parse failed after fixes:", e);
                 if (fallback !== null) return fallback;
                 throw e; // Throw original error for visibility if no fallback
             }
        }
    }
};
