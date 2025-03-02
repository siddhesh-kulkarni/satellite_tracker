import React, { useState, useEffect } from "react";
import Earth from "./Earth";

const SearchInput = () => {
  const [noradId, setNoradId] = useState("");
  const [inputNoradId, setInputNoradId] = useState("");
  const [satelliteData, setSatelliteData] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset data when changing satellite ID
  useEffect(() => {
    if (tracking && noradId) {
      // Reset previous satellite data
      setSatelliteData(null);
      // Start fetching new satellite data
      fetchSatelliteData();
    }
  }, [noradId]);

  // Set up tracking interval
  useEffect(() => {
    let interval;
    
    if (tracking) {
      // Initial fetch
      fetchSatelliteData();
      
      // Set up interval for continuous updates
      interval = setInterval(fetchSatelliteData, 1000);
      
      console.log(`🔄 Started tracking satellite ID: ${noradId}`);
    } else {
      console.log("⏹️ Stopped tracking");
    }
    
    // Cleanup interval on component unmount or when tracking changes
    return () => {
      if (interval) {
        clearInterval(interval);
        console.log("🧹 Cleaned up tracking interval");
      }
    };
  }, [tracking]);

  const fetchSatelliteData = async () => {
    try {
      if (!noradId) return;
      
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5000/satellite/${noradId}`);
      const data = await response.json();

      console.log("📡 Satellite data:", data);

      if (data.error) {
        setError(data.error);
        setTracking(false);
        setSatelliteData(null);
        return;
      }
      
      setSatelliteData(data);
    } catch (error) {
      console.error("🚨 Failed to fetch satellite data:", error);
      setError("Connection error or server not responding");
      setTracking(false);
    } finally {
      setLoading(false);
    }
  };

  const startTracking = () => {
    if (!inputNoradId) {
      setError("Please enter a NORAD ID");
      return;
    }
    
    // First stop current tracking (if any)
    setTracking(false);
    
    // Clear current data
    setSatelliteData(null);
    
    // Set the new NORAD ID
    setNoradId(inputNoradId);
    
    // Start tracking with small delay to ensure clean restart
    setTimeout(() => {
      setTracking(true);
    }, 100);
  };

  const stopTracking = () => {
    setTracking(false);
  };

  return (
    <div className="satellite-tracker">
      <div className="header">
        <h1>Global Satellite Tracker</h1>
        <p className="subheading">
          Enter a NORAD ID to track satellites in real-time
        </p>
      </div>

      <div className="search-container">
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter NORAD ID (e.g. 25544 for ISS)"
            value={inputNoradId}
            onChange={(e) => setInputNoradId(e.target.value)}
            disabled={loading}
          />
          
          {tracking ? (
            <button 
              className="stop-button" 
              onClick={stopTracking}
              disabled={loading}
            >
              Stop Tracking
            </button>
          ) : (
            <button 
              className="track-button" 
              onClick={startTracking}
              disabled={loading}
            >
              {loading ? "Connecting..." : "Track Satellite"}
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        
        {tracking && satelliteData && (
          <div className="tracking-label">
            <div className="tracking-dot"></div>
            Now tracking: NORAD ID {noradId}
          </div>
        )}
        
        <div className="popular-satellites">
          <p>Popular satellites: </p>
          <button className="satellite-chip" onClick={() => setInputNoradId("25544")}>ISS (25544)</button>
          <button className="satellite-chip" onClick={() => setInputNoradId("48274")}>Starlink (48274)</button>
          <button className="satellite-chip" onClick={() => setInputNoradId("33591")}>NOAA-19 (33591)</button>
        </div>
      </div>

      <div className="earth-container">
        {satelliteData ? (
          <Earth
            key={noradId} // Important: Add key to force re-render when ID changes
            latitude={satelliteData.latitude}
            longitude={satelliteData.longitude}
            altitude={satelliteData.altitude_km}
            satelliteId={satelliteData.noradId}
          />
        ) : (
          <div className="placeholder">
            {loading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Connecting to satellite...</p>
              </div>
            ) : (
              <div className="instructions">
                <h2>Enter a NORAD ID to begin tracking</h2>
                <p>The NORAD ID is a unique identifier assigned to objects in Earth orbit.</p>
                <p>Example: The International Space Station (ISS) has NORAD ID 25544.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .satellite-tracker {
          font-family: 'Roboto', 'Arial', sans-serif;
          background-color: #0c111b;
          color: white;
          min-height: 100vh;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        h1 {
          font-size: 36px;
          margin-bottom: 10px;
          background: linear-gradient(90deg, #4cc9f0, #4361ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 10px rgba(76, 201, 240, 0.3);
        }
        
        .subheading {
          color: #8d9db9;
          font-size: 18px;
          font-weight: 300;
        }
        
        .search-container {
          max-width: 800px;
          margin: 0 auto 30px;
          text-align: center;
        }
        
        .input-group {
          display: flex;
          margin-bottom: 15px;
        }
        
        input {
          flex: 1;
          padding: 15px 20px;
          font-size: 16px;
          border: none;
          border-radius: 8px 0 0 8px;
          background-color: #1a2235;
          color: white;
          outline: none;
          transition: background-color 0.3s;
        }
        
        input:focus {
          background-color: #242f47;
        }
        
        button {
          padding: 15px 25px;
          font-size: 16px;
          border: none;
          border-radius: 0 8px 8px 0;
          background-color: #4361ee;
          color: white;
          cursor: pointer;
          transition: background-color 0.3s;
          font-weight: 600;
        }
        
        .track-button {
          background-color: #4361ee;
        }
        
        .track-button:hover {
          background-color: #3a56d4;
        }
        
        .stop-button {
          background-color: #ef476f;
        }
        
        .stop-button:hover {
          background-color: #d63e63;
        }
        
        button:disabled {
          background-color: #475069;
          cursor: not-allowed;
        }
        
        .error-message {
          background-color: rgba(239, 71, 111, 0.2);
          border-left: 4px solid #ef476f;
          color: #ffa5b9;
          padding: 10px 15px;
          margin: 10px 0;
          text-align: left;
          border-radius: 4px;
        }
        
        .tracking-label {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 15px 0;
          font-size: 16px;
          color: #4cc9f0;
        }
        
        .tracking-dot {
          width: 10px;
          height: 10px;
          background-color: #4cc9f0;
          border-radius: 50%;
          margin-right: 10px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(76, 201, 240, 0.7);
          }
          70% {
            box-shadow: 0 0 0 7px rgba(76, 201, 240, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(76, 201, 240, 0);
          }
        }
        
        .popular-satellites {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          margin-top: 20px;
        }
        
        .popular-satellites p {
          margin: 10px;
          color: #8d9db9;
        }
        
        .satellite-chip {
          background-color: #1a2235;
          border-radius: 20px;
          padding: 8px 15px;
          margin: 5px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          border: 1px solid rgba(76, 201, 240, 0.3);
        }
        
        .satellite-chip:hover {
          background-color: #242f47;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .earth-container {
          margin-top: 20px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          min-height: 500px;
        }
        
        .placeholder {
          height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f1521 0%, #121e2f 100%);
          border-radius: 12px;
        }
        
        .instructions {
          max-width: 600px;
          padding: 30px;
          text-align: center;
        }
        
        .instructions h2 {
          margin-bottom: 20px;
          color: #e2e8f0;
        }
        
        .instructions p {
          color: #8d9db9;
          line-height: 1.6;
          margin-bottom: 10px;
        }
        
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 5px solid rgba(76, 201, 240, 0.2);
          border-top: 5px solid #4cc9f0;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SearchInput;