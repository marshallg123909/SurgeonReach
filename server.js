const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Health check - also shows if API key is set
app.get("/", (req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  const keyPreview = hasKey ? process.env.ANTHROPIC_API_KEY.substring(0, 10) + "..." : "NOT SET";
  res.json({ 
    status: "ProviderPath API running",
    api_key_set: hasKey,
    api_key_preview: keyPreview
  });
});

// NPI Search endpoint
app.get("/npi", async (req, res) => {
  const { taxonomy, state, city, limit } = req.query;
  const params = new URLSearchParams({
    taxonomy_description: taxonomy || "Orthopaedic Surgery",
    state: state || "TX",
    limit: limit || "20",
    version: "2.1",
    enumeration_type: "NPI-1"
  });
  if (city) params.set("city", city.toUpperCase());
  try {
    const fetch = (await import("node-fetch")).default;
    const response = await fetch("https://npiregistry.cms.hhs.gov/api/?" + params);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "NPI fetch failed", detail: err.message });
  }
});

// Claude AI endpoint
app.post("/claude", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "No prompt provided" });
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in environment variables" });
  }

  try {
    const fetch = (await import("node-fetch")).default;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    if (data.error) {
      return res.status(400).json({ error: data.error.message || "Anthropic API error", raw: data });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Claude API failed", detail: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
