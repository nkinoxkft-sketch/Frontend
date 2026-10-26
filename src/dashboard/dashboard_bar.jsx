import { useState, useEffect, useRef } from 'react';
import './dashboard_batb.css';
import ai from '../assets/aif.svg'
import { useSub } from '../../useStates/useSub';
import closesvg from '../assets/close.svg'
import profil from '../assets/profil.svg'
import { Shield } from '../Shield/Shield';
import { ProfilCard } from '../Profil/ProfilCard';
import { useNavigate } from 'react-router-dom';
import opensvg from '../assets/open.svg'

export const Bar = ( { getMessages, sessions, selected_session_id, limit, no_more_message_to_load }) =>{

    const setNewTab = () =>{

        no_more_message_to_load.current = true;
        limit.current = 5;
        selected_session_id.current = null;

    }

    const { sub } = useSub();

    const [navVisible, setNavVisible] = useState(true);

    const [isOpen, setIsOpen] = useState(false);

    const cardRef = useRef(null)

    const navigate = useNavigate();

    useEffect(() => {

        const handleClickOutside = (event) => {

        if (cardRef.current && !cardRef.current.contains(event.target)) {
            setIsOpen(false); 
        }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, [isOpen]);


    return(
       <div className="csb-container">
            {navVisible ? (
                <div className="csb-sidebar">
                    
                    {/* Felső rész: Logó, Bezárás és Új Chat */}
                    <div className="csb-top">
                        <div className="csb-header">
                            <div className="csb-logo-container">
                                <button className="csb-logo-btn" onClick={() => navigate('/')}>
                                    <img src={ai} className="csb-logo-img" alt="Claudify logo" />
                                </button>
                                <p className="csb-title">Cloudify</p>
                            </div>
                            
                            <button 
                                type="button"
                                className="csb-close-btn"
                                onClick={() => setNavVisible(false)}
                                title="Close sidebar"
                            >
                                <img src={closesvg} className="csb-icon" alt="Close" />
                            </button>
                        </div>
                        
                        <button type="button" className="csb-new-chat-btn" onClick={() => setNewTab()}>
                            + New chat
                        </button>
                        
                        <p className="csb-section-label">Recent</p>
                    </div>

                    {/* Középső rész: Korábbi beszélgetések (Görgethető) */}
                    <div className="csb-mid">
                        {sub.status !== 'Basic' && sub.status !== null && (
                            <div className="csb-sessions">
                                {[...sessions].reverse().map((chat) => (
                                    <button
                                        type="button"
                                        key={chat.id}
                                        onClick={() => {
                                            limit.current = 5;
                                            selected_session_id.current = chat.session_crypted;
                                            no_more_message_to_load.current = false;
                                            getMessages();
                                        }}
                                        className={`csb-session-btn ${selected_session_id.current === chat.session_crypted ? 'csb-session-active' : ''}`}
                                    >
                                        {chat.session_placeholder}
                                    </button>
                                ))}
                            </div>
                        )}   
                    </div>

                    {/* Alsó rész: Profil és Kreditek */}
                    <div className="csb-bottom">
                        <div className="csb-profile-section">
                            <button  
                                type="button" 
                                className="csb-profile-btn" 
                                onClick={() => setIsOpen(!isOpen)}
                            >
                                <img src={profil} className="csb-profile-img" alt="Profile" />
                            </button>
                            
                            {/* A felugró profil kártya konténere */}
                            <div className="csb-profile-popup">
                                {isOpen && (
                                    <Shield>
                                        <ProfilCard ref={cardRef} setCardVisibility={setIsOpen}/>
                                    </Shield>
                                )}
                            </div>
                        </div>
                        
                        <div className="csb-credits">
                            <p className="csb-credits-text">Remaining credits: <strong>{sub.messages}</strong></p>
                        </div>
                    </div>
                    
                </div>
            ) : (
                /* Becsukott állapot: Nyitó gomb */
                <div className="csb-open-container">
                    <button onClick={() => setNavVisible(true)} className="csb-open-btn" title="Open sidebar">
                        <img src={opensvg} className="csb-icon" alt="Open" />
                    </button>
                </div>
            )}
        </div>

    )
}