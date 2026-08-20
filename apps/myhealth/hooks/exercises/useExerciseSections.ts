import { useMemo } from 'react';
import DefaultExercises from '../../assets/data/default-exercises';

function normalizeSearch(text: string) {
  return text.toLowerCase().replace(/[-_\s]+/g, ' ').trim();
}

export function useExerciseSections(
  processedExercises: any[],
  searchQuery: string,
  selectedCategories: Set<string>,
  expandedGroups: Set<string>,
  mode: 'browse' | 'select',
) {
  return useMemo(() => {
    const normalizedQuery = normalizeSearch(searchQuery);

    const flattenData = (dataArray: any[]) => {
      const flat: any[] = [];
      dataArray.forEach(item => {
        flat.push(item);
        if (item.isGroup && mode === 'select' && expandedGroups.has(item.id)) {
          item.variations.forEach((v: any) => {
            flat.push({
              ...v,
              isVariation: true,
              parentGroupId: item.id
            });
          });
        }
      });
      return flat;
    };

    let filtered = processedExercises.filter(ex => {
      if (ex.isGroup) {
        const matchesGroupName = normalizeSearch(ex.name).includes(normalizedQuery);
        const matchesVariationName = ex.variations.some((v: any) => normalizeSearch(v.name).includes(normalizedQuery));
        return matchesGroupName || matchesVariationName;
      }
      return normalizeSearch(ex.name).includes(normalizedQuery);
    });

    if (selectedCategories.size > 0) {
      filtered = filtered.filter(ex =>
        (ex.muscle_groups || []).some((m: string) => selectedCategories.has(m)) ||
        selectedCategories.has(ex.group)
      );
    }

    const result: { title: string, data: any[] }[] = [];

    // 1. Custom Exercises
    const custom = filtered.filter(ex => !ex.isGroup && !DefaultExercises.some(d => d.id === ex.id));
    if (custom.length > 0) {
      result.push({ title: 'Custom Exercises', data: flattenData(custom) });
    }

    // 2. Default Exercises & Groups sorted by dynamic Muscle Group
    const defaultFiltered = filtered.filter(ex => ex.isGroup || DefaultExercises.some(d => d.id === ex.id));
    const muscleGroupMap = new Map<string, any[]>();
    defaultFiltered.forEach(ex => {
      const primary = ex.muscle_groups && ex.muscle_groups.length > 0 ? ex.muscle_groups[0] : "Other";
      if (!muscleGroupMap.has(primary)) muscleGroupMap.set(primary, []);
      muscleGroupMap.get(primary)!.push(ex);
    });

    const sortedMuscleGroups = Array.from(muscleGroupMap.keys()).sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });

    sortedMuscleGroups.forEach(mg => {
      result.push({ title: mg, data: flattenData(muscleGroupMap.get(mg)!) });
    });

    return result;
  }, [processedExercises, searchQuery, selectedCategories, expandedGroups, mode]);
}
