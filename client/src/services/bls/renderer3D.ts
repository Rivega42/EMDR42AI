/**
 * Revolutionary 3D Renderer for BLS System
 * Three.js-based 3D rendering with therapeutic patterns and effects
 */

import * as THREE from 'three';
import type { BLSPattern, BLS3DConfig } from '@/../../shared/types';

export interface Pattern3DPosition {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  progress: number; // 0-1 for pattern completion
}

export interface Renderer3DCallbacks {
  onPatternComplete?: () => void;
  onDirectionChange?: (direction: number) => void;
  onPositionUpdate?: (position: Pattern3DPosition) => void;
}

export class Renderer3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private stimulus: THREE.Object3D;
  private animationId: number | null = null;
  private container: HTMLElement;
  
  // Animation state
  private isAnimating: boolean = false;
  private currentPattern: BLSPattern = 'horizontal';
  private animationSpeed: number = 5;
  private progress: number = 0;
  private direction: number = 1;
  private patternCompleteCount: number = 0;
  private lastFrameTime: number = 0;
  
  // Pattern-specific parameters
  private patternParams: Map<BLSPattern, any> = new Map();
  
  // 3D Configuration
  private config: BLS3DConfig;
  private callbacks: Renderer3DCallbacks = {};
  
  // Pattern-specific state
  private patternState: Map<string, any> = new Map();
  
  // Lighting and effects
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private particleSystem: THREE.Points | null = null;

  constructor(container: HTMLElement, config: BLS3DConfig) {
    this.container = container;
    this.config = config;
    
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000015); // Deep therapeutic blue-black
    
    // Create camera
    this.camera = this.createCamera();
    
    // Create renderer
    this.renderer = this.createRenderer();
    container.appendChild(this.renderer.domElement);
    
    // Setup lighting
    this.setupLighting();
    
    // Create stimulus object
    this.stimulus = this.createStimulus();
    this.scene.add(this.stimulus);
    
    // Setup particle effects if enabled
    if (config.particleEffects) {
      this.setupParticleSystem();
    }
    
    // Handle resize
    this.handleResize();
    window.addEventListener('resize', this.handleResize.bind(this));
    
    console.log('3D Renderer initialized successfully');
  }

  /**
   * Start 3D animation with pattern
   */
  start(pattern: BLSPattern, speed: number): void {
    this.currentPattern = pattern;
    this.animationSpeed = speed;
    this.isAnimating = true;
    this.progress = 0;
    this.direction = 1;
    
    // Initialize pattern-specific state
    this.initializePatternState(pattern);
    
    this.animate();
  }

  /**
   * Stop animation
   */
  stop(): void {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Update pattern during runtime
   */
  updatePattern(pattern: BLSPattern): void {
    if (this.currentPattern !== pattern) {
      this.currentPattern = pattern;
      this.progress = 0;
      this.initializePatternState(pattern);
    }
  }

  /**
   * Update speed during runtime
   */
  updateSpeed(speed: number): void {
    this.animationSpeed = speed;
  }

  /**
   * Update stimulus appearance
   */
  updateStimulus(color: string, size: number, secondaryColor?: string): void {
    if (this.stimulus) {
      this.scene.remove(this.stimulus);
    }
    
    this.stimulus = this.createStimulus(color, size, secondaryColor);
    this.scene.add(this.stimulus);
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: Renderer3DCallbacks): void {
    this.callbacks = callbacks;
  }

  // === Private Methods ===

  private createCamera(): THREE.PerspectiveCamera | THREE.OrthographicCamera {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    
    if (this.config.cameraType === 'orthographic') {
      const frustumSize = 10;
      return new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / -2,
        0.1, 1000
      );
    } else {
      const camera = new THREE.PerspectiveCamera(
        this.config.fieldOfView, 
        aspect, 
        0.1, 
        1000
      );
      camera.position.z = this.config.cameraDistance;
      return camera;
    }
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: this.config.antialias,
      alpha: true
    });
    
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    if (this.config.shadows) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    return renderer;
  }

  private setupLighting(): void {
    // Ambient light for overall illumination
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(this.ambientLight);
    
    // Directional light for depth and shadows
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(5, 5, 5);
    
    if (this.config.shadows) {
      this.directionalLight.castShadow = true;
      this.directionalLight.shadow.mapSize.width = 2048;
      this.directionalLight.shadow.mapSize.height = 2048;
    }
    
    this.scene.add(this.directionalLight);
    
    // Apply lighting configuration
    this.applyLightingMode(this.config.lighting);
  }

  private applyLightingMode(mode: string): void {
    switch (mode) {
      case 'basic':
        this.ambientLight.intensity = 0.8;
        this.directionalLight.intensity = 0.6;
        break;
      case 'ambient':
        this.ambientLight.intensity = 0.9;
        this.directionalLight.intensity = 0.3;
        break;
      case 'dramatic':
        this.ambientLight.intensity = 0.2;
        this.directionalLight.intensity = 1.2;
        break;
      case 'therapeutic':
        this.ambientLight.intensity = 0.6;
        this.directionalLight.intensity = 0.8;
        this.ambientLight.color.setHex(0x4080ff); // Therapeutic blue tint
        break;
    }
  }

  private createStimulus(color: string = '#3b82f6', size: number = 20, secondaryColor?: string): THREE.Object3D {
    const group = new THREE.Group();
    
    // Main sphere stimulus
    const geometry = new THREE.SphereGeometry(size / 20, 32, 32);
    
    let material: THREE.Material;
    
    if (secondaryColor) {
      // Create gradient material
      material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(secondaryColor),
        emissiveIntensity: 0.2,
        shininess: 100
      });
    } else {
      material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.1,
        shininess: 100
      });
    }
    
    const sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    
    group.add(sphere);
    
    // Add therapeutic glow effect if enabled
    if (this.config.bloomEffect) {
      const glowGeometry = new THREE.SphereGeometry(size / 15, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      group.add(glow);
    }
    
    return group;
  }

  private setupParticleSystem(): void {
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 20;
      
      colors[i] = Math.random() * 0.5 + 0.5;     // R
      colors[i + 1] = Math.random() * 0.5 + 0.5; // G
      colors[i + 2] = 1.0;                       // B (therapeutic blue)
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });
    
    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  private initializePatternState(pattern: BLSPattern): void {
    this.patternState.clear();
    
    switch (pattern) {
      case 'cube3d':
        this.patternState.set('vertices', this.generateCubeVertices());
        this.patternState.set('edgeIndex', 0);
        break;
      case 'spiral3d':
        this.patternState.set('turns', 3);
        this.patternState.set('radius', 3);
        break;
      case 'helix3d':
        this.patternState.set('turns', 4);
        this.patternState.set('radius', 2);
        this.patternState.set('height', 4);
        break;
      case 'lemniscate3d':
        this.patternState.set('scale', 3);
        break;
      case 'sphere3d':
        this.patternState.set('radius', 3);
        break;
      case 'DNA3d':
        this.patternState.set('radius', 2);
        this.patternState.set('height', 6);
        this.patternState.set('strands', 2);
        break;
    }
  }

  private generateCubeVertices(): THREE.Vector3[] {
    const size = 3;
    return [
      new THREE.Vector3(-size, -size, -size), // 0
      new THREE.Vector3(size, -size, -size),  // 1
      new THREE.Vector3(size, size, -size),   // 2
      new THREE.Vector3(-size, size, -size),  // 3
      new THREE.Vector3(-size, -size, size),  // 4
      new THREE.Vector3(size, -size, size),   // 5
      new THREE.Vector3(size, size, size),    // 6
      new THREE.Vector3(-size, size, size)    // 7
    ];
  }

  private calculatePatternPosition(pattern: BLSPattern, progress: number): Pattern3DPosition {
    const t = progress % 1; // Normalize to 0-1
    
    switch (pattern) {
      case 'cube3d':
        return this.calculateCube3DPosition(t);
      case 'spiral3d':
        return this.calculateSpiral3DPosition(t);
      case 'helix3d':
        return this.calculateHelix3DPosition(t);
      case 'lemniscate3d':
        return this.calculateLemniscate3DPosition(t);
      case 'lissajous3d':
        return this.calculateLissajous3DPosition(t);
      case 'sphere3d':
        return this.calculateSphere3DPosition(t);
      case 'infinity3d':
        return this.calculateInfinity3DPosition(t);
      case 'wave3d':
        return this.calculateWave3DPosition(t);
      case 'butterfly3d':
        return this.calculateButterfly3DPosition(t);
      case 'DNA3d':
        return this.calculateDNA3DPosition(t);
      
      // 2D patterns (legacy compatibility)
      case 'horizontal':
        return this.calculateHorizontalPosition(t);
      case 'vertical':
        return this.calculateVerticalPosition(t);
      case 'diagonal':
        return this.calculateDiagonalPosition(t);
      case 'circle':
        return this.calculateCirclePosition(t);
      case '3d-wave':
        return this.calculateSimple3DWavePosition(t);
      
      default:
        return this.calculateHorizontalPosition(t);
    }
  }

  /**
   * Get normalized speed for consistent movement across patterns
   */
  private getNormalizedSpeed(pattern: BLSPattern, speed: number): number {
    const baseSpeed = speed / 5.0; // Normalize to 0-2 range
    
    // Pattern-specific speed multipliers for consistent experience
    const speedMultipliers: Record<BLSPattern, number> = {
      'horizontal': 1.0,
      'vertical': 1.0,
      'diagonal': 1.0,
      'circle': 1.0,
      '3d-wave': 1.0,
      'cube3d': 0.8,      // Slower for complex path
      'spiral3d': 1.2,     // Faster for smooth spiral
      'helix3d': 1.1,      // Slightly faster
      'lemniscate3d': 0.9, // Slower for figure-8
      'lissajous3d': 0.7,  // Much slower for complex curves
      'sphere3d': 1.0,     // Standard speed
      'infinity3d': 0.9,   // Slower for infinity symbol
      'wave3d': 1.3,      // Faster for wave motion
      'butterfly3d': 0.8,  // Slower for butterfly pattern
      'DNA3d': 1.1        // Slightly faster for DNA helix
    };
    
    return baseSpeed * (speedMultipliers[pattern] || 1.0);
  }

  // === 3D Pattern Implementations ===

  /**
   * Cube 3D Pattern - Movement along cube edges for spatial awareness
   */
  private calculateCube3DPosition(t: number): Pattern3DPosition {
    const size = 3;
    const edgeProgress = (t * 12) % 1; // 12 edges in a cube
    const edge = Math.floor(t * 12);
    
    let x = 0, y = 0, z = 0;
    
    // Define cube edges (12 total)
    const edges = [
      // Bottom face edges
      { start: [-size, -size, -size], end: [size, -size, -size] },  // 0
      { start: [size, -size, -size], end: [size, size, -size] },     // 1
      { start: [size, size, -size], end: [-size, size, -size] },     // 2
      { start: [-size, size, -size], end: [-size, -size, -size] },   // 3
      
      // Top face edges
      { start: [-size, -size, size], end: [size, -size, size] },     // 4
      { start: [size, -size, size], end: [size, size, size] },       // 5
      { start: [size, size, size], end: [-size, size, size] },       // 6
      { start: [-size, size, size], end: [-size, -size, size] },     // 7
      
      // Vertical edges
      { start: [-size, -size, -size], end: [-size, -size, size] },   // 8
      { start: [size, -size, -size], end: [size, -size, size] },     // 9
      { start: [size, size, -size], end: [size, size, size] },       // 10
      { start: [-size, size, -size], end: [-size, size, size] }      // 11
    ];
    
    const currentEdge = edges[edge];
    x = currentEdge.start[0] + (currentEdge.end[0] - currentEdge.start[0]) * edgeProgress;
    y = currentEdge.start[1] + (currentEdge.end[1] - currentEdge.start[1]) * edgeProgress;
    z = currentEdge.start[2] + (currentEdge.end[2] - currentEdge.start[2]) * edgeProgress;
    
    return {
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(0, t * Math.PI * 2, 0),
      scale: 1 + Math.sin(t * Math.PI * 4) * 0.1,
      progress: t
    };
  }

  /**
   * Spiral 3D Pattern - 3D spiral for deep processing
   */
  private calculateSpiral3DPosition(t: number): Pattern3DPosition {
    const radius = 3;
    const height = 4;
    const turns = 3;
    
    const angle = t * Math.PI * 2 * turns;
    const x = Math.cos(angle) * radius * (1 - t * 0.3); // Spiral inward
    const y = Math.sin(angle) * radius * (1 - t * 0.3);
    const z = (t - 0.5) * height; // Move up/down
    
    return {
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(angle * 0.1, 0, angle * 0.05),
      scale: 1 + Math.sin(t * Math.PI * 6) * 0.15,
      progress: t
    };
  }

  /**
   * Helix 3D Pattern - Helical movement for bilateral integration
   */
  private calculateHelix3DPosition(t: number): Pattern3DPosition {
    const radius = 2.5;
    const height = 6;
    const turns = 4;
    
    const angle = t * Math.PI * 2 * turns;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = (t - 0.5) * height;
    
    return {
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(0, angle, 0),
      scale: 1 + Math.cos(t * Math.PI * 8) * 0.1,
      progress: t
    };
  }

  /**
   * Lemniscate 3D Pattern - 3D figure-8 for memory consolidation
   */
  private calculateLemniscate3DPosition(t: number): Pattern3DPosition {
    const scale = 3;
    const angle = t * Math.PI * 4; // Two loops
    
    // 3D figure-8 (lemniscate)
    const x = scale * Math.cos(angle) / (1 + Math.sin(angle) * Math.sin(angle));
    const y = scale * Math.sin(angle) * Math.cos(angle) / (1 + Math.sin(angle) * Math.sin(angle));
    const z = Math.sin(t * Math.PI * 6) * 1.5; // Add vertical oscillation
    
    return {
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(angle * 0.2, 0, angle * 0.1),
      scale: 1 + Math.sin(t * Math.PI * 10) * 0.2,
      progress: t
    };
  }

  /**
   * Lissajous 3D Pattern - Complex Lissajous curves for attention
   */
  private calculateLissajous3DPosition(t: number): Pattern3DPosition {
    const A = 3, B = 2, C = 1.5;
    const a = 3, b = 4, c = 2;
    const delta1 = Math.PI / 4, delta2 = Math.PI / 3;
    
    const angle = t * Math.PI * 2;
    
    const x = A * Math.sin(a * angle + delta1);
    const y = B * Math.sin(b * angle + delta2);
    const z = C * Math.sin(c * angle);
    
    return {
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(angle * 0.3, angle * 0.2, angle * 0.1),
      scale: 1 + Math.sin(t * Math.PI * 12) * 0.25,
      progress: t
    };
  }

  /**
   * Sphere 3D Pattern - Spherical movement for grounding
   */
  private calculateSphere3DPosition(t: number): Pattern3DPosition {
    const radius = 3;
    const phi = t * Math.PI * 4; // Latitude
    const theta = t * Math.PI * 8; // Longitude
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    return {
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(phi, theta, 0),
      scale: 1 + Math.sin(t * Math.PI * 6) * 0.1,
      progress: t
    };
  }

  /**
   * DNA 3D Pattern - DNA helix for healing visualization
   */
  private calculateDNA3DPosition(t: number): Pattern3DPosition {
    const radius = 2;
    const height = 8;
    const turns = 6;
    
    const angle = t * Math.PI * 2 * turns;
    
    // Double helix - alternating between two helices
    const helixSelect = Math.floor(t * turns * 2) % 2;
    const offsetAngle = helixSelect * Math.PI;
    
    const x = Math.cos(angle + offsetAngle) * radius;
    const y = Math.sin(angle + offsetAngle) * radius;
    const z = (t - 0.5) * height;
    
    return {
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(0, angle, 0),
      scale: 1 + Math.sin(t * Math.PI * 12) * 0.1,
      progress: t
    };
  }

  private animate = (): void => {
    if (!this.isAnimating) return;
    
    // Performance guard: Check tab visibility
    if (document.hidden) {
      this.animationId = requestAnimationFrame(this.animate);
      return;
    }
    
    const now = performance.now();
    
    // Frame budget guard: Target 60fps, skip frame if taking too long
    const frameTimeBudget = 16.67; // ~60fps
    const lastFrameTime = now - (this.lastFrameTime || now);
    if (lastFrameTime > frameTimeBudget * 2) {
      // Skip this frame if we're running behind
      this.lastFrameTime = now;
      this.animationId = requestAnimationFrame(this.animate);
      return;
    }
    
    this.animationId = requestAnimationFrame(this.animate);
    
    // Calculate delta time for smooth animation
    const deltaTime = Math.min(lastFrameTime, 33); // Cap at 30fps minimum
    const progressDelta = this.getNormalizedSpeed(this.currentPattern, this.animationSpeed) * this.direction * deltaTime / 1000;
    this.progress += progressDelta;
    
    // Handle boundaries and direction changes
    if (this.progress >= 1 || this.progress <= 0) {
      this.progress = Math.max(0, Math.min(1, this.progress));
      this.direction *= -1;
      this.patternCompleteCount++;
      
      this.callbacks.onDirectionChange?.(this.direction);
      this.callbacks.onPatternComplete?.();
    }
    
    // Calculate position
    const position = this.calculatePatternPosition(this.currentPattern, this.progress);
    
    // Update stimulus position safely
    if (this.stimulus && position) {
      this.stimulus.position.copy(position.position);
      this.stimulus.rotation.copy(position.rotation);
      this.stimulus.scale.setScalar(position.scale);
    }
    
    // Update particle system if enabled
    if (this.particleSystem) {
      this.particleSystem.rotation.y += 0.005;
    }
    
    // Notify position update for subsystem integration
    this.callbacks.onPositionUpdate?.(position);
    
    // Render frame
    this.renderer.render(this.scene, this.camera);
    
    this.lastFrameTime = now;
  };

  private handleResize = (): void => {
    try {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      
      if (width <= 0 || height <= 0) return; // Avoid invalid dimensions
      
      if (this.camera && 'aspect' in this.camera) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
      }
      
      if (this.renderer) {
        this.renderer.setSize(width, height);
      }
    } catch (error) {
      console.error('Error handling resize:', error);
    }
  };

  // === Additional 3D Pattern Implementations ===

  /**
   * Infinity 3D Pattern - 3D infinity symbol for flow states
   */
  private calculateInfinity3DPosition(t: number): Pattern3DPosition {
    const scale = 3;
    const angle = t * Math.PI * 2;
    
    // 3D infinity symbol (modified lemniscate)
    const x = scale * Math.cos(angle) / (1 + Math.sin(angle) * Math.sin(angle));
    const y = scale * Math.sin(angle) * Math.cos(angle) / (1 + Math.sin(angle) * Math.sin(angle));
    const z = Math.sin(angle * 2) * 0.8; // Add twist in Z
    
    return {
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(0, angle, angle * 0.5),
      scale: 1 + Math.sin(t * Math.PI * 8) * 0.15,
      progress: t
    };
  }

  /**
   * Wave 3D Pattern - Ocean wave motion for calming
   */
  private calculateWave3DPosition(t: number): Pattern3DPosition {
    const amplitude = 2;
    const frequency = 3;
    
    const x = (t - 0.5) * 8; // Move across
    const y = amplitude * Math.sin(t * Math.PI * frequency);
    const z = amplitude * 0.5 * Math.sin(t * Math.PI * frequency * 2 + Math.PI / 4);
    
    return {
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(0, 0, Math.sin(t * Math.PI * 4) * 0.3),
      scale: 1 + Math.sin(t * Math.PI * 6) * 0.1,
      progress: t
    };
  }

  /**
   * Butterfly 3D Pattern - Butterfly pattern for transformation
   */
  private calculateButterfly3DPosition(t: number): Pattern3DPosition {
    const angle = t * Math.PI * 2;
    const scale = 2.5;
    
    // Butterfly curve equations
    const x = scale * Math.sin(angle) * (Math.exp(Math.cos(angle)) - 2 * Math.cos(4 * angle) - Math.pow(Math.sin(angle / 12), 5));
    const y = scale * Math.cos(angle) * (Math.exp(Math.cos(angle)) - 2 * Math.cos(4 * angle) - Math.pow(Math.sin(angle / 12), 5));
    const z = Math.sin(angle * 3) * 0.8; // Add vertical movement
    
    return {
      position: new THREE.Vector3(x * 0.3, y * 0.3, z),
      rotation: new THREE.Euler(angle * 0.1, 0, angle * 0.2),
      scale: 1 + Math.sin(t * Math.PI * 10) * 0.2,
      progress: t
    };
  }

  // === 2D Pattern Implementations (Legacy Compatibility) ===

  private calculateHorizontalPosition(t: number): Pattern3DPosition {
    const x = (t - 0.5) * 6;
    return {
      position: new THREE.Vector3(x, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: 1,
      progress: t
    };
  }

  private calculateVerticalPosition(t: number): Pattern3DPosition {
    const y = (t - 0.5) * 6;
    return {
      position: new THREE.Vector3(0, y, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: 1,
      progress: t
    };
  }

  private calculateDiagonalPosition(t: number): Pattern3DPosition {
    const offset = (t - 0.5) * 6;
    return {
      position: new THREE.Vector3(offset, offset, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: 1,
      progress: t
    };
  }

  private calculateCirclePosition(t: number): Pattern3DPosition {
    const angle = t * Math.PI * 2;
    const radius = 3;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return {
      position: new THREE.Vector3(x, y, 0),
      rotation: new THREE.Euler(0, 0, angle),
      scale: 1,
      progress: t
    };
  }

  private calculateSimple3DWavePosition(t: number): Pattern3DPosition {
    const x = (t - 0.5) * 6;
    const y = Math.sin(t * Math.PI * 4) * 2;
    const z = Math.cos(t * Math.PI * 6) * 1;
    
    return {
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(0, 0, 0),
      scale: 1,
      progress: t
    };
  }

  /**
   * Clean up resources - Enhanced error handling
   */
  dispose(): void {
    try {
      this.stop();
      
      // Clean up Three.js resources safely
      if (this.scene) {
        this.scene.clear();
      }
      
      if (this.renderer) {
        this.renderer.dispose();
      }
      
      // Remove resize listener
      window.removeEventListener('resize', this.handleResize);
      
      // Remove canvas from container safely
      if (this.renderer?.domElement?.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    } catch (error) {
      console.error('Error disposing 3D renderer:', error);
    }
  }

  /**
   * Get current animation state
   */
  getState(): { progress: number; direction: number; pattern: BLSPattern } {
    return {
      progress: this.progress,
      direction: this.direction,
      pattern: this.currentPattern
    };
  }
}