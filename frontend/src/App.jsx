// import { useState } from "react";
// import classes from "./App.module.css"; 
// import {} from "react-router";
// import axios from "axios";

// function App(props) {
//     const [result, setResult] = useState(null);
//     const [id, setId] = useState("");

//     function handleChange(event) {
//         setId(event.target.value);
//     }

//     async function createNutrition() {
//         try {
//             const result = await axios.post("http://localhost:3000/nutrition", {id});
//             setResult(result)
//         } catch (error) {
//             setResult(error);
//         }
//         // Implementation for creating nutrition
//     }

//     async function updateNutrition() {
//         const time_in_millis = Date.now(); // Corrected this line
    
//         try {
//             const response = await axios.post("http://localhost:3000/update_nutrition", {
//                 time_in_millis: time_in_millis,
//                 userId: id
//             });
//             setResult(response.data); // Set the result to the response data
//         } catch (error) {
//             setResult(error.message); // Set the result to the error message
//         }
//     }
    

//     return (
//         <div className={classes.App}>
//             <div>
//                 <button onClick={createNutrition}>Create nutrition</button>
//                 <button onClick={updateNutrition}>Update nutrition</button>
//             </div>
//             <input type="number" value={id} onChange={handleChange} />
//             <p>{result === null ? "no result to display" : JSON.stringify(result)}</p>
//         </div>
//     );
// }

// export default App;

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from "./error/ErrorPage";
import Search from "./routes/navigation/Search";
import { createContext, useEffect, useState } from "react";
import axios from "axios";
import Home from "./routes/navigation/Home";
import Add from "./routes/navigation/Add";
import User from "./routes/navigation/User";
import RootLayout from "./routes/RootLayout";

function App() {
    const [userData, setUserData] = useState(null);
    const userContext = createContext(null);

    useEffect(() => {
        async function getUserInfo() {
            try {
                const response = await axios.get("http://localhost:3000/userdata");
                if (response.data && response.data.length > 0) {
                    setUserData(response.data[0]);
                } else {
                    console.log("User is not authorized", response);
                }
            } catch (error) {
                console.log(error);
            }
        }
        getUserInfo();
    }, []); // Empty dependency array to run only on mount

    const router = createBrowserRouter([
        {
            path: "/",
            element: <RootLayout/>, // Conditional root element based on userData
            errorElement: <ErrorPage />,
            children: [
                { path:'home', element: <Home /> },
                { path: "search", element: <Search /> },
                { path: "user", element: <User /> },
                { path: "add", element: <Add /> },
            ],
        },
    ]);

    return( 
    <userContext.Provider value={userData}>
        <RouterProvider router={router} />
    </userContext.Provider>
    );
}

export default App;
