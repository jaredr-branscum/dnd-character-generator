import React, { useState, useCallback } from 'react';
import { Character } from './types';
import { calculateModifier, getModifierString, ALL_ABILITIES, SKILLS } from './abilityUtils';
import { sanitizeText, sanitizeNumber as secureSanitizeNumber } from './utils/security';

interface CharacterSheetProps {
  character: Character;
  onBack: () => void;
  onUpdate?: (character: Character) => void;
}

type EditableField = 
  | { type: 'basic'; field: 'name' | 'race' | 'subrace' | 'class' | 'background' | 'alignment' | 'playerName' }
  | { type: 'ability'; field: keyof Character['abilityScores'] }
  | { type: 'skill'; index: number; field: 'proficient' | 'expertise' }
  | { type: 'combat'; field: 'armorClass' | 'initiative' | 'speed' | 'hitPointCurrent' | 'hitPointTemp' }
  | { type: 'personality'; field: 'personalityTraits' | 'ideals' | 'bonds' | 'flaws' }
  | { type: 'appearance'; field: 'age' | 'height' | 'weight' | 'eyes' | 'skin' | 'hair' | 'appearance' | 'backstory' };

/** Convert an EditableField to a unique string key for comparison */
function fieldKey(f: EditableField): string {
  if (f.type === 'basic' || f.type === 'ability' || f.type === 'combat' || f.type === 'personality' || f.type === 'appearance') {
    return `${f.type}-${f.field}`;
  }
  if (f.type === 'skill') {
    return `skill-${f.index}-${f.field}`;
  }
  return 'unknown';
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, onBack, onUpdate }) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [localCharacter, setLocalCharacter] = useState<Character>(() => ({
    ...character,
    languages: character.languages || [],
    otherProficiencies: character.otherProficiencies || [],
    attacks: character.attacks || [],
    skills: character.skills || [],
    savingThrows: character.savingThrows || [],
    equipment: character.equipment || [],
    features: character.features || [],
    racialTraits: character.racialTraits || [],
    classFeatures: character.classFeatures || [],
    cantrips: character.cantrips || [],
    spells: character.spells || [],
    spellSlots: character.spellSlots || [],
  }));

  const toggleInspiration = useCallback(() => {
    const updated = { ...localCharacter, inspiration: !localCharacter.inspiration };
    setLocalCharacter(updated);
    onUpdate?.(updated);
  }, [localCharacter, onUpdate]);

  // Sync with prop changes, ensuring arrays are never undefined
  React.useEffect(() => {
    setLocalCharacter({
      ...character,
      languages: character.languages || [],
      otherProficiencies: character.otherProficiencies || [],
      attacks: character.attacks || [],
      skills: character.skills || [],
      savingThrows: character.savingThrows || [],
      equipment: character.equipment || [],
      features: character.features || [],
      racialTraits: character.racialTraits || [],
      classFeatures: character.classFeatures || [],
      cantrips: character.cantrips || [],
      spells: character.spells || [],
      spellSlots: character.spellSlots || [],
    });
  }, [character]);

  const startEdit = useCallback((field: EditableField, currentValue: any) => {
    setEditingField(field);
    setEditingKey(fieldKey(field));
    setEditValue(typeof currentValue === 'boolean' ? (currentValue ? 'true' : 'false') : String(currentValue));
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingField) return;

    const updated = { ...localCharacter };

    if (editingField.type === 'basic') {
      // Sanitize text fields to prevent XSS
      (updated as any)[editingField.field] = sanitizeText(editValue, 100);
    } else if (editingField.type === 'ability') {
      const num = secureSanitizeNumber(editValue, 1, 20, 10);
      updated.abilityScores[editingField.field] = num;
    } else if (editingField.type === 'skill') {
      const newSkills = [...updated.skills];
      if (editingField.field === 'proficient') {
        newSkills[editingField.index] = { ...newSkills[editingField.index], proficient: editValue === 'true' };
      } else {
        newSkills[editingField.index] = { ...newSkills[editingField.index], expertise: editValue === 'true' };
      }
      updated.skills = newSkills;
    } else if (editingField.type === 'combat') {
      if (editingField.field === 'armorClass') updated.armorClass = secureSanitizeNumber(editValue, 0, 30, 10);
      else if (editingField.field === 'initiative') updated.initiative = secureSanitizeNumber(editValue, -10, 10, 0);
      else if (editingField.field === 'speed') updated.speed = secureSanitizeNumber(editValue, 0, 120, 30);
      else if (editingField.field === 'hitPointCurrent') updated.hitPointCurrent = Math.max(0, secureSanitizeNumber(editValue, 0, 999, 1));
      else if (editingField.field === 'hitPointTemp') updated.hitPointTemp = Math.max(0, secureSanitizeNumber(editValue, 0, 999, 0));
    } else if (editingField.type === 'personality' || editingField.type === 'appearance') {
      // Sanitize long-form text fields
      (updated as any)[editingField.field] = sanitizeText(editValue, 2000);
    }

    setLocalCharacter(updated);
    onUpdate?.(updated);
    setEditingKey(null);
    setEditingField(null);
  }, [editingField, editValue, localCharacter, onUpdate]);

  const cancelEdit = useCallback(() => {
    setEditingKey(null);
    setEditingField(null);
  }, []);

  const handleDownloadJSON = () => {
    const json = JSON.stringify(localCharacter, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${localCharacter.name.replace(/\s+/g, '_')}_DnD5e.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    const json = JSON.stringify(localCharacter, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      alert('Character JSON copied to clipboard!');
    });
  };

  const EditableText: React.FC<{ field: EditableField; value: string; className?: string }> = ({ field, value, className = '' }) => {
    if (editingKey === fieldKey(field)) {
      return (
        <input
          type="text"
          className={`editable-input ${className}`}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          autoFocus
        />
      );
    }
    return (
      <span className={`editable-text ${className}`} onClick={() => startEdit(field, value)} title="Click to edit">
        {value || <em className="text-muted">empty</em>}
      </span>
    );
  };

  const EditableNumber: React.FC<{ field: EditableField; value: number; className?: string }> = ({ field, value, className = '' }) => {
    if (editingKey === fieldKey(field)) {
      return (
        <input
          type="number"
          className={`editable-input ${className}`}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          autoFocus
        />
      );
    }
    return (
      <span className={`editable-text ${className}`} onClick={() => startEdit(field, value)} title="Click to edit">
        {value}
      </span>
    );
  };

  const EditableBoolean: React.FC<{ field: EditableField; value: boolean; className?: string }> = ({ field, value, className = '' }) => {
    if (editingKey === fieldKey(field)) {
      return (
        <select
          className={`editable-input ${className}`}
          value={editValue}
          onChange={(e) => { setEditValue(e.target.value); commitEdit(); }}
          onBlur={commitEdit}
          autoFocus
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }
    return (
      <span 
        className={`editable-badge ${value ? 'badge-proficient' : 'badge-normal'} ${className}`} 
        onClick={() => startEdit(field, value)}
        title="Click to toggle"
      >
        {value ? '✓' : '—'}
      </span>
    );
  };

  return (
    <div className="character-sheet">
        <div className="sheet-header">
          <button className="btn btn-back" onClick={onBack}>← Back</button>
          <div className="inspiration-toggle" onClick={toggleInspiration} title="Click to toggle inspiration">
            <span className="inspiration-label">Inspiration</span>
            <span className={`inspiration-badge ${localCharacter.inspiration ? 'active' : ''}`}>
              {localCharacter.inspiration ? '★' : '☆'}
            </span>
          </div>
          <h1 className="character-name">
          <EditableText 
            field={{ type: 'basic', field: 'name' }} 
            value={localCharacter.name} 
            className="editable-name"
          />
        </h1>
        <div className="character-subtitle">
          <EditableText field={{ type: 'basic', field: 'race' }} value={localCharacter.race} />
          {localCharacter.subrace && localCharacter.subrace !== 'null' && (
            <span className="subrace"> (<EditableText field={{ type: 'basic', field: 'subrace' }} value={localCharacter.subrace} />)</span>
          )}
          <span> &middot; <EditableText field={{ type: 'basic', field: 'class' }} value={localCharacter.class} /> &middot; Level {localCharacter.level}</span>
        </div>
        <div className="sheet-actions">
          <button className="btn btn-primary" onClick={handleDownloadJSON}>Download JSON</button>
          <button className="btn btn-secondary" onClick={handleCopyJSON}>Copy JSON</button>
        </div>
      </div>

      <div className="sheet-body">
        {/* Left Column - Stats */}
        <div className="sheet-left">
          {/* Ability Scores */}
          <div className="section abilities-section">
            <h2 className="section-title">Ability Scores</h2>
            <div className="abilities-grid">
              {ALL_ABILITIES.map(({ key, label, short }) => {
                const score = localCharacter.abilityScores[key];
                const mod = calculateModifier(score);
                return (
                  <div key={key} className="ability-card">
                    <div className="ability-label">{short}</div>
                    <div className="ability-score">
                      <EditableNumber 
                        field={{ type: 'ability', field: key }} 
                        value={score} 
                      />
                    </div>
                    <div className="ability-modifier">{mod >= 0 ? `+${mod}` : mod}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Combat Stats */}
          <div className="section combat-section">
            <h2 className="section-title">Combat</h2>
            <div className="combat-grid">
              <div className="combat-stat">
                <span className="stat-label">AC</span>
                <span className="stat-value">
                  <EditableNumber field={{ type: 'combat', field: 'armorClass' }} value={localCharacter.armorClass} />
                </span>
              </div>
              <div className="combat-stat">
                <span className="stat-label">Initiative</span>
                <span className="stat-value">
                  <EditableNumber field={{ type: 'combat', field: 'initiative' }} value={localCharacter.initiative} />
                </span>
              </div>
              <div className="combat-stat">
                <span className="stat-label">Speed</span>
                <span className="stat-value">
                  <EditableNumber field={{ type: 'combat', field: 'speed' }} value={localCharacter.speed} /> ft
                </span>
              </div>
              <div className="combat-stat">
                <span className="stat-label">Prof. Bonus</span>
                <span className="stat-value">+{localCharacter.proficiencyBonus}</span>
              </div>
            </div>
            <div className="hp-section">
              <div className="hp-header">Hit Points</div>
              <div className="hp-values">
                <span className="hp-current">
                  <EditableNumber field={{ type: 'combat', field: 'hitPointCurrent' }} value={localCharacter.hitPointCurrent} />
                </span>
                <span className="hp-separator">/</span>
                <span className="hp-max">{localCharacter.hitPointMaximum}</span>
                {localCharacter.hitPointTemp > 0 && (
                  <span className="hp-temp">+<EditableNumber field={{ type: 'combat', field: 'hitPointTemp' }} value={localCharacter.hitPointTemp} /> temp</span>
                )}
              </div>
              <div className="hit-dice">
                Hit Dice: {localCharacter.hitDice.dieCount}d{localCharacter.hitDice.dieSize}
              </div>
            </div>
          </div>

          {/* Saving Throws */}
          <div className="section saves-section">
            <h2 className="section-title">Saving Throws</h2>
            <div className="saves-list">
              {localCharacter.savingThrows.map((st) => {
                const ab = ALL_ABILITIES.find(a => a.key === st.ability);
                const mod = calculateModifier(localCharacter.abilityScores[st.ability]);
                const total = st.proficient ? mod + localCharacter.proficiencyBonus : mod;
                return (
                  <div key={st.ability} className={`save-item ${st.proficient ? 'proficient' : ''}`}>
                    <span className="save-ability">{ab?.short || st.ability.toUpperCase()}</span>
                    <span className="save-total">{total >= 0 ? `+${total}` : total}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          <div className="section skills-section">
            <h2 className="section-title">Skills</h2>
            <div className="skills-list">
              {SKILLS.map((skillDef) => {
                const charSkill = localCharacter.skills.find(s => s.name === skillDef.name);
                const proficient = charSkill?.proficient || false;
                const expertise = charSkill?.expertise || false;
                const mod = calculateModifier(localCharacter.abilityScores[skillDef.ability]);
                const profBonus = expertise ? localCharacter.proficiencyBonus * 2 : proficient ? localCharacter.proficiencyBonus : 0;
                const total = mod + profBonus;
                const skillIdx = localCharacter.skills.findIndex(s => s.name === skillDef.name);

                const toggleProficient = () => {
                  const updated = { ...localCharacter };
                  const newSkills = [...updated.skills];
                  const existingIdx = newSkills.findIndex(s => s.name === skillDef.name);
                  if (existingIdx >= 0) {
                    newSkills[existingIdx] = { ...newSkills[existingIdx], proficient: !proficient };
                  } else {
                    newSkills.push({ name: skillDef.name, ability: skillDef.ability, proficient: true, expertise: false });
                  }
                  updated.skills = newSkills;
                  setLocalCharacter(updated);
                  onUpdate?.(updated);
                };

                const toggleExpertise = () => {
                  const updated = { ...localCharacter };
                  const newSkills = [...updated.skills];
                  const existingIdx = newSkills.findIndex(s => s.name === skillDef.name);
                  if (existingIdx >= 0) {
                    newSkills[existingIdx] = { ...newSkills[existingIdx], expertise: !expertise };
                  } else {
                    newSkills.push({ name: skillDef.name, ability: skillDef.ability, proficient: true, expertise: true });
                  }
                  updated.skills = newSkills;
                  setLocalCharacter(updated);
                  onUpdate?.(updated);
                };

                return (
                  <div 
                    key={skillDef.name} 
                    className={`skill-item ${proficient ? 'proficient' : ''} ${expertise ? 'expertise' : ''}`}
                  >
                    <span 
                      className={`skill-toggle ${proficient ? 'toggle-on' : 'toggle-off'}`}
                      onClick={toggleProficient}
                      title={proficient ? 'Click to remove proficiency' : 'Click to add proficiency'}
                    >
                      {proficient ? '●' : '○'}
                    </span>
                    <span 
                      className={`skill-toggle ${expertise ? 'toggle-on' : 'toggle-off'}`}
                      onClick={toggleExpertise}
                      title={expertise ? 'Click to remove expertise' : 'Click to add expertise'}
                    >
                      {expertise ? '◆' : '◇'}
                    </span>
                    <span className="skill-mod">{mod >= 0 ? `+${mod}` : mod}</span>
                    {proficient && <span className="skill-prof">+{profBonus}</span>}
                    <span className="skill-total">{total >= 0 ? `+${total}` : total}</span>
                    <span className="skill-name">{skillDef.name}</span>
                    <span className="skill-ability">({skillDef.ability.substring(0, 3).toUpperCase()})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="sheet-right">
          {/* Basic Info */}
          <div className="section info-section">
            <h2 className="section-title">Character Info</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Background</span>
                <span className="info-value"><EditableText field={{ type: 'basic', field: 'background' }} value={localCharacter.background} /></span>
              </div>
              <div className="info-item">
                <span className="info-label">Alignment</span>
                <span className="info-value"><EditableText field={{ type: 'basic', field: 'alignment' }} value={localCharacter.alignment} /></span>
              </div>
              <div className="info-item">
                <span className="info-label">XP</span>
                <span className="info-value">{localCharacter.experiencePoints.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Hit Dice</span>
                <span className="info-value">{localCharacter.hitDice.dieCount}d{localCharacter.hitDice.dieSize}</span>
              </div>
            </div>
          </div>

          {/* Spellcasting */}
          {localCharacter.spellcastingAbility && (
            <div className="section spells-section">
              <h2 className="section-title">Spellcasting</h2>
              <div className="spell-stats">
                <div className="spell-stat">
                  <span>Spell Save DC</span>
                  <strong>{localCharacter.spellSaveDC}</strong>
                </div>
                <div className="spell-stat">
                  <span>Spell Attack</span>
                  <strong>{localCharacter.spellAttackBonus >= 0 ? `+${localCharacter.spellAttackBonus}` : localCharacter.spellAttackBonus}</strong>
                </div>
              </div>
              {localCharacter.cantrips.length > 0 && (
                <div className="spell-list">
                  <h3>Cantrips</h3>
                  {localCharacter.cantrips.map((spell, i) => (
                    <div key={i} className="spell-item">
                      <span className="spell-name">{spell.name}</span>
                      <span className="spell-detail">{spell.school}</span>
                    </div>
                  ))}
                </div>
              )}
              {localCharacter.spells.length > 0 && (
                <div className="spell-list">
                  <h3>Spells</h3>
                  {localCharacter.spells.map((spell, i) => (
                    <div key={i} className="spell-item">
                      <span className="spell-name">{spell.name}</span>
                      <span className="spell-level">Lv.{spell.level} {spell.school}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Equipment */}
          <div className="section equipment-section">
            <h2 className="section-title">Equipment</h2>
            <div className="equipment-list">
              {localCharacter.equipment.map((item, i) => (
                <div key={i} className="equipment-item">
                  <span className="equip-name">{item.name}</span>
                  {item.quantity > 1 && <span className="equip-qty">x{item.quantity}</span>}
                </div>
              ))}
            </div>
            <div className="money">
              <span>{localCharacter.platinum} PP</span>
              <span>{localCharacter.gold} GP</span>
              <span>{localCharacter.electrum} EP</span>
              <span>{localCharacter.silver} SP</span>
              <span>{localCharacter.copper} CP</span>
            </div>
          </div>

          {/* Attacks & Spellcasting */}
          {localCharacter.attacks.length > 0 && (
            <div className="section attacks-section">
              <h2 className="section-title">Attacks & Spellcasting</h2>
              <table className="attacks-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Atk Bonus</th>
                    <th>Damage</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {localCharacter.attacks.map((attack, i) => (
                    <tr key={i}>
                      <td className="attack-name">{attack.name}</td>
                      <td className="attack-bonus">{attack.attackBonus >= 0 ? `+${attack.attackBonus}` : attack.attackBonus}</td>
                      <td className="attack-damage">{attack.damage}</td>
                      <td className="attack-type">{attack.damageType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Languages & Proficiencies */}
          <div className="section languages-section">
            <h2 className="section-title">Languages & Proficiencies</h2>
            <div className="proficiency-group">
              <h3>Languages</h3>
              <div className="proficiency-list">
                {(localCharacter.languages || []).map((lang, i) => (
                  <span key={i} className="proficiency-tag">{lang}</span>
                ))}
                {(localCharacter.languages || []).length === 0 && (
                  <span className="proficiency-tag proficiency-empty">None</span>
                )}
              </div>
            </div>
            <div className="proficiency-group">
              <h3>Other Proficiencies</h3>
              <div className="proficiency-list">
                {(localCharacter.otherProficiencies || []).map((prof, i) => (
                  <span key={i} className="proficiency-tag">{prof}</span>
                ))}
                {(localCharacter.otherProficiencies || []).length === 0 && (
                  <span className="proficiency-tag proficiency-empty">None</span>
                )}
              </div>
            </div>
          </div>

          {/* Features & Traits */}
          <div className="section features-section">
            <h2 className="section-title">Features & Traits</h2>
            {localCharacter.features.map((feature, i) => (
              <div key={i} className="feature-item">
                <div className="feature-header">
                  <strong className="feature-name">{feature.name}</strong>
                  <span className="feature-source">{feature.source}</span>
                </div>
                <p className="feature-desc">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Personality */}
          <div className="section personality-section">
            <h2 className="section-title">Personality</h2>
            <div className="personality-grid">
              <div className="pers-item">
                <strong>Traits</strong>
                <p><EditableText field={{ type: 'personality', field: 'personalityTraits' }} value={localCharacter.personalityTraits} /></p>
              </div>
              <div className="pers-item">
                <strong>Ideals</strong>
                <p><EditableText field={{ type: 'personality', field: 'ideals' }} value={localCharacter.ideals} /></p>
              </div>
              <div className="pers-item">
                <strong>Bonds</strong>
                <p><EditableText field={{ type: 'personality', field: 'bonds' }} value={localCharacter.bonds} /></p>
              </div>
              <div className="pers-item">
                <strong>Flaws</strong>
                <p><EditableText field={{ type: 'personality', field: 'flaws' }} value={localCharacter.flaws} /></p>
              </div>
            </div>
          </div>

          {/* Appearance & Backstory */}
          <div className="section appearance-section">
            <h2 className="section-title">Appearance & Backstory</h2>
            <div className="appearance-details">
              <p>
                <strong>Age:</strong> <EditableText field={{ type: 'appearance', field: 'age' }} value={localCharacter.age} /> &middot; 
                <strong>Height:</strong> <EditableText field={{ type: 'appearance', field: 'height' }} value={localCharacter.height} /> &middot; 
                <strong>Weight:</strong> <EditableText field={{ type: 'appearance', field: 'weight' }} value={localCharacter.weight} />
              </p>
              <p>
                <strong>Eyes:</strong> <EditableText field={{ type: 'appearance', field: 'eyes' }} value={localCharacter.eyes} /> &middot; 
                <strong>Skin:</strong> <EditableText field={{ type: 'appearance', field: 'skin' }} value={localCharacter.skin} /> &middot; 
                <strong>Hair:</strong> <EditableText field={{ type: 'appearance', field: 'hair' }} value={localCharacter.hair} />
              </p>
            </div>
            <p className="backstory-text"><strong>Appearance:</strong> <EditableText field={{ type: 'appearance', field: 'appearance' }} value={localCharacter.appearance} /></p>
            <p className="backstory-text"><strong>Backstory:</strong> <EditableText field={{ type: 'appearance', field: 'backstory' }} value={localCharacter.backstory} /></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet;