import * as THREE from 'three';
import GameObject from "./GameObject";
import { SkeletonUtils } from 'three/examples/jsm/Addons.js';
import { collisionGroup } from '../data';

export default class Player extends GameObject
{
    constructor(game)
    {
        super(game);

        this.size = [0.5,1];

        const ammo = this.game.ammo;

        this.mainColliderShape = new ammo.btCapsuleShape(0.5,1);
        this.mainColliderTransform = new ammo.btTransform(); this.mainColliderTransform.setIdentity(); this.mainColliderTransform.setOrigin(new ammo.btVector3(0,0,0));
        
        this.sweepColliderShape = new ammo.btCapsuleShape(0.25,0.15);
        this.sweepColliderShape.setMargin(0.05);
        this.sweepColliderTransform = new ammo.btTransform(); this.sweepColliderTransform.setIdentity(); this.sweepColliderTransform.setOrigin(new ammo.btVector3(0,0,0));

        const gltf = game.models.amogus;

        this.mesh = SkeletonUtils.clone(gltf.scene);
        this.addMesh();

        this.mixer = new THREE.AnimationMixer(this.mesh);


        const clonedAnimations = gltf.animations.map((clip) => {
            return THREE.AnimationClip.parse(clip.toJSON());
        });
        this.getAnimations(clonedAnimations);

        this.mesh.scale.set(0.35,0.35,0.35);

        this.gravity = 30;

        this.initCharacterController();

        this.speed = 0.3;
        this.currentLane = 0;
        this.lastLane = 0;
        this.laneSpace = 5;
        this.jumping = false;
        this.strafing = false;
        this.sweeping = false;
        this.colliderSwapState = 0;
        this.velocity = {
            x: 0,
            y: 0,
            z: 0
        };

        this.canHit = true;

        this.crossfadeToAction("idle");
    
    }

