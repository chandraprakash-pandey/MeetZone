import React from 'react'

import {NavLink, useNavigate} from 'react-router-dom'

export default function App() {
  const navigate = useNavigate();

  const generateToken=()=>{
    // alert("Create Meeting Clicked")
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const byte = new Uint8Array(9);
    window.crypto.getRandomValues(byte);

    const rawToken = Array.from(byte).map((b) => chars[b % chars.length]).join('');

    const token = `${rawToken.slice(0,3)}-${rawToken.slice(3,6)}-${rawToken.slice(6,9)}`;

    alert(`Meeting Created! Share this code to invite people: ${token}`);

    navigate(`/${token}`);
  }

  return (
    <div className="h-screen flex justify-center items-center flex-col gap-10 bg-gray-100">
      <h1 className="text-5xl font-bold">Welcome to MeetingZone</h1>
      <div className='flex gap-5'>
        <button className='text-white bg-blue-400  px-7 py-5 text-2xl rounded-2xl cursor-pointer' onClick={generateToken}>Create Meeting</button>
        <button className='text-white bg-green-400  px-7 py-5 text-2xl rounded-2xl cursor-pointer'>Join Meeting</button>
      </div>

    </div>
  )
}

// export default App
