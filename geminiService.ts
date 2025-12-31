import { GoogleGenAI, Type } from "@google/genai";
import { FX_RATES, NIPL_COUNTRIES } from "./constants";

/**
 * Executes high-speed OCR using gemini-3-flash-preview.
 */
export const parseReceipt = async (base64Image: string) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("GATEWAY_KEY_MISSING: Orchestration node requires an active API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: "Analyze this receipt. Return a JSON object with merchantName (string), country (string), currency (ISO code), subtotal (number), tax (number), and total (number). Return ONLY the JSON object." }
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

    const rawText = response.text || '';
    if (!rawText) {
      throw new Error("NODE_EMPTY_RESPONSE: Orchestrator returned null payload.");
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      // Fallback: extract JSON if wrapped in markdown
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        data = JSON.parse(match[0]);
      } else {
        throw new Error("JSON_PARSE_FAILED: Malformed response from vision engine.");
      }
    }
    
    const subtotal = Number(data.subtotal) || 0;
    const tax = Number(data.tax) || 0;
    const total = Number(data.total) || (subtotal + tax);

    if (!total || total <= 0) {
      throw new Error("INVALID_AMOUNT: Scanner failed to detect a valid payable sum.");
    }

    const currencyCode = (data.currency || 'USD').toUpperCase().trim();
    const fx = FX_RATES[currencyCode] || FX_RATES['USD'];
    
    const isNIPL = NIPL_COUNTRIES.some(c => 
      data.country?.toLowerCase()?.includes(c.toLowerCase()) || 
      data.merchantName?.toLowerCase()?.includes(c.toLowerCase())
    );

    return {
      merchantName: data.merchantName || 'External Node',
      country: data.country || 'Global Site',
      originalCurrency: fx.code,
      originalAmount: total,
      subtotal: subtotal || total,
      tax: tax,
      inrAmount: total * fx.rate,
      isNIPL
    };
  } catch (err: any) {
    console.error("AI_ORCHESTRATION_EXCEPTION:", err);
    throw err;
  }
};
