import LocalStrategy from "passport-local";
import GoogleStrategy from "passport-google-oauth20";
import passport from "passport";
import {db} from "./../index";
import bcrypt from "bcrypt";


passport.serializeUser((user, done)=>{
    done(null, user.id)
});

passport.deserializeUser(async (id, done)=>{
    try {
        const result = await db.query("SELECT username FROM user_info WHERE id = $1", [id]);
        if (result.rowCount === 0) throw Error("user not found");
        const userObj = {
            id: id, 
            username: result.rows[0].username
        }
        done(null, userObj);
    } catch (error) {
        done(error, null);
    }
})

passport.use(new LocalStrategy({}, async (username, password, done)=>{
        try {
            const userExist = await db.query("SELECT (username, password) FROM user_info WHERE username = $1", [username]);
            if (userExist.rowCount === 0) {// user doesnt exist 
                const hashedPassword = await bcrypt.hash(password, 10);

                const addUser = await db.query(
                "INSERT INTO user_info (username, password) VALUES ($1, $2) RETURNING *", 
                [username, hashedPassword]
                );
                if (addUser.rowCount === 0) throw new Error("failed to create user");
                const userData = {
                    id: addUser.rows[0].id,
                    username: username
                }
                done(null, userData);
            } else { // user exists
                const isCorrectPassword = bcrypt.compare(password, userExist.rows[0].password);
                if (!isCorrectPassword) throw new Error("incorect password");
                const userData = {
                    id: userExist.rows[0].id,
                    username: username
                }
                done(null, userData)
            }
        } catch (err) {
            done(err, null);
        }
    }
))