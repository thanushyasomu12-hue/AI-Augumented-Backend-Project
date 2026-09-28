const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },

  role: {
    type: String,
    enum: ["student", "admin"],
    default: "student"
  },

  preferences: {
    dailyHours: {
      type: Number,
      default: 2,
      min: 0.5,
      max: 16
    },

    preferredDifficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium"
    }
  }

}, { timestamps: true });


// Password hashing
userSchema.pre("save", async function () {

  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});


// Password checking
userSchema.methods.matchPassword = async function (enteredPassword) {

  return await bcrypt.compare(enteredPassword, this.password);

};


module.exports = mongoose.model("User", userSchema);