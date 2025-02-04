import viteLogo from "../assets/react.svg";
import reactLogo from "../assets/react.svg";
import React from "react";
import './Main.css'
import WhoAmI from "./main_page_components/WhoAmI.jsx";
import Hobbies from "./main_page_components/Hobbies.jsx";

const MainPage = () => {
    const [count, setCount] = React.useState(0);

    return (
    <>
        <div>
            <WhoAmI/>
            <Hobbies/>
        </div>
    </>
    )
}


export default MainPage;