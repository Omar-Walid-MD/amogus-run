import React from 'react';
import coinImage from "../assets/images/coin.png";

function RunningGameInterface({refs})
{
    return (
        <>
            <div className='position-absolute fs-1 text-white top-0 mt-4 d-flex flex-column align-items-end gap-2' style={{right:0,minWidth:"125px"}}>
                <h3 className='status-container text-center w-100' ref={refs.scoreLabelRef}>0</h3>

                <div className="status-container d-flex align-items-center gap-2 w-100">
                    <h3 className='fw-semibold px-2 m-0' ref={refs.coinCountRef}>0</h3>
                    <img src={coinImage} style={{height:"60px"}} />
                </div>

                <p className='debug' ref={refs.debugLabelRef}></p>
            </div>
        </>
    );
}

export default RunningGameInterface;