
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// IMPORTANT: In a real frontend app, API keys should NOT be directly exposed.
// A backend proxy is the standard secure way to handle this.
// The prompt specifies using process.env.API_KEY, assuming it's made available.
let ai: GoogleGenAI | null = null;
// Fix: Use a flag to track API key status instead of accessing private property
let isApiKeyMissing = false;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    const apiKeyFromEnv = process.env.API_KEY;
    if (!apiKeyFromEnv) {
      console.warn("API_KEY environment variable is not set for Gemini. AI features will be disabled or return errors.");
      // Initialize with a dummy key to satisfy type constructor, but functionality will be blocked.
      ai = new GoogleGenAI({ apiKey: "MISSING_API_KEY_CHECK_ENV" });
      isApiKeyMissing = true;
    } else {
      ai = new GoogleGenAI({ apiKey: apiKeyFromEnv });
      isApiKeyMissing = false;
    }
  }
  return ai;
};

export const analyzeImageWithGemini = async (base64Image: string, userPrompt: string): Promise<string> => {
  const genAI = getAI(); // Ensures ai is initialized and isApiKeyMissing is set
  // Fix: Check the flag instead of private property
  if (isApiKeyMissing) {
    return "Error: Gemini API Key is not configured. Please set the API_KEY environment variable.";
  }

  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg', // Or detect from base64 string if possible
        data: base64Image,
      },
    };
    const textPart = { text: userPrompt };

    const response: GenerateContentResponse = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17', // This model supports multimodal input
      contents: { parts: [imagePart, textPart] },
      // config: { thinkingConfig: { thinkingBudget: 0 } } // Optional: disable thinking for faster, potentially less nuanced responses
    });
    
    return response.text;
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("API key not valid")) {
        return "Error: Invalid Gemini API Key. Please check your API_KEY environment variable.";
    }
    return `Error analyzing image with Gemini: ${errorMessage}`;
  }
};

export const generateChartFromTextWithGemini = async (patternText: string): Promise<string> => {
  const genAI = getAI(); // Ensures ai is initialized and isApiKeyMissing is set
  // Fix: Check the flag instead of private property
  if (isApiKeyMissing) {
    return "Error: Gemini API Key is not configured. Please set the API_KEY environment variable.";
  }

  try {
    const prompt = `
You are a knitting pattern analysis assistant. Convert the following knitting pattern text into a structured, simplified chart representation.
The chart should be an array of arrays, where each inner array represents a row, and each element in the inner array is a stitch abbreviation string.
Focus on common stitches like K (Knit), P (Purl), YO (Yarn Over), k2tog (Knit 2 together), ssk (Slip Slip Knit).
If repeats are present, expand them for a small number of repeats (e.g., 2) or represent them conceptually.
Example Input:
"Row 1: K2, P2, *K1, P1* rep from * to * 2 times.
Row 2: P all sts."
Example Output (conceptual, actual may vary):
"[[\"K\", \"K\", \"P\", \"P\", \"K\", \"P\", \"K\", \"P\"], [\"P\", \"P\", \"P\", \"P\", \"P\", \"P\", \"P\", \"P\"]]"

Pattern to analyze:
${patternText}

Output the JSON string representation of the chart directly.
`;

    const response: GenerateContentResponse = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
      config: { 
        responseMimeType: "application/json", // Request JSON output
        // thinkingConfig: { thinkingBudget: 0 } // Optional
      },
    });

    // The response.text should be a JSON string, possibly wrapped in markdown.
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    // Validate if it's a JSON string (basic check)
    // JSON.parse will throw if it's not valid.
    JSON.parse(jsonStr); // This is for validation. The actual parsing for use will be in the component.
    return jsonStr;

  } catch (error) {
    console.error("Error generating chart from text with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
     if (errorMessage.includes("API key not valid")) {
        return "Error: Invalid Gemini API Key. Please check your API_KEY environment variable.";
    }
    return `Error generating chart from text with Gemini: ${errorMessage}`;
  }
};

// Placeholder for actual image generation from text using Imagen
export const generateImageWithImagen = async (prompt: string): Promise<string | null> => {
    const genAI = getAI(); // Ensures ai is initialized and isApiKeyMissing is set
    // Fix: Check the flag instead of private property
    if (isApiKeyMissing) {
        console.warn("API Key not configured. Image generation unavailable.");
        return null;
    }
    try {
        const response = await genAI.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        return null;
    } catch (error) {
        console.error("Error generating image with Imagen:", error);
        return null;
    }
};