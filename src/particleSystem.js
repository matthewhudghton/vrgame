import Nebula, {
  SpriteRenderer,
  Alpha,
  Scale,
  Color,
  Emitter
} from "three-nebula";
import update from "immutability-helper";

import left_hand_ps from "./particles/left_hand.json";
import right_hand_ps from "./particles/right_hand.json";
import fireball_ps from "./particles/fireball.json";
import gun1_ps from "./particles/gun1.json";

let particles_json_map = {
  left_hand: left_hand_ps,
  right_hand: right_hand_ps,
  fireball: fireball_ps,
  gun1: gun1_ps
};

export class ParticleSystem {
  constructor(options) {
    this.THREE = options.THREE;
    this.scene = options.scene;
    this.type = options.type;
    this.useLoaded = options.useLoaded ?? false;

    Nebula.fromJSONAsync(this.getParticleJSON(options), this.THREE).then(
      (system) => {
        this.renderer = new SpriteRenderer(this.scene, this.THREE);
        this.nebula = system.addRenderer(this.renderer);
      }
    );
  }

  getParticleJSON(options) {
    const base = particles_json_map[options.type];
    /* If options.useDefault is setto true, then don't override settings */
    if (options.useLoaded) {
      return base;
    }
    const data = update(base, {
      emitters: [
        {
          rate: { $set: this.getEmitterRate(options) },
          initializers: { $set: this.getInitializers(options) },
          behaviours: { $set: this.getBehaviours(options) },
          emitterBehaviours: { $set: this.getEmitterBehaviours(options) }
        }
      ]
    });
    console.log(data);

    return data;
  }

  update(dt) {
    if (this.nebula) {
      this.nebula.update();
    }
  }

  stop() {
    this.nebula.emitters.forEach((emitter) => {
      emitter.rate.numPan.a = 0;
      emitter.rate.numPan.b = 0;
    });
  }

  get hasParticles() {
    for (const emitter of this.nebula.emitters) {
      if (emitter.particles.length > 0) {
        return true;
      }
    }
    return false;
  }

  delete() {
    this.nebula.emitters.forEach((emitter) => {
      emitter.removeAllParticles();
      emitter.dead = true;
    });
    this.nebula.update();
    this.nebula.destroy();
    delete this.nebula;
  }
  setPosition(position) {
    if (
      this.nebula &&
      this.nebula.emitters &&
      this.nebula.emitters.length > 0
    ) {
      this.nebula.emitters[0].setPosition(position);
    }
  }

  getInitializers(options) {
    let massMin = options.massMin ?? 10;
    let massMax = options.massMax ?? 10;
    let massIsEnabled = options.massIsEnabled ?? true;

    let lifeMin = options.lifeMin ?? 1;
    let lifeMax = options.lifeMax ?? 2;
    let lifeIsEnabled = options.lifeIsEnabled ?? true;

    let radiusWidth = options.radiusWidth ?? 1;
    let radiusHeight = options.radiusHeight ?? 1;
    let radiusIsEnabled = options.radisIsEnabled ?? true;

    let radialVelocityRadius = options.radialVelocityRadius ?? 2;
    let radialVelocityX = options.radialVelocityX ?? 0;
    let radialVelocityY = options.radialVelocityY ?? 1.0;
    let radialVelocityZ = options.radialVelocityZ ?? 0.0;
    let radialVelocityTheta = options.radialVelocityTheta ?? 900;
    let radialVelocityisEnabled = options.radialVelocityisEnabled ?? true;

    return [
      {
        type: "Mass",
        properties: { min: massMin, max: massMax, isEnabled: massIsEnabled }
      },
      {
        type: "Life",
        properties: { min: lifeMin, max: lifeMax, isEnabled: lifeIsEnabled }
      },
      {
        type: "BodySprite",
        properties: {
          texture:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJkSURBVHjaxJeJbusgEEW94S1L//83X18M2MSuLd2pbqc4wZGqRLrKBsyZhQHny7Jk73xVL8xpVhWrcmiB5lX+6GJ5YgQ2owbAm8oIwH1VgKZUmGcRqKGGPgtEQQAzGR8hQ59fAmhJHSAagigJ4E7GPWRXOYC6owAd1JM6wDQPADyMWUqZRMqmAojHp1Vn6EQQEgUNMJLnUjMyJsM49wygBkAPw9dVFwXRkncCIIW3GRgoTQUZn6HxCMAFEFd8TwEQ78X4rHbILoAUmeT+RFG4UhQ6MiIAE4W/UsYFjuVjAIa2nIY4q1R0GFtQWG3E84lqw2GO2QOoCKBVu0BAPgDSU0eUDjjQenNkV/AW/pWChhpMTelo1a64AOKM30vk18GzTHXCNtI/Knz3DFBgsUqBGIjTInXRY1yA9xkVoqW5tVq3pDR9A0hfF5BSARmVnh7RMDCaIdcNgbPBkgzn1Bu+SfIEFSpSBmkxyrMicb0fAEuCZrWnN89veA/4XcakrPcjBWzkTuLjlbfTQPOlBhz+HwkqqPXmPQDdrQItxE1moGof1S74j/8txk8EHhTQrAE8qlwfqS5yukm1x/rAJ9Jiaa6nyATqD78aUVBhFo8b1V4DdTXdCW+IxA1zB4JhiOhZMEWO1HqnvdoHZ4FAMIhV9REF8FiUm0jsYPEJx/Fm/N8OhH90HI9YRHesWbXXZwAShU8qThe7H8YAuJmw5yOd989uRINKRTJAhoF8jbqrHKfeCYdIISZfSq26bk/K+yO3YvfKrVgiwQBHnwt8ynPB25+M8hceTt/ybPhnryJ78+tLgAEAuCFyiQgQB30AAAAASUVORK5CYII=",
          isEnabled: true
        }
      },
      {
        type: "Radius",
        properties: {
          width: radiusWidth,
          height: radiusHeight,
          isEnabled: radiusIsEnabled
        }
      },
      {
        type: "RadialVelocity",
        properties: {
          radius: radialVelocityRadius,
          x: radialVelocityX,
          y: radialVelocityY,
          z: radialVelocityZ,
          theta: radialVelocityTheta,
          isEnabled: radialVelocityisEnabled
        }
      }
    ];
  }

