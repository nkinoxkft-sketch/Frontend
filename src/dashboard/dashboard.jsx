import { useState,  useEffect, useRef, useLayoutEffect } from 'react';

import './dashboardb.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Táblázatokhoz, pipálható listákhoz
import { Textarea } from './textarea';
import { api } from '../interceptor';
import { Bar } from './dashboard_bar';
import { useAuth } from '../main';
import React from 'react';
import { CodeBlock } from './code';

export const Dashboard = () =>{
  
  const { isLogedIn } = useAuth()

  const current_session_id_ref = useRef(null);
  const number_of_messages_loaded = useRef(5);
  const new_tab = useRef(false);

  const [sessions, setSessions] = useState([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const [responseText, setResponseText] = useState([]);
  const [isLoadingResponseText, setIsLoadingResponseText] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const isLoadingMoreMessageInSession = useRef(true);

  const isGettinGettingMessagesInside = useRef(false)

  const isChangedTab = useRef(true);

  const selected_get_section = useRef(false);

  const sent_message = useRef(false);

  const isAutoScrolling = useRef(false);


  const getMessages = async (new_session_id, load_previous) =>{

    //console.log(new_session_id, current_session_id_ref.current)



    
    if(new_session_id !== current_session_id_ref.current && !load_previous){

      isChangedTab.current = true;

    }
    

    try{

      setIsLoadingResponseText(true);

      current_session_id_ref.current = new_session_id;

      console.log('getmessage limit', number_of_messages_loaded.current)

      const response = await api.get('/getMessages', {
        params: { 
          session_id: current_session_id_ref.current, 
          limit: Number(number_of_messages_loaded.current),
        },

      });
    
      const data =  response.data.messages;

      console.log(data.length)

      if(data.length < 10){

        isLoadingMoreMessageInSession.current = false

      }
    
      const formattedMessages = [];  

      for(const message of data){

        if(message.promt){

          formattedMessages.push({sender: 'user', text: message.promt});

        }
        if(message.file){

          for(const file of message.file){

            const ext = file.originalName.split('.').pop().toLowerCase();

            let type;

            if(['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)){

              type = 'image'

            }
            else if(['txt'].includes(ext)){

              type = 'txt'

            }

            formattedMessages.push({ sender: 'user', backend_file: { url: file.fileurl, name: file.originalName, type: type} });

          } 

        }
        if(message.answare){

          formattedMessages.push({ sender: 'claude', text: message.answare });

        }
        

      } 
      if(load_previous){

        setResponseText(prev => [...formattedMessages, ...prev]);
   
      }
      else{
        isGettinGettingMessagesInside.current = false;
        isLoadingMoreMessageInSession.current = true;
  


        setResponseText(formattedMessages);

      }
      

    }catch(err){

      console.log(err);
    }
    finally{

      setIsLoadingResponseText(false);

    }
    
  };

  const getSessions = async () =>{

    try{

      const response = await api.get('/getSessions');

      const data =  response.data.sessions;

      if(data){

        //console.log('sessions', data)
        setSessions(data);

      }
      

    }catch(err){

      console.log(err)

    }finally{

      setIsLoadingSessions(false);

    }

  }

  useEffect(() => {

    if(isLogedIn && !isLoading && new_tab.current){
      console.log('session')
      void getSessions();


    }


  }, [isLogedIn, isLoading])

  useEffect(() => {

    void getSessions();

  }, [isLogedIn])

  function setNewTab(){

    new_tab.current = true;
    current_session_id_ref.current = null;
    isGettinGettingMessagesInside.current = false;
    isLoadingMoreMessageInSession.current = true;

    setResponseText([]);

  }

  const contentRef = useRef(null);
  const previousScrollHeightRef = useRef(0);

  useEffect(() => {

    const box = contentRef.current;

    if(selected_get_section.current || sent_message.current ){
      
      box.scrollTop = box.scrollHeight;

      selected_get_section.current = false;

      sent_message.current = false;

      isAutoScrolling.current = true;

      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 50);

    }

  }, [responseText])


useLayoutEffect(() => {
    const container = contentRef.current;
    if (!container || previousScrollHeightRef.current === 0) return;

    if (!selected_get_section.current && !sent_message.current) {
        const heightDifference = container.scrollHeight - previousScrollHeightRef.current;
        
        // 1. Mentsük el az eredeti scroll stílust, majd kényszerítsük az azonnali ugrást
        const originalScrollBehavior = container.style.scrollBehavior;
        container.style.scrollBehavior = 'auto'; 

        // 2. Beállítjuk a pozíciót (most már azonnal fog oda ugrani, animáció nélkül)
        container.scrollTop = heightDifference;

        // 3. Visszaadjuk a böngészőnek az irányítást (hogy a sima görgetés továbbra is működjön)
        // Ezt érdemes egy requestAnimationFrame-be tenni, hogy a DOM frissítés után történjen
        requestAnimationFrame(() => {
            container.style.scrollBehavior = originalScrollBehavior;
        });
    }

    previousScrollHeightRef.current = 0;
}, [responseText]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return; 
    console.log(isLoadingResponseText)

    const handleScroll = () => {
      
      if (container.scrollTop <= 10 && !isLoadingResponseText && isLoadingMoreMessageInSession.current && !isAutoScrolling.current ) {
        number_of_messages_loaded.current += 5;
        isGettinGettingMessagesInside.current =true;
        previousScrollHeightRef.current = container.scrollHeight;
        getMessages(current_session_id_ref.current, true);

      }

      if(container.scrollTop + container.clientHeight >= container.scrollHeight){

        container.classList.remove('fade-effect-bottom')

      }
      else{

        container.classList.add('fade-effect-bottom')

      }
    };

    container.addEventListener('scroll', handleScroll);

    // Takarítás a komponens újrafutásakor vagy megszűnésekor
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isLoadingResponseText]);


  return(

    <div className="cdash-screen">

    <Bar 
        sessions={sessions} 
        current_session_id_ref={current_session_id_ref} 
        setNewTab={setNewTab} 
        number_of_messages_loaded={number_of_messages_loaded} 
        getMessages={getMessages} 
        selected_get_section={selected_get_section}
    />

    <div className="cdash-main-workspace">

        {/* Chat Előzmények / Üzenetek (Ez került felülre) */}
        <div className="cdash-chat-history" ref={contentRef}>
            {responseText.map((msg, index) => (
                <ChatMessage key={index} msg={msg} />
            ))}
            
            {isLoading && (
                <div className="cdash-loading-wrapper">
                    <div className="cdash-loading-bubble">
                        <svg 
                            className="cdash-spinner"
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                        >
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        <span className="cdash-loading-text">Thinking</span>
                    </div>
                </div>
            )}
        </div>

        {/* Szövegbeviteli mező (Ez került alulra) */}
        <div className="cdash-input-area">
            <Textarea 
                current_session_id_ref={current_session_id_ref} 
                number_of_messages_loaded={number_of_messages_loaded} 
                new_tab={new_tab} 
                isChangedTab={isChangedTab}
                setResponseText={setResponseText} 
                responseText={responseText} 
                setIsLoading={setIsLoading} 
                isLoading={isLoading}
                sent_message={sent_message}
            />
        </div>

    </div>
</div>)

}

export function GeminiPromptAccordion({ promptText }) {
  // Opcionálisan levághatod a szöveget az első 1-2 sorra, ha zárva van, 
  // de a `<details>` miatt az egész benne lehet, csak a CSS-sel elrejthetjük a felesleget, 
  // vagy megadhatsz egy rövidített leírást is.
  if(!promptText){
    return (<div></div>)
  }
  const previewText = promptText.length > 100 ? promptText.slice(0, 100) + '...' : promptText;

  const [islarge, setIslarge] = useState(false);

  useEffect(() => {

    if(promptText.length > 100){

      setIslarge(true);

    }
  
  }, []);


  return (
    <details className="group my-2 text-[#e3e3e3] text-base leading-relaxed transition-all">
      {/* A fejléc: nincs keret, nincs háttér, csak a szöveg és egy diszkrét nyíl */}
      <summary onClick={(e) => {
      if (!islarge) e.preventDefault();
    }}
    className={`summ flex items-start justify-between gap-3 py-2  transition-colors ${
      islarge 
        ? "cursor-pointer group-hover:text-white" 
        : "cursor-default pointer-events-none"
    }`}
      
      >
        <div className="flex-1">
          {/* Zárt állapotban a preview vagy rövidített szöveg látszik, nyitva eltűnik ez a blokk */}
          <span className="maxw block group-open:hidden text-[#c4c7c5]">
            {previewText}
          </span>
          {/* Nyitott állapotban pedig az egész teljes szöveg látszik a fejléc részeként is */}
          <span className="maxw hidden group-open:block whitespace-pre-wrap">
            {promptText}
          </span>
        </div>
        
        {/* Diszkrét nyíl ikon jobbra */}
        {islarge && (
          <div>
            <svg 
            className="w-4 h-4 text-gray-400 mt-1 transition-transform duration-200 group-open:rotate-180 shrink-0" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          </div>
        )}
        
      </summary>

      {/* Ha hosszabb a szöveg, a lenyíló részben biztosítjuk, hogy a teljes tartalom olvasható legyen */}
      <div className="group-open:block hidden pt-2 pb-3 text-[#c4c7c5] whitespace-pre-wrap text-sm">
        {/* Itt már teljes terjedelmében ott van */}
      </div>
    </details>
  );
}

export const ChatMessage = React.memo(({ msg }) => {
  return (
    
         <div className={`cmsg-row cmsg-row-${msg.sender}`}>
            <div className={`cmsg-bubble cmsg-bubble-${msg.sender}`}>
                
                {/* Felhasználó szövege */}
                {msg.sender === 'user' && (
                    <div className="cmsg-user-content">
                        {msg.text !== 'file processing' && (
                            <GeminiPromptAccordion promptText={msg.text}/>
                        )}
                    </div>
                )}

                {/* Csatolt fájlok (Frontend) */}
                {msg.file && Object.keys(msg.file).length > 0 && (
                    <div className="cmsg-attachments-container">
                        {msg.file.map((item) => (
                            <div key={item.id} className="cmsg-attachment-item">
                                {item.previewUrl ? (
                                    <a 
                                        href={item.previewUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="cmsg-image-link"
                                    >
                                        <img 
                                            src={item.previewUrl} 
                                            alt="Feltöltött fájl előnézete" 
                                            className="cmsg-image-preview"  
                                        />
                                        <span className="cmsg-file-name-overlay">{item.file.name}</span>
                                    </a>
                                ) : (
                                    <div className="cmsg-doc-preview">
                                        <span className="cmsg-doc-icon">📄</span>
                                        <div className="cmsg-doc-info">
                                            <span className="cmsg-doc-name">{item.file.name}</span>
                                            <span className="cmsg-doc-size">{(item.file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Csatolt fájlok (Backend - Kép) */}
                {msg.backend_file && msg.backend_file.type === 'image' && (
                    <div className="cmsg-attachments-container">
                        <div className="cmsg-attachment-item">
                            <a 
                                href={msg.backend_file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="cmsg-image-link"
                            >
                                <img 
                                    src={msg.backend_file.url} 
                                    alt={msg.backend_file.name} 
                                    className="cmsg-image-preview"  
                                />
                            </a>      
                        </div>
                    </div>
                )}

                {/* Csatolt fájlok (Backend - TXT/Doc) */}
                {msg.backend_file && msg.backend_file.type === 'txt' && (
                    <div className="cmsg-attachments-container">
                        <div className="cmsg-attachment-item">
                            <a 
                                href={msg.backend_file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="cmsg-doc-link"
                            > 
                                <span className="cmsg-doc-icon">📄</span>
                                <div className="cmsg-doc-info">
                                    <span className="cmsg-doc-name">{msg.backend_file.name}</span>
                                </div>
                            </a>
                        </div>
                    </div>
                )}
              
                {/* Claude Markdown Válasza */}
                {msg.sender === 'claude' && (
                    <div className="cmsg-markdown-content">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                pre: ({ children }) => <>{children}</>,
                                code({ node, inline, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const codeString = String(children).replace(/\n$/, '');
                                    const isCodeBlock = match || (!inline && codeString.includes('\n'));

                                    if (isCodeBlock) {
                                        return (
                                            <CodeBlock
                                                language={match ? match[1] : 'text'}
                                                code={codeString}
                                                {...props}
                                            />
                                        );
                                    }

                                    return (
                                        <code
                                            className="inline text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono bg-neutral-800"
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                },
                            }}
                        >
                            {msg.text}
                        </ReactMarkdown>
                    </div>
                )}

            </div>
          </div>
            );
          }, (prevProps, nextProps) => {
            // ITT A LÉNYEG: Ezt a feltételt kötelező megadni a memo-nak, 
            // hogy ne renderelje újra a már kész üzeneteket!
            return prevProps.msg.text === nextProps.msg.text && 
                  prevProps.msg.isComplete === nextProps.msg.isComplete;
});