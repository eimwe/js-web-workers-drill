const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 3000;

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:3001", // Frontend URL
    credentials: true,
  })
);

app.use(cookieParser());

// Endpoint to set a cookie
app.get("/api/set-cookie", (req, res) => {
  res.cookie("testCookie", "hello-worker", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Cookie set!" });
});

// Endpoint to check cookies
app.get("/api/check-cookie", (req, res) => {
  const cookie = req.cookies.testCookie;
  res.json({
    hasCookie: !!cookie,
    cookieValue: cookie,
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
