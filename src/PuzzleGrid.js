import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";
import { useNavigate } from "react-router-dom";
import { isPuzzleCompleted } from "./utils/storage";

export default function PuzzleGrid({ 
  selectedTags, 
  setSelectedTags
}) {
  const [puzzles, setPuzzles] = useState([]);
  const [allPuzzles, setAllPuzzles] = useState([]);
  const [tags, setTags] = useState([]);
  const [completionFilter, setCompletionFilter] = useState('all'); // 'all', 'solved', 'unsolved'
  const [completionStats, setCompletionStats] = useState({ solved: 0, total: 0 });
  const navigate = useNavigate();

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
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) =>
        Array.isArray(p.tags) && p.tags.some((tag) => selectedTags.includes(tag))
      );
    }

    // Filter by completion status
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

  if (!puzzles.length)
    return (
      <div className="puzzle-grid-container">
        <div className="puzzle-grid-header-section">
          <h1>Emoji Puzzles</h1>
          
          {/* Filter Section */}
          <div className="puzzle-grid-controls">
            {renderCompletionFilter()}

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
        <p className="puzzle-grid-empty">No puzzles found matching your filters</p>
      </div>
    );

  return (
    <div className="puzzle-grid-container">
      <div className="puzzle-grid-header-section">
        <h1>Emoji Puzzles</h1>
        
        {/* Filter Section */}
        <div className="puzzle-grid-controls">
          {renderCompletionFilter()}

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
        {puzzles.map((puzzle) => {
          const isCompleted = isPuzzleCompleted(puzzle.id);
          return (
            <div 
              className={`puzzle-card${isCompleted ? " completed" : ""}`}
              key={puzzle.id}
              onClick={() => navigate(`/puzzle/${puzzle.id}`)}
              style={{ cursor: 'pointer' }}
            >
              {/* Completion Badge */}
              {isCompleted && (
                <div className="completion-badge">
                  ✓ Solved
                </div>
              )}
              
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

              <div className="puzzle-card-preview">
                {isCompleted ? "View Solution →" : "Click to solve →"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
