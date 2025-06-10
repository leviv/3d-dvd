import "./style.css";
import * as THREE from "three";
import * as lil from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

/**
 * Debug
 */
const gui = new lil.GUI({ closed: true, width: 400 });
gui.close();

/**
 * Textures
 */
const loadingManager = new THREE.LoadingManager();

const textureLoader = new THREE.TextureLoader(loadingManager);
const texture = textureLoader.load("./logo.svg");
const matcapTexture = textureLoader.load("./textures/matcaps/2.png");

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Helper to generate a random color
function getRandomColor() {
  return Math.floor(Math.random() * 0xffffff);
}

// Helper to create a material with a given color and the logo texture
function createLogoMaterial(color) {
  return new THREE.MeshBasicMaterial({
    color,
    map: texture,
    transparent: true,
    opacity: 0.9,
  });
}

// Create an array of 6 materials (one for each face)
let cubeColor = 0x0000ff;
let innerBoxMaterials = [
  createLogoMaterial(cubeColor),
  createLogoMaterial(cubeColor),
  createLogoMaterial(cubeColor),
  createLogoMaterial(cubeColor),
  createLogoMaterial(cubeColor),
  createLogoMaterial(cubeColor),
];

function createBoxMaterial(color) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

// Outer box
const outerBoxGeometry = new THREE.BoxGeometry(30, 20, 30);
let outerBoxColor = 0x00ffff; // Default color for the outer box
let outerBoxMaterials = [
  createBoxMaterial(outerBoxColor), // Right
  createBoxMaterial(outerBoxColor), // Left
  createBoxMaterial(outerBoxColor), // Top
  createBoxMaterial(outerBoxColor), // Bottom
  createBoxMaterial(outerBoxColor), // Front
  createBoxMaterial(outerBoxColor), // Back
];
const outerBox = new THREE.Mesh(outerBoxGeometry, outerBoxMaterials);
scene.add(outerBox);

// Outer box lines
var outerBoxLinesGeometry = new THREE.EdgesGeometry(outerBox.geometry);
var outerBoxLinesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
var outerBoxEdges = new THREE.LineSegments(
  outerBoxLinesGeometry,
  outerBoxLinesMaterial
);
scene.add(outerBoxEdges); 

// Inner box
const dvdAspectRatio = 2.26282051;
const innerBoxGeometry = new THREE.BoxGeometry(
  dvdAspectRatio,
  1,
  dvdAspectRatio
);
const innerBox = new THREE.Mesh(innerBoxGeometry, innerBoxMaterials);
innerBox.position.set(
  - (outerBoxGeometry.parameters.width / 2 - innerBoxGeometry.parameters.width / 2),   // X: left
    (outerBoxGeometry.parameters.height / 2 - innerBoxGeometry.parameters.height / 2), // Y: top
  - (outerBoxGeometry.parameters.depth / 2 - innerBoxGeometry.parameters.depth / 2)    // Z: front
);
scene.add(innerBox);

// Inner box lines
var innerBoxLinesGeometry = new THREE.EdgesGeometry(innerBox.geometry);
var innerBoxLinesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
var innerBoxEdges = new THREE.LineSegments(
  innerBoxLinesGeometry,
  innerBoxLinesMaterial
);
scene.add(innerBoxEdges); // Start with edges visible

// Text
// After scene setup:
let cornersHit = 0;
let counterMesh = null;
const fontLoader = new FontLoader();
fontLoader.load("./fonts/helvetiker_regular.typeface.json", (font) => {
  fontLoader.font = font; // Save for later
  const geometry = new TextGeometry(`Corners hit: ${cornersHit}`, {
    font: font,
    size: 2,
    height: 0.5,
    curveSegments: 12,
    bevelEnabled: false,
  });
  const material = new THREE.MeshMatcapMaterial({
    matcap: matcapTexture,
  });
  counterMesh = new THREE.Mesh(geometry, material);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const textWidth = box.max.x - box.min.x;
  counterMesh.position.set(-textWidth / 2, outerBoxGeometry.parameters.height / 2 + 3, 0);
  counterMesh.visible = guiOptions.showCounter; // <-- set visibility
  scene.add(counterMesh);
});

