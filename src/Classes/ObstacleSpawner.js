import { obstacleRows } from "../data";
import GameObject from "./GameObject"
import Obstacle from "./Obstacle";

export default class ObstacleSpawner extends GameObject
{
    constructor(game)
    {
        super(game);
        this.obstacleNames = ["crate","ramp","barrel","stand"];

        this.obstacleGap = 40;
        this.playerGap = 150;
        this.lastPlayerPos = 0;
        this.laneSpace = 5;

        this.hiddenObstacles = {};
        this.obstacleNames.forEach((n) => {this.hiddenObstacles[n] = [];});

        const limit = (this.playerGap/this.obstacleGap) - 1;

        for (let i = 0; i < limit; i++)
        {
            const pos = this.obstacleGap + i*this.obstacleGap;
            this.spawnObstacleRow(pos);
        }
    }

    update()
    {
        if(this.game.currentState !== this.game.states.RUNNING) return;

        if(this.game.player.mesh && this.game.player.mesh.position.x > this.lastPlayerPos + this.obstacleGap)
        {
            this.lastPlayerPos = Math.abs(this.game.player.mesh.position.x);

            this.spawnObstacleRow(this.lastPlayerPos+this.playerGap);
        }
    }

    spawnObstacleRow(x)
    {
        let row = this.shuffleRow(obstacleRows[Math.floor(Math.random()*obstacleRows.length)]);

        for (let i = 0; i < row.length; i++)
        {
            const obstacleIndex = row[i];
            const z = -this.laneSpace + this.laneSpace*i;
            this.spawnObstacle(obstacleIndex,x,z)
        }
    }

    spawnObstacle(obstacleIndex,x,z)
    {
        if(obstacleIndex === -1) return;

        const obstacleName = this.obstacleNames[obstacleIndex];

        if(this.hiddenObstacles[obstacleName].length > 0)
        {
            const obstacle = this.hiddenObstacles[obstacleName].pop();
            obstacle.mesh.visible = true;
            obstacle.setLanePosition(x,z);
        }
        else
        {
            new Obstacle(this.game,this,obstacleName,x,z);
        }

    }

    shuffleRow(row)
    { 
        for (let i = row.length - 1; i > 0; i--) { 
          const j = Math.floor(Math.random() * (i + 1)); 
          [row[i], row[j]] = [row[j], row[i]]; 
        } 
        return row; 
      }; 
}