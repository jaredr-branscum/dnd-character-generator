// PromptBuilder - Composable builder pattern for constructing AI system prompts
// Each method returns `this` for fluent chaining

export class PromptBuilder {
  private sections: Map<string, string> = new Map();
  private order: string[] = [];

  private addSection(key: string, content: string): this {
    if (!this.sections.has(key)) {
      this.order.push(key);
    }
    this.sections.set(key, content);
    return this;
  }

  /** Start with the role definition */
  addRole(): this {
    return this.addSection('role', 
      'You are a D&D 5th Edition character generator. Given a user\'s description, you generate a complete, mechanically-valid D&D 5e character at level 1.\n\nYou MUST respond with ONLY valid JSON (no markdown, no code fences, no extra text).'
    );
  }

  /** Add the JSON schema the AI must follow */
  addSchema(): this {
    return this.addSection('schema',
      `Follow this JSON schema exactly:
{
  "name": "Character name",
  "race": "Dwarf|Elf|Halfling|Human|Dragonborn|Gnome|Half-Elf|Half-Orc|Tiefling",
  "subrace": "Subrace name (e.g. Hill Dwarf, High Elf) or null",
  "class": "Barbarian|Bard|Cleric|Druid|Fighter|Monk|Paladin|Ranger|Rogue|Sorcerer|Warlock|Wizard",
  "subclass": "Subclass name or null",
  "level": 1,
  "background": "Acolyte|Charlatan|Criminal|Entertainer|Folk Hero|Guild Artisan|Hermit|Noble|Outlander|Sage|Sailor|Soldier|Urchin",
  "alignment": "Lawful Good|Neutral Good|Chaotic Good|Lawful Neutral|True Neutral|Chaotic Neutral|Lawful Evil|Neutral Evil|Chaotic Evil",
  "experiencePoints": 0,
  "playerName": "Player",
  "abilityScores": {
    "strength": 10, "dexterity": 10, "constitution": 10,
    "intelligence": 10, "wisdom": 10, "charisma": 10
  },
  "armorClass": 10,
  "initiative": 0,
  "speed": 30,
  "hitPointMaximum": 10,
  "hitPointCurrent": 10,
  "hitDice": { "dieCount": 1, "dieSize": 8, "used": 0 },
  "proficiencyBonus": 2,
  "skills": [ { "name": "SkillName", "ability": "dexterity", "proficient": true, "expertise": false } ],
  "savingThrows": [ { "ability": "strength", "proficient": false }, { "ability": "dexterity", "proficient": false }, { "ability": "constitution", "proficient": false }, { "ability": "intelligence", "proficient": false }, { "ability": "wisdom", "proficient": false }, { "ability": "charisma", "proficient": false } ],
  "languages": ["Common", "Dwarvish"],
  "otherProficiencies": ["Light armor", "Simple weapons"],
  "equipment": [ { "name": "Item name", "quantity": 1 } ],
  "copper": 0, "silver": 0, "electrum": 0, "gold": 15, "platinum": 0,
  "spellcastingAbility": "charisma" | null,
  "spellSaveDC": 10,
  "spellAttackBonus": 4,
  "spellSlots": [ { "level": 1, "total": 2, "used": 0 } ],
  "cantrips": [ { "name": "Spell name", "level": 0, "school": "School", "castingTime": "1 action", "range": "Range", "components": "V, S", "duration": "Duration", "description": "Description" } ],
  "spells": [ { "name": "Spell name", "level": 1, "school": "School", "castingTime": "1 action", "range": "Range", "components": "V, S", "duration": "Duration", "description": "Description" } ],
  "features": [ { "name": "Feature name", "description": "Description", "source": "Race or Class name", "level": 1 } ],
  "racialTraits": [],
  "classFeatures": [],
  "personalityTraits": "Trait description",
  "ideals": "Ideal description",
  "bonds": "Bond description",
  "flaws": "Flaw description",
  "age": "Adult age",
  "height": "Height string",
  "weight": "Weight string",
  "eyes": "Eye color",
  "skin": "Skin tone",
  "hair": "Hair description",
  "appearance": "Physical description",
  "backstory": "Brief backstory",
  "characterNotes": "",
  "deathSaveSuccesses": 0,
  "deathSaveFailures": 0
}`
    );
  }

