import React, { useEffect, useRef, useState } from 'react';
import Game from './Classes/Game';
import { modelImports, textureImports } from './data';
import { GLTFLoader, MTLLoader, OBJLoader } from 'three/examples/jsm/Addons.js';
import RunningGameInterface from './Components/RunningGameInterface';
import { TextureLoader } from 'three';
import StartingGameInterface from './Components/StartingGameInterface';


function GameWindow() {

    const width = window.innerWidth;
    const height = window.innerHeight;
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
        totalCoinCountRef: useRef(),
        debugLabelRef: useRef(),
        audioContainerRef: useRef(),
        setGameState
    }


    async function loadModelsAndTextures()
    {
        function getOnBeforeCompile(texture)
        {
            const curveAmountValue = texture === "coin.png" ? 0.055 : 0.05;
            if(texture === "obstacles.png")
            {

                return (shader) =>
                {                
                    shader.uniforms.curveStrength = { value: 0.25 }; // Adjust curve strength
                    shader.uniforms.curveAmount = { value: curveAmountValue }; // Adjust curvature amount
            
                    shader.vertexShader = shader.vertexShader.replace(
                        `#include <common>`,
                        `#include <common>
                        uniform float curveStrength;
                        uniform float curveAmount;`
                    );
        
                    shader.vertexShader = shader.vertexShader.replace(
                        `#include <begin_vertex>`,
                        `#include <begin_vertex>
                        
                        mat4 instanceMat = instanceMatrix;
                        vec3 instancePosition = instanceMat[3].xyz;
                        vec4 viewPosition = viewMatrix * vec4(instancePosition + transformed, 1.0);
        
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
            else
            {
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

            loadedModel.name = name;

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
                                    if(data.texture === "coin.png" || data.texture === "obstacles.png" || data.texture === "corridor-game.png")
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


    return (
        <div className='page-container position-relative w-100 h-100 d-flex justify-content-center align-items-center m-0'>
        {
            !loading &&
            <div className='position-relative' style={{width:width+"px",height:height+"px"}}>
                <canvas ref={canvasRef} width={width} height={height}></canvas>

                <StartingGameInterface game={game} isMobile={isMobile} gameState={gameState} />
                <RunningGameInterface refs={refs} gameState={gameState} />

                <p className='fps-label position-absolute top-0 text-white fw-semibold my-2' ref={refs.debugLabelRef} style={{left:0}}></p>
            </div>
        }
        {
            
            (loading || gameState === null) &&
            <div className='title-screen position-absolute w-100 d-flex justify-content-center align-items-center'>
                <h1 className='position-absolute text-white bottom-0 m-5'>Loading...</h1>
            </div>
        }
        <div className="audio-container" ref={refs.audioContainerRef}></div>
        </div>
    );
};

export default GameWindow;
