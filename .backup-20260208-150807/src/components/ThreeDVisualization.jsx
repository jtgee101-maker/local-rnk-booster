import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ThreeDVisualization - A 3D data visualization component using THREE.js
 * 
 * ORIGINAL: Direct import of THREE (adds ~500KB to bundle)
 * OPTIMIZED: Use LazyThreeDVisualization wrapper for dynamic import
 * 
 * @example
 * // ❌ Bad - Direct import adds 500KB to initial bundle
 * import ThreeDVisualization from './ThreeDVisualization';
 * 
 * // ✅ Good - Lazy loaded only when needed
 * import LazyThreeDVisualization from './LazyThreeDVisualization';
 */
export default function ThreeDVisualization({ data = [], height = 400 }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const frameIdRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / height,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create visualization bars from data
    data.forEach((item, index) => {
      const geometry = new THREE.BoxGeometry(0.5, item.value / 10, 0.5);
      const material = new THREE.MeshPhongMaterial({ 
        color: item.color || 0x4f46e5,
        shininess: 100
      });
      const bar = new THREE.Mesh(geometry, material);
      bar.position.x = (index - data.length / 2) * 0.8;
      bar.position.y = item.value / 20;
      scene.add(bar);
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      // Rotate scene slightly for 3D effect
      scene.rotation.y += 0.005;
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        const width = containerRef.current.clientWidth;
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      // Clean up Three.js objects
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, [data, height]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: `${height}px` }}
      className="rounded-lg overflow-hidden border border-gray-700"
    />
  );
}
