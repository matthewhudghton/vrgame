import { Actor } from "./actor.js";
import { ParticleSystem } from "./particleSystem.js";
import { Sound } from "./sound.js";

export class Explosion extends Actor {
  constructor(options) {
    options.shapeType ??= "sphere";
    options.bodySettings ??= {};
    options.bodySettings.fixedRotation = true;
    options.lifeSpan ??= 0.5;
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
    this.speed = options.speed ?? 15;
    this.body.linearDamping = 0;
    this.particleSystems.push(
      new ParticleSystem({
        THREE: this.THREE,
        scene: this.scene,
        type: "fireball",
        colorA: "#" + this.color.getHexString(),
        scaleA: size * 2,
        scaleB: size,
        position: this.body.position,
        radialVelocityY: 1 + 10 * this.size * this.size,
        radialVelocityRadius: 14 * this.size * this.size,
        useLoaded: false,
        particlesMin: 2
      })
    );
    if (Math.random() * 15 < this.size) {
      const light = new this.THREE.PointLight(
        this.color,
        this.size * this.size * 5,
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
        name: "explosion01",
        loop: false,
        detune: (5 - this.size) * 1000
      })
    );

    //console.log("explo collisionFilterGroup", this.body.collisionFilterGroup);
    //console.log("explo collisionFilterMask", this.body.collisionFilterMask);
  }

  update(dt) {
    Actor.prototype.update.call(this, dt);
  }
}
