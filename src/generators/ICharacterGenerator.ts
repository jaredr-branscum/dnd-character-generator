import { Character } from '../types';

/**
 * Interface for character generation strategies.
 * Any class implementing this can be swapped in as a generation strategy.
 */
export interface ICharacterGenerator {
  readonly name: string;
  generate(prompt: string): Promise<Character>;
}