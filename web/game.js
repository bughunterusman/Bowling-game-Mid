// ==========================================
// 🎳 Bowling Game Mid - 3D Web Edition
// Powered by Three.js & Cannon.js
// ==========================================

(function () {
  'use strict';

  // --- Audio Setup ---
  const AudioEngine = {
    enabled: true,
    rollAudio: new Audio('audio/bowling1.wav'),
    strikeAudio: new Audio('audio/bowling2.wav'),
    init() {
      this.rollAudio.preload = 'auto';
      this.strikeAudio.preload = 'auto';
      this.rollAudio.volume = 0.7;
      this.strikeAudio.volume = 0.9;
    },
    playRoll() {
      if (!this.enabled) return;
      try {
        this.rollAudio.currentTime = 0;
        this.rollAudio.play().catch(() => {});
      } catch (e) {}
    },
    playStrike() {
      if (!this.enabled) return;
      try {
        this.strikeAudio.currentTime = 0;
        this.strikeAudio.play().catch(() => {});
      } catch (e) {}
    },
    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }
  };
  AudioEngine.init();

  // --- Game State ---
  const GameState = {
    frame: 1,
    maxFrames: 10,
    rollInFrame: 1,
    score: 0,
    strikes: 0,
    highScore: parseInt(localStorage.getItem('bowling_mid_highscore') || '0', 10),
    ballState: 'ready', // 'ready', 'rolling', 'settled'
    cameraMode: 'chaser', // 'chaser', 'broadcast', 'overhead'
    framesData: Array.from({ length: 10 }, () => ({ rolls: [], score: null })),
    
    saveHighScore() {
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('bowling_mid_highscore', this.highScore.toString());
      }
    }
  };

  // --- Dimensions & Geometry Constants ---
  const LANE_WIDTH = 2.6;
  const LANE_LENGTH = 28;
  const GUTTER_WIDTH = 0.45;
  const PIN_SPACING = 0.42;
  const PIN_HEAD_Z = -10;
  const BALL_START_Z = 7.5;
  const BALL_RADIUS = 0.22;
  const PIN_HEIGHT = 0.78;
  const PIN_RADIUS = 0.12;

  // --- Three.js & Cannon.js Setup ---
  let scene, camera, renderer;
  let world;
  let ballMesh, ballBody;
  let pins = []; // array of { mesh, body, initialPos, initialRot, isDown }
  let gutters = [];
  let aimPositionX = 0;
  let aimArrowMesh;

  // DOM Elements
  const container = document.getElementById('game-container');
  const hudFrame = document.getElementById('hud-frame');
  const hudScore = document.getElementById('hud-score');
  const hudHighScore = document.getElementById('hud-highscore');
  const aimSlider = document.getElementById('aim-slider');
  const btnBowl = document.getElementById('btn-bowl');
  const btnNext = document.getElementById('btn-next');
  const btnSound = document.getElementById('btn-sound');
  const btnCam = document.getElementById('btn-cam');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const banner = document.getElementById('banner');
  const bannerText = document.getElementById('banner-text');
  const scorecard = document.getElementById('scorecard');
  const modal = document.getElementById('game-over-modal');
  const finalScoreEl = document.getElementById('final-score');
  const finalStrikesEl = document.getElementById('final-strikes');
  const finalHighScoreEl = document.getElementById('final-highscore');
  const btnPlayAgain = document.getElementById('btn-play-again');

  // Materials for physics
  let laneContactMaterial, pinContactMaterial, ballContactMaterial;

  function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.022);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2.4, BALL_START_Z + 4.2);
    camera.lookAt(0, 0.6, PIN_HEAD_Z);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfff4e6, 1.2);
    dirLight.position.set(5, 12, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 45;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 16;
    dirLight.shadow.camera.bottom = -16;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Pin deck spotlight
    const pinSpot = new THREE.SpotLight(0x38bdf8, 2.5, 20, Math.PI / 4, 0.5, 1);
    pinSpot.position.set(0, 6, PIN_HEAD_Z);
    pinSpot.target.position.set(0, 0, PIN_HEAD_Z - 1);
    scene.add(pinSpot);
    scene.add(pinSpot.target);

    // Blue accent rim light
    const rimLight = new THREE.PointLight(0x0284c7, 1.5, 25);
    rimLight.position.set(0, 2, -18);
    scene.add(rimLight);

    window.addEventListener('resize', onWindowResize);
  }

  function initCannon() {
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 12;

    const defaultMaterial = new CANNON.Material('default');
    const ballMaterial = new CANNON.Material('ball');
    const pinMaterial = new CANNON.Material('pin');
    const laneMaterial = new CANNON.Material('lane');

    ballContactMaterial = new CANNON.ContactMaterial(ballMaterial, laneMaterial, {
      friction: 0.05,
      restitution: 0.25
    });
    pinContactMaterial = new CANNON.ContactMaterial(pinMaterial, laneMaterial, {
      friction: 0.25,
      restitution: 0.2
    });
    const ballPinContact = new CANNON.ContactMaterial(ballMaterial, pinMaterial, {
      friction: 0.15,
      restitution: 0.75
    });
    const pinPinContact = new CANNON.ContactMaterial(pinMaterial, pinMaterial, {
      friction: 0.2,
      restitution: 0.65
    });

    world.addContactMaterial(ballContactMaterial);
    world.addContactMaterial(pinContactMaterial);
    world.addContactMaterial(ballPinContact);
    world.addContactMaterial(pinPinContact);
  }

  // --- Environment & Lane Building ---
  function buildAlley() {
    // 1. Wood Lane Texture Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    
    // Base wood gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#c2884a');
    grad.addColorStop(0.5, '#deb887');
    grad.addColorStop(1, '#c2884a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 2048);

    // Planks & grain
    ctx.strokeStyle = 'rgba(120, 60, 20, 0.35)';
    ctx.lineWidth = 1;
    const plankWidth = 512 / 16;
    for (let x = 0; x <= 512; x += plankWidth) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 2048);
      ctx.stroke();
    }

    // Lane targeting arrows
    ctx.fillStyle = '#642f0a';
    const arrowY = 1200;
    const arrowPositions = [0.2, 0.35, 0.5, 0.65, 0.8];
    arrowPositions.forEach(p => {
      const ax = p * 512;
      ctx.beginPath();
      ctx.moveTo(ax, arrowY);
      ctx.lineTo(ax - 8, arrowY + 28);
      ctx.lineTo(ax + 8, arrowY + 28);
      ctx.closePath();
      ctx.fill();
    });

    const laneTex = new THREE.CanvasTexture(canvas);
    laneTex.wrapS = THREE.ClampToEdgeWrapping;
    laneTex.wrapT = THREE.RepeatWrapping;

    // Lane Mesh
    const laneGeo = new THREE.BoxGeometry(LANE_WIDTH, 0.2, LANE_LENGTH);
    const laneMat = new THREE.MeshStandardMaterial({
      map: laneTex,
      roughness: 0.15,
      metalness: 0.05,
    });
    const laneMesh = new THREE.Mesh(laneGeo, laneMat);
    laneMesh.position.set(0, -0.1, -2);
    laneMesh.receiveShadow = true;
    scene.add(laneMesh);

    // Lane Physics Body
    const laneBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, -0.1, -2),
      shape: new CANNON.Box(new CANNON.Vec3(LANE_WIDTH / 2, 0.1, LANE_LENGTH / 2))
    });
    world.addBody(laneBody);

    // Gutters (Left & Right)
    const gutterGeo = new THREE.BoxGeometry(GUTTER_WIDTH, 0.15, LANE_LENGTH);
    const gutterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });

    [-1, 1].forEach(side => {
      const gx = side * (LANE_WIDTH / 2 + GUTTER_WIDTH / 2);
      const gutterMesh = new THREE.Mesh(gutterGeo, gutterMat);
      gutterMesh.position.set(gx, -0.16, -2);
      gutterMesh.receiveShadow = true;
      scene.add(gutterMesh);

      const gutterBody = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(gx, -0.16, -2),
        shape: new CANNON.Box(new CANNON.Vec3(GUTTER_WIDTH / 2, 0.075, LANE_LENGTH / 2))
      });
      world.addBody(gutterBody);
    });

    // Side Borders / Ball Return Gutters
    const borderGeo = new THREE.BoxGeometry(0.3, 0.5, LANE_LENGTH);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    [-1, 1].forEach(side => {
      const bx = side * (LANE_WIDTH / 2 + GUTTER_WIDTH + 0.15);
      const borderMesh = new THREE.Mesh(borderGeo, borderMat);
      borderMesh.position.set(bx, 0.1, -2);
      borderMesh.castShadow = true;
      scene.add(borderMesh);

      const borderBody = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(bx, 0.1, -2),
        shape: new CANNON.Box(new CANNON.Vec3(0.15, 0.25, LANE_LENGTH / 2))
      });
      world.addBody(borderBody);
    });

    // Back Pit Cushion (Stops the ball)
    const pitGeo = new THREE.BoxGeometry(LANE_WIDTH + 2, 1.8, 1);
    const pitMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.9 });
    const pitMesh = new THREE.Mesh(pitGeo, pitMat);
    pitMesh.position.set(0, 0.8, -LANE_LENGTH / 2 - 2);
    scene.add(pitMesh);

    const pitBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, 0.8, -LANE_LENGTH / 2 - 2),
      shape: new CANNON.Box(new CANNON.Vec3((LANE_WIDTH + 2) / 2, 0.9, 0.5))
    });
    world.addBody(pitBody);

    // Aim Indicator Line
    const arrowGeo = new THREE.ConeGeometry(0.12, 0.5, 16);
    arrowGeo.rotateX(Math.PI / 2);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
    aimArrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    aimArrowMesh.position.set(0, 0.05, BALL_START_Z - 1.2);
    scene.add(aimArrowMesh);
  }

  // --- Bowling Pin Generation ---
  function createPinMesh() {
    const group = new THREE.Group();

    // Body profiles
    const points = [];
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(0.08, 0.02));
    points.push(new THREE.Vector2(0.12, 0.15));
    points.push(new THREE.Vector2(0.11, 0.32));
    points.push(new THREE.Vector2(0.06, 0.52)); // neck
    points.push(new THREE.Vector2(0.085, 0.68)); // head
    points.push(new THREE.Vector2(0.075, 0.76));
    points.push(new THREE.Vector2(0, 0.78));

    const pinGeo = new THREE.LatheGeometry(points, 24);
    pinGeo.computeVertexNormals();

    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.15,
      metalness: 0.05
    });

    const body = new THREE.Mesh(pinGeo, pinMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Red Neck Stripes
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xd92626 });
    const stripeGeo1 = new THREE.CylinderGeometry(0.063, 0.063, 0.028, 24, 1, true);
    const stripe1 = new THREE.Mesh(stripeGeo1, stripeMat);
    stripe1.position.y = 0.53;
    group.add(stripe1);

    const stripeGeo2 = new THREE.CylinderGeometry(0.066, 0.066, 0.028, 24, 1, true);
    const stripe2 = new THREE.Mesh(stripeGeo2, stripeMat);
    stripe2.position.y = 0.57;
    group.add(stripe2);

    return group;
  }

  function spawnPins() {
    pins.forEach(p => {
      scene.remove(p.mesh);
      world.remove(p.body);
    });
    pins = [];

    // Standard 10-pin triangle layout
    const pinRows = [
      [0], // Pin 1 (Headpin)
      [-0.5, 0.5], // Pins 2, 3
      [-1, 0, 1], // Pins 4, 5, 6
      [-1.5, -0.5, 0.5, 1.5] // Pins 7, 8, 9, 10
    ];

    let pinIdx = 1;
    pinRows.forEach((row, rowIdx) => {
      const z = PIN_HEAD_Z - rowIdx * (PIN_SPACING * 1.7);
      row.forEach(xOffset => {
        const x = xOffset * PIN_SPACING;
        const mesh = createPinMesh();
        mesh.position.set(x, 0, z);
        scene.add(mesh);

        // Cannon body: composite cylinder for realistic bowling physics
        const body = new CANNON.Body({
          mass: 1.5,
          position: new CANNON.Vec3(x, PIN_HEIGHT / 2, z),
          linearDamping: 0.05,
          angularDamping: 0.05
        });

        // Use cylinder shape
        const cylinderShape = new CANNON.Cylinder(PIN_RADIUS, PIN_RADIUS * 0.9, PIN_HEIGHT, 16);
        body.addShape(cylinderShape);

        // Sound listener on first contact
        body.addEventListener('collide', e => {
          if (e.body === ballBody || e.body.shapes[0] instanceof CANNON.Cylinder) {
            AudioEngine.playStrike();
          }
        });

        world.addBody(body);

        pins.push({
          id: pinIdx++,
          mesh,
          body,
          initialPos: new CANNON.Vec3(x, PIN_HEIGHT / 2, z),
          isDown: false
        });
      });
    });
  }

  // --- Bowling Ball Generation ---
  function initBall() {
    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    
    // Rich glossy marble texture
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.1,
      metalness: 0.2
    });

    ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = true;
    ballMesh.receiveShadow = true;
    scene.add(ballMesh);

    // Finger holes (visual details)
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const holeGeo = new THREE.CircleGeometry(0.024, 16);
    [
      { x: 0, y: 0.14, z: 0.17 },
      { x: -0.04, y: 0.09, z: 0.19 },
      { x: 0.04, y: 0.09, z: 0.19 }
    ].forEach(h => {
      const hole = new THREE.Mesh(holeGeo, holeMat);
      hole.position.set(h.x, h.y, h.z);
      hole.lookAt(h.x * 2, h.y * 2, h.z * 2);
      ballMesh.add(hole);
    });

    // Try loading custom GLTF bowling ball if available
    if (typeof THREE.GLTFLoader !== 'undefined') {
      const loader = new THREE.GLTFLoader();
      loader.load('models/bowling_ball.glb', gltf => {
        const loadedModel = gltf.scene;
        loadedModel.scale.set(0.22, 0.22, 0.22);
        loadedModel.traverse(c => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        ballMesh.geometry.dispose();
        ballMesh.children.slice().forEach(c => ballMesh.remove(c));
        ballMesh.add(loadedModel);
      }, undefined, () => {});
    }

    ballBody = new CANNON.Body({
      mass: 5.4,
      position: new CANNON.Vec3(0, BALL_RADIUS, BALL_START_Z),
      shape: new CANNON.Sphere(BALL_RADIUS),
      linearDamping: 0.01,
      angularDamping: 0.01
    });

    world.addBody(ballBody);
    resetBallPosition();
  }

  function resetBallPosition() {
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);
    ballBody.position.set(aimPositionX, BALL_RADIUS, BALL_START_Z);
    ballBody.quaternion.set(0, 0, 0, 1);

    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion);

    aimArrowMesh.position.x = aimPositionX;
    aimArrowMesh.visible = true;

    GameState.ballState = 'ready';
    btnBowl.classList.remove('hidden');
    btnNext.classList.add('hidden');
  }

  // --- Bowl Throw Execution ---
  function bowl() {
    if (GameState.ballState !== 'ready') return;
    GameState.ballState = 'rolling';

    aimArrowMesh.visible = false;
    btnBowl.classList.add('hidden');

    AudioEngine.playRoll();

    // Forward force matching Unity's 4000 force ratio
    const forwardSpeed = -22.5;
    const spinSpeed = (aimPositionX * 1.5); // subtle hook/curve toward center

    ballBody.velocity.set(spinSpeed * 0.4, 0, forwardSpeed);
    ballBody.angularVelocity.set(-forwardSpeed / BALL_RADIUS, 0, spinSpeed * 2);

    // Timeout to evaluate roll once ball reaches pit
    setTimeout(() => {
      if (GameState.ballState === 'rolling') {
        endRoll();
      }
    }, 4200);
  }

  function endRoll() {
    GameState.ballState = 'settled';

    // Count pins tilted > 5 degrees (exact algorithm from GameManager.cs)
    let fallenThisRoll = 0;
    const upVector = new CANNON.Vec3(0, 1, 0);

    pins.forEach(pin => {
      if (!pin.isDown) {
        const pinUp = pin.body.quaternion.vmult(upVector);
        const dot = pinUp.dot(upVector);
        // Angle in degrees: acos(dot)
        const angleDeg = Math.acos(Math.min(Math.max(dot, -1), 1)) * (180 / Math.PI);
        if (angleDeg > 5 || pin.body.position.y < -0.2) {
          pin.isDown = true;
          fallenThisRoll++;
          // Fade/hide down pin
          pin.mesh.visible = false;
          pin.body.position.set(0, -100, 0);
        }
      }
    });

    // Update scoreboard
    GameState.score += fallenThisRoll;
    GameState.saveHighScore();
    updateHUD();

    // Check Strike / Spare / Gutter
    if (fallenThisRoll === 10 && GameState.rollInFrame === 1) {
      GameState.strikes++;
      showBanner('STRIKE!! 🎳', '#fbbf24');
    } else if (fallenThisRoll === 10 || (fallenThisRoll > 0 && pins.every(p => p.isDown))) {
      showBanner('SPARE! 🎯', '#38bdf8');
    } else if (fallenThisRoll === 0) {
      showBanner('GUTTER BALL! 😅', '#94a3b8');
    } else {
      showBanner(`+${fallenThisRoll} PINS!`, '#4ade80');
    }

    btnNext.classList.remove('hidden');
  }

  function nextTurn() {
    if (GameState.ballState !== 'settled') return;

    if (GameState.rollInFrame === 1 && !pins.every(p => p.isDown)) {
      // Second roll in current frame
      GameState.rollInFrame = 2;
    } else {
      // Advance to next frame
      GameState.frame++;
      GameState.rollInFrame = 1;
      spawnPins(); // Reset all 10 pins for new frame
    }

    if (GameState.frame > GameState.maxFrames) {
      finishGame();
      return;
    }

    resetBallPosition();
    updateHUD();
  }

  function showBanner(text, color) {
    bannerText.innerText = text;
    bannerText.style.color = color || '#fbbf24';
    banner.classList.remove('hidden');
    setTimeout(() => {
      banner.classList.add('hidden');
    }, 2200);
  }

  function updateHUD() {
    hudFrame.innerText = `${Math.min(GameState.frame, 10)} / 10`;
    hudScore.innerText = GameState.score;
    hudHighScore.innerText = GameState.highScore;
    buildScorecardUI();
  }

  function buildScorecardUI() {
    scorecard.innerHTML = '';
    for (let f = 1; f <= 10; f++) {
      const cell = document.createElement('div');
      cell.className = `frame-cell ${f === GameState.frame ? 'active' : ''}`;
      cell.innerHTML = `
        <div class="frame-head">${f}</div>
        <div class="frame-rolls">
          <div class="roll-sub">${f < GameState.frame ? '✓' : ''}</div>
          <div class="roll-sub">${f < GameState.frame ? '' : ''}</div>
        </div>
        <div class="frame-total">${f === GameState.frame ? GameState.score : (f < GameState.frame ? '-' : '')}</div>
      `;
      scorecard.appendChild(cell);
    }
  }

  function finishGame() {
    GameState.saveHighScore();
    finalScoreEl.innerText = GameState.score;
    finalStrikesEl.innerText = GameState.strikes;
    finalHighScoreEl.innerText = GameState.highScore;
    modal.classList.remove('hidden');
  }

  function restartGame() {
    GameState.frame = 1;
    GameState.rollInFrame = 1;
    GameState.score = 0;
    GameState.strikes = 0;
    modal.classList.add('hidden');
    spawnPins();
    resetBallPosition();
    updateHUD();
  }

  // --- Controls & Listeners ---
  function setupInputs() {
    // Slider Aiming
    aimSlider.addEventListener('input', e => {
      if (GameState.ballState !== 'ready') return;
      aimPositionX = parseFloat(e.target.value);
      ballBody.position.x = aimPositionX;
      ballMesh.position.x = aimPositionX;
      aimArrowMesh.position.x = aimPositionX;
    });

    document.getElementById('btn-move-left').addEventListener('click', () => {
      if (GameState.ballState !== 'ready') return;
      aimPositionX = Math.max(-1.1, aimPositionX - 0.1);
      aimSlider.value = aimPositionX;
      ballBody.position.x = aimPositionX;
      aimArrowMesh.position.x = aimPositionX;
    });

    document.getElementById('btn-move-right').addEventListener('click', () => {
      if (GameState.ballState !== 'ready') return;
      aimPositionX = Math.min(1.1, aimPositionX + 0.1);
      aimSlider.value = aimPositionX;
      ballBody.position.x = aimPositionX;
      aimArrowMesh.position.x = aimPositionX;
    });

    btnBowl.addEventListener('click', bowl);
    btnNext.addEventListener('click', nextTurn);
    btnPlayAgain.addEventListener('click', restartGame);

    // Keyboard Shortcuts
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        if (GameState.ballState === 'ready') {
          aimPositionX = Math.max(-1.1, aimPositionX - 0.08);
          aimSlider.value = aimPositionX;
          ballBody.position.x = aimPositionX;
          aimArrowMesh.position.x = aimPositionX;
        }
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        if (GameState.ballState === 'ready') {
          aimPositionX = Math.min(1.1, aimPositionX + 0.08);
          aimSlider.value = aimPositionX;
          ballBody.position.x = aimPositionX;
          aimArrowMesh.position.x = aimPositionX;
        }
      } else if (e.code === 'Enter') {
        if (GameState.ballState === 'ready') bowl();
      } else if (e.code === 'Space') {
        if (GameState.ballState === 'settled') nextTurn();
      }
    });

    // Sound toggle
    btnSound.addEventListener('click', () => {
      const on = AudioEngine.toggle();
      btnSound.innerText = on ? '🔊' : '🔇';
    });

    // Camera mode toggle
    btnCam.addEventListener('click', () => {
      GameState.cameraMode = GameState.cameraMode === 'chaser' ? 'overhead' : 'chaser';
    });

    // Fullscreen
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // --- Animation & Physics Loop ---
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);

    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // Step physics
    world.step(1 / 60, delta, 3);

    // Sync Ball Mesh
    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion);

    // Sync Pin Meshes
    pins.forEach(pin => {
      if (!pin.isDown) {
        pin.mesh.position.copy(pin.body.position);
        pin.mesh.quaternion.copy(pin.body.quaternion);
      }
    });

    // Camera Follow Logic
    if (GameState.cameraMode === 'chaser') {
      if (GameState.ballState === 'rolling') {
        // Track ball smoothly
        const targetCamZ = ballBody.position.z + 3.8;
        const targetCamX = ballBody.position.x * 0.5;
        camera.position.z += (targetCamZ - camera.position.z) * 0.1;
        camera.position.x += (targetCamX - camera.position.x) * 0.1;
        camera.position.y += (1.8 - camera.position.y) * 0.1;
        camera.lookAt(ballBody.position.x * 0.3, 0.4, ballBody.position.z - 3);
      } else {
        // Return to foul line ready view
        const baseZ = BALL_START_Z + 4.2;
        camera.position.z += (baseZ - camera.position.z) * 0.08;
        camera.position.x += (aimPositionX * 0.3 - camera.position.x) * 0.08;
        camera.position.y += (2.4 - camera.position.y) * 0.08;
        camera.lookAt(aimPositionX * 0.2, 0.6, PIN_HEAD_Z);
      }
    } else {
      // Overhead view
      camera.position.set(0, 11, -2);
      camera.lookAt(0, 0, -8);
    }

    renderer.render(scene, camera);
  }

  // --- Initial Launch ---
  initThree();
  initCannon();
  buildAlley();
  spawnPins();
  initBall();
  setupInputs();
  updateHUD();
  animate(performance.now());

})();
