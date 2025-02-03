import Collectable from "./Collectable";
import GameObject from "./GameObject"

export default class CollectableSpawner extends GameObject
{
    constructor(game)
    {
        super(game);

        this.obstacleGap = 15;
        this.playerGap = 200;
        this.lastPlayerPos = 0;

        const limit = (this.playerGap/this.obstacleGap) - 1;

        for (let i = 0; i < limit; i++)
        {
            const pos = this.obstacleGap + i*this.obstacleGap;
            this.spawnCollectable(pos);
        }

    }

    update()
    {
        if(this.game.currentState !== this.game.states.RUNNING) return;

        if(this.game.player.mesh && this.game.player.mesh.position.x > this.lastPlayerPos + this.obstacleGap)
        {
            this.lastPlayerPos = Math.abs(this.game.player.mesh.position.x);

            this.spawnCollectable(this.lastPlayerPos+this.playerGap);
        }
    }

    spawnCollectable(zPosition)
    {
        new Collectable(this.game,zPosition);
    }
}