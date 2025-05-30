import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      
      setMessage('Check your email for the magic link!');
      setEmail(''); // Clear the input
    } catch (error) {
      setMessage(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleLogin} className="auth-form">
        <h1>Welcome to Emoji Rebus</h1>
        <p>Enter your email to receive a magic link</p>
        
        <input
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
          required
        />
        
        <button
          type="submit"
          disabled={loading}
          className="auth-button"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>

        {message && (
          <div className={`message ${message.includes('Check') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
} 