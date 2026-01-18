
export interface Ingredient {
  name: string;
  amount: string;
}

export interface CocktailProfile {
  name: string;
  ibaClassification: string;
  preparationType: string;
  glassware: string;
  strainingTechnique: string;
  garnish: string;
  ingredients: Ingredient[];
  method: string;
  history: string;
  curiosity: string;
  color: string;
  imageUrl?: string;
  // Novos campos técnicos
  difficulty: 'Fácil' | 'Médio' | 'Avançado';
  abv: string; // Ex: "15-18%"
  pairing: string; // Sugestão de harmonização
  categories: string[]; // Ex: ["Clássicos", "Refreshing"]
  tags: string[]; // Ex: ["Intenso", "Aperitivo"]
}


export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  NOT_FOUND = 'NOT_FOUND'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
