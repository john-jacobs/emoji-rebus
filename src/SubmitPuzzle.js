// src/SubmitPuzzle.js
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function SubmitPuzzle() {
  const [emojis, setEmojis] = useState('');
  const [answer, setAnswer] = useState('');
  const [hints, setHints] = useState(['']); // Initialize with one empty hint
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [explanation, setExplanation] = useState(''); // Add explanation state
  const [status, setStatus] = useState('');
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
      } else if (data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  const handleHintChange = (index, value) => {
    const newHints = [...hints];
    newHints[index] = value;
    setHints(newHints);
  };

  const addHint = () => {
    setHints([...hints, '']);
  };

  const removeHint = (index) => {
    if (hints.length > 1) {
      const newHints = hints.filter((_, i) => i !== index);
      setHints(newHints);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!type) {
      setStatus('❌ Please select a puzzle type.');
      return;
    }

    if (!category) {
      setStatus('❌ Please select a category.');
      return;
    }

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setStatus('❌ You must be logged in to create puzzles.');
      navigate('/login');
      return;
    }

    // Filter out empty hints
    const filteredHints = hints.filter(hint => hint.trim() !== '');

    const { data, error } = await supabase
      .from('puzzles')
      .insert([
        {
          emojis,
          answer: answer.toLowerCase().trim(),
          hints: filteredHints,
          category_id: category,
          created_by: session.user.id,
          type,
          explanation: explanation.trim() || null // Add explanation to insert
        }
      ])
      .select();

    if (error) {
      setStatus(`❌ Error: ${error.message}`);
    } else {
      setStatus('✅ Puzzle created! Redirecting...');
      setEmojis('');
      setAnswer('');
      setHints(['']);
      setCategory('');
      setType('');
      setExplanation(''); // Clear explanation
      
      // Navigate to the puzzle detail page using the newly created puzzle's ID
      const newPuzzleId = data[0].id;
      setTimeout(() => {
        navigate(`/puzzle/${newPuzzleId}`);
      }, 1000);
    }
  };

  return (
    <div className="puzzle-detail">
      <button className="back-button" onClick={() => navigate("/")}>
        ← Back to All Puzzles
      </button>

      <div className="puzzle-detail-content">
        <h1 className="create-puzzle-title">Create New Puzzle</h1>
        
        <form onSubmit={handleSubmit} className="create-puzzle-form">
          {/* Puzzle Type Selection */}
          <div className="form-group">
            <label className="form-label">
              Puzzle Type <span className="required">*</span>
            </label>
            <div className="type-options">
              <label className="type-option">
                <input
                  type="radio"
                  name="puzzleType"
                  value="Phonetic"
                  checked={type === 'Phonetic'}
                  onChange={() => setType('Phonetic')}
                  required
                />
                <span className="type-label">
                  <span className="type-emoji">🔤</span>
                  Phonetic
                </span>
              </label>
              <label className="type-option">
                <input
                  type="radio"
                  name="puzzleType"
                  value="Symbolic"
                  checked={type === 'Symbolic'}
                  onChange={() => setType('Symbolic')}
                  required
                />
                <span className="type-label">
                  <span className="type-emoji">🧩</span>
                  Symbolic
                </span>
              </label>
              <label className="type-option">
                <input
                  type="radio"
                  name="puzzleType"
                  value="Other"
                  checked={type === 'Other'}
                  onChange={() => setType('Other')}
                  required
                />
                <span className="type-label">
                  <span className="type-emoji">📝</span>
                  Other
                </span>
              </label>
            </div>
          </div>

          {/* Emoji Input */}
          <div className="form-group">
            <label className="form-label">
              Emoji Puzzle <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input emoji-input"
              placeholder="Enter emojis (e.g. 🐝➕🎶)"
              value={emojis}
              onChange={(e) => setEmojis(e.target.value)}
              required
            />
          </div>

          {/* Answer Input */}
          <div className="form-group">
            <label className="form-label">
              Answer <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter answer (e.g. be positive)"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
            />
          </div>

          {/* Category Selection */}
          <div className="form-group">
            <label className="form-label">
              Category <span className="required">*</span>
            </label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Explanation Field */}
          <div className="form-group">
            <label className="form-label">
              Explanation <span className="optional">(optional)</span>
            </label>
            <textarea
              className="form-input"
              placeholder="Add an explanation for how the puzzle works (will be shown after solving)"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
            />
          </div>

          {/* Hints Input */}
          <div className="form-group">
            <label className="form-label">
              Hints <span className="optional-label">(optional)</span>
            </label>
            <div className="hints-container">
              {hints.map((hint, index) => (
                <div key={index} className="hint-input-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`Hint ${index + 1}`}
                    value={hint}
                    onChange={(e) => handleHintChange(index, e.target.value)}
                  />
                  {hints.length > 1 && (
                    <button
                      type="button"
                      className="hint-remove-button"
                      onClick={() => removeHint(index)}
                      aria-label="Remove hint"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="hint-add-button"
                onClick={addHint}
              >
                + Add Another Hint
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-button create-submit">
            Create Puzzle
          </button>
        </form>

        {/* Status Message */}
        {status && (
          <div className={`puzzle-result ${status.startsWith("✅") ? "correct" : "incorrect"}`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
