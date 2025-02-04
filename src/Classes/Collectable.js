import * as THREE from 'three';
import GameObject from "./GameObject";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Easing, Tween } from '@tweenjs/tween.js';

export default class Collectable extends GameObject
{
    constructor(game,xPosition)
    {
        super(game);
        
        const lanePosition = [-1,0,1][Math.floor(Math.random()*3)]*5;

        this.mesh = this.game.models.coin.clone();
        this.mesh.children[0].material = this.mesh.children[0].material.clone();
        this.mesh.children[0].material.map = this.game.textures["coin.png"];
        this.addMesh();

        this.origin = {x:xPosition,y:50,z:lanePosition};
        this.mesh.position.set(this.origin.x,this.origin.y,this.origin.z);
        this.mesh.scale.set(0.75,0.75,0.75);

        const m = this.mesh.children[0].material;
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
        super.update();

        this.animate();
        
        if(this.game.player.mesh?.position.x - this.mesh.position.x > 20)
        {
            this.remove();
        }

        if(this.mesh.position.distanceTo(this.game.player.mesh.position) < 1 && !this.collected)
        {
            this.collected = true;
            this.game.coinCount++;
            this.game.updateCoinCount();
            // const newScale = 1;
            // this.game.tweenGroup.add(new Tween(this.mesh.scale,true).to({x:newScale,y:newScale,z:newScale},150).easing(Easing.Cubic.Out));
            this.game.tweenGroup.add(new Tween(this.mesh.position,true).to({y:this.mesh.position.y+2},150).easing(Easing.Cubic.Out));
            this.game.tweenGroup.add(new Tween(this.mesh.children[0].material,true).to({opacity:0},150).onComplete(()=>this.remove()));

            this.game.playSound("coin");
        }


    }

    animate()
    {
        this.mesh.rotation.y -= Math.PI/180;
        this.delta = (this.delta+2)%360;
        if(!this.collected)
        {
            const newY = this.origin.y + Math.sin(this.delta*Math.PI/180)*0.35;
            this.mesh.position.y = newY;
        }
    }

    setCollectablePosition()
    {
        const ammo = this.game.ammo;

        const origin = this.mesh.position;

        const rayStart = new ammo.btVector3(origin.x,origin.y,origin.z);
        const rayEnd = new ammo.btVector3(origin.x,origin.y-60,origin.z);

        const rayCallback = new ammo.AllHitsRayResultCallback(rayStart, rayEnd);

        
        this.game.physicsWorld.rayTest(rayStart, rayEnd, rayCallback);
        
        
        if(rayCallback.hasHit())
        {
            const hitPointsArray = rayCallback.get_m_hitPointWorld();
            const hitPoints = Array.from({length:hitPointsArray.size()}).map((x,i)=>hitPointsArray.at(i));
            
            const hitPoint = hitPoints.reduce((a,b)=>{
                return a.y() > b.y() ? a : b;
            });
            
            const hitPosition = {
                x: hitPoint.x(),
                y: hitPoint.y(),
                z: hitPoint.z(),
            };


            if(hitPosition.y < 0)
            {
                hitPosition.y += 2.5;
            }

            hitPosition.y += 1.5;
            this.origin = hitPosition;
            this.mesh.position.set(this.origin.x,this.origin.y,this.origin.z);
        }
    }

}