function updateCounterText(font) {
  if (counterMesh) {
    // Properly dispose of geometry and material to prevent memory leaks
    if (counterMesh.geometry) counterMesh.geometry.dispose();
    if (counterMesh.material) counterMesh.material.dispose();
    scene.remove(counterMesh);
  }
  const geometry = new TextGeometry(`Corners hit: ${cornersHit}`, {
    font: font,
    size: 2,
    height: 0.5,
    curveSegments: 15,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 4,
  });
  const material = new THREE.MeshMatcapMaterial({
    matcap: matcapTexture,
  });
  counterMesh = new THREE.Mesh(geometry, material);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const textWidth = box.max.x - box.min.x;
  counterMesh.position.set(-textWidth / 2, outerBoxGeometry.parameters.height / 2 + 3, 0);
  counterMesh.visible = guiOptions.showCounter;
  scene.add(counterMesh);
}

// GUI control for showing edges
const guiOptions = {
  showEdges: false, // Start with edges hidden
  sound: 0,         // Sound off by default
  showCounter: true // Show counter text by default
};
outerBoxEdges.visible = guiOptions.showEdges;
innerBoxEdges.visible = guiOptions.showEdges;
gui.add(guiOptions, "showEdges").name("Always Show edges").onChange((value) => {
  outerBoxEdges.visible = value;
  innerBoxEdges.visible = value;
});
gui.add(guiOptions, "showCounter").name("Show Counter").onChange((value) => {
  if (counterMesh) {
    counterMesh.visible = value;
  }
});
gui.add(guiOptions, "sound", 0, 1, 0.01).name("Sound Volume");

// Event listener for window resize
window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(0, 0, 37.5); 
camera.rotation.set(0, 0, 0);  
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Show outer box edges when user rotates
let edgeTimeout = null;

controls.addEventListener("change", () => {
  outerBoxEdges.visible = true;
  // Only auto-hide if the GUI toggle is off
  if (!guiOptions.showEdges) {
    if (edgeTimeout) clearTimeout(edgeTimeout);
    edgeTimeout = setTimeout(() => {
      outerBoxEdges.visible = false;
    }, 100); 
  }
});

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Velocity vector
const xInitialVelocity = .04;
const yInitialVelocity = .03;
const zInitialVelocity = .05;

const velocityVector = new THREE.Vector3(
  xInitialVelocity,
  yInitialVelocity,
  zInitialVelocity
);

gui.add(velocityVector, "x").min(0).max(2).step(0.1).name("x velocity");
gui.add(velocityVector, "y").min(0).max(2).step(0.1).name("y velocity");
gui.add(velocityVector, "z").min(0).max(2).step(0.1).name("z velocity");

// Target camera position for the top-left-front corner view
const targetCamera = new THREE.Vector3(-20, 15, 37.5); // left, up, out (was 60, now halfway: (15 + 60) / 2 = 37.5)

// Animation state for intro
let introStart = performance.now();
const introHold = 3000; // Hold at start for 3 seconds
const introDuration = 5000; 
let introDone = false;

const bounceSounds = [];
for (let i = 1; i <= 19; i++) {
  const audio = new Audio(`./bounce${i}.wav`);
  bounceSounds.push(audio);
}

function playBounceSoundForFace(faceIdx) {
  const soundIdx = faceIdx % bounceSounds.length;
  const sound = bounceSounds[soundIdx].cloneNode();
  sound.volume = guiOptions.sound; // Set volume from slider
  sound.currentTime = 0;
  if (guiOptions.sound > 0) {
    sound.play();
  }
}

// Animate
const clock = new THREE.Clock();
let wallFade = [0, 0, 0, 0, 0, 0]; // One for each face
const fadeDuration = 0.5; // seconds

