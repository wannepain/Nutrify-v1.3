import bodyParser from 'body-parser';
import Express from 'express';
import cors from "cors";
import pg from "pg";

const App = Express();
const Port = 3000;
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Nutrify v1.3",
    password: "Wannepain2008",
    port: 5432
});

db.connect()



App.use(bodyParser.json());
App.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

App.use(cors({
    origin: "http://localhost:5173", //frontend adress
    credentials: true
}))

App.post("/signup", async (req, res) => { //allergens: allergies, diet, weight, height, goal, gender, age, activity: actiFac
    const { allergens, diet, height, weight, goal, gender, age, activity } = req.body;
    const dailyCalorieIntake = calcDailyCalorieIntake(height, weight, goal, gender, age, activity);
    console.log(dailyCalorieIntake);
    

    try {
        const result = await db.query(
            "INSERT INTO user_info (allergens, diet, daily_calorie_intake) VALUES ($1, $2, $3)",
            [allergens, diet, dailyCalorieIntake]
        );
        console.log(result);
        res.status(201).send({ message: 'User created successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error occurred when adding user to DB" });
    }
});

function calcDailyCalorieIntake(height, weight, goal, gender, age, activity) {
    let BMR;
        let cals;
        let maxCals;
        switch (gender) {
            case "m":
                BMR = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
                break;
            case "f":
                BMR = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
                break;
            default:
                BMR = 404;
                break;
        }

        switch (activity) {
            case "sedentary":
                cals = BMR * 1.2;
                break;
            case "light":
                cals = BMR * 1.375;
                break;
            case "moderate":
                cals = BMR * 1.55;
                break;
            case "active":
                cals = BMR * 1.725;
                break;
            case "very_active":
                cals = BMR * 1.9;
                break;
            default:
                cals = "sedentary, light, moderate, active, very_active";
                break;
        }
        if (goal === "lose") {
            maxCals = Math.round(cals - 550);
        } else if (goal === "gain") {
            maxCals = Math.round(cals + 350);
        } else {
            maxCals = Math.round(cals);
        }
        return maxCals;
}
//nutrition system creatio

App.listen(Port, () => {
    console.log(`Server is running on port ${Port}`);
});
