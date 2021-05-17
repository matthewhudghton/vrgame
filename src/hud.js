import * as THREE from "three";

export class Hud {
  constructor(camera, scene, font) {
    this.camera = camera;
    this.font = font;
    this.scene = scene;
    this.objects = [];
  }

  // Getter
  get area() {
    return this.calcArea();
  }
  // Method
  calcArea() {
    return this.height * this.width;
  }
  render() {
    /*for (const object of this.objects) {
      let offset = new THREE.Vector3();
      offset.x = object.userData.offset.x;
      offset.y = object.userData.offset.y;
      offset.z = object.userData.offset.z;
      let worldOffset = new THREE.Vector3();
      this.camera.getWorldDirection(worldOffset);
      object.position.x = this.camera.position.x + worldOffset.x;
      object.position.y = this.camera.position.y + worldOffset.y;
      object.position.z = this.camera.position.z + worldOffset.z;
      object.rotation.x = this.camera.rotation.x;
      object.rotation.y = this.camera.rotation.y;
      object.rotation.z = this.camera.rotation.z;
    }*/
    //object.position.applyAxisAngle( axis, angle );
  }
  set debugText(value) {
    var textGeometry = new THREE.TextGeometry(value, {
      font: this.font,
      size: 0.02,
      height: 0.02
    });

    var textMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      specular: 0xffffff
    });

    var mesh = new THREE.Mesh(textGeometry, textMaterial);
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = 0;

    mesh.userData.offset = new THREE.Vector3();
    mesh.userData.offset.x = 0;
    mesh.userData.offset.y = 0;
    mesh.userData.offset.z = 0;

    mesh.material.depthTest = false;
    console.log("Adding text!!!");
    this.scene.add(mesh);
    for (const object of this.objects) {
      this.scene.remove(object);
    }

    let offset = new THREE.Vector3();
    offset.x = mesh.userData.offset.x;
    offset.y = mesh.userData.offset.y;
    offset.z = mesh.userData.offset.z;
    let worldOffset = new THREE.Vector3();
    this.camera.getWorldDirection(worldOffset);
    mesh.position.x = this.camera.position.x + worldOffset.x;
    mesh.position.y = this.camera.position.y + worldOffset.y;
    mesh.position.z = this.camera.position.z + worldOffset.z;
    mesh.rotation.x = this.camera.rotation.x;
    mesh.rotation.y = this.camera.rotation.y;
    mesh.rotation.z = this.camera.rotation.z;

    this.objects.push(mesh);
  }
}
