import { useNavigate } from "react-router-dom";
import './FirstPage.css'


const FirstPage = () => {
    const navigate = useNavigate();

    return (
        <div className='firstpage'>
            <button className='linkbutton' onClick={() => navigate("/main")}>Get to know me.</button>
        </div>
    );
};

export default FirstPage;