import * as THREE from 'three';
import GameObject from "./GameObject";
import { SkeletonUtils } from 'three/examples/jsm/Addons.js';
import { collisionGroup } from '../data';

export default class Player extends GameObject
{
    constructor(game)
    {
        super(game);
        this.className = "Player";

        this.size = [0.5,1];

        const ammo = this.game.ammo;
        this.ammoVector = new ammo.btVector3(0,0,0);

        this.mainColliderShape = new ammo.btCapsuleShape(0.5,1);
        this.mainColliderTransform = new ammo.btTransform(); this.mainColliderTransform.setIdentity(); this.mainColliderTransform.setOrigin(this.getAmmoVector(0,0,0));
        
        this.sweepColliderShape = new ammo.btCapsuleShape(0.25,0.15);
        this.sweepColliderShape.setMargin(0.05);
        this.sweepColliderTransform = new ammo.btTransform(); this.sweepColliderTransform.setIdentity(); this.sweepColliderTransform.setOrigin(this.getAmmoVector(0,0,0));

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

        this.speed = 0.5;
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

        this.hitRayPositions = [
            [{x:-0.5,y:0.5,z:0},{x:1,y:0.5,z:0}],
            [{x:0,y:0.5,z:0},{x:0,y:0.5,z:0.8}],
            [{x:0,y:0.5,z:0},{x:0,y:0.5,z:-0.8}],
        ];

        this.strafeDirection = 0;
        this.lost = false;

        this.crossfadeToAction("idle");

        this.updateRateTicks = 200;

        this.updateWalkDirection({});

    
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
        ghostTransform.setOrigin(this.getAmmoVector(0,2,0)); // Initial position of the character
        
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
        this.origin = this.getOrigin();
        
        if(this.game.currentState === this.game.states.RUNNING)
        {
            const lanePosition = this.currentLane*this.laneSpace;

            if(this.strafing)
            {
                if(this.origin.z*this.strafeDirection >= Math.abs(lanePosition))
                {
                    this.setOrigin(this.origin.x,this.origin.y,lanePosition);
                    this.strafing = false;
                    this.lastLane = this.currentLane;
                    this.updateWalkDirection({z:0});
                    this.strafeDirection = 0;
                    if(this.onGround())
                    {
                        this.crossfadeToAction("walk");
                    }
                }

            }

            if(!this.lost)
            {
                this.checkHit();
    
                if(this.onGround())
                {
                    if(!this.animations["walk"].isRunning() && !this.animations["start"].isRunning())
                    {
                        if(!this.sweeping && !this.strafing)
                        {
                            this.crossfadeToAction("walk");
                        }
                    }
                    if(this.jumping)
                    {
                        this.jumping = false;
                        if(this.sweeping)
                        {
                            this.updateWalkDirection({y:0})
                        }
                    }
    
                    if(this.walkingAudio && this.walkingAudio.paused && !this.strafing) this.walkingAudio.play();
    
                }
                else
                {
                    if(this.walkingAudio && !this.walkingAudio.paused) this.walkingAudio.pause();
                }
            }

            if(this.updateRateTicks === 0)
            {
                if(this.game.rate < 2)
                {
                    this.game.rate += 0.0001;
                }

                this.updateWalkDirection({x:this.speed*this.game.rate});
                this.updateRateTicks = 200;
            }
            else this.updateRateTicks -= this.game.deltaTime * 60;
        
        }
        
        this.updateMeshPosition();

        this.mixer.update(1.5*this.game.rate*this.game.deltaTime);

        if(this.walkingAudio) this.walkingAudio.playbackRate = this.game.rate + 0.2;

    }

    setOrigin(x,y,z)
    {
        const transform = this.ghostObject.getWorldTransform();
        transform.setOrigin(this.getAmmoVector(x,y,z));
    }

    getOrigin()
    {
        const origin = this.ghostObject.getWorldTransform().getOrigin();
        return new THREE.Vector3(origin.x(), origin.y(), origin.z());
    }

