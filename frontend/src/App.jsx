import { useState } from "react";
import classes from "./App.module.css"; // This import is fine if you're using CSS modules
import axios from "axios";

function App(props) {
    const [result, setResult] = useState(null);
    const [id, setId] = useState("");

    function handleChange(event) {
        setId(event.target.value);
    }

    async function createNutrition() {
        try {
            const result = await axios.post("http://localhost:3000/nutrition", {id});
            setResult(result)
        } catch (error) {
            setResult(error);
        }
        // Implementation for creating nutrition
    }

    async function updateNutrition() {
        const time_in_millis = Date.now(); // Corrected this line
    
        try {
            const response = await axios.post("http://localhost:3000/update_nutrition", {
                time_in_millis: time_in_millis,
                userId: id
            });
            setResult(response.data); // Set the result to the response data
        } catch (error) {
            setResult(error.message); // Set the result to the error message
        }
    }
    

    return (
        <div className={classes.App}>
            <div>
                <button onClick={createNutrition}>Create nutrition</button>
                <button onClick={updateNutrition}>Update nutrition</button>
            </div>
            <input type="number" value={id} onChange={handleChange} />
            <p>{result === null ? "no result to display" : JSON.stringify(result)}</p>
        </div>
    );
}

export default App;
