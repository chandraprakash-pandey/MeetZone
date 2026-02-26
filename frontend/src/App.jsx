import React, { Activity, useState } from 'react'
import axios  from "axios"
import {NavLink, useNavigate} from 'react-router-dom'

export default function App() {
  const navigate = useNavigate();
  const [enteredMeetId, setEnteredMeetId] = useState(false);
  const [meetId, setMeetId] = useState("");


  const insertRoomID=async(meetID)=>{
    try {
      const response = await axios.post('http://localhost:3000/api/createRoomID', { roomID: meetID });
      console.log(response.data);
    } catch (error) {
      console.error('Error sending roomID:', error);
    }
  }

  const generateToken=()=>{
    // alert("Create Meeting Clicked")
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const byte = new Uint8Array(9);
    window.crypto.getRandomValues(byte);

    const rawToken = Array.from(byte).map((b) => chars[b % chars.length]).join('');

    const token = `${rawToken.slice(0,3)}-${rawToken.slice(3,6)}-${rawToken.slice(6,9)}`;

    alert(`Meeting Created! Share this code to invite people: ${token}`);

    insertRoomID(token);

    navigate(`/${token}`);
  }

  const joinMeeting=()=>{
    setEnteredMeetId(true);
  }

  const checkMeetId=async ()=>{

    setMeetId(meetId.trim().toUpperCase());
    
    const response = await axios.post('http://localhost:3000/api/checkRoomID', { roomID: meetId });
    console.log(response.data);
    if(response.data.exists){
      navigate(`/${meetId}`);
    }else{
      alert("Meeting ID does not exist");
    }

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
        <button className='text-white bg-green-400  px-7 py-5 text-2xl rounded-2xl cursor-pointer' onClick={checkMeetId}>Join</button>
      </Activity>
      

    </div>
  )
}

// export default App
