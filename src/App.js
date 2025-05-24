import React, { useState, useEffect, useRef } from 'react';
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
  const [tagSearch, setTagSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef();

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
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  const handleSubmit = () => {
    const currentPuzzle = puzzles[index];
    if (!currentPuzzle) return;

    const normalizedGuess = guess.trim().toLowerCase();
    const correctAnswer = currentPuzzle.answer.trim().toLowerCase();

    // Accept if exactly correct, or edit distance <= 2
    if (
      normalizedGuess === correctAnswer ||
      levenshtein(normalizedGuess, correctAnswer) <= 2
    ) {
      setResult(`✅ Correct! The answer is: "${currentPuzzle.answer}"`);
    } else {
      setResult('❌ Try Again');
    }
  };

  const nextPuzzle = () => {
    setIndex((prev) => (prev + 1) % puzzles.length);
    setGuess('');
    setResult('');
    setShowHint(false);
  };

  // Chips logic
  const handleRemoveTag = (tag) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleDropdownSelect = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setTagSearch('');
      setShowDropdown(false);
    }
  };

  const filteredTags = tags.filter(
    tag =>
      tag.toLowerCase().includes(tagSearch.toLowerCase()) &&
      !selectedTags.includes(tag)
  );

  // Hide dropdown when clicking outside
  useEffect(() => {
    const handleClick = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  if (loading) return <p>Loading puzzles...</p>;
  if (puzzles.length === 0) return <p>No puzzles found for these tags.</p>;

  const current = puzzles[index];

  return (
    <div className="game-container">
      <header className="logo-header">
        <img src={logo} alt="EmojiCode logo" className="logo-large" />
      </header>

      {/* Tag chip selector with search bar and chips below */}
      <div className="tag-chip-selector">
        <strong>Filter by Tag:</strong>
        <div className="chip-search-center">
          <span className="tag-chip-input-wrapper" ref={inputRef}>
            <input
              className="tag-chip-input"
              type="text"
              placeholder="Search and add tag."
              value={tagSearch}
              onChange={e => {
                setTagSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && (
              <div className="tag-chip-dropdown">
                {filteredTags.length === 0 ? (
                  <div className="tag-chip-dropdown-item" style={{ color: '#aaa', cursor: 'not-allowed' }}>
                    No tags found
                  </div>
                ) : (
                  filteredTags.map(tag => (
                    <div
                      key={tag}
                      className="tag-chip-dropdown-item"
                      onMouseDown={() => handleDropdownSelect(tag)}
                    >
                      {tag}
                    </div>
                  ))
                )}
              </div>
            )}
          </span>
        </div>
        <div className="chip-list-row">
          {selectedTags.map(tag => (
            <span className="chip" key={tag}>
              {tag}
              <button
                className="chip-remove"
                onClick={() => handleRemoveTag(tag)}
                aria-label={`Remove ${tag}`}
                type="button"
              >×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Puzzle metadata */}
      <div className="puzzle-meta">
        {current.type && (
          <span className="meta-type">
            {current.type === 'Phonetic'
              ? '🔤 Phonetic'
              : current.type === 'Symbolic'
              ? '🧩 Symbolic'
              : '📝 Other'}
          </span>
        )}
        {current.tags && current.tags.length > 0 && (
          <span className="meta-tags">
            {current.tags.map((tag, i) => (
              <span className="meta-tag" key={tag}>
                {tag}{i < current.tags.length - 1 ? ',' : ''}
              </span>
            ))}
          </span>
        )}
      </div>

      <div className="puzzle">{current.emojis}</div>
      <input
        type="text"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        placeholder="Your guess..."
      />
      <div>
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={nextPuzzle} style={{ marginLeft: '0.75rem' }}>Skip</button>
      </div>
      <div className="result">{result}</div>
      <div className="hint" style={{ cursor: 'pointer' }} onClick={() => setShowHint(!showHint)}>
        {showHint ? `Hint: ${current.hint}` : 'Show Hint'}
      </div>
      {result && result.startsWith('✅') && <button onClick={nextPuzzle}>Next</button>}
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
