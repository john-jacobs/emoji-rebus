// src/SubmitPuzzle.js
import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function SubmitPuzzle() {
  const [emojis, setEmojis] = useState('');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const tagArray = tags.split(',').map(t => t.trim().toLowerCase());

    const { error } = await supabase
      .from('puzzles')
      .insert([
        {
          emojis,
          answer: answer.toLowerCase().trim(),
          hint,
          tags: tagArray,
          created_by: null  // or use a user ID if you implement auth later
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
    }
  };

  return (
    <div className="submit-form">
      <h2>Submit a Rebus Puzzle</h2>
      <form onSubmit={handleSubmit}>
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
