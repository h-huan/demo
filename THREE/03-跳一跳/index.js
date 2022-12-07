/*
 * @Author: h-huan
 * @Date: 2022-12-03 11:06:39
 * @LastEditors: h-huan
 * @LastEditTime: 2022-12-07 17:13:21
 * @Description: 
 */
import { Scene, PerspectiveCamera, AmbientLight, Raycaster, AxesHelper, WebGLRenderer, Vector3, Vector2, Texture, MeshLambertMaterial, OrthographicCamera, MeshBasicMaterial, Color, BoxGeometry, Mesh, Quaternion, DirectionalLight } from '../jsm/three.module.js'
import { OrbitControls } from '../jsm/controls/OrbitControls.js'


let defArr = () => ({
    background: 0x282828,
    ground: -1, //地面负一
    cubeWidth: 4, //宽
    cubeHeight: 2, //高
    cubeDeep: 4, //深度
    cubeColor: 0xbebebe,
    jumperWidth: 1, //宽
    jumperHeight: 2, //高
    jumperDeep: 1, //深度
    jumperColor: 0x232323, //跳块颜色
})

export default class skip {
    constructor(canvas, arr) {
        // 将所有可枚举的自有属性从一个或多个源对象复制到目标对象
        Object.assign(this, defArr(), arr)
        this.canvas = canvas
        this.width = canvas.width
        this.height = canvas.height
        // this.origPoint = new Vector3(0, 0, 0); // 相机对准位置
        this.cubes = [];   // 方块集合
        this.cubesLen = 5  // 屏幕方块最多数量
        this.score = 0   // 分数
        // 跳快初始状态
        this.jumperStat = {
            //鼠标按下速度
            ready: false,
            xSpeed: 0,
            ySpeed: 0
        };
        // 正交相机
        this.cameraPros = {
            current: new Vector3(0, 0, 0), //当前位置	  
            next: new Vector3(0, 0, 0),    //落下位置
        };
        this.init();
    }
    init() {
        const { canvas, background, width, height, cameraPros } = this
        this.scene = new Scene();
        // 相机
        // this.camera = new PerspectiveCamera(45, canvas.width / canvas.height, 1, 1000);
        this.camera = new OrthographicCamera(width / -50, width / 50, height / 50, height / -50, 0, 5000);
        this.camera.position.set(100, 100, 100);  // 相机位置
        this.camera.lookAt(cameraPros.current);  //  相机朝向某个点
        // 环境光源
        this.directionalLight = new DirectionalLight(0xffffff, 1.1);
        this.directionalLight.position.set(2, 10, 5);
        //平行光  （颜色，强度)
        this.light = new AmbientLight(0xffffff, 0.3);
        // 坐标系
        this.axesHelper = new AxesHelper(5);
        // 渲染
        this.renderer = new WebGLRenderer({
            canvas,
            antialias: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(background, 1.0);
        // 控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target = new Vector3(0, 0, 0);//设置控制点
        this.scene.add(this.light);
        this.scene.add(this.directionalLight);
        this.scene.add(this.axesHelper);

        this.canvas.addEventListener("mousedown", () => {
            this.handleMouseDown();
        });
        this.canvas.addEventListener("mouseup", () => {
            this.handleMouseUp()
        });

        this.render();
        this.createCube();
        this.createJumper()
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
    // 创建方块
    createCube() {
        const { cubeWidth, cubeHeight, cubeDeep, cubeColor, cubesLen } = this
        let geometry = new BoxGeometry(cubeWidth, cubeHeight, cubeDeep);
        //创建一个几何体对象 （宽，高，深度）
        let material = new MeshLambertMaterial({ color: cubeColor });
        //创建了一个可以用于立方体的材质,对象包含了颜色、透明度等属性，
        let cube = new Mesh(geometry, material);
        if (this.cubes.length) {
            cube.position.set(this.cubes[this.cubes.length - 1].position.get())
            // cube.position.y = this.cubes[this.cubes.length - 1].position.y
            // cube.position.z = this.cubes[this.cubes.length - 1].position.z
            this.cubeStat.nextDir = Math.random() > 0.5 ? "left" : "right"; //要不左边要不右边
            if (this.cubeStat.nextDir == "left") {
                //左边改变x轴否则y轴
                cube.position.x = cube.position.x - Math.round(Math.random() * 4 + 6);
            } else {
                cube.position.z = cube.position.z - Math.round(Math.random() * 4 + 6);
            }
        }
        if (this.cubes.length >= cubesLen) {
            this.scene.remove(this.cubes.shift());
        }
        this.cubes.push(cube);
        this.scene.add(cube);
        // if (this.cubes > 1) {
        // 更新镜头位置
        this.updateCameraPros()
        // }
    }
    // 创建跳快
    createJumper() {
        const { jumperColor, jumperWidth, jumperHeight, jumperDeep } = this
        let geometry = new BoxGeometry(jumperWidth, jumperHeight, jumperDeep); // （宽，高，深度）			
        let material = new MeshLambertMaterial({
            color: jumperColor
        }); //材质,颜色、透明度
        this.jumper = new Mesh(geometry, material); //合并在一起
        jumper.position.y = 2; //显示跳块
        // geometry.translate(0, 1, 0);//平移
        this.scene.add(jumper)
    }
    // 更新镜头位置
    updateCameraPros() {
        const { cubes } = this
        let lastIndex = cubes.length - 1;
        let pointA = {
            //当前块
            x: cubes[lastIndex].position.x,
            z: cubes[lastIndex].position.z,
        };
        let pointB = {
            //下一个块
            x: cubes[lastIndex - 1].position.x,
            z: cubes[lastIndex - 1].position.z,
        };
        this.cameraPros.next = new Vector3((pointA.x + pointB.x) / 2, 0, (pointA.z + pointB.z) / 2);
    }
    // 按下状态
    handleMouseDown() {
        if (!this.jumperStat.ready && this.jumper.scale.y > 0.02) {
            this.jumper.scale.y -= 0.01;//压缩块
            this.jumperStat.xSpeed += 0.004;
            this.jumperStat.ySpeed += 0.008;
            this.render();
            window.requestAnimationFrame(() => {
                this.handleMouseDown()
            })
        }
    }
    // 松开状态
    handleMouseUp() {
        this.jumperStat.ready = true;
        if (this.jumper.position.y >= 1) {
            if (this.jumper.scale.y < 1) {
                this.jumper.scale.y += 0.1;//压缩状态小于1就+
            }
            if (this.cubeStat.nextDir == "left") {
                //挑起盒子落在哪里
                this.jumper.position.x -= this.jumperStat.xSpeed;
            } else {
                this.jumper.position.z -= this.jumperStat.xSpeed;
            }
            this.jumper.position.y += this.jumperStat.ySpeed;
            this.jumperStat.ySpeed -= 0.01;//上升落下状态
            this._render();
            requestAnimationFrame(() => {
                //循环执行
                this.handleMouseUp();
            })
        } else {
            //落下状态
            this.jumperStat.ready = false;
            this.jumperStat.xSpeed = 0;
            this.jumperStat.ySpeed = 0;
            this.jumper.position.y = 1;
            this.jumper.scale.y = 1;
            this.checkInCube();//检测落在哪里
            if (this.falledStat.location == 1) {
                //下落后等于1，+分数
                this.score++;
                this.createCube();
                this.updateCamera();
                if (this.successCallback) {
                    //否则失败
                    this.successCallback(this.score);
                }
            } else {
                this._falling()
            }
        }

    }
    // 检测落在哪里
    checkInCube(){}
    // 下落过程
    falling(){}
    // 落下旋转
    fallingRotate(){

    }
}