import { useEffect } from 'react';
import './textarea.css';
import { useRef, useState } from 'react';
import plus from '../assets/plus.svg'
import { useSub } from '../../useStates/useSub.jsx';
import { useUser } from '../../useStates/useUser.jsx';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, setAccessToken, getAccessToken} from '../interceptor.jsx';
import axios from 'axios';
import ModelDropdown from '../mode.jsx';


const uploadToR2 = async (file, file_data) =>{  

    //console.log(file, file_data)

    const res = await fetch(file_data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.file.type },
        body: file.file 
    })

    return file_data.uniqueFileKey


}
export const Textarea = ( { new_tab, isChangedTab, isLoading, setIsLoading, current_session_id_ref, setResponseText, number_of_messages_loaded, sent_message}) =>{

    const { user } = useUser();
    const { sub } = useSub();

    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const [files, setFiles] = useState([]);
    const [selectedModel, setSelectedModel] = useState('Sonnet');
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

        e.preventDefault();

        // Kinyerjük a sima, formázatlan szöveget a vágólapról
        const text = e.clipboardData.getData('text/plain');

        // Beszúrjuk a kurzor aktuális pozíciójára sima szövegként
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        selection.deleteFromDocument();
        selection.getRangeAt(0).insertNode(document.createTextNode(text));

        // A kurzort áttesszük a beillesztett szöveg végére
        selection.collapseToEnd();

        // Kiváltjuk a handleChange-et, hogy a state és az automatikus méretezés frissüljön
        if (textareaRef.current) {
            textareaRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        }

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

        //console.log(new_tab.current)
        

        if(isLoading){

            return

        }

        setIsLoading(true)

        isChangedTab.current = false

        abortControllerRef.current = new AbortController();

        const messageText = textareaRef.current.textContent.trim();
      
        if (messageText.trim() || files.length !== 0) {

            try{
            
                    const fileStats = []

                    for(const iter of files){
                        console.log(iter.file)
                        fileStats.push({ fileName: iter.file.name, fileType: iter.file.type, fileSize: iter.file.size })
                    }

                    let urls;

                    if(fileStats.length !== 0){

                        urls = await api.post('/getUploadUrl', {
                            files: fileStats
                        });

                    }



                    let promises = []

                    for(const [index, file] of files.entries()){


                        promises.push(uploadToR2(file, urls.data[index]));

                    }

                    const keys = await Promise.all(promises);

                    const data = {

                        prompt: messageText,
                        sessionId: current_session_id_ref.current,
                        isNewTab: new_tab.current,
                        instruct: comment,
                        email: user.email,
                        model: selectedModel,
                        keys: keys,
                    }

                
                if(new_tab.current){

                    new_tab.current = false;

                }    

                let attemps = 0;

                let response;

                while(attemps < 2){
                    console.log(data)

                    response = await fetch('/api/ask', {
                        method: 'POST',
                        signal: abortControllerRef.current.signal,
                        headers: {
                            'Authorization': `Bearer ${getAccessToken()}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data) 
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

                setResponseText((prev) => [...prev, { sender: 'user', text: messageText, isComplete: false  }]);
                if(files.length > 0){
                    setResponseText((prev) => [...prev, { sender: 'user', file: files, isComplete: false  }]);
                }
                sent_message.current = true;

                if (textareaRef.current) {

                    const textarea = textareaRef.current;

                    textareaRef.current.innerHTML = "";

                    textarea.style.height = 'auto';

                    textarea.style.height = `${textarea.scrollHeight}px`;

                    setFiles([])

                }

                const sessionId = response.headers.get('X-Session-ID');
                //setSessionName(sessionId);
                current_session_id_ref.current = sessionId
          
                const reader = response.body.getReader();
const decoder = new TextDecoder('utf-8');
setResponseText((prev) => [...prev, { sender: 'claude', text: '', isComplete: false }]);

let accumulatedText = '';
let lastUpdateTime = performance.now();
const UPDATE_INTERVAL = 50; // Milliszekundum - ennyi időnkét frissítjük a UI-t

while (true) {
    const { value, done } = await reader.read();

    if (done) {
        console.log('A Claude befejezte a választ.');
        break;
    }

    const chunk = decoder.decode(value, { stream: true });
    accumulatedText += chunk;
    const now = performance.now();

    // Csak akkor frissítjük a state-et, ha letelt az időintervallum
    if (now - lastUpdateTime >= UPDATE_INTERVAL) {
        const textToAdd = accumulatedText;
        accumulatedText = ''; // Puffer kiürítése
        lastUpdateTime = now;

        setResponseText((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;

            if (lastIndex >= 0) {
                updated[lastIndex] = {
                    ...updated[lastIndex],
                    text: updated[lastIndex].text + textToAdd,
                    isComplete: false 
                };
            }
            return updated;
        });
    }
}

// Ciklus végén beírjuk a maradék pufferelt szöveget is, ha maradt
if (accumulatedText.length > 0) {
    const finalAdd = accumulatedText;
    setResponseText((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
            updated[lastIndex] = {
                ...updated[lastIndex],
                text: updated[lastIndex].text + finalAdd,
                isComplete: false 
            };
        }
        return updated;
    });
}
                
            
                queryClient.invalidateQueries({ queryKey: ['sessions'] });
                queryClient.invalidateQueries({ queryKey: ['subData'] });

                number_of_messages_loaded.current = number_of_messages_loaded.current + 1
          
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
            setIsLoading(false)
        }
    };    

    const setInstruction = async (instruction) =>{
  
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
                    <div className='chat-options-container'>

                        <img src={plus} onClick={() => {setIsOpenPlus(!isOpenPlus); getInstruction()}} className='trigger-icon' alt='plus'/>

                        {isOpenPlus && (
                            <div className='options-popup' ref={plusIconRer}>
                                <div className='file-upload-row'>
                                    <label htmlFor="file-upload" className="file-upload-label" >
                                        📎
                                    </label>
                                    <p className='option-label-text'>Add files or photos</p>
                                </div>
                            
                                <div className='textarea-wrapper'>
                                    <label htmlFor="user-comment" className='option-label-text'>Instructions: </label>
                                    <textarea
                                        className='custom-textarea'
                                        id="user-comment"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={4}
                                        cols={40}
                                        placeholder="Write your instructions here..."
                                    />
                                </div>
                                
                                <div className='action-footer'>
                                    <button className='apply-btn' onClick={() => setInstruction(comment)}>Apply</button>
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
                        
                        contentEditable={(sub.status !== null && Number(sub.messages) > 0) ? true : false} //NOSONAR (sub.messages && sub.messages !== '0')
                        onClick={(sub.messages === '0' || sub.status === null) ? () => {
                            void navigate('/', { state: { scrollToSubscriptions: true } })
                            
                      
                        } : null}
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
                    <ModelDropdown setSelectedModel={setSelectedModel} selectedModel={selectedModel}/>
                    {!isLoading && (

                        <div className='midbutton'>  
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

                        <div className='midbutton'>  
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