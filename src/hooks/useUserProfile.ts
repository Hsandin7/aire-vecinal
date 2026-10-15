import { useState, useCallback } from 'react';
import type { UserProfile } from '../types';

const LOCAL_STORAGE_KEY = 'airevecinal_user_profile';
const ONBOARDING_KEY = 'airevecinal_onboarding_completed';

const DEFAULT_PROFILE: UserProfile = {
  profile: 'deportista',
  hasAsthma: true,
  favoriteZones: ['28079008'], // Escuelas Aguirre por defecto
  alertTypes: 'all',
  notificationHours: {
    start: '07:30',
    end: '22:00',
  },
};

function readStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[LocalStorage] No se pudo leer perfil:', err);
  }
  return DEFAULT_PROFILE;
}

function readOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(readStoredProfile);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(readOnboardingCompleted);

  const updateProfile = useCallback(async (newFields: Partial<UserProfile>) => {
    try {
      const merged: UserProfile = {
        ...profile,
        ...newFields,
        notificationHours: {
          ...profile.notificationHours,
          ...(newFields.notificationHours || {}),
        },
      };

      setProfile(merged);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.warn('[LocalStorage] Error al guardar perfil en dispositivo:', err);
      return profile;
    }
  }, [profile]);

  const completeOnboarding = useCallback((finalProfile?: Partial<UserProfile>) => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      setHasCompletedOnboarding(true);
      if (finalProfile) {
        updateProfile(finalProfile);
      }
    } catch (err) {
      console.warn('[LocalStorage] Error al marcar onboarding como completado:', err);
    }
  }, [updateProfile]);

  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
      setHasCompletedOnboarding(false);
    } catch (err) {
      console.warn('[LocalStorage] Error al reiniciar onboarding:', err);
    }
  }, []);

  return {
    profile,
    updateProfile,
    hasCompletedOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
}
