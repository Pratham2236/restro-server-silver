const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const nodemailer = require("nodemailer");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();

const allowedOrigins = ["https://pratham2236.github.io", "http://localhost:3000", "http://localhost:5001"];

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

app.use(bodyParser.json());

const port = 5002;

mongoose.connect('mongodb://localhost:27017/restaurant', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once('open', () => {
  console.log('Connected to MongoDB');
});

const reservationSchema = new mongoose.Schema({
  name: String,
  email: String,
  date: String,
  time: String,
  members: Number,
  number: Number,
});

const Reservation = mongoose.model('Reservation', reservationSchema);

const feedbackSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

app.post("/send-email", async (req, res) => {
  const { name, email, date, time, members, number } = req.body;

  const newReservation = new Reservation({ name, email, date, time, members, number });

  try {
    await newReservation.save();
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "silverspoonteams@gmail.com", 
        pass: "rpxiphexxdeimiba", 
      },
    });

    const mailOptions = {
      from: "silverspoonteams@gmail.com",
      to: email,
      subject: "Your Table Reservation Confirmation",
      html: `
        <p>Dear <strong>${name}</strong>,</p>
        <p>Thank you for choosing our restaurant. We are pleased to confirm your table reservation for <span style="color:#ff4d00">${members}</span> members as follows:</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p>We look forward to serving you and hope you have a wonderful dining experience with us.</p>
        <p>Best regards,</p>
        <p>SilverSpoon Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    res.status(200).send("Reservation saved and email sent successfully");
  } catch (error) {
    console.error("Error saving reservation:", error);
    res.status(500).send("Error saving reservation: " + error.message);
  }
});

app.post("/submit-feedback", (req, res) => {
  const { feedname, feedemail, feedmessage } = req.body;

  const newFeedback = new Feedback({ name: feedname, email: feedemail, message: feedmessage });

  newFeedback.save()
    .then(() => {
      res.status(200).send("Feedback stored successfully");
    })
    .catch((err) => {
      console.error("Error storing feedback:", err);
      res.status(500).send("Error storing feedback: " + err.message);
    });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
