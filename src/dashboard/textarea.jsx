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
import { useAuth } from '../main.jsx';


const uploadToR2 = async (file, file_data) =>{  

    //console.log(file, file_data)

    const res = await fetch(file_data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.file.type },
        body: file.file 
    })

    return file_data.uniqueFileKey


}
export const Textarea = ( {  isLoadingResponseText, setIsLoading, selected_session_id, setResponseText, limit, forceScrollRef }) =>{

    const { user } = useUser();
    const { sub } = useSub();
    const { isLoading } = useAuth()

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
            
            if(content !== '' || files.length > 0){

                void handleSend();

            }

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

        if (isLoadingResponseText) return;

        const messageText = textareaRef.current?.textContent?.trim() || "";

        if (!messageText && files.length === 0) return;

        setIsLoading(true);

        abortControllerRef.current = new AbortController();

        try {
            // 1. Fájlok statisztikájának kigyűjtése és feltöltése R2-be
            let keys = [];
            if (files.length > 0) {
                const fileStats = files.map(iter => ({
                    fileName: iter.file.name,
                    fileType: iter.file.type,
                    fileSize: iter.file.size
                }));

                const urlsRes = await api.post('/getUploadUrl', { files: fileStats });
                keys = await Promise.all(
                    files.map((file, index) => uploadToR2(file, urlsRes.data[index]))
                );
            }

            // 2. UI Azonnali frissítése (Optimistic Update)
            setResponseText(prev => [
                ...prev,
                { sender: 'user', text: messageText, isComplete: false },
                ...(files.length > 0 ? [{ sender: 'user', file: files, isComplete: false }] : [])
            ]);

            if (textareaRef.current) {
                textareaRef.current.innerHTML = "";
                textareaRef.current.style.height = 'auto';
                setFiles([]);
            }
            setContent('');
     

            // 3. API Kérés előkészítése
            const data = {
                prompt: messageText,
                sessionId: selected_session_id.current,
                instruct: comment,
                email: user.email,
                model: selectedModel,
                keys: keys,
            };

            forceScrollRef.current = true;

            // 4. Első próbálkozás a küldésre
            const fetchConfig = (token) => ({
                method: 'POST',
                signal: abortControllerRef.current.signal,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            let response = await fetch('/api/ask', fetchConfig(getAccessToken()));

            // 5. Ha 403-as hiba van, token frissítés és újrapróbálkozás
            if (response.status === 403) {
                const axiosResponse = await axios.post('http://localhost:8080/api/auth/refresh', {}, { withCredentials: true });
                const newAccessToken = axiosResponse.data.accessToken;
                
                setAccessToken(newAccessToken);
                response = await fetch('/api/ask', fetchConfig(newAccessToken));
            }

            selected_session_id.current = response.headers.get('X-Session-ID');

            // 6. Stream olvasása és a Claude válaszának felépítése
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            setResponseText(prev => [...prev, { sender: 'claude', text: '', isComplete: false }]);

            let accumulatedText = '';
            let lastUpdateTime = performance.now();
            const UPDATE_INTERVAL = 50; 

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                accumulatedText += decoder.decode(value, { stream: true });
                const now = performance.now();

                if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                    const textToAdd = accumulatedText;
                    accumulatedText = '';
                    lastUpdateTime = now;

                    setResponseText(prev => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        if (lastIndex >= 0) {
                            updated[lastIndex] = { ...updated[lastIndex], text: updated[lastIndex].text + textToAdd };
                        }
                        return updated;
                    });
                }
            }

            // Maradék streamelt szöveg hozzáadása
            if (accumulatedText.length > 0) {
                setResponseText(prev => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (lastIndex >= 0) {
                        updated[lastIndex] = { ...updated[lastIndex], text: updated[lastIndex].text + accumulatedText };
                    }
                    return updated;
                });
            }

            queryClient.invalidateQueries({ queryKey: ['subData'] });
            limit.current += 1;

        } catch (err) {
            console.error("Hiba az üzenet küldésekor: ", err);
        } finally {
            setIsLoading(false);
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
        
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
                                        value={comment ?? ""}
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
                    <div className='text-file-wrapper'>
                        <div //NOSONAR
                        ref={textareaRef}
                        className="gemini-textarea"
                        
                        contentEditable={(sub.status !== null && Number(sub.messages) > 0) ? true : false} //NOSONAR (sub.messages && sub.messages !== '0')
                        onClick={(sub.messages === '0' || sub.status === null) ? () => {
                            
                            console.log(isLoading, sub)
                            if(!isLoading){

                                void navigate('/', { state: { scrollToSubscriptions: true } })

                            }
                            
                      
                        } : null}
                        suppressContentEditableWarning={true}
                        tabIndex={0}
                        onInput={(e) => {handleChange(e)}}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        data-placeholder="Ask something..."
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
                    </div>     
                    
                    <ModelDropdown setSelectedModel={setSelectedModel} selectedModel={selectedModel}/>
                    {!isLoadingResponseText && (

                        <div className='midbutton'>  
                            <button 
                                type='button'
                                className={`send-button ${content !== '' || files.length > 0 ? 'active-send' : 'disabled'}`}
                                onClick={handleSend} 
                                disabled={content === '' && files.length === 0}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
                                    </svg>
                            </button>
                        </div>
                    ) }

                    {isLoadingResponseText && (

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