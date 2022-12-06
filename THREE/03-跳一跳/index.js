/*
 * @Author: h-huan
 * @Date: 2022-12-03 11:06:39
 * @LastEditors: h-huan
 * @LastEditTime: 2022-12-04 21:49:27
 * @Description: 
 */
import { Scene, PerspectiveCamera, AmbientLight, Raycaster, AxesHelper, WebGLRenderer, Vector3 } from '../jsm/three.module.js'
import { OrbitControls } from '../jsm/controls/OrbitControls.js'
export default class skip {
    constructor(canvas, arr) {
        // 将所有可枚举的自有属性从一个或多个源对象复制到目标对象
        Object.assign(this, arr)
        this.canvas = canvas
        this.width = canvas.width
        this.height = canvas.height
        this.origPoint = new Vector3(0, 0, 0);
        this.init();
    }
    init() {
        const { canvas, origPoint } = this
        this.scene = new Scene();
        // 相机
        this.camera = new PerspectiveCamera(45, canvas.width / canvas.height, 1, 1000);
        this.camera.position.set(100, 100, 100);
        this.camera.up.set(0, 1, 0);//正方向
        this.camera.lookAt(origPoint);
        // 环境光源
        this.light = new AmbientLight(0xfefefe);
        // 坐标系
        this.axesHelper = new AxesHelper(100);
        // 渲染
        this.renderer = new WebGLRenderer({
            canvas,
            antialias: true
        });
        this.renderer.setSize(canvas.width, canvas.height);
        this.renderer.setClearColor(0x000000, 1.0);
        // 控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target = new Vector3(0, 0, 0);//设置控制点
        this.scene.add(this.light);
        this.scene.add(this.axesHelper);

        this.render();
    }
    // 渲染
    render() {
        let { scene, camera, renderer } = this
        renderer.clear();
        renderer.render(scene, camera);
        window.requestAnimationFrame(() => {
            this.render()
        });
    }
}