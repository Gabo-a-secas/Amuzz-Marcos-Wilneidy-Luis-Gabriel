import * as THREE from "https://unpkg.com/three@0.178.0/build/three.module.js";

// Variables globales
let mouse = new THREE.Vector2();
let mouseWorld = new THREE.Vector3();
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Video de fondo
const video = document.createElement("video");
video.src = "/fondo.mp4";
video.crossOrigin = "anonymous";
video.loop = true;
video.muted = true;
video.playsInline = true;
video.play();

const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBFormat;

// Funciones de color y forma por mood
function getMoodColor(mood) {
  switch (mood) {
    case "happy":
      return new THREE.Color(1, 0.8, 0.3);
    case "sad":
      return new THREE.Color(0.3, 0.4, 0.8);
    case "relax":
      return new THREE.Color(0.4, 1, 0.8);
    case "anxiety":
      return new THREE.Color(1, 0.4, 0.4);
    case "party":
      return new THREE.Color(0.9, 0.2, 1);
    case "energic":
      return new THREE.Color(1, 0.1, 0.1);
    case "latin":
      return new THREE.Color(1, 0.6, 0.2);
    default:
      return new THREE.Color(1, 1, 1);
  }
}

function getGeometryByMood(mood) {
  switch (mood) {
    case "happy":
      return new THREE.SphereGeometry(1.4, 64, 64).toNonIndexed();
    case "sad":
      return new THREE.ConeGeometry(2, 3, 120, 50).toNonIndexed();
    case "energic":
      return new THREE.TorusGeometry(1, 0.5, 64, 100).toNonIndexed(); // reemplazo del cubo
    case "relax":
      return new THREE.ConeGeometry(5, 0.3, 64, 50).toNonIndexed();
    case "party":
      return new THREE.OctahedronGeometry(1.6).toNonIndexed();
    case "latin":
      return new THREE.DodecahedronGeometry(1.6).toNonIndexed();
    case "anxiety":
      return new THREE.TorusKnotGeometry(1, 0.3, 120, 16).toNonIndexed();
    default:
      return new THREE.SphereGeometry(1.4, 64, 64).toNonIndexed();
  }
}

function generateTriangleData(geometry) {
  const posAttr = geometry.getAttribute("position");
  const triangleCount = posAttr.count / 3;
  const triangleData = new Float32Array(triangleCount * 4);
  for (let i = 0; i < triangleCount; i++) {
    const idx = i * 9;
    const tIdx = i * 4;
    const x =
      (posAttr.array[idx] + posAttr.array[idx + 3] + posAttr.array[idx + 6]) /
      3;
    const y =
      (posAttr.array[idx + 1] +
        posAttr.array[idx + 4] +
        posAttr.array[idx + 7]) /
      3;
    const z =
      (posAttr.array[idx + 2] +
        posAttr.array[idx + 5] +
        posAttr.array[idx + 8]) /
      3;
    triangleData[tIdx] = x;
    triangleData[tIdx + 1] = y;
    triangleData[tIdx + 2] = z;
    triangleData[tIdx + 3] = 1 / triangleCount;
  }
  return { triangleData, triangleCount };
}

// Geometría inicial
let geometry = getGeometryByMood("happy");
let { triangleData, triangleCount } = generateTriangleData(geometry);
let triangleDataTexture = new THREE.DataTexture(
  triangleData,
  triangleCount,
  1,
  THREE.RGBAFormat,
  THREE.FloatType
);
triangleDataTexture.needsUpdate = true;

// Material
const material = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  uniforms: {
    uMouse: { value: mouseWorld },
    uTime: { value: 0 },
    uRadius: { value: 1.5 },
    uTriangleCount: { value: triangleCount },
    uData: { value: triangleDataTexture },
    uVideo: { value: videoTexture },
    uColor: { value: getMoodColor("happy") },
  },
  vertexShader: `
    uniform vec3 uMouse;
    uniform float uRadius;
    uniform sampler2D uData;
    uniform float uTriangleCount;
    uniform float uTime;
    varying vec3 vNormal;
    varying float vFresnel;
    varying vec2 vUv;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      float triID = floor(float(gl_VertexID) / 3.0);
      vec4 tri = texture2D(uData, vec2(triID / uTriangleCount, 0.0));
      vec3 center = tri.xyz;
      float d = distance(center, uMouse);
      float f = 1.0 - smoothstep(0.0, uRadius, d);
      f = pow(f, 1.0);
      vec3 displaced = position + normal * f * 0.8;
      vec3 eyeVec = normalize((modelViewMatrix * vec4(displaced, 1.0)).xyz);
      vFresnel = pow(1.0 - dot(vNormal, eyeVec), 3.0);
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `,
  fragmentShader: `
    varying float vFresnel;
    varying vec2 vUv;
    uniform sampler2D uVideo;
    uniform vec3 uColor;
    void main() {
      vec3 reflection = texture2D(uVideo, vUv).rgb;
      vec3 finalColor = mix(uColor, reflection, vFresnel);
      float alpha = smoothstep(0.0, 1.0, vFresnel) * 0.35;
      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
});

const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(-0.8, -0.2, 0);
scene.add(mesh);

// Agua
const waterGeo = new THREE.PlaneGeometry(6, 6);
const waterMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  uniforms: { uTime: { value: 0.0 } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);
      float ripple = sin(40.0 * dist - uTime * 2.0);
      float fade = exp(-5.0 * dist);
      float alpha = ripple * fade * 0.25;
      vec3 color = vec3(0.5, 0.9, 1.0);
      gl_FragColor = vec4(color, alpha);
    }
  `,
});
const water = new THREE.Mesh(waterGeo, waterMat);
water.rotation.x = -Math.PI / 2;
water.position.y = -1.9;
water.position.x = -0.859;
scene.add(water);

// Luz
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(5, 5, 5);
scene.add(dir);

// Mouse
window.addEventListener("mousemove", (event) => {
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = -(event.clientY / window.innerHeight) * 2 + 1;
  mouse.set(x, y);
  const vec = new THREE.Vector3(mouse.x, mouse.y, 0.8).unproject(camera);
  const dir = vec.sub(camera.position).normalize();
  const dist = camera.position.length();
  mouseWorld.copy(camera.position).add(dir.multiplyScalar(dist));
});

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animación
let lastMood = "";

function animate() {
  requestAnimationFrame(animate);
  material.uniforms.uTime.value += 0.01;
  waterMat.uniforms.uTime.value += 0.01;
  material.uniforms.uMouse.value.copy(mouseWorld);

  if (window.currentMood && window.currentMood !== lastMood) {
    lastMood = window.currentMood;

    material.uniforms.uColor.value = getMoodColor(lastMood);
    const newGeometry = getGeometryByMood(lastMood);
    mesh.geometry.dispose();
    mesh.geometry = newGeometry;

    const { triangleData, triangleCount } = generateTriangleData(newGeometry);
    const newTexture = new THREE.DataTexture(
      triangleData,
      triangleCount,
      1,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    newTexture.needsUpdate = true;
    material.uniforms.uData.value = newTexture;
    material.uniforms.uTriangleCount.value = triangleCount;
  }

  renderer.render(scene, camera);
}
animate();
