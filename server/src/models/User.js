const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { VALID_USER_ROLES, USER_ROLES } = require("../constants/userRoles");
const { STRING_LIMITS, NUMERIC_LIMITS, REGEX_PATTERNS, VALIDATION_ERRORS } = require("../constants/validation");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: STRING_LIMITS.USERNAME_MIN,
      maxlength: STRING_LIMITS.USERNAME_MAX,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [REGEX_PATTERNS.EMAIL, VALIDATION_ERRORS.INVALID_EMAIL],
    },
    password: {
      type: String,
      required: true,
      minlength: STRING_LIMITS.PASSWORD_MIN,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.FIRST_NAME_MAX,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.LAST_NAME_MAX,
    },
    bio: {
      type: String,
      maxlength: STRING_LIMITS.BIO_MAX,
    },
    avatar: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: VALID_USER_ROLES,
      default: USER_ROLES.USER,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(NUMERIC_LIMITS.BCRYPT_SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model("User", userSchema);
