import * as THREE from 'three';
import Ammo from "../Ammo/ammo.js";
import Platform from './Platform';
import Player from './Player';
import Obstacle from './Obstacle.js';
import ObstacleSpawner from './ObstacleSpawner.js';
import PlatformHandler from './PlatformHandler.js';
import CollectableSpawner from './CollectableSpawner.js';
import Impostor from './Impostor.js';
import { Tween, Group, Easing } from '@tweenjs/tween.js';
import DeadPlayer from './DeadPlayer.js';
import { soundEffects } from '../data.js';

const keys = {
    a: "KeyA",
    s: "KeyS",
    d: "KeyD",
    space: "Space"
};

export default class Game
{
    constructor(canvasRef,width,height,models,textures,refs)
    {
        this.canvas = canvasRef.current;
        this.width = width;
        this.height = height;
        this.models = models;
        this.textures = textures;
        this.shapes = {};

        this.isMobile = document.body.classList.contains("mobile");

        this.refs = refs;

        this.abortController = new AbortController();

        this.gameObjects = [];
        this.timers = [];
        this.active = true;
        this.requestReposition = false;
        this.platformHeight = 2;
        
        this.initPhysics();
        
        this.states = {
            STARTING: -1,
            STARTED: 0,
            RUNNING: 1,
            LOST: 2
        };

        this.defaultRate = 0.8;
        this.rate = this.defaultRate;
        this.score = 0;
        this.coinCount = 0;

        this.deltaTime = 0;

        this.tweenGroup = new Group();

        this.maxScoreTicks = 10;
        this.scoreTicks = this.maxScoreTicks;
        this.startDelay = 750;

        this.debugCounter = 0;
        
        this.endScreenShown = false;
    }

    initScene()
    {
        const bgColor = "#010C30";
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(bgColor);
        this.scene.fog = new THREE.Fog(bgColor, 80, 120);

        this.camera = new THREE.PerspectiveCamera(
            75,this.width / this.height, 0.5, 400
        );
        this.camera.rotateY(-Math.PI/2);
        this.camera.rotateX(-Math.PI/8);

        this.renderer = new THREE.WebGLRenderer({ canvas:this.canvas, antialias: true });
        
        this.renderer.setPixelRatio(window.devicePixelRatio/(this.isMobile ? 2 : 1.5));
        this.renderer.setSize(this.width, this.height);

        this.renderer.toneMapping = THREE.NeutralToneMapping;
        this.renderer.toneMappingExposure = 1.25;

        this.renderer.shadowMap.enabled = !this.isMobile;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.renderer.shadowMap.bias = 0.001;

        this.ambientLight = new THREE.AmbientLight("white",1);
        this.scene.add(this.ambientLight);
        this.directionalLight = new THREE.DirectionalLight("white",2);
        this.directionalLight.position.set(0,20,-20);

        this.setLightShadow(this.directionalLight);

        this.scene.add(this.directionalLight);

        if(!this.isMobile) this.initBackground();

        this.endScreenOverlay = new THREE.Mesh(
            new THREE.PlaneGeometry(5,5),
            new THREE.MeshBasicMaterial({color: "black",side:THREE.DoubleSide,transparent:true,depthTest:false})
        );
        this.endScreenOverlay.rotateX(-Math.PI/2);
        this.endScreenOverlay.visible = false;
        this.scene.add(this.endScreenOverlay);

    }

