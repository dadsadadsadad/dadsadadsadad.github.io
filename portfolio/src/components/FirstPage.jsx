import { useNavigate } from "react-router-dom";


const FirstPage = () => {
    const navigate = useNavigate();

    return (
        <div>
            <h1>Welcome</h1>
            <button onClick={() => navigate("/main")}>Go to Main Page</button>
        </div>
    );
};

export default FirstPage;