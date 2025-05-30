import { supabase } from '../supabaseClient';

const COMPLETED_PUZZLES_KEY = 'completedPuzzles';

// Get completed puzzles from both localStorage and Supabase
export const getCompletedPuzzles = async () => {
  // Get local storage puzzles
  const localPuzzles = (() => {
    try {
      const stored = localStorage.getItem(COMPLETED_PUZZLES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading local completed puzzles:', error);
      return [];
    }
  })();

  // If user is authenticated, get their completed puzzles from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    try {
      const { data: dbPuzzles, error } = await supabase
        .from('completed_puzzles')
        .select('puzzle_id')
        .eq('user_id', session.user.id);

      if (error) throw error;

      // Combine and deduplicate puzzles
      const dbPuzzleIds = dbPuzzles.map(p => p.puzzle_id);
      const allPuzzles = [...new Set([...localPuzzles, ...dbPuzzleIds])];
      
      return allPuzzles;
    } catch (error) {
      console.error('Error fetching completed puzzles:', error);
      return localPuzzles;
    }
  }

  return localPuzzles;
};

// Mark a puzzle as completed
export const markPuzzleAsCompleted = async (puzzleId) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    try {
      const { error } = await supabase
        .from('completed_puzzles')
        .insert([
          {
            puzzle_id: puzzleId,
            user_id: session.user.id
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking puzzle as completed:', error);
      // Fall back to localStorage if database insert fails
      saveToLocalStorage(puzzleId);
    }
  } else {
    // Not logged in, use localStorage
    saveToLocalStorage(puzzleId);
  }
};

// Helper function to save to localStorage
const saveToLocalStorage = (puzzleId) => {
  try {
    const completed = getLocalCompletedPuzzles();
    if (!completed.includes(puzzleId)) {
      completed.push(puzzleId);
      localStorage.setItem(COMPLETED_PUZZLES_KEY, JSON.stringify(completed));
    }
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Helper function to get local completed puzzles
const getLocalCompletedPuzzles = () => {
  try {
    const stored = localStorage.getItem(COMPLETED_PUZZLES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading local completed puzzles:', error);
    return [];
  }
};

// Check if a puzzle is completed
export const isPuzzleCompleted = async (puzzleId) => {
  try {
    const completed = await getCompletedPuzzles();
    return completed.includes(puzzleId);
  } catch (error) {
    console.error('Error checking puzzle completion:', error);
    return false;
  }
}; 