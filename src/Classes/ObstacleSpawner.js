import GameObject from "./GameObject"
import Obstacle from "./Obstacle";

export default class ObstacleSpawner extends GameObject
{
    constructor(game)
    {
        super(game);
        this.obstacleNames = ["stand","crate","ramp","barrel"];

        this.obstacleGap = 25;
        this.playerGap = 150;
        this.lastPlayerPos = 0;

        this.hiddenObstacles = {};
        this.obstacleNames.forEach((n) => {this.hiddenObstacles[n] = [];});

        const limit = (this.playerGap/this.obstacleGap) - 1;

        for (let i = 0; i < limit; i++)
        {
            const pos = this.obstacleGap*2 + i*this.obstacleGap;
            this.spawnObstacle(pos);
        }
    }

    update()
    {
        if(this.game.currentState !== this.game.states.RUNNING) return;

        if(this.game.player.mesh && this.game.player.mesh.position.x > this.lastPlayerPos + this.obstacleGap)
        {
            this.lastPlayerPos = Math.abs(this.game.player.mesh.position.x);

            this.spawnObstacle(this.lastPlayerPos+this.playerGap);
        }
    }

    spawnObstacle(xPosition)
    {
        const obstacleName = this.obstacleNames[Math.floor(Math.random()*this.obstacleNames.length)];

        if(this.hiddenObstacles[obstacleName].length > 0)
        {
            const obstacle = this.hiddenObstacles[obstacleName].pop();
            obstacle.mesh.visible = true;
            obstacle.setLanePosition(xPosition);
        }
        else
        {
            new Obstacle(this.game,this,obstacleName,xPosition);
        }

    }
}