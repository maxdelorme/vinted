const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const argon2 = require("argon2");
const isAuthenticated = require("../middleware/isAuthenticated");
const fileUpload = require("express-fileupload");
const binaryToCloudinaryImage = require("../utils/binaryToCloudinaryImage");
const deleteCloudinaryImage = require("../utils/deleteCloudinaryImage");

getHash = (password, salt) => SHA256(password + salt).toString(encBase64);

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(400)
        .json({ success: false, message: "Please provide a body" });
    if (!req.body.email)
      return res
        .status(400)
        .json({ success: false, message: "Please provide an email" });
    if (!req.body.username)
      return res.status(400).json({
        success: false,
        message: "Please provide a username",
      });
    if (!req.body.password)
      return res.status(400).json({
        success: false,
        message: "Please provide a password",
      });

    if (await User.findOne({ email: req.body.email }))
      return res.status(409).json({ success: false, message: "Invalid Email" });
    var newUserId = new mongoose.Types.ObjectId();

    const newUSER = new User(req.body);
    let user = {
      _id: newUserId,
      email: req.body.email,
      account: {
        username: req.body.username,
      },
      newsletter: req.body.newsletter,
      token: uid2(64),
    };

    if (req.body.cryptoMethod !== "argon2") {
      user.salt = uid2(16);
      user.hash = getHash(req.body.password, user.salt);
    } else {
      user.hash = await argon2.hash(req.body.password);
      user.cryptoMethod = "argon2";
    }
    const cloudinaryImage = await binaryToCloudinaryImage(
      req?.files?.avatar,
      `/vinted/avatars/${newUserId}/`
    );
    user.account.avatar = cloudinaryImage;

    const newUser = new User(user);
    await newUser.save();
    return res.status(201).json({
      success: true,
      message: `user ${newUSER.email} created`,
      user: newUSER,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(400)
        .json({ success: false, message: "Please provide a body" });
    if (!req.body.email)
      return res
        .status(400)
        .json({ success: false, message: "Please provide an email" });
    if (!req.body.password)
      return res.status(400).json({
        success: false,
        message: "Please provide a password",
      });

    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(400).json({ success: false, message: "Unauthorized" });

    let isAuthenticated = false;
    if (user.cryptoMethod !== "argon2") {
      const hasComputed = getHash(req.body.password, user.salt);
      isAuthenticated = hasComputed === user.hash;
    } else {
      isAuthenticated = await argon2.verify(user.hash, req.body.password);
    }
    if (isAuthenticated)
      return res.status(200).json({
        success: true,
        message: `user ${user.email} is authenticated`,
        user: user,
      });
    return res.status(400).json({
      success: false,
      message: "Unauthorized",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/user/", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(400)
        .json({ success: false, message: "Please provide a body" });
    if (!req.body.email)
      return res
        .status(400)
        .json({ success: false, message: "Please provide an email" });
    if (!req.body.username)
      return res.status(400).json({
        success: false,
        message: "Please provide a username",
      });
    if (!req.body.password)
      return res.status(400).json({
        success: false,
        message: "Please provide a password",
      });

    if (!req.body.keepAvatarImage) {
      await deleteCloudinaryImage(req.user.account.avatar);
      req.user.account.avatar = undefined;
      const cloudinaryImage = await binaryToCloudinaryImage(
        req?.files?.avatar,
        `/vinted/avatars/${req.user._id}/`
      );
      req.user.account.avatar = cloudinaryImage;
    }
    req.user.email = req.body.email;
    req.user.account.username = req.body.username;
    req.user.newsletter = req.body.newsletter;

    if (req.body.cryptoMethod !== "argon2") {
      req.user.salt = uid2(16);
      req.user.hash = getHash(req.body.password, req.user.salt);
      req.user.cryptoMethod = "sha256";
    } else {
      req.user.hash = await argon2.hash(req.body.password);
      req.user.cryptoMethod = "argon2";
      req.user.salt = undefined;
    }
    await req.user.save();
    return res.status(201).json({
      success: true,
      message: `user ${req.user.email} updated`,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/user", async (req, res) => {
  try {
    const events = await User.find();
    res.status(200).json({
      success: true,
      message: events,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/user", async (req, res) => {
  try {
    const events = await User.find();
    res.status(200).json({
      success: true,
      message: events,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
