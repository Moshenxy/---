import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface WorldData {
  id: number;
  name: string;
  [key: string]: any;
}

interface StarObject extends THREE.Group {
  orbitSpeed?: number;
  orbitRadius?: number;
  orbitAngle?: number;
}

export class StarMapService {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private stars: THREE.Group;
  private skybox: THREE.Mesh | null = null;
  private starObjects: StarObject[] = [];
  private speedMultiplier: number = 0.2; // Add a speed multiplier

  constructor(container: HTMLElement) {
    console.log('[StarMapService] Constructor called.');
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.stars = new THREE.Group();

    this.init();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Smooths out the camera movement
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.1;
    this.controls.minDistance = 5; // Allow zooming in closer
    this.controls.maxDistance = 200; // Allow zooming out further
    this.controls.enablePan = true; // Enable panning with right-click
    this.controls.panSpeed = 0.5;

    this.animate();
  }

  private init() {
    console.log('[StarMapService] Init started.');
    // Renderer
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Camera
    this.camera.position.z = 50;
    this.scene.add(this.camera);

    // Stars group
    this.scene.add(this.stars);

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.createSkybox();
  }

  private createSkybox() {
    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float u_time;

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(random(i + vec2(0.0, 0.0)), random(i + vec2(1.0, 0.0)), u.x),
                     mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x), u.y);
        }

        mat2 rotate(float a) {
          float s = sin(a);
          float c = cos(a);
          return mat2(c, -s, s, c);
        }

        float fbm(vec2 st) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 6; i++) {
            value += amplitude * noise(st);
            st *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }

        void main() {
          vec2 st = vUv * 5.0;
          st.x *= 1.5;
          st *= rotate(u_time * 0.005);
          
          float f = fbm(st + u_time * 0.01);
          f *= fbm(st * 0.5 + u_time * 0.005);

          vec3 color1 = vec3(0.05, 0.0, 0.15);   // Deep Space Blue
          vec3 color2 = vec3(0.2, 0.1, 0.5);    // Nebula Purple
          vec3 color3 = vec3(0.8, 0.3, 0.3);    // Distant Star Red

          float t = smoothstep(0.3, 0.6, f);
          vec3 finalColor = mix(color1, color2, t);
          finalColor = mix(finalColor, color3, smoothstep(0.5, 0.7, f));

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      uniforms: {
        u_time: { value: 0.0 },
      },
      side: THREE.BackSide,
    });

    const skyboxGeometry = new THREE.SphereGeometry(500, 60, 40);
    this.skybox = new THREE.Mesh(skyboxGeometry, shaderMaterial);
    this.scene.add(this.skybox);
  }

  private getColorForEnergyLevel(level: number): THREE.Color {
    if (level <= 5) return new THREE.Color(0x00ffff); // Cyan
    if (level <= 10) return new THREE.Color(0x00ff00); // Green
    if (level <= 15) return new THREE.Color(0xffff00); // Yellow
    if (level <= 20) return new THREE.Color(0xffa500); // Orange
    return new THREE.Color(0x800080); // Purple
  }

  public createStars(worlds: WorldData[], selectableIds: Set<number>) {
    console.log(`[StarMapService] Updating stars with ${worlds.length} worlds.`);

    const existingStarIds = new Set(this.starObjects.map(s => s.userData.world.id));
    const newWorldIds = new Set(worlds.map(w => w.id));

    // --- Exit ---
    this.starObjects = this.starObjects.filter(star => {
      if (!newWorldIds.has(star.userData.world.id)) {
        // Animate out and remove
        this.stars.remove(star);
        return false;
      }
      return true;
    });

    // --- Enter ---
    worlds.forEach(world => {
      if (!existingStarIds.has(world.id)) {
        this.createSingleStar(world, selectableIds);
      }
    });

    // --- Update ---
    this.starObjects.forEach(star => {
      const world = star.userData.world;
      const isSelectable = selectableIds.has(world.id);
      const energyLevel = world.energyLevel || 1;
      const baseColor = this.getColorForEnergyLevel(energyLevel);
      const newColor = isSelectable ? baseColor : new THREE.Color(0x444444);

      const core = star.children[0] as THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
      const halo = star.children[1] as THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;

      if (core && halo) {
        core.material.color.lerp(newColor, 0.1);
        halo.material.color.lerp(newColor, 0.1);
      }
    });
  }

  private createSingleStar(world: WorldData, selectableIds: Set<number>) {
    const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const haloGeometry = new THREE.SphereGeometry(0.5, 16, 16);

    const phi = Math.acos(-1 + 2 * Math.random());
    const theta = Math.sqrt(this.starObjects.length * Math.PI) * phi;
    const radius = 30;

    const x = radius * Math.cos(theta) * Math.sin(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(phi);

    const isSelectable = selectableIds.has(world.id);
    const energyLevel = world.energyLevel || 1;
    const timeFlow = world.timeFlow || 1;

    const baseColor = this.getColorForEnergyLevel(energyLevel);
    const starColor = isSelectable ? baseColor : new THREE.Color(0x444444);

    // Star Core
    const coreMaterial = new THREE.MeshBasicMaterial({ color: starColor });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);

    // Star Halo
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: starColor,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);

    const haloScale = 1.5;
    halo.scale.set(haloScale, haloScale, haloScale);

    const starGroup: StarObject = new THREE.Group();
    starGroup.add(core);
    starGroup.add(halo);

    starGroup.position.set(x, y, z);

    // Store world data in the group for picking
    starGroup.userData = { world }; // Store data on the group itself
    core.userData = { world }; // Also on core for raycasting
    halo.userData = { world };

    // Store orbit data
    starGroup.orbitSpeed = Math.log1p(timeFlow) * 0.015; // Directly tie speed to timeFlow
    starGroup.orbitRadius = Math.sqrt(x * x + z * z);
    starGroup.orbitAngle = Math.atan2(z, x);

    this.stars.add(starGroup);
    this.starObjects.push(starGroup);
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));

    // Update shader time uniform
    if (this.skybox && this.skybox.material instanceof THREE.ShaderMaterial) {
      this.skybox.material.uniforms.u_time.value += 0.01;
    }

    // Update star orbits
    this.starObjects.forEach(star => {
      if (star.orbitSpeed && star.orbitRadius && star.orbitAngle !== undefined) {
        star.orbitAngle += star.orbitSpeed * this.speedMultiplier;
        star.position.x = star.orbitRadius * Math.cos(star.orbitAngle);
        star.position.z = star.orbitRadius * Math.sin(star.orbitAngle);
      }
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  public destroy() {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  // Placeholder for click detection
  public pickStar(event: MouseEvent): WorldData | null {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const rect = this.renderer.domElement.getBoundingClientRect();

    // Calculate mouse position in normalized device coordinates
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(this.stars.children);

    if (intersects.length > 0) {
      return intersects[0].object.userData.world as WorldData;
    }
    return null;
  }

  public setSpeedMultiplier(multiplier: number) {
    this.speedMultiplier = Math.max(0, multiplier); // Ensure multiplier is not negative
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }
}
