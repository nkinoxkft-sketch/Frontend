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
import { useAuth } from '../main';
import { api } from '../interceptor';
import { LoadingBar, LoadingSpinner } from '../Loading/Loading';
export const Bar = ( { getMessages, isLoadingResponseText, isLoadingPrevText, setIsLoadingPrevText, selected_session_id, limit, no_more_message_to_load, getting_messages, setResponseText }) =>{

    const setNewTab = () =>{
        
        console.log('newTab')
        no_more_message_to_load.current = true;
        limit.current = 5;
        selected_session_id.current = null;
        setCurrentSessionId(null);
        setResponseText([])

    }

    const [ currentSessionId, setCurrentSessionId ] = useState(null);

    const { sub } = useSub();

    const [navVisible, setNavVisible] = useState(true);

    const [isOpen, setIsOpen] = useState(false);

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {

        //console.log(windowSize.width)
        if(windowSize.width <= 768){

            setNavVisible(false);
            
        }

    }, [])

    const cardRef = useRef(null)

    const navigate = useNavigate();

    const session_limit = useRef(20);
    const loading_prev_sessions = useRef(false);

    const contentRef = useRef(null);
    const previousScrollHeightRef = useRef(null);

    const { isLogedIn } = useAuth();

    const [ sessions, setSessions] = useState([]);

    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const no_more_session = useRef(false);

    const first_load = useRef(true);
    const block_session_request = useRef(false);

    const getSessions = async () =>{

        try{
        
            if(block_session_request.current){

                block_session_request.current = false;

                return;

            }

            if(isLoadingSessions){ return }

            setIsLoadingSessions(true);

            //console.log('getsession')


            const response = await api.get('/getSessions',
                {

                params: { 
                limit: Number(session_limit.current),
                },

            });

            const data =  response.data.sessions;

            if(data){

                if(loading_prev_sessions.current){
        
                    setSessions(prev => [...prev, ...data]);

                }
                else {
                    
                    setSessions(data);
                    
                    no_more_session.current = false;
                  

                }
                
                
                if(data.length < 20){

                    no_more_session.current = true;

                }

            }
            

        }catch(err){

            console.log(err)

        }finally{

            setIsLoadingSessions(false);

        }

    }

    useEffect(() => {

        if(isLogedIn && !isLoadingPrevText && !isLoadingResponseText){

            session_limit.current = 20;
            //console.log('loadfirst')
            void getSessions();

        }

    }, [isLogedIn, isLoadingPrevText, isLoadingResponseText])

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

    useEffect(() => {
        
        const container = contentRef.current;

        if (!container) return; 
    
        const handleScroll = () => {
            
          const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;

          if (isNearBottom && !loading_prev_sessions.current && !no_more_session.current) {
    
            session_limit.current += 20;
    
            previousScrollHeightRef.current = container.scrollHeight;

            loading_prev_sessions.current = true;
           // console.log('loadlast')
            void getSessions();
    
          }
    
        };
  
        container.addEventListener('scroll', handleScroll);
    
    
        return () => {
          container.removeEventListener('scroll', handleScroll);
        };

    }, [isLoadingSessions]);


    useEffect(() => {

        loading_prev_sessions.current = false;

    }, [sessions])




    return(
       <div className="csb-container">
            {navVisible ? (
                <div className="csb-sidebar">

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
                        
                        <button type="button" className="csb-new-chat-btn" onClick={() => setNewTab()}>
                            + New chat
                        </button>
                        
                        <p className="csb-section-label">Recent</p>
                    </div>

                    {/* Középső rész: Korábbi beszélgetések (Görgethető) */}
                    <div className="csb-mid" ref={contentRef}>
                        {sub.status !== 'Basic' && sub.status !== null && (
                            <div className="csb-sessions">
                                {[...sessions].map((chat) => (
                                    <button
                                        type="button"
                                        key={chat.id}
                                        onClick={() => {
                                            if(selected_session_id.current !== chat.session_crypted){

                                                limit.current = 5;
                                                selected_session_id.current = chat.session_crypted;
                                                no_more_message_to_load.current = false;
                                                getting_messages.current = true;
                                                setCurrentSessionId(chat.session_crypted)
                                                setIsLoadingPrevText(true)
                                                block_session_request.current = true;
                                                getMessages();

                                            }
                                        }}
                                        className={`csb-session-btn ${currentSessionId === chat.session_crypted ? 'csb-session-active' : ''}`}
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