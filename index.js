require("dotenv").config();

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);

const express = require("express");
const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

const cloudinary = require("cloudinary").v2; // On n'oublie pas le `.v2` à la fin
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(require("./routes/User"));
app.use(require("./routes/Offer"));

app.all(/.*/, (req, res) => {
  res.status(404).json({ message: "Page not found on Vinted Server" });
});

app.listen(process.env.PORT, () => {
  console.log("Server Vinted Started");
});
