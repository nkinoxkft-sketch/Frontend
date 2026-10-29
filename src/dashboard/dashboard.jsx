import { useState,  useEffect, useRef } from 'react';

import './dashboardb.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Táblázatokhoz, pipálható listákhoz
import { Textarea } from './textarea';
import { api } from '../interceptor';
import { Bar } from './dashboard_bar';
import React from 'react';
import { CodeBlock } from './code';
import { LoadingBar } from '../Loading/Loading';
import { BackendError } from '../errors';
export const Dashboard = () =>{
  

  const [responseText, setResponseText] = useState([]);
  const [isLoadingResponseText, setIsLoadingResponseText] = useState(false);

  const contentRef = useRef(null);

  const previousScrollHeightRef = useRef(null);

  const [ onSelectSessionId, setOnSelectSessionId ] = useState(null);

  const [ isLoadingMessages, setIsLoadingMessages ] = useState(false);

  const isLoadingPrevMessages = useRef(false);

  const isMoreToLoad = useRef(true);

  const offset = useRef(5);

  const getMessages = async ( loadMoreMessages = false) =>{
    
    try{

      if(isLoadingMessages || !onSelectSessionId){ return }

      setIsLoadingMessages(true);

      const response = await api.get('/getMessages', {
        params: { 
          session_id: onSelectSessionId, 
          limit: Number(offset.current),
        },

      });
    
      const data =  response.data.messages;

      if(data.length < 5){

        isMoreToLoad.current = false

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
            else if(['txt', 'pdf'].includes(ext)){

              type = 'txt'

            }

            formattedMessages.push({ sender: 'user', backend_file: { url: file.fileurl, name: file.originalName, type: type} });

          } 

        }
        if(message.answare){

          formattedMessages.push({ sender: 'claude', text: message.answare });

        }
        

      } 

      if(loadMoreMessages){

        setResponseText(prev => [...formattedMessages, ...prev]);

      }
      else{ 
      
        setResponseText(formattedMessages);

      }
      

    }catch(err){

      console.log(err);
    }
    finally{

      setIsLoadingMessages(false);

    }
    
  };

  useEffect(() =>{

    if(onSelectSessionId && !isLoadingResponseText){

      offset.current = 5;
      isMoreToLoad.current = true
      void getMessages();

    }
    else if(!isLoadingResponseText){

      offset.current = 5;
      isMoreToLoad.current = true
      setResponseText([]);

    }

    setBackendError('')


  }, [onSelectSessionId])

  useEffect(() => {

    const container = contentRef.current;

    if (!container) return;

    if(isLoadingPrevMessages.current){

      isLoadingPrevMessages.current = false;

      const heightDifference = container.scrollHeight - previousScrollHeightRef.current;
      
      container.scrollTo({
        top: heightDifference,
        behavior: 'instant'
      });

    }else {

      if (responseText.length === 0) return;

      const lastMessage = responseText[responseText.length - 1];
      console.log(offset.current)
      if (lastMessage.sender === 'user' || offset.current === 5) {

        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'instant'
        });

      }

    }


  }, [responseText]);


  const handleScroll = () => {

    const container = contentRef.current;

    if(!container) return



    if (container.scrollTop <= 10 && isMoreToLoad.current && !isLoadingPrevMessages.current) {

      offset.current += 5;

      isLoadingPrevMessages.current = true;

      previousScrollHeightRef.current = container.scrollHeight;

      void getMessages(true);

    }

  }


  const [ backendError, setBackendError ] = useState('');
  

  return(

    <div className="cdash-screen">
      {isLoadingMessages && (

        <LoadingBar/>

      )}
    <Bar 

      isLoadingResponseText={isLoadingResponseText}
      setOnSelectSessionId={setOnSelectSessionId}
      onSelectSessionId={onSelectSessionId}
    />

    <div className="cdash-main-workspace">

        {/* Chat Előzmények / Üzenetek (Ez került felülre) */}
        <div className="cdash-chat-history" ref={contentRef} onScroll={handleScroll}>

            {responseText.length === 0 && (
              <div className="empty-chat-container">
                <div className="empty-state-content">
                  <div className="logo-icon">☁️</div>
                  <h1 className="brand-name">Cloudify</h1>
                  <p className="welcome-text">Pick a chat from the menu or start a fresh one to make it rain ideas.</p>
                </div>
              </div>
            )}
            
            {responseText.map((msg, index) => (

                <ChatMessage  isLoadingResponseText={isLoadingResponseText} key={index} msg={msg} backendError={backendError} />

            ))}
            
            {isLoadingResponseText && (
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
            <BackendError error={backendError}/>
        </div>

        {/* Szövegbeviteli mező (Ez került alulra) */}
        <div className="cdash-input-area">
            <Textarea 
                onSelectSessionId={onSelectSessionId} 
                isLoadingResponseText={isLoadingResponseText}
                offset={offset}
                setIsLoadingResponseText={setIsLoadingResponseText}
                setResponseText={setResponseText}
                setOnSelectSessionId={setOnSelectSessionId}
                setBackendError={setBackendError}

            />
        </div>

    </div>
</div>)

}

export function GeminiPromptAccordion({ promptText }) {
    if (!promptText) {
        return (<div></div>);
    }

    // 1. Azonnal kiszámoljuk, hogy túl hosszú-e (nincs szükség useEffect-re)
    const isLarge = promptText.length > 100;
    const previewText = isLarge ? promptText.slice(0, 100) + '...' : promptText;

    // 2. Csak az isOpen state marad meg
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className='msg-summary'>
            {(isLarge && !isOpen) && (
                <div className='msg-summary-closed'>
                    {previewText}
                    <button className='msg-summary-btn' onClick={() => setIsOpen(true)}>
                        <svg 
                        className="w-4 h-4 text-current shrink-0" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            )}

            {(!isLarge || isOpen) && (
                <div className='msg-summary-open'>
                    {promptText}
                    {isLarge && (
                        <button className='msg-summary-btn' onClick={() => setIsOpen(false)}>
                            <svg 
                            className="w-4 h-4 text-current shrink-0" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor" 
                            strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export const ChatMessage = React.memo(({ msg, isLoadingResponseText}) => {


  

  return (

         <div className={`cmsg-row cmsg-row-${msg.sender}`}>
   
            {((msg.text && msg.text.length !== 0) || msg.file || msg.backend_file) && (
              <div className={`cmsg-bubble cmsg-bubble-${msg.sender}`}>

                {/* Felhasználó szövege */}

                {msg.sender === 'user' && (
                    <div className="cmsg-user-content">
                        {(msg.text !== 'file processing') && (
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
                                                isLoading={isLoadingResponseText}
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
            
            )}
            
          </div>
            );
          }, (prevProps, nextProps) => {
            
            // ITT A LÉNYEG: Ezt a feltételt kötelező megadni a memo-nak, 
            // hogy ne renderelje újra a már kész üzeneteket!
            return prevProps.msg.text === nextProps.msg.text && 
                  prevProps.msg.isComplete === nextProps.msg.isComplete && 
    prevProps.isLoadingResponseText === nextProps.isLoadingResponseText &&
    prevProps.backendError === nextProps.backendError;
});