const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.sqlite", (err) => {
    if (err) console.error("❌ Cannot open DB", err);
    else console.log("✅ SQLite database connected");
});

module.exports = db;