
import { GoogleGenAI, Type } from "@google/genai";
import { FX_RATES, NIPL_COUNTRIES } from "./constants";

/**
 * Executes OCR on the provided receipt image using Gemini 3.
 * Gemini 3 models support native JSON mode via responseMimeType.
 */
export const parseReceipt = async (base64Image: string) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: The system core is not initialized. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Use gemini-3-flash-preview for robust OCR and native JSON support
  const model = 'gemini-3-flash-preview';

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: "Extract receipt data. Return a JSON object with merchantName, country, currency (ISO code), subtotal (number), tax (number), and total (number). If values are missing, provide your best estimate." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          merchantName: { type: Type.STRING },
          country: { type: Type.STRING },
          currency: { type: Type.STRING },
          subtotal: { type: Type.NUMBER },
          tax: { type: Type.NUMBER },
          total: { type: Type.NUMBER }
        },
        required: ["merchantName", "total"]
      }
    }
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error("EMPTY_RESPONSE: The scanning engine returned no data.");
  }

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    console.error("JSON Parse Error. Raw text:", rawText);
    throw new Error("PARSING_FAILED: The data returned from the scanner was malformed.");
  }
  
  // Normalize and calculate
  const finalTotal = Number(data.total) || (Number(data.subtotal) || 0) + (Number(data.tax) || 0);
  const currencyCode = (data.currency || 'USD').toUpperCase();
  const fx = FX_RATES[currencyCode] || FX_RATES['USD'];
  
  const isNIPL = NIPL_COUNTRIES.some(c => 
    data.country?.toLowerCase()?.includes(c.toLowerCase()) || 
    data.merchantName?.toLowerCase()?.includes(c.toLowerCase())
  );

  return {
    merchantName: data.merchantName || 'Elite Merchant',
    country: data.country || 'International Node',
    originalCurrency: fx.code,
    originalAmount: finalTotal,
    subtotal: Number(data.subtotal) || finalTotal,
    tax: Number(data.tax) || 0,
    inrAmount: finalTotal * fx.rate,
    isNIPL
  };
};
