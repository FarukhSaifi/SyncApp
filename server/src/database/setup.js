require("dotenv").config();
const { config } = require("../config");
const connectDB = require("./connection");
const Credential = require("../models/Credential");
const { DATABASE, PLATFORMS } = require("../constants");

async function setupDatabase() {
  try {
    console.log("🚀 Setting up MongoDB database...");
    console.log("🔗 Connecting to:", config.mongoUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"));

    // Connect to MongoDB
    await connectDB();

    console.log("✅ MongoDB connection established");

    // Check if default credentials already exist
    const existingMediumCredentials = await Credential.findOne({ platform_name: PLATFORMS.MEDIUM });
    const existingDevtoCredentials = await Credential.findOne({ platform_name: PLATFORMS.DEVTO });

    if (!existingMediumCredentials) {
      // Create default Medium credentials record
      await Credential.create(DATABASE.DEFAULT_PLATFORM_CREDENTIALS.MEDIUM);
      console.log("✅ Default Medium credentials record created");
    } else {
      console.log("✅ Medium credentials already exist");
    }

    if (!existingDevtoCredentials) {
      // Create default DEV.to credentials record
      await Credential.create(DATABASE.DEFAULT_PLATFORM_CREDENTIALS.DEVTO);
      console.log("✅ Default DEV.to credentials record created");
    } else {
      console.log("✅ DEV.to credentials already exist");
    }

    console.log("🎉 Database setup completed successfully!");
    console.log("📝 Don't forget to update your API keys in the settings!");
    console.log(`   - Medium API key: ${DATABASE.SETUP_URLS.MEDIUM_SETTINGS}`);
    console.log(`   - DEV.to API key: ${DATABASE.SETUP_URLS.DEVTO_SETTINGS}`);
  } catch (error) {
    console.error("❌ Database setup failed:", error);

    if (error.message.includes("ECONNREFUSED")) {
      console.log("\n💡 MongoDB is not running. Please start MongoDB first:");
      console.log("   On macOS: brew services start mongodb-community");
      console.log("   On Ubuntu: sudo systemctl start mongodb");
      console.log("   On Windows: Start MongoDB service from Services");
      console.log(`   Or use MongoDB Atlas: ${DATABASE.SETUP_URLS.MONGODB_ATLAS}`);
    }

    process.exit(1);
  } finally {
    // Close the connection
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState === DATABASE.MONGOOSE_STATE.CONNECTED) {
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed");
    }
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
