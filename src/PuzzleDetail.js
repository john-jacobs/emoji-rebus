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
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const fetchPuzzle = async () => {
      const { data, error } = await supabase
        .from("puzzles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching puzzle:", error);
        navigate("/");
      } else {
        setPuzzle(data);
        setIsCompleted(isPuzzleCompleted(data.id));
        setLoading(false);
      }
    };

    fetchPuzzle();
  }, [id, navigate]);

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

    if (
      normalizedGuess === correctAnswer ||
      levenshtein(normalizedGuess, correctAnswer) <= 2
    ) {
      markPuzzleAsCompleted(puzzle.id);
      setIsCompleted(true);
      setResult(`✅ Correct! The answer is: "${puzzle.answer}"`);
    } else {
      setResult("❌ Try Again");
    }
  };

  if (loading) return <div className="puzzle-detail-loading">Loading puzzle...</div>;
  if (!puzzle) return <div className="puzzle-detail-error">Puzzle not found</div>;

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
          {puzzle.tags?.length > 0 && (
            <div className="puzzle-tags">
              Tags: {puzzle.tags.map((tag, index) => (
                <span key={tag} className="puzzle-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Puzzle Display */}
        <div className="puzzle-detail-emoji">
          {puzzle.emojis}
        </div>

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

        {/* Hint Section */}
        {!isCompleted && (
          <div className="puzzle-detail-hint">
            <button
              className="hint-button"
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
            {showHint && puzzle.hint && (
              <div className="hint-text">{puzzle.hint}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 