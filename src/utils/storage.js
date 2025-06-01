import { supabase } from '../supabaseClient';

const COMPLETED_PUZZLES_KEY = 'completedPuzzles';

// Get completed puzzles from localStorage
export const getCompletedPuzzles = () => {
  try {
    const stored = localStorage.getItem(COMPLETED_PUZZLES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading completed puzzles:', error);
    return [];
  }
};

// Save completed puzzles to localStorage
const saveToLocalStorage = (puzzleIds) => {
  localStorage.setItem(COMPLETED_PUZZLES_KEY, JSON.stringify(puzzleIds));
};

// Get completed puzzles from database
const getDbCompletedPuzzles = async () => {
  const { data, error } = await supabase
    .from('completed_puzzles')
    .select('puzzle_id');

  if (error) {
    console.error('Error fetching completed puzzles:', error);
    return [];
  }

  return data.map(item => item.puzzle_id);
};

// Mark puzzle as completed in both localStorage and database
export const markPuzzleAsCompleted = async (puzzleId) => {
  try {
    // Update localStorage
    const completed = getCompletedPuzzles();
    if (!completed.includes(puzzleId)) {
      completed.push(puzzleId);
      saveToLocalStorage(completed);
    }

    // If user is logged in, update database
    const session = await supabase.auth.getSession();
    if (session?.data?.session?.user) {
      const { error } = await supabase
        .from('completed_puzzles')
        .upsert({
          puzzle_id: puzzleId,
          user_id: session.data.session.user.id
        });

      if (error && error.code !== '23505') { // Ignore unique violation errors
        console.error('Error saving to database:', error);
      }
    }
  } catch (error) {
    console.error('Error marking puzzle as completed:', error);
  }
};

// Check if puzzle is completed (checks both localStorage and database)
export const isPuzzleCompleted = async (puzzleId) => {
  try {
    // Check localStorage first
    const localCompleted = getCompletedPuzzles();
    if (localCompleted.includes(puzzleId)) {
      return true;
    }

    // If user is logged in, check database
    const session = await supabase.auth.getSession();
    if (session?.data?.session?.user) {
      const { data, error } = await supabase
        .from('completed_puzzles')
        .select('puzzle_id')
        .eq('puzzle_id', puzzleId)
        .single();

      if (!error && data) {
        // Update localStorage with this information
        if (!localCompleted.includes(puzzleId)) {
          localCompleted.push(puzzleId);
          saveToLocalStorage(localCompleted);
        }
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking puzzle completion:', error);
    return false;
  }
};

// Sync completed puzzles between localStorage and database
export const syncCompletedPuzzles = async () => {
  try {
    const session = await supabase.auth.getSession();
    console.log('Current session:', session?.data?.session?.user?.id);
    
    if (!session?.data?.session?.user) {
      console.log('No user session found');
      return;
    }

    // Get puzzles from both sources
    const localCompleted = getCompletedPuzzles();
    console.log('Local completed puzzles:', localCompleted);

    const dbCompleted = await getDbCompletedPuzzles();
    console.log('DB completed puzzles:', dbCompleted);

    // Merge both sets
    const allCompleted = [...new Set([...localCompleted, ...dbCompleted])];
    console.log('Merged completed puzzles:', allCompleted);

    // Update localStorage with merged data
    saveToLocalStorage(allCompleted);

    // Update database with any missing completions
    const newCompletions = localCompleted.filter(id => !dbCompleted.includes(id));
    console.log('New completions to sync:', newCompletions);

    if (newCompletions.length > 0) {
      console.log('Attempting to sync to database...');
      const { data, error } = await supabase
        .from('completed_puzzles')
        .upsert(
          newCompletions.map(puzzleId => ({
            puzzle_id: puzzleId,
            user_id: session.data.session.user.id
          }))
        );

      if (error) {
        console.error('Error syncing to database:', error);
      } else {
        console.log('Successfully synced to database:', data);
      }
    }
  } catch (error) {
    console.error('Error in syncCompletedPuzzles:', error);
  }
}; 