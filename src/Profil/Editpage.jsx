import { useState } from "react";
import { Shield } from "../Shield/Shield";
import { AccountSettings } from "./AccoutnSettings";
import './edit.css'
import { Sub } from "./Subscription";
export const EditProfilePage = () =>{

    const [state, setState] = useState('acc');


    return(
        <div className="cset-page">
            <div className="cset-navbar">
                <button 
                    type="button" 
                    className={`cset-nav-btn ${state === 'acc' ? 'cset-nav-active' : ''}`} 
                    onClick={() => setState('acc')}
                >
                    Account Settings
                </button>
                <button 
                    type="button" 
                    className={`cset-nav-btn ${state === 'sub' ? 'cset-nav-active' : ''}`} 
                    onClick={() => setState('sub')}
                >
                    Subscription
                </button>
            </div>
            
            <div className="cset-content">
                {state === 'acc' && ( <Shield className="acc-shield" ><AccountSettings className="acc-shield" /></Shield>)}
                {state === 'sub' && <Shield><Sub/></Shield>}
            </div>
        </div>
        

    )
}
