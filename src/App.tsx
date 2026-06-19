import React, { useState, useCallback } from 'react';
import { Character } from './types';
import { CharacterGenerator } from './CharacterGenerator';
import CharacterSheet from './CharacterSheet';
import { getOrchestrator, ValidationError } from './services/CharacterOrchestrator';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationInfo, setValidationInfo] = useState<{ errors: ValidationError[]; warnings: ValidationError[] } | null>(null);

  const handleGenerate = useCallback(async (prompt: string) => {
    setLoading(true);
    setError(null);
    setCharacter(null);
    setValidationInfo(null);

    try {
      const orchestrator = getOrchestrator();
      const result = await orchestrator.generateCharacter(prompt);
      setCharacter(result.character);
      if (result.validation.errors.length > 0 || result.validation.warnings.length > 0) {
        setValidationInfo({
          errors: result.validation.errors,
          warnings: result.validation.warnings,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate character. Please try again.');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setCharacter(null);
    setError(null);
  }, []);

  return (
    <div className="app">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner-large"></div>
            <h2>Crafting Your Character...</h2>
            <p>The AI is weaving together stats, skills, spells, and story to bring your concept to life.</p>
          </div>
        </div>
      )}

      {!character && !loading && (
        <CharacterGenerator onGenerate={handleGenerate} loading={loading} />
      )}

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {character && !loading && (
        <CharacterSheet 
          character={character} 
          onBack={handleBack} 
          onUpdate={(updated) => {
            setCharacter(updated);
            setValidationInfo(null);
          }} 
        />
      )}
    </div>
  );
};

export default App;