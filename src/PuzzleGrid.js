import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";
import { useNavigate } from "react-router-dom";
import { getCompletedPuzzlesSync } from "./utils/completedPuzzles";
import { calculateEmojiSize } from "./utils/emojiUtils";

function PuzzleCard({ puzzle, completedPuzzleIds }) {
  const navigate = useNavigate();
  const [showSolution, setShowSolution] = useState(false);
  const isCompleted = Array.isArray(completedPuzzleIds) && completedPuzzleIds.includes(puzzle.id);
  const emojiSize = calculateEmojiSize(300, puzzle.emojis);

  const handleClick = (e) => {
    if (e.target.tagName.toLowerCase() === 'button' || 
        e.target.closest('.puzzle-card-content') ||
        e.target.closest('.solution-toggle')) {
      e.stopPropagation();
      return;
    }
    
    navigate(`/puzzle/${puzzle.id}`);
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
        {puzzle.profiles && (
          <div className="puzzle-creator">
            Created by: <span className="puzzle-creator-text">
              {puzzle.profiles.email.split('@')[0]}
            </span>
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

export default function PuzzleGrid({ 
  selectedTags, 
  setSelectedTags,
  completionFilter,
  setCompletionFilter
}) {
  const [puzzles, setPuzzles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredPuzzles, setFilteredPuzzles] = useState([]);
  const [completedPuzzleIds] = useState(getCompletedPuzzlesSync());
  
  // Set default completion filter if not already set
  useEffect(() => {
    if (!completionFilter) {
      setCompletionFilter('all');
    }
  }, [completionFilter, setCompletionFilter]);

  // Calculate counts for the filter buttons
  const puzzleCounts = {
    all: puzzles.length,
    solved: puzzles.filter(puzzle => completedPuzzleIds.includes(puzzle.id)).length,
    get unsolved() {
      return this.all - this.solved;
    }
  };

  useEffect(() => {
    const fetchPuzzles = async () => {
      try {
        // First fetch categories
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categoryError) throw categoryError;
        setCategories(categoryData);

        // Then fetch puzzles with categories
        const { data: puzzleData, error: puzzleError } = await supabase
          .from("puzzles")
          .select(`
            *,
            categories (
              id,
              name
            )
          `)
          .order("created_at", { ascending: false });

        if (puzzleError) throw puzzleError;

        setPuzzles(puzzleData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchPuzzles();
  }, []);

  useEffect(() => {
    const filterPuzzles = () => {
      let filtered = [...puzzles];

      // Apply category filter
      if (selectedTags.length > 0) {
        filtered = filtered.filter(puzzle => 
          selectedTags.includes(puzzle.categories?.id)
        );
      }

      // Apply completion filter
      if (completionFilter !== 'all') {
        const isCompleted = puzzle => completedPuzzleIds.includes(puzzle.id);
        filtered = filtered.filter(puzzle => 
          completionFilter === 'solved' ? isCompleted(puzzle) : !isCompleted(puzzle)
        );
      }

      setFilteredPuzzles(filtered);
    };

    filterPuzzles();
  }, [puzzles, selectedTags, completionFilter, completedPuzzleIds]);

  const toggleTag = (categoryId) => {
    console.log("Toggling category:", categoryId);
    setSelectedTags((prev) =>
      prev.includes(categoryId) ? prev.filter((t) => t !== categoryId) : [...prev, categoryId]
    );
  };

  if (!filteredPuzzles.length) {
    return (
      <div className="puzzle-grid-container">
        <div className="puzzle-grid-header-section">
          <h1>Emoji Puzzles</h1>
          <div className="puzzle-grid-controls">
            <div className="completion-filters">
              <button
                className={`filter-button ${completionFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCompletionFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-button ${completionFilter === 'solved' ? 'active' : ''}`}
                onClick={() => setCompletionFilter('solved')}
              >
                Solved
              </button>
              <button
                className={`filter-button ${completionFilter === 'unsolved' ? 'active' : ''}`}
                onClick={() => setCompletionFilter('unsolved')}
              >
                Unsolved
              </button>
            </div>

            <div className="category-filters">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`filter-button ${selectedTags.includes(category.id) ? 'active' : ''}`}
                  onClick={() => toggleTag(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="puzzle-grid-empty">No puzzles found matching your filters</p>
      </div>
    );
  }

  return (
    <div className="puzzle-grid-container">
      <h1 className="grid-title">Emoji Puzzles</h1>
      
      <div className="filters">
        <div className="completion-filters">
          <button
            className={`filter-button ${!completionFilter || completionFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCompletionFilter('all')}
          >
            All ({puzzleCounts.all})
          </button>
          <button
            className={`filter-button ${completionFilter === 'solved' ? 'active' : ''}`}
            onClick={() => setCompletionFilter('solved')}
          >
            Solved ({puzzleCounts.solved})
          </button>
          <button
            className={`filter-button ${completionFilter === 'unsolved' ? 'active' : ''}`}
            onClick={() => setCompletionFilter('unsolved')}
          >
            Unsolved ({puzzleCounts.unsolved})
          </button>
        </div>

        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`filter-button ${selectedTags.includes(category.id) ? 'active' : ''}`}
              onClick={() => toggleTag(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="puzzle-grid">
        {filteredPuzzles.map((puzzle) => (
          <PuzzleCard
            key={puzzle.id}
            puzzle={puzzle}
            completedPuzzleIds={completedPuzzleIds}
          />
        ))}
      </div>
    </div>
  );
}
