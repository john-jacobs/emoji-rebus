// File: src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import SubmitPuzzle from './SubmitPuzzle';
import './App.css';

function PlayGame() {
  const [puzzles, setPuzzles] = useState([]);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPuzzles = async () => {
      const { data, error } = await supabase
        .from('puzzles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Fetched puzzles:', data, error); // Debug output

      if (error) {
        console.error('Error fetching puzzles:', error);
      } else {
        setPuzzles(data);
        setLoading(false);
      }
    };

    fetchPuzzles();
  }, []);

  const handleSubmit = () => {
    const currentPuzzle = puzzles[index];
    if (!currentPuzzle) return;

    const normalizedGuess = guess.trim().toLowerCase();
    const correctAnswer = currentPuzzle.answer.trim().toLowerCase();

    setResult(
      normalizedGuess === correctAnswer ? '✅ Correct!' : '❌ Try Again'
    );
  };

  const nextPuzzle = () => {
    setIndex((prev) => (prev + 1) % puzzles.length);
    setGuess('');
    setResult('');
  };

  if (loading) return <p>Loading puzzles...</p>;
  if (puzzles.length === 0) return <p>No puzzles found.</p>;

  const current = puzzles[index];

  return (
    <div>
      <h2>Emoji Rebus Game</h2>
      <div className="puzzle">{current.emojis}</div>
      <input
        type="text"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        placeholder="Your guess..."
      />
      <button onClick={handleSubmit}>Submit</button>
      <div className="result">{result}</div>
      {result === '✅ Correct!' && <button onClick={nextPuzzle}>Next</button>}
      <div className="hint">Hint: {current.hint}</div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <nav>
          <Link to="/">Play</Link> | <Link to="/submit">Create</Link>
        </nav>
        <Routes>
          <Route path="/" element={<PlayGame />} />
          <Route path="/submit" element={<SubmitPuzzle />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
