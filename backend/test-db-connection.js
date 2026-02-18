const mongoose = require("mongoose");
require("dotenv").config();

console.log("🔍 Testing MongoDB Atlas Connection...\n");
console.log(
  "📡 Connection String:",
  process.env.MONGODB_URI.replace(/:[^:@]+@/, ":****@"),
);

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("\n✅ SUCCESS! Connected to MongoDB Atlas");
    console.log("📦 Database Name:", mongoose.connection.db.databaseName);
    console.log("🌍 Host:", mongoose.connection.host);
    console.log(
      "📊 Ready State:",
      mongoose.connection.readyState,
      "(1 = connected)",
    );

    // Test a simple operation
    return mongoose.connection.db.admin().listDatabases();
  })
  .then((result) => {
    console.log("\n📋 Available Databases:");
    result.databases.forEach((db) => {
      console.log(
        `   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`,
      );
    });
    console.log("\n🎉 MongoDB Atlas connection is working perfectly!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ CONNECTION FAILED!");
    console.error("Error:", err.message);

    if (err.message.includes("authentication")) {
      console.error(
        "\n💡 Tip: Check your username and password in the connection string",
      );
    } else if (
      err.message.includes("network") ||
      err.message.includes("ENOTFOUND")
    ) {
      console.error(
        "\n💡 Tip: Check your internet connection and MongoDB Atlas IP whitelist",
      );
    } else if (err.message.includes("timeout")) {
      console.error(
        "\n💡 Tip: MongoDB Atlas might be unreachable. Check your network firewall",
      );
    }

    process.exit(1);
  });
