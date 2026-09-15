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
          const defaultUsername =
            profile.displayName || profile.email.split("@")[0];
          const newUser = await db.query(
            "INSERT INTO users (username, email, password, is_revoked, is_google_user, google_access_token, google_refresh_token) VALUES ($1, $2, $3, FALSE, TRUE, $4, $5) RETURNING *",
            [
              defaultUsername,
              profile.email,
              "google",
              accessToken,
              refreshToken || null,
            ],
          );
          return cb(null, newUser.rows[0]);
        } else if (result.rows[0].is_revoked) {
          return cb(new Error("Your account has been revoked."));
        } else {
          // If existing user logs in/connects with Google, update tokens & ensure is_google_user is TRUE
          const updatedUser = await db.query(
            `UPDATE users 
             SET is_google_user = TRUE, 
                 google_access_token = $1, 
                 google_refresh_token = COALESCE($2, google_refresh_token)
             WHERE id = $3 RETURNING *`,
            [accessToken, refreshToken || null, result.rows[0].id],
          );
          return cb(null, updatedUser.rows[0]);
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
