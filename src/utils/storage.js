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

export const syncCompletedPuzzles = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.log('No user session found, skipping sync');
      return;
    }

    // Get local puzzles
    const localCompleted = getCompletedPuzzles();
    console.log('Local puzzles to sync:', localCompleted);

    // First, check which puzzles are already completed in the database
    const { data: existingCompletions, error: fetchError } = await supabase
      .from('completed_puzzles')
      .select('puzzle_id')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching existing completions:', fetchError);
      return;
    }

    const existingPuzzleIds = existingCompletions?.map(c => c.puzzle_id) || [];
    console.log('Existing completed puzzles:', existingPuzzleIds);

    // Filter out puzzles that are already completed
    const newPuzzles = localCompleted.filter(id => !existingPuzzleIds.includes(id));
    console.log('New puzzles to sync:', newPuzzles);

    if (newPuzzles.length === 0) {
      console.log('No new puzzles to sync');
      return;
    }

    // Use upsert instead of insert to handle duplicates gracefully
    for (const puzzleId of newPuzzles) {
      const { error } = await supabase
        .from('completed_puzzles')
        .upsert({
          user_id: userId,
          puzzle_id: puzzleId
        }, {
          onConflict: 'user_id,puzzle_id',
          ignoreDuplicates: true
        });

      if (error && error.code !== '23505') { // Ignore unique violation errors
        console.log(`Error syncing puzzle ${puzzleId}:`, error);
      } else {
        console.log(`Successfully synced puzzle: ${puzzleId}`);
      }
    }

    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Error in syncCompletedPuzzles:', error.message || error);
  }
};

export const markPuzzleAsCompleted = async (puzzleId) => {
  try {
    // Update localStorage
    const completed = getCompletedPuzzles();
    if (!completed.includes(puzzleId)) {
      completed.push(puzzleId);
      saveToLocalStorage(completed);
    }

    // If user is logged in, update database
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { error } = await supabase
        .from('completed_puzzles')
        .insert({
          puzzle_id: puzzleId,
          user_id: session.user.id
        })
        .select('*');

      if (error && error.code !== '23505') { // Ignore unique violation errors
        console.error('Error saving to database:', error);
      }
    }
  } catch (error) {
    console.error('Error marking puzzle as completed:', error);
  }
};

export const isPuzzleCompleted = async (puzzleId) => {
  try {
    // Check localStorage first
    const localCompleted = getCompletedPuzzles();
    if (localCompleted.includes(puzzleId)) {
      return true;
    }

    // If user is logged in, check database
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await supabase
        .from('completed_puzzles')
        .select('*')
        .eq('puzzle_id', puzzleId)
        .eq('user_id', session.user.id)
        .maybeSingle();

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