/*
 * @Author: h-huan
 * @Date: 2022-12-03 11:06:39
 * @LastEditors: h-huan
 * @LastEditTime: 2022-12-09 16:51:32
 * @Description: 
 */
import { Scene, OrthographicCamera, Vector3, WebGLRenderer, DirectionalLight, AmbientLight, BoxGeometry, MeshLambertMaterial, Mesh } from '../jsm/three.module.js'

// 初始化值
const defArr = () => ({
    background: 0x282828,
    cubeColor: 0xbebebe,
    cubeWidth: 4, //宽	 
    cubeHeight: 2, //高	  
    cubeDeep: 4, //深度	  
    jumperColor: 0x232323, //跳块颜色
    jumperWidth: 1, //宽	  
    jumperHeight: 2, //高
    jumperDeep: 1 //深度	  
})

export default class Jump {
    constructor(canvas, arr) {
        Object.assign(this, defArr(), arr)
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ground = -1;
        this.score = 0; //分数初始化	
        this.cubes = []; //方块
        this.nextDir = ""; // 方块方向

        //正交相机 （宽高 近距离远距离）
        this.cameraPros = {
            current: new Vector3(0, 0, 0), //当前位置	  
            next: new Vector3(0, 0, 0), //落下位置
        };
        // 方块初始状态
        this.jumperStat = {
            ready: false,
            dirSpeed: 0,
            ySpeed: 0
        };
        this.falledStat = {
            location: -1, //落在哪里 当前块块上
            distance: 0,  //距离是否倒下
        };
        //有没有落到点
        this.fallingStat = {
            end: false,
            speed: 0.2
        }
        this.init()
    }