    updateMeshPosition()
    {
        this.mesh.position.copy(this.origin);
        if(this.sweeping) this.mesh.position.y += 0.5;

    }

    onGround()
    {
        const ammo = this.game.ammo;

        const rayStart = new ammo.btVector3(this.origin.x,this.origin.y,this.origin.z);
        const rayEnd = new ammo.btVector3(this.origin.x,this.origin.y-1.5,this.origin.z);

        // const vector1 = this.getAmmoVector(0,0,0);
        // const vector2 = this.getAmmoVector(1,1,1);

        const rayCallback = new ammo.ClosestRayResultCallback(rayStart, rayEnd);

        this.game.physicsWorld.rayTest(rayStart, rayEnd, rayCallback);

        return rayCallback.hasHit()
    }

    checkHit()
    {
        if(!this.canHit) return;
        
        const ammo = this.game.ammo;

        for(let i = 0; i < this.hitRayPositions.length; i++)
        {
            const rayPosition = this.hitRayPositions[i];

            const start = rayPosition[0];
            const end = rayPosition[1];

            const rayStart = new ammo.btVector3(this.origin.x+start.x,this.origin.y+start.y,this.origin.z+start.z);
            const rayEnd = new ammo.btVector3(this.origin.x+end.x,this.origin.y+end.y,this.origin.z+end.z);
    
            const rayCallback = new ammo.ClosestRayResultCallback(rayStart, rayEnd);
    
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
                    
                    if(this.game.impostor.currentState !== this.game.impostor.states.BEHIND)
                    {
                        this.lose();
                        this.game.impostor.move(this.currentLane);
                        return;
                    }
                    else
                    {
                        this.strafing = false;
                        this.move(this.lastLane - this.currentLane);
                        this.currentLane = this.lastLane;
                    }
                }
                this.game.impostor.approachPlayer();

                this.canHit = false;
                setTimeout(() => {
                    this.canHit = true;
                }, 100);

                return;
            }

            if(!this.strafing) break;

        }


    }

    updateWalkDirection({x,y,z})
    {        
        if(x !== undefined) this.velocity.x = x;
        if(y !== undefined) this.velocity.y = y;
        if(z !== undefined) this.velocity.z = z;
        
        this.characterController.setWalkDirection(
            this.getAmmoVector(this.velocity.x,this.velocity.y,this.velocity.z)
        );
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

            this.updateWalkDirection({y:-0.5});

            setTimeout(() => {
                this.sweeping = false;
                this.colliderSwapState = 2;
                if(this.game.currentState === this.game.states.RUNNING)
                {
                    this.crossfadeToAction("walk",0.25); 
                    this.updateWalkDirection({y:0});
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

            if(!this.jumping) this.game.playSound("jump");
            this.walkingAudio.pause();

            this.strafeDirection = direction;
            this.updateWalkDirection({z:direction*0.35});
            
            setTimeout(() => {
                if(!this.lost) this.game.impostor.move(this.currentLane);
            }, 50);
        }
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
            this.updateWalkDirection({});
        }
    }

    startRun()
    {
        this.game.impostor.startRun();
        this.crossfadeToAction("start");
        this.game.playSound("gasp");
    }

    startRunAfterDelay()
    {
        this.updateWalkDirection({x:this.speed*this.game.rate});
        this.crossfadeToAction("walk",0.75);
        this.walkingAudio = this.game.playSound("walk",true);
    }

    lose()
    {
        this.lost = true;
        this.game.lose();
        this.game.impostor.setCollider(1);
        this.game.impostor.approachPlayer();
        this.updateWalkDirection({x:0,z:0});
        this.crossfadeToAction("hit");
        this.walkingAudio.remove();
        if(this.sweeping)
        {
            this.colliderSwapState = 2;
        }

        setTimeout(() => {
            if(this.game.currentState === this.game.states.RUNNING)
            {
                this.game.showEndScreen();
            }
        }, 1500);
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

    getAmmoVector(x,y,z)
    {
        this.ammoVector.setValue(x,y,z);
        return this.ammoVector;
    }
    
}