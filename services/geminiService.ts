
import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null as any;

/**
 * Gera uma imagem profissional do coquetel usando Gemini 2.5 Flash Image.
 * O prompt é construído dinamicamente com base nos dados técnicos do drink.
 */
export const generateCocktailImage = async (
  name: string,
  glassware: string,
  garnish: string,
  color: string
): Promise<string | null> => {
  try {
    const prompt = `Professional high-end studio photography of a ${name} cocktail. Served in a ${glassware}. Liquid color: ${color}. Garnish: ${garnish}. Luxury bar setting, bokeh background, dramatic lighting, 8k resolution, minimalist aesthetic.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Erro ao gerar imagem alquímica:", error);
    return null;
  }
};

/**
 * Gera uma receita completa de coquetel usando Gemini 1.5 Flash.
 */
export const generateCocktailRecipe = async (query: string, searchMode: 'name' | 'ingredients' = 'name'): Promise<any | null> => {
  try {
    const prompt = searchMode === 'name'
      ? `Você é um mixologista mestre da IBA. Crie uma ficha técnica detalhada e precisa para o coquetel "${query}".`
      : `Você é um mixologista mestre da IBA. Crie uma ficha técnica detalhada e precisa para um coquetel clássico ou moderno de alta qualidade que utilize "${query}" como ingrediente principal.`;

    const instructions = `
    Responda APENAS com um objeto JSON válido seguindo exatamente esta estrutura:
    {
      "name": "Nome do Coquetel",
      "ibaClassification": "string",
      "preparationType": "Stirred | Shaken | Built | Muddled",
      "glassware": "string",
      "strainingTechnique": "Coagem Simples | Coagem Dupla | Coagem Fina | Nenhum",
      "garnish": "string",
      "ingredients": [{"name": "string", "amount": "string"}],
      "method": "instruções curtas em português",
      "history": "breve contexto histórico em português",
      "curiosity": "uma curiosidade interessante em português",
      "color": "HEX color string",
      "difficulty": "Fácil | Médio | Avançado",
      "abv": "string (ex: 18%)",
      "pairing": "sugestão de harmonização em português",
      "categories": ["string"]
    }
    IMPORTANTE: Todos os campos devem ser em Português (Brasil). No campo 'strainingTechnique', especifique claramente se é 'Coagem Simples' ou 'Coagem Dupla' baseando-se no método clássico.`;

    const fullPrompt = `${prompt}\n${instructions}`;

    const result = (await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: { parts: [{ text: fullPrompt }] }
    })) as any;

    // Safer access to response text
    const responseText = result.response?.text?.() || result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);


    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return data;
    }
    return null;
  } catch (error) {
    console.error("Erro ao gerar receita alquímica:", error);
    return null;
  }
};

