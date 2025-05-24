import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

export default function PuzzleGrid() {
  const [puzzles, setPuzzles] = useState([]);
  const [allPuzzles, setAllPuzzles] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [guesses, setGuesses] = useState({});
  const [results, setResults] = useState({});
  const [showHints, setShowHints] = useState({});

  useEffect(() => {
    const fetchPuzzles = async () => {
      const { data, error } = await supabase
        .from("puzzles")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setAllPuzzles(data);
        setPuzzles(data);

        // Extract unique tags
        const tagSet = new Set();
        data.forEach((p) => {
          if (Array.isArray(p.tags)) {
            p.tags.forEach((tag) => tagSet.add(tag));
          }
        });
        setTags(Array.from(tagSet).sort());
      }
    };
    fetchPuzzles();
  }, []);

  useEffect(() => {
    if (selectedTags.length === 0) {
      setPuzzles(allPuzzles);
    } else {
      const filtered = allPuzzles.filter((p) =>
        Array.isArray(p.tags) && p.tags.some((tag) => selectedTags.includes(tag))
      );
      setPuzzles(filtered);
    }
  }, [selectedTags, allPuzzles]);

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

  const handleGuess = (puzzleId, answer) => {
    const puzzle = puzzles.find((p) => p.id === puzzleId);
    if (!puzzle) return;
    const normalizedGuess = answer.trim().toLowerCase();
    const correct = puzzle.answer.trim().toLowerCase();
    if (
      normalizedGuess === correct ||
      levenshtein(normalizedGuess, correct) <= 2
    ) {
      setResults((prev) => ({
        ...prev,
        [puzzleId]: `✅ Correct! "${puzzle.answer}"`,
      }));
    } else {
      setResults((prev) => ({
        ...prev,
        [puzzleId]: "❌ Try Again",
      }));
    }
  };

  const handleInputChange = (puzzleId, value) => {
    setGuesses((prev) => ({ ...prev, [puzzleId]: value }));
  };

  const handleShowHint = (puzzleId) => {
    setShowHints((prev) => ({ ...prev, [puzzleId]: !prev[puzzleId] }));
  };

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (!puzzles.length)
    return <p style={{ textAlign: "center" }}>Loading puzzles...</p>;

  return (
    <div className="puzzle-grid-container">
      <h2 style={{ textAlign: "center", margin: "1.5em 0 0.7em" }}>
        All Emoji Puzzles
      </h2>
      {/* Tag Filter Row */}
      <div className="grid-tag-selector">
        <strong>Filter by Tag:</strong>
        <div className="grid-tag-list">
          {tags.map((tag) => (
            <button
              key={tag}
              className={`grid-tag-item${
                selectedTags.includes(tag) ? " selected" : ""
              }`}
              onClick={() => handleTagToggle(tag)}
              aria-pressed={selectedTags.includes(tag)}
              type="button"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="puzzle-grid-table">
        <div className="puzzle-grid-header">
          <div>Type & Tags</div>
          <div>Guess</div>
          <div>Hint</div>
        </div>
        {puzzles.map((puzzle) => (
          <div className="puzzle-grid-row" key={puzzle.id}>
            {/* Metadata */}
            <div className="puzzle-grid-meta">
              <div>
                <span className="meta-label">Type: </span>
                <span className="meta-type">
                  {puzzle.type === "Phonetic"
                    ? "🔤 Phonetic"
                    : puzzle.type === "Symbolic"
                    ? "🧩 Symbolic"
                    : "📝 Other"}
                </span>
              </div>
              <div>
                <span className="meta-label">Tags: </span>
                {(puzzle.tags || []).map((tag) => (
                  <span className="puzzle-grid-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Guess input/submit/result */}
            <div className="puzzle-grid-guess">
              <input
                type="text"
                value={guesses[puzzle.id] || ""}
                onChange={(e) => handleInputChange(puzzle.id, e.target.value)}
                placeholder="Your guess..."
              />
              <button
                onClick={() =>
                  handleGuess(puzzle.id, guesses[puzzle.id] || "")
                }
              >
                Submit
              </button>
              <div className="puzzle-grid-result">{results[puzzle.id]}</div>
            </div>

            {/* Hint */}
            <div className="puzzle-grid-hint">
              <button
                className="hint-btn"
                onClick={() => handleShowHint(puzzle.id)}
              >
                {showHints[puzzle.id] ? "Hide Hint" : "Show Hint"}
              </button>
              {showHints[puzzle.id] && (
                <div className="puzzle-grid-hint-text">{puzzle.hint}</div>
              )}
            </div>

            {/* Emoji (puzzle) always full row, always big and centered */}
            <div className="puzzle-grid-emoji-full">
              <div className="puzzle-label">
                <strong>Puzzle</strong>
              </div>
              <div className="puzzle-grid-emoji">{puzzle.emojis}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
