import * as THREE from 'three';
import GameObject from "./GameObject";
import { collisionGroup } from '../data';

export default class Obstacle extends GameObject
{
    constructor(game,spawner,obstacleName,xPosition)
    {

        super(game);
        this.className = "Obstacle";

        this.spawner = spawner;
        this.obstacleName = obstacleName;
        
        this.mesh = game.models[obstacleName].clone();

        this.addMesh();

        const obstacleTexture = game.textures["obstacles.png"];

        this.mesh.traverse((child) => {
            if(child.isMesh)
            {
                if(child.material.length)
                {
                    child.material.forEach((m)=>{
                        m.map = obstacleTexture;
                    });
                }
                else child.material.map = obstacleTexture;
            }
        });


        const boundingBox = new THREE.Box3().setFromObject(this.mesh);
        this.height = boundingBox.max.y - boundingBox.min.y;


        this.mesh.rotation.set(0,-Math.PI,0,"XYZ");

        const shape = new this.game.ammo.btBvhTriangleMeshShape(this.game.shapes[obstacleName+"-collider"], true, true);
        
        const group = ["stand","barrel"].includes(obstacleName) ? (collisionGroup.OBSTACLE | collisionGroup.OBSTACLE_DODGE) : (collisionGroup.OBSTACLE | collisionGroup.OBSTACLE_COLLIDE);
        this.addPhysicsObject(shape,0,1,group,-1);

        this.setLanePosition(xPosition);
        
    }

    update()
    {
        if(!this.mesh.visible) return;

        if(this.game.currentState === this.game.states.RUNNING)
        {
            if(this.game.player.mesh?.position.x - this.mesh.position.x > 20)
            {
                this.mesh.visible = false;
                this.spawner.hiddenObstacles[this.obstacleName].push(this);
            }
        }

    }

    setLanePosition(xPosition)
    {
        const lanePosition = [-1,0,1][Math.floor(Math.random()*3)]*5;
        this.setOrigin(xPosition,this.game.platformHeight/2+this.height/2,lanePosition);
        this.updatePhysics();
    }
}