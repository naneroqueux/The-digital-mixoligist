
import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
// dangerouslyAllowBrowser is required for client-side usage. 
// Ideally backend functions should handle this to protect the key, 
// but sticking to the current client-side architecture.
const openai = apiKey ? new OpenAI({ apiKey, dangerouslyAllowBrowser: true }) : null;

/**
 * Generate a professional cocktail image using DALL-E 3.
 */
export const generateCocktailImage = async (
    name: string,
    glassware: string,
    garnish: string,
    color: string
): Promise<string | null> => {
    if (!openai) {
        console.error("OpenAI API key not configured.");
        return null;
    }
    try {
        const prompt = `Professional high-end studio photography of a ${name} cocktail. Served in a ${glassware}. Liquid color: ${color}. Garnish: ${garnish}. Luxury bar setting, bokeh background, dramatic lighting, 8k resolution, minimalist aesthetic, photorealistic.`;

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            response_format: "b64_json",
        });

        if (response.data && response.data.length > 0 && response.data[0].b64_json) {
            return `data:image/png;base64,${response.data[0].b64_json}`;
        }
        return null;
    } catch (error) {
        console.error("Erro ao gerar imagem alquímica (OpenAI):", error);
        return null;
    }
};

/**
 * Generate a complete cocktail recipe using GPT-4o.
 */
export const generateCocktailRecipe = async (name: string): Promise<any | null> => {
    if (!openai) {
        console.error("OpenAI API key not configured.");
        return null;
    }
    try {
        const prompt = `Você é um mixologista mestre da IBA. Crie uma ficha técnica detalhada e precisa para o coquetel "${name}".
    Se o coquetel não existir ou for inviável, retorne um JSON indicando erro ou invente uma variação plausível se for um pedido criativo.
    Responda APENAS com um objeto JSON válido seguindo exatamente esta estrutura:
    {
      "name": "${name}",
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
      "categories": ["string"],
      "tags": ["string"]
    }
    IMPORTANTE: Todos os campos devem ser em Português (Brasil). 'categories' deve incluir itens como 'Clássicos', 'Autorais', 'Refrescantes', etc.`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (content) {
            return JSON.parse(content);
        }
        return null;
    } catch (error) {
        console.error("Erro ao gerar receita alquímica (OpenAI):", error);
        return null;
    }
};
