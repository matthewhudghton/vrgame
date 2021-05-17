import { Actor } from "./actor.js";
import { ParticleSystem } from "./particleSystem.js";
export class Projectile extends Actor {
  constructor(options) {
    options.shapeType ??= "sphere";
    options.bodySettings ??= {};
    options.bodySettings.fixedRotation = true;
    options.lifeSpan ??= 1;

    super(options);
    this.speed = options.speed ?? 15;
    this.body.linearDamping = 0;

    /*this.particleSystems.push(
      new ParticleSystem({
        THREE: this.THREE,
        scene: this.scene,
        type: "fireball"
      })
    );*/

    const light = new this.THREE.PointLight(0xffaa00, 1, 100, 1);
    light.position.set(50, 50, 50);
    this.lights.push(light);
    this.mesh.add(light);
  }

  update(dt) {
    Actor.prototype.update.call(this, dt);

    this.body.applyLocalImpulse(
      new this.CANNON.Vec3(0, 3.75 * dt, -this.speed * dt),
      new this.CANNON.Vec3(0, 0, 0)
    );
  }
}
