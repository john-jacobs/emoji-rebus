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
    hint: ""
  });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

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
          hint: puzzle.hint || ""
        };
        console.log("Setting form data to:", formDataUpdate);
        setFormData(formDataUpdate);
        setPuzzle(puzzle);
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

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("puzzles")
        .update({
          emojis: formData.emoji_sequence,
          answer: formData.answer,
          category_id: formData.category_id,
          hint: formData.hint
        })
        .eq("id", id);

      if (error) throw error;
      navigate("/my-puzzles");
    } catch (error) {
      console.error("Error updating puzzle:", error);
      setError("Error updating puzzle");
    }
  }

  if (loading) return <div className="loading">Loading puzzle data...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!puzzle) return <div className="error">Puzzle not found</div>;

  return (
    <div className="submit-container">
      <h2>Edit Puzzle</h2>
      <form onSubmit={handleSubmit} className="submit-form">
        <div className="form-group">
          <label>Emoji Sequence:</label>
          <input
            type="text"
            value={formData.emoji_sequence}
            onChange={(e) => setFormData({ ...formData, emoji_sequence: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Answer:</label>
          <input
            type="text"
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Category:</label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
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
          <label>Hint (optional):</label>
          <input
            type="text"
            value={formData.hint}
            onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
          />
        </div>

        <div className="button-group">
          <button type="submit" className="submit-button">
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