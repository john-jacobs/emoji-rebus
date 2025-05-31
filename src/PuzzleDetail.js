import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { markPuzzleAsCompleted, isPuzzleCompleted } from "./utils/storage";

export default function PuzzleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [puzzle, setPuzzle] = useState(null);
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState("");
  const [shownHints, setShownHints] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Function to calculate emoji font size
  const calculateEmojiSize = (containerWidth, emojiString) => {
    // Get the actual container width from the window
    const viewportWidth = Math.min(window.innerWidth - 40, containerWidth); // 40px for padding
    const baseSize = Math.min(64, viewportWidth / 8); // Adjust base size for mobile
    const minSize = Math.min(24, viewportWidth / 16); // Adjust min size for mobile
    const emojiCount = Array.from(emojiString).length;
    const spacing = 0.1; // Letter spacing in em
    
    // Calculate the total width needed at base size
    const totalWidthNeeded = baseSize * emojiCount * (1 + spacing);
    
    // If it fits, use base size
    if (totalWidthNeeded <= viewportWidth) {
      return baseSize;
    }
    
    // Otherwise, scale down proportionally
    const scaledSize = Math.max(minSize, (viewportWidth / emojiCount) / (1 + spacing));
    return Math.floor(scaledSize); // Round down to prevent overflow
  };

  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        const { data, error } = await supabase
          .from("puzzles")
          .select(`
            *,
            categories (
              name
            )
          `)
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching puzzle:", error);
          navigate("/");
          return;
        }

        setPuzzle(data);
        const completed = await isPuzzleCompleted(data.id);
        setIsCompleted(completed);
      } catch (error) {
        console.error("Error in fetchPuzzle:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchPuzzle();
  }, [id, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  const handleSubmit = () => {
    if (!puzzle) return;

    const normalizedGuess = guess.trim().toLowerCase();
    const correctAnswer = puzzle.answer.trim().toLowerCase();

    // Remove "the " from both strings for comparison
    const normalizedGuessNoThe = normalizedGuess.replace(/^the\s+/, '');
    const correctAnswerNoThe = correctAnswer.replace(/^the\s+/, '');

    if (
      normalizedGuess === correctAnswer ||
      normalizedGuessNoThe === correctAnswerNoThe ||
      levenshtein(normalizedGuess, correctAnswer) <= 2 ||
      levenshtein(normalizedGuessNoThe, correctAnswerNoThe) <= 2
    ) {
      markPuzzleAsCompleted(puzzle.id);
      setIsCompleted(true);
      setResult(`✅ Correct! The answer is: "${puzzle.answer}"`);
    } else {
      setResult("❌ Try Again");
    }
  };

  const toggleHint = (index) => {
    setShownHints(prev => {
      const newShown = new Set(prev);
      if (newShown.has(index)) {
        newShown.delete(index);
      } else {
        newShown.add(index);
      }
      return newShown;
    });
  };

  if (loading) return <div className="puzzle-detail-loading">Loading puzzle...</div>;
  if (!puzzle) return <div className="puzzle-detail-error">Puzzle not found</div>;

  const emojiSize = calculateEmojiSize(windowWidth - 40, puzzle.emojis);

  return (
    <div className="puzzle-detail">
      <button className="back-button" onClick={() => navigate("/")}>
        ← Back to All Puzzles
      </button>

      <div className={`puzzle-detail-content${isCompleted ? " completed" : ""}`}>
        {isCompleted && (
          <div className="completion-badge detail">
            ✓ Solved
          </div>
        )}

        {/* Metadata */}
        <div className="puzzle-detail-meta">
          <div className="puzzle-type">
            Type: <span className="emoji">
              {puzzle.type === "Phonetic" 
                ? "🔤"
                : puzzle.type === "Symbolic" 
                ? "🧩"
                : "📝"}
            </span>
            {puzzle.type}
          </div>
          {puzzle.categories && (
            <div className="puzzle-category">
              Category: <span className="puzzle-category-text">{puzzle.categories.name}</span>
            </div>
          )}
        </div>

        {/* Puzzle Display */}
        <div className="puzzle-detail-emoji-container">
          <div 
            className="puzzle-detail-emoji"
            style={{ 
              fontSize: `${emojiSize}px`,
              maxWidth: `${windowWidth - 40}px` // Account for padding
            }}
          >
            {puzzle.emojis}
          </div>
        </div>

        {/* Solved State Information */}
        {isCompleted && (
          <div className="puzzle-solved-info">
            <div className="puzzle-answer">
              <h3>Answer</h3>
              <p>{puzzle.answer}</p>
            </div>
            {puzzle.explanation && (
              <div className="puzzle-explanation">
                <h3>Explanation</h3>
                <p>{puzzle.explanation}</p>
              </div>
            )}
            {puzzle.hints?.length > 0 && (
              <div className="puzzle-all-hints">
                <h3>Hints</h3>
                {puzzle.hints.map((hint, index) => (
                  <div key={index} className="hint-text">
                    {hint}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Section */}
        {!isCompleted && (
          <div className="puzzle-detail-input">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Your answer..."
              className="guess-input"
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button onClick={handleSubmit} className="submit-button">
              Submit
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`puzzle-result ${result.startsWith("✅") ? "correct" : "incorrect"}`}>
            {result}
          </div>
        )}

        {/* Hints Section - Only show when not completed */}
        {!isCompleted && puzzle.hints?.length > 0 && (
          <div className="puzzle-detail-hints">
            {puzzle.hints.map((hint, index) => (
              <div key={index} className="hint-section">
                <button
                  className="hint-button"
                  onClick={() => toggleHint(index)}
                >
                  {shownHints.has(index) ? `Hide Hint ${index + 1}` : `Show Hint ${index + 1}`}
                </button>
                {shownHints.has(index) && (
                  <div className="hint-text">{hint}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 