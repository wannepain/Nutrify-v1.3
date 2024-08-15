import userImg from "/user.svg";
import searchImg from "/search.svg";
import homeImg from "/home.svg";
import addImg from "/add.svg";
import { useState } from "react";

function Navigation(props) {
    const [currentBtn, setCurrentBtn] = useState("home");

    function handleClick(event) {
        const clicked = event.currentTarget.data.value;
        setCurrentBtn(clicked);
    }


    return(
        <div>
            <button onClick={handleClick} data-value="add"><img src={addImg} alt="" /></button>
            <button onClick={handleClick} data-value="search"><img src={searchImg} alt="" /></button>
            <button onClick={handleClick} data-value="home"><img src={homeImg} alt="" /></button>
            <button onClick={handleClick} data-value="user"><img src={userImg} alt="" /></button>
        </div>
    )
}

export default Navigation;