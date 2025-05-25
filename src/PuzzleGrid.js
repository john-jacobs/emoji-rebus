import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";
import { useNavigate } from "react-router-dom";

export default function PuzzleGrid({ 
  selectedTags, 
  setSelectedTags
}) {
  const [puzzles, setPuzzles] = useState([]);
  const [allPuzzles, setAllPuzzles] = useState([]);
  const [tags, setTags] = useState([]);
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
    
    setPuzzles(filtered);
  }, [selectedTags, allPuzzles]);

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
        
        {/* Filter Section */}
        <div className="puzzle-grid-controls">
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
          <div 
            className="puzzle-card" 
            key={puzzle.id}
            onClick={() => navigate(`/puzzle/${puzzle.id}`)}
            style={{ cursor: 'pointer' }}
          >
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
              Click to solve →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
