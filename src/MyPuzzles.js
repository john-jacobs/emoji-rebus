import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import { calculateEmojiSize } from "./utils/emojiUtils";
import "./App.css";

function MyPuzzleCard({ puzzle, onDelete }) {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const emojiSize = calculateEmojiSize(300, puzzle.emojis);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      try {
        const { error } = await supabase
          .from('puzzles')
          .delete()
          .eq('id', puzzle.id);

        if (error) throw error;
        onDelete(puzzle.id);
      } catch (error) {
        console.error('Error deleting puzzle:', error);
        alert('Failed to delete puzzle');
      }
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div 
      className="puzzle-card my-puzzle"
      onClick={() => navigate(`/puzzle/${puzzle.id}`)}
    >
      <div className="puzzle-card-actions">
        <button 
          className="edit-button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/edit-puzzle/${puzzle.id}`);
          }}
        >
          ✏️ Edit
        </button>
        <button 
          className={`delete-button ${showDeleteConfirm ? 'confirm' : ''}`}
          onClick={handleDelete}
          onMouseLeave={() => setShowDeleteConfirm(false)}
        >
          {showDeleteConfirm ? '🗑️ Confirm' : '🗑️ Delete'}
        </button>
      </div>

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
    </div>
  );
}

export default function MyPuzzles() {
  const navigate = useNavigate();
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyPuzzles = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }

        const { data: puzzleData, error: puzzleError } = await supabase
          .from("puzzles")
          .select(`
            *,
            categories (
              id,
              name
            )
          `)
          .eq('created_by', session.user.id)
          .order('created_at', { ascending: false });

        if (puzzleError) throw puzzleError;
        setPuzzles(puzzleData || []);
      } catch (error) {
        console.error('Error fetching puzzles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPuzzles();
  }, [navigate]);

  const handleDelete = (puzzleId) => {
    setPuzzles(puzzles.filter(p => p.id !== puzzleId));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading your puzzles...</div>
      </div>
    );
  }

  return (
    <div className="puzzle-grid-container">
      <div className="puzzle-grid-header-section">
        <h1>My Puzzles</h1>
        <div className="my-puzzles-stats">
          <div className="stat-item">
            Total Puzzles Created: {puzzles.length}
          </div>
        </div>
      </div>

      {puzzles.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any puzzles yet.</p>
          <button 
            className="create-button"
            onClick={() => navigate('/submit')}
          >
            Create Your First Puzzle
          </button>
        </div>
      ) : (
        <div className="puzzle-cards">
          {puzzles.map((puzzle) => (
            <MyPuzzleCard 
              key={puzzle.id} 
              puzzle={puzzle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
} 