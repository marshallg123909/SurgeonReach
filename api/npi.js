export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

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
    const response = await fetch("https://npiregistry.cms.hhs.gov/api/?" + params);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "NPI fetch failed", detail: err.message });
  }
}
