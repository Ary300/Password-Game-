export type WordTier = 'easy' | 'medium' | 'hard'
export type WordEntry = { word: string; syllables: number; letters: number; tier: WordTier; category: string }
// "general" holds every word from the big frequency list that the curated
// source.txt does not place in a themed category.
export const WORD_CATEGORIES = ['animals', 'food', 'objects', 'places', 'actions', 'school', 'sports', 'nature', 'people', 'general'] as const
