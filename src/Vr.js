import * as THREE from "three";
import { VRButton } from "./VRButton.js";
import { XRControllerModelFactory } from "./jsm/webxr/XRControllerModelFactory.js";
import { Hud } from "./hud.js";
import { InputManager } from "./inputManager.js";
import { Actor } from "./actor.js";
import { Player } from "./player.js";
import { Map } from "./map.js";
import * as CANNON from "cannon";
import { Ai } from "./ai.js";
import { Driver } from "./driver.js";

import { Mouse } from "./mouse.js";
import System, {
  Emitter,
  Rate,
  Span,
  Position,
  Mass,
  Radius,
  Life,
  Velocity,
  PointZone,
  SpriteRenderer,
  RadialVelocity,
  Vector3D,
  Alpha,
  Scale,
  Color
} from "three-nebula";

import "./styles.css";
import "./scene.js";

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let user = new THREE.Group();
let aiManager;
const radius = 0.08;

const relativeVelocity = new THREE.Vector3();

const clock = new THREE.Clock();
let hud;
let actors = [];
let player;
let map;

function appendDebug(text) {
  var node = document.createTextNode(text); // Create a text node
  document.getElementById("debugText").appendChild(node);
}

init();
animate();
let inputManager;

var world;

function initCannon() {
  world = new CANNON.World();
  world.gravity.set(0, -3.8, 0);
  //world.gravity.set(0, 0, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  // Materials
  var playerMaterial = new CANNON.Material("playerMaterial");

  // Adjust constraint equation parameters for ground/ground contact
  var playerMaterial_cm = new CANNON.ContactMaterial(
    playerMaterial,
    playerMaterial,
    {
      friction: 0,
      restitution: 0.3,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 3
    }
  );
  world.addContactMaterial(playerMaterial_cm);
}

function init() {
  initCannon();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 0, 1000);
  let light2 = new THREE.SpotLight(0xffffff, 0.2);
  light2.position.set(10, 30, 20);
  light2.target.position.set(0, 0, 0);
  if (true) {
    light2.castShadow = true;

    light2.shadowCameraNear = 20;
    light2.shadowCameraFar = 50; //camera.far;
    light2.shadowCameraFov = 40;

    light2.shadowMapBias = 0.1;
    light2.shadowMapDarkness = 0.7;
    light2.shadowMapWidth = 2 * 512;
    light2.shadowMapHeight = 2 * 512;

    //light.shadowCameraVisible = true;
    var mouse = new Mouse(THREE);
  }

  scene.add(light2);
  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );

  camera.position.set(0, 1.6, 3);
  user.add(camera);

  scene.add(user);

  //scene.add(new THREE.HemisphereLight(0x606060, 0x404040));

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.xr.enabled = true;
  renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(scene.fog.color, 1);
  map = new Map({ THREE, CANNON, scene, world });
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(VRButton.createButton(renderer));

  // controllers

  function onSelectStart() {
    this.userData.isSelecting = true;
  }

  function onSelectEnd() {
    this.userData.isSelecting = false;
  }

  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("selectstart", onSelectStart);
  controller1.addEventListener("selectend", onSelectEnd);

  controller1.addEventListener("connected", function (event) {});
  controller1.addEventListener("disconnected", function () {
    this.remove(this.children[0]);
  });
  user.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener("selectstart", onSelectStart);
  controller2.addEventListener("selectend", onSelectEnd);
  controller2.addEventListener("connected", function (event) {});
  controller2.addEventListener("disconnected", function () {
    this.remove(this.children[0]);
  });
  user.add(controller2);

  // The XRControllerModelFactory will automatically fetch controller models
  // that match what the user is holding as closely as possible. The models
  // should be attached to the object returned from getControllerGrip in
  // order to match the orientation of the held device.
  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  user.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  user.add(controllerGrip2);
  player = new Player({
    THREE: THREE,
    CANNON: CANNON,
    camera: camera,
    cameraGroup: user,
    map: map,
    leftControllerGrip: controllerGrip1,
    rightControllerGrip: controllerGrip2
  });
  map.player = player;

  for (let i = 0; i < 5; i++) {
    new Driver({
      THREE: THREE,
      CANNON: CANNON,
      camera: camera,
      cameraGroup: user,
      position: new CANNON.Vec3(-2 + i, 2 + i * 2, -1 - i),
      map: map,
      size: 1 + i
    });
  }

  //
  inputManager = new InputManager(
    THREE,
    CANNON,
    renderer.xr,
    camera,
    scene,
    user,
    player,
    controller1,
    controller2
  );

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}
let timePassedSinceLastBall = 0;

let controller1LastPosition = new THREE.Vector3(0, 0, 0);
let controller2LastPosition = new THREE.Vector3(0, 0, 0);

function render() {
  const dt = clock.getDelta();
  if (hud) {
    hud.render();
  }

  map.update(dt);
  player.update(dt);

  /* Track controller position with actor */
  const controller1 = inputManager.controller1;
  let three_position = new THREE.Vector3();

  controller1.getWorldPosition(three_position);

  let position = new CANNON.Vec3(
    three_position.x,
    three_position.y,
    three_position.z
  );

  player.rightHandPosition.copy(three_position);

  timePassedSinceLastBall += dt;
  const k = 0.1;
  if (controller1 && controller1.getVelocity) {
    appendDebug(JSON.stringify(controller1));
  }
  if (timePassedSinceLastBall > 0.2) {
    if (
      controller1 &&
      controller1.getVelocity &&
      (controller1.getVelocity.x > k ||
        controller1.getVelocity.y > k ||
        controller1.getVelocity.z > k) &&
      !three_position.equals(controller1LastPosition)
    ) {
      timePassedSinceLastBall = 0;
      actors.push(
        new Actor({
          THREE: THREE,
          CANNON: CANNON,
          map: map,
          lifeSpan: 10,
          position: position,
          velocity: controller1.getVelocity
        })
      );
      controller1LastPosition = three_position;
    }
    const controller2 = inputManager.controller2;
    controller2.getWorldPosition(three_position);
    position = new CANNON.Vec3(
      three_position.x,
      three_position.y,
      three_position.z
    );

    player.leftHandPosition.copy(three_position);

    if (
      controller2 &&
      controller1.getVelocity &&
      (controller2.getVelocity.x > k ||
        controller2.getVelocity.y > k ||
        controller2.getVelocity.z > k) &&
      !three_position.equals(controller2LastPosition)
    ) {
      timePassedSinceLastBall = 0;
      actors.push(
        new Actor({
          THREE: THREE,
          CANNON: CANNON,
          map: map,
          lifespan: 10,
          position: position,
          velocity: controller2.getVelocity
        })
      );
      controller2LastPosition = three_position;
    }
  }

  renderer.render(scene, camera);
  if (inputManager) {
    inputManager.update(dt, hud);
  }
}

export default function Vr() {
  return (
    <div className="Vr">
      <h1>Matts Test VR APP</h1>
      <p id="debugText"></p>
    </div>
  );
}
