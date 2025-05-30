// File: src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import SubmitPuzzle from "./SubmitPuzzle";
import PuzzleGrid from "./PuzzleGrid";
import PuzzleDetail from "./PuzzleDetail";
import Auth from "./components/Auth";
import "./App.css";
import logo from "./logo-transparent.png";
import MyPuzzles from "./MyPuzzles";
import EditPuzzle from "./EditPuzzle";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <nav>
          <Link to="/" className="nav-logo">
            <img src={logo} alt="EmojiCode logo" className="nav-logo-image" />
          </Link>
          <div className="nav-links">
            <Link to="/">All Puzzles</Link>
            {session ? (
              <>
                <Link to="/my-puzzles">My Puzzles</Link>
                <Link to="/submit">Create</Link>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="nav-button"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login">Sign In</Link>
            )}
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
          <Route 
            path="/submit" 
            element={
              session ? (
                <SubmitPuzzle />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/login" 
            element={
              !session ? (
                <Auth />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/my-puzzles" 
            element={
              session ? (
                <MyPuzzles />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/edit-puzzle/:id" 
            element={
              session ? (
                <EditPuzzle />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
