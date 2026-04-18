import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const BACKEND = 'http://localhost:3000';

const T = {
  surfaceLowest: '#060e20',
  surfaceLow: '#131b2e',
  surface: '#0b1326',
  surfaceHigh: '#222a3d',
  surfaceHighest: '#2d3449',
  primary: '#c0c1ff',
  primaryContainer: '#8083ff',
  onPrimary: '#1000a9',
  onSurface: '#dae2fd',
  onSurfaceVariant: '#c7c4d7',
  outline: '#908fa0',
  outlineVariant: '#464554',
};

export default function MeetRoom() {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [peers, setPeers] = useState({});

  const navigate = useNavigate();
  const { roomId } = useParams();

  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConns = useRef({});
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildPeer = useCallback((toSocketId, localStream) => {
    if (peerConns.current[toSocketId]) peerConns.current[toSocketId].close();
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current?.connected)
        socketRef.current.emit('ice-candidate', { roomId, candidate, toSocketId });
    };
    pc.ontrack = (event) => {
      setPeers(prev => ({
        ...prev,
        [toSocketId]: { name: prev[toSocketId]?.name || 'Unknown', stream: event.streams[0] },
      }));
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected')
        cleanupPeer(toSocketId);
    };
    peerConns.current[toSocketId] = pc;
    return pc;
  }, [roomId]);

  const cleanupPeer = (socketId) => {
    peerConns.current[socketId]?.close();
    delete peerConns.current[socketId];
    setPeers(prev => { const n = { ...prev }; delete n[socketId]; return n; });
  };

  useEffect(() => {
    if (!submitted || !name.trim()) return;
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const socket = io(BACKEND, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => socket.emit('join-room', { roomId, name: name.trim() }));

        socket.on('existing-users', async (users) => {
          for (const user of users) {
            setPeers(prev => ({ ...prev, [user.socketId]: { name: user.name, stream: null } }));
            const pc = buildPeer(user.socketId, stream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { roomId, offer, toSocketId: user.socketId });
          }
        });

        socket.on('user-joined', ({ socketId, name: remoteName }) => {
          setPeers(prev => ({ ...prev, [socketId]: { name: remoteName, stream: prev[socketId]?.stream || null } }));
        });

        socket.on('offer', async ({ offer, fromSocketId, fromName }) => {
          setPeers(prev => ({
            ...prev,
            [fromSocketId]: { name: fromName || prev[fromSocketId]?.name || 'Unknown', stream: prev[fromSocketId]?.stream || null },
          }));
          const pc = buildPeer(fromSocketId, stream);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { roomId, answer, toSocketId: fromSocketId });
        });

        socket.on('answer', async ({ answer, fromSocketId }) => {
          const pc = peerConns.current[fromSocketId];
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('ice-candidate', async ({ candidate, fromSocketId }) => {
          const pc = peerConns.current[fromSocketId];
          if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on('user-left', ({ socketId }) => cleanupPeer(socketId));
        socket.on('chat-message', (msg) => setMessages(prev => [...prev, { ...msg, self: false }]));
      } catch (err) {
        console.error('Meeting Init Error:', err);
      }
    };
    init();
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      Object.values(peerConns.current).forEach(pc => pc.close());
      socketRef.current?.disconnect();
    };
  }, [submitted, roomId]);

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
  };
  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCamOff(!track.enabled); }
  };
  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text || !socketRef.current) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    socketRef.current.emit('chat-message', { roomId, senderName: name, text, time });
    setMessages(prev => [...prev, { senderName: name, text, time, self: true }]);
    setChatInput('');
  };
  const leaveMeeting = () => { navigate('/'); window.location.reload(); };

  /* Name Entry */
  if (!submitted) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: T.surfaceLowest, color: T.onSurface, fontFamily: 'Inter, sans-serif',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(128,131,255,0.07) 0%, rgba(6,14,32,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(192,193,255,0.04) 0%, rgba(6,14,32,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.04em', background: 'linear-gradient(135deg, #c0c1ff, #8083ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Prism</span>
            <p style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.12em', color: T.onSurfaceVariant, textTransform: 'uppercase', marginTop: '4px', marginBottom: '16px' }}>Live Room</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: T.onSurface }}>{roomId}</h2>
          </div>
          <div style={{
            background: 'rgba(49,57,77,0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '12px', border: '1px solid rgba(70,69,84,0.15)',
            boxShadow: '0px 12px 32px rgba(11,19,38,0.4)', padding: '32px',
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', color: T.onSurface, marginBottom: '6px' }}>What's your name?</h3>
            <p style={{ fontSize: '0.8125rem', color: T.onSurfaceVariant, marginBottom: '24px' }}>Others in the room will see this.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: T.surfaceHighest, borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '12px 14px', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: T.outline, fontVariationSettings: "'FILL' 0" }}>person</span>
                <input
                  type="text"
                  placeholder="Your display name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && name.trim() && setSubmitted(true)}
                  autoFocus
                  style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', color: T.onSurface, fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              <button
                onClick={() => name.trim() && setSubmitted(true)}
                disabled={!name.trim()}
                style={{
                  background: 'linear-gradient(135deg, #c0c1ff, #8083ff)', color: '#1000a9',
                  fontWeight: 600, border: 'none', cursor: name.trim() ? 'pointer' : 'not-allowed',
                  width: '100%', padding: '13px 20px', borderRadius: '8px', fontSize: '0.875rem',
                  opacity: name.trim() ? 1 : 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(192,193,255,0.2)', fontFamily: 'Inter, sans-serif',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>video_camera_front</span>
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const peerList = Object.entries(peers);
  const totalParticipants = peerList.length + 1;

  /* Main Room */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: T.surface, color: T.onSurface, fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

      {/* Top bar */}
      <header style={{
        height: '56px', flexShrink: 0, backgroundColor: T.surfaceLowest,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.04em', background: 'linear-gradient(135deg, #c0c1ff, #8083ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Prism</span>
          <div style={{ width: '1px', height: '16px', background: T.outlineVariant, opacity: 0.4 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#23a559', display: 'inline-block' }} />
            <span style={{ fontSize: '0.8125rem', color: T.onSurface, fontWeight: 500 }}>{roomId}</span>
          </div>
        </div>
        <div style={{ background: T.surfaceHighest, borderRadius: '100px', padding: '5px 12px', fontSize: '0.75rem', color: T.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>group</span>
          {totalParticipants} {totalParticipants === 1 ? 'participant' : 'participants'}
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Video grid */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: T.surface }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: totalParticipants === 1 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '12px',
          }}>
            <VideoTile label={`${name} (You)`} isCamOff={isCamOff} videoRef={localVideoRef} initial={name.charAt(0).toUpperCase()} />
            {peerList.map(([id, peer]) => (
              <RemoteTile key={id} peerName={peer.name} stream={peer.stream} />
            ))}
          </div>
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <aside style={{
            width: '300px', flexShrink: 0, backgroundColor: T.surfaceLow,
            display: 'flex', flexDirection: 'column',
            borderLeft: '1px solid rgba(70,69,84,0.12)',
          }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(70,69,84,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: T.primary, fontVariationSettings: "'FILL' 1" }}>chat</span>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: T.onSurface }}>In-call Messages</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: T.outlineVariant, display: 'block', marginBottom: '8px', fontVariationSettings: "'FILL' 0" }}>chat_bubble</span>
                  <p style={{ fontSize: '0.75rem', color: T.onSurfaceVariant }}>No messages yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.self ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '0.6875rem', color: T.onSurfaceVariant, marginBottom: '3px' }}>{msg.senderName} · {msg.time}</span>
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: msg.self ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        maxWidth: '85%', fontSize: '0.8125rem', lineHeight: 1.5,
                        background: msg.self ? 'linear-gradient(135deg, #c0c1ff, #8083ff)' : T.surfaceHighest,
                        color: msg.self ? '#1000a9' : T.onSurface,
                        wordBreak: 'break-word',
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid rgba(70,69,84,0.15)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ flex: 1, background: T.surfaceHighest, borderRadius: '100px', display: 'flex', alignItems: 'center', padding: '8px 14px' }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Message…"
                  style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', color: T.onSurface, fontSize: '0.8125rem', fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim()}
                style={{
                  background: chatInput.trim() ? 'linear-gradient(135deg, #c0c1ff, #8083ff)' : T.surfaceHighest,
                  color: chatInput.trim() ? '#1000a9' : T.onSurfaceVariant,
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: chatInput.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>send</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Controls */}
      <footer style={{
        height: '72px', flexShrink: 0, backgroundColor: T.surfaceLowest,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        borderTop: '1px solid rgba(70,69,84,0.12)',
      }}>
        <CtrlBtn icon={isMuted ? 'mic_off' : 'mic'} active={!isMuted} label={isMuted ? 'Unmute' : 'Mute'} onClick={toggleMic} />
        <CtrlBtn icon={isCamOff ? 'videocam_off' : 'videocam'} active={!isCamOff} label={isCamOff ? 'Start Cam' : 'Stop Cam'} onClick={toggleCam} />
        <CtrlBtn icon="chat" active={showChat} label="Chat" onClick={() => setShowChat(v => !v)} />
        <button
          onClick={leaveMeeting}
          style={{
            height: '44px', padding: '0 20px', borderRadius: '8px',
            background: '#93000a', color: '#ffdad6', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.875rem', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 0" }}>call_end</span>
          Leave
        </button>
      </footer>
    </div>
  );
}

function VideoTile({ label, isCamOff, videoRef, initial }) {
  return (
    <div style={{ position: 'relative', backgroundColor: '#131b2e', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', border: '1px solid rgba(70,69,84,0.15)' }}>
      {isCamOff ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222a3d' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #c0c1ff, #8083ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 700, color: '#1000a9' }}>{initial}</div>
        </div>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
      )}
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(6,14,32,0.75)', backdropFilter: 'blur(8px)', borderRadius: '100px', padding: '3px 10px', fontSize: '0.6875rem', fontWeight: 500, color: '#dae2fd', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#23a559', display: 'inline-block' }} />
        {label}
      </div>
    </div>
  );
}

function RemoteTile({ peerName, stream }) {
  const videoRef = useRef(null);
  useEffect(() => { if (videoRef.current && stream) videoRef.current.srcObject = stream; }, [stream]);
  const initial = peerName?.charAt(0).toUpperCase() || '?';
  return (
    <div style={{ position: 'relative', backgroundColor: '#131b2e', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', border: '1px solid rgba(70,69,84,0.15)' }}>
      {stream
        ? <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222a3d' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#2d3449', border: '1px solid rgba(70,69,84,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 700, color: '#c0c1ff' }}>{initial}</div>
          </div>
        )}
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(6,14,32,0.75)', backdropFilter: 'blur(8px)', borderRadius: '100px', padding: '3px 10px', fontSize: '0.6875rem', fontWeight: 500, color: '#dae2fd' }}>{peerName}</div>
    </div>
  );
}

function CtrlBtn({ icon, active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: '44px', height: '44px', borderRadius: '10px',
        background: active ? '#222a3d' : '#93000a',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? '#dae2fd' : '#ffdad6',
        transition: 'background 0.15s, transform 0.1s',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: `'FILL' ${active ? 0 : 1}` }}>{icon}</span>
    </button>
  );
}