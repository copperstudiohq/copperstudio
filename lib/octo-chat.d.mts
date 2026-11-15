export type OctoGame = '' | 'croba' | 'island' | 'cards' | 'arena';

export interface OctoMemory {
  turn: number;
  name: string;
  lastTopic: string;
  lastQuestion: string;
  lastAnswer: string;
  lastGame: OctoGame;
  pendingQuestion: string;
  lastFact: string;
  shownFacts: string[];
  lastOptions: Exclude<OctoGame, ''>[];
  likes: string[];
  dislikes: string[];
}

export interface OctoReply {
  reply: string;
  command: null;
  links: Array<{ label: string; href: string }>;
}

export const OCTO_GREETING: string;
export const OCTO_PROMPTS: readonly string[];
export function createOctoChat(): OctoMemory;
export function replyAsOcto(memory: OctoMemory, input: unknown): OctoReply | null;
