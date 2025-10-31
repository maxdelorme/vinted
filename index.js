const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/vinted");

const express = require("express");
const app = express();
app.use(express.json());

const cloudinary = require("cloudinary").v2; // On n'oublie pas le `.v2` à la fin
cloudinary.config({
  cloud_name: "daa7zsq35",
  api_key: "811433985549384",
  api_secret: "yqQIyPOYKRmIpX7wS93092n1yjE",
});

app.use(require("./routes/User"));
app.use(require("./routes/Offer"));

app.all(/.*/, (req, res) => {
  res.status(404).json({ message: "Page not found on Vinted Server" });
});

app.listen(3000, () => {
  console.log("Server Vinted Started");
});