    initCharacterController()
    {
        const ammo = this.game.ammo;
    
        this.ghostShape = new ammo.btCompoundShape();

        this.ghostShape.addChildShape(this.mainColliderTransform,this.mainColliderShape);
        this.ghostShape.addChildShape(this.sweepColliderTransform,this.sweepColliderShape);

        // Transform for the ghost object
        const ghostTransform = new ammo.btTransform();
        ghostTransform.setIdentity();
        ghostTransform.setOrigin(new ammo.btVector3(0, 2, 0)); // Initial position of the character
        
        const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,0,"XYZ"));
        ghostTransform.setRotation(new ammo.btQuaternion(quaternion.x,quaternion.y,quaternion.z,quaternion.w));

        // Create the ghost object
        this.ghostObject = new ammo.btPairCachingGhostObject();
        this.ghostObject.setWorldTransform(ghostTransform);
        this.ghostObject.setCollisionShape(this.ghostShape);
        this.ghostObject.setCollisionFlags(16); // Mark as kinematic
        this.ghostObject.setActivationState(4);
        this.ghostObject.activate(true);

        this.createCharacterController(0);
       
        this.game.physicsWorld.addCollisionObject(this.ghostObject,collisionGroup.PLAYER,collisionGroup.PLATFORM | collisionGroup.OBSTACLE);

    }

    createCharacterController(shapeIndex)
    {
        const ammo = this.game.ammo;

        if(this.characterController)
        {
            this.game.physicsWorld.removeAction(this.characterController);
            ammo.destroy(this.characterController);
        }

        const stepHeight = 0.25; // Maximum height the character can step over
        const upAxis = 1;        // Y-axis (default up axis in Bullet Physics)

        this.characterController = new ammo.btKinematicCharacterController(
            this.ghostObject,    // Ghost object for collision
            this.ghostShape.getChildShape(shapeIndex),     // Shape for collision
            stepHeight,     // Maximum step height
            upAxis          // Up axis
        );
        this.characterController.setUseGhostSweepTest(false);
        this.characterController.setUpInterpolate(true);
        this.characterController.setJumpSpeed(this.gravity/2);
        this.characterController.setMaxSlope(90 * Math.PI/180);
        this.characterController.setGravity(this.gravity);

        this.game.physicsWorld.addAction(this.characterController); 
    }

    getAnimations(animations)
    {
        const nonLoopingAnimations = ["hit","jump","left","right","sweep","start"];

        this.animations = {};
        animations.forEach((animation)=>{
            this.animations[animation.name] = this.mixer.clipAction(animation);
        });
        nonLoopingAnimations.forEach((animationName)=>{
            this.animations[animationName].loop = THREE.LoopOnce;
            this.animations[animationName].clampWhenFinished = true;
        })
    }


    update()
    {        
        const transform = this.ghostObject.getWorldTransform();
        const origin = transform.getOrigin();
        const lanePosition = this.currentLane*this.laneSpace;

        let newZVelocity = 0;

        if(this.strafing && this.game.currentState === this.game.states.RUNNING)
        {
            if(Math.abs(lanePosition-origin.z())>0.1)
            {
                const zDirection = Math.sign(lanePosition-origin.z())*this.speed;
                newZVelocity = zDirection;
            }
            else
            {
                this.setOrigin(origin.x(),origin.y(),lanePosition);
                this.velocity.z = 0;
                this.strafing = false;
                this.lastLane = this.currentLane;
                if(this.onGround())
                {
                    this.crossfadeToAction("walk",0.5);
                }
            }

            this.velocity.z = THREE.MathUtils.lerp(this.velocity.z,newZVelocity,0.6);
        }
        else
        {
            this.velocity.z = 0;
        }



        this.characterController.setWalkDirection(
            new this.game.ammo.btVector3(this.velocity.x*this.game.rate,this.velocity.y,this.velocity.z)
        );

        if(this.game.currentState === this.game.states.RUNNING)
        {
            this.checkHit();

            if(this.onGround())
            {
                if(!this.animations["walk"].isRunning() && !this.animations["start"].isRunning())
                {
                    if(!this.sweeping && !this.strafing)
                    {
                        this.crossfadeToAction("walk",0.2);
                    }
                }
                if(this.jumping)
                {
                    this.jumping = false;
                    if(this.sweeping)
                    {
                        this.velocity.y = 0;
                    }
                }
            }
        }

        this.mixer.update(0.025*this.game.rate);

        this.updateMeshPosition();

    }

    setOrigin(x,y,z)
    {
        const transform = this.ghostObject.getWorldTransform();
        transform.setOrigin(new this.game.ammo.btVector3(x,y,z));
    }

    getOrigin()
    {
        const origin = this.ghostObject.getWorldTransform().getOrigin();
        return new THREE.Vector3(origin.x(), origin.y(), origin.z());
    }

    updateMeshPosition()
    {
        const transform = this.ghostObject.getWorldTransform();

        const origin = transform.getOrigin();
        const position = new THREE.Vector3(origin.x(), origin.y(), origin.z());

        const rotation = transform.getRotation();
        const quaternion = new THREE.Quaternion(rotation.x(), rotation.y(), rotation.z(), rotation.w());

        this.mesh.position.copy(position);
        if(this.sweeping) this.mesh.position.y += 0.5;
        this.mesh.quaternion.copy(quaternion);

    }

    onGround()
    {
        const ammo = this.game.ammo;
        const transform = this.ghostObject.getWorldTransform();
        const origin = transform.getOrigin();

        const rayStart = new ammo.btVector3(origin.x(),origin.y(),origin.z());
        const rayEnd = new ammo.btVector3(origin.x(),origin.y()-1.5,origin.z());

        const rayCallback = new ammo.AllHitsRayResultCallback(rayStart, rayEnd);

        this.game.physicsWorld.rayTest(rayStart, rayEnd, rayCallback);

        return rayCallback.hasHit()
    }

    checkHit()
    {
        if(!this.canHit) return;
        
        const ammo = this.game.ammo;
        const transform = this.ghostObject.getWorldTransform();
        const origin = transform.getOrigin();

        const rayPositions = [
            [{x:-0.5,y:0.5,z:0},{x:1,y:0.5,z:0}],
            [{x:0,y:0.5,z:0},{x:0,y:0.5,z:0.8}],
            [{x:0,y:0.5,z:0},{x:0,y:0.5,z:-0.8}],
        ]

        for(let i = 0; i < rayPositions.length; i++)
        {
            const rayPosition = rayPositions[i];

            const start = rayPosition[0];
            const end = rayPosition[1];

            const rayStart = new ammo.btVector3(origin.x()+start.x,origin.y()+start.y,origin.z()+start.z);
            const rayEnd = new ammo.btVector3(origin.x()+end.x,origin.y()+end.y,origin.z()+end.z);
    
            const rayCallback = new ammo.AllHitsRayResultCallback(rayStart, rayEnd);
    
            this.game.physicsWorld.rayTest(rayStart, rayEnd, rayCallback,collisionGroup.RAY,collisionGroup.OBSTACLE);
    
            if(rayCallback.hasHit())
            {
                this.game.playSound("hit");
                if(i === 0)
                {
                    this.lose();
                    return;
                }
                else
                {
                    this.move(this.lastLane - this.currentLane);
                    this.currentLane = this.lastLane;
                    
                    if(this.game.impostor.currentState !== this.game.impostor.states.BEHIND)
                    {
                        this.lose();
                        return;
                    }
                }
                this.game.impostor.approachPlayer();

                this.canHit = false;
                setTimeout(() => {
                    this.canHit = true;
                }, 100);

                return;

            }
        }


    }

    setWalkDirection(x,y,z)
    {
        x *= 0.5;
        z *= 0.5;
        this.velocity = {x,y,z};
    }

    jump()
    {
        if(this.game.currentState === this.game.states.RUNNING && this.onGround())
        {
            this.characterController.jump();
            this.crossfadeToAction("jump");
            this.game.playSound("jump");
            setTimeout(() => {
                this.jumping = true;
            }, 50);
            
        }
    }

    sweep()
    {
        if(!this.sweeping && !this.strafing)
        {
            this.sweeping = true;
            this.colliderSwapState = 1;
            this.crossfadeToAction("sweep",0.1);
            this.game.playSound("sweep");
            if(this.jumping)
            {
                this.velocity.y = -0.25;
            }

            setTimeout(() => {
                this.sweeping = false;
                this.colliderSwapState = 2;
                if(this.game.currentState === this.game.states.RUNNING)
                {
                    this.crossfadeToAction("walk"); 
                    this.velocity.y = 0;
                }
            }, 750);
        }
    }

    move(direction)
    {
        if(!this.sweeping && !this.strafing && this.currentLane+direction >= -1 && this.currentLane+direction <= 1)
        {
            this.strafing = true;
            this.currentLane += direction;
            this.crossfadeToAction(direction===1 ? "right" : "left",0);

            this.game.playSound("jump");
        }
        setTimeout(() => {
            this.game.impostor.move(this.currentLane);
        }, 50);
    }

    crossfadeToAction(animationName, duration = 0.1)
    {
        const newAnimation = this.animations[animationName];
        if(this.currentAnimation)
        {
            this.currentAnimation.crossFadeTo(newAnimation, duration, false);
        }
        newAnimation.reset().play();
        this.currentAnimation = newAnimation;

        if(this.walkingAudio)
        {
            if(newAnimation === this.animations.walk)
            {
                if(this.walkingAudio.paused)
                {
                    this.walkingAudio.currentTime = 0;
                    this.walkingAudio.play();
                }
            }
            else
            {
                if(!this.walkingAudio.paused) this.walkingAudio.pause();
            }
        }
    }

    handleColliderSwap()
    {
        const ammo = this.game.ammo;

        if(this.colliderSwapState)
        {
            this.createCharacterController(this.colliderSwapState=== 1 ? 1 : 0);
            this.characterController.getGhostObject().activate(true);
            if(this.colliderSwapState===2)
            {
                const origin = this.getOrigin();
                if(origin.y < 1.5)
                {
                    this.setOrigin(origin.x,origin.y+0.8,origin.z);
                    this.updateMeshPosition();
                }
            }

            this.colliderSwapState = 0;
        }
    }

    startRun()
    {
        this.game.impostor.startRun();
        this.crossfadeToAction("start");
        this.game.playSound("gasp");

        setTimeout(() => {
            this.setWalkDirection(1,0,0);
            this.crossfadeToAction("walk",0.75);
            // this.walkingAudio = this.game.playSound("walk",true);
        }, this.game.startDelay);
    }

    lose()
    {
        this.game.lose();
        this.game.impostor.setCollider(1);
        this.game.impostor.approachPlayer();
        this.velocity.x = 0;
        this.crossfadeToAction("hit");
        if(this.sweeping)
        {
            this.colliderSwapState = 2;
        }
    }

    remove()
    {
        super.remove();

        const ammo = this.game.ammo;

        this.game.physicsWorld.removeAction(this.characterController);
        ammo.destroy(this.characterController);
        this.game.physicsWorld.removeCollisionObject(this.ghostObject);
        ammo.destroy(this.ghostObject);
    }
    
}