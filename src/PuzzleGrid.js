import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";
import { useNavigate } from "react-router-dom";
import { isPuzzleCompleted } from "./utils/storage";

// Function to calculate emoji font size
const calculateEmojiSize = (containerWidth, emojiString) => {
  const baseSize = 40; // Base font size in pixels
  const minSize = 16; // Minimum font size
  const emojiCount = Array.from(emojiString).length;
  const spacing = 0.1; // Letter spacing in em
  
  // Calculate the total width needed at base size
  const totalWidthNeeded = baseSize * emojiCount * (1 + spacing);
  
  // If it fits, use base size
  if (totalWidthNeeded <= containerWidth) {
    return baseSize;
  }
  
  // Otherwise, scale down proportionally
  const scaledSize = Math.max(minSize, (containerWidth / emojiCount) / (1 + spacing));
  return scaledSize;
};

function PuzzleCard({ puzzle }) {
  const navigate = useNavigate();
  const [showSolution, setShowSolution] = useState(false);
  const isCompleted = isPuzzleCompleted(puzzle.id);
  const emojiSize = calculateEmojiSize(300, puzzle.emojis);

  const handleClick = (e) => {
    if (e.target.closest('.solution-toggle') || e.target.closest('.puzzle-card-content')) {
      e.stopPropagation();
    } else {
      navigate(`/puzzle/${puzzle.id}`);
    }
  };

  return (
    <div 
      className={`puzzle-card${isCompleted ? " completed" : ""}`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {isCompleted && (
        <div className="completion-badge">
          ✓ Solved
        </div>
      )}
      
      <div 
        className="puzzle-card-emoji"
        style={{ fontSize: `${emojiSize}px` }}
      >
        {puzzle.emojis}
      </div>
      
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
            Tags: {puzzle.tags.map((tag) => (
              <span key={tag} className="puzzle-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {isCompleted ? (
        <>
          <button 
            className="solution-toggle" 
            onClick={(e) => {
              e.stopPropagation();
              setShowSolution(!showSolution);
            }}
          >
            {showSolution ? "Hide Solution ↑" : "Show Solution ↓"}
          </button>
          {showSolution && (
            <div className="puzzle-card-content">
              <div className="puzzle-answer">
                <h4>Answer</h4>
                <p>{puzzle.answer}</p>
              </div>
              {puzzle.explanation && (
                <div className="puzzle-explanation">
                  <h4>Explanation</h4>
                  <p>{puzzle.explanation}</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="puzzle-card-preview">
          Click to solve →
        </div>
      )}
    </div>
  );
}

export default function PuzzleGrid({ selectedTags, setSelectedTags }) {
  const [puzzles, setPuzzles] = useState([]);
  const [allPuzzles, setAllPuzzles] = useState([]);
  const [tags, setTags] = useState([]);
  const [completionFilter, setCompletionFilter] = useState('all');
  const [completionStats, setCompletionStats] = useState({ solved: 0, total: 0 });

  useEffect(() => {
    const fetchPuzzles = async () => {
      const { data, error } = await supabase
        .from("puzzles")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setAllPuzzles(data);
        setPuzzles(data);

        // Calculate completion stats
        const solved = data.filter(puzzle => isPuzzleCompleted(puzzle.id)).length;
        setCompletionStats({
          solved,
          total: data.length
        });

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
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) =>
        Array.isArray(p.tags) && p.tags.some((tag) => selectedTags.includes(tag))
      );
    }

    if (completionFilter !== 'all') {
      filtered = filtered.filter((puzzle) => {
        const completed = isPuzzleCompleted(puzzle.id);
        return completionFilter === 'solved' ? completed : !completed;
      });
    }
    
    setPuzzles(filtered);
  }, [selectedTags, allPuzzles, completionFilter]);

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const renderCompletionFilter = () => (
    <div className="completion-filter">
      <button
        className={`filter-button${completionFilter === 'all' ? ' selected' : ''}`}
        onClick={() => setCompletionFilter('all')}
      >
        All Puzzles
        <span className="count-badge">
          {completionStats.total}
        </span>
      </button>
      <button
        className={`filter-button${completionFilter === 'solved' ? ' selected' : ''}`}
        onClick={() => setCompletionFilter('solved')}
      >
        Solved
        <span className="count-badge">
          {completionStats.solved}
        </span>
      </button>
      <button
        className={`filter-button${completionFilter === 'unsolved' ? ' selected' : ''}`}
        onClick={() => setCompletionFilter('unsolved')}
      >
        Unsolved
        <span className="count-badge">
          {completionStats.total - completionStats.solved}
        </span>
      </button>
    </div>
  );

  if (!puzzles.length) {
    return (
      <div className="puzzle-grid-container">
        <div className="puzzle-grid-header-section">
          <h1>Emoji Puzzles</h1>
          <div className="puzzle-grid-controls">
            {renderCompletionFilter()}
            <div className="tag-filter">
              <div className="tag-filter-list">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    className={`tag-filter-item${selectedTags.includes(tag) ? " selected" : ""}`}
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
        <p className="puzzle-grid-empty">No puzzles found matching your filters</p>
      </div>
    );
  }

  return (
    <div className="puzzle-grid-container">
      <div className="puzzle-grid-header-section">
        <h1>Emoji Puzzles</h1>
        <div className="puzzle-grid-controls">
          {renderCompletionFilter()}
          <div className="tag-filter">
            <div className="tag-filter-list">
              {tags.map((tag) => (
                <button
                  key={tag}
                  className={`tag-filter-item${selectedTags.includes(tag) ? " selected" : ""}`}
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
          <PuzzleCard key={puzzle.id} puzzle={puzzle} />
        ))}
      </div>
    </div>
  );
}
