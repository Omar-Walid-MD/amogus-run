import amogus from "./assets/models/amogus.glb";
import coin from "./assets/models/coin.obj";
import corridor from "./assets/models/corridor.obj";
import crate from "./assets/models/crate.obj";
import barrel from "./assets/models/barrel.obj";
import ramp from "./assets/models/ramp.obj";
import stand from "./assets/models/stand.obj";
import corridorCollider from "./assets/models/corridor-collider.obj";
import crateCollider from "./assets/models/crate-collider.obj";
import barrelCollider from "./assets/models/barrel-collider.obj";
import rampCollider from "./assets/models/ramp-collider.obj";
import standCollider from "./assets/models/stand-collider.obj";
import spaceBackground from "./assets/models/space-background.obj";
import impostor from "./assets/models/impostor.glb";
import dead from "./assets/models/dead.obj";

import coinMtl from "./assets/models/coin.mtl";
import corridorMtl from "./assets/models/corridor.mtl";
import crateMtl from "./assets/models/crate.mtl";
import barrelMtl from "./assets/models/barrel.mtl";
import rampMtl from "./assets/models/ramp.mtl";
import standMtl from "./assets/models/stand.mtl";
import corridorColliderMtl from "./assets/models/corridor-collider.mtl";
import crateColliderMtl from "./assets/models/crate-collider.mtl";
import barrelColliderMtl from "./assets/models/barrel-collider.mtl";
import rampColliderMtl from "./assets/models/ramp-collider.mtl";
import standColliderMtl from "./assets/models/stand-collider.mtl";
import spaceBackgroundMtl from "./assets/models/space-background.mtl";
import deadMtl from "./assets/models/dead.mtl";

import coinTexture from "./assets/textures/coin.png";
import coinEmission from "./assets/textures/coin-emission.png";
import corridorTexture from "./assets/textures/corridor.png";
import obstacles from "./assets/textures/obstacles.png";
import space0 from "./assets/textures/space-0.png";
import space1 from "./assets/textures/space-1.png";
import space2 from "./assets/textures/space-2.png";

import gaspSound from "./assets/sounds/gasp.mp3";
import walkSound from "./assets/sounds/walk.mp3";
import deadSound from "./assets/sounds/dead.mp3";
import sweepSound from "./assets/sounds/sweep.mp3";
import coinSound from "./assets/sounds/coin.mp3";
import hitSound from "./assets/sounds/hit.mp3";
import jumpSound from "./assets/sounds/jump.wav";

export const modelImports = {
    "amogus.glb": { type: "glb", model: amogus },
    "coin.obj": { type: "obj", model: coin, material: coinMtl },
    "corridor.obj": { type: "obj", model: corridor, material: corridorMtl },
    "crate.obj": { type: "obj", model: crate, material: crateMtl },
    "barrel.obj": { type: "obj", model: barrel, material: barrelMtl },
    "ramp.obj": { type: "obj", model: ramp, material: rampMtl },
    "stand.obj": { type: "obj", model: stand, material: standMtl },
    "corridor-collider.obj": { type: "obj", model: corridorCollider, material: corridorColliderMtl },
    "crate-collider.obj": { type: "obj", model: crateCollider, material: crateColliderMtl },
    "barrel-collider.obj": { type: "obj", model: barrelCollider, material: barrelColliderMtl },
    "ramp-collider.obj": { type: "obj", model: rampCollider, material: rampColliderMtl },
    "stand-collider.obj": { type: "obj", model: standCollider, material: standColliderMtl },
    "space-background.obj": { type: "obj", model: spaceBackground, material: spaceBackgroundMtl },
    "impostor.glb": { type: "glb", model: impostor },
    "dead.obj": { type: "obj", model: dead, material: deadMtl }
};

export const textureImports = {
    "coin.png": coinTexture,
    "coin-emission.png": coinEmission,
    "corridor.png": corridorTexture,
    "obstacles.png": obstacles,
    "space-0.png": space0,
    "space-1.png": space1,
    "space-2.png": space2
};

export const soundEffects = {
    "gasp":  gaspSound,
    "walk": walkSound,
    "dead": deadSound,
    "hit": hitSound,
    "sweep": sweepSound,
    "coin": coinSound,
    "jump": jumpSound
}

export const collisionGroup = {
    PLAYER: 1,
    IMPOSTOR: 2,
    PLATFORM: 4,
    OBSTACLE: 8,
    OBSTACLE_DODGE: 16,
    OBSTACLE_COLLIDE: 32,
    RAY: 64,
    IMPOSTOR_RAY: 128
};