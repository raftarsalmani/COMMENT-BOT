const axios = require("axios");
const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const { URL } = require("url");

// Load .env
dotenv.config();

// Read token
let ACCESS_TOKEN;
try {
  ACCESS_TOKEN = fs.readFileSync("token.txt", "utf-8").trim();
} catch (err) {
  console.error("❌ token.txt file not found.");
  process.exit(1);
}

// Read comments
let comments = [];
try {
  comments = fs.readFileSync("comment.txt", "utf-8").split("\n").map(c => c.trim()).filter(Boolean);
} catch (err) {
  console.error("❌ comment.txt not found.");
  process.exit(1);
}

// Read hater names
let names = [];
try {
  names = fs.readFileSync("name.txt", "utf-8").split("\n").map(n => n.trim()).filter(Boolean);
} catch (err) {
  console.error("❌ name.txt not found.");
  process.exit(1);
}

const POST_LINK = process.env.POST_LINK;
const INTERVAL = parseInt(process.env.INTERVAL) || 60000;

if (!POST_LINK || !ACCESS_TOKEN) {
  console.error("❌ Missing POST_LINK or ACCESS_TOKEN");
  process.exit(1);
}

// Extract post ID
function extractPostId(link) {
  try {
    const url = new URL(link);
    const uidMatch = url.pathname.match(/\/(\d+)\/posts/);
    const postIdMatch = url.pathname.match(/posts\/([a-zA-Z0-9]+)/);
    if (uidMatch && postIdMatch) {
      return `${uidMatch[1]}_${postIdMatch[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

const POST_ID = extractPostId(POST_LINK);
if (!POST_ID) {
  console.error("❌ Invalid POST_LINK");
  process.exit(1);
}

let commentIndex = 0;
let nameIndex = 0;

// Comment loop
async function commentLoop() {
  const message = `${comments[commentIndex]} - ${names[nameIndex]}`;

  try {
    const res = await axios.post(`https://graph.facebook.com/${POST_ID}/comments`, null, {
      params: {
        message,
        access_token: ACCESS_TOKEN,
      },
    });

    console.log(`✅ Sent: "${message}" at ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error("❌ Error:", err.response?.data?.error?.message || err.message);
  }

  commentIndex = (commentIndex + 1) % comments.length;
  nameIndex = (nameIndex + 1) % names.length;

  setTimeout(commentLoop, INTERVAL);
}

// Start server + bot
const app = express();
app.get("/", (req, res) => res.send("✅ ANURAG Comment Bot is Live!"));
app.listen(process.env.PORT || 3000, () => {
  console.log("🌍 Server running. Commenting every", INTERVAL / 1000, "sec");
  commentLoop();
});
