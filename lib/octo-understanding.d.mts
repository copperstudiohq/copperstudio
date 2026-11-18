export type GameId = 'croba' | 'island' | 'cards' | 'arena' | 'sandbox';
export interface Knowledge { id: string; game: string; question: string; keywords: readonly string[]; answer: string }
/** Normalizes routing text; preserve the original input when extracting names. */
export function normalizeQuestion(input: string): string;
/** Game mentions in catalogue order, without treating standalone Tri lore as Tri Arena. */
export function findMentionedGames(normalized: string): GameId[];
/** Requires at least 3 evidence points before coverage. Tied matches remain available for clarification. */
export function rankKnowledge<T extends Knowledge>(question: string, entries: readonly T[], game?: string): Array<{ entry: T; score: number }>;
