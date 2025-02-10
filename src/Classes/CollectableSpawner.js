import Collectable from "./Collectable";
import GameObject from "./GameObject"

export default class CollectableSpawner extends GameObject
{
    constructor(game)
    {
        super(game);

        this.collectableGap = 10;
        this.playerGap = 150;
        this.lastPlayerPos = 0;
    }

    update()
    {
        if(this.game.currentState !== this.game.states.RUNNING) return;

        if(this.game.player.mesh && this.game.player.mesh.position.x > this.lastPlayerPos + this.collectableGap)
        {
            this.lastPlayerPos = Math.abs(this.game.player.mesh.position.x);

            this.spawnCollectable(this.lastPlayerPos+this.playerGap);
        }
    }

    spawnInitial()
    {
        const limit = (this.playerGap/this.collectableGap) - 1;
        for (let i = 0; i < limit; i++)
        {
            const pos = this.collectableGap + i*this.collectableGap;
            this.spawnCollectable(pos);
        }
    }

    spawnCollectable(zPosition)
    {
        new Collectable(this.game,zPosition);
    }
}