  getBehaviours(options) {
    let alphaA = options.alphaA ?? 1;
    let alphaB = options.alphaB ?? 0;
    let scaleA = options.scaleA ?? 1;
    let scaleB = options.scaleB ?? 1;
    let colorA = options.colorA ?? "#ff2a00";
    let colorB = options.colorB ?? "#111111";
    let fx = options.fx ?? 0.0;
    let fy = options.fy ?? 0.0;
    let fz = options.fz ?? 0.0;
    let rotateX = options.rotateX ?? 1;
    let rotateY = options.rotateY ?? 0;
    let rotateZ = options.rotateZ ?? 0;
    let driftX = options.driftX ?? 0.1;
    let driftY = options.driftY ?? 0.2;
    let driftZ = options.driftZ ?? 0.1;
    let driftDelay = options.driftDelay ?? 1;
    let useSpring = options.useSpring ?? false;
    let springX = options.springX ?? options?.position?.x ?? 0;
    let springY = options.springY ?? options?.position?.y ?? 0;
    let springZ = options.springZ ?? options?.position?.z ?? 0;
    let spring = options.spring ?? 0.2;
    let springFriction = options.springFriction ?? 0.5;
    let springLife = options.springLife ?? null;

    const behaviorJson = [
      {
        type: "Alpha",
        properties: {
          alphaA: alphaA,
          alphaB: alphaB,
          life: null,
          easing: "easeLinear"
        }
      },
      {
        type: "Scale",
        properties: {
          scaleA: scaleA,
          scaleB: scaleB,
          life: null,
          easing: "easeLinear"
        }
      },

      {
        type: "Color",
        properties: {
          colorA: colorA,
          colorB: colorB,
          life: null,
          easing: "easeOutCubic"
        }
      },
      {
        type: "Force",
        properties: {
          fx: fx,
          fy: fy,
          fz: fz,
          life: null,
          easing: "easeLinear"
        }
      },
      {
        type: "Rotate",
        properties: {
          x: rotateX,
          y: rotateY,
          z: rotateZ,
          life: null,
          easing: "easeLinear"
        }
      },
      {
        type: "RandomDrift",
        properties: {
          driftX: driftX,
          driftY: driftY,
          driftZ: driftZ,
          delay: driftDelay,
          life: null,
          easing: "easeLinear"
        }
      }
    ];

    if (useSpring) {
      behaviorJson.push({
        type: "Spring",
        properties: {
          x: springX,
          y: springY,
          z: springZ,
          spring: spring,
          friction: springFriction,
          life: springLife,
          easing: "easeLinear"
        }
      });
    }
    return behaviorJson;
  }

  getEmitterBehaviours(options) {
    const emitterBehaviour = [];
    let useEmitterRotate = options.useEmitterRotate ?? false;
    let emitterRotateX = options.emitterRotateX ?? 0;
    let emitterRotateY = options.emitterRotateY ?? 0;
    let emitterRotateZ = options.emitterRotateZ ?? 0;
    let emitterRotateLife = options.emitterRotateLife ?? null;
    let emitterRotateEasing = options.emitterRotateEasing ?? "easeLinear";

    if (useEmitterRotate) {
      emitterBehaviour.push({
        type: "Rotate",
        properties: {
          x: emitterRotateX,
          y: emitterRotateY,
          z: emitterRotateZ,
          life: emitterRotateLife,
          easing: emitterRotateEasing
        }
      });
    }

    return emitterBehaviour;
  }
  getEmitterRate(options) {
    let particlesMin = options.particlesMin ?? 1;
    let particlesMax = options.particlesMax ?? 2;
    let perSecondMin = options.perSecondMin ?? 0.01;
    let perSecondMax = options.perSecondMax ?? 0.02;

    return {
      particlesMin: particlesMin,
      particlesMax: particlesMax,
      perSecondMin: perSecondMin,
      perSecondMax: perSecondMax
    };
  }
}
