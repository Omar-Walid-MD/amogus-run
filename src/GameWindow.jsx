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

    const [gameState,setGameState] = useState(null);

    const [isMobile,setIsMobile] = useState(false);


    const refs = {
        scoreLabelRef: useRef(),
        coinCountRef: useRef(),
        debugLabelRef: useRef(),
        audioContainerRef: useRef(),
        setGameState
    }


    async function loadModelsAndTextures()
    {
        function getOnBeforeCompile(texture)
        {
            const curveAmountValue = texture === "coin.png" ? 0.055 : 0.05;
            return (shader) =>
            {                
                shader.uniforms.curveStrength = { value: 0.25 }; // Adjust curve strength
                shader.uniforms.curveAmount = { value: curveAmountValue }; // Adjust curvature amount
        
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
        }

        const tempTextures = {};
        Object.entries(textureImports).forEach(([textureName,texturePath])=>{
            const texture = new TextureLoader().load(texturePath);
            tempTextures[textureName] = texture;
        });
        setTextures(tempTextures);

        let loadedModelsCount = 0;

        function loadModel(name,loadedModel)
        {
            setModels(m => ({...m,[name]:loadedModel}));

            loadedModelsCount++;
            if(loadedModelsCount === Object.keys(modelImports).length)
            {
                setTimeout(() => {
                    setLoading(false);
                }, 1000);
            }
        }


        Object.entries(modelImports).forEach(([modelName,data])=>{
    
            const [name,type] = modelName.split(".");

            if(data.type==="obj")
            {
                const materialLoader = new MTLLoader();

                if(data.material)
                {
                    materialLoader.load(data.material,(materials)=>{
    
                        materials.preload();
    
                        if(data.texture)
                        {
                            Object.values(materials.materials).forEach((mat)=>{
                                mat.map = tempTextures[data.texture];

                                if(true)
                                {
                                    if(data.texture === "coin.png" || data.texture === "obstacles.png" || data.texture === "corridor.png")
                                    {
                                        mat.onBeforeCompile = getOnBeforeCompile(data.texture);
                                    }
                                }
                            });

                        }
    
                        const objMaterial = new OBJLoader();
    
                        objMaterial.setMaterials(materials);
    
                        objMaterial.load(data.model,(loadedModel)=>{
                            loadModel(name,loadedModel);
                        });
                    });
                }
                else
                {
                    const objMaterial = new OBJLoader();
    
                    objMaterial.load(data.model,(loadedModel)=>{
                        loadModel(name,loadedModel);
                    });
                }

            }
            else if(data.type==="glb")
            {
                const gltfLoader = new GLTFLoader();

                gltfLoader.load(data.model,(loadedModel)=>{
                    loadModel(name,loadedModel);
                });
            }

                


        });
        
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

    useEffect(()=>{

        ["Android","Linux armv7l","iPhone","iPod","iPad","BlackBerry"].forEach((mobilePlatform)=>{
            if(navigator.userAgent.includes(mobilePlatform))
            {
                document.body.classList.add("mobile");
                setIsMobile(true);
                return;
            }
        })

    },[]);
        
    console.log(loading || gameState === null);



    return (
        <div className='page-container position-relative w-100 h-100 d-flex justify-content-center align-items-center m-0'>
        {
            
            (loading || gameState === null) &&
            <div className='title-screen position-absolute w-100 d-flex justify-content-center align-items-center'>
                <h1 className='position-absolute text-white bottom-0 m-5'>Loading...</h1>
            </div>
        }
        {
            !loading &&
            <div className='position-relative' style={{width:width+"px",height:height+"px"}}>
                <canvas ref={canvasRef} width={width} height={height}></canvas>
                <div className="position-absolute d-flex justify-content-center align-items-center" style={{inset:0}}>
                {
                    gameState === -1 ?
                    <>
                        <h1 className='text-white fw-semibold position-absolute top-0 mt-5 game-title text-center'
                        >Amogus Run!</h1>
                        
                        <div className='position-absolute bottom-0 mb-4 text-center'>
                            <Button className='start-btn fs-2 mb-2'
                            style={{width:"200px"}}
                            onClick={game?.startRun}>Start!</Button>
                            {
                                !isMobile &&
                                <p className='text-primary fs-5 fw-semibold'>(Or Press Space to Run!)</p>
                            }
                        </div>
                        {
                            !isMobile &&
                            <div className='position-absolute bottom-0 m-3 fw-bold' style={{right:0}}>
                                <p className='m-0'>A to LEFT</p>
                                <p className='m-0'>D to RIGHT</p>
                                <p className='m-0'>S to SWEEP</p>
                                <p className='m-0'>SPACE to JUMP</p>
                            </div>
                        }
                    </>
                    :
                    gameState === 1 &&
                    <RunningGameInterface refs={refs}/>
                }

                    <p className='debug position-absolute top-0 text-info fw-semibold m-2' ref={refs.debugLabelRef} style={{left:0}}></p>
                </div>
            </div>
        }
        <div className="audio-container" ref={refs.audioContainerRef}></div>
        </div>
    );
};

export default GameWindow;
