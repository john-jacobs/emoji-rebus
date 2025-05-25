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
  const [searchTerm, setSearchTerm] = useState("");

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
    let filtered = [...allPuzzles];
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) =>
        Array.isArray(p.tags) && p.tags.some((tag) => selectedTags.includes(tag))
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => 
        p.tags?.some(tag => tag.toLowerCase().includes(term)) ||
        p.type.toLowerCase().includes(term) ||
        p.emojis.includes(term)
      );
    }
    
    setPuzzles(filtered);
  }, [selectedTags, searchTerm, allPuzzles]);

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
    return <p className="puzzle-grid-empty">Loading puzzles...</p>;

  return (
    <div className="puzzle-grid-container">
      <div className="puzzle-grid-header-section">
        <h1>Emoji Puzzles</h1>
        
        {/* Search and Filter Section */}
        <div className="puzzle-grid-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search puzzles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="tag-filter">
            <div className="tag-filter-list">
              {tags.map((tag) => (
                <button
                  key={tag}
                  className={`tag-filter-item${
                    selectedTags.includes(tag) ? " selected" : ""
                  }`}
                  onClick={() => handleTagToggle(tag)}
                  onMouseUp={(e) => e.currentTarget.blur()}
                  aria-pressed={selectedTags.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="puzzle-cards">
        {puzzles.map((puzzle) => (
          <div className="puzzle-card" key={puzzle.id}>
            {/* Puzzle Display */}
            <div className="puzzle-card-emoji">
              {puzzle.emojis}
            </div>
            
            {/* Metadata */}
            <div className="puzzle-card-meta">
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
                    <span 
                      key={tag} 
                      className="puzzle-tag"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Guess Section */}
            <div className="puzzle-card-input">
              <input
                type="text"
                value={guesses[puzzle.id] || ""}
                onChange={(e) => handleInputChange(puzzle.id, e.target.value)}
                placeholder="Your answer..."
                className="guess-input"
              />
              <button
                onClick={() => handleGuess(puzzle.id, guesses[puzzle.id] || "")}
                className="submit-button"
              >
                Submit
              </button>
            </div>

            {/* Result */}
            {results[puzzle.id] && (
              <div className={`puzzle-result ${results[puzzle.id].startsWith("✅") ? "correct" : "incorrect"}`}>
                {results[puzzle.id]}
              </div>
            )}

            {/* Hint Section */}
            <div className="puzzle-card-hint">
              <button
                className="hint-button"
                onClick={() => handleShowHint(puzzle.id)}
              >
                {showHints[puzzle.id] ? "Hide Hint" : "Show Hint"}
              </button>
              {showHints[puzzle.id] && (
                <div className="hint-text">{puzzle.hint}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
