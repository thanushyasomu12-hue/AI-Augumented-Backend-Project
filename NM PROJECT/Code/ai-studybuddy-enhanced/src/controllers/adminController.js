const User = require("../models/User");
const Material = require("../models/Material");

const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password").sort("-createdAt");
  res.json(users);
};

const deleteUser = async (req, res) => {
  if (req.params.id === req.user.userId) return res.status(400).json({ message: "You cannot delete your own admin account here" });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await Material.deleteMany({ user: req.params.id });
  res.json({ message: "User and their materials deleted" });
};

const getStats = async (req, res) => {
  const [totalUsers, totalStudents, totalAdmins, totalMaterials] = await Promise.all([
    User.countDocuments(), User.countDocuments({ role: "student" }), User.countDocuments({ role: "admin" }), Material.countDocuments()
  ]);
  const progress = await Material.aggregate([{ $group: { _id: null, averageProgress: { $avg: "$progress" } } }]);
  res.json({ totalUsers, totalStudents, totalAdmins, totalMaterials, averageProgress: Math.round(progress[0]?.averageProgress || 0) });
};

module.exports = { getAllUsers, deleteUser, getStats };
