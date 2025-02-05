import * as THREE from 'three';
import GameObject from "./GameObject";
import Platform from "./Platform";

export default class PlatformHandler extends GameObject
{
    constructor(game)
    {
        super(game);

        const model = game.models.corridor;

        const boundingBox = new THREE.Box3().setFromObject(model);
        this.platformSize = boundingBox.max.x - boundingBox.min.x;
        
        this.platforms = [new Platform(game,this.platformSize), new Platform(game,this.platformSize)];

        const p = this.platforms[1].mesh.position;
        this.platforms[1].setOrigin(p.x+this.platformSize,p.y,p.z);


        this.count = 0;
    }

    update()
    {
        if(this.game.currentState === this.game.states.RUNNING)
        {
            if(this.game.player.mesh?.position.x > this.platforms[1].mesh.position.x)
            {
                this.platforms.reverse();
                const p = this.platforms[0].mesh.position;
                this.platforms[1].setOrigin(p.x+this.platformSize,p.y,p.z);
                // this.platforms[0].remove();
    
                // this.platforms = [this.platforms[1]];
                // this.platforms.push(new Platform(this.game,this.platformSize));
    
    
            }
        }
    }
}