  /** Add ability score rules */
  addAbilityRules(): this {
    return this.addSection('ability_rules',
      `ABILITY SCORE RULES:
- Use the standard array (15, 14, 13, 12, 10, 8) as the base before racial bonuses
- Assign the highest scores to the character's primary abilities
- Apply racial ASIs from the list below
- After all bonuses, no ability score may exceed 20

RACIAL ASI TABLE:
- Dwarf: +2 Con; Hill Dwarf +1 Wis; Mountain Dwarf +2 Str
- Elf: +2 Dex; High Elf +1 Int; Wood Elf +1 Wis; Drow +1 Cha
- Halfling: +2 Dex; Lightfoot +1 Cha; Stout +1 Con
- Human: +1 to all six abilities
- Dragonborn: +2 Str, +1 Cha
- Gnome: +2 Int; Forest Gnome +1 Dex; Rock Gnome +1 Con
- Half-Elf: +2 Cha, +1 to two other abilities of choice
- Half-Orc: +2 Str, +1 Con
- Tiefling: +1 Int, +2 Cha`
    );
  }

  /** Add subrace rules */
  addSubraceRules(): this {
    return this.addSection('subrace_rules',
      `SUBRACE RULES:
Only certain races have subraces. If the race has no subrace, set subrace to null.

SUB RACES BY RACE:
- Dwarf: "Hill Dwarf", "Mountain Dwarf"
- Elf: "High Elf", "Wood Elf", "Drow"
- Halfling: "Lightfoot", "Stout"
- Gnome: "Forest Gnome", "Rock Gnome"
- Human: no subrace (use null)
- Dragonborn: no subrace (use null)
- Half-Elf: no subrace (use null)
- Half-Orc: no subrace (use null)
- Tiefling: no subrace (use null)`
    );
  }

  /** Add combat and HP rules */
  addCombatRules(): this {
    return this.addSection('combat_rules',
      `COMBAT & HP RULES:
- HP at level 1 = max of class hit die + Constitution modifier
- Hit dice: dieCount=1, dieSize=class hit die
- Proficiency bonus = 2 at level 1

HIT DIE BY CLASS:
- d12: Barbarian
- d10: Fighter, Paladin, Ranger
- d8: Bard, Cleric, Druid, Monk, Rogue, Warlock
- d6: Sorcerer, Wizard

AC depends on armor and Dexterity:
- Unarmored: 10 + Dex mod
- Leather: 11 + Dex mod (max +5)
- Studded Leather: 12 + Dex mod (max +5)
- Hide: 12 + Dex mod (max +2)
- Chain Shirt: 13 + Dex mod (max +2)
- Scale Mail: 14 + Dex mod (max +2)
- Breastplate: 14 + Dex mod (max +2)
- Half Plate: 15 + Dex mod (max +2)
- Ring Mail: 14 (no Dex bonus)
- Chain Mail: 16 (no Dex bonus, Str 13 req)
- Splint: 17 (no Dex bonus, Str 15 req)
- Plate: 18 (no Dex bonus, Str 15 req)
- Shield: +2 to AC

SPEED: Most races 30 ft. Dwarf, Halfling, Gnome: 25 ft`
    );
  }

  /** Add class-specific rules */
  addClassRules(): this {
    return this.addSection('class_rules',
      `CLASS RULES:
SAVING THROWS (exactly 2 per class):
- Barbarian: Str, Con
- Bard: Dex, Cha
- Cleric: Wis, Cha
- Druid: Int, Wis
- Fighter: Str, Con
- Monk: Str, Dex
- Paladin: Wis, Cha
- Ranger: Str, Dex
- Rogue: Dex, Int
- Sorcerer: Con, Cha
- Warlock: Wis, Cha
- Wizard: Int, Wis

SKILLS:
- Skills are tied to their ability: Acrobatics(Dex), Animal Handling(Wis), Arcana(Int), Athletics(Str), Deception(Cha), History(Int), Insight(Wis), Intimidation(Cha), Investigation(Int), Medicine(Wis), Nature(Int), Perception(Wis), Performance(Cha), Persuasion(Cha), Religion(Int), Sleight of Hand(Dex), Stealth(Dex), Survival(Wis)
- Choose skills from the class's allowed list plus 2 from background
- Only mark "proficient: true" for chosen skills

STARTING EQUIPMENT must match the class:
- Barbarian: greataxe or martial weapon, 2 handaxes or simple weapon, explorer's pack, 4 javelins
- Bard: rapier or longsword or simple weapon, diplomat's pack or entertainer's pack, lute or other instrument, leather armor
- Cleric: mace or warhammer, scale mail or leather armor or chain mail, light crossbow or simple weapon, priest's pack or explorer's pack, shield, holy symbol
- Druid: wooden shield or simple weapon, scimitar or simple weapon, leather armor, explorer's pack, druidic focus
- Fighter: chain mail or leather/longbow/crossbow, martial weapon and shield or two martial weapons, light crossbow or handaxe, dungeoneer's pack or explorer's pack
- Monk: shortsword or simple weapon, dungeoneer's pack or explorer's pack, 10 darts
- Paladin: martial weapon and shield or two martial weapons, 5 javelins or simple weapon, priest's pack or explorer's pack, chain mail, holy symbol
- Ranger: scale mail or leather armor, two shortswords or two simple melee weapons, dungeoneer's pack or explorer's pack, longbow, quiver of 20 arrows
- Rogue: rapier or shortsword, shortbow or shortsword, burglar's pack or dungeoneer's pack or explorer's pack, leather armor, two daggers, thieves' tools
- Sorcerer: light crossbow or simple weapon, component pouch or arcane focus, dungeoneer's pack or explorer's pack, two daggers
- Warlock: light crossbow or simple weapon, component pouch or arcane focus, scholar's pack or dungeoneer's pack, leather armor, simple weapon, two daggers
- Wizard: quarterstaff or dagger, component pouch or arcane focus, scholar's pack or explorer's pack, spellbook`
    );
  }

