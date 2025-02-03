import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import FirstPage from "./components/FirstPage.jsx";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './components/Main.css'
import Main from "./components/Main.jsx";

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<FirstPage />} />
            <Route path="/main" element={<Main />} />
        </Routes>
    );
};


export default App
