import { Character, AbilityScores } from '../types';
import { calculateModifier } from '../abilityUtils';
import { ICharacterGenerator } from './ICharacterGenerator';

/**
 * FallbackGenerator - Procedurally generates a default level 1 Fighter.
 * Used when AI generation is unavailable or fails.
 * No external dependencies beyond the Character type system.
 */
export class FallbackGenerator implements ICharacterGenerator {
  readonly name = 'Fallback (Procedural)';

  async generate(_prompt: string): Promise<Character> {
    return this.createDefaultFighter();
  }

  private createDefaultFighter(): Character {
    const abilityScores: AbilityScores = {
      strength: 16,  // 15 + 1 human
      dexterity: 14, // 13 + 1 human
      constitution: 15, // 14 + 1 human
      intelligence: 11, // 10 + 1 human
      wisdom: 13,       // 12 + 1 human
      charisma: 9,      // 8 + 1 human
    };

    const conMod = calculateModifier(abilityScores.constitution);
    const dexMod = calculateModifier(abilityScores.dexterity);
    const hp = 10 + conMod;

    return {
      name: 'Adventurer',
      race: 'Human',
      subrace: null,
      class: 'Fighter',
      subclass: null,
      level: 1,
      background: 'Soldier',
      alignment: 'Lawful Good',
      experiencePoints: 0,
      playerName: 'Player',
      abilityScores,
      armorClass: 18, // chain mail (16) + shield (2)
      initiative: dexMod,
      speed: 30,
      hitPointMaximum: hp,
      hitPointCurrent: hp,
      hitPointTemp: 0,
      hitDice: { dieCount: 1, dieSize: 10, used: 0 },
      proficiencyBonus: 2,
      skills: [
        { name: 'Athletics', ability: 'strength', proficient: true, expertise: false },
        { name: 'Perception', ability: 'wisdom', proficient: true, expertise: false },
        { name: 'Intimidation', ability: 'charisma', proficient: true, expertise: false },
      ],
      savingThrows: [
        { ability: 'strength', proficient: true },
        { ability: 'dexterity', proficient: false },
        { ability: 'constitution', proficient: true },
        { ability: 'intelligence', proficient: false },
        { ability: 'wisdom', proficient: false },
        { ability: 'charisma', proficient: false },
      ],
      languages: ['Common', 'Dwarvish'],
      otherProficiencies: ['All armor', 'Shields', 'Simple weapons', 'Martial weapons', 'Playing cards'],
      equipment: [
        { name: 'Chain Mail', quantity: 1 },
        { name: 'Longsword', quantity: 1 },
        { name: 'Shield', quantity: 1 },
        { name: "Explorer's Pack", quantity: 1 },
        { name: 'Dagger', quantity: 2 },
      ],
      copper: 0, silver: 0, electrum: 0, gold: 15, platinum: 0,
      spellcastingAbility: null,
      spellSaveDC: 10,
      spellAttackBonus: 2,
      spellSlots: [],
      cantrips: [],
      spells: [],
      features: [
        { name: 'Fighting Style', description: 'Choose a fighting style', source: 'Fighter', level: 1 },
        { name: 'Second Wind', description: 'You have a limited well of stamina you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level.', source: 'Fighter', level: 1 },
      ],
      racialTraits: [
        { name: 'Human Traits', description: 'Humans gain +1 to all ability scores and an extra skill proficiency.', source: 'Human', level: 1 },
      ],
      classFeatures: [
        { name: 'Fighting Style', description: 'Choose a fighting style', source: 'Fighter', level: 1 },
        { name: 'Second Wind', description: 'You have a limited well of stamina to protect yourself from harm.', source: 'Fighter', level: 1 },
      ],
      inspiration: false,
      attacks: [
        { name: 'Longsword', attackBonus: 5, damage: '1d8+3', damageType: 'Slashing', properties: 'Versatile (1d10)' },
        { name: 'Shield Bash', attackBonus: 3, damage: '1d4+1', damageType: 'Bludgeoning' },
      ],
      personalityTraits: 'I face problems head-on. A simple, direct solution is the best path to victory.',
      ideals: 'Duty. It is my duty to protect those who cannot protect themselves.',
      bonds: 'I fight for those who cannot fight for themselves.',
      flaws: 'I have little respect for anyone who is not a proven warrior.',
      age: '24',
      height: "5'10\"",
      weight: '175 lbs',
      eyes: 'Brown',
      skin: 'Fair',
      hair: 'Brown',
      appearance: 'A sturdy human with a strong build, cropped brown hair, and a determined expression.',
      backstory: 'A career soldier who served in the city watch for years before setting out to find greater challenges. Practical, disciplined, and always ready for a fight.',
      alliesAndOrganizations: '',
      characterNotes: '',
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
    };
  }
}