import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { storage } from '../../utils/storage';
import { RANKING_SEX_STORAGE_KEY, DEFAULT_RANKING_SEX, StrengthSex } from '../../utils/strengthStandards';
import { HEIGHT_STORAGE_KEY } from '../../utils/height';
import { useStrengthRanks } from './useStrengthRanks';

export function useStrengthRankWidget(user: any) {
  const [rankingSex, setRankingSex] = useState<StrengthSex>(DEFAULT_RANKING_SEX);
  useEffect(() => {
    storage.getItem<StrengthSex>(RANKING_SEX_STORAGE_KEY).then((sex) => {
      if (sex === 'male' || sex === 'female') setRankingSex(sex);
    });
  }, []);

  const handleChangeRankingSex = useCallback(async (sex: StrengthSex) => {
    setRankingSex(sex);
    await storage.setItem(RANKING_SEX_STORAGE_KEY, sex);
  }, []);

  const { bests: strengthBests, isLoading: strengthLoading } = useStrengthRanks(user);

  const [heightInches, setHeightInches] = useState<number | null>(null);
  const loadHeight = useCallback(() => {
    storage.getItem<number>(HEIGHT_STORAGE_KEY).then((height) => {
      if (height !== null) setHeightInches(height);
    });
  }, []);

  useEffect(() => {
    loadHeight();
  }, [loadHeight]);

  // Re-check on focus too, same reasoning as weekly goal — height is set
  // from Settings, a separate screen.
  useFocusEffect(useCallback(() => {
    loadHeight();
  }, [loadHeight]));

  return {
    strengthBests,
    strengthLoading,
    rankingSex,
    handleChangeRankingSex,
    heightInches,
  };
}
