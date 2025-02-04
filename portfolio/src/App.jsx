import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import FirstPage from "./components/FirstPage.jsx";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './components/Main.css'
import MainPage from "./components/MainPage.jsx";

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<FirstPage />} />
            <Route path="/main" element={<MainPage />} />
        </Routes>
    );
};


export default App
