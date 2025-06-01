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
import { syncCompletedPuzzles } from './utils/storage';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session initialized:', session?.user?.id);
      setSession(session);
      
      if (session) {
        console.log('Triggering sync after session init');
        await syncCompletedPuzzles();
      }
      setLoading(false);
    };

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', session?.user?.id);
      setSession(session);
      if (session) {
        console.log('Triggering sync after auth state change');
        await syncCompletedPuzzles();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <Link to="/" className="logo-link">
              <img src={logo} alt="EmojiCode logo" className="logo" />
            </Link>
            
            <div className="nav-menu">
              <Link to="/" className="nav-item">
                All
              </Link>
              {session ? (
                <>
                  <Link to="/my-puzzles" className="nav-item">
                    My Puzzles
                  </Link>
                  <Link to="/submit" className="nav-item">
                    Create
                  </Link>
                  <button 
                    onClick={() => supabase.auth.signOut()}
                    className="nav-item sign-out"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login" className="nav-item">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </header>

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
