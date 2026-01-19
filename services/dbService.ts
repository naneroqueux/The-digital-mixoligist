import { CocktailProfile } from "../types";

const DB_NAME = "DigitalMixologistDB";
const STORE_NAME = "favorites";
const DB_VERSION = 1;
const LOCALSTORAGE_KEY = "mixologist_favorites";

// Fallback para localStorage se IndexedDB falhar
let useLocalStorageFallback = false;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("IndexedDB error:", request.error);
        useLocalStorageFallback = true;
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log("IndexedDB opened successfully");
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "name" });
          console.log("IndexedDB store created");
        }
      };
    } catch (error) {
      console.error("IndexedDB not available:", error);
      useLocalStorageFallback = true;
      reject(error);
    }
  });
};

// Funções de fallback usando localStorage
const localStorageGetFavorites = (): CocktailProfile[] => {
  try {
    const data = localStorage.getItem(LOCALSTORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return [];
  }
};

const localStorageSetFavorites = (favorites: CocktailProfile[]): void => {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
};

export const saveFavorite = async (cocktail: CocktailProfile): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(cocktail);

      request.onsuccess = () => {
        console.log("Favorite saved:", cocktail.name);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.log("Using localStorage fallback for save");
    const favorites = localStorageGetFavorites();
    const index = favorites.findIndex(f => f.name === cocktail.name);
    if (index >= 0) {
      favorites[index] = cocktail;
    } else {
      favorites.push(cocktail);
    }
    localStorageSetFavorites(favorites);
  }
};

export const removeFavorite = async (name: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(name);

      request.onsuccess = () => {
        console.log("Favorite removed:", name);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.log("Using localStorage fallback for remove");
    const favorites = localStorageGetFavorites();
    const filtered = favorites.filter(f => f.name !== name);
    localStorageSetFavorites(filtered);
  }
};

export const getFavorites = async (): Promise<CocktailProfile[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log("Favorites loaded:", request.result.length);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.log("Using localStorage fallback for getFavorites");
    return localStorageGetFavorites();
  }
};

export const isFavorite = async (name: string): Promise<boolean> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(name);

      request.onsuccess = () => {
        const result = !!request.result;
        console.log("isFavorite check:", name, result);
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.log("Using localStorage fallback for isFavorite");
    const favorites = localStorageGetFavorites();
    return favorites.some(f => f.name === name);
  }
};

