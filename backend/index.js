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
        res.status(201).send({ message: 'User created successfully' });
    } catch (error) {
        console.log(error, 'error in /signup');
        res.status(500).send({ message: "Error occurred when adding user to DB" });
    }
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
    const { id } = req.body;
    const dayOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    
    try {
        const userInfo = await getUserInfo(id); 

        if (!userInfo) {
            return res.status(404).send({ message: 'User not found' });
        }

        for (let i = 0; i < dayOfWeek.length; i++) {
            const timeStamp = Date.now();
            const nutrition = await createNutrition(userInfo.daily_calorie_intake, userInfo.allergens, userInfo.diet);
            
            if (nutrition.length === 3) {
                await storeNutritionInDatabase(nutrition, dayOfWeek[i], id, timeStamp);
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


async function getUserInfo(id) { //return user information
    try {
        const result = await db.query("SELECT * FROM user_info WHERE id = $1", [id]);
        if (result.rowCount > 0) {
            return result.rows[0];
        } else {
            return null;
        }
    } catch (error) {
        console.log(error);
        throw error; // Optionally rethrow the error to handle it outside
    }
}

async function createNutrition(daily_calorie_intake, allergensArray, dietArray) { // return array of 3 objects with recipe id 
    const calories = [Math.floor((daily_calorie_intake / 100) * 25), Math.floor((daily_calorie_intake / 100) * 40), Math.floor((daily_calorie_intake / 100) * 35)];
    let dailyRecipes = [];

    // Create the dollar array for parameterized queries
    let dollarArray = allergensArray.map((_, index) => `$${index + 1}`);
    let dietDollarArray = dietArray.map((_, index) => `$${allergensArray.length + index + 1}`);

    try {
        while (dailyRecipes.length !== 3) {
            const currentCalories = calories[dailyRecipes.length];
            const lowerCalorieBound = currentCalories - 150;
            const upperCalorieBound = currentCalories + 150;

            // Adjust the query to use parameterized input
            const dbProps = [
                ...allergensArray,
                ...dietArray
            ];

            // Include the recipe ids to exclude
            const excludeRecipeIds = dailyRecipes.map(recipe => recipe.id);
            let excludeRecipePlaceholders = "";
            if (excludeRecipeIds.length > 0) {
                excludeRecipePlaceholders = "AND id != ALL($" + (dbProps.length + 1) + "::int[])";
                dbProps.push(excludeRecipeIds);
            }

            const dbQuery = `
                SELECT id 
                FROM recipes 
                WHERE 
                    NOT (allergens && ARRAY[${dollarArray.join(', ')}]::text[]) 
                    AND diet @> ARRAY[${dietDollarArray.join(', ')}]::text[]
                    ${excludeRecipePlaceholders}
                    AND calories BETWEEN $${dbProps.length + 1} AND $${dbProps.length + 2}
                LIMIT 1;
            `;
            dbProps.push(lowerCalorieBound, upperCalorieBound);

            const result = await db.query(dbQuery, dbProps);

            if (result.rows.length > 0) {
                dailyRecipes.push(result.rows[0]);
            } else {
                console.log('No more recipes found that match the criteria.');
                break;
            }
        }
    } catch (error) {
        console.log(error);
    }

    return dailyRecipes;
}

async function storeNutritionInDatabase(nutritionArray, dayOfWeek, userId, timeStamp) {
    const recipeIdArray = nutritionArray.map(recipe => recipe.id);

    try {
        const result = await db.query(
            "INSERT INTO daily_meals (user_id, day_of_week, breakfast, lunch, dinner, time_stamp) VALUES ($1, $2, $3, $4, $5, $6)", 
            [userId, dayOfWeek, recipeIdArray[0], recipeIdArray[1], recipeIdArray[2], timeStamp]
        );
        console.log(result);
        return { success: true, result: result };
    } catch (error) {
        console.log(error);
        return { success: false, error: error };
    }
}




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
