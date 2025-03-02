import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import satellite from "satellite.js";

const app = express();

// Allowed origins (Update as needed)
const allowedOrigins = ["http://localhost:5173", "https://yourfrontend.com"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

app.use(express.json());

// 🚀 API Route: Fetch Satellite Position
app.get("/satellite/:noradId", async (req, res) => {
  try {
    const { noradId } = req.params;
    if (!noradId || isNaN(noradId)) {
      return res.status(400).json({ error: "Invalid NORAD ID" });
    }

    console.log(`Fetching data for NORAD ID: ${noradId}`);

    // 🌍 Fetch TLE data from Celestrak
    const tleResponse = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`);
    const tleText = await tleResponse.text();
    const tleLines = tleText.split("\n").map(line => line.trim()).filter(line => line.length > 0);

    console.log("TLE Data:", tleLines); // Debugging

    if (tleLines.length < 2) {
      return res.status(400).json({ error: "Invalid or missing TLE data" });
    }

    // 🛰 Handle both 2-line and 3-line TLE formats
    const satrec = satellite.twoline2satrec(tleLines[tleLines.length - 2], tleLines[tleLines.length - 1]);

    console.log("Satellite Record:", satrec); // Debugging

    const now = new Date();
    const positionAndVelocity = satellite.propagate(satrec, now);

    if (!positionAndVelocity.position) {
      return res.status(500).json({ error: "Could not calculate satellite position" });
    }

    // 🌍 Convert to lat/lon/alt
    const gmst = satellite.gstime(now);
    const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

    console.log("Position Data:", positionAndVelocity); // Debugging
    console.log("ECI to Geodetic:", positionGd); // Debugging

    const result = {
      noradId,
      timestamp: now.toISOString(),
      latitude: parseFloat(satellite.degreesLat(positionGd.latitude).toFixed(6)),
      longitude: parseFloat(satellite.degreesLong(positionGd.longitude).toFixed(6)),
      altitude_km: parseFloat(positionGd.height.toFixed(2)), // Altitude in km
    };

    console.log(`✅ Position: ${result.latitude}, ${result.longitude}, Altitude: ${result.altitude_km} km`);

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching satellite data:", error);
    res.status(500).json({ error: "Failed to fetch satellite data" });
  }
});

// 🌐 Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
