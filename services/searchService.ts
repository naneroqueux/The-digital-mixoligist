
import { COCKTAIL_DATABASE } from '../data/cocktails';
import { CocktailProfile } from '../types';
import { generateCocktailRecipe } from './geminiService';
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


// Helper to normalize drinks in batch
const fetchDrinkDetails = async (id: string) => {
    try {
        const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await response.json();
        return data.drinks ? data.drinks[0] : null;
    } catch {
        return null;
    }
};

/**
 * Intelligent search strategy:
 * 1. Local Database (Curated IBA)
 * 2. TheCocktailDB API (Community/Modern)
 * 3. Gemini AI (Original/Unique) - Only if no results found
 */
export const searchCocktail = async (
    query: string,
    onStatusUpdate?: (status: string) => void,
    searchMode: 'name' | 'ingredients' = 'name'
): Promise<CocktailProfile[]> => {
    const normalizedQuery = query.toLowerCase();
    const results: CocktailProfile[] = [];
    const seenNames = new Set<string>();

    const addResult = (profile: CocktailProfile) => {
        if (!seenNames.has(profile.name.toLowerCase())) {
            seenNames.add(profile.name.toLowerCase());
            results.push(profile);
        }
    };

    // Step 1: Local Search
    onStatusUpdate?.('Consultando o acervo local...');

    if (searchMode === 'ingredients') {
        const localMatches = COCKTAIL_DATABASE.filter(c =>
            c.ingredients.some(ing => ing.name.toLowerCase().includes(normalizedQuery))
        );
        localMatches.forEach(addResult);
    } else {
        const localMatches = COCKTAIL_DATABASE.filter(c =>
            c.name.toLowerCase().includes(normalizedQuery)
        );
        localMatches.forEach(addResult);
    }

    // Step 2: TheCocktailDB API
    onStatusUpdate?.('Buscando em bases de dados internacionais...');
    try {
        if (searchMode === 'ingredients') {
            const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.drinks && data.drinks.length > 0) {
                // Fetch details for up to 8 drinks to avoid rate limits/slow loading
                const topDrinks = data.drinks.slice(0, 8);
                onStatusUpdate?.(`Carregando detalhes de ${topDrinks.length} drinks encontrados...`);

                const detailPromises = topDrinks.map((d: any) => fetchDrinkDetails(d.idDrink));
                const details = await Promise.all(detailPromises);

                details.forEach(rawDrink => {
                    if (rawDrink) addResult(normalizeExternalDrink(rawDrink));
                });
            }
        } else {
            const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (data.drinks && data.drinks.length > 0) {
                data.drinks.forEach((d: any) => addResult(normalizeExternalDrink(d)));
            }
        }
    } catch (error) {
        console.error("API Search error:", error);
    }

    // Step 3: Gemini AI Generation (Fallback if absolutely nothing found)
    if (results.length === 0) {
        onStatusUpdate?.('Invocando o mestre mixologista digital...');
        try {
            const aiRecipe = await generateCocktailRecipe(query, searchMode);
            if (aiRecipe) {
                const imageUrl = await getCocktailImage(
                    aiRecipe.name,
                    aiRecipe.glassware,
                    aiRecipe.garnish,
                    aiRecipe.color
                );
                addResult({ ...aiRecipe, imageUrl });
            }
        } catch (error) {
            console.error("AI Generation error:", error);
        }
    }

    return results;
};
