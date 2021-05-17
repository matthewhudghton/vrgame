import { ShapeRecogniser } from "./shapeRecogniser.js";

export class Mouse {
  constructor(THREE) {
    this.THREE = THREE;
    this.mousePressed = false;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.currentIndex = -1;
    this.recordedPoints = [];

    document.addEventListener(
      "mousemove",
      function onDocumentMouseMove(event) {
        if (this.mousePressed) {
          this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
          this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
          //console.log(this.mouse.x, this.mouse.y);
          this.recordPos(this.mouse.x, this.mouse.y);
        }
      }.bind(this),
      false
    );
    document.addEventListener(
      "mousedown",
      function onDocumentMouseDown(event) {
        this.mousePressed = true;
        this.newRecord();
      }.bind(this),
      false
    );
    document.addEventListener(
      "mouseup",
      function onDocumentMouseUp(event) {
        this.mousePressed = false;
        this.shapeRecogniser.print();
      }.bind(this),
      false
    );
  }
  newRecord() {
    this.shapeRecogniser = new ShapeRecogniser();
  }
  recordPos(x, y) {
    const time = new Date().getTime();
    this.shapeRecogniser.addPoint(x, y, time);
  }
}
