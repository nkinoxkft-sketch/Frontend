import { useEffect } from 'react';
import './textarea.css';
import { useRef, useState } from 'react';
import plus from './assets/plus.svg'
import { useSub } from '../useStates/useSub';
import { useUser } from '../useStates/useUser';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, setAccessToken, getAccessToken} from './interceptor';
import axios from 'axios';

export const Textarea = ( {setIsLoading, isLoading, setNewTab, newTab, sessionName, responseText, setSessionName, setResponseText, limit, setDashboard}) =>{

    const { user } = useUser();
    const { sub } = useSub();

    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const [files, setFiles] = useState([]);
    const [selectedModel, setSelectedModel] = useState('Sonnet');
    const [selectedEffort, setSelectedEffort] = useState('Low');
    const [isDragging, setIsDragging] = useState(false);
    const [comment, setComment] = useState('');
    const [isOpenPlus, setIsOpenPlus] = useState(false);

    const [content, setContent] = useState('')

    const textareaRef = useRef(null);

    const handleChange = (e) =>{

        const target = e.currentTarget;
        
        let currentHtml = target.innerHTML;
        let currentText = target.textContent || target.innerText;

        setContent(currentText)

        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`; 
    
        if (target.scrollHeight > 100) {
          target.style.overflowY = 'auto'; 
        } else {
          target.style.overflowY = 'hidden'; 
        }

        if (currentHtml === '<br>' || currentHtml === '<br/>' || currentText.trim() === '') {
    
            target.innerHTML = ''; 

            setContent('')

        }


    }
    const MAX_FILE_SIZE = 10 * 1024 * 1024; 

    const handlePaste = (e) => {

        const clipboardFiles = e.clipboardData?.files;

        if (clipboardFiles && clipboardFiles.length > 0) {

            e.preventDefault(); 
            handleFilesSelected(clipboardFiles);
        }
    };

    const handleFilesSelected = (newFilesList) => {
        const fileArray = Array.from(newFilesList);
        const validFiles = [];

        fileArray.forEach((file) => {
         
            if (file.size > MAX_FILE_SIZE) {
                alert(`A(z) "${file.name}" fájl túl nagy! A megengedett maximum 10 MB.`);
                return; 
            }

            validFiles.push({
                file,
                id: Math.random().toString(36).substring(2, 9),
                previewUrl: file.type.startsWith('image/')  ? URL.createObjectURL(file) : null
            });
        });

        setFiles((prev) => [...prev, ...validFiles]);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(e.target.files);
            e.target.value = null; 
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesSelected(e.dataTransfer.files);
        }
    };

    const removeFile = (id) => {

        setFiles((prev) => prev.filter((item) => item.id !== id));

    };

    const handleKeyDown = (e) => {

        if (e.key === 'Enter' && !e.shiftKey) {

            e.preventDefault(); 
        
            handleSend();
        }

    };

    useEffect(() =>{

        const textarea = textareaRef.current;

        if(textarea){

            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;

        }

    }, [files])

    const plusIconRer = useRef(null);

    useEffect(() => {

        const handleClickOutside = (event) =>{

            if(plusIconRer.current && ! plusIconRer.current.contains(event.target)){

                setIsOpenPlus(false)

            }
        }
        if (isOpenPlus) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };



    }, [isOpenPlus])

    const abortControllerRef = useRef(null);

    const handleSend = async () => {
        

        if(isLoading){

            return

        }

        setIsLoading(true)

        abortControllerRef.current = new AbortController();

        const messageText = textareaRef.current.textContent.trim();
      
        if (messageText.trim() || files.length !== 0) {

            try{
            
                const formData = new FormData();
            
                    formData.append('promt', messageText);     
                    console.log(sessionName, 'kuldott session name')
                    formData.append('sessionName', sessionName);  
                    formData.append('isNewTab', newTab);   
                    formData.append('instruct', comment);     
                    formData.append('email', user.email);    
                    formData.append('model', selectedModel); 
                    console.log('FormData sessionName:', formData.get('sessionName'));

                    files.forEach((item) => {

                        formData.append('files', item.file); 

                    });

                if(newTab){

                    setNewTab(false);

                }    

                let attemps = 0;

                let response;

                while(attemps < 2){

                    response = await fetch('/api/ask', {
                        method: 'POST',
                        signal: abortControllerRef.current.signal,
                        headers: {
                            'Authorization': `Bearer ${getAccessToken()}`
                        },
                        body: formData 
                    });

                    if(response.status === 403){


                         const axiosresponse = await axios.post('http://localhost:8080/api/auth/refresh', {}, {
                            withCredentials: true 
                        });

                        const newAccessToken = axiosresponse.data.accessToken;
                        setAccessToken(newAccessToken);

                    }
                    else{
                        break;
                    }


                    attemps++;

                }

                setResponseText((prev) => [...prev, { sender: 'user', text: messageText }]);
                setResponseText((prev) => [...prev, { sender: 'user', file: files }]);

                if (textareaRef.current) {

                    const textarea = textareaRef.current;

                    textareaRef.current.innerHTML = "";

                    textarea.style.height = 'auto';

                    textarea.style.height = `${textarea.scrollHeight}px`;

                    setFiles([])

                }

                const sessionId = response.headers.get('X-Session-ID');
                setSessionName(sessionId);
          
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                setResponseText((prev) => [...prev, { sender: 'claude', text: '' }]);
          
                while (true) {
                  const { value, done } = await reader.read();
                
                  if (done) {
                    console.log('A Claude befejezte a választ.');
                    break;
                  }
              
                  const chunk = decoder.decode(value, { stream: true });
              
                  setResponseText((prev) => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;

                    if (lastIndex >= 0) {
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        text: updated[lastIndex].text + chunk,
                      };
                    }

                    return updated;
                  });
                }
            
      
                setIsLoading(false)
            
                queryClient.invalidateQueries({ queryKey: ['sessions'] });
                queryClient.invalidateQueries({ queryKey: ['subData'] });

                limit.current = limit.current + 1
          
            }catch(err){

                console.log(err)
                setIsLoading(false)

            }
            finally{

                setIsLoading(false)
            
                queryClient.invalidateQueries({ queryKey: ['sessions'] });

            }

        }
    };

    const stopGenerating = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort(); 
        }
    };    

    const setInstruction = async (instruction) =>{
  
        const token = localStorage.getItem('token')

        const response = await api.post('/setInstruction', {
            instruction: instruction
        });

    }

    const getInstruction = async () =>{

        const response = await api.get('/getInstruction');

        const data = response.data

        setComment(data.instruction)
    }

    return(

        <div className='containerask'>
            <div className='ask'>
                <div 
                  className={`cask ${isDragging ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                > 
                    <div className='plus-dv'>

                        <img src={plus} onClick={() => {setIsOpenPlus(!isOpenPlus); getInstruction()}} className = 'plus' alt='plus'/>

                        {isOpenPlus && (
                            <div className='options-tab' ref={plusIconRer}>
                                <div className='attach-boxes'>
                                    <label htmlFor="file-upload" className="attach-btn" >
                                        📎
                                    </label>
                                    <p className='texts'>Add files or photos</p>
                                </div>
                                <div className='attach-boxes list'>
                                    <p className='texts'>Effort</p>
                                    <div>
                                        <select 
                                          value={selectedEffort} 
                                          onChange={(e) => setSelectedEffort(e.target.value)}
                                          className="model-selector"
                                        >
                                            <option value="Sonnet" className="models">Low</option>
                                            <option value="Opus" className="models">Medium</option>
                                            <option value="Haiku" className="models">Hight</option>
                                            <option value="Haiku" className="models">Extra</option>
                                        </select>
                                    </div>
                                </div>
                                <div className='attach-boxes list'>
                                    <p className='texts'>Model</p>
                                    <div>
                                        <select 
                                          value={selectedModel} 
                                          onChange={(e) => setSelectedModel(e.target.value)}
                                          className="model-selector"
                                        >   
                                            <option value="Haiku" className="models">Haiku 4.5</option>
                                            <option value="Sonnet" className="models">Sonnet 5</option>
                                            <option value="Opus" className="models">Opus 5</option>
                                        </select>
                                  </div>
                                </div>
                                <div className='textera'>
                                        <label htmlFor="user-comment" className='texts'>Instructions: </label>
                                        <textarea
                                        className='textbox'
                                        id="user-comment"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={4}
                                        cols={40}
                                        placeholder="Write your instructions here..."
                                    />
                                </div>
                                <div className='apply-div'>
                                    <button className='apply' onClick={() => setInstruction(comment)}>Apply</button>
                                </div>
                                
                            </div>
                        )}
                    </div>
                              
                    <input 
                        type="file" 
                        id="file-upload" 
                        multiple={true}
                        style={{ display: 'none' }} 
                        onChange={handleFileChange} 
                    />
                              
                    <div //NOSONAR
                        ref={textareaRef}
                        className="gemini-textarea"
                        
                        contentEditable={(sub.status !== null && sub.messages !== '0') ? true : false} //NOSONAR (sub.messages && sub.messages !== '0')
                        onClick={(sub.messages === '0' || sub.status === null) ? () =>{navigate('/'); setDashboard(false); setTimeout(() => {
                                    const element = document.getElementById('subscriptions');
                                    if (element) {

                                        const elementPosition = element.getBoundingClientRect().top;
                                        const scrollContainer = document.getElementById('mainPage');
                                        
                                        const offsetPosition = elementPosition + window.scrollY - 80;

                                        scrollContainer.scrollTo({
                                            top: offsetPosition,
                                            behavior: 'smooth'
                                        });
                                    }
                                }, 100);} : null }
                        suppressContentEditableWarning={true}
                        tabIndex={0}
                        onInput={(e) => {handleChange(e)}}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        data-placeholder="Ask Claude something..."
                        role="textbox"
                        aria-multiline="true"
                        onBlur={() => {
    // 1. Azonnali nullázás
    window.scrollTo(0, 0);

    // 2. Késleltetett nullázás, miután a billentyűzet animációja ténylegesen lefutott
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 150);
  }}
                    /> 
                    {files.length > 0 && (
                      <div className="file-preview-container">
                        {files.map((item) => (
                          <div key={item.id} className="preview-item-wrapper">
                            {item.previewUrl ? (
                              <div className="preview-item image-preview">
                                <img src={item.previewUrl} alt="Előnézet" />
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
                            <button type="button" className="remove-file-btn" onClick={() => removeFile(item.id)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isLoading && (

                        <div>  
                            <button 
                                type='button'
                                className={`send-button ${content !== '' ? 'active' : 'disabled'}`}
                                onClick={handleSend} 
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
                                    </svg>
                            </button>
                        </div>
                    ) }

                    {isLoading && (

                        <div>  
                            <button 
                                type='button'
                                className={`stop-sendbutton`}
                                onClick={stopGenerating} 
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor"/>
                                    </svg>
                            </button>
                        </div>
                    ) }


                </div>
            </div>
        </div>

    )

}