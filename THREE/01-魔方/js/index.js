/*
 * @Author: h-huan
 * @Date: 2022-11-30 11:39:39
 * @LastEditors: h-huan
 * @LastEditTime: 2022-12-02 17:08:57
 * @Description: 
 */
import { Scene, PerspectiveCamera, AmbientLight, Raycaster, AxesHelper, WebGLRenderer, Vector3, Vector2, Texture, MeshLambertMaterial, MeshBasicMaterial, Color, BoxGeometry, Mesh, Quaternion } from '../../jsm/three.module.js'
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

class RubikCube {
    constructor(canvas, arr) {
        // 将所有可枚举的自有属性从一个或多个源对象复制到目标对象
        Object.assign(this, defAttr(), arr)
        this.canvas = canvas
        this.width = canvas.width
        this.height = canvas.height
        this.cubes = [];    // 小魔方集合
        this.origPoint = new Vector3(0, 0, 0);
        this.mouse = new Vector2();
        this.isRotating = false;//魔方是否正在转动
        this.intersect; //碰撞光线穿过的元素
        this.normalize; //触发平面法向量
        this.startPoint;  // 触摸起始点
        this.movePoint;   // 触摸移动点
        this.initStatus = [];//魔方初始状态
        this.xLine = new Vector3(1, 0, 0);//X轴正方向
        this.xLineAd = new Vector3(-1, 0, 0);//X轴负方向
        this.yLine = new Vector3(0, 1, 0);//Y轴正方向
        this.yLineAd = new Vector3(0, -1, 0);//Y轴负方向
        this.zLine = new Vector3(0, 0, 1);//Z轴正方向
        this.zLineAd = new Vector3(0, 0, -1);//Z轴负方向
        this.init();

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
    init() {
        const { canvas, x, y, z, num, len, colors, origPoint } = this
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
        // this.controller.target = new Vector3(0, 0, 0);//设置控制点
        this.scene.add(this.light);
        this.scene.add(this.axesHelper);

        this.render();
        //监听鼠标事件   
        // 注意this指向的问题
        // this.newResize = this.startCube.bind(this);
        // this.startCube.bind(this)
        this.renderer.domElement.addEventListener('mousedown', this.startCube.bind(this), false);
        this.renderer.domElement.addEventListener('mousemove', this.moveCube.bind(this), false);
        this.renderer.domElement.addEventListener('mouseup', this.stopCube.bind(this), false);
        //监听触摸事件
        // this.renderer.domElement.addEventListener('touchstart', this.startCube, false);
        // this.renderer.domElement.addEventListener('touchmove', this.moveCube, false);
        // this.renderer.domElement.addEventListener('touchend', this.stopCube, false);

        // 模拟一道光源从屏幕点击点上开始，以相机结束位置结束。
        this.raycaster = new Raycaster()

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target = origPoint;
        // 生产魔方
        this.SimpleCube(x, y, z, num, len, colors);
        this.initObject();
    }
    // 生成透明正方形,来确定与魔方的碰撞面
    initObject() {
        let { scene, num, len } = this
        const cubegeoLen = num * len;
        const hex = 0x000000;
        let cubegeo = new BoxGeometry(cubegeoLen, cubegeoLen, cubegeoLen);
        // for (let i = 0; i < cubegeo.faces.length; i += 2) {
        //     cubegeo.faces[i].color.setHex(hex);
        //     cubegeo.faces[i + 1].color.setHex(hex);
        // }
        let cubemat = new MeshBasicMaterial({ vertexColors: Color, opacity: 0, transparent: true });
        let cube = new Mesh(cubegeo, cubemat);
        cube.name = 'coverCube';
        scene.add(cube);
    }
    // 生成魔方
    SimpleCube(x, y, z, num, len, colors) {
        // 最边上的坐标
        const { scene, faces, cubes } = this;
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
                cube.name = `${i}+${j}`
                //依次计算各个小方块中心点坐标
                cube.position.x = (leftUpX + len / 2) + (j % num) * len;
                cube.position.y = (leftUpY - len / 2) - parseInt(j / num) * len;
                cube.position.z = (leftUpZ - len / 2) - i * len;
                cubes.push(cube)
            }
        }

        for (var i = 0; i < cubes.length; i++) {
            let item = cubes[i];
            this.initStatus.push({
                x: item.position.x,
                y: item.position.y,
                z: item.position.z,
                cubeIndex: item.id,
            });
            item.cubeIndex = item.id;
            scene.add(cubes[i]); //并依次加入到场景中
        }


