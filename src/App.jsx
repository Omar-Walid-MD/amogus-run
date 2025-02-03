import { useState } from 'react'
import './App.css'
import GameWindow from './GameWindow'

function App() {
  const [count, setCount] = useState(0)

  return (
    <GameWindow />
  )
}

export default App
