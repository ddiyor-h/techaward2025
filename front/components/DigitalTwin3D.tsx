import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const DigitalTwin3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = null; 
    
    // Camera
    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(15, 12, 15);
    camera.lookAt(0, 2, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting (Professional/Neutral)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x3b82f6, 0.5, 20); // Subtle Corporate Blue fill
    blueLight.position.set(-5, 5, 5);
    scene.add(blueLight);

    // --- Building Mock Model ---
    const buildingGroup = new THREE.Group();

    // Materials - Clean, corporate look
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8, // Slate 400
      emissive: 0x1e293b,
      metalness: 0.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.5,
      transmission: 0.2,
      side: THREE.DoubleSide
    });

    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xcbd5e1, opacity: 0.2, transparent: true });
    const concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, metalness: 0.1 }); // Slate 700

    // Base
    const baseGeo = new THREE.BoxGeometry(10, 0.5, 10);
    const baseMesh = new THREE.Mesh(baseGeo, concreteMaterial);
    baseMesh.position.y = -0.25;
    baseMesh.receiveShadow = true;
    buildingGroup.add(baseMesh);

    // Grid Helper - Professional engineering style
    const gridHelper = new THREE.GridHelper(20, 20, 0x475569, 0x1e293b);
    gridHelper.position.y = -0.24;
    scene.add(gridHelper);

    // Floors
    const floorCount = 5;
    const floorHeight = 1.2;
    const buildingWidth = 6;
    const buildingDepth = 6;

    for (let i = 0; i < floorCount; i++) {
      // Floor Slab
      const slabGeo = new THREE.BoxGeometry(buildingWidth + 0.2, 0.1, buildingDepth + 0.2);
      const slab = new THREE.Mesh(slabGeo, concreteMaterial);
      slab.position.y = i * floorHeight;
      slab.castShadow = true;
      buildingGroup.add(slab);

      // Glass Walls
      const wallsGeo = new THREE.BoxGeometry(buildingWidth, floorHeight - 0.1, buildingDepth);
      const walls = new THREE.Mesh(wallsGeo, glassMaterial);
      walls.position.y = i * floorHeight + (floorHeight / 2);
      buildingGroup.add(walls);
      
      // Wireframe Edges
      const edges = new THREE.EdgesGeometry(wallsGeo);
      const line = new THREE.LineSegments(edges, edgeMaterial);
      line.position.copy(walls.position);
      buildingGroup.add(line);

      // Functional Core (Elevator shaft/Systems)
      const coreGeo = new THREE.BoxGeometry(1.5, floorHeight - 0.1, 1.5);
      const coreMat = new THREE.MeshStandardMaterial({ 
        color: 0x64748b, // Slate 500
        roughness: 0.5
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = i * floorHeight + (floorHeight / 2);
      buildingGroup.add(core);
    }

    // Roof equipment
    const chillerGeo = new THREE.BoxGeometry(1, 0.8, 1);
    const chillerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const chiller1 = new THREE.Mesh(chillerGeo, chillerMat);
    chiller1.position.set(1.5, floorCount * floorHeight + 0.4, 1);
    chiller1.castShadow = true;
    buildingGroup.add(chiller1);
    
    const chiller2 = chiller1.clone();
    chiller2.position.set(-1.5, floorCount * floorHeight + 0.4, -1);
    buildingGroup.add(chiller2);

    scene.add(buildingGroup);

    // Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Very slow, professional rotation
      buildingGroup.rotation.y += 0.001;

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      baseGeo.dispose();
      concreteMaterial.dispose();
      glassMaterial.dispose();
    };
  }, []);

  return (
    <div className="w-full h-full relative group">
      <div className="absolute top-4 left-4 z-10 bg-slate-800/90 backdrop-blur px-3 py-2 rounded border border-slate-700 shadow-sm">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Live Model</h4>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
           <span className="text-xs font-medium text-slate-200">Data Synchronized</span>
        </div>
      </div>
      <div ref={mountRef} className="w-full h-full rounded-xl overflow-hidden cursor-move" />
    </div>
  );
};

export default DigitalTwin3D;