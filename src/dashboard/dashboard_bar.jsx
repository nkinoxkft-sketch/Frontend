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
import { LoadingBar } from '../Loading/Loading';
import { useSession } from '../../useStates/useSession';

export const Bar = ( { isLoadingResponseText, setOnSelectSessionId, onSelectSessionId  }) =>{

    const { sub } = useSub();  

    const navRef = useRef(null);

    const [navVisible, setNavVisible] = useState(true);

    const [isOpen, setIsOpen] = useState(false);

    const [ windowSize ] = useState({

        width: window.innerWidth,

    });

    useEffect(() => {

        if(windowSize.width <= 768){

            setNavVisible(false);
            
        }

    }, [])

    const cardRef = useRef(null)

    const navigate = useNavigate();


    useEffect(() => {

        const handleClickOutside = (event) => {
            
            if (cardRef.current && !cardRef.current.contains(event.target)) {

                setIsOpen(false); 

            }

            if (navRef.current && !navRef.current.contains(event.target) && windowSize.width <= 768) {

                setNavVisible(false); 

            }
        };

        if (isOpen) {

            document.addEventListener('mousedown', handleClickOutside);

        }

        if (navVisible) {

            document.addEventListener('mousedown', handleClickOutside);

        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, [isOpen, navVisible]);

    const { sessions, isLoadingSessions, handleScroll, listRef} = useSession(isLoadingResponseText);

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    useEffect(() => {
        // 2. Beállítjuk a DOM-ra és a meta tagre a aktuális témát
        document.documentElement.setAttribute('data-theme', theme);

        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');

    }, [theme]); // Akkor fut le, ha a theme változik

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        localStorage.setItem('theme', nextTheme);
    };

    return(
       <div className="csb-container">
            {navVisible ? (
                <div className="csb-sidebar" ref={navRef}>

                    {isLoadingSessions && (

                        <LoadingBar/>

                    )}
                    
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
                        
                        <button type="button" className="csb-new-chat-btn" onClick={() => {setOnSelectSessionId(null)}}>
                            + New chat
                        </button>
                        
                        <p className="csb-section-label">Recent</p>
                    </div>

                    {/* Középső rész: Korábbi beszélgetések (Görgethető) */}
                    <div className="csb-mid" ref={listRef} onScroll={handleScroll}>
                        {sub.status !== 'Basic' && sub.status !== null && (
                            <div className="csb-sessions">
                                {[...sessions].map((chat) => (
                                    <button
                                        type="button"
                                        key={chat.id}
                                        onClick={() => {
                                            
                                            if(onSelectSessionId !== chat.session_crypted){

                                                setOnSelectSessionId(chat.session_crypted);
                                                
                                                if(windowSize.width <= 768){
                                           
                                                    setNavVisible(false);
                                                    
                                                }

                                            }
                                        }}
                                        className={`csb-session-btn ${onSelectSessionId === chat.session_crypted ? 'csb-session-active' : ''}`}
                                    >
                                        {chat.session_placeholder}
                                    </button>
                                ))}

                            </div>
                        )}   
                    </div>

                    {/* Alsó rész: Profil és Kreditek */}
                    <div className="csb-bottom">
                        
                            { theme === 'dark' && (
                                <div className="csb-theme-toggle">
                                    <button className="csb-theme-btn" id="themeToggleBtn" aria-label="Téma váltása" onClick={() => toggleTheme('light')}>
                                        <svg className="csb-theme-icon csb-theme-icon-dark" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <span className="csb-theme-text">Light mode</span>
                                    </button>
                                    
                                </div>
                            )}
                            { theme === 'light' && (
                                <div className="csb-theme-toggle">
                                    <button className="csb-theme-btn" id="themeToggleBtn" aria-label="Téma váltása" onClick={() => toggleTheme('dark')}>
                                        <svg className="csb-theme-icon csb-theme-icon-light" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                                            <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                        <span className="csb-theme-text">Dark mode</span>
                                    </button>
                                    
                                </div>
                            )}
                        
                 
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