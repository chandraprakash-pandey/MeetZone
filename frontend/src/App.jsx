import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function App() {
  const navigate = useNavigate();
  const [showJoin, setShowJoin] = useState(false);
  const [meetId, setMeetId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState('');

  const insertRoomID = async (meetID) => {
    try {
      await axios.post('http://localhost:3000/api/createRoomID', { roomID: meetID });
    } catch (err) {
      console.error('Error sending roomID:', err);
    }
  };

  const generateToken = async () => {
    setIsLoading(true);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const byte = new Uint8Array(9);
    window.crypto.getRandomValues(byte);
    const rawToken = Array.from(byte).map((b) => chars[b % chars.length]).join('');
    const token = `${rawToken.slice(0, 3)}-${rawToken.slice(3, 6)}-${rawToken.slice(6, 9)}`;
    setCreatedCode(token);
    await insertRoomID(token);
    setIsLoading(false);
    navigate(`/${token}`);
  };

  const checkMeetId = async () => {
    const trimmed = meetId.trim().toUpperCase();
    if (!trimmed) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:3000/api/checkRoomID', { roomID: trimmed });
      if (response.data.exists) {
        navigate(`/${trimmed}`);
      } else {
        setError('No room found with that code. Check the code and try again.');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    }
    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#060e20', color: '#dae2fd', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Ambient glow backgrounds */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(128,131,255,0.07) 0%, rgba(6,14,32,0) 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw',
        background: 'radial-gradient(circle, rgba(192,193,255,0.04) 0%, rgba(6,14,32,0) 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '-48px', right: '-48px', width: '256px', height: '256px',
        background: 'linear-gradient(135deg, rgba(192,193,255,0.1), rgba(128,131,255,0.02))',
        backdropFilter: 'blur(8px)', border: '1px solid rgba(192,193,255,0.05)',
        borderRadius: '50%', transform: 'rotate(15deg)', pointerEvents: 'none',
      }} />

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '480px', padding: '0 24px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '2.5rem',
            letterSpacing: '-0.04em', lineHeight: 1,
            background: 'linear-gradient(135deg, #c0c1ff, #8083ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '6px',
          }}>
            MeetingZone
          </h1>
          <p style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.15em', color: '#c7c4d7', textTransform: 'uppercase' }}>
            Real-time video rooms
          </p>
        </div>

        {/* Glass card */}
        <div style={{
          background: 'rgba(49, 57, 77, 0.6)', backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)', borderRadius: '12px',
          border: '1px solid rgba(70,69,84,0.15)',
          boxShadow: '0px 12px 32px rgba(11,19,38,0.4)',
          overflow: 'hidden',
        }}>
          {/* Card header */}
          <div style={{ padding: '32px 32px 24px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#dae2fd', marginBottom: '8px' }}>
              {showJoin ? 'Join a Room' : 'Start a Meeting'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d7' }}>
              {showJoin
                ? 'Enter a room code to join an existing meeting.'
                : 'Create an instant room or join one with a code.'}
            </p>
          </div>

          {/* Divider line */}
          <div style={{ height: '1px', background: 'rgba(70,69,84,0.2)', margin: '0 32px' }} />

          {/* Card body */}
          <div style={{ padding: '24px 32px 32px' }}>
            {!showJoin ? (
              /* Default: two action buttons */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={generateToken}
                  disabled={isLoading}
                  style={{
                    width: '100%', padding: '14px 20px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #c0c1ff, #8083ff)',
                    color: '#1000a9', fontWeight: 600, fontSize: '0.875rem',
                    border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'opacity 0.2s, transform 0.2s',
                    boxShadow: '0 4px 12px rgba(192,193,255,0.2)',
                  }}
                  onMouseEnter={e => !isLoading && (e.target.style.transform = 'translateY(-1px)')}
                  onMouseLeave={e => (e.target.style.transform = 'translateY(0)')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                  {isLoading ? 'Creating...' : 'Create New Room'}
                </button>

                <button
                  onClick={() => setShowJoin(true)}
                  style={{
                    width: '100%', padding: '14px 20px', borderRadius: '8px',
                    background: 'transparent', color: '#c0c1ff', fontWeight: 600, fontSize: '0.875rem',
                    border: '1px solid rgba(70,69,84,0.3)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(192,193,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 0" }}>login</span>
                  Join with Code
                </button>
              </div>
            ) : (
              /* Join flow */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#c7c4d7', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Room Code
                  </label>
                  <div style={{
                    background: '#2d3449', borderRadius: '4px', display: 'flex', alignItems: 'center',
                    padding: '12px 14px', gap: '10px',
                    boxShadow: error ? 'inset 0 0 0 1px rgba(255,180,171,0.4)' : undefined,
                    transition: 'box-shadow 0.2s',
                  }}
                    onFocus={e => e.currentTarget.style.boxShadow = 'inset 0 0 0 1px rgba(192,193,255,0.4)'}
                    onBlur={e => e.currentTarget.style.boxShadow = error ? 'inset 0 0 0 1px rgba(255,180,171,0.4)' : 'none'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#908fa0', fontVariationSettings: "'FILL' 0" }}>tag</span>
                    <input
                      type="text"
                      placeholder="e.g. ABC-DEF-GHI"
                      value={meetId}
                      onChange={e => { setMeetId(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && checkMeetId()}
                      style={{
                        background: 'transparent', border: 'none', outline: 'none', width: '100%',
                        color: '#dae2fd', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif',
                        letterSpacing: '0.05em',
                      }}
                    />
                  </div>
                  {error && (
                    <p style={{ fontSize: '0.75rem', color: '#ffb4ab', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                      {error}
                    </p>
                  )}
                </div>

                <button
                  onClick={checkMeetId}
                  disabled={isLoading || !meetId.trim()}
                  style={{
                    width: '100%', padding: '14px 20px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #c0c1ff, #8083ff)',
                    color: '#1000a9', fontWeight: 600, fontSize: '0.875rem',
                    border: 'none', cursor: isLoading || !meetId.trim() ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !meetId.trim() ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'opacity 0.2s',
                    boxShadow: '0 4px 12px rgba(192,193,255,0.2)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
                  {isLoading ? 'Checking...' : 'Join Room'}
                </button>

                <button
                  onClick={() => { setShowJoin(false); setMeetId(''); setError(''); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#c7c4d7', fontSize: '0.8125rem', textAlign: 'center',
                    padding: '4px', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#dae2fd')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#c7c4d7')}
                >
                  ← Back
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.75rem', color: '#464554' }}>
          No account needed · Instant rooms · End-to-end encrypted
        </p>
      </div>
    </div>
  );
}