        this.cubes = cubes
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
    // 获取平面法向量
    getIntersects(event) {
        let { scene, camera, width, height, raycaster, mouse } = this
        // 转换坐标系    触摸事件和鼠标事件获得坐标的方式有点区别
        if (event.touches) {
            var touch = event.touches[0];
            mouse.x = (touch.clientX / width) * 2 - 1;
            mouse.y = -(touch.clientY / height) * 2 + 1;
        } else {
            mouse.x = (event.clientX / width) * 2 - 1;
            mouse.y = -(event.clientY / height) * 2 + 1;
        }
        // Raycaster方式定位选取元素，可能会选取多个，以第一个为准
        raycaster.setFromCamera(mouse, camera);
        let intersects = raycaster.intersectObjects(scene.children);
        if (intersects.length) {
            try {
                if (intersects[0].object.name === 'coverCube') {
                    this.intersect = intersects[1];
                    this.normalize = intersects[0].face.normal;
                } else {
                    this.intersect = intersects[0];
                    this.normalize = intersects[1].face.normal;
                }
            } catch (err) {
                //nothing
            }
        }
    }
    // 开始操作
    startCube(event) {
        this.getIntersects(event);
        const { isRotating, intersect } = this
        // 魔方没有处于转动过程中且存在碰撞物体
        if (!isRotating && intersect) {
            this.startPoint = intersect.point; //开始转动，设置起始点
            this.controls.enabled = false; //当刚开始的接触点在魔方上时操作为转动魔方，屏蔽控制器转动
        } else {
            this.controls.enabled = true; //当刚开始的接触点没有在魔方上或者在魔方上但是魔方正在转动时操作转动控制器
        }
    }