const tick = () => {
  let bounced = false;
  let hitWalls = []; // Track all hit walls

  // X walls (right/left)
  const xLimit =
    Math.abs(
      outerBox.position.x +
        outerBoxGeometry.parameters.width / 2 -
        innerBoxGeometry.parameters.width / 2
    );
  if (Math.abs(innerBox.position.x) >= xLimit) {
    velocityVector.x = -velocityVector.x;
    bounced = true;
    hitWalls.push(innerBox.position.x > 0 ? 0 : 1); // right : left
    // Clamp position
    innerBox.position.x = Math.sign(innerBox.position.x) * xLimit;
    innerBoxEdges.position.x = innerBox.position.x;
  }
  // Y walls (top/bottom)
  const yLimit =
    Math.abs(
      outerBox.position.y +
        outerBoxGeometry.parameters.height / 2 -
        innerBoxGeometry.parameters.height / 2
    );
  if (Math.abs(innerBox.position.y) >= yLimit) {
    velocityVector.y = -velocityVector.y;
    bounced = true;
    hitWalls.push(innerBox.position.y > 0 ? 2 : 3); // top : bottom
    // Clamp position
    innerBox.position.y = Math.sign(innerBox.position.y) * yLimit;
    innerBoxEdges.position.y = innerBox.position.y;
  }
  // Z walls (front/back)
  const zLimit =
    Math.abs(
      outerBox.position.z +
        outerBoxGeometry.parameters.depth / 2 -
        innerBoxGeometry.parameters.depth / 2
    );
  if (Math.abs(innerBox.position.z) >= zLimit) {
    velocityVector.z = -velocityVector.z;
    bounced = true;
    hitWalls.push(innerBox.position.z > 0 ? 4 : 5); // front : back
    // Clamp position
    innerBox.position.z = Math.sign(innerBox.position.z) * zLimit;
    innerBoxEdges.position.z = innerBox.position.z;
  }

  // Change color on bounce and trigger wall highlights
  if (bounced) {
    // Highlight all hit walls
    hitWalls.forEach((wallIdx) => {
      wallFade[wallIdx] = fadeDuration;
      outerBox.material[wallIdx].color.setHex(cubeColor);
      outerBox.material[wallIdx].opacity = 1.0;
    });

    cubeColor = getRandomColor();
    innerBox.material.forEach((mat) => (mat.color.setHex(cubeColor)));
  }

  if (guiOptions.sound) {
    if (hitWalls.length === 1) {
      playBounceSoundForFace(hitWalls[0]);
    }
    

    if (hitWalls.length === 2) {
      playBounceSoundForFace(10);
    }

    if (hitWalls.length === 3) {
      playBounceSoundForFace(9);
    }
  }

  if (hitWalls.length === 3 && fontLoader.font) {
    cornersHit++;
    updateCounterText(fontLoader.font);
  }

  // Fade out wall highlights
  const delta = clock.getDelta();
  for (let i = 0; i < 6; i++) {
    if (wallFade[i] > 0) {
      wallFade[i] -= delta;
      outerBox.material[i].opacity = wallFade[i] / fadeDuration; // Fades from 1 to 0
      if (wallFade[i] <= 0) {
        outerBox.material[i].color.setHex(0x00ffff);
        outerBox.material[i].opacity = 0;
      }
    }
  }

  innerBox.position.add(velocityVector);
  innerBoxEdges.position.add(velocityVector);

  // Intro animation: hold, then pan out and move camera to focus on front top left corner
  if (!introDone) {
    const now = performance.now();
    const elapsed = now - introStart;

    let t = 0;
    if (elapsed > introHold) {
      t = Math.min((elapsed - introHold) / introDuration, 1);
    }

    // Ease in-out for smoothness
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    // Interpolate camera position
    camera.position.x = 0 + (targetCamera.x - 0) * ease;
    camera.position.y = 0 + (targetCamera.y - 0) * ease;
    camera.position.z = 15 + (targetCamera.z - 15) * ease; // z goes from 15 to 37.5

    // Always look at the center of the box
    camera.lookAt(0, 0, 0);

    if (t >= 1) {
      introDone = true;
      camera.position.copy(targetCamera);
      camera.lookAt(0, 0, 0);
    }
  }

  outerBoxEdges.position.copy(outerBox.position);
  outerBoxEdges.rotation.copy(outerBox.rotation);

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
