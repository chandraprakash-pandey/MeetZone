import React from 'react'

export default function meetRoom() {
  return (

    <div>
      <div className='flex flex-col items-center justify-center h-screen'>
        <form>
        <div className='flex flex-col'>
          <input type="text" placeholder="Enter room ID" />
        <input type="text" placeholder="Enter your name" />

        <button type="submit" className='cursor-pointer'>Join Meeting</button>
        </div>
      </form>
      </div>
    </div>
  )
}
