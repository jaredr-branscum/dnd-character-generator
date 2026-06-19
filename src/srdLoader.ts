// SRD 5.1 Data Loader
// Loads and provides access to the System Reference Document data

import srdRaces from '@data/srd/json/01 races.json';
import srdClasses from '@data/srd/json/02 classes.json';
import srdEquipment from '@data/srd/json/04 equipment.json';
import srdFeats from '@data/srd/json/05 feats.json';
import srdMechanics from '@data/srd/json/06 mechanics.json';
import srdSpellcasting from '@data/srd/json/08 spellcasting.json';

// Flattened data for quick lookups
export interface ClassInfo {
  name: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: string[];
  skillChoices: string[];
  skillCount: number;
  spellcastingAbility: string | null;
}

export interface RaceInfo {
  name: string;
  subraces: string[];
  description: string;
}

export interface EquipmentInfo {
  name: string;
  category: string;
  cost: string;
  weight: string;
  properties: string[];
}

export interface SRDData {
  races: any;
  classes: any;
  equipment: any;
  feats: any;
  mechanics: any;
  spells: any;
}

const srdData: SRDData = {
  races: srdRaces,
  classes: srdClasses,
  equipment: srdEquipment,
  feats: srdFeats,
  mechanics: srdMechanics,
  spells: srdSpellcasting,
};

export function getSRDData(): SRDData {
  return srdData;
}

export function getSRDSummary(): string {
  const races = Object.keys((srdRaces as any).Races || {}).filter(r => r !== 'Racial Traits');
  const classes = Object.keys((srdClasses as any) || {});
  const featNames = Object.keys((srdFeats as any).Feats || {}).filter(f => f !== 'content');
  
  return JSON.stringify({
    availableRaces: races,
    availableClasses: classes,
    availableFeats: featNames,
    hasEquipment: true,
    hasSpellcasting: true,
  }, null, 2);
}

// Extract class info for the generator context
export function getClassInfo(className: string): ClassInfo | null {
  const classData = (srdClasses as any)[className];
  if (!classData) return null;

  const features = classData['Class Features'] || {};
  const proficiencies = features.Proficiencies || {};
  const proficienciesContent = (proficiencies.content || []).join(' ');
  
  // Parse hit die from features
  const hpData = features['Hit Points'] || {};
  const hpContent = (hpData.content || []).join(' ');
  const hitDieMatch = hpContent.match(/d(\d+)/);
  const hitDie = hitDieMatch ? parseInt(hitDieMatch[1]) : 8;

  // Parse saving throws
  const saveMatch = proficienciesContent.match(/Saving Throws:\s*([^.\n]*)/);
  const savingThrows = saveMatch ? saveMatch[1].split(',').map((s: string) => s.trim()) : [];

  // Parse skill choices
  const skillMatch = proficienciesContent.match(/Skills:\s*Choose\s*(\d+)\s*from\s*([^.\n]*)/i);
  let skillChoices: string[] = [];
  let skillCount = 2;
  if (skillMatch) {
    skillCount = parseInt(skillMatch[1]) || 2;
    skillChoices = skillMatch[2].split(',').map((s: string) => s.trim());
  }

  // Determine primary ability and spellcasting
  const table = features[`The ${className}`] || {};
  const tableData = table.table || {};
  const featuresList = tableData.Features || [];
  
  let spellcastingAbility: string | null = null;
  const spellcasters: Record<string, string> = {
    'Bard': 'charisma',
    'Cleric': 'wisdom',
    'Druid': 'wisdom',
    'Paladin': 'charisma',
    'Ranger': 'wisdom',
    'Sorcerer': 'charisma',
    'Warlock': 'charisma',
    'Wizard': 'intelligence',
  };

  if (spellcasters[className]) {
    spellcastingAbility = spellcasters[className];
  }

  const primaryAbilities: Record<string, string> = {
    'Barbarian': 'Strength',
    'Bard': 'Charisma',
    'Cleric': 'Wisdom',
    'Druid': 'Wisdom',
    'Fighter': 'Strength or Dexterity',
    'Monk': 'Dexterity & Wisdom',
    'Paladin': 'Strength & Charisma',
    'Ranger': 'Dexterity & Wisdom',
    'Rogue': 'Dexterity',
    'Sorcerer': 'Charisma',
    'Warlock': 'Charisma',
    'Wizard': 'Intelligence',
  };

  return {
    name: className,
    hitDie,
    primaryAbility: primaryAbilities[className] || 'Varies',
    savingThrows,
    skillChoices,
    skillCount,
    spellcastingAbility,
  };
}

// Get equipment data summary
export function getEquipmentList(): string[] {
  const equipment = (srdEquipment as any).Equipment || {};
  const items: string[] = [];
  
  for (const key of Object.keys(equipment)) {
    if (key !== 'content' && key !== 'Standard Exchange Rates') {
      const section = equipment[key];
      if (section && section.content) {
        const content = Array.isArray(section.content) ? section.content : [section.content];
        content.forEach((item: any) => {
          if (typeof item === 'string' && item.startsWith('**')) {
            const name = item.replace(/\*\*/g, '').split(',')[0].split('(')[0].trim();
            if (name && name.length > 1) items.push(name);
          }
        });
      }
    }
  }
  
  return [...new Set(items)].slice(0, 100);
}