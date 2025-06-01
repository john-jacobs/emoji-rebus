import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./App.css";

export default function EditPuzzle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    emoji_sequence: "",
    answer: "",
    category_id: "",
    hints: [""]
  });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [explanation, setExplanation] = useState("");

  const fetchPuzzle = useCallback(async () => {
    try {
      console.log("Fetching puzzle with ID:", id);
      const { data: puzzle, error } = await supabase
        .from("puzzles")
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      console.log("Fetched puzzle data:", puzzle);

      if (puzzle) {
        const formDataUpdate = {
          emoji_sequence: puzzle.emojis || "",
          answer: puzzle.answer || "",
          category_id: puzzle.category_id || "",
          hints: puzzle.hints && puzzle.hints.length > 0 ? puzzle.hints : [""]
        };
        console.log("Setting form data to:", formDataUpdate);
        setFormData(formDataUpdate);
        setPuzzle(puzzle);
        setExplanation(puzzle.explanation || "");
      }
    } catch (error) {
      console.error("Error fetching puzzle:", error);
      setError("Error loading puzzle");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*");

      if (error) throw error;
      console.log("Fetched categories:", data);
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    console.log("Component mounted with ID:", id);
    fetchPuzzle();
    fetchCategories();
  }, [fetchPuzzle, fetchCategories, id]);

  const handleHintChange = (index, value) => {
    const newHints = [...formData.hints];
    newHints[index] = value;
    setFormData({ ...formData, hints: newHints });
  };

  const addHint = () => {
    setFormData({ ...formData, hints: [...formData.hints, ""] });
  };

  const removeHint = (index) => {
    if (formData.hints.length > 1) {
      const newHints = formData.hints.filter((_, i) => i !== index);
      setFormData({ ...formData, hints: newHints });
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const filteredHints = formData.hints.filter(hint => hint.trim() !== "");

      const { error } = await supabase
        .from("puzzles")
        .update({
          emojis: formData.emoji_sequence,
          answer: formData.answer.toLowerCase().trim(),
          category_id: formData.category_id,
          hints: filteredHints,
          explanation: explanation.trim() || null
        })
        .eq("id", id);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      navigate("/my-puzzles");
    } catch (error) {
      console.error("Error updating puzzle:", error);
      setError(error.message || "Error updating puzzle");
    }
  }

  if (loading) return <div className="loading">Loading puzzle data...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!puzzle) return <div className="error">Puzzle not found</div>;

  return (
    <div className="edit-puzzle-container">
      <h1 className="edit-puzzle-title">Edit Puzzle</h1>
      
      <form onSubmit={handleSubmit} className="edit-puzzle-form">
        <div className="form-group">
          <label className="form-label">Emoji Sequence:</label>
          <input
            type="text"
            value={formData.emoji_sequence}
            onChange={(e) => setFormData({ ...formData, emoji_sequence: e.target.value })}
            className="form-input emoji-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Answer:</label>
          <input
            type="text"
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category:</label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="form-select"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Hints:</label>
          {formData.hints.map((hint, index) => (
            <div key={index} className="hint-input-group">
              <input
                type="text"
                value={hint}
                onChange={(e) => handleHintChange(index, e.target.value)}
                placeholder={`Hint ${index + 1}`}
                className="form-input"
              />
              {formData.hints.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHint(index)}
                  className="remove-hint-button"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addHint}
            className="add-hint-button"
          >
            Add Hint
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">
            Explanation <span className="optional-label">(optional)</span>
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Add an explanation for how the puzzle works (will be shown after solving)"
            className="form-textarea explanation-input"
            rows={3}
          />
        </div>

        <div className="button-group">
          <button type="submit" className="update-button">
            Update Puzzle
          </button>
          <button
            type="button"
            onClick={() => navigate("/my-puzzles")}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 