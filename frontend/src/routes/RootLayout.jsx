import {Outlet} from "react-router";
import Navigation from "../components/Navigation";
function RootLayout(props) {
    
    return(
        <div>
            <Outlet />
            <Navigation />
        </div>
    )
}

export default RootLayout;