export const modelNames = [
    "amogus.glb",
    "coin.obj",
    "corridor.obj",
    "crate.obj",
    "barrel.obj",
    "ramp.obj",
    "stand.obj",
    "corridor-collider.obj",
    "crate-collider.obj",
    "barrel-collider.obj",
    "ramp-collider.obj",
    "stand-collider.obj",
    "space-background.obj",
    "impostor.glb",
    "dead.obj"
];

export const textureNames = [
    "coin.png",
    "coin-emission.png",
    "corridor.png",
    "obstacles.png",
    "space-0.png",
    "space-1.png",
    "space-2.png",

];


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