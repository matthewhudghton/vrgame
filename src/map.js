import { Actor } from "./actor";
import * as YUKA from "yuka";

export class Map {
  constructor(options) {
    this.THREE = options.THREE;
    this.CANNON = options.CANNON;
    this.scene = options.scene;
    this.world = options.world;
    const THREE = this.THREE;
    const scene = this.scene;
    const world = this.world;
    const CANNON = this.CANNON;

    this.actors = [];
    this.aiManager = new YUKA.EntityManager();
    this.obstacles = [];
    this.ais = [];

    let floorGeometry = new THREE.PlaneGeometry(300, 300, 50, 50);
    floorGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    let material = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });

    const floorMesh = new THREE.Mesh(floorGeometry, material);
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // add a floor
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({
      mass: 0,
      collisionFilterGroup: 1,
      collisionFilterMask: 0xffff,
      position: new CANNON.Vec3(-5, 0, 0)
    });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    floorMesh.position.copy(groundBody.position);
    world.addBody(groundBody);
  }

  addActor(actor, ghost) {
    if (!ghost) {
      this.scene.add(actor.mesh);
      this.world.addBody(actor.body);
    }
    this.actors.push(actor);
  }

  update(dt) {
    // guard against bug in cannon where 0 time cause error
    if (dt <= 0) {
      return;
    }

    this.world.step(dt);
    this.aiManager.update(dt);
    this.ais.forEach((ai) => {
      ai.update(dt);
    });
    /* Delete any actor marked as should remove */
    const actors = this.actors;
    let i = actors.length;
    while (i--) {
      const actor = actors[i];
      // Step the physics world
      actor.update(dt);

      if (actor.shouldBeDeleted) {
        actor.delete();
        actors.splice(i, 1);
      }
    }
  }
}
