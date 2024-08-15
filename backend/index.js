import bodyParser from 'body-parser';
import Express from 'express';
import cors from "cors";
import pg from "pg";
import {getUserNutrition, updateNutrition, getUserInfo, createNutrition, storeNutritionInDatabase, calcDailyCalorieIntake} from "./routes/nutrition.js";

const App = Express();
const Port = 3000;
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Nutrify_v1.3.1",
    password: "Wannepain2008",
    port: 5432
});

db.connect((err)=>{
    if (!err) {
        console.log('SUCCESFULLY conected to db');
    }
});

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
        res.status(201).send({ message: 'User created successfully' });
    } catch (error) {
        console.log(error, 'error in /signup');
        res.status(500).send({ message: "Error occurred when adding user to DB" });
    }
});
App.get("/getUserData", (req,res)=>{//check if user is authorizes

}); 

App.post("/add/recipe", async (req, res) => {
    const { allergens, diet, ingredients, procedure, img, user_id, title, calories } = req.body; // Later retrieve user id from header

    try {
        const result = await db.query(
            "INSERT INTO recipes (allergens, diet, ingredients, procedure, img, user_id, title, calories) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [allergens, diet, ingredients, procedure, img, user_id, title, calories]
        );
        console.log(result);
        res.status(201).send({ message: 'Recipe added successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Error occurred while adding recipe' });
    }
});
App.post("/nutrition", async (req, res) => {
    const { id, time_in_millis } = req.body;
    const dayOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    
    try {
        const userInfo = await getUserInfo(id); 

        if (!userInfo) {
            return res.status(404).send({ message: 'User not found' });
        }

        for (let i = 0; i < dayOfWeek.length; i++) {
            const nutrition = await createNutrition(userInfo.daily_calorie_intake, userInfo.allergens, userInfo.diet);
            
            if (nutrition.length === 3) {
                await storeNutritionInDatabase(nutrition, dayOfWeek[i], id, time_in_millis);
            } else {
                console.log(`Not enough nutrition data for ${dayOfWeek[i]}`);
            }
        }

        res.status(201).send({ message: 'Nutrition data created successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'An error occurred while creating nutrition data' });
    }
});
App.post('/update_nutrition', async (req, res) => {
    const { userId, time_in_millis } = req.body;
    
    try {
        const nutritionDataArray = await getUserNutrition(userId);
        
        if (nutritionDataArray.length === 0) {
            return res.status(404).json({ message: 'No nutrition data found for user' });
        }
        
        // Assuming the last entry in the nutrition data array has the latest timestamp
        const latestTimestamp = nutritionDataArray[nutritionDataArray.length - 1].time_stamp;
        const storedDate = new Date(latestTimestamp);
        const currentDate = new Date(time_in_millis);
        
        // Initialize currentDay to the day after the storedDate
        let currentDay = new Date(storedDate);
        currentDay.setDate(currentDay.getDate() + 1);
        currentDay.setHours(0, 0, 0, 0); // Set to the start of the next day after storedDate
        
        while (currentDay <= currentDate) {
            // Get the day of the week before midnight
            const dayBeforeMidnight = currentDay.toLocaleString('en-US', { weekday: 'short' }).toLocaleLowerCase();
            
            console.log(`Updating nutrition for ${dayBeforeMidnight}`);

            // Proceed with the update
            await updateNutrition(userId, dayBeforeMidnight, time_in_millis);
            
            // Move to the next day
            currentDay.setDate(currentDay.getDate() + 1);
        }

        res.status(200).json({ message: 'Nutrition updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
App.get("/search", async (req, res) => { // return 20 recipes 
    const searchQuery = req.query.query;

    if (!searchQuery) {
        return res.status(400).send({ message: 'Query parameter is required' });
    }

    try {
        // Using the LIKE operator for partial matches
        // SQL query to search for titles that match the query, ordered by rating and rating_count, limited to 20 results
        const result = await db.query(
            `SELECT id, title, rating, rating_count 
             FROM recipes 
             WHERE title ILIKE $1 
             ORDER BY rating DESC, rating_count DESC 
             LIMIT 20`, 
            [`%${searchQuery}%`]
        );

        // If you want to return the matched results
        res.status(200).send({ message: `You searched for: ${searchQuery}`, results: result.rows });
    } catch (error) {
        console.error('Error occurred during search:', error.message);
        res.status(500).send({ message: 'Error occurred during search' });
    }
});

//nutrition system creatio
export {db};

App.listen(Port, () => {
    console.log(`Server is running on port ${Port}`);
});