    // 魔方操作结束
    stopCube() {
        this.intersect = null;
        this.startPoint = null
    }
    // 获取转动方向
    getDirection(vector3) {
        // 先根据滑动时的两点确定转动向量，然后判断转动向量和这六个方向向量夹角最小的方向即为转动方向；
        const { xLine, xLineAd, yLine, yLineAd, zLine, zLineAd, normalize } = this
        //判断差向量和x、y、z轴的夹角
        const xAngle = vector3.angleTo(xLine);
        const xAngleAd = vector3.angleTo(xLineAd);
        const yAngle = vector3.angleTo(yLine);
        const yAngleAd = vector3.angleTo(yLineAd);
        const zAngle = vector3.angleTo(zLine);
        const zAngleAd = vector3.angleTo(zLineAd);
        const minAngle = this.min([xAngle, xAngleAd, yAngle, yAngleAd, zAngle, zAngleAd]);//最小夹角

        let direction
        switch (minAngle) {
            case xAngle:
                direction = 0; //向x轴正方向旋转90度（还要区分是绕z轴还是绕y轴）
                if (normalize.equals(yLine)) {
                    direction = direction + 0.1; //绕z轴顺时针
                } else if (normalize.equals(yLineAd)) {
                    direction = direction + 0.2;//绕z轴逆时针
                } else if (normalize.equals(zLine)) {
                    direction = direction + 0.3;//绕y轴逆时针
                } else {
                    direction = direction + 0.4;//绕y轴顺时针
                }
                break;
            case xAngleAd:
                direction = 1;//向x轴反方向旋转90度
                if (normalize.equals(yLine)) {
                    direction = direction + 0.1;//绕z轴逆时针
                } else if (normalize.equals(yLineAd)) {
                    direction = direction + 0.2;//绕z轴顺时针
                } else if (normalize.equals(zLine)) {
                    direction = direction + 0.3;//绕y轴顺时针
                } else {
                    direction = direction + 0.4;//绕y轴逆时针
                }
                break;
            case yAngle:
                direction = 2;//向y轴正方向旋转90度
                if (normalize.equals(zLine)) {
                    direction = direction + 0.1;//绕x轴逆时针
                } else if (normalize.equals(zLineAd)) {
                    direction = direction + 0.2;//绕x轴顺时针
                } else if (normalize.equals(xLine)) {
                    direction = direction + 0.3;//绕z轴逆时针
                } else {
                    direction = direction + 0.4;//绕z轴顺时针
                }
                break;
            case yAngleAd:
                direction = 3;//向y轴反方向旋转90度
                if (normalize.equals(zLine)) {
                    direction = direction + 0.1;//绕x轴顺时针
                } else if (normalize.equals(zLineAd)) {
                    direction = direction + 0.2;//绕x轴逆时针
                } else if (normalize.equals(xLine)) {
                    direction = direction + 0.3;//绕z轴顺时针
                } else {
                    direction = direction + 0.4;//绕z轴逆时针
                }
                break;
            case zAngle:
                direction = 4;//向z轴正方向旋转90度
                if (normalize.equals(yLine)) {
                    direction = direction + 0.1;//绕x轴顺时针
                } else if (normalize.equals(yLineAd)) {
                    direction = direction + 0.2;//绕x轴逆时针
                } else if (normalize.equals(xLine)) {
                    direction = direction + 0.3;//绕y轴顺时针
                } else {
                    direction = direction + 0.4;//绕y轴逆时针
                }
                break;
            case zAngleAd:
                direction = 5;//向z轴反方向旋转90度
                if (normalize.equals(yLine)) {
                    direction = direction + 0.1;//绕x轴逆时针
                } else if (normalize.equals(yLineAd)) {
                    direction = direction + 0.2;//绕x轴顺时针
                } else if (normalize.equals(xLine)) {
                    direction = direction + 0.3;//绕y轴逆时针
                } else {
                    direction = direction + 0.4;//绕y轴顺时针
                }
                break;
            default:
                break;
        }
        return direction
        // this.direction = direction
    }
    // 滑动操作魔方
    moveCube(event) {
        let { controls, intersect, isRotating, startPoint, movePoint } = this
        if (!controls.enabled && intersect) {
            this.getIntersects(event);
            if (!isRotating && startPoint) { //魔方没有进行转动且满足进行转动的条件
                movePoint = intersect.point;
                if (!movePoint.equals(startPoint)) { //和起始点不一样则意味着可以得到转动向量了
                    this.isRotating = true;//转动标识置为true
                    const sub = movePoint.sub(startPoint);//计算转动向量
                    const direction = this.getDirection(sub); //获得转动方向方向
                    const elements = this.getBoxs(intersect, direction);   //  根据运动方向获取运动元素
                    const startTime = new Date().getTime();
                    let rotateAnimation = this.rotateAnimation.bind(this);
                    window.requestAnimationFrame(function (timestamp) {
                        rotateAnimation(elements, direction, timestamp, 0);
                    });
                    // requestAnimFrame(
                }
            }
        }
        event.preventDefault();
    }
    // 绕着世界坐标系的某个轴旋转
    rotateAroundWorldY(obj, rad) {
        const x0 = obj.position.x;
        const z0 = obj.position.z;
        /**
         * 因为物体本身的坐标系是随着物体的变化而变化的，
         * 所以如果使用rotateZ、rotateY、rotateX等方法，
         * 多次调用后就会出问题，先改为Quaternion实现。
         * Quaternion 四元素，确定旋转
         */
        const q = new Quaternion();
        q.setFromAxisAngle(new Vector3(0, 1, 0), rad);
        obj.quaternion.premultiply(q);
        //obj.rotateY(rad);
        obj.position.x = Math.cos(rad) * x0 + Math.sin(rad) * z0;
        obj.position.z = Math.cos(rad) * z0 - Math.sin(rad) * x0;
    }
    rotateAroundWorldZ(obj, rad) {
        const x0 = obj.position.x;
        const y0 = obj.position.y;
        const q = new Quaternion();
        q.setFromAxisAngle(new Vector3(0, 0, 1), rad);
        obj.quaternion.premultiply(q);
        //obj.rotateZ(rad);
        obj.position.x = Math.cos(rad) * x0 - Math.sin(rad) * y0;
        obj.position.y = Math.cos(rad) * y0 + Math.sin(rad) * x0;
    }
    rotateAroundWorldX(obj, rad) {
        const y0 = obj.position.y;
        const z0 = obj.position.z;
        const q = new Quaternion();
        q.setFromAxisAngle(new Vector3(1, 0, 0), rad);
        obj.quaternion.premultiply(q);
        //obj.rotateX(rad);
        obj.position.y = Math.cos(rad) * y0 - Math.sin(rad) * z0;
        obj.position.z = Math.cos(rad) * z0 + Math.sin(rad) * y0;
    }
    // 旋转动画
    rotateAnimation(elements, direction, currentstamp, startstamp, laststamp) {
        let totalTime = 500;//转动的总运动时间
        if (startstamp === 0) {
            startstamp = currentstamp;
            laststamp = currentstamp;
        }
        if (currentstamp - startstamp >= totalTime) {
            currentstamp = startstamp + totalTime;
            this.isRotating = false;
            this.startPoint = null;
            this.updateCubeIndex(elements);
        }
        switch (direction) {
            //绕z轴顺时针
            case 0.1:
            case 1.2:
            case 2.4:
            case 3.3:
                for (let i = 0; i < elements.length; i++) {
                    this.rotateAroundWorldZ(elements[i], -90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
                }
                break;
            //绕z轴逆时针
            case 0.2:
            case 1.1:
            case 2.3:
            case 3.4:
                for (let i = 0; i < elements.length; i++) {
                    this.rotateAroundWorldZ(elements[i], 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
                }
                break;
            //绕y轴顺时针
            case 0.4:
            case 1.3:
            case 4.3:
            case 5.4:
                for (let i = 0; i < elements.length; i++) {
                    this.rotateAroundWorldY(elements[i], -90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
                }
                break;
            //绕y轴逆时针
            case 1.4:
            case 0.3:
            case 4.4:
            case 5.3:
                for (let i = 0; i < elements.length; i++) {
                    this.rotateAroundWorldY(elements[i], 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
                }
                break;
            //绕x轴顺时针
            case 2.2:
            case 3.1:
            case 4.1:
            case 5.2:
                for (let i = 0; i < elements.length; i++) {
                    this.rotateAroundWorldX(elements[i], 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
                }
                break;
            //绕x轴逆时针
            case 2.1:
            case 3.2:
            case 4.2:
            case 5.1:
                for (let i = 0; i < elements.length; i++) {
                    this.rotateAroundWorldX(elements[i], -90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
                }
                break;
            default:
                break;
        }
        if (currentstamp - startstamp < totalTime) {
            let rotateAnimation = this.rotateAnimation.bind(this);
            window.requestAnimationFrame(function (timestamp) {
                rotateAnimation(elements, direction, timestamp, startstamp, currentstamp);
            });
        }
    }
    // 更新位置索引
    updateCubeIndex(elements) {
        const { initStatus, len } = this
        for (let i = 0; i < elements.length; i++) {
            let temp1 = elements[i];
            for (let j = 0; j < initStatus.length; j++) {
                let temp2 = initStatus[j];
                if (Math.abs(temp1.position.x - temp2.x) <= len / 2 &&
                    Math.abs(temp1.position.y - temp2.y) <= len / 2 &&
                    Math.abs(temp1.position.z - temp2.z) <= len / 2) {
                    temp1.cubeIndex = temp2.cubeIndex;
                    break;
                }
            }
        }
    }
    // 获取索引移动方向
    getBoxs(target, direction) {
        const { cubes } = this
        let targetId = target.object.cubeIndex;
        const ids = [];
        for (let i = 0; i < cubes.length; i++) {
            ids.push(cubes[i].cubeIndex);
        }
        const minId = this.min(ids);
        targetId = targetId - minId;
        const numI = parseInt(targetId / 9);
        const numJ = targetId % 9;
        const boxs = [];
        //根据绘制时的规律判断 no = i*9+j
        switch (direction) {
            //绕z轴
            case 0.1:
            case 0.2:
            case 1.1:
            case 1.2:
            case 2.3:
            case 2.4:
            case 3.3:
            case 3.4:
                for (var i = 0; i < cubes.length; i++) {
                    var tempId = cubes[i].cubeIndex - minId;
                    if (numI === parseInt(tempId / 9)) {
                        boxs.push(cubes[i]);
                    }
                }
                break;
            //绕y轴
            case 0.3:
            case 0.4:
            case 1.3:
            case 1.4:
            case 4.3:
            case 4.4:
            case 5.3:
            case 5.4:
                for (var i = 0; i < cubes.length; i++) {
                    var tempId = cubes[i].cubeIndex - minId;
                    if (parseInt(numJ / 3) === parseInt(tempId % 9 / 3)) {
                        boxs.push(cubes[i]);
                    }
                }
                break;
            //绕x轴
            case 2.1:
            case 2.2:
            case 3.1:
            case 3.2:
            case 4.1:
            case 4.2:
            case 5.1:
            case 5.2:
                for (var i = 0; i < cubes.length; i++) {
                    var tempId = cubes[i].cubeIndex - minId;
                    if (tempId % 9 % 3 === numJ % 3) {
                        boxs.push(cubes[i]);
                    }
                }
                break;
            default:
                break;
        }
        return boxs;
    }

    // 获取数组中最小值
    min(arr) {
        var min = arr[0];
        for (var i = 1; i < arr.length; i++) {
            if (arr[i] < min) {
                min = arr[i];
            }
        }
        return min;
    }
}


export default RubikCube