
import { COCKTAIL_DATABASE } from '../data/cocktails';
import { CocktailProfile } from '../types';
import { generateCocktailRecipe } from './openaiService';
import { getCocktailImage } from './imageService';

/**
 * Normalizes a drink from TheCocktailDB to our CocktailProfile type.
 */
const normalizeExternalDrink = (drink: any): CocktailProfile => {
    const ingredients: { name: string; amount: string }[] = [];

    for (let i = 1; i <= 15; i++) {
        const name = drink[`strIngredient${i}`];
        const amount = drink[`strMeasure${i}`] || '';
        if (name) {
            ingredients.push({ name, amount: amount.trim() });
        }
    }

    return {
        name: drink.strDrink,
        ibaClassification: drink.strCategory || 'Coleção da API',
        preparationType: drink.strVideo ? 'Tutorial em Vídeo disponível' : 'Padrão',
        glassware: drink.strGlass,
        strainingTechnique: 'N/A',
        garnish: 'Conforme o método',
        ingredients,
        method: drink.strInstructionsIT || drink.strInstructions || '',
        history: 'Fonte: TheCocktailDB',
        curiosity: drink.strIBA || 'Escolha moderna popular',
        color: '#D0BCFF', // Default light purple
        imageUrl: drink.strDrinkThumb,
        difficulty: 'Médio',
        abv: 'Varia',
        pairing: 'Consulte um sommelier',
        categories: [drink.strCategory || 'API Collection'],
        tags: []
    };
};


/**
 * Intelligent search strategy:
 * 1. Local Database (Curated IBA)
 * 2. TheCocktailDB API (Community/Modern)
 * 3. OpenAI (Original/Unique)
 */
export const searchCocktail = async (
    query: string,
    onStatusUpdate?: (status: string) => void
): Promise<CocktailProfile | null> => {
    const normalizedQuery = query.toLowerCase();

    // Step 1: Local Search
    onStatusUpdate?.('Consultando o acervo local...');
    const localMatch = COCKTAIL_DATABASE.find(c =>
        c.name.toLowerCase().includes(normalizedQuery)
    );
    if (localMatch) return localMatch;

    // Step 2: TheCocktailDB API
    onStatusUpdate?.('Buscando em bases de dados internacionais...');
    try {
        const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data.drinks && data.drinks.length > 0) {
            return normalizeExternalDrink(data.drinks[0]);
        }
    } catch (error) {
        console.error("API Search error:", error);
    }

    // Step 3: Gemini AI Generation
    onStatusUpdate?.('Invocando o mestre mixologista digital...');
    try {
        const aiRecipe = await generateCocktailRecipe(query);
        if (aiRecipe) {
            // Get an image for the AI recipe too
            const imageUrl = await getCocktailImage(
                aiRecipe.name,
                aiRecipe.glassware,
                aiRecipe.garnish,
                aiRecipe.color
            );
            return { ...aiRecipe, imageUrl };
        }
    } catch (error) {
        console.error("AI Generation error:", error);
    }

    return null;
};
