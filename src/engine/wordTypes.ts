export type WordTier = 'easy' | 'medium' | 'hard'
export type WordEntry = { word: string; syllables: number; letters: number; tier: WordTier; category: string }
export const WORD_CATEGORIES = ['animals', 'food', 'objects', 'places', 'actions', 'school', 'sports', 'nature', 'people'] as const
