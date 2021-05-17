export class Entity {
  THREE;
  CANNON;
  map;
  world;
  scene;
  children;
  constructor(options) {
    this.THREE = options.THREE;
    this.CANNON = options.CANNON;
    this.map = options.map;
    this.world = options.map.world;
    this.scene = options.map.scene;
    this.children = options.children ?? [];
  }
  update(dt) {
    this.children.forEach((child) => {
      child.update(dt);
    });
  }
}
