import { useState, forwardRef, useEffect, useRef, useLayoutEffect } from 'react';
import './login.css';
import './dashboard.css';
import { jwtDecode } from "jwt-decode";
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import ai from './assets/aif.svg'
import { useSub } from '../useStates/useSub';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useSessions } from '../useStates/useSessions';
import { useQueryClient } from '@tanstack/react-query';
import opensvg from './assets/open.svg'
import closesvg from './assets/close.svg'
import profil from './assets/profil.svg'
import plus from './assets/plus.svg'
import { Shield } from './App';
import { ProfilCard } from './Profil';
import remarkGfm from 'remark-gfm'; // Táblázatokhoz, pipálható listákhoz
import { useUser } from '../useStates/useUser';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Textarea } from './textarea';
import { api } from './interceptor';
export const Dashboard = ({ setDashBoard, setIsLogedIn }) =>{
  


  const { sub } = useSub();


  const [responseText, setResponseText] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const getIsLoading = useRef(false);

  const [sessionName, setSessionName] = useState('');

  const [newTab, setNewTab] = useState(true);

  const [selectTab, setSelectTab] = useState(false);

  const limit = useRef(10);

  const [ activeSessionId, setActiveSessionId] = useState(null);

  const top = useRef(false);;
  useLayoutEffect(() => {
  // Csak akkor csinálunk valamit, ha van elmentett magasság (tehát régebbi üzeneteket töltöttünk)
  if (previousScrollHeightRef.current > 0) {
    const box = talkingSpaceRef.current;
    
    // 3. LÉPÉS: Kiszámoljuk, mennyivel lett magasabb a doboz az új üzenetektől
    const heightDifference = box.scrollHeight - previousScrollHeightRef.current;
    
    // 4. LÉPÉS: A görgetősávot pontosan ennyivel toljuk lejjebb, így a képernyő "egy helyben" marad
    box.scrollTop = heightDifference;
    
    // Visszaállítjuk 0-ra, hogy normál üzenetküldésnél vagy legörgetésnél ne kavarjon be
    previousScrollHeightRef.current = 0;

    getIsLoading.current = false
  }
}, [responseText]);


  const newTabhandle = () =>{

    setNewTab(true)
    setResponseText([])
    setActiveSessionId(null)
    limit.current = 10
    top.current = false;


  }


// A komponensed tetején:
const talkingSpaceRef = useRef(null); 
// Ne felejtsd el rátenni a JSX-ben: <div className="talkingspace" ref={talkingSpaceRef}>

// 1. CSAK A GÖRGETÉS FIGYELÉSE (Ez csak egyszer fut le, amikor betölt a komponens)

useEffect(() => {
  const box = talkingSpaceRef.current;

  if (!box) return;

  const handleScroll = async () => {
    // Ha majdnem az alján vagyunk
    const isAtBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 5;

    const isAlmostAtTop = box.scrollTop <= 50;

    if (isAlmostAtTop && !getIsLoading.current && !top.current ) {

      getIsLoading.current = true
      limit.current = limit.current + 10
      
      await getMessages(activeSessionId, sessionName);
      

    } 

    if (isAtBottom) {
      box.classList.remove('is-overflowing');
    } else {
      // Csak akkor tesszük rá az overflow class-t, ha tényleg van mit görgetni
      if (box.scrollHeight > box.clientHeight) {
        box.classList.add('is-overflowing');
      }
    }
  };

  box.addEventListener('scroll', handleScroll);
  // Cleanup: amikor a komponens megsemmisül, levesszük a figyelőt
  return () => box.removeEventListener('scroll', handleScroll);
}, [activeSessionId, sessionName]); // <-- ÜRES TÖMB! Ez a titka, hogy ne akadjon be streameléskor.

useEffect(() => {
  const box = talkingSpaceRef.current;

  if (!box) return;

  const isOverflowing = box.scrollHeight > box.clientHeight;
  const isAtBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 5;

  const almost = box.scrollHeight - box.scrollTop <= box.clientHeight + 800;

  if(almost){
    box.scrollTo({
      top: box.scrollHeight,
      behavior: 'auto' // Streamelés alatt marad az auto!
    });

  }
  if (isOverflowing && !isAtBottom) {
    box.classList.add('is-overflowing');

  } else {
    box.classList.remove('is-overflowing');

  }

  if(selectTab){

    box.scrollTo({
      top: box.scrollHeight,
      behavior: 'auto'
    });

    setSelectTab(false)
  }
}, [responseText]); // Ez lefut minden új szónál, de már NEM hoz létre event listenereket!

  const {sessions} = useSessions();

  const previousScrollHeightRef = useRef(0);

  const getMessages = async (session_id, session_name) =>{

    console.log(activeSessionId ,sessionName, 'asd', limit.current, getIsLoading.current)
    setNewTab(false)

    const response = await api.get('/getMessages', {
        params: { 
          session_id: session_id, 
          limit: limit.current,
        },

    });
   

    const data =  response.data.messages;

    console.log(data)
  
    const formattedMessages = [];  
    
    data.forEach(msg => {

      if (msg.promt) {
        formattedMessages.push({ sender: 'user', text: msg.promt });
      }
      if (msg.file) {

        msg.file.forEach(iter => {
          console.log(iter)
          const ext = iter.originalName.split('.').pop().toLowerCase();

          let type;

          if(['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)){

            type = 'image'

          }
          else if(['txt'].includes(ext)){

            type = 'txt'

          }

          formattedMessages.push({ sender: 'user', backend_file: { url: iter.fileurl, name: iter.originalName, type: type} });

        })
        
      
      }

      if (msg.answare) {
        formattedMessages.push({ sender: 'claude', text: msg.answare });
      }
    });


    if(getIsLoading.current){
      
      const box = talkingSpaceRef.current;
      previousScrollHeightRef.current = box.scrollHeight;

      if(formattedMessages.length ===0){
        top.current = true;
        limit.current = limit.current - 10;
        console.log(limit.current)
        return
      }
      setResponseText(prev => [...formattedMessages, ...prev]);

    
    }
    else{

      setResponseText(formattedMessages);

      setSessionName(session_name)

      setSelectTab(true)

    }
    
};


  const [navVisible, setNavVisible] = useState(false)

  const [isOpen, setIsOpen] = useState(false);
  
  const cardRef = useRef(null);

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

    <div className='dashboardPage'>

      {navVisible && (
        <div className='cbar'>

          <div className='space-box'>
            <div className='borderbottom'>
              <div className=' cunder'>
                <Link to='/' className='logo'>
                  <img src={ai} className='logo' onClick={() => setDashBoard(false)} alt='logo'/>
                </Link>
                <p className='titlec'>Claudify</p>
                <div className='buttonstore'>
                  <button type='button'
                    className="buttonmenuoff"
                    onClick={() => setNavVisible(!navVisible)}
                  >
                    <img src={closesvg} className='buttonmenuoff' onClick={() => setNavVisible(false)} alt='logo'/>
                  </button>
                </div>
              </div>
              <button type='buttom' className='navbutton cbutton' onClick={() => newTabhandle()}>New chat</button>
              <p className='desc cdesc'>Recent</p>
            </div>
                      
            {sub.status !== 'Basic' && sub.status !== null && (
              <div className='recent'>
              
                {[...sessions].reverse().map((chat) => (
                  <button
                  type='button'
                    key={chat.id}
                    onClick={() => {
                      top.current = false
                      limit.current = 10
                      getMessages(chat.id, chat.session_name);
                      setActiveSessionId(chat.id);
                      
                    }}
                    className={`cbuttonlist ${activeSessionId === chat.id ? 'active-dash' : ''}`}
                  >
                    {chat.session_placeholder}
                  </button>
                ))}
              </div>
            )}   
  
          </div>
          <div className='profil-btn-d'>
            <button  type='button' href='login' className='button relativebutton-d' onClick={() => setIsOpen(!isOpen)}><img src={profil} className='navLogo' alt='logo'/></button>
            <div className='custom-card'>
              {isOpen && <Shield setIsOpen={setIsOpen} setIsLogedIn={setIsLogedIn}><ProfilCard setIsLogedIn={setIsLogedIn} ref={cardRef} setCardVisibility={setIsOpen}/></Shield>}
            </div>
            <div><p className='credit-text'>Remaining credits: {sub.messages}</p></div>
          </div>   

        </div>
      )}



      <div className='ans-ask-pair'>
            {!navVisible && (
              <div className='logobar'>
                <button onClick={() => setNavVisible(true)} className='opensvg'>
                  <img src={opensvg} className='buttonnavon' onClick={() => setNavVisible(!navVisible)} alt='logo'/>
                </button>
              </div>

            )}
            <div className='talkingwrap'>
            <div className={`talkingspace`} ref={talkingSpaceRef} >
              <div className='answare ' >
                
                {responseText.map((msg, index) => (
                  <div key={index} className={`message-container ${msg.sender}`}>
                 
                    {(msg.sender === 'user' && ((msg.text && msg.text !== 'file processing') || (msg.file && msg.file.length > 0) || msg.backend_file)) && (
                      <div className="user-message-bubble">
                        {msg.text !== 'file processing' && (
                              <p className="sendertext">{msg.text}</p>
                        )}
                        
                        {msg.file && Object.keys(msg.file).length > 0 && (
                          
                          <div className="file-preview-container">
                       
                            {msg.file.map((item) => (
                              
                              <div key={item.id} className="preview-item-wrapper">
                                
                                {item.previewUrl ? (
                                  <div className="preview-item image-preview">
                                    <a 
                                      href={item.previewUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-block cursor-pointer"
                                    >
                                      <img 
                                        src={item.previewUrl} 
                                        alt="Feltöltött fájl előnézete" 
                                        className="preview-item image-preview"  
                                      />
                                    </a>
                                    <span className="file-name">{item.file.name}</span>
                                  </div>
                                ) : (
                                  <div className="preview-item doc-preview">
                                    <span className="file-icon">📄</span>
                                    <div className="file-info">
                                      <span className="file-name">{item.file.name}</span>
                                      <span className="file-size">{(item.file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.backend_file && msg.backend_file.type === 'image' && (
                          
                          <div className="preview-item image-preview">
                                    <a 
                                      href={msg.backend_file.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-block cursor-pointer"
                                    >
                                      <img 
                                        src={msg.backend_file.url} 
                                        alt={msg.backend_file.name} 
                                        className="preview-item image-preview"  
                                      />
                                    </a>
                      
                          </div>
                        )}
                        {msg.backend_file && msg.backend_file.type === 'txt' && (

                          <div className="preview-item doc-preview">
                             <a 
                                      href={msg.backend_file.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-block cursor-pointer"
                            > 
                            <span className="file-icon">📄</span>
                            <div className="file-info">
                              <span className="file-name">{msg.backend_file.name}</span>
                            </div>
                            </a>
                          </div>

                        )}
                        

                      </div>
                    )}
                   {msg.sender === 'claude' && (
                      <div className="claudeans w-full max-w-full block min-w-0">
                        <div className="claude-message-bubble prose prose-lg prose-invert max-w-none text-base leading-relaxed break-words block space-y-8 prose-p:my-5 prose-headings:my-6 prose-ul:my-5 prose-li:my-2">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ node, inline, className, children, ...props }) {
                                // Kiszedjük a nyelvet az osztálynévből (pl. "language-javascript" -> "javascript")
                                const match = /language-(\w+)/.exec(className || '');

                                // Ha több soros kódblokk (van megadott nyelv vagy nem inline)
                                if (!inline && match) {
                                  return (
                                    <div className="my-3 rounded-lg overflow-hidden border border-gray-700">
                                      <div className="bg-gray-800 text-gray-300 text-sm px-3 py-1 font-mono flex justify-between">
                                        <span>{match[1]}</span>
                                      </div>
                                      <SyntaxHighlighter
                                        {...props}
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{
                                          margin: 0,
                                          padding: '1rem',
                                          fontSize: '1rem',
                                          backgroundColor: '#1e1e1e',
                                        }}
                                      >
                                        {String(children).replace(/\n$/, '')}
                                      </SyntaxHighlighter>
                                    </div>
                                  );
                                }

                                // Ha csak sima sorközi kód (pl. `const a = 1;` a mondat közepén)
                                return (
                                  <code className="bg-gray-800 text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="loading">
                  
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      style={{ animation: 'spin 1s linear infinite' }}
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span className='loadingspan'>Thinking</span>
                  </div>
                )}
                <div />
              </div >

              
            
          
            </div>
            </div>
              <Textarea setIsLoading={setIsLoading} isLoading={isLoading} setNewTab={setNewTab} newTab={newTab}
               sessionName={sessionName} setSessionName={setSessionName} setResponseText={setResponseText} responseText={responseText} limit={limit} setDashboard={setDashBoard}/>
          </div> 
        </div>


  );

}