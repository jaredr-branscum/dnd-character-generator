import React, { useState } from 'react';
import { sanitizeText, checkRateLimit } from './utils/security';

interface CharacterGeneratorProps {
  onGenerate: (prompt: string) => void;
  loading: boolean;
}

const EXAMPLE_PROMPTS = [
  'A sneaky halfling rogue who used to be a circus performer',
  'A disciplined elven wizard who studies ancient dragon magic',
  'A fierce dwarven barbarian seeking revenge for their fallen clan',
  'A charming half-elf bard who sings tales of heroic adventures',
  'A mysterious tiefling warlock bound to a shadowy patron',
  'A wise old human cleric who serves the god of knowledge',
  'A nimble gnome artificer who builds clockwork contraptions',
  'A stoic dragonborn paladin on a holy crusade',
];

export const CharacterGenerator: React.FC<CharacterGeneratorProps> = ({ onGenerate, loading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;
    
    // Rate limit check
    const rateLimitKey = 'generate_' + (window.location.hostname || 'local');
    if (!checkRateLimit(rateLimitKey)) {
      alert('Too many requests. Please wait a moment before trying again.');
      return;
    }
    
    // Sanitize input before sending
    const sanitized = sanitizeText(trimmed, 2000);
    if (sanitized.length < 3) {
      alert('Please provide a more detailed character description (at least 3 characters).');
      return;
    }
    
    onGenerate(sanitized);
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="generator">
      <div className="generator-header">
        <h1 className="generator-title">D&D 5e Character Generator</h1>
        <p className="generator-subtitle">
          Describe the character you want to play, and AI will generate a fully-functional D&D 5th Edition character sheet.
        </p>
        <p className="generator-hint">
          Be as specific or as vague as you like — from "a brave knight" to "a gnome necromancer with a pet frog named Gribbles who speaks in rhyme."
        </p>
      </div>

      <form className="generator-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <textarea
            className="prompt-input"
            placeholder="Describe your character concept..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            disabled={loading}
          />
          <button
            className="btn btn-generate"
            type="submit"
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <span className="loading-spinner">
                <span className="spinner"></span>
                Generating...
              </span>
            ) : (
              'Generate Character'
            )}
          </button>
        </div>
      </form>

      <div className="examples-section">
        <h2 className="examples-title">Example Prompts</h2>
        <div className="examples-grid">
          {EXAMPLE_PROMPTS.map((example, i) => (
            <button
              key={i}
              className="example-chip"
              onClick={() => handleExampleClick(example)}
              disabled={loading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="features-section">
        <h2 className="features-title">What You Get</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🎭</span>
            <h3>Complete Character</h3>
            <p>Race, class, stats, skills, equipment, spells & more — all mechanically valid per 5e rules.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🤖</span>
            <h3>AI-Powered</h3>
            <p>Uses Puter.js AI to interpret your concept and create a unique character tailored to your description.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📄</span>
            <h3>Export & Integrate</h3>
            <p>Download JSON or copy to clipboard. Use the structured data with any VTT, app, or tool that accepts 5e character data.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🎲</span>
            <h3>Ready to Play</h3>
            <p>Every character is level 1 and ready for your next session. Personality, backstory, and appearance included.</p>
          </div>
        </div>
      </div>
    </div>
  );
};