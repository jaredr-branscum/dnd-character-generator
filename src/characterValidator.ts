import { Character, AbilityScores } from './types';
import { calculateModifier, CLASS_SKILLS, BACKGROUND_SKILLS, RACIAL_SKILLS, SKILLS } from './abilityUtils';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  corrected: Character;
}

export function validateCharacter(character: Character): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const corrected = { ...character, abilityScores: { ...character.abilityScores } };

  // --- Basic Info Validation ---
  if (!character.name || character.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Character must have a name', severity: 'error' });
  }

  const validRaces = ['Dwarf', 'Elf', 'Halfling', 'Human', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];
  if (!validRaces.includes(character.race)) {
    errors.push({ field: 'race', message: `Invalid race: "${character.race}". Must be one of: ${validRaces.join(', ')}`, severity: 'error' });
  }

  const validClasses = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
  if (!validClasses.includes(character.class)) {
    errors.push({ field: 'class', message: `Invalid class: "${character.class}". Must be one of: ${validClasses.join(', ')}`, severity: 'error' });
  }

  if (character.level !== 1) {
    corrected.level = 1;
    warnings.push({ field: 'level', message: 'Level corrected to 1', severity: 'warning' });
  }

  const validBackgrounds = ['Acolyte', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero', 'Guild Artisan', 'Hermit', 'Noble', 'Outlander', 'Sage', 'Sailor', 'Soldier', 'Urchin'];
  if (!validBackgrounds.includes(character.background)) {
    warnings.push({ field: 'background', message: `Unusual background: "${character.background}". Must be one of the standard backgrounds.`, severity: 'warning' });
  }

  // --- Ability Score Validation ---
  const validAbilities: Array<keyof AbilityScores> = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  
  for (const ab of validAbilities) {
    const score = character.abilityScores[ab];
    if (typeof score !== 'number' || score < 1 || score > 20) {
      corrected.abilityScores[ab] = Math.max(1, Math.min(20, score || 10));
      errors.push({ field: `abilityScores.${ab}`, message: `Ability score ${ab} (${score}) corrected to ${corrected.abilityScores[ab]}. Must be 1-20`, severity: 'error' });
    }
  }

  // Verify standard array was used as base (allow some flexibility)
  const scores = validAbilities.map(ab => character.abilityScores[ab]);
  const totalBeforeRacial = scores.reduce((sum, s) => sum + s, 0);
  const expectedTotalRange: Record<string, [number, number]> = {
    'Human': [72, 80], // 15+14+13+12+10+8 = 72 + 6 = 78
    'default': [69, 80], // standard array (72) + typical bonuses
  };
  const range = expectedTotalRange[character.race] || expectedTotalRange['default'];
  if (totalBeforeRacial < range[0] || totalBeforeRacial > range[1]) {
    warnings.push({ field: 'abilityScores', message: `Total ability score sum (${totalBeforeRacial}) seems unusual. Expected range: ${range[0]}-${range[1]}`, severity: 'warning' });
  }

  // --- HP Validation ---
  const hitDieMap: Record<string, number> = {
    'Barbarian': 12, 'Bard': 8, 'Cleric': 8, 'Druid': 8, 'Fighter': 10,
    'Monk': 8, 'Paladin': 10, 'Ranger': 10, 'Rogue': 8, 'Sorcerer': 6,
    'Warlock': 8, 'Wizard': 6,
  };
  const expectedHitDie = hitDieMap[character.class] || 8;
  const conMod = calculateModifier(character.abilityScores.constitution);
  const expectedHP = expectedHitDie + conMod;

  if (character.hitPointMaximum !== expectedHP) {
    corrected.hitPointMaximum = expectedHP;
    corrected.hitPointCurrent = expectedHP;
    errors.push({ field: 'hitPointMaximum', message: `HP corrected from ${character.hitPointMaximum} to ${expectedHP} (d${expectedHitDie} + ${conMod} Con mod)`, severity: 'error' });
  }

  // --- Hit Dice Validation ---
  if (character.hitDice.dieSize !== expectedHitDie) {
    corrected.hitDice = { dieCount: 1, dieSize: expectedHitDie, used: 0 };
    errors.push({ field: 'hitDice.dieSize', message: `Hit die corrected from d${character.hitDice.dieSize} to d${expectedHitDie} for ${character.class}`, severity: 'error' });
  }
  if (character.hitDice.dieCount !== 1) {
    corrected.hitDice = { ...corrected.hitDice, dieCount: 1 };
    errors.push({ field: 'hitDice.dieCount', message: `Hit die count corrected to 1 for level 1`, severity: 'error' });
  }

  // --- Proficiency Bonus Validation ---
  if (character.proficiencyBonus !== 2) {
    corrected.proficiencyBonus = 2;
    errors.push({ field: 'proficiencyBonus', message: 'Proficiency bonus corrected to +2 for level 1', severity: 'error' });
  }

  // --- Saving Throw Validation ---
  const classSaves: Record<string, string[]> = {
    'Barbarian': ['strength', 'constitution'],
    'Bard': ['dexterity', 'charisma'],
    'Cleric': ['wisdom', 'charisma'],
    'Druid': ['intelligence', 'wisdom'],
    'Fighter': ['strength', 'constitution'],
    'Monk': ['strength', 'dexterity'],
    'Paladin': ['wisdom', 'charisma'],
    'Ranger': ['strength', 'dexterity'],
    'Rogue': ['dexterity', 'intelligence'],
    'Sorcerer': ['constitution', 'charisma'],
    'Warlock': ['wisdom', 'charisma'],
    'Wizard': ['intelligence', 'wisdom'],
  };
  const expectedSaves = classSaves[character.class] || [];
  
  if (character.savingThrows.length !== 6) {
    // Regenerate all 6 saves
    corrected.savingThrows = validAbilities.map(ability => ({
      ability,
      proficient: expectedSaves.includes(ability),
    }));
    errors.push({ field: 'savingThrows', message: 'Saving throws regenerated to include all 6 abilities with correct proficiencies', severity: 'error' });
  } else {
    for (const st of character.savingThrows) {
      const shouldBeProficient = expectedSaves.includes(st.ability);
      if (st.proficient !== shouldBeProficient && expectedSaves.length > 0) {
        const save = corrected.savingThrows.find(s => s.ability === st.ability);
        if (save) save.proficient = shouldBeProficient;
        errors.push({ field: `savingThrows.${st.ability}`, message: `Saving throw proficiency for ${st.ability} corrected`, severity: 'error' });
      }
    }
  }

  // --- Speed Validation ---
  const slowRaces = ['Dwarf', 'Halfling', 'Gnome'];
  const expectedSpeed = slowRaces.includes(character.race) ? 25 : 30;
  if (character.speed !== expectedSpeed) {
    corrected.speed = expectedSpeed;
    errors.push({ field: 'speed', message: `Speed corrected from ${character.speed} to ${expectedSpeed} for ${character.race}`, severity: 'error' });
  }

  // --- Spellcasting Validation ---
  const spellcastingClasses: Record<string, string> = {
    'Bard': 'charisma', 'Cleric': 'wisdom', 'Druid': 'wisdom',
    'Paladin': 'charisma', 'Ranger': 'wisdom', 'Sorcerer': 'charisma',
    'Warlock': 'charisma', 'Wizard': 'intelligence',
  };
  const shouldHaveSpellcasting = spellcastingClasses[character.class] || null;
  const isHalfCaster = character.class === 'Paladin' || character.class === 'Ranger';

  /** Cantrip counts known at level 1 per class */
  const cantripCounts: Record<string, number> = {
    'Bard': 2, 'Cleric': 3, 'Druid': 2, 'Sorcerer': 4, 'Warlock': 2, 'Wizard': 3,
  };

  /** Spells known at level 1 per class (for spontaneous casters) */
  const spellsKnown: Record<string, number> = {
    'Bard': 4, 'Sorcerer': 2, 'Warlock': 2,
  };

  /** Spells prepared at level 1 for prepared casters (mod + level) */
  function getPreparedCount(className: string, spellMod: number): number | null {
    if (className === 'Cleric' || className === 'Druid') return spellMod + 1; // Wis mod + 1
    if (className === 'Wizard') return spellMod + 1; // Int mod + 1
    return null;
  }

  if (shouldHaveSpellcasting) {
    // Validate casting ability
    if (character.spellcastingAbility !== shouldHaveSpellcasting) {
      corrected.spellcastingAbility = shouldHaveSpellcasting as keyof AbilityScores;
      errors.push({ field: 'spellcastingAbility', message: `Spellcasting ability corrected to ${shouldHaveSpellcasting} for ${character.class}`, severity: 'error' });
    }

    const spellMod = calculateModifier(character.abilityScores[shouldHaveSpellcasting as keyof AbilityScores]);

    // --- Spell Slots ---
    if (!isHalfCaster) {
      const expectedSlotTotal = character.class === 'Warlock' ? 1 : 2;
      if (character.spellSlots.length === 0) {
        corrected.spellSlots = [{ level: 1, total: expectedSlotTotal, used: 0 }];
        errors.push({ field: 'spellSlots', message: `Spell slots added for level 1 ${character.class}`, severity: 'error' });
      } else {
        // Check slot level is correct
        const firstSlot = character.spellSlots[0];
        if (firstSlot.level !== 1) {
          corrected.spellSlots[0] = { ...firstSlot, level: 1 };
          errors.push({ field: 'spellSlots.0.level', message: 'Spell slot level corrected to 1st', severity: 'error' });
        }
        if (firstSlot.total !== expectedSlotTotal) {
          corrected.spellSlots[0] = { ...corrected.spellSlots[0], total: expectedSlotTotal };
          errors.push({ field: 'spellSlots.0.total', message: `Spell slot count corrected to ${expectedSlotTotal} for level 1 ${character.class}`, severity: 'error' });
        }
        // Remove extra slots (level 1 should only have 1st level slots)
        if (character.spellSlots.length > 1) {
          corrected.spellSlots = corrected.spellSlots.filter(s => s.level === 1);
          warnings.push({ field: 'spellSlots', message: 'Extra spell slots beyond 1st level removed', severity: 'warning' });
        }
      }
    } else {
      if (character.spellSlots.length > 0) {
        corrected.spellSlots = [];
        warnings.push({ field: 'spellSlots', message: 'Paladins and Rangers get spellcasting at level 2. Spell slots cleared.', severity: 'warning' });
      }
    }

    // --- Cantrip Count Validation ---
    const expectedCantripCount = cantripCounts[character.class];
    if (expectedCantripCount !== undefined && character.cantrips.length !== expectedCantripCount) {
      const diff = character.cantrips.length - expectedCantripCount;
      if (diff > 0) {
        corrected.cantrips = character.cantrips.slice(0, expectedCantripCount);
        errors.push({ field: 'cantrips', message: `${character.class} knows ${expectedCantripCount} cantrips at level 1. Removed ${diff} extra.`, severity: 'error' });
      } else {
        errors.push({ field: 'cantrips', message: `${character.class} knows ${expectedCantripCount} cantrips at level 1, but only ${character.cantrips.length} provided.`, severity: 'error' });
      }
    }

    // --- Spells Known / Prepared Count Validation ---
    const knownCount = spellsKnown[character.class];
    const preparedCount = getPreparedCount(character.class, spellMod);

    if (knownCount !== undefined) {
      // Spontaneous caster (Bard, Sorcerer, Warlock)
      if (character.spells.length !== knownCount) {
        const diff = character.spells.length - knownCount;
        if (diff > 0) {
          corrected.spells = character.spells.slice(0, knownCount);
          errors.push({ field: 'spells', message: `${character.class} knows ${knownCount} spells at level 1. Removed ${diff} extra.`, severity: 'error' });
        } else {
          errors.push({ field: 'spells', message: `${character.class} knows ${knownCount} spells at level 1, but only ${character.spells.length} provided.`, severity: 'error' });
        }
      }
      // Validate no spell above level 1
      const highLevelSpells = character.spells.filter(s => s.level > 1);
      if (highLevelSpells.length > 0) {
        corrected.spells = corrected.spells.filter(s => s.level <= 1);
        errors.push({ field: 'spells', message: `${highLevelSpells.length} spell(s) above level 1 removed. Level 1 casters only have 1st-level spells.`, severity: 'error' });
      }
    }

    if (preparedCount !== null) {
      // Prepared caster (Cleric, Druid, Wizard)
      if (character.spells.length > preparedCount) {
        corrected.spells = character.spells.slice(0, preparedCount);
        errors.push({ field: 'spells', message: `${character.class} can prepare ${preparedCount} spells at level 1 (mod ${spellMod} + 1). Trimmed from ${character.spells.length} to ${preparedCount}.`, severity: 'error' });
      } else if (character.spells.length === 0 && preparedCount > 0) {
        errors.push({ field: 'spells', message: `${character.class} should have ${preparedCount} prepared spells at level 1.`, severity: 'error' });
      }
      // Validate no spell above level 1
      const highLevelSpells = character.spells.filter(s => s.level > 1);
      if (highLevelSpells.length > 0) {
        corrected.spells = corrected.spells.filter(s => s.level <= 1);
        errors.push({ field: 'spells', message: `${highLevelSpells.length} spell(s) above level 1 removed. Level 1 casters only have 1st-level spells.`, severity: 'error' });
      }
      // For Wizard, validate the spellbook has 6 spells (but prepared count is mod + 1)
      if (character.class === 'Wizard' && preparedCount > 0 && character.spells.length < 6 && character.spells.length > preparedCount) {
        // They have more than prepared but less than 6 in spellbook - that's fine, just flag
        warnings.push({ field: 'spells', message: `Wizards have 6 spells in their spellbook at level 1, but can only prepare ${preparedCount}. Found ${character.spells.length}.`, severity: 'warning' });
      }
    }

    // --- Spell DC & Attack Bonus ---
    const expectedDC = 8 + 2 + spellMod;
    if (character.spellSaveDC !== expectedDC) {
      corrected.spellSaveDC = expectedDC;
      errors.push({ field: 'spellSaveDC', message: `Spell save DC corrected from ${character.spellSaveDC} to ${expectedDC} (8 + 2 prof + ${spellMod} mod)`, severity: 'error' });
    }

    const expectedAttack = 2 + spellMod;
    if (character.spellAttackBonus !== expectedAttack) {
      corrected.spellAttackBonus = expectedAttack;
      errors.push({ field: 'spellAttackBonus', message: `Spell attack bonus corrected from ${character.spellAttackBonus} to +${expectedAttack} (2 prof + ${spellMod} mod)`, severity: 'error' });
    }
  } else {
    // --- Non-spellcaster: clear all spell data ---
    if (character.spellcastingAbility !== null) {
      corrected.spellcastingAbility = null;
      errors.push({ field: 'spellcastingAbility', message: `Non-spellcaster class ${character.class} should have no spellcasting ability`, severity: 'error' });
    }
    if (character.cantrips.length > 0) {
      corrected.cantrips = [];
      warnings.push({ field: 'cantrips', message: `Non-spellcaster class cleared of cantrips`, severity: 'warning' });
    }
    if (character.spells.length > 0) {
      corrected.spells = [];
      warnings.push({ field: 'spells', message: `Non-spellcaster class cleared of spells`, severity: 'warning' });
    }
    if (character.spellSlots.length > 0) {
      corrected.spellSlots = [];
      warnings.push({ field: 'spellSlots', message: `Non-spellcaster class cleared of spell slots`, severity: 'warning' });
    }
    if (character.spellSaveDC !== 10) {
      corrected.spellSaveDC = 10;
      warnings.push({ field: 'spellSaveDC', message: `Spell save DC reset to 10 for non-spellcaster`, severity: 'warning' });
    }
    if (character.spellAttackBonus !== 2) {
      corrected.spellAttackBonus = 2;
      warnings.push({ field: 'spellAttackBonus', message: `Spell attack bonus reset to +2 for non-spellcaster`, severity: 'warning' });
    }
  }

  // --- Initiative Validation ---
  const dexMod = calculateModifier(character.abilityScores.dexterity);
  if (character.initiative !== dexMod) {
    corrected.initiative = dexMod;
    errors.push({ field: 'initiative', message: `Initiative corrected from ${character.initiative} to ${dexMod} (must equal Dex modifier)`, severity: 'error' });
  }

  // --- AC Validation ---
  const expectedACMin = 8 + dexMod; // unarmored minimum
  const expectedACMax = 20; // plate + shield
  if (character.armorClass < expectedACMin || character.armorClass > expectedACMax) {
    warnings.push({ field: 'armorClass', message: `AC ${character.armorClass} seems unusual for level 1. Expected range: ${expectedACMin}-${expectedACMax}`, severity: 'warning' });
  }

  // --- Inspiration Validation ---
  if (typeof character.inspiration !== 'boolean') {
    corrected.inspiration = false;
    warnings.push({ field: 'inspiration', message: 'Inspiration corrected to false (must be boolean)', severity: 'warning' });
  }

  // --- Attacks Validation ---
  if (!Array.isArray(character.attacks)) {
    corrected.attacks = [];
    warnings.push({ field: 'attacks', message: 'Attacks array was invalid and cleared', severity: 'warning' });
  } else {
    for (const attack of character.attacks) {
      if (typeof attack.attackBonus !== 'number') {
        warnings.push({ field: 'attacks', message: `Attack "${attack.name}" has invalid attack bonus`, severity: 'warning' });
      }
      if (typeof attack.damage !== 'string' || !attack.damage.match(/^\d+d\d+/i)) {
        warnings.push({ field: 'attacks', message: `Attack "${attack.name}" has invalid damage format (expected like "1d8+3")`, severity: 'warning' });
      }
    }
  }

  // --- Languages Validation ---
  if (!Array.isArray(character.languages) || character.languages.length === 0) {
    warnings.push({ field: 'languages', message: 'Character should have at least one language (usually Common)', severity: 'warning' });
  }

  // --- Other Proficiencies Validation ---
  if (!Array.isArray(character.otherProficiencies)) {
    corrected.otherProficiencies = [];
    warnings.push({ field: 'otherProficiencies', message: 'Other proficiencies array was invalid and cleared', severity: 'warning' });
  }

  // --- Skills Validation ---
  const classSkillData = CLASS_SKILLS[character.class];
  const backgroundSkillData = BACKGROUND_SKILLS[character.background] || [];
  const racialSkillData = RACIAL_SKILLS[character.race] || [];

  // Calculate expected minimum skills: class choices + background (2) + racial (if any)
  const expectedMinSkills = (classSkillData?.count || 0) + backgroundSkillData.length + racialSkillData.length;

  if (character.skills.length < expectedMinSkills && expectedMinSkills > 0) {
    errors.push({ field: 'skills', message: `${character.class} should have at least ${expectedMinSkills} skill proficiencies (${classSkillData?.count || 0} from class, ${backgroundSkillData.length} from background, ${racialSkillData.length} from race). Found ${character.skills.length}.`, severity: 'error' });
  }

  // Validate each skill is in the allowed pool
  const allowedSkills = new Set<string>();
  if (classSkillData) {
    classSkillData.options.forEach(s => allowedSkills.add(s));
  }
  backgroundSkillData.forEach(s => allowedSkills.add(s));
  racialSkillData.forEach(s => allowedSkills.add(s));

  // Half-Elf gets +2 to any skills - allow all
  if (character.race === 'Half-Elf') {
    SKILLS.forEach(s => allowedSkills.add(s.name));
  }

  const invalidSkills = character.skills.filter(s => !allowedSkills.has(s.name));
  if (invalidSkills.length > 0) {
    const invalidNames = invalidSkills.map(s => s.name).join(', ');
    errors.push({ field: 'skills', message: `Invalid skill(s) for ${character.class}/${character.background}: ${invalidNames}. Allowed: ${[...allowedSkills].slice(0, 10).join(', ')}...`, severity: 'error' });
  }

  // Check for duplicate skills
  const skillNames = character.skills.map(s => s.name);
  const duplicates = skillNames.filter((name, index) => skillNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    warnings.push({ field: 'skills', message: `Duplicate skill(s) found: ${[...new Set(duplicates)].join(', ')}`, severity: 'warning' });
  }

  // Keep toJSON from propagating
  const { toJSON, ...cleanCorrected } = corrected as any;
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    corrected: cleanCorrected as Character,
  };
}