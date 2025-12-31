
import { GoogleGenAI, Type } from "@google/genai";
import { FX_RATES, NIPL_COUNTRIES } from "./constants";

export const parseReceipt = async (base64Image: string) => {
  // Fresh instance for every call ensures reliability and latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: "OCR this receipt and return JSON: {merchantName, country, currency (ISO), subtotal, tax, total}. Be concise." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      // Disable thinking to significantly reduce latency for extraction tasks
      thinkingConfig: { thinkingBudget: 0 },
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
        required: ["merchantName", "country", "currency", "total"]
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  
  const calculatedTotal = (data?.subtotal || 0) + (data?.tax || 0);
  const finalTotal = calculatedTotal > 0 && Math.abs(calculatedTotal - data?.total) > 0.01 ? calculatedTotal : (data?.total || 0);
  
  const fx = FX_RATES[data?.currency || 'USD'] || FX_RATES['USD'];
  const isNIPL = NIPL_COUNTRIES.some(c => data?.country?.toLowerCase()?.includes(c.toLowerCase()));

  return {
    merchantName: data?.merchantName || 'Unknown Merchant',
    country: data?.country || 'Unknown Locale',
    originalCurrency: fx.code,
    originalAmount: finalTotal,
    subtotal: data?.subtotal || finalTotal,
    tax: data?.tax || 0,
    inrAmount: finalTotal * fx.rate,
    isNIPL
  };
};
