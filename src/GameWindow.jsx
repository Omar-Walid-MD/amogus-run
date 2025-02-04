import React, { useEffect, useRef, useState } from 'react';
import Game from './Classes/Game';
import { modelImports, textureImports } from './data';
import { GLTFLoader, MTLLoader, OBJLoader } from 'three/examples/jsm/Addons.js';
import { Button, Spinner } from 'react-bootstrap';
import RunningGameInterface from './Components/RunningGameInterface';
import { TextureLoader } from 'three';

function GameWindow() {

    const width = document.body.clientWidth;
    const height = document.body.clientHeight;
    const canvasRef = useRef(null);

    const [game,setGame] = useState(null);
    const [loading,setLoading] = useState(true);
    const [models,setModels] = useState({});
    const [textures,setTextures] = useState({});

    const [gameState,setGameState] = useState(-1);


    const refs = {
        scoreLabelRef: useRef(),
        coinCountRef: useRef(),
        audioContainerRef: useRef(),
        setGameState
    }


    async function loadModelsAndTextures()
    {

        let loadedModelsCount = 0;

        function loadModel(name,loadedModel)
        {
            setModels(m => ({...m,[name]:loadedModel}));

            loadedModelsCount++;
            if(loadedModelsCount === Object.keys(modelImports).length)
            {
                setLoading(false);
            }
        }


        Object.entries(modelImports).forEach(([modelName,data])=>{

            
            const [name,type] = modelName.split(".");

            if(data.type==="obj")
            {
                const materialLoader = new MTLLoader();

                materialLoader.load(data.material,(materials)=>{

                    materials.preload();

                    const objMaterial = new OBJLoader();

                    objMaterial.setMaterials(materials);

                    objMaterial.load(data.model,(loadedModel)=>{
                        loadModel(name,loadedModel);
                    });
                });
            }
            else if(data.type==="glb")
            {
                const gltfLoader = new GLTFLoader();

                gltfLoader.load(data.model,(loadedModel)=>{
                    loadModel(name,loadedModel);
                });
            }

                


        });
        
        Object.entries(textureImports).forEach(([textureName,texturePath])=>{
            
            const texture = new TextureLoader().load(texturePath);
            setTextures(t => ({...t,[textureName]:texture}));
        })
    }

    useEffect(() => {

        if(loading)
        {
            loadModelsAndTextures();
        }
        else
        {
            setGame(new Game(canvasRef,width,height,models,textures,refs));
            
            return () => {
                if(game)
                {
                    game.dispose();
                    setGame(null);
                }
            };
        }

    }, [loading]);



    return (
        <div className='page-container w-100 h-100 d-flex justify-content-center align-items-center m-0'>
        {
            loading ?
            <h1 className='text-white'>Loading...</h1>
            :
            <div className='position-relative' style={{width:width+"px",height:height+"px"}}>
                <canvas ref={canvasRef} width={width} height={height}></canvas>
                <div className="position-absolute d-flex justify-content-center align-items-center" style={{inset:0}}>
                {
                    gameState === -1 ?
                    <>
                        <h1 className='text-white fw-semibold position-absolute top-0 mt-5 game-title'
                        >Amogus Run!</h1>
                        <div className='position-absolute bottom-0 mb-4 text-center'>
                            <Button className='start-btn fs-2 mb-2'
                            style={{width:"200px"}}
                            onClick={game?.startRun}>Start!</Button>
                            <p className='text-primary fs-5 fw-semibold'>(Or Press Space to Run!)</p>
                        </div>
                        <div className='position-absolute bottom-0 m-3 fw-bold' style={{right:0}}>
                            <p className='m-0'>A to LEFT</p>
                            <p className='m-0'>D to RIGHT</p>
                            <p className='m-0'>S to SWEEP</p>
                            <p className='m-0'>SPACE to JUMP</p>
                        </div>
                    </>
                    :
                    gameState === 1 &&
                    <RunningGameInterface refs={refs}/>
                }

                </div>
            </div>
        }
        <div className="audio-container" ref={refs.audioContainerRef}></div>
        </div>
    );
};

export default GameWindow;
