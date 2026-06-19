/**
 * Security utilities for input sanitization, rate limiting, and output sanitization.
 * Designed for GitHub Pages hosting.
 */

// ===== Input Sanitization =====

/**
 * Sanitize user text input to prevent XSS.
 * Strips HTML tags, encodes special characters, limits length.
 */
export function sanitizeText(input: string, maxLength: number = 5000): string {
  if (typeof input !== 'string') return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove HTML tags (basic XSS prevention)
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove null bytes and control characters (except newlines/tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Sanitize a number input to ensure it's a safe integer within bounds.
 */
export function sanitizeNumber(value: any, min: number, max: number, fallback: number): number {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < min || num > max) {
    return fallback;
  }
  return num;
}

/**
 * Sanitize a string to ensure it only contains allowed characters.
 */
export function sanitizeAlphanumeric(input: string, allowSpaces: boolean = true): string {
  const pattern = allowSpaces ? /[^a-zA-Z0-9\s\-']/g : /[^a-zA-Z0-9\-']/g;
  return input.replace(pattern, '').trim();
}

// ===== Rate Limiting =====

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // max 10 requests per minute

/**
 * Check if a request should be rate-limited.
 * Returns true if the request is allowed, false if rate-limited.
 */
export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    // New window or expired window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    console.warn(`Rate limit exceeded for ${identifier}`);
    return false;
  }
  
  entry.count++;
  return true;
}

/**
 * Get remaining time until rate limit resets (in seconds).
 */
export function getRateLimitRemaining(identifier: string): number {
  const entry = rateLimitMap.get(identifier);
  if (!entry) return 0;
  
  const remaining = entry.resetTime - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
}

// ===== Output Sanitization =====

/**
 * Sanitize character data before displaying or exporting.
 * Ensures no malicious content in character fields.
 */
export function sanitizeCharacter(character: any): any {
  if (!character || typeof character !== 'object') {
    return character;
  }
  
  const sanitized = { ...character };
  
  // Sanitize text fields
  const textFields = [
    'name', 'race', 'subrace', 'class', 'subclass', 'background', 'alignment',
    'playerName', 'personalityTraits', 'ideals', 'bonds', 'flaws',
    'age', 'height', 'weight', 'eyes', 'skin', 'hair', 'appearance', 'backstory',
    'characterNotes', 'alliesAndOrganizations',
  ];

  // Sanitize inspiration
  if (sanitized.inspiration !== undefined) {
    sanitized.inspiration = Boolean(sanitized.inspiration);
  }

  // Sanitize attacks array
  if (Array.isArray(sanitized.attacks)) {
    sanitized.attacks = sanitized.attacks.map((attack: any) => {
      const safe: any = {};
      safe.name = sanitizeText(String(attack.name || ''), 100);
      safe.attackBonus = sanitizeNumber(attack.attackBonus, -10, 20, 0);
      safe.damage = sanitizeText(String(attack.damage || ''), 50);
      safe.damageType = sanitizeText(String(attack.damageType || ''), 50);
      if (attack.properties) safe.properties = sanitizeText(String(attack.properties), 100);
      return safe;
    });
  }
  
  for (const field of textFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = sanitizeText(String(sanitized[field]), 2000);
    }
  }
  
  // Sanitize arrays of text
  const arrayFields = [
    'skills', 'savingThrows', 'otherProficiencies', 'equipment',
    'features', 'racialTraits', 'classFeatures', 'cantrips', 'spells', 'spellSlots',
  ];
  
  for (const field of arrayFields) {
    if (Array.isArray(sanitized[field])) {
      sanitized[field] = sanitized[field].map((item: any) => {
        if (typeof item === 'string') {
          return sanitizeText(item, 1000);
        }
        if (typeof item === 'object' && item !== null) {
          const sanitizedItem = { ...item };
          for (const key of Object.keys(sanitizedItem)) {
            if (typeof sanitizedItem[key] === 'string') {
              sanitizedItem[key] = sanitizeText(sanitizedItem[key], 1000);
            }
          }
          return sanitizedItem;
        }
        return item;
      });
    }
  }
  
  // Sanitize ability scores
  if (sanitized.abilityScores && typeof sanitized.abilityScores === 'object') {
    const scores: any = {};
    for (const [key, value] of Object.entries(sanitized.abilityScores)) {
      scores[key] = sanitizeNumber(value, 1, 20, 10);
    }
    sanitized.abilityScores = scores;
  }
  
  // Sanitize numeric fields
  const numericFields = [
    'level', 'experiencePoints', 'armorClass', 'initiative', 'speed',
    'hitPointMaximum', 'hitPointCurrent', 'hitPointTemp', 'proficiencyBonus',
    'spellSaveDC', 'spellAttackBonus',
  ];
  
  for (const field of numericFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = sanitizeNumber(sanitized[field], -100, 999, 0);
    }
  }
  
  // Sanitize currency
  const currencyFields = ['copper', 'silver', 'electrum', 'gold', 'platinum'];
  for (const field of currencyFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = Math.max(0, sanitizeNumber(sanitized[field], 0, 999999, 0));
    }
  }
  
  // Sanitize hit dice
  if (sanitized.hitDice && typeof sanitized.hitDice === 'object') {
    sanitized.hitDice = {
      dieCount: sanitizeNumber(sanitized.hitDice.dieCount, 0, 20, 1),
      dieSize: sanitizeNumber(sanitized.hitDice.dieSize, 0, 20, 8),
      used: sanitizeNumber(sanitized.hitDice.used, 0, 20, 0),
    };
  }
  
  // Sanitize death saves
  if (sanitized.deathSaveSuccesses !== undefined) {
    sanitized.deathSaveSuccesses = sanitizeNumber(sanitized.deathSaveSuccesses, 0, 3, 0);
  }
  if (sanitized.deathSaveFailures !== undefined) {
    sanitized.deathSaveFailures = sanitizeNumber(sanitized.deathSaveFailures, 0, 3, 0);
  }
  
  return sanitized;
}

// ===== Content Validation =====

/**
 * Validate that a string doesn't contain suspicious patterns.
 */
export function validateContentSafety(content: string): { safe: boolean; reason?: string } {
  if (!content || typeof content !== 'string') {
    return { safe: true };
  }
  
  const lower = content.toLowerCase();
  
  // Check for script tags
  if (/<script\b/i.test(content)) {
    return { safe: false, reason: 'Script tags not allowed' };
  }
  
  // Check for event handlers
  if (/on\w+\s*=/i.test(content)) {
    return { safe: false, reason: 'Event handlers not allowed' };
  }
  
  // Check for javascript: protocol
  if (/javascript\s*:/i.test(content)) {
    return { safe: false, reason: 'JavaScript protocol not allowed' };
  }
  
  // Check for data: protocol (potential XSS vector)
  if (/data\s*:\s*text\/html/i.test(content)) {
    return { safe: false, reason: 'Data URI with HTML not allowed' };
  }
  
  return { safe: true };
}

/**
 * Validate that a URL is safe to use.
 */
export function validateUrl(url: string): { safe: boolean; reason?: string } {
  if (!url || typeof url !== 'string') {
    return { safe: false, reason: 'Invalid URL' };
  }
  
  // Only allow http(s) and data URIs for images
  const allowedProtocols = ['http:', 'https:', 'data:'];
  try {
    const parsed = new URL(url);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return { safe: false, reason: `Protocol ${parsed.protocol} not allowed` };
    }
    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }
}