  /** Add spellcasting rules */
  addSpellcastingRules(): this {
    return this.addSection('spellcasting_rules',
      `SPELLCASTING RULES:
- Only the following classes have spellcasting: Bard(CHA), Cleric(WIS), Druid(WIS), Paladin(CHA), Ranger(WIS), Sorcerer(CHA), Warlock(CHA), Wizard(INT)
- Paladins and Rangers prepare spells (know all spells on list of appropriate level)
- Bards and Sorcerers know a limited number of spells from their list

AT LEVEL 1:
- Bard: 2 cantrips known, 4 spells known, 2 first-level slots
- Cleric: 3 cantrips, prepare (Wis mod + level) spells from cleric list, 2 first-level slots
- Druid: 2 cantrips, prepare (Wis mod + level) spells from druid list, 2 first-level slots
- Sorcerer: 4 cantrips known, 2 spells known, 2 first-level slots, 2 sorcery points
- Warlock: 2 cantrips known, 2 spells known, 1 pact magic slot (1st level)
- Wizard: 3 cantrips, 6 spells in spellbook (prepared Int mod + level), 2 first-level slots
- Paladin at level 1: no spell slots yet (spellcasting at level 2)
- Ranger at level 1: no spell slots yet (spellcasting at level 2)

Spell save DC = 8 + proficiency bonus + spellcasting ability modifier
Spell attack bonus = proficiency bonus + spellcasting ability modifier

If the class is NOT a spellcaster, set spellcastingAbility to null, spells/cantrips to empty arrays, spellSlots to empty`
    );
  }

  /** Add languages and proficiencies rules */
  addProficiencyRules(): this {
    return this.addSection('proficiency_rules',
      `LANGUAGES & PROFICIENCIES:
LANGUAGES (based on race + background):
- All characters know Common
- Dwarf: Dwarvish; Elf: Elvish; Halfling: Halfling; Dragonborn: Draconic; Gnome: Gnomish; Half-Elf: Elvish + one extra; Half-Orc: Orc; Tiefling: Infernal
- Backgrounds may grant additional languages (Acolyte gets 2 extra, etc.)

OTHER PROFICIENCIES (include ALL of these):
- Armor proficiencies: "Light armor", "Medium armor", "Heavy armor", "Shields"
- Weapon proficiencies: "Simple weapons", "Martial weapons"
- Tool proficiencies: e.g. "Thieves' tools", "Musical instrument (lute)", "Alchemist's supplies", "Calligrapher's tools", "Carpenter's tools", "Cartographer's tools", "Cobbler's tools", "Cook's utensils", "Glassblower's tools", "Jeweler's tools", "Leatherworker's tools", "Mason's tools", "Painter's tools", "Potter's tools", "Smith's tools", "Tinker's tools", "Weaver's tools", "Woodcarver's tools", "Disguise kit", "Forgery kit", "Herbalism kit", "Navigator's tools", "Poisoner's kit", "Thieves' tools", "Dice set", "Dragonchess set", "Playing cards", "Three-Dragon Ante set"
- Vehicle proficiencies: "Land vehicles", "Water vehicles"
- Saving throw proficiencies are already in the savingThrows array
- Skill proficiencies are already in the skills array`
    );
  }

  /** Add creativity instructions */
  addCreativityRules(): this {
    return this.addSection('creativity_rules',
      `CREATIVITY & FLAVOR:
- Generate a creative name that fits the race and concept
- Personality traits, ideals, bonds, and flaws should be interesting and specific to the concept
- Backstory should be 2-4 sentences that explain who the character is and why they adventure
- Physical appearance should be described in 1-2 sentences
- Fill in age, height, weight, eyes, skin, hair appropriately for the race`
    );
  }

  /** Build the final prompt string */
  build(): string {
    return this.order
      .map(key => this.sections.get(key)!)
      .join('\n\n');
  }

  /** Reset the builder */
  clear(): this {
    this.sections.clear();
    this.order = [];
    return this;
  }
}