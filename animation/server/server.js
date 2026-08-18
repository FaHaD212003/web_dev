import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import crypto from "crypto";
import nodemailer from "nodemailer";
import cors from "cors";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();

app.get("/home", (req, res) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({
      authenticated: true,
      user: { id: req.user.id, email: req.user.email },
    });
  } else {
    return res.status(401).json({
      authenticated: false,
      message: "Not authenticated",
    });
  }
});

app.post("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Error during logout" });
    }

    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

app.get(
  "/auth/google/home",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login",
  }),
  (req, res) => {
    res.redirect("http://localhost:5173/home");
  },
);
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (!user) {
      return res
        .status(401)
        .json({ message: info?.message || "Invalid email or password." });
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("Session creation error:", err);
        return res
          .status(500)
          .json({ message: "Login successful, but session creation failed." });
      }

      return res.status(200).json({
        message: "Login successful",
        user: { id: user.id, email: user.email },
      });
    });
  })(req, res, next);
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    // 1. If user exists, send a 409 Conflict status instead of redirecting
    if (checkResult.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "User already exists. Please log in." });
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
          // 2. Handle hash errors gracefully
          return res.status(500).json({ message: "Error securing password." });
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash],
          );
          const user = result.rows[0];

          req.login(user, (err) => {
            if (err) {
              console.error("Error creating session:", err);
              // 3. Handle session failures
              return res.status(500).json({
                message:
                  "Registration successful, but session creation failed.",
              });
            }

            // 4. Send a 201 Created status with the user data back to React
            return res.status(201).json({
              message: "Registration successful",
              user: { id: user.id, email: user.email },
            });
          });
        }
      });
    }
  } catch (err) {
    console.error(err);
    // 5. Catch database or general server errors
    return res.status(500).json({ message: "Internal server error." });
  }
});

passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        username,
      ]);

      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;

        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              // UPDATED: Return false instead of an error for a bad password
              return cb(null, false, { message: "Incorrect password" });
            }
          }
        });
      } else {
        // UPDATED: Return false instead of an error for an unknown email
        return cb(null, false, { message: "User not found" });
      }
    } catch (err) {
      console.log(err);
      return cb(err);
    }
  }),
);
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // This stays as port 3000! Google still needs to talk directly to your Express backend first.
      callbackURL: "http://localhost:3000/auth/google/home",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);

        if (result.rows.length === 0) {
          // UPDATED: Added "RETURNING *" to ensure the user object is passed back to Passport
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [profile.email, "google"],
          );
          return cb(null, newUser.rows[0]);
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
app.post("/forgot-password", async (req, res) => {
  const email = req.body.username; // Matches the React frontend input name

  try {
    // Check if user exists
    const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    
    // Security best practice: Even if the email isn't in the DB, return a success 
    // message so malicious actors can't use this form to guess registered emails.
    if (userResult.rows.length === 0) {
      return res.status(200).json({ message: "If that email exists, a reset link was sent." });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(20).toString("hex");
    const expireTime = Date.now() + 3600000; // 1 hour from now in milliseconds

    // Save token and expiry to the PostgreSQL database
    await db.query(
      "UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3",
      [token, expireTime, email]
    );

    // Configure NodeMailer (Store EMAIL_USER and EMAIL_PASS in your .env file)
    const transporter = nodemailer.createTransport({
      service: "Gmail", // Or your preferred email provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
      },
    });

    
    const resetURL = `http://localhost:5173/reset-password/${token}`;
    
    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset Request - Regulate",
      text: `You are receiving this because you requested a password reset.\n\n
             Please click on the following link, or paste it into your browser to complete the process:\n\n
             ${resetURL}\n\n
             If you did not request this, please ignore this email and your password will remain unchanged.`,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Password reset email sent successfully." });

  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});


app.post("/reset-password/:token", async (req, res) => {
  const token = req.params.token;
  const newPassword = req.body.password;
  const currentTime = Date.now();

  try {
    
    const result = await db.query(
      "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > $2",
      [token, currentTime]
    );

   
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    const user = result.rows[0];
    bcrypt.hash(newPassword, saltRounds, async (err, hash) => {
      if (err) {
        console.error("Error hashing new password:", err);
        return res.status(500).json({ message: "Error securing new password." });
      }

   
      await db.query(
        "UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE email = $2",
        [hash, user.email]
      );

      return res.status(200).json({ message: "Password updated successfully." });
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
