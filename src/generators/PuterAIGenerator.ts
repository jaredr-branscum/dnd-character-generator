import { Character } from '../types';
import { ICharacterGenerator } from './ICharacterGenerator';
import { PromptBuilder } from '../promptBuilder';

/**
 * PuterAIGenerator - Uses Puter.js AI to generate characters
 * via the window.puter.ai.chat() API.
 * 
 * Depends only on: Character type, PromptBuilder, and window.puter
 */
export class PuterAIGenerator implements ICharacterGenerator {
  readonly name = 'Puter.js AI (GPT-4o-mini)';

  async generate(prompt: string): Promise<Character> {
    const systemPrompt = this.buildSystemPrompt();
    const fullPrompt = `${systemPrompt}\n\n---\nUSER CONCEPT: "${prompt}"\n\n---\nGenerate the complete D&D 5e level 1 character JSON for this concept. All stats, spells, features, equipment must be valid per 5e rules. Return ONLY the JSON object, no other text.`;

    const response = await window.puter!.ai.chat(fullPrompt, {
      model: 'gpt-4o-mini',
      stream: false,
    });

    const content = response?.message?.content || '';

    // Try to extract JSON from code fences, or use raw content
    let jsonStr = content;
    const jsonMatch = content.match(/\`\`\`(?:json)?\s*(\{[\s\S]*?\})\s*\`\`\`/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr);

    return {
      ...parsed,
      hitDice: parsed.hitDice || { dieCount: 1, dieSize: 8, used: 0 },
    };
  }

  private buildSystemPrompt(): string {
    return new PromptBuilder()
      .addRole()
      .addSchema()
      .addAbilityRules()
      .addSubraceRules()
      .addCombatRules()
      .addClassRules()
      .addSpellcastingRules()
      .addProficiencyRules()
      .addCreativityRules()
      .build();
  }
}