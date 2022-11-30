/*
 * @Author: h-huan
 * @Date: 2022-11-30 11:39:39
 * @LastEditors: h-huan
 * @LastEditTime: 2022-11-30 16:40:35
 * @Description: 
 */
import { Scene, PerspectiveCamera, AmbientLight, AxesHelper, WebGLRenderer, Vector3, Texture, MeshLambertMaterial, BoxGeometry, Mesh } from '../../jsm/three.module.js'
import { OrbitControls } from '../../jsm/controls/OrbitControls.js'

/**
   * @description: 默认参数
   * @return {x、y、z} x、y、z 魔方中心点坐标
   * @return {num} num 魔方阶数
   * @return {len}  魔方宽高
   * @return {colors} 魔方六面体
   */
const defAttr = () => ({
    x: 0,
    y: 0,
    z: 0,
    num: 3,
    len: 20,
    colors: ['rgba(255,193,37,1)', 'rgba(0,191,255,1)',
        'rgba(50,205,50,1)', 'rgba(178,34,34,1)',
        'rgba(255,255,0,1)', 'rgba(255,255,255,1)']
})

export default class RubikCube {
    constructor(canvas, arr) {
        // 将所有可枚举的自有属性从一个或多个源对象复制到目标对象
        Object.assign(this, defAttr(), arr)
        this.canvas = canvas
        // this.cubes = [];

        this.init();
        this.render();
    }
    init() {
        const { canvas, x, y, z, num, len, colors } = this
        this.scene = new Scene();
        // 相机
        this.camera = new PerspectiveCamera(45, canvas.width / canvas.height, 1, 1000);
        this.camera.position.set(100, 100, 100);
        this.camera.up.set(0, 1, 0);//正方向
        this.camera.lookAt(this.scene.position);
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

        this.scene.add(this.light);
        this.scene.add(this.axesHelper)

        // 产检魔方
        this.SimpleCube(x, y, z, num, len, colors);
    }
    // 渲染
    render() {
        let { scene, camera, renderer } = this
        renderer.clear();
        renderer.render(scene, camera);
        requestAnimationFrame(() => {
            this.render()
        });
    }
    // 生成魔方
    SimpleCube(x, y, z, num, len, colors) {
        // 最边上的坐标
        const { scene, faces } = this;
        const leftUpX = x - num / 2 * len;
        const leftUpY = y + num / 2 * len;
        const leftUpZ = z + num / 2 * len;
        //根据颜色生成材质
        const materialArr = [];
        for (let i = 0; i < colors.length; i++) {
            const texture = new Texture(faces(colors[i]));
            texture.needsUpdate = true;
            const material = new MeshLambertMaterial({ map: texture });
            materialArr.push(material);
        }
        // 创建模型
        for (let i = 0; i < num; i++) {
            for (let j = 0; j < num * num; j++) {
                const cubegeo = new BoxGeometry(len, len, len);
                const cube = new Mesh(cubegeo, materialArr);
                //依次计算各个小方块中心点坐标
                cube.position.x = (leftUpX + len / 2) + (j % num) * len;
                cube.position.y = (leftUpY - len / 2) - parseInt(j / num) * len;
                cube.position.z = (leftUpZ - len / 2) - i * len;
                scene.add(cube)
            }
        }
    }
    // 魔方纹理
    faces(rgbaColor) {
        let canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        let context = canvas.getContext('2d');
        if (context) {
            //画一个宽高都是256的黑色正方形
            context.fillStyle = 'rgba(0,0,0,1)';
            context.fillRect(0, 0, 256, 256);
            //在内部用某颜色的16px宽的线再画一个宽高为224的圆角正方形并用改颜色填充
            context.rect(16, 16, 224, 224);
            context.lineJoin = 'round';
            context.lineWidth = 16;
            context.fillStyle = rgbaColor;
            context.strokeStyle = rgbaColor;
            context.stroke();
            context.fill();
        } else {
            alert('您的浏览器不支持Canvas无法预览.\n');
        }
        return canvas;
    }
}

