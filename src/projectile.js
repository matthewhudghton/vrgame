import { Actor } from "./actor.js";
import { Explosion } from "./explosion.js";
import { ParticleSystem } from "./particleSystem.js";
import { Sound } from "./sound.js";

export class Projectile extends Actor {
  constructor(options) {
    options.shapeType ??= "sphere";
    options.bodySettings ??= {};
    options.bodySettings.fixedRotation = true;
    options.lifeSpan ??= 8;
    options.invisible ??= true;

    const size = options.rawShapeData.size;

    const blue = Math.min(-100 + size * 80, 255);
    const red = Math.max(Math.min(100 + size * 5, 255) - blue, 0);
    const green = 80 + size * 5 - blue;

    options.color ??= new options.THREE.Color(
      red / 255,
      green / 255,
      blue / 255
    );

    super(options);

    this.exploding = false;
    this.hasExploded = false;
    this.speed = options.speed ?? 15;
    if (options.reverseProjectile) {
      this.speed = -this.speed;
    }

    this.body.linearDamping = 0;
    this.particleSystems.push(
      new ParticleSystem({
        THREE: this.THREE,
        scene: this.scene,
        type: "fireball",
        colorA: "#" + this.color.getHexString(),
        scaleA: size * 0.5,
        scaleB: size,
        position: this.body.position
      })
    );

    if (Math.random() * 15 < this.size) {
      const light = new this.THREE.PointLight(
        this.color,
        this.size * this.size,
        0,
        2
      );

      light.position.set(0, 0, 0);
      this.lights.push(light);

      this.mesh.add(light);
    }
    this.sounds.push(
      new Sound({
        THREE: this.THREE,
        actor: this,
        player: this.map.player,
        detune: (5 - this.size) * 1000,
        duration: 20
      })
    );
  }

  kill() {
    Actor.prototype.kill.call(this);
  }

  update(dt) {
    Actor.prototype.update.call(this, dt);

    this.body.applyLocalImpulse(
      new this.CANNON.Vec3(0, 3.75 * dt, this.speed * dt),
      new this.CANNON.Vec3(0, 0, 0)
    );

    if (this.lifeSpan < 1) {
      this.exploding = true;
    }
    if (this.exploding && !this.hasExploded) {
      /*console.log(
        "projectile collisionFilterGroup",
        this.body.collisionFilterGroup
      );
      console.log(
        "projectile collisionFilterMask",
        this.body.collisionFilterMask
      );*/

      new Explosion({
        THREE: this.THREE,
        CANNON: this.CANNON,
        map: this.map,
        lifeSpan: undefined,
        rawShapeData: this.rawShapeData,
        position: this.body.position,
        bodySettings: {
          quaternion: this.body.quaternion
        },
        collisionFilterGroup: this.collisionFilterGroup,
        collisionFilterMask: this.collisionFilterMask
      });

      this.hasExploded = true;
      this.lifeSpan = 0;
    }
  }

  explode() {
    this.exploding = true;
  }

  collideEvent(event) {
    event.target.userData.actor.explode();
    if (event.body?.userData?.actor) {
      event.body.userData.actor.lifeSpan = 0;
    }
  }
}
