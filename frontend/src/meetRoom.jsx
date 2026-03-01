import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from "socket.io-client";

export default function MeetRoom() {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const { roomId } = useParams();

  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  useEffect(() => {
    if (!submitted) return;

    const startCall = async () => {
      try {
        // 1️⃣ Connect to backend signaling server
        socketRef.current = io("http://localhost:3000");

        // 2️⃣ Get microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });

        localStreamRef.current = stream;

        // 3️⃣ Create peer connection
        const peer = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
          ]
        });

        peerRef.current = peer;

        // 4️⃣ Add mic tracks to peer
        stream.getTracks().forEach(track => {
          peer.addTrack(track, stream);
        });

        // 5️⃣ ICE candidate handling
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit("ice-candidate", {
              roomId,
              candidate: event.candidate
            });
          }
        };

        // 6️⃣ Remote audio receive
        peer.ontrack = (event) => {
          remoteAudioRef.current.srcObject = event.streams[0];
        };

        // 7️⃣ Join signaling room
        socketRef.current.emit("join-room", roomId);

        // 8️⃣ If someone joins, create offer
        socketRef.current.on("user-joined", async () => {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);

          socketRef.current.emit("offer", {
            roomId,
            offer
          });
        });

        // 9️⃣ When receiving offer
        socketRef.current.on("offer", async (offer) => {
          await peer.setRemoteDescription(offer);

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          socketRef.current.emit("answer", {
            roomId,
            answer
          });
        });

        // 🔟 When receiving answer
        socketRef.current.on("answer", async (answer) => {
          await peer.setRemoteDescription(answer);
        });

        // 1️⃣1️⃣ When receiving ICE
        socketRef.current.on("ice-candidate", async (candidate) => {
          await peer.addIceCandidate(candidate);
        });

      } catch (error) {
        console.error("Call setup failed:", error);
      }
    };

    startCall();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };

  }, [submitted, roomId]);

  const toggleAudio = () => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  };

  const leaveMeeting = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setSubmitted(false);
  };

  return (
    <>
      {!submitted && (
        <div className='flex flex-col items-center justify-center h-screen'>
          <form onSubmit={handleSubmit}>
            <div className='flex flex-col gap-3'>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='border p-2 rounded'
              />
              <button type="submit" className='bg-blue-500 text-white px-4 py-2 rounded-lg'>
                Join Meeting
              </button>
            </div>
          </form>
        </div>
      )}

      {submitted && (
        <div className='h-screen flex justify-center items-center flex-col gap-10 bg-gray-100'>
          <div>
            <h1 className='text-5xl font-bold'>Welcome, {name}!</h1>
            <p className='text-2xl mt-5'>You have successfully joined the meeting.</p>
          </div>
          <audio ref={remoteAudioRef} autoPlay></audio>
          <div className='flex gap-4'>
            <button className='bg-blue-500 text-white px-4 py-2 rounded-lg'>
              toggle Video
            </button>

            <button
              onClick={toggleAudio}
              className='bg-blue-500 text-white px-4 py-2 rounded-lg'
            >
              {isMuted ? "Unmute Audio" : "Mute Audio"}
            </button>

            <button className='bg-blue-500 text-white px-4 py-2 rounded-lg'>
              Chatting
            </button>

            <button
              onClick={leaveMeeting}
              className='bg-red-500 text-white px-4 py-2 rounded-lg'
            >
              Leave Meeting
            </button>
          </div>
        </div>
      )}
    </>
  );
}