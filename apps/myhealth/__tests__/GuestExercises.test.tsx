
import { fetchExercises } from '../utils/workout-api/exercises';
import ExerciseDefaultData from '../assets/data/default-exercises.json';

// Mock Supabase 
jest.mock('@mysuite/auth', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Guest Exercise Fetching', () => {
  it('should return default exercises when user is null', async () => {
    const { data, error } = await fetchExercises(null);
    
    expect(error).toBeNull();
    expect(data).toHaveLength(ExerciseDefaultData.length);
    
    // Check first item mapping
    const firstDefault = ExerciseDefaultData[0];
    const firstResult = data.find((d: any) => d.id === firstDefault.id);

    if (!firstResult) throw new Error("First default exercise not found in result");
    
    expect(firstResult).toBeDefined();
    expect(firstResult.name).toBe(firstDefault.name);
    // Check property parsing
    // Default data has 'type', we map it to properties. 
    // The transformation splits by comma, so 'reps' becomes ['reps']
    
    // e.type in json is "reps". 
    // Code: properties = e.properties.split...
    // But wait, e.properties in the MAPPED object above is e.type ("reps").
    // Then below it does: properties = e.properties ? split...
    // So for "Weighted, Reps", it becomes ["Weighted", "Reps"].
    const expectedProperties = firstDefault.type.split(',').map((s: string) => s.trim());
    expect(firstResult.properties).toEqual(expectedProperties);
  });
});
