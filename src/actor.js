import { Entity } from "./entity.js";

export class Actor extends Entity {
  constructor(options) {
    super(options);

    this.lifeSpan = options.lifeSpan;
    this.attachedTo = options.attachedTo ?? undefined;
    this.particleSystems = [];
    this.debouncers = [];
    this.lights = [];
    this.sounds = [];
    this.rawShapeData = options.rawShapeData ?? {
      width: 0.15,
      height: 0.15,
      size: 0.1
    };
    this.noDie = options.noDie ?? false;
    this.size = this.rawShapeData.size / 2;
    this.width = this.rawShapeData.width;
    this.height = this.rawShapeData.height;
    this.color = options.color;
    this.invisible = options.invisible ?? false;
    this.ai = options.ai;
    this.initShape(options);

    if (options.velocity) {
      this.body.velocity.copy(options.velocity);
    } else {
      this.body.angularVelocity.set(0, 0, 0);
    }
    this.body.linearDamping = 0.05;
    this.body.angularDamping = 0.5;

    if (options.position) {
      this.body.position.copy(options.position);
    } else {
      this.body.position.set(
        Math.random() * 4 - 2,
        Math.random() * 4,
        Math.random() * 4 - 2
      );
    }

    this.map.addActor(this, options.ghost);

    if (this.collideEvent) {
      this.body.addEventListener("collide", this.collideEvent);
    }
    this.body.userData = { actor: this };

    this.collisionFilterGroup = options.collisionFilterGroup ?? 1;
    this.collisionFilterMask = options.collisionFilterMask ?? 0xffff;
    this.body.collisionFilterGroup = this.collisionFilterGroup;
    this.body.collisionFilterMask = this.collisionFilterMask;
  }

  initShape(options) {
    const THREE = this.THREE;
    const CANNON = this.CANNON;
    let geometry;
    const invisible = this.invisible;
    switch (options.shapeType) {
      case "box":
        if (!invisible) {
          geometry = new THREE.BoxGeometry(this.width, this.height, this.width);
        }
        this.shape = new CANNON.Box(
          new CANNON.Vec3(this.width / 2, this.height / 2, this.width / 2)
        );
        break;
      case "cone":
        geometry = new THREE.ConeBufferGeometry(this.width, this.height, 6);
        geometry.rotateX(Math.PI * 0.5);
        this.shape = new CANNON.Box(
          new CANNON.Vec3(this.width / 2, this.height / 2, this.width / 2)
        );
        break;
      case "sphere":
      default:
        if (!invisible) {
          geometry = new THREE.IcosahedronGeometry(this.size, 3);
        }

        this.shape = new CANNON.Sphere(this.size);
        break;
    }
    //let normalMap = new THREE.TextureLoader().load("bumpmaps/noise.jpg");
    this.mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({
        color: this.color,
        transparent: true,
        opacity: 0.0
      })
    );

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.body = new CANNON.Body({
      ...options.bodySettings,
      mass: options.mass ?? this.size
    });
    this.body.addShape(this.shape);
  }

  update(dt) {
    if (this.lifeSpan !== undefined) {
      this.lifeSpan -= dt;
    }

    if (this.mesh.material.opacity < 1) {
      this.mesh.material.opacity += 0.01;
    }

    if (this.attachedTo) {
      this.attachedTo.getWorldPosition(this.mesh.position);
      this.attachedTo.getWorldQuaternion(this.mesh.quaternion);
      this.body.position.copy(this.mesh.position);
      this.body.quaternion.copy(this.mesh.quaternion);
    } else {
      this.mesh.position.copy(this.body.position);
      this.mesh.quaternion.copy(this.body.quaternion);
    }

    if (this.shouldBeKilled) {
      this.kill();
    }

    const mesh = this.mesh;

    // Copy coordinates from Cannon.js to Three.js

    //console.log(this.body.position);

    //console.log(this.body.position);

    this.particleSystems.forEach((particleSystem) => {
      particleSystem.setPosition(this.mesh.position);
      particleSystem.update(dt);
    });

    this.debouncers.forEach((debouncer) => {
      debouncer.update(dt);
    });
  }

  kill() {
    if (this.noDie) {
      return;
    }
    this.lifeSpan = 0;

    if (this.ai) {
      this.ai.kill();
    }
    // remove physics
    this.world.remove(this.body);
    this.scene.remove(this.mesh);

    // remove lights
    this.lights.forEach((light) => {
      this.scene.remove(light);
    });
    this.lights = [];

    // stop any new particles
    // we'll wait for them to fade before we delete
    this.particleSystems.forEach((particleSystem) => {
      particleSystem.stop();
    });

    // stop any sounds being played
    this.sounds.forEach((sound) => {
      sound.kill();
    });
  }

  delete() {
    // remove particles
    this.particleSystems.forEach((particleSystem) => {
      particleSystem.delete();
    });
    this.particleSystems = [];
  }

  get shouldBeKilled() {
    return this.lifeSpan <= 0;
  }

  get shouldBeDeleted() {
    if (!this.shouldBeKilled) {
      return false;
    }
    for (const particleSystem of this.particleSystems) {
      if (particleSystem.hasParticles) {
        return false;
      }
    }

    return true;
  }
}