    async initPhysics()
    {
        this.physicsWorld;
        this.clock = new THREE.Clock();

        await Ammo().then((Ammo)=>{
            this.ammo = Ammo;

            this.physicsTransform = new Ammo.btTransform();
            let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
            let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
            let broadphase = new Ammo.btDbvtBroadphase();
            let solver = new Ammo.btSequentialImpulseConstraintSolver();
            this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
            this.physicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0)); // Set gravity

            this.initColliderShapes();

            this.initScene();
            this.initEvents();

            this.start();
            this.loop();
        });
        

    }

    initEvents()
    {
        if(document.body.classList.contains("mobile"))
        {
            window.addEventListener("touchstart",(e)=>{

                if(this.currentState !== this.states.RUNNING) return;

                this.touchStartCoods = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
            },{signal:this.abortController.signal});

            window.addEventListener("touchend",(e)=>{

                if(this.currentState !== this.states.RUNNING) return;

                const touchEndCoords = {
                    x: e.changedTouches[0].clientX,
                    y: e.changedTouches[0].clientY
                };

                const touchDistance = {
                    x: touchEndCoords.x - this.touchStartCoods.x,
                    y: touchEndCoords.y - this.touchStartCoods.y
                };

                if(Math.abs(touchDistance.x) < 50)
                {
                    touchDistance.x = 0;
                }
                else if(Math.abs(touchDistance.y) < 50)
                {
                    touchDistance.y = 0;
                }

                const k = Math.abs(touchDistance.x) > Math.abs(touchDistance.y) ? ["x","y"] : ["y","x"];
                const funcs = {
                    x: [()=>this.player.move(1),()=>this.player.move(-1)],
                    y: [()=>this.player.sweep(),()=>this.player.jump()]
                }
                
                if(touchDistance[k[0]] > 0) funcs[k[0]][0]();
                else if(touchDistance[k[0]] < 0) funcs[k[0]][1]();
                else if(touchDistance[k[1]] > 0) funcs[k[1]][0]();
                else if(touchDistance[k[1]] < 0) funcs[k[1]][1]();


            },{signal:this.abortController.signal});
        }
        else
        {
            window.addEventListener("keydown",(e)=>{
                if(this.currentState === this.states.RUNNING)
                {
                    switch (e.code)
                    {
                        case keys.space:
                            this.player.jump();
                            break;
                        case keys.a:
                            this.player.move(-1);
                            break;
                        case keys.d:
                            this.player.move(1);
                            break;
                        case keys.s:
                            this.player.sweep();
                            break;
                    
                        default:
                            break;
                    }
                }
                else if(this.currentState === this.states.STARTING)
                {
                    if(e.code===keys.space)
                    {
                        this.startRun();
                    }
                }
    
            },{signal:this.abortController.signal});
        }
    }

    initColliderShapes()
    {
        const modelEntries = Object.entries(this.models);
        for (let i = 0; i < modelEntries.length; i++)
        {
            const [modelName,model] = modelEntries[i];
            if(model.isObject3D && modelName.includes("collider")) this.shapes[modelName] = this.getTriangleMesh(model);   
        }
    }

    initBackground()
    {
        
        this.backgroundMesh = this.models["space-background"].clone();

        for (let i = 0; i < 3; i++)
        {
            const spaceTexture = this.textures[`space-${i}.png`];
            spaceTexture.wrapS = THREE.MirroredRepeatWrapping;
            spaceTexture.repeat.x = 1;

            this.backgroundMesh.children[0].material[i] = new THREE.MeshPhongMaterial({
                map: spaceTexture,
                transparent: true,
                alphaTest: 0.5,
                side: THREE.DoubleSide,
                emissiveMap: spaceTexture,
                emissive: new THREE.Color("white"),
                emissiveIntensity: i<2 ? 1 : 0.15,
                fog: false
            });            
            
        }


        this.scene.add(this.backgroundMesh);
    }

    setLightShadow(light)
    {
        light.castShadow = true;

        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 200;
        light.shadow.bias = -0.005;
  
        var side = 100;
        light.shadow.camera.top = side;
        light.shadow.camera.bottom = -side;
        light.shadow.camera.left = side;
        light.shadow.camera.right = -side;
    }

    restart = () =>
    {
        this.end();
        this.start();
    }

    start = () =>
    {        
        this.setGameState(this.states.STARTING);

        this.score = 0;
        this.coinCount = 0;
        this.rate = this.defaultRate;
        this.active = true;
        this.player = new Player(this);
        this.impostor = new Impostor(this);
        this.deadPlayer = new DeadPlayer(this);
        
        this.platformHandler = new PlatformHandler(this);
        this.obstacleSpawner = new ObstacleSpawner(this);
        this.collectableSpawner = new CollectableSpawner(this);

        this.cameraLerpRate = 0.1;
        this.camera.position.set(-5,5,0);

        this.updateLightPosition();

    }

    startRun = () =>
    {
        this.setGameState(this.states.STARTED);
        this.player.startRun();
        this.tweenGroup.add(new Tween(this.camera.position,true).to({x:-8,y:8,z:0},350).easing(Easing.Cubic.InOut));
        this.tweenGroup.add(new Tween(this.camera.rotation,true).to({y:-Math.PI/4},350).easing(Easing.Cubic.InOut));

        setTimeout(() => {
            this.setGameState(this.states.RUNNING);
            this.tweenGroup.add(new Tween(this.camera.rotation,true).to({y:-Math.PI/2.5},1000).easing(Easing.Cubic.Out));
        
            this.player.startRunAfterDelay();
            this.impostor.startRunAfterDelay();
        }, this.startDelay);
    }

    lose = () =>
    {
        this.setGameState(this.states.LOST);
    }

    end = () =>
    {
        this.active = false;
        for (let i = 0; i < this.gameObjects.length; i++)
        {
            this.gameObjects[i].remove();   
        }
        this.gameObjects = [];

        this.tweenGroup.removeAll();
    }    

    loop = (now) =>
    {

        if(!this.active) return;

        this.deltaTime = this.clock.getDelta();
        
        requestAnimationFrame(this.loop);
        
        const currentGameObjects = [...this.gameObjects];
        for (let i = 0; i < currentGameObjects.length; i++)
        {
            currentGameObjects[i].update();  
        }

        this.gameObjects = this.gameObjects.filter((g) => g.alive);

        if(this.debugCounter === 0)
        {
            if(this.refs.debugLabelRef?.current) this.refs.debugLabelRef.current.textContent = `FPS: ${(1/this.deltaTime).toFixed(2)}`;
            this.debugCounter = 20;
        }
        else this.debugCounter--;
      
        if(this.currentState === this.states.RUNNING)
        {
            this.updateCameraPosition();
            if(!this.isMobile) this.updateLightPosition();

            if(this.rate < 2)
            {
                this.rate += 0.00005;
                // console.log(this.rate);
            }
            else
            {
                console.log("reached max speed");
            }

            if(this.scoreTicks > 0)
            {
                this.scoreTicks -= this.deltaTime * 60;
            }
            else
            {
                this.score = parseInt(this.player.origin.x/10)*10;
                this.updateScore();
                this.scoreTicks = this.maxScoreTicks;
            }
        }

        for (let i = 0; i < this.timers.length; i++)
        {
            this.timers[i].execute(); 
        }

        if(!this.isMobile) this.updateBackground();

            
        this.physicsWorld.stepSimulation(this.deltaTime,5,1/60);
        this.renderer.render(this.scene, this.camera);
        this.tweenGroup.update(now,false);

        this.player.handleColliderSwap();
        this.impostor.handleColliderSwap();

    }

    dispose()
    {
        this.renderer.dispose();
        this.scene.clear();
        this.abortController.abort();
    }

    updateCameraPosition()
    {
        if(this.cameraLerpRate < 1)
        {
            this.cameraLerpRate = THREE.MathUtils.lerp(this.cameraLerpRate,1,this.deltaTime/2);
        }
        this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x,this.player.mesh.position.x - 10,this.cameraLerpRate);
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y,this.player.mesh.position.y + 6,this.cameraLerpRate/4);
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z,this.player.mesh.position.z,0.25);
    }

    updateLightPosition()
    {
        this.directionalLight.position.set(this.player.mesh.position.x,100,0);
        this.directionalLight.target.position.set(this.player.mesh.position.x,75,0);
        this.directionalLight.target.updateMatrixWorld();
    }

    updateBackground()
    {
        this.backgroundMesh.position.set(this.camera.position.x,10,0);
        for (let i = 0; i < 3; i++)
        {
            this.backgroundMesh.children[0].material[i].map.offset.x += 0.005 / (i+1) * this.deltaTime * 20;
        }
    }

    showEndScreen()
    {
        if(!this.endScreenShown)
        {
            this.endScreenShown = true;

            this.camera.position.copy(this.player.mesh.position);
            this.camera.position.y += 5;
            this.camera.position.x -= 2;
            this.camera.rotation.copy(new THREE.Euler(-Math.PI/2,0,0));

            this.endScreenOverlay.position.copy(this.camera.position);
            this.endScreenOverlay.position.y -= 0.5;
            this.endScreenOverlay.visible = true;

            this.impostor.setVisible(false);
            this.player.setVisible(false);

            this.deadPlayer.mesh.position.copy(this.player.mesh.position);
            this.deadPlayer.mesh.position.x -= 2;
            this.deadPlayer.setVisible(true);

            this.directionalLight.color = new THREE.Color("red");

            this.playSound("dead");


            setTimeout(() => {
                let tween = new Tween(this.camera.position,true).to({y:this.camera.position.y+5},2500);
                this.tweenGroup.add(tween);

                tween = new Tween(this.endScreenOverlay.position,true).to({y:this.endScreenOverlay.position.y+5},2500);
                this.tweenGroup.add(tween);

                tween = new Tween(this.endScreenOverlay.material,true).to({opacity:0},500);
                this.tweenGroup.add(tween);

                setTimeout(() => {
                    
                    tween = new Tween(this.endScreenOverlay.material,true).to({opacity:1},500);
                    this.tweenGroup.add(tween);

                    setTimeout(() => {

                        this.hideEndScreen();
                        this.restart();
                        
                    }, 1100);
                    
                }, 1500);

            }, 750);
        }
    }

    hideEndScreen()
    {
        this.endScreenShown = false;

        this.camera.rotation.copy(new THREE.Euler(0,0,0));
        this.camera.rotateY(-Math.PI/2);
        this.camera.rotateX(-Math.PI/8);

        this.endScreenOverlay.visible = false;

        this.impostor.setVisible(true);
        this.player.setVisible(true);
        this.deadPlayer.setVisible(false);

        this.directionalLight.color = new THREE.Color("white");

    }

    getTriangleMesh(object)
    {
        const ammo = this.ammo;
        const triangleMesh = new ammo.btTriangleMesh();

        object.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                const vertices = geometry.attributes.position.array;
    
                for (let i = 0; i < vertices.length; i += 9) {
                    // Add each triangle of the geometry to the triangle mesh
                    const v0 = new ammo.btVector3(vertices[i], vertices[i + 1], vertices[i + 2]);
                    const v1 = new ammo.btVector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
                    const v2 = new ammo.btVector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);
                    triangleMesh.addTriangle(v0, v1, v2, true);  // `true` to enable collision between vertices
                }
            }
        });

        return triangleMesh;
    }

    reposition()
    {
        this.requestReposition = false;
        const distance = this.player.mesh.position.x;
        this.gameObjects.forEach((gameObject)=>{

            if(!gameObject.mesh && !gameObject.hasPhysics) return;

            const origin = gameObject.getOrigin();
            if(gameObject === this.player)
            {
                gameObject.setOrigin(0,origin.y,origin.z);
                this.player.updateMeshPosition();
            }
            else if(gameObject.rigidBody)
            {
                gameObject.updatePhysics();
            }
        });

    }

    updateScore()
    {
        this.refs.scoreLabelRef.current.textContent = this.score;
    }

    updateCoinCount()
    {
        this.refs.coinCountRef.current.textContent = this.coinCount; 
    }

    setGameState(gameState)
    {
        this.currentState = gameState;
        this.refs.setGameState(gameState);
    }



    playSound(sound,looping=false)
    {
        let element = this.addElement(`<audio autoplay src="${soundEffects[sound]}" ${looping ? "loop" : ""}></audio>`);
        if(!looping)
        {
            element.onended = function()
            {
                element.remove();
            };
        }
        this.refs.audioContainerRef.current.appendChild(element);

        return element;
    }

    addElement(html)
    {
        let temp = document.createElement('template');
        html = html.trim();
        temp.innerHTML = html;
        return temp.content.firstChild;
    }


}