import * as THREE from 'three';
import GameObject from "./GameObject";
import { collisionGroup } from '../data';

export default class DeadPlayer extends GameObject
{
    constructor(game)
    {
        super(game);

        this.mesh = game.models.dead.clone();
        this.mesh.scale.set(0.35,0.35,0.35);
        this.mesh.rotateZ(Math.PI/2);
        this.mesh.rotateY(Math.PI);
        
        this.addMesh();

        this.setVisible(false);
    }

}