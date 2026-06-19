import { Character } from '../types';
import { ICharacterGenerator } from '../generators/ICharacterGenerator';
import { PuterAIGenerator } from '../generators/PuterAIGenerator';
import { FallbackGenerator } from '../generators/FallbackGenerator';
import { validateCharacter, ValidationError } from '../characterValidator';
import { sanitizeCharacter, validateContentSafety } from '../utils/security';

export type { ValidationError } from '../characterValidator';

export interface GenerationResult {
  character: Character;
  validation: {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    correctionsApplied: number;
  };
  generatorUsed: string;
}

/**
 * CharacterOrchestrator - Coordinates the character generation pipeline.
 */
export class CharacterOrchestrator {
  private generators: ICharacterGenerator[] = [];

  constructor() {
    // Register generators in priority order
    if (this.isPuterAvailable()) {
      this.generators.push(new PuterAIGenerator());
    }
    this.generators.push(new FallbackGenerator());
  }

  /**
   * Register additional generators at runtime
   */
  addGenerator(generator: ICharacterGenerator): void {
    this.generators.push(generator);
  }

  /**
   * Get the list of registered generators
   */
  getAvailableGenerators(): string[] {
    return this.generators.map(g => g.name);
  }

  /**
   * Generate a character by trying each generator in order until one succeeds.
   * Then validate and auto-correct the result.
   */
  async generateCharacter(userPrompt: string): Promise<GenerationResult> {
    let character: Character | null = null;
    let generatorUsed = 'none';

    for (const generator of this.generators) {
      try {
        character = await generator.generate(userPrompt);
        generatorUsed = generator.name;
        console.log(`[Orchestrator] Generator "${generator.name}" succeeded`);
        break;
      } catch (err) {
        console.warn(`[Orchestrator] Generator "${generator.name}" failed:`, err);
      }
    }

    if (!character) {
      throw new Error('All character generators failed. Unable to create a character.');
    }

    const validationResult = validateCharacter(character);
    
    // Sanitize the final character to prevent XSS in output
    const sanitizedCharacter = sanitizeCharacter(validationResult.corrected);

    return {
      character: sanitizedCharacter,
      validation: {
        valid: validationResult.valid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        correctionsApplied: validationResult.errors.length,
      },
      generatorUsed,
    };
  }

  private isPuterAvailable(): boolean {
    return typeof window !== 'undefined' && 
           window.puter !== undefined && 
           window.puter.ai !== undefined;
  }
}

// Singleton instance for the app
let orchestratorInstance: CharacterOrchestrator | null = null;

export function getOrchestrator(): CharacterOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new CharacterOrchestrator();
  }
  return orchestratorInstance;
}