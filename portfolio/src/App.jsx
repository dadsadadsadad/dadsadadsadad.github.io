import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import FirstPage from "./components/FirstPage.jsx";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
        <Routes>
            <Route path='/' element={<FirstPage />} />
        </Routes>
    </>
  )
}

export default App
