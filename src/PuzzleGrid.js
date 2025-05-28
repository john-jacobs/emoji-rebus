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
        {puzzle.categories && (
          <div className="puzzle-category">
            Category: <span className="puzzle-category-text">{puzzle.categories.name}</span>
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
  const [completionFilter, setCompletionFilter] = useState('all');
  const [completionStats, setCompletionStats] = useState({ solved: 0, total: 0 });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchPuzzles = async () => {
      // First fetch categories
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoryError) {
        console.error('Error fetching categories:', categoryError);
      } else if (categoryData) {
        setCategories(categoryData);
      }

      // Then fetch puzzles with category names
      const { data: puzzleData, error: puzzleError } = await supabase
        .from("puzzles")
        .select(`
          *,
          categories (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (!puzzleError && puzzleData) {
        setAllPuzzles(puzzleData);
        setPuzzles(puzzleData);

        // Calculate completion stats
        const solved = puzzleData.filter(puzzle => isPuzzleCompleted(puzzle.id)).length;
        setCompletionStats({
          solved,
          total: puzzleData.length
        });
      }
    };
    fetchPuzzles();
  }, []);

  useEffect(() => {
    let filtered = [...allPuzzles];
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) =>
        selectedTags.includes(p.category)
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

  const handleCategoryToggle = (categoryId) => {
    setSelectedTags((prev) =>
      prev.includes(categoryId) ? prev.filter((t) => t !== categoryId) : [...prev, categoryId]
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
            <div className="category-filter">
              <div className="category-filter-list">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`category-filter-item${selectedTags.includes(category.id) ? " selected" : ""}`}
                    onClick={() => handleCategoryToggle(category.id)}
                    onMouseUp={(e) => e.currentTarget.blur()}
                    aria-pressed={selectedTags.includes(category.id)}
                  >
                    {category.name}
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
          <div className="category-filter">
            <div className="category-filter-list">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`category-filter-item${selectedTags.includes(category.id) ? " selected" : ""}`}
                  onClick={() => handleCategoryToggle(category.id)}
                  onMouseUp={(e) => e.currentTarget.blur()}
                  aria-pressed={selectedTags.includes(category.id)}
                >
                  {category.name}
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
