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
    </>
  )
}
