import * as THREE from 'three';
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

        this.totalInstances = 20;
        this.obstacleInstances = {};
        this.obstacleCounts = {};
        this.obstacleHeights = {};

        this.obstacleObjects = {};

        this.obstacleNames.forEach((obstacleName)=>{
            const obstacleModel = this.game.models[obstacleName].children[0];

            this.obstacleInstances[obstacleName] = new THREE.InstancedMesh(obstacleModel.geometry,obstacleModel.material,this.totalInstances);
            this.obstacleInstances[obstacleName].frustumCulled = false;
            this.obstacleInstances[obstacleName].castShadow = true;
            this.obstacleInstances[obstacleName].receiveShadow = true;

            this.obstacleCounts[obstacleName] = 0;

            const boundingBox = new THREE.Box3().setFromObject(obstacleModel);
            this.obstacleHeights[obstacleName] = boundingBox.max.y - boundingBox.min.y;
    

            const matrixObject = new THREE.Object3D();
            const height = this.game.platformHeight/2+this.obstacleHeights[obstacleName]/2;
            matrixObject.position.set(-50,height,0);
            matrixObject.rotation.set(0,-Math.PI,0,"XYZ");
            matrixObject.updateMatrix();

            this.obstacleObjects[obstacleName] = [];

            for (let i = 0; i < this.totalInstances; i++)
            {
                this.obstacleInstances[obstacleName].setMatrixAt(i,matrixObject.matrix);
                this.obstacleObjects[obstacleName].push(new Obstacle(this.game,this,obstacleName,-50,0));
            };

            this.game.scene.add(this.obstacleInstances[obstacleName]);

        });

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
            this.lastPlayerPos = this.game.player.mesh.position.x;

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
        const currentObstacleCount = this.obstacleCounts[obstacleName];
        this.obstacleObjects[obstacleName][currentObstacleCount].setLanePosition(x,z);
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