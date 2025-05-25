// File: src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SubmitPuzzle from "./SubmitPuzzle";
import PuzzleGrid from "./PuzzleGrid";
import PuzzleDetail from "./PuzzleDetail";
import "./App.css";
import logo from "./logo-transparent.png";

function App() {
  const [selectedTags, setSelectedTags] = useState([]);

  return (
    <Router>
      <div className="app">
        <nav>
          <Link to="/" className="nav-logo">
            <img src={logo} alt="EmojiCode logo" className="nav-logo-image" />
          </Link>
          <div className="nav-links">
            <Link to="/">All Puzzles</Link>
            <Link to="/submit">Create</Link>
          </div>
        </nav>
        <Routes>
          <Route 
            path="/" 
            element={
              <PuzzleGrid 
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
              />
            } 
          />
          <Route 
            path="/puzzle/:id" 
            element={<PuzzleDetail />} 
          />
          <Route path="/submit" element={<SubmitPuzzle />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
