import { AbilityScores } from './types';

export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getModifierString(score: number): string {
  const mod = calculateModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function rollAbilityScores(method: 'standard' | 'classic' | 'heroic' | 'random'): AbilityScores {
  let scores: number[];

  switch (method) {
    case 'standard':
      // Standard array: 15, 14, 13, 12, 10, 8
      scores = [15, 14, 13, 12, 10, 8];
      break;
    case 'classic':
      // 4d6 drop lowest
      scores = Array.from({ length: 6 }, () => {
        const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
        rolls.sort((a, b) => a - b);
        rolls.shift();
        return rolls.reduce((sum, r) => sum + r, 0);
      });
      break;
    case 'heroic':
      // 2d6 + 6
      scores = Array.from({ length: 6 }, () => {
        return Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 6;
      });
      break;
    case 'random':
    default:
      // 3d6
      scores = Array.from({ length: 6 }, () => {
        return Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6);
      });
      break;
  }

  // Sort descending and assign to abilities
  scores.sort((a, b) => b - a);

  return {
    strength: scores[0],
    dexterity: scores[1],
    constitution: scores[2],
    intelligence: scores[3],
    wisdom: scores[4],
    charisma: scores[5],
  };
}

export function applyRacialBonuses(scores: AbilityScores, race: string, subrace: string | null): AbilityScores {
  const newScores = { ...scores };

  // Core racial bonuses based on SRD
  switch (race.toLowerCase()) {
    case 'dwarf':
      newScores.constitution += 2;
      if (subrace?.toLowerCase() === 'hill dwarf') newScores.wisdom += 1;
      if (subrace?.toLowerCase() === 'mountain dwarf') newScores.strength += 2;
      break;
    case 'elf':
      newScores.dexterity += 2;
      if (subrace?.toLowerCase() === 'high elf') newScores.intelligence += 1;
      if (subrace?.toLowerCase() === 'wood elf') newScores.wisdom += 1;
      if (subrace?.toLowerCase() === 'drow') newScores.charisma += 1;
      break;
    case 'halfling':
      newScores.dexterity += 2;
      if (subrace?.toLowerCase() === 'lightfoot') newScores.charisma += 1;
      if (subrace?.toLowerCase() === 'stout') newScores.constitution += 1;
      break;
    case 'human':
      newScores.strength += 1;
      newScores.dexterity += 1;
      newScores.constitution += 1;
      newScores.intelligence += 1;
      newScores.wisdom += 1;
      newScores.charisma += 1;
      break;
    case 'dragonborn':
      newScores.strength += 2;
      newScores.charisma += 1;
      break;
    case 'gnome':
      newScores.intelligence += 2;
      if (subrace?.toLowerCase() === 'forest gnome') newScores.dexterity += 1;
      if (subrace?.toLowerCase() === 'rock gnome') newScores.constitution += 1;
      break;
    case 'half-elf':
      newScores.charisma += 2;
      // +1 to two other stats of choice - we default to wisdom and strength
      newScores.wisdom += 1;
      newScores.strength += 1;
      break;
    case 'half-orc':
      newScores.strength += 2;
      newScores.constitution += 1;
      break;
    case 'tiefling':
      newScores.intelligence += 1;
      newScores.charisma += 2;
      break;
  }

  return newScores;
}

export function calculateProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function calculateHitPoints(
  classHitDie: number,
  constitutionMod: number,
  level: number,
  isFirstLevel: boolean = false
): number {
  if (isFirstLevel) {
    return classHitDie + constitutionMod;
  }
  const average = Math.ceil(classHitDie / 2) + 1;
  return average + constitutionMod;
}

