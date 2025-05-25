const COMPLETED_PUZZLES_KEY = 'completedPuzzles';

export const getCompletedPuzzles = () => {
  try {
    const stored = localStorage.getItem(COMPLETED_PUZZLES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading completed puzzles:', error);
    return [];
  }
};

export const markPuzzleAsCompleted = (puzzleId) => {
  try {
    const completed = getCompletedPuzzles();
    if (!completed.includes(puzzleId)) {
      completed.push(puzzleId);
      localStorage.setItem(COMPLETED_PUZZLES_KEY, JSON.stringify(completed));
    }
  } catch (error) {
    console.error('Error marking puzzle as completed:', error);
  }
};

export const isPuzzleCompleted = (puzzleId) => {
  try {
    const completed = getCompletedPuzzles();
    return completed.includes(puzzleId);
  } catch (error) {
    console.error('Error checking puzzle completion:', error);
    return false;
  }
}; 