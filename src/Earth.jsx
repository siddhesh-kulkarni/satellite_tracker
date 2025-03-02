import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const Earth = ({ latitude, longitude, altitude, satelliteId }) => {
  const [satelliteInfo, setSatelliteInfo] = useState({
    id: satelliteId || "Fetching...",
    latitude: latitude || "N/A",
    longitude: longitude || "N/A",
    altitude: altitude || "Fetching..."
  });

  // Refs for THREE.js objects
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const earthGroupRef = useRef(null);
  const markerRef = useRef(null);
  const frameRef = useRef(null);
  const satelliteTrailRef = useRef([]);

  // Log props on change
  useEffect(() => {
    console.log("🌍 Received Props:", { latitude, longitude, altitude, satelliteId });
  }, [latitude, longitude, altitude, satelliteId]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = document.getElementById("earth-container");
    if (!container) return;
    
    // Set up scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Add stronger ambient lighting for daytime effect
    const ambientLight = new THREE.AmbientLight(0x404040, 3);
    scene.add(ambientLight);
    
    // Add directional light (sun) - brighter for daytime
    const sunLight = new THREE.DirectionalLight(0xffffff, 2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Set up camera
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(
      75, 
      containerWidth / containerHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 0, 3);
    cameraRef.current = camera;

    // Set up renderer with better quality
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      precision: "highp"
    });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Set up controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;
    controls.enableZoom = true;
    controlsRef.current = controls;

    // Create Earth group
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // Load Earth texture - using a daytime Earth texture
    const loader = new THREE.TextureLoader();
    
    // Using a daytime Earth texture (Blue Marble image)
    const earthTexture = loader.load(
      "https://raw.githubusercontent.com/UdayGajul/Earth/refs/heads/main/textures/00_earthmap1k.jpg"
    );
    
    // Create Earth sphere with slightly enhanced detail
    const earthGeometry = new THREE.SphereGeometry(1.2, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({ 
      map: earthTexture,
      shininess: 20
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earthMesh);
    
    // Add atmosphere glow - adjusted for daytime appearance
    const atmosphereGeometry = new THREE.SphereGeometry(1.35, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 0.7) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earthGroup.add(atmosphere);

    // Add stars (keeping space theme)
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.015,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    const starVertices = [];
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Handle window resize
    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current || !container) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Rotate earth slightly
      if (earthGroup) {
        earthGroup.rotation.y += 0.001;
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement);
      }

      // Dispose resources to prevent memory leaks
      renderer.dispose();
    };
  }, []);

  // Update satellite info in state
  useEffect(() => {
    setSatelliteInfo({
      id: satelliteId || "Fetching...",
      latitude: latitude !== undefined ? latitude : "N/A",
      longitude: longitude !== undefined ? longitude : "N/A",
      altitude: altitude !== undefined ? altitude : "Fetching..."
    });
  }, [latitude, longitude, altitude, satelliteId]);

  // Update satellite marker
  useEffect(() => {
    if (!earthGroupRef.current || latitude === undefined || longitude === undefined) return;

    // Convert lat/lng to 3D position
    const latLngToVector3 = (lat, lng, radius) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    // Manage marker
    if (markerRef.current) {
      earthGroupRef.current.remove(markerRef.current);
      markerRef.current.geometry.dispose();
      markerRef.current.material.dispose();
    }

    // Calculate position with slight offset
    const markerPosition = latLngToVector3(latitude, longitude, 1.22);

    // Create improved marker
    const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const newMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Add glow effect to satellite
    const glowGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
          gl_FragColor = vec4(1.0, 0.3, 0.3, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    newMarker.add(glow);
    
    newMarker.position.copy(markerPosition);
    earthGroupRef.current.add(newMarker);
    markerRef.current = newMarker;

  }, [latitude, longitude]);

  return (
    <div className="earth-satellite-container">
      <div className="earth-view">
        <div id="earth-container" className="earth-container"></div>
      </div>
      <div className="satellite-info-panel">
        <h2 className="satellite-title">Satellite Tracking</h2>
        
        <div className="info-card">
          <div className="info-header">
            <div className="pulse-dot"></div>
            <h3>NORAD ID: <span className="highlight">{satelliteInfo.id}</span></h3>
          </div>
          
          <div className="data-grid">
            <div className="data-item">
              <div className="data-label">LATITUDE</div>
              <div className="data-value">
                {isNaN(latitude) 
                  ? "N/A" 
                  : `${parseFloat(latitude).toFixed(5)}°${latitude >= 0 ? 'N' : 'S'}`}
              </div>
            </div>
            
            <div className="data-item">
              <div className="data-label">LONGITUDE</div>
              <div className="data-value">
                {isNaN(longitude) 
                  ? "N/A" 
                  : `${parseFloat(longitude).toFixed(5)}°${longitude >= 0 ? 'E' : 'W'}`}
              </div>
            </div>
            
            <div className="data-item">
              <div className="data-label">ALTITUDE</div>
              <div className="data-value">
                {isNaN(altitude) 
                  ? "Fetching..." 
                  : `${parseFloat(altitude).toFixed(2)} km`}
              </div>
            </div>
          </div>

          <div className="instructions">
            <p>• Drag to rotate view</p>
            <p>• Scroll to zoom in/out</p>
            <p>• Right-click drag to pan</p>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .earth-satellite-container {
          display: flex;
          flex-direction: row;
          height: 90vh;
          background: linear-gradient(135deg, #0f1521 0%, #121e2f 100%);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          margin: 20px 0;
        }
        
        .earth-view {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        
        .earth-container {
          width: 100%;
          height: 100%;
        }
        
        .satellite-info-panel {
          width: 300px;
          padding: 20px;
          background: rgba(13, 19, 33, 0.7);
          backdrop-filter: blur(10px);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
        }
        
        .satellite-title {
          color: #fff;
          font-size: 24px;
          margin-bottom: 30px;
          text-align: center;
          font-weight: 600;
          letter-spacing: 1px;
        }
        
        .info-card {
          background: rgba(16, 23, 41, 0.7);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        
        .info-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .pulse-dot {
          width: 12px;
          height: 12px;
          background-color: #ff3333;
          border-radius: 50%;
          margin-right: 10px;
          position: relative;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 51, 51, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 51, 51, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 51, 51, 0);
          }
        }
        
        .info-header h3 {
          color: #fff;
          font-size: 16px;
          font-weight: 400;
          margin: 0;
        }
        
        .highlight {
          color: #4cc9f0;
          font-weight: 600;
        }
        
        .data-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .data-item {
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border-left: 3px solid #4cc9f0;
        }
        
        .data-label {
          font-size: 12px;
          color: #8d9db9;
          margin-bottom: 4px;
          letter-spacing: 1px;
        }
        
        .data-value {
          font-size: 18px;
          color: #fff;
          font-weight: 600;
        }
        
        .instructions {
          margin-top: 40px;
          color: #8d9db9;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .instructions p {
          margin: 5px 0;
        }
        
        /* Responsive design for smaller screens */
        @media (max-width: 768px) {
          .earth-satellite-container {
            flex-direction: column;
            height: auto;
          }
          
          .earth-view {
            height: 60vh;
          }
          
          .satellite-info-panel {
            width: 100%;
            border-left: none;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>
    </div>
  );
};

export default Earth;