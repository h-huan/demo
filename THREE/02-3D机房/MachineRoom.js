import * as THREE from "../jsm/three.module.js";
import { OrbitControls } from "../jsm/controls/OrbitControls.js";
import { GLTFLoader } from "../jsm/loader/GLTFLoader.js";

export default class MachineRoom {
  onMouseOverCabinet = (cabinet) => {};
  onMouseMoveCabinet = (x, y) => {};
  onMouseOutCabinet = () => {};
  maps = new Map();

  constructor(canvas, modelPath = "./models/") {
    this.scene = new THREE.Scene();
    this.cabinets = [];
    this.curCabinet;
    this.maps = new Map();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.camera = new THREE.PerspectiveCamera(
      45,
      canvas.width / canvas.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 20);
    this.camera.lookAt(0, 0, 0);
    this.loader = new GLTFLoader();
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.modelPath = modelPath;

    let curTexture = new THREE.TextureLoader().load(
      `${modelPath}cabinet-hover.jpg`
    );
    // 取消图片垂直翻转
    curTexture.flipY = false;

    this.maps.set("cabinet-hover.jpg", curTexture);
  }
  loadGLTF(modelName) {
    this.loader.load(this.modelPath + modelName, ({ scene: { children } }) => {
      children.forEach((obj) => {
        const { color, map, name } = obj.material;
        this.changeMat(obj, map, color);
        if (name.includes("cabinet")) {
          this.cabinets.push(obj);
        }
      });
      this.scene.add(...children);
    });
  }
  // 添加材质
  changeMat(obj, map, color) {
    // 判断模型是否有颜色贴图
    if (map) {
      obj.material = new THREE.MeshBasicMaterial({
        map: this.crtTexture(map.name),
      });
    } else {
      obj.material = new THREE.MeshBasicMaterial({ color });
    }
  }
  // 添加纹理
  crtTexture(imgName) {
    let curTexture = this.maps.get(imgName);
    // 根据模型贴图名称去map数组中找是否有这个贴图
    if (!curTexture) {
      curTexture = new THREE.TextureLoader().load(this.modelPath + imgName);
      curTexture.flipY = false;
      curTexture.wrapS = 1000;
      curTexture.wrapT = 1000;
      this.maps.set(imgName, curTexture);
    }
    return curTexture;
  }
  selectCabinet(x, y) {
    const { cabinets, renderer, camera, maps, curCabinet } = this;
    const { width, height } = renderer.domElement;

    // 鼠标的canvas坐标转裁剪坐标，webgl坐标转换为css坐标。
    this.pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1);
    // 基于鼠标点和相机设置射线投射器
    this.raycaster.setFromCamera(this.pointer, camera);
    // 选择机柜
    const intersect = this.raycaster.intersectObjects(cabinets)[0];
    let intersectObj = intersect ? intersect.object : null;
    // 若之前已有机柜被选择，且不等于当前所选择的机柜，取消已选机柜的高亮
    if (curCabinet && curCabinet !== intersectObj) {
      const material = curCabinet.material;
      material.setValues({
        map: maps.get("cabinet.jpg"),
      });
    }
    /* 
     若当前所选对象不为空：
       触发鼠标在机柜上移动的事件。
       若当前所选对象不等于上一次所选对象：
         更新curCabinet。
         将模型高亮。
         触发鼠标划入机柜事件。
     否则：
       置空curCabinet。
       触发鼠标划出机柜事件。
     */
    if (intersectObj) {
      this.onMouseMoveCabinet(x, y);
      if (intersectObj !== curCabinet) {
        this.curCabinet = intersectObj;
        const material = intersectObj.material;
        material.setValues({
          map: maps.get("cabinet-hover.jpg"),
        });
        this.onMouseOverCabinet(intersectObj);
      }
    } else if (curCabinet) {
      this.curCabinet = null;
      this.onMouseOutCabinet();
    }
  }
  // 渲染
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  // 连续渲染
  animate() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => {
      this.animate();
    });
  }
}
