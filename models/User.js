const mongoose = require("mongoose");
const User = mongoose.model("User", {
  email: String,
  account: {
    username: String,
    avatar: Object, // nous verrons plus tard comment uploader une image
  },
  newsletter: Boolean,
  token: {
    type: String,
    select: false,
  },
  tokenUpdateDate: {
    type: Date,
    default: Date.now,
  },
  hash: {
    type: String,
    select: false,
  },
  salt: String,
  cryptoMethod: {
    type: String,
    enum: ["sha256", "argon2"],
    default: "sha256",
  },
});

isValidToken = () => {};
module.exports = User;
