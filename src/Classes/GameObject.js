import * as THREE from 'three';
export default class GameObject
{
    constructor(game)
    {
        this.game = game;
        this.alive = true;
        this.mesh;
        this.game.gameObjects.push(this);
    }
    
    addMesh()
    {
        const onBeforeCompile = (shader) =>
        {                
            shader.uniforms.curveStrength = { value: 0.25 }; // Adjust curve strength
            shader.uniforms.curveAmount = { value: 0.05 }; // Adjust curvature amount

            if(this.className === "Collectable") shader.uniforms.curveAmount.value = 0.055;

            shader.vertexShader = shader.vertexShader.replace(
                `#include <common>`,
                `#include <common>
                uniform float curveStrength;
                uniform float curveAmount;

                `
            );

            shader.vertexShader = shader.vertexShader.replace(
                `#include <begin_vertex>`,
                `#include <begin_vertex>

                vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
                vec4 cameraPosition = viewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                vec3 meshPosition = transformed.xyz;

                float curvatureThreshold = 50.0;
                float distance = length(viewPosition.xyz); // Compute the distance in view space
                float curve = 0.0;
                if (distance > curvatureThreshold) {
                    curve = curveStrength * pow(abs(viewPosition.z) * curveAmount, 2.0);
                    curve *= abs(distance - curvatureThreshold)/(70.0);
                }

                transformed.y += curve;
                `
            );
        };

      
        this.setShadow(!this.game.isMobile);

        if(true)
        {
            if(this.className === "Obstacle" || this.className === "Platform" || this.className === "Collectable")
            {
                this.mesh.traverse((child) => {
                    if(child.isMesh)
                    {
                        if(child.material.length)
                        {
                            child.material.forEach((m)=>{
                                m.onBeforeCompile = onBeforeCompile;
                            });
                        }
                        else child.material.onBeforeCompile = onBeforeCompile;
    
    
                        // child.customDepthMaterial = customDepthMaterial;
                    }
                });
            }
        }

        this.game.scene.add(this.mesh);
    }

    setShadow(enabled)
    {
        this.mesh.castShadow = enabled;
        this.mesh.receiveShadow = enabled;

        this.mesh.traverse((child) => {
            if(child.isMesh)
            {
                child.castShadow = enabled; 
                child.receiveShadow = enabled;
            }
        });
    }

    addPhysicsObject(shape,mass=1,collisionFlag=1,group=1,mask=-1)
    {
        this.hasPhysics = true;
        const ammo = this.game.ammo;
        const position = this.mesh?.position || {x:0,y:0,z:0};

        this.transform = new ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new ammo.btVector3(position.x,position.y,position.z));

        const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.mesh.rotation.x,this.mesh.rotation.y,this.mesh.rotation.z));
        this.transform.setRotation(new ammo.btQuaternion(quaternion.x,quaternion.y,quaternion.z,quaternion.w));
        
        const motionState = new ammo.btDefaultMotionState(this.transform);
        const localInertia = new ammo.btVector3(0,0,0);

        shape.calculateLocalInertia(mass,localInertia);

        const rigidBodyInfo = new ammo.btRigidBodyConstructionInfo(mass,motionState,shape,localInertia);

        this.rigidBody = new ammo.btRigidBody(rigidBodyInfo);
        this.rigidBody.setCollisionFlags(collisionFlag);
        // this.game.physicsWorld.addCollisionObject(this.rigidBody);
        this.rigidBody.setActivationState(4);
        
        // console.log("Created: ",this.rigidBody);

        this.game.physicsWorld.addRigidBody(this.rigidBody,group,mask);
        this.mesh.userData.physicsBody = this.rigidBody;
    }

    update()
    {
        if(!this.alive) return;
    }

    updatePhysics()
    {
        let motionState = this.rigidBody.getMotionState();
        
        if(motionState)
        {
            motionState.getWorldTransform(this.game.physicsTransform);
            let p = this.game.physicsTransform.getOrigin();
            let q = this.game.physicsTransform.getRotation();
            const quaternion = new THREE.Quaternion(q.x(), q.y(), q.z(), q.w());
            
            this.mesh.position.set(p.x(), p.y(), p.z());
            this.mesh.quaternion.copy(quaternion);
        }
    }

    setVisible(visible)
    {
        this.mesh.visible = visible;
        this.mesh.traverse((child)=>{
            if(child.isMesh) child.visible = visible;
        });
    }

    getOrigin()
    {
        if(this.hasPhysics)
        {
            this.rigidBody.getMotionState().getWorldTransform(this.game.physicsTransform);
            const origin = this.game.physicsTransform.getOrigin();
            return {x:origin.x(),y:origin.y(),z:origin.z()};
        }

        if(this.mesh)
        {
            return this.mesh.position;
        }
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
            this.updatePhysics();
        }
        else if(this.mesh)
        {
            this.mesh.position.set(x,y,z);
        }
    }

    remove()
    {
        if(!this.alive) return;

        this.alive = false;
        if(this.hasPhysics)
        {
            if(this.rigidBody)
            {
                const ammo = this.game.ammo;

                this.game.physicsWorld.removeCollisionObject(this.rigidBody);
                this.game.physicsWorld.removeRigidBody(this.rigidBody);
                ammo.destroy(this.rigidBody);
            }
        }

        if(this.mesh)
        {
            this.mesh.userData.physicsBody = null;
            this.game.scene.remove(this.mesh);
            if(this.mesh.geometry) this.mesh.geometry.dispose();
            if(this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(mat => mat.dispose());
                } else {
                this.mesh.material.dispose();
                }
            }
        }


        
       
    }
}