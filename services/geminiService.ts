
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { FaceAnalysis, Gender, FaceShapeResult } from "../types";

// Helper to clean base64 string if it has a data URI prefix
const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

/**
 * Analyzes the user's face shape and suggest hairstyles using Gemini 2.5 Flash.
 */
export const analyzeFaceAndSuggestStyles = async (base64Image: string, gender: Gender): Promise<FaceAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Dynamic styling prompt based on gender - STRICT instructions
  const featurePrompt = gender === 'male'
    ? "MANDATORY: You must provide specific beard or facial hair styling advice that specifically complements this hairstyle and face shape."
    : "MANDATORY: You must provide specific eyebrow shaping or eyelash styling advice that specifically complements this hairstyle and face shape.";

  const featureDescription = gender === 'male'
    ? "Specific recommendation for beard or facial hair style (e.g., 'Heavy Stubble', 'Goatee', 'Clean Shaven') to match the haircut."
    : "Specific recommendation for eyebrow shape or lash style (e.g., 'Soft Arched Brows', 'Wispy Lashes') to match the haircut.";

  // Schema for structured output
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      faceShape: { type: Type.STRING, description: "The identified shape of the face (e.g., Oval, Square, Round)." },
      suggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the hairstyle." },
            description: { type: Type.STRING, description: "Short visual description of the style." },
            reason: { type: Type.STRING, description: "Why this fits the face shape." },
            stylingAdvice: { type: Type.STRING, description: featureDescription },
          },
          required: ["name", "description", "reason", "stylingAdvice"],
        },
      },
    },
    required: ["faceShape", "suggestions"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64(base64Image),
            },
          },
          {
            text: `Analyze the face shape of the person in this image. The user identifies as ${gender}. Suggest 5 diverse and trendy hairstyles that would suit this face shape perfectly. ${featurePrompt} Provide the output in JSON format.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a professional hair stylist and makeover expert. Your suggestions should be modern, stylish, and tailored to the user's gender and face shape.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    return JSON.parse(text) as FaceAnalysis;
  } catch (error) {
    console.error("Error analyzing face:", error);
    throw error;
  }
};

/**
 * Free Tool: Detects only the face shape without styling advice.
 */
export const detectFaceShape = async (base64Image: string, gender: Gender, age?: string): Promise<FaceShapeResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      shape: { type: Type.STRING, description: "The geometric face shape (e.g., Diamond, Heart, Oblong)." },
      confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 100." },
      description: { type: Type.STRING, description: "A scientific description of the facial geometry." },
      keyFeatures: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 key facial landmarks identified (e.g. 'Prominent cheekbones', 'Angular jaw')."
      }
    },
    required: ["shape", "confidence", "description", "keyFeatures"],
  };

  const ageText = age ? `${age} year old ` : '';

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64(base64Image),
            },
          },
          {
            text: `Analyze the geometric face shape of this ${ageText}${gender}. Be precise and scientific. Focus only on structure.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a facial geometry expert. Analyze the uploaded face strictly for face shape classification. Do not provide styling advice.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");

    const result = JSON.parse(text) as FaceShapeResult;

    // Extract usage metadata
    if (response.usageMetadata) {
      result.usageMetadata = {
        promptTokenCount: response.usageMetadata.promptTokenCount,
        candidatesTokenCount: response.usageMetadata.candidatesTokenCount,
        totalTokenCount: response.usageMetadata.totalTokenCount,
      };
    }

    return result;
  } catch (error) {
    console.error("Error detecting face shape:", error);
    throw error;
  }
};

/**
 * Edits the image to apply a new hairstyle using Gemini 2.5 Flash Image.
 */
export const generateHairstyleImage = async (base64Image: string, stylePrompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const finalPrompt = `Keep the person's face exactly the same. Change the hairstyle to ${stylePrompt}. High quality, photorealistic, cinematic lighting.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming input is converted/verified as jpeg for simplicity, or pass dynamic mime
              data: cleanBase64(base64Image),
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    // Check for safety violations
    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("SAFETY_VIOLATION");
    }

    const parts = candidate?.content?.parts;
    if (parts && parts.length > 0) {
      // Check for inline data in response
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated.");

  } catch (error) {
    console.error("Error generating hairstyle:", error);
    throw error;
  }
};

/**
 * Generates a preview image of the hairstyle on a generic model using Gemini 2.5 Flash Image (Text-to-Image).
 */
export const generateHairstylePreview = async (styleName: string, description: string, gender: Gender): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Professional studio portrait of a ${gender} model with ${styleName} hairstyle. ${description}. Neutral lighting, 8k resolution, photorealistic.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts && parts.length > 0) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating preview:", error);
    return null;
  }
};
