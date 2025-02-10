import * as THREE from 'three';
import GameObject from "./GameObject";
import { collisionGroup } from '../data';

export default class Obstacle extends GameObject
{
    constructor(game,spawner,obstacleName,xPosition,zPosition)
    {

        super(game);
        this.className = "Obstacle";

        this.spawner = spawner;
        this.obstacleName = obstacleName;
        this.height = this.game.platformHeight/2+this.spawner.obstacleHeights[obstacleName]/2;

        const shape = new this.game.ammo.btBvhTriangleMeshShape(this.game.shapes[obstacleName+"-collider"], true, true);
        
        this.matrixObject = new THREE.Object3D();
        // this.matrixObject.rotation.set(0,-Math.PI,0,"XYZ");

        this.updateMeshPosition(xPosition,this.height,0);

        const group = ["stand","barrel"].includes(obstacleName) ? (collisionGroup.OBSTACLE | collisionGroup.OBSTACLE_DODGE) : (collisionGroup.OBSTACLE | collisionGroup.OBSTACLE_COLLIDE);
        this.addPhysicsObject(this.matrixObject,shape,0,1,group,-1);
        
    }

    update()
    {
        // this.spawner.obstacleInstances[this.obstacleName].instanceMatrix.needsUpdate = true;
    }

    setOrigin(x,y,z)
    {
        if(this.hasPhysics)
        {
            this.transform.setOrigin(new this.game.ammo.btVector3(x,y,z));
            this.rigidBody.setWorldTransform(this.transform);

            if(this.rigidBody?.getMotionState())
            {
                this.rigidBody.getMotionState().setWorldTransform(this.transform);
            }
        }
    }

    updateMeshPosition(x,y,z)
    {
        this.matrixObject.position.set(x,y,z);
        this.matrixObject.updateMatrix();

        this.spawner.obstacleInstances[this.obstacleName].setMatrixAt(this.spawner.obstacleCounts[this.obstacleName],this.matrixObject.matrix);
        this.spawner.obstacleInstances[this.obstacleName].instanceMatrix.needsUpdate = true;
        this.spawner.obstacleCounts[this.obstacleName] = (this.spawner.obstacleCounts[this.obstacleName]+1)%this.spawner.totalInstances;
    }

    setLanePosition(xPosition,zPosition)
    {
        this.setOrigin(xPosition,this.height,zPosition);
        this.updateMeshPosition(xPosition,this.height,zPosition);
    }
}