import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { markPuzzleAsCompleted, isPuzzleCompleted } from "./utils/storage";

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

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

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const calculateEmojiSize = (containerWidth, emojiString) => {
    const viewportWidth = Math.min(windowWidth - 40, containerWidth);
    const baseSize = Math.min(64, viewportWidth / 8);
    const minSize = Math.min(24, viewportWidth / 16);
    const emojiCount = Array.from(emojiString).length;
    const spacing = 0.1;
    
    const totalWidthNeeded = baseSize * emojiCount * (1 + spacing);
    
    if (totalWidthNeeded <= viewportWidth) {
      return baseSize;
    }
    
    return Math.max(minSize, (viewportWidth / emojiCount) / (1 + spacing));
  };

  const handleSubmit = () => {
    if (!puzzle) return;

    const normalizedGuess = guess.trim().toLowerCase();
    const correctAnswer = puzzle.answer.trim().toLowerCase();
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

      <div className="puzzle-metadata">
        <div className="metadata-row">
          <span className="metadata-label">Type:</span>
          <span className="metadata-value">
            <span className="emoji">
              {puzzle.type === "Phonetic" 
                ? "🔤"
                : puzzle.type === "Symbolic" 
                ? "🧩"
                : "📝"}
            </span>
            {puzzle.type}
          </span>
        </div>

        {puzzle.categories && (
          <div className="metadata-row">
            <span className="metadata-label">Category:</span>
            <span className="metadata-value">
              {puzzle.categories.name}
            </span>
          </div>
        )}
      </div>

      <div 
        className="puzzle-detail-emoji"
        style={{ fontSize: `${emojiSize}px` }}
      >
        {puzzle.emojis}
      </div>

      {!isCompleted ? (
        <div className="puzzle-input-area">
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Your answer..."
            className="puzzle-input"
          />
          <button onClick={handleSubmit} className="submit-button">
            Submit
          </button>
          {result && <div className="result-message">{result}</div>}
        </div>
      ) : (
        <div className="puzzle-solved-info">
          <div className="result-message">✅ Solved!</div>
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
        </div>
      )}

      {puzzle.hints?.length > 0 && (
        <div className="puzzle-hints">
          {puzzle.hints.map((hint, index) => (
            <div key={index} className="hint-container">
              {isCompleted ? (
                <div className="hint-text">
                  <strong>Hint {index + 1}:</strong> {hint}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => toggleHint(index)}
                    className="hint-button"
                  >
                    {shownHints.has(index) ? "Hide Hint" : `Show Hint ${index + 1}`}
                  </button>
                  {shownHints.has(index) && (
                    <div className="hint-text">{hint}</div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 