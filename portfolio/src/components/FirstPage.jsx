import { useNavigate } from "react-router-dom";
import './FirstPage.css'


const FirstPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <h1 className='name'>RAFAELLE FRANCISCO</h1>
            <button className='linkbutton' onClick={() => navigate("/main")}>Go to Main Page</button>
        </>
    );
};

export default FirstPage;