import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import db from "./db.js";
import env from "dotenv";

env.config();

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/home",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);

        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password, is_revoked) VALUES ($1, $2, FALSE) RETURNING *",
            [profile.email, "google"],
          );
          return cb(null, newUser.rows[0]);
        } else if (result.rows[0].is_revoked) {
          return cb(new Error("Your account has been revoked."));
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        console.error("Google Auth Error:", err);
        return cb(err);
      }
    },
  ),
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

export default passport;
