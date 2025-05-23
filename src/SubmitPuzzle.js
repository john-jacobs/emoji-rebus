// src/SubmitPuzzle.js
import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import logo from './logo-transparent.png';

export default function SubmitPuzzle() {
  const [emojis, setEmojis] = useState('');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

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
      setEmojis('');
      setAnswer('');
      setHint('');
      setTags('');
      setType('');
    }
  };

  return (
    <div className="submit-form">
      <header className="logo-header">
        <img src={logo} alt="EmojiCode logo" className="logo-large" />
      </header>
      <h2>Submit an EmojiCode</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Puzzle Type: <span style={{ color: "#d33" }}>*</span></label>
          <div>
            <label>
              <input
                type="radio"
                name="puzzleType"
                value="Phonetic"
                checked={type === 'Phonetic'}
                onChange={() => setType('Phonetic')}
                required
              />
              Phonetic (sound-based)
            </label>
            <label style={{ marginLeft: '1.2rem' }}>
              <input
                type="radio"
                name="puzzleType"
                value="Symbolic"
                checked={type === 'Symbolic'}
                onChange={() => setType('Symbolic')}
                required
              />
              Symbolic (concept-based)
            </label>
            <label style={{ marginLeft: '1.2rem' }}>
              <input
                type="radio"
                name="puzzleType"
                value="Other"
                checked={type === 'Other'}
                onChange={() => setType('Other')}
                required
              />
              Other
            </label>
          </div>
        </div>
        <input
          type="text"
          placeholder="Emoji puzzle (e.g. 🐝➕🎶)"
          value={emojis}
          onChange={(e) => setEmojis(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Answer (e.g. be positive)"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Hint (optional)"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
        />
        <input
          type="text"
          placeholder="Tags (comma-separated, e.g. music, phrase)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <button type="submit">Submit Puzzle</button>
      </form>
      <p>{status}</p>
    </div>
  );
}
