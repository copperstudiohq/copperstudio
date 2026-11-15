export const OCTO_VOICE_SETTINGS: Readonly<{ pitch: number; rate: number; volume: number }>;
export function selectOctoVoice<T extends { lang: string; localService: boolean }>(voices: readonly T[]): T | null;
