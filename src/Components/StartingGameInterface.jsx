import React, { useEffect, useState } from 'react';
import coinImage from "../assets/images/coin.png";
import { Button, Spinner } from 'react-bootstrap';

function StartingGameInterface({game,isMobile,gameState})
{
    const [visible,setVisible] = useState(true);
    const [animationClass,setAnimationClass] = useState("show");
    const [totalCoins,setTotalCoins] = useState("0");
    
    useEffect(()=>{

        setTotalCoins(localStorage.getItem("amogus_run_coins") || "0")

    },[]);

    // useEffect(()=>{
    //     setAnimationClass(gameState === -1 ? "show" : "hide");
    // },[gameState]);

    return (
        gameState === -1 &&
        <div className={`interface-container ${animationClass}`}>
            <h1 className="position-absolute top-0 pt-5 game-title text-center text-white fw-semibold down"
            >Amogus Run!</h1>
            
            <div className='position-absolute bottom-0 pb-4 text-center up'>
                <Button className='start-btn fs-2 mb-2'
                style={{width:"200px"}}
                onClick={game?.startRun}>Start!</Button>
                {
                    !isMobile &&
                    <p className='text-primary fs-5 fw-semibold mt-2'>(Or Press Space to Run!)</p>
                }
            </div>
            {
                !isMobile &&
                <div className='position-absolute bottom-0 p-3 fw-bold up' style={{right:0}}>
      
                    <div className='d-flex justify-content-between align-items-stretch gap-2'>
                        <div className="d-flex flex-column align-items-center gap-2">
                            <div className='key-container mb-2' style={{width:"150px"}}><div className="key-label">SPACE</div></div>
                            <div className='key-container mb-2'><div className="key-label">A</div></div>
                            <div className='key-container mb-2'><div className="key-label">D</div></div>
                            <div className='key-container mb-2'><div className="key-label">S</div></div>
                        </div>
                        <div className="d-flex justify-content-between py-2 flex-column align-items-center fs-5">
                            <p className='m-0'>Jump</p>
                            <p className='m-0'>Left</p>
                            <p className='m-0'>Right</p>
                            <p className='m-0'>Down</p>
                        </div>
                    </div>
                    
                </div>
            }

            <div className="position-absolute top-0 py-4 left" style={{right:0}}>
                <div className="status-container d-flex align-items-center gap-2">
                    <h3 className='fw-semibold px-2 m-0 text-white'>{totalCoins}</h3>
                    <img src={coinImage} style={{height:"60px"}} />
                </div>
            </div>
        </div>
    );
}

export default StartingGameInterface;