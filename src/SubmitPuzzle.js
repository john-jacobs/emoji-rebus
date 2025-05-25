// src/SubmitPuzzle.js
import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function SubmitPuzzle() {
  const [emojis, setEmojis] = useState('');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!type) {
      setStatus('❌ Please select a puzzle type.');
      return;
    }

    const tagArray = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    const { error } = await supabase
      .from('puzzles')
      .insert([
        {
          emojis,
          answer: answer.toLowerCase().trim(),
          hint,
          tags: tagArray,
          created_by: null,
          type
        }
      ]);

    if (error) {
      setStatus(`❌ Error: ${error.message}`);
    } else {
      setStatus('✅ Puzzle submitted!');
      // Clear form after successful submission
      setEmojis('');
      setAnswer('');
      setHint('');
      setTags('');
      setType('');
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
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

          {/* Hint Input */}
          <div className="form-group">
            <label className="form-label">
              Hint <span className="optional-label">(optional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter a helpful hint"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
            />
          </div>

          {/* Tags Input */}
          <div className="form-group">
            <label className="form-label">
              Tags <span className="optional-label">(optional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter tags, separated by commas (e.g. music, phrase)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
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
