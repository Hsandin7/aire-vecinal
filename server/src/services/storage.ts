import fs from 'fs';
import path from 'path';
import type { UserPreferences } from '../types.js';
import { DEFAULT_USER_PREFERENCES } from '../data/mockData.js';

const STORAGE_FILE = path.resolve(process.cwd(), 'server', 'data', 'user_profile.json');

// Memoria interna inicializada con preferencias por defecto
let memoryPreferences: UserPreferences = { ...DEFAULT_USER_PREFERENCES };

// Intentar cargar del archivo si existe
try {
  if (fs.existsSync(STORAGE_FILE)) {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
    memoryPreferences = JSON.parse(raw);
  }
} catch (e) {
  console.warn('[Storage] Usando almacenamiento en memoria (no se pudo leer archivo):', e);
}

export function getUserPreferences(): UserPreferences {
  return { ...memoryPreferences };
}

export function saveUserPreferences(prefs: Partial<UserPreferences>): UserPreferences {
  memoryPreferences = {
    ...memoryPreferences,
    ...prefs,
    notificationHours: {
      ...memoryPreferences.notificationHours,
      ...(prefs.notificationHours || {}),
    },
  };

  // Intentar persistir en disco
  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(memoryPreferences, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Storage] Error al persistir archivo JSON, datos preservados en memoria:', err);
  }

  return memoryPreferences;
}
