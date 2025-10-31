const User = require("../models/User");
const { subHours, compareAsc } = require("date-fns");

isAuthenticated = async (req, res, next) => {
  const timeOutInHours = 2;
  try {
    if (!req.headers.authorization)
      return res.status(401).json("no authorization header");

    const token = req.headers.authorization.replace("Bearer ", "");
    const user = await User.findOne({ token: token });

    if (!user)
      return res.status(401).json({ message: "Authentication required" });

    if (
      compareAsc(user.tokenUpdateDate, subHours(new Date(), timeOutInHours)) ===
      -1
    )
      return res.status(401).json({ message: "Session Expired" });

    if (req.user)
      return res
        .status(500)
        .json({ message: "req.user already defined", user: req.user });

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
module.exports = isAuthenticated;
