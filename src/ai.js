import { Entity } from "./entity.js";
import { Actor } from "./actor.js";
import * as YUKA from "yuka";
let once = 1;
function sync(vehicle, actor) {
  actor.body.velocity.lerp(vehicle.velocity, 1, actor.body.velocity);
  vehicle.velocity.copy(actor.body.velocity);
  vehicle.position.copy(actor.body.position);
  actor.body.quaternion.copy(vehicle.rotation);
  if (once) console.log(vehicle.rotation);
  once = 0;
}

export class Ai extends Entity {
  constructor(options) {
    super(options);
    const THREE = this.THREE;
    const vehicleGeometry = new THREE.ConeBufferGeometry(0.1, 0.5, 8);
    vehicleGeometry.rotateX(Math.PI * 0.5);
    const vehicleMaterial = new THREE.MeshNormalMaterial();
    const alignmentBehavior = new YUKA.AlignmentBehavior();
    const cohesionBehavior = new YUKA.CohesionBehavior();
    const separationBehavior = new YUKA.SeparationBehavior();
    this.actor = new Actor({
      THREE: this.THREE,
      CANNON: this.CANNON,
      map: this.map,
      shapeType: "cone",
      ai: this,
      lifespan: undefined,
      velocity: undefined,
      position: options.position,
      mass: 1,
      bodySettings: { fixedRotation: true, material: "playerMaterial" },
      collisionFilterGroup: 4,
      collisionFilterMask: 3
    });
    this.actor.body.fixedRotation = true;
    const params = {
      alignment: 0,
      cohesion: 0.2,
      separation: 2
    };
    alignmentBehavior.weight = params.alignment;
    cohesionBehavior.weight = params.cohesion;
    separationBehavior.weight = params.separation;

    const vehicle = new YUKA.Vehicle();
    this.vehicle = vehicle;
    vehicle.maxSpeed = 1.5;
    vehicle.updateNeighborhood = true;
    vehicle.neighborhoodRadius = 10;
    vehicle.boundingRadius = 3;
    vehicle.smoother = new YUKA.Smoother(20);

    vehicle.setRenderComponent(this.actor, sync);

    vehicle.steering.add(alignmentBehavior);
    vehicle.steering.add(cohesionBehavior);
    vehicle.steering.add(separationBehavior);
    /*
    const fleeBehavior = new YUKA.FleeBehavior(
      this.map.player.bodyActor.mesh.position
    );
    fleeBehavior.weight = 0.1;
    vehicle.steering.add(fleeBehavior);*/

    const seekBehavior = new YUKA.SeekBehavior(
      this.map.player.bodyActor.mesh.position
    );

    vehicle.steering.add(seekBehavior);

    /*
    const pursuitBehavior = new YUKA.OffsetPursuitBehavior(
      this.map.player.vehicle,
      0
    );
    pursuitBehavior.weight = 1;
    vehicle.steering.add(pursuitBehavior);*/

    const wanderBehavior = new YUKA.WanderBehavior();
    wanderBehavior.weight = 0.1;
    //vehicle.steering.add(wanderBehavior);

    const obstacleAvoidanceBehavior = new YUKA.ObstacleAvoidanceBehavior(
      this.map.obstacles
    );

    obstacleAvoidanceBehavior.weight = 1;
    vehicle.steering.add(obstacleAvoidanceBehavior);

    const vision = new YUKA.Vision(vehicle);
    vision.range = 5;
    vision.fieldOfView = Math.PI * 0.1; //* 0.5;
    vision.addObstacle(this.map.obstacles);
    vehicle.vision = vision;

    const helper = this.createVisionHelper(vision);
    this.actor.mesh.add(helper);

    this.map.aiManager.add(vehicle);
    this.map.ais.push(this);
  }

  update(dt) {
    this.actor.body.applyLocalImpulse(
      new this.CANNON.Vec3(0, 3.75 * dt, 0),
      new this.CANNON.Vec3(0, 0, 0)
    );
  }

  kill() {
    this.map.aiManager.remove(this.vehicle);
  }

  createVisionHelper(vision, division = 8) {
    const THREE = this.THREE;
    const fieldOfView = vision.fieldOfView;
    const range = vision.range;

    const geometry = new THREE.BufferGeometry();
    const material = new THREE.MeshBasicMaterial({ wireframe: true });

    const mesh = new THREE.Mesh(geometry, material);

    const positions = [];

    const foV05 = fieldOfView / 2;
    const step = fieldOfView / division;

    // for now, let's create a simple helper that lies in the xz plane

    for (let i = -foV05; i < foV05; i += step) {
      positions.push(0, 0, 0);
      positions.push(Math.sin(i) * range, 0, Math.cos(i) * range);
      positions.push(Math.sin(i + step) * range, 0, Math.cos(i + step) * range);
    }

    geometry.addAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    return mesh;
  }
}
