import express from "express";
import cors from "cors";
import OpenAI from "openai";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/identify", async (req, res) => {
  try {
    const imageData = req.body.image;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is the brand or name of the most identifiable product in this image? Respond with only the product name." },
            {
              type: "image_url",
              image_url: {
                url: imageData
              },
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    const answer = response.choices[0].message.content;
    res.json({ product: answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to identify product" });
  }
});

function obfuscate(str) {
  return Buffer.from(str).toString("base64").split("").reverse().join("");
}

function deobfuscate(str) {
  return Buffer.from(str.split("").reverse().join(""), "base64").toString();
}

app.get("/api/ipdata-key", (req, res) => {
  const key = obfuscate(process.env.IPDATA_API_KEY);
  res.json({ key });
});

app.get("/api/maps-key", (req, res) => {
  const key = obfuscate(process.env.GOOGLE_MAPS_API_KEY);
  const mapId = obfuscate(process.env.GOOGLE_MAP_ID);
  res.json({ key, mapId });
});

app.get("/api/find-place", async (req, res) => {
  try {
    const { query } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ error: "No matching places found." });
    }
    const place = data.results[0];
    res.json({
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      address: place.formatted_address
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to find place." });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});