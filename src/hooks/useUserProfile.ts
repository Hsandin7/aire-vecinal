import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../types';
import { getUserProfile, updateUserProfile } from '../services/api';

const LOCAL_STORAGE_KEY = 'airevecinal_user_profile';

const INITIAL_PROFILE: UserProfile = {
  profile: 'deportista',
  hasAsthma: true,
  favoriteZones: ['madrid-castellana'],
  alertTypes: 'all',
  notificationHours: {
    start: '07:30',
    end: '22:00',
  },
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_PROFILE;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with backend on mount
  useEffect(() => {
    let isMounted = true;
    getUserProfile()
      .then((serverProfile) => {
        if (isMounted && serverProfile) {
          setProfile(serverProfile);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverProfile));
        }
      })
      .catch((err) => {
        console.warn('No se pudo sincronizar perfil con servidor:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const update = useCallback(async (newFields: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);
    try {
      const merged: UserProfile = {
        ...profile,
        ...newFields,
        notificationHours: {
          ...profile.notificationHours,
          ...(newFields.notificationHours || {}),
        },
      };

      // Optimistic update
      setProfile(merged);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));

      // Persist to server
      const updated = await updateUserProfile(merged);
      setProfile(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar perfil';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profile]);

  return {
    profile,
    loading,
    error,
    updateProfile: update,
  };
}
