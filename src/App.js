// File: src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import SubmitPuzzle from './SubmitPuzzle';
import './App.css';
import logo from './logo-transparent.png';

function PlayGame() {
  const [puzzles, setPuzzles] = useState([]);
  const [allPuzzles, setAllPuzzles] = useState([]);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showAll, setShowAll] = useState(false);

  // State for guesses/results per puzzle in "all" mode
  const [allGuesses, setAllGuesses] = useState({});
  const [allResults, setAllResults] = useState({});
  const [allHints, setAllHints] = useState({});

  // Fetch all puzzles and tags
  useEffect(() => {
    const fetchPuzzles = async () => {
      const { data, error } = await supabase
        .from('puzzles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching puzzles:', error);
      } else {
        setAllPuzzles(data);

        // Gather all unique tags
        const tagSet = new Set();
        data.forEach((p) => {
          if (Array.isArray(p.tags)) {
            p.tags.forEach((tag) => tagSet.add(tag));
          }
        });
        setTags(Array.from(tagSet).sort());
        setLoading(false);
      }
    };

    fetchPuzzles();
  }, []);

  // Filter puzzles by selected tags
  useEffect(() => {
    if (selectedTags.length === 0) {
      setPuzzles(allPuzzles);
      setIndex(0);
    } else {
      const filtered = allPuzzles.filter((p) =>
        Array.isArray(p.tags) && p.tags.some(tag => selectedTags.includes(tag))
      );
      setPuzzles(filtered);
      setIndex(0);
    }
    // Reset per-puzzle state when tag filter changes
    setAllGuesses({});
    setAllResults({});
    setAllHints({});
  }, [selectedTags, allPuzzles]);

  // Levenshtein distance function for fuzzy matching
  function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Single puzzle submit
  const handleSubmit = () => {
    const currentPuzzle = puzzles[index];
    if (!currentPuzzle) return;
    const normalizedGuess = guess.trim().toLowerCase();
    const correctAnswer = currentPuzzle.answer.trim().toLowerCase();
    if (
      normalizedGuess === correctAnswer ||
      levenshtein(normalizedGuess, correctAnswer) <= 2
    ) {
      setResult(`✅ Correct! The answer is: "${currentPuzzle.answer}"`);
    } else {
      setResult('❌ Try Again');
    }
  };

  // All puzzles submit
  const handleAllSubmit = (puzzleId, userGuess, answer) => {
    const normalizedGuess = userGuess.trim().toLowerCase();
    const correctAnswer = answer.trim().toLowerCase();
    let newResults = { ...allResults };
    if (
      normalizedGuess === correctAnswer ||
      levenshtein(normalizedGuess, correctAnswer) <= 2
    ) {
      newResults[puzzleId] = `✅ Correct! The answer is: "${answer}"`;
    } else {
      newResults[puzzleId] = '❌ Try Again';
    }
    setAllResults(newResults);
  };

  // Tag toggle (buttons only)
  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) return <p>Loading puzzles...</p>;
  if (puzzles.length === 0) return <p>No puzzles found for these tags.</p>;

  const current = puzzles[index];

  return (
    <div className="game-container">
      <header className="logo-header">
        <img src={logo} alt="EmojiCode logo" className="logo-large" />
      </header>
      <div className="subtitle">Guess the emoji puzzle!</div>

      {/* View toggle */}
      <div style={{ marginBottom: "1.2rem" }}>
        <button
          className={!showAll ? "selected" : ""}
          style={{ marginRight: "0.7em" }}
          onClick={() => setShowAll(false)}
        >
          One at a time
        </button>
        <button
          className={showAll ? "selected" : ""}
          onClick={() => setShowAll(true)}
        >
          Show all
        </button>
      </div>

      {/* Tag selector as BUTTONS ONLY */}
      <div className="tag-selector">
        <strong>Filter by Tag:</strong>
        <div className="tag-list">
          {tags.map(tag => (
            <button
              type="button"
              key={tag}
              className={`tag-item${selectedTags.includes(tag) ? ' selected' : ''}`}
              onClick={() => handleTagToggle(tag)}
              aria-pressed={selectedTags.includes(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {!showAll ? (
        // Classic single-puzzle mode
        <>
          <div className="puzzle">{current.emojis}</div>
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Your guess..."
          />
          <div>
            <button onClick={handleSubmit}>Submit</button>
            <button onClick={() => {
              setIndex((prev) => (prev + 1) % puzzles.length);
              setGuess('');
              setResult('');
              setShowHint(false);
            }} style={{ marginLeft: '0.75rem' }}>Skip</button>
          </div>
          <div className="result">{result}</div>
          {current.type && (
            <div className="puzzle-type">
              {current.type === 'Phonetic'
                ? '🔤 Phonetic'
                : current.type === 'Symbolic'
                ? '🧩 Symbolic'
                : '📝 Other'}
            </div>
          )}
          <div
            className="hint"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowHint(!showHint)}
          >
            {showHint ? `Hint: ${current.hint}` : 'Show Hint'}
          </div>
          {result && result.startsWith('✅') && (
            <button onClick={() => {
              setIndex((prev) => (prev + 1) % puzzles.length);
              setGuess('');
              setResult('');
              setShowHint(false);
            }}>Next</button>
          )}
        </>
      ) : (
        // "All" mode: List all puzzles in a grid
        <div className="puzzle-grid">
          {puzzles.map((puzzle) => (
            <div key={puzzle.id} className="puzzle-card">
              <div className="puzzle">{puzzle.emojis}</div>
              <input
                type="text"
                value={allGuesses[puzzle.id] || ""}
                onChange={e =>
                  setAllGuesses(g => ({ ...g, [puzzle.id]: e.target.value }))
                }
                placeholder="Your guess..."
              />
              <div>
                <button
                  onClick={() =>
                    handleAllSubmit(
                      puzzle.id,
                      allGuesses[puzzle.id] || "",
                      puzzle.answer
                    )
                  }
                >
                  Submit
                </button>
              </div>
              <div className="result">{allResults[puzzle.id] || ""}</div>
              {puzzle.type && (
                <div className="puzzle-type">
                  {puzzle.type === 'Phonetic'
                    ? '🔤 Phonetic'
                    : puzzle.type === 'Symbolic'
                    ? '🧩 Symbolic'
                    : '📝 Other'}
                </div>
              )}
              <div
                className="hint"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  setAllHints(hints => ({
                    ...hints,
                    [puzzle.id]: !hints[puzzle.id],
                  }))
                }
              >
                {allHints[puzzle.id] ? `Hint: ${puzzle.hint}` : 'Show Hint'}
              </div>
            </div>
          ))}
        </div>
      )}
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