export const SKILLS: Array<{ name: string; ability: keyof AbilityScores }> = [
  { name: 'Acrobatics', ability: 'dexterity' },
  { name: 'Animal Handling', ability: 'wisdom' },
  { name: 'Arcana', ability: 'intelligence' },
  { name: 'Athletics', ability: 'strength' },
  { name: 'Deception', ability: 'charisma' },
  { name: 'History', ability: 'intelligence' },
  { name: 'Insight', ability: 'wisdom' },
  { name: 'Intimidation', ability: 'charisma' },
  { name: 'Investigation', ability: 'intelligence' },
  { name: 'Medicine', ability: 'wisdom' },
  { name: 'Nature', ability: 'intelligence' },
  { name: 'Perception', ability: 'wisdom' },
  { name: 'Performance', ability: 'charisma' },
  { name: 'Persuasion', ability: 'charisma' },
  { name: 'Religion', ability: 'intelligence' },
  { name: 'Sleight of Hand', ability: 'dexterity' },
  { name: 'Stealth', ability: 'dexterity' },
  { name: 'Survival', ability: 'wisdom' },
];

export const ALL_ABILITIES: Array<{ key: keyof AbilityScores; label: string; short: string }> = [
  { key: 'strength', label: 'Strength', short: 'STR' },
  { key: 'dexterity', label: 'Dexterity', short: 'DEX' },
  { key: 'constitution', label: 'Constitution', short: 'CON' },
  { key: 'intelligence', label: 'Intelligence', short: 'INT' },
  { key: 'wisdom', label: 'Wisdom', short: 'WIS' },
  { key: 'charisma', label: 'Charisma', short: 'CHA' },
];

export const RACES = [
  'Dwarf', 'Hill Dwarf', 'Mountain Dwarf',
  'Elf', 'High Elf', 'Wood Elf', 'Drow',
  'Halfling', 'Lightfoot Halfling', 'Stout Halfling',
  'Human',
  'Dragonborn',
  'Gnome', 'Forest Gnome', 'Rock Gnome',
  'Half-Elf',
  'Half-Orc',
  'Tiefling',
];

export const CLASSES = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer',
  'Warlock', 'Wizard',
];

export const BACKGROUNDS = [
  'Acolyte', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero',
  'Guild Artisan', 'Hermit', 'Noble', 'Outlander', 'Sage',
  'Sailor', 'Soldier', 'Urchin',
];

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

/** Class skill options and count at level 1 */
export const CLASS_SKILLS: Record<string, { count: number; options: string[] }> = {
  'Barbarian': { count: 2, options: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'] },
  'Bard': { count: 3, options: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'] },
  'Cleric': { count: 2, options: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'] },
  'Druid': { count: 2, options: ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'] },
  'Fighter': { count: 2, options: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'] },
  'Monk': { count: 2, options: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'] },
  'Paladin': { count: 2, options: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'] },
  'Ranger': { count: 3, options: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'] },
  'Rogue': { count: 4, options: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'] },
  'Sorcerer': { count: 2, options: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'] },
  'Warlock': { count: 2, options: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'] },
  'Wizard': { count: 2, options: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'] },
};

/** Background skill bonuses */
export const BACKGROUND_SKILLS: Record<string, string[]> = {
  'Acolyte': ['Insight', 'Religion'],
  'Charlatan': ['Deception', 'Sleight of Hand'],
  'Criminal': ['Deception', 'Stealth'],
  'Entertainer': ['Acrobatics', 'Performance'],
  'Folk Hero': ['Animal Handling', 'Survival'],
  'Guild Artisan': ['Insight', 'Persuasion'],
  'Hermit': ['Medicine', 'Religion'],
  'Noble': ['History', 'Persuasion'],
  'Outlander': ['Athletics', 'Survival'],
  'Sage': ['Arcana', 'History'],
  'Sailor': ['Athletics', 'Perception'],
  'Soldier': ['Athletics', 'Intimidation'],
  'Urchin': ['Sleight of Hand', 'Stealth'],
};

/** Racial skill bonuses */
export const RACIAL_SKILLS: Record<string, string[]> = {
  'Dwarf': [],
  'Elf': ['Perception'],
  'Halfling': [],
  'Human': [],
  'Dragonborn': [],
  'Gnome': [],
  'Half-Elf': [], // +2 to any 2 skills - handled separately
  'Half-Orc': ['Intimidation'],
  'Tiefling': [],
};
