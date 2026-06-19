/**
 * aiGenerator.ts - Re-exports from the decoupled character generation pipeline.
 * 
 * Kept for backward compatibility. All logic now lives in:
 * - src/generators/ICharacterGenerator.ts (interface)
 * - src/generators/PuterAIGenerator.ts (AI generation)
 * - src/generators/FallbackGenerator.ts (procedural fallback)
 * - src/services/CharacterOrchestrator.ts (orchestration + validation)
 * - src/characterValidator.ts (rule validation)
 * - src/promptBuilder.ts (prompt construction)
 */

export { getOrchestrator, CharacterOrchestrator } from './services/CharacterOrchestrator';
export type { GenerationResult, ValidationError } from './services/CharacterOrchestrator';
export { validateCharacter } from './characterValidator';
export { PromptBuilder } from './promptBuilder';
export { FallbackGenerator } from './generators/FallbackGenerator';
export { PuterAIGenerator } from './generators/PuterAIGenerator';
export type { ICharacterGenerator } from './generators/ICharacterGenerator';