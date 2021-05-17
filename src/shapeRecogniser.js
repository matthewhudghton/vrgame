import { Actor } from "./actor.js";
import { Debouncer } from "./debouncer.js";

class ShapeRecord {
  constructor(options) {
    this.shape = options.vectors;
    this.name = options.name;
    this.maxTries = options.maxTries ?? 7;
    this.reset();
  }

  getFractionMatch() {
    return this.index / this.shape.length;
  }
  printFractionMatch() {
    const fraction = this.getFractionMatch();
    var node = document.createTextNode(
      "(" + this.name + "," + Math.floor(fraction * 100) + ") "
    );
    document.getElementById("debugText").appendChild(node);
  }

  reset() {
    this.previousPoint = undefined;
    this.index = 0;
    this.tries = 0;
  }

  processPoint(p) {
    const previousPoint = this.previousPoint;
    const shape = this.shape;
    if (previousPoint !== undefined) {
      const x = p[0] - previousPoint[0];
      const y = p[1] - previousPoint[1];
      let xDir = x > 0 ? 1 : x < 0 ? -1 : 0;
      let yDir = y > 0 ? 1 : y < 0 ? -1 : 0;
      if (xDir != 0 || yDir != 0) {
        if (this.index >= shape.length) {
          console.log("Match " + this.name);
          var node = document.createTextNode(this.name + " ");
          document.getElementById("debugText").appendChild(node);
          return true;
        }
        if (shape[this.index][0] == xDir && shape[this.index][1] == yDir) {
          this.index++;
          if (this.tries > 0) {
            this.tries--;
          }
        } else if (this.index > 0) {
          if (
            shape[this.index - 1][0] != xDir ||
            shape[this.index - 1][1] != yDir
          ) {
            this.tries++;
            if (this.tries > this.maxTries) {
              this.tries = 0;
              this.index = 0;
            }
          }
        }
      }
    }
    this.previousPoint = p;
    return false;
  }
}

export class ShapeRecogniser {
  constructor() {
    this.xCount = 30;
    this.yCount = 30;
    this.clear();

    const square = new ShapeRecord({
      name: "square",
      vectors: [
        [1, 0],
        [1, 0],
        [0, -1],
        [0, -1],
        [-1, 0],
        [-1, 0],
        [0, 1],
        [0, 1]
      ],
      maxTries: 8
    });
    const circle = new ShapeRecord({
      name: "circle",
      vectors: [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
        [1, 0],
        [1, -1],
        [0, -1]
      ],
      maxTries: 3
    });
    const downLeft = new ShapeRecord({
      name: "downLeft",
      vectors: [
        [0, -1],
        [0, -1],
        [0, -1],
        [-1, 0],
        [-1, 0],
        [-1, 0]
      ]
    });

    this.shapes = [square, circle];
  }
  clear() {
    this.maxX = -Number.MAX_VALUE;
    this.minX = Number.MAX_VALUE;
    this.maxY = -Number.MAX_VALUE;
    this.minY = Number.MAX_VALUE;
    this.points = [];
    this.matrix = new Array(this.xCount)
      .fill(0)
      .map(() => new Array(this.yCount));
  }

  addPoint(x, y, time) {
    this.points.push([x, y, time]);
    this.minX = Math.min(this.minX, x);
    this.maxX = Math.max(this.maxX, x);
    this.minY = Math.min(this.minY, y);
    this.maxY = Math.max(this.maxY, y);
  }

  normalisePoints(points) {
    let max = Math.max(this.maxX, this.maxY);
    let min = Math.min(this.minX, this.minY);
    //  ~~ is a fast bitwise way to convert to int
    return points.map((p) => [
      ~~(((p[0] - min) / (max - min)) * (this.xCount - 1)),
      ~~(((p[1] - min) / (max - min)) * (this.yCount - 1)),
      p[2]
    ]);
  }
  initMatrix(points) {
    console.log("points = ", points);
    let previousPoint;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      let x = p[0];
      let y = p[1];
      if (!this.matrix[x][y]) {
        this.matrix[x][y] = [];
      }
      const diff =
        previousPoint !== undefined
          ? [x - previousPoint[0], y - previousPoint[1]]
          : undefined;
      this.matrix[x][y].push([p[2], diff]);
      previousPoint = p;
    }
  }

  getCharForVector(vector) {
    let x = vector[0];
    let y = vector[1];

    if (x == y && (x == 1 || x == -1)) {
      return "/";
    }

    if (x == -y && x != 0) {
      return "\\";
    }

    if (x > 0 && x > y) {
      return ">";
    }
    if (x < 0 && x < y) {
      return "<";
    }
    if (y > 0) {
      return "^";
    }
    if (y < 0) {
      return "v";
    }
    return "#";
  }
  printMatrix(matrix) {
    let message = "";
    for (let y = 0; y < this.yCount; y++) {
      for (let x = 0; x < this.xCount; x++) {
        message +=
          matrix[x][y] && matrix[x][y].length > 0 && matrix[x][y][0][1]
            ? this.getCharForVector(matrix[x][y][0][1])
            : ".";
      }
      message += "\n";
    }
    console.log(message);
  }

  printMatrixToDom(matrix) {
    var br = document.createElement("br");
    document.getElementById("debugText").appendChild(br);
    for (let y = this.yCount - 1; y >= 0; y -= 1) {
      var text = "";
      for (let x = 0; x < this.xCount; x++) {
        text +=
          matrix[x][y] && matrix[x][y].length > 0 && matrix[x][y][0][1]
            ? this.getCharForVector(matrix[x][y][0][1])
            : ".";
      }
      var node = document.createTextNode(text);
      var br = document.createElement("br");
      document.getElementById("debugText").appendChild(node);
      document.getElementById("debugText").appendChild(br);
    }
  }

  get width() {
    return this.maxX - this.minX;
  }

  get height() {
    return this.maxY - this.minY;
  }

  get size() {
    return (
      Math.sqrt(this.width * this.width) + Math.sqrt(this.height * this.height)
    );
  }

  getShapeInfo() {
    let normalisedPoints = this.normalisePoints(this.points);
    this.initMatrix(normalisedPoints);
    let results = [];
    for (let point of normalisedPoints) {
      for (let shape of this.shapes) {
        if (shape.processPoint(point)) {
          results.push({
            name: shape.name,
            width: this.width,
            height: this.height,
            size: this.size
          });
          this.shapes.forEach((s) => s.reset());
        }
      }
    }
    return results;
  }

  print() {
    let logString = `
    x: ${this.minX} ${this.maxX}
    y: ${this.minY} ${this.maxY}
    `;
    console.log(logString);
    let normalisedPoints = this.normalisePoints(this.points);
    console.log(normalisedPoints);
    this.initMatrix(normalisedPoints);
    console.log("this.matrix", this.matrix);
    //this.printMatrix(this.matrix);
    //this.printMatrixToDom(this.matrix);
    //this.checkForShape(normalisedPoints);
  }
}
