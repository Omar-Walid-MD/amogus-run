import * as THREE from 'three';
import GameObject from "./GameObject";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Easing, Tween } from '@tweenjs/tween.js';
import { collisionGroup } from '../data';

export default class Collectable extends GameObject
{
    constructor(game,xPosition)
    {
        super(game);
        this.className = "Collectable";
        
        const lanePosition = [-1,0,1][Math.floor(Math.random()*3)]*5;

        this.mesh = this.game.models.coin.clone();
        this.addMesh();

        this.origin = {x:xPosition,y:10,z:lanePosition};
        this.mesh.position.set(this.origin.x,this.origin.y,this.origin.z);
        this.mesh.scale.set(0.75,0.75,0.75);

        const onBeforeCompile = this.mesh.children[0].material.onBeforeCompile;
        this.mesh.children[0].material = this.mesh.children[0].material.clone();
        const m = this.mesh.children[0].material;
        m.onBeforeCompile = onBeforeCompile;
        m.emissiveMap = this.game.textures["coin-emission.png"].clone();
        m.emissive = new THREE.Color("gold");
        m.emissiveIntensity = 0.75;
        m.side = THREE.DoubleSide;
        m.transparent = true;

        this.setCollectablePosition();

        this.delta = 0;

        this.collected = false;
    }

    update()
    {
        this.animate();
        
        if(this.game.currentState === this.game.states.RUNNING)
        {
            if(this.game.player.mesh?.position.x - this.mesh.position.x > 20)
            {
                this.remove();
            }
    
            if(this.mesh.position.distanceTo(this.game.player.mesh.position) < 1.5 && !this.collected)
            {
                this.collected = true;
                this.game.coinCount++;
                this.game.updateCoinCount();
                this.game.tweenGroup.add(new Tween(this.mesh.position,true).to({y:this.mesh.position.y+2},150).easing(Easing.Cubic.Out));
                this.game.tweenGroup.add(new Tween(this.mesh.children[0].material,true).to({opacity:0},150).onComplete(()=>this.remove()));
    
                this.game.playSound("coin");
            }
        }
    }

    animate()
    {
        this.mesh.rotation.y -= Math.PI/180 * 100 * this.game.deltaTime;
        this.delta = (this.delta+100*this.game.deltaTime)%360;
        if(!this.collected)
        {
            const newY = this.origin.y + Math.sin(this.delta*Math.PI/180)*0.35;
            this.mesh.position.y = newY;
        }
    }

    setCollectablePosition()
    {
        const raycaster = new THREE.Raycaster();
        raycaster.set(this.mesh.position,new THREE.Vector3(0,-1,0));

        const intersects = raycaster.intersectObjects(this.game.scene.children);
        let point = Math.max(...intersects.map((i)=>i.point.y));

        point += 1.5;
        this.origin.y = point;
        this.mesh.position.set(this.origin.x,this.origin.y,this.origin.z);
    }

}