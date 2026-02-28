import React, { useState } from 'react'

export default function MeetRoom() {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    setSubmitted(true);
  }
  
  return (
<>
    {!submitted && (<div>
      <div className='flex flex-col items-center justify-center h-screen'>
        <form onSubmit={handleSubmit}>
          <div className='flex flex-col'>
            <input type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
            <button type="submit" className='cursor-pointer'>Join Meeting</button>
          </div>
        </form>
      </div>
    </div>)}
    {submitted && (<div className='h-screen flex justify-center items-center flex-col gap-10 bg-gray-100'>
      <div>
        <h1 className='text-5xl font-bold'>Welcome, {name}!</h1>
        <p className='text-2xl mt-5'>You have successfully joined the meeting.</p>
      </div>
      <div>
        <button className='bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer'>toggle Video</button> 
      <button className='bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer'>toggle Audio</button>
      <button className='bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer'>Chatting</button>
      <button className='bg-red-500 text-white px-4 py-2 rounded-lg cursor-pointer'>Leave Meeting</button>
      </div>
    </div>)}
    </>
  )
}
