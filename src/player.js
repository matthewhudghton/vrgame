import { Vector3 } from "three";
import { Actor } from "./actor.js";
import { Debouncer } from "./debouncer.js";
import { Entity } from "./entity.js";
import { Gun } from "./gun.js";
import { ParticleSystem } from "./particleSystem.js";
import { Sound } from "./sound.js";
import * as YUKA from "yuka";

export class Player extends Entity {
  leftHandPosition = new Vector3(0, 0, 0);
  rightHandPosition = new Vector3(0, 0, 0);
  cameraGroup;

  messages;
  //THREE, CANNON, camera, cameraGroup, map
  constructor(options) {
    super(options);
    this.cameraGroup = options.cameraGroup;
    this.camera = options.camera;
    this.THREE = options.THREE;
    this.listener = new this.THREE.AudioListener();
    this.camera.add(this.listener);
    this.vehicle = new YUKA.Vehicle();
    this.map.aiManager.add(this.vehicle);
    this.collisionFilterGroup = 2;
    this.collisionFilterMask = 5;
    let position = new this.CANNON.Vec3(0, 1, 0);
    this.bodyActor = new Actor({
      THREE: this.THREE,
      CANNON: this.CANNON,
      map: this.map,
      lifespan: undefined,
      position,
      velocity: undefined,
      rawShapeData: { size: 1 },
      noDie: true,
      mass: 1,
      bodySettings: { fixedRotation: true, material: "playerMaterial" },
      collisionFilterGroup: this.collisionFilterGroup,
      collisionFilterMask: this.collisionFilterMask
    });

    this.bodyActor.body.fixedRotation = true;
    this.bodyActor.body.linearDamping = 0.7;

    this.leftFireDebouncer = new Debouncer(1);
    this.rightFireDebouncer = new Debouncer(1);
    this.leftControllerGrip = options.leftControllerGrip;
    this.rightControllerGrip = options.rightControllerGrip;

    this.debouncers = [this.leftFireDebouncer, this.rightFireDebouncer];
    this.playerPos = undefined;
    this.messages = [];

    this.leftHandParticleSystem = new ParticleSystem({
      THREE: this.THREE,
      scene: this.scene,
      type: "left_hand",
      useLoaded: true
    });

    this.rightHandParticleSystem = new ParticleSystem({
      THREE: this.THREE,
      scene: this.scene,
      type: "right_hand",
      useLoaded: true
    });

    // add music
    this.music = new Sound({
      THREE: this.THREE,
      actor: this.bodyActor,
      player: this,
      name: "music01"
    });
  }

  updateAiTracking(dt) {
    const body = this.bodyActor.body;
    const vehicle = this.vehicle;
    vehicle.velocity.copy(body.velocity);
    vehicle.position.copy(body.position);
    vehicle.rotation.copy(body.quaternion);
  }

  update(dt) {
    const CANNON = this.CANNON;
    const k = 0.05;

    this.updateAiTracking(dt);

    this.leftHandParticleSystem.setPosition(this.leftHandPosition);

    this.rightHandParticleSystem.setPosition(this.rightHandPosition);
    this.leftHandParticleSystem.update(dt);
    this.rightHandParticleSystem.update(dt);

    this.debouncers.forEach((debouncer) => {
      debouncer.update(dt);
    });

    this.cameraGroup.position.x =
      this.cameraGroup.position.x * k +
      this.bodyActor.body.position.x * (1 - k);

    this.cameraGroup.position.y =
      this.cameraGroup.position.y * k +
      this.bodyActor.body.position.y * (1 - k);

    this.cameraGroup.position.z =
      this.cameraGroup.position.z * k +
      this.bodyActor.body.position.z * (1 - k);

    //this.bodyActor.body.quaternion.copy(this.camera.quaternion);
    /* this.bodyActor.body.quaternion.setFromAxisAngle(
      new CANNON.Vec3(0, 0, 0),
      -Math.PI / 2
    );*/

    this.handleMessages(this.messages);
    while (this.messages.pop()) {}
  }
  addMessage(message) {
    this.messages.push(message);
  }

  applyImpulseRelativeToController(speed) {
    const THREE = this.THREE;
    const CANNON = this.CANNON;
    let direction = new THREE.Vector3();
    direction.copy(this.leftControllerGrip.position);
    direction.y = direction.y - 1;
    direction.normalize();
    const force = new CANNON.Vec3(
      direction.x * speed,
      direction.y * speed,
      direction.z * speed
    );
    const pointOnBody = new CANNON.Vec3(0, 0, 0);
    this.bodyActor.body.applyImpulse(force, pointOnBody);
  }
  applyImpulseRelativeToCamera(speed) {
    const THREE = this.THREE;
    const CANNON = this.CANNON;
    let direction = new THREE.Vector3();

    direction.set(0, 0, 1);
    direction.unproject(this.camera);
    var ray = new THREE.Ray(
      this.camera.position,
      direction.sub(this.camera.position).normalize()
    );
    direction.copy(ray.direction);
    const force = new CANNON.Vec3(
      direction.x * speed,
      direction.y * speed,
      direction.z * speed
    );
    const pointOnBody = new CANNON.Vec3(0, 0, 0);
    this.bodyActor.body.applyImpulse(force, pointOnBody);
  }

  handleMessages(messages) {
    for (const message of messages) {
      /* Movement */
      if (message.forward) {
        this.applyImpulseRelativeToController(0.5);
      }
      if (message.backward) {
        this.applyImpulseRelativeToController(-0.5);
      }
      if (message.fire && this.rightFireDebouncer.tryFireAndReset()) {
        /* Fire */
      }
      if (message.magic) {
        switch (message.magic.shapeMatches[0].name) {
          case "square":
            new Actor({
              THREE: this.THREE,
              CANNON: this.CANNON,
              map: this.map,
              lifeSpan: undefined,
              rawShapeData: message.magic.shapeMatches[0],
              shapeType: "box",
              position: message.magic.position,
              velocity: this.bodyActor.body.velocity
            });
            break;
          case "circle":
            /*new Projectile({
              THREE: this.THREE,
              CANNON: this.CANNON,
              map: this.map,
              lifeSpan: undefined,
              rawShapeData: message.magic.shapeMatches[0],
              position: message.magic.position,
              bodySettings: {
                quaternion: message.magic.quaternion
              }
            });*/
            new Gun({
              THREE: this.THREE,
              CANNON: this.CANNON,
              map: this.map,
              lifeSpan: undefined,
              rawShapeData: message.magic.shapeMatches[0],
              position: message.magic.position,
              bodySettings: {
                quaternion: message.magic.quaternion
              },
              attachedTo: message.magic.attachedTo,
              collisionFilterGroup: this.collisionFilterGroup,
              collisionFilterMask: this.collisionFilterMask,
              reverseProjectile: true
            });

            break;
          default:
            console.error("No match found");
        }
      }
    }
  }

  get shouldBeDeleted() {
    return false;
  }
}
