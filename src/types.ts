export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Skill {
  name: string;
  ability: keyof AbilityScores;
  proficient: boolean;
  expertise: boolean;
}

export interface SavingThrow {
  ability: keyof AbilityScores;
  proficient: boolean;
}

export interface HitDice {
  dieCount: number;
  dieSize: number;
  used: number;
}

export interface SpellSlot {
  level: number;
  total: number;
  used: number;
}

export interface Spell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  prepared?: boolean;
  ritual?: boolean;
  concentration?: boolean;
}

export interface EquipmentItem {
  name: string;
  quantity: number;
  description?: string;
  weight?: number;
}

export interface Attack {
  name: string;
  attackBonus: number;
  damage: string;
  damageType: string;
  properties?: string;
}

export interface Feature {
  name: string;
  description: string;
  source: string;
  level?: number;
}

export interface Character {
  // Basic Info
  name: string;
  race: string;
  subrace: string | null;
  class: string;
  subclass: string | null;
  level: number;
  background: string;
  alignment: string;
  experiencePoints: number;
  playerName: string;
  inspiration: boolean;

  // Ability Scores
  abilityScores: AbilityScores;

  // Combat
  armorClass: number;
  initiative: number;
  speed: number;
  hitPointMaximum: number;
  hitPointCurrent: number;
  hitPointTemp: number;
  hitDice: HitDice;
  proficiencyBonus: number;

  // Proficiencies
  skills: Skill[];
  savingThrows: SavingThrow[];
  languages: string[];
  otherProficiencies: string[];

  // Equipment & Money
  equipment: EquipmentItem[];
  copper: number;
  silver: number;
  electrum: number;
  gold: number;
  platinum: number;

  // Spellcasting
  spellcastingAbility: keyof AbilityScores | null;
  spellSaveDC: number;
  spellAttackBonus: number;
  spellSlots: SpellSlot[];
  cantrips: Spell[];
  spells: Spell[];

  // Attacks & Spellcasting
  attacks: Attack[];

  // Features & Traits
  features: Feature[];
  racialTraits: Feature[];
  classFeatures: Feature[];

  // Personality
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;

  // Appearance
  age: string;
  height: string;
  weight: string;
  eyes: string;
  skin: string;
  hair: string;
  appearance: string;
  backstory: string;
  alliesAndOrganizations: string;
  characterNotes: string;

  // Death Saves
  deathSaveSuccesses: number;
  deathSaveFailures: number;
}

export interface CharacterGenerationResult {
  character: Character;
  rawPrompt: string;
  aiResponse: string;
}