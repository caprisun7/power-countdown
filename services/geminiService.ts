import { GoogleGenAI, Type } from "@google/genai";
import { PuzzleData, Difficulty } from "../types";

// Initialize Gemini Client
const getAIClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY is missing");
        throw new Error("API Key missing");
    }
    return new GoogleGenAI({ apiKey });
};

const FIXED_NUMBERS = [2, 5, 16, 243, 343, 512];

const getDifficultyConfigs = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'EASY':
      return {
        // Easy targets are direct products or powers (e.g. 10, 32, 80, 25)
        desc: "Generate a target that can be reached using simple multiplication or direct exponentiation (e.g., 2*5=10, 16*5=80)."
      };
    case 'HARD':
      return {
        // Hard targets require roots/reciprocals (e.g. 243^(1/5) = 3)
        desc: "Generate a target that REQUIRES using reciprocals to create roots (e.g. 243^(1/5) = 3) or complex multi-step operations."
      };
    case 'MEDIUM':
    default:
      return {
        desc: "Generate a target that requires at least 2 or 3 steps, possibly mixing simple roots or larger multiplications."
      };
  }
};

export const generatePuzzle = async (difficulty: Difficulty = 'MEDIUM'): Promise<PuzzleData> => {
  const ai = getAIClient();
  const config = getDifficultyConfigs(difficulty);
  
  const prompt = `
    Generate a 'Power Countdown' math puzzle using a FIXED set of starting numbers: ${JSON.stringify(FIXED_NUMBERS)}.
    Difficulty Level: ${difficulty}
    
    Instructions:
    - ${config.desc}
    - The target MUST be an integer.
    - Verify that the target is mathematically reachable using ONLY the provided numbers.
    
    Allowed operations:
    1. Multiplication (a * b)
    2. Exponentiation (a ^ b)
    3. Reciprocal (1 / a) -> This allows for roots (e.g. a ^ (1/b)).
    
    Rules:
    - Each starting number can be used AT MOST once.
    - Not all numbers need to be used.
    - The 'numbers' in the response MUST be the fixed set: ${JSON.stringify(FIXED_NUMBERS)}.
    
    Return JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            target: { type: Type.NUMBER },
            numbers: { 
              type: Type.ARRAY, 
              items: { type: Type.NUMBER } 
            }
          },
          required: ["target", "numbers"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text) as PuzzleData;
    // Enforce fixed numbers just in case hallucination occurs
    data.numbers = FIXED_NUMBERS;
    return data;
  } catch (error) {
    console.error("Failed to generate puzzle:", error);
    // Fallback puzzle if API fails
    return {
      target: 80, // 16 * 5
      numbers: FIXED_NUMBERS
    };
  }
};

export const getHint = async (target: number, currentNumbers: number[]): Promise<string> => {
  const ai = getAIClient();
  
  const prompt = `
    I am playing Power Countdown with the fixed deck: ${JSON.stringify(FIXED_NUMBERS)}.
    Target: ${target}
    Current Numbers Available: ${JSON.stringify(currentNumbers)}
    
    Allowed operations: Multiply, Power (a^b), Reciprocal (1/x).
    
    Give me a clear, short hint on the next best step or a strategy to reach the target. 
    Do not give the full answer immediately if it requires multiple steps, just the first key insight (e.g. "Try finding the 5th root of 243").
    Keep it under 30 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Check if you can make roots using reciprocals.";
  } catch (error) {
    return "Remember that 243 is 3^5 and 343 is 7^3.";
  }
};
