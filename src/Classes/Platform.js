import * as THREE from 'three';
import GameObject from "./GameObject"
import { SkeletonUtils } from 'three/examples/jsm/Addons.js';
import { collisionGroup } from '../data';

export default class Platform extends GameObject
{
    constructor(game,platformSize)
    {
        super(game);
        this.className = "Platform";

        this.size = [platformSize,this.game.platformHeight,20];
        
        this.mesh = game.models.corridor.clone();
        
        this.addMesh();

        this.mesh.castShadow = false;
        this.mesh.receiveShadow = true;

        this.mesh.traverse((child) => {
            if(child.isMesh)
            {
                child.castShadow = false; 
                child.receiveShadow = true;
            }
        });

        const shape = new this.game.ammo.btBvhTriangleMeshShape(this.game.shapes["corridor-collider"], true, true);

        this.addPhysicsObject(shape,0,1,collisionGroup.PLATFORM);

    }
}