    init() {
        const { canvas } = this;
        this.scene = new Scene();

        this.camera = new OrthographicCamera(window.innerWidth / -50, window.innerWidth / 50, window
            .innerHeight / 50, window.innerHeight / -50, 0, 5000);
        this.camera.position.set(100, 100, 100);
        this.camera.lookAt(this.cameraPros.current);

        this.renderer = new WebGLRenderer({
            canvas,
            antialias: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(this.background);


        let directionalLight = new DirectionalLight(0xffffff, 1.1);
        directionalLight.position.set(2, 10, 5);
        this.scene.add(directionalLight);
        let light = new AmbientLight(0xffffff, 0.3);
        this.scene.add(light)

        this.createCube();
        this.createCube();
        this.createJumper();
        this.updateCamera();
        canvas.addEventListener("mousedown", () => {
            this.handleMouseDown();
        });
        canvas.addEventListener("mouseup", () => {
            this.handleMouseUp()
        });
    };

    addSuccessFn(fn) {
        this.successCallback = fn
    };

    addFailedFn(fn) {
        this.failedCallback = fn;
    }
    //鼠标按下
    handleMouseDown() {
        if (!this.jumperStat.ready && this.jumper.scale.y > 0.02) {
            this.jumper.scale.y -= 0.01;//压缩块
            this.jumperStat.dirSpeed += 0.004;
            this.jumperStat.ySpeed += 0.008;
            this.render();
            requestAnimationFrame(() => {
                this.handleMouseDown()
            })
        }
    };
    //鼠标松开
    handleMouseUp() {
        this.jumperStat.ready = true;
        if (this.jumper.position.y >= 1) {
            if (this.jumper.scale.y < 1) {
                this.jumper.scale.y += 0.1;
            }
            if (this.nextDir == "left") {
                this.jumper.position.x -= this.jumperStat.dirSpeed;
            } else {
                this.jumper.position.z -= this.jumperStat.dirSpeed;
            }
            this.jumper.position.y += this.jumperStat.ySpeed;
            this.jumperStat.ySpeed -= 0.01;
            this.render();
            requestAnimationFrame(() => {
                this.handleMouseUp();
            })
        } else {
            // 落点
            this.jumperStat.ready = false;
            this.jumperStat.dirSpeed = 0;
            this.jumperStat.ySpeed = 0;
            this.jumper.position.y = 1;
            this.jumper.scale.y = 1;
            this.checkInCube();//检测落在哪里
            if (this.falledStat.location == 1) {
                this.score++;
                this.createCube();
                this.updateCamera();
                if (this.successCallback) {
                    this.successCallback();
                }
            } else {
                this.falling()
            }
        }
    };
    //检测落在哪里
    //-1   -10从当前盒子掉落
    //1 下一个盒子上 10从下一个盒子上掉落
    //0没有落在盒子上
    checkInCube() {
        let distanceCur, distanceNext;
        //当前盒子距离    下一个盒子距离
        let should = (this.jumperWidth + this.cubeWidth) / 2;
        //
        if (this.nextDir == "left") {
            //往左走了
            distanceCur = Math.abs(this.jumper.position.x - this.cubes[this.cubes.length - 2].position.x);
            distanceNext = Math.abs(this.jumper.position.x - this.cubes[this.cubes.length - 1].position.x);
        } else {
            //往右走了
            distanceCur = Math.abs(this.jumper.position.z - this.cubes[this.cubes.length - 2].position.z);
            distanceNext = Math.abs(this.jumper.position.z - this.cubes[this.cubes.length - 1].position.z);
        }
        if (distanceCur < should) {
            //落在当前块
            this.falledStat.distance = distanceCur;
            this.falledStat.location = distanceCur < this.cubeWidth / 2 ? -1 : -10;
        } else if (distanceNext < should) {
            //落在下一个块上
            this.falledStat.distance = distanceNext;
            this.falledStat.location = distanceNext < this.cubeWidth / 2 ? 1 : 10;
        } else {
            //落在中间
            this.falledStat.location = 0;
        }
    };
    //下落过程
    falling() {
        if (this.falledStat.location == 10) {
            //从下一个盒子落下
            if (this.nextDir == "left") {
                //判断左方向
                if (this.jumper.position.x > this.cubes[this.cubes.length - 1].position.x) {
                    this.fallingRotate("leftBottom")
                } else {
                    this.fallingRotate("leftTop")
                }
            } else {
                //判断右方向
                if (this.jumper.position.z > this.cubes[this.cubes.length - 1].position.z) {
                    this.fallingRotate("rightBottom")
                } else {
                    this.fallingRotate("rightTop")
                }
            }
        } else if (this.falledStat.location == -10) {
            //从当前盒子落下
            if (this.nextDir == "left") {
                this.fallingRotate("leftTop")
            } else {
                this.fallingRotate("rightTop")
            }
        } else if (this.falledStat.location == 0) {
            this.fallingRotate("none")
        }
    };
    //落下旋转
    fallingRotate(dir) {
        let offset = this.falledStat.distance - this.cubeWidth / 2;//中间
        let rotateAxis = dir.includes("left") ? 'z' : "x";//以什么轴转
        let rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
        let rotateTo = this.jumper.rotation[rotateAxis] < Math.PI / 2;
        let fallingTo = this.ground + this.jumperWidth / 2 + offset;
        if (dir === 'rightTop') {
            rotateAdd = this.jumper.rotation[rotateAxis] - 0.1;
            rotateTo = this.jumper.rotation[rotateAxis] > -Math.PI / 2;
        } else if (dir === 'rightBottom') {
            rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
            rotateTo = this.jumper.rotation[rotateAxis] < Math.PI / 2;
        } else if (dir === 'leftBottom') {
            rotateAdd = this.jumper.rotation[rotateAxis] - 0.1;
            rotateTo = this.jumper.rotation[rotateAxis] > -Math.PI / 2;
        } else if (dir === 'leftTop') {
            rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
            rotateTo = this.jumper.rotation[rotateAxis] < Math.PI / 2;
        } else if (dir === 'none') {
            rotateTo = false;
            fallingTo = this.ground;
        } else {
            throw Error('Arguments Error')
        }
        if (!this.fallingStat.end) {
            if (rotateTo) {
                this.jumper.rotation[rotateAxis] = rotateAdd
            } else if (this.jumper.position.y > fallingTo) {
                this.jumper.position.y -= 0.2;
            } else {
                this.fallingStat.end = true;
            }
            this.render();
            requestAnimationFrame(() => {
                this.falling()
            })
        } else {
            if (this.failedCallback) {
                this.failedCallback()
            }
        }
    };
    //创建块
    createCube() {
        let geometry = new BoxGeometry(this.cubeWidth, this.cubeHeight, this.cubeDeep);
        let material = new MeshLambertMaterial({
            color: this.cubeColor
        });
        let cube = new Mesh(geometry, material); //合并在一起
        if (this.cubes.length) {
            cube.position.x = this.cubes[this.cubes.length - 1].position.x;
            cube.position.z = this.cubes[this.cubes.length - 1].position.z;
            this.nextDir = Math.random() > 0.5 ? "left" : "right";
            if (this.nextDir == "left") {
                cube.position.x = cube.position.x - Math.round(Math.random() * 4 + 6);
            } else {
                cube.position.z = cube.position.z - Math.round(Math.random() * 4 + 6);
            }
        }
        this.cubes.push(cube);
        if (this.cubes.length > 5) {
            this.scene.remove(this.cubes.shift());
        }
        this.scene.add(cube);
        if (this.cubes.length > 1) {
            this.updateCameraPros();
        }
    };
    //跳块
    createJumper() {
        let geometry = new BoxGeometry(this.jumperWidth, this.jumperHeight, this
            .jumperDeep);
        let material = new MeshLambertMaterial({
            color: this.jumperColor
        });
        this.jumper = new Mesh(geometry, material);
        this.jumper.position.y = 1;
        geometry.translate(0, 1, 0);
        this.scene.add(this.jumper);
    }
    //改变相机的镜头
    updateCamera() {
        let cur = {
            x: this.cameraPros.current.x,
            y: this.cameraPros.current.y,
            z: this.cameraPros.current.z,
        };
        let next = {
            x: this.cameraPros.next.x,
            y: this.cameraPros.next.y,
            z: this.cameraPros.next.z,
        };
        if (cur.x > next.x || cur.z > next.z) {
            this.cameraPros.current.x -= 0.1;
            this.cameraPros.current.z -= 0.1;
            if (this.cameraPros.current.x - this.cameraPros.next.x < 0.05) {
                this.cameraPros.current.x = this.cameraPros.next.x;
            } else if (this.cameraPros.current.z - this.cameraPros.next.z < 0.05) {
                this.cameraPros.current.z = this.cameraPros.next.z;
            }
        };
        this.camera.lookAt(new Vector3(cur.x, 0, cur.z));
        this.render();
        requestAnimationFrame(() => {
            this.updateCamera();
        })
    };
    //更新镜头位置
    updateCameraPros() {
        let lastIndex = this.cubes.length - 1;
        let pointA = {
            x: this.cubes[lastIndex].position.x,
            z: this.cubes[lastIndex].position.z,
        };
        let pointB = {
            x: this.cubes[lastIndex - 1].position.x,
            z: this.cubes[lastIndex - 1].position.z,
        };
        this.cameraPros.next = new Vector3((pointA.x + pointB.x) / 2, 0, (pointA.z + pointB.z) / 2);
    };
    //设置size
    setSize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    };
    render() {
        this.renderer.render(this.scene, this.camera);
    };

    restart() {
        this.cameraPros = {
            current: new Vector3(0, 0, 0),
            next: new Vector3()
        };
        this.fallingStat = {
            end: false,
            speed: 0.2
        };
        let length = this.cubes.length;
        this.scene.remove(this.jumper);
        for (let i = 0; i < length; i++) {
            this.scene.remove(this.cubes.shift());
        }
        this.score = 0;
        this.successCallback(this.score);
        this.createCube();
        this.createCube();
        this.createJumper();
        this.updateCamera();
    };
}
