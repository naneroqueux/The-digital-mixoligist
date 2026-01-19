import { generateCocktailImage } from './geminiService';

/**
 * Searches for a cocktail image in TheCocktailDB.
 * @param name The name of the cocktail
 * @returns The URL of the image or null if not found
 */
const searchTheCocktailDB = async (name: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(name)}`);
    const data = await response.json();

    if (data.drinks && data.drinks.length > 0) {
      // Return the image of the first result found
      return data.drinks[0].strDrinkThumb;
    }
    return null;
  } catch (error) {
    console.error("Error searching TheCocktailDB:", error);
    return null;
  }
};

/**
 * Orchestrates image search: First tries TheCocktailDB, then falls back to Gemini.
 */
export const getCocktailImage = async (
  name: string,
  glassware: string,
  garnish: string,
  color: string
): Promise<string | null> => {
  console.log(`[ImageService] Searching for image: ${name}`);

  // 1. Try search in TheCocktailDB
  const externalImage = await searchTheCocktailDB(name);
  if (externalImage) {
    console.log(`[ImageService] Found image in TheCocktailDB for: ${name}`);
    return externalImage;
  }

  // 2. Fallback to Gemini generation
  console.log(`[ImageService] Image not found in API, generating with Gemini for: ${name}`);
  return await generateCocktailImage(name, glassware, garnish, color);
};
