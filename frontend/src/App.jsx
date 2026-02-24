import React, { Activity, useState } from 'react'

import {NavLink, useNavigate} from 'react-router-dom'

export default function App() {
  const navigate = useNavigate();
  const [enteredMeetId, setEnteredMeetId] = useState(false);
  const [meetId, setMeetId] = useState("");

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

  const joinMeeting=()=>{
    setEnteredMeetId(true);
  }

  return (
    <div className={`h-screen flex justify-center items-center flex-col gap-10 bg-gray-100`}>
      <h1 className="text-5xl font-bold">Welcome to MeetingZone</h1>
      <div className='flex gap-5'>
        <button className='text-white bg-blue-400  px-7 py-5 text-2xl rounded-2xl cursor-pointer' onClick={generateToken}>Create Meeting</button>
        <button className='text-white bg-green-400  px-7 py-5 text-2xl rounded-2xl cursor-pointer' onClick={joinMeeting}>Join Meeting</button>
      </div>

      <Activity className='flex gap-5' mode={enteredMeetId ? 'visible' : 'hidden'}>
        <input type="text" placeholder='Enter Meeting ID' className='px-5 py-3 text-2xl rounded-2xl border-2 border-gray-300 focus:outline-none focus:border-blue-400' onChange={(e)=>setMeetId(e.target.value)} />
        <button className='text-white bg-green-400  px-7 py-5 text-2xl rounded-2xl cursor-pointer' onClick={()=>navigate(`/${meetId}`)}>Join</button>
      </Activity>
      

    </div>
  )
}

// export default App
