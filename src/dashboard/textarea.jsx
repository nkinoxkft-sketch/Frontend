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
import { BackendError } from '../errors.jsx';
import { useInstruct } from '../../useStates/useInstruct.jsx';

const ALLOWED_TYPES = [
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/heic', // iPhone képformátum
    'image/heif', // iPhone képformátum
    'application/pdf', 
    'text/plain'  // .txt fájlok
];

const uploadToR2 = async (file, file_data) =>{  

    //console.log(file, file_data)

    await fetch(file_data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.file.type },
        body: file.file 
    })

    return file_data.uniqueFileKey


}
export const Textarea = ( {  isLoadingResponseText, setIsLoadingResponseText, onSelectSessionId, setResponseText, offset, setOnSelectSessionId, setBackendError }) =>{

    const { user } = useUser();


    const queryClient = useQueryClient();

    const [files, setFiles] = useState([]);
    const [selectedModel, setSelectedModel] = useState('Sonnet');
    const [isDragging, setIsDragging] = useState(false);
    const [comment, setComment] = useState('');

    const [content, setContent] = useState('')

    const textareaRef = useRef(null);


    const MAX_FILE_SIZE = 10 * 1024 * 1024;    

   const handleFilesSelected = async (newFilesList) => {
        const fileArray = Array.from(newFilesList);
        const validFiles = [];

        for (const rawFile of fileArray) {
            // 1. Típusellenőrzés
            if (!ALLOWED_TYPES.includes(rawFile.type)) {
                alert(`A(z) "${rawFile.name}" not supported file type!`);
                continue;
            }

            // 2. Kép tömörítése (ha kép, átméretezi, ha PDF vagy TXT, változatlanul hagyja)
            const file = await compressImage(rawFile);

            // 3. Méretellenőrzés (már a tömörített méretet vizsgáljuk)
            if (file.size > MAX_FILE_SIZE) {
                alert(`The file "${file.name}" is still too large after compression! The maximum allowed size is 5 MB.`);
                continue;
            }

            // 4. Hozzáadás az érvényes fájlokhoz
            validFiles.push({
                file,
                id: Math.random().toString(36).substring(2, 9),
                previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
            });
        }

        if (validFiles.length > 0) {
            setFiles((prev) => [...prev, ...validFiles]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(e.target.files);
            e.target.value = null; // Fontos: töröljük, hogy ugyanazt a fájl újra ki lehessen választani
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



    useEffect(() =>{

        const textarea = textareaRef.current;

        if(textarea){

            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;

        }

    }, [files])


    const abortControllerRef = useRef(null);

    const handleSend = async () => {

        setBackendError('');

        if (isLoadingResponseText) return;

        if (content.length === 0 && files.length === 0) return;

        setIsLoadingResponseText(true);
        
        offset.current += 1;
        console.log(offset.current)
        abortControllerRef.current = new AbortController();
        console.log('sent')
        try {
            // 1. Fájlok statisztikájának kigyűjtése és feltöltése R2-be
            let keys = [];
            if (files.length > 0) {
                const fileStats = files.map(iter => ({
                    fileName: iter.file.name,
                    fileType: iter.file.type,
                    fileSize: iter.file.size
                }));

                const urlsRes = await api.post('/getUploadUrl', { files: fileStats }, { 
                    signal: abortControllerRef.current.signal 
                });

                keys = await Promise.all(
                    files.map((file, index) => uploadToR2(file, urlsRes.data[index], abortControllerRef.current.signal))
                );
            }

            // 2. UI Azonnali frissítése (Optimistic Update)
            setResponseText(prev => [
                ...prev,
                { sender: 'user', text: content, isComplete: false },
                ...(files.length > 0 ? [{ sender: 'user', file: files, isComplete: false }] : [])
            ]);


            if (textareaRef.current) {
                textareaRef.current.blur(); // Bezárja a billentyűzetet
                
                // Kis késleltetés után scroll
                setTimeout(() => {
                    window.scrollTo(0, 0);
                    setTimeout(() => {
                        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                        document.documentElement.scrollTop = 0;
                        document.body.scrollTop = 0;
                    }, 150);
                }, 100);
            }

            if (textareaRef.current) {
                const textToSend = textareaRef.current.value;
                console.log("Elküldve:", textToSend);

                // 2. TÖRLÉS: Üresre állítjuk az értékét
                textareaRef.current.value = "";

                // 3. Visszaállítjuk az alap magasságra (pl. 1 sorosra)
                textareaRef.current.style.height = "auto"; 
            }
            setContent('');
            setFiles([]);
     

            // 3. API Kérés előkészítése
            const data = {
                prompt: content,
                sessionId: onSelectSessionId,
                instruct: comment,
                email: user.email,
                model: selectedModel,
                keys: keys,
            };

   
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
            console.log('ask api')
            let response = await fetch('/api/ask', fetchConfig(getAccessToken()));

            // 5. Ha 403-as hiba van, token frissítés és újrapróbálkozás
            if (response.status === 403) {
                const axiosResponse = await axios.post('http://localhost:8080/api/auth/refresh', {}, { withCredentials: true });
                const newAccessToken = axiosResponse.data.accessToken;
                
                setAccessToken(newAccessToken);
                response = await fetch('/api/ask', fetchConfig(newAccessToken));
            }

            if(!response.ok){

                throw await response.json();

            }

            setOnSelectSessionId(response.headers.get('X-Session-ID'));

            // 6. Stream olvasása és a Claude válaszának felépítése
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            setResponseText(prev => [...prev, { sender: 'claude', text: '', isComplete: false }]);


            let accumulatedText = '';
            let buffer = ""; 
            let lastUpdateTime = performance.now();
            const UPDATE_INTERVAL = 50; 

            // Segédfüggvény a state frissítésre, hogy ne duplikáljuk a kódot
            const flushAccumulatedText = () => {
                if (accumulatedText.length === 0) return;
                const textToAdd = accumulatedText;
                accumulatedText = '';

                setResponseText(prev => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (lastIndex >= 0) {
                        updated[lastIndex] = { 
                            ...updated[lastIndex], 
                            text: updated[lastIndex].text + textToAdd 
                        };
                    }
                    return updated;
                });
            };

            while (true) {
                const { value, done } = await reader.read();

                if (done){
                    // ELŐSZÖR kiürítjük a maradékot, amíg még érdemes, AZUTÁN zárjuk le!
                    flushAccumulatedText();
                    setIsLoadingResponseText(false);
                    break;
                };

                buffer += decoder.decode(value, { stream: true });

                const parts = buffer.split('\n\n');
                buffer = parts.pop() || "";

                for (const part of parts) {
                    const trimmed = part.trim();
                    
                    if (trimmed.startsWith('data:')) {
                        const jsonString = trimmed.replace(/^data:\s*/, '');

                        if (jsonString === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(jsonString);
                            if (parsed.text) {
                                accumulatedText += parsed.text;
                            }
                        } catch (err) {
                            console.error('JSON parsolási hiba:', jsonString, err);
                        }
                    }
                }

                const now = performance.now();
                if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                    lastUpdateTime = now;
                    flushAccumulatedText(); 
                }
            }


        } catch (err) {


            if(!err?.response?.data){

                setBackendError(err.error);
           
            }
            else{

                setBackendError(err.response.data.error);

            }

            

      

        } finally {

            setIsLoadingResponseText(false);
            

            void queryClient.invalidateQueries({ queryKey: ['sessions'] });
            void queryClient.invalidateQueries({ queryKey: ['subData'] });
        }
    };



    const stopGenerating = () => {

        console.log('stop')
        if (abortControllerRef.current) {
             console.log('abort')
            abortControllerRef.current.abort(); 

   
        }
        
    };    

    // Kép tömörítő segédfüggvény (Client-side compression)
const compressImage = (file, maxWidth = 1600, quality = 0.8) => {
    return new Promise((resolve) => {
        // Ha nem kép (pl. PDF vagy TXT), ne csináljunk vele semmit
        if (!file.type.startsWith('image/')) {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Ha túl nagy a kép, arányosan csökkentjük a méretét
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Átalakítjuk JPEG formátumra, megadott minőséggel (pl. 0.8)
                canvas.toBlob(
                    (blob) => {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
        };
    });
};

    const handleDivClick = (e) => {
        // Megakadályozzuk, hogy ha esetleg a küldő gombra vagy más interaktív elemre kattintanak, az is aktiválja
        // (Ha a textarea-ra magára kattint, akkor is lefuthat, a .focus() ott sem árt)
        if (textareaRef.current) {
        textareaRef.current.focus();
        }
    };
    
    return(

        <div className='containerask'>
            <div className='ask'>

                <div 
                  className={`cask ${isDragging ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  
                > 
                    <TextInput content={content} setContent={setContent} textareaRef={textareaRef} handleFilesSelected={handleFilesSelected}
                     handleSend={handleSend} files={files} removeFile={removeFile}/>

                    <div className='settings'>


                        <PlusArea setComment={setComment} comment={comment} handleFileChange={handleFileChange}/>

                        <div 
                            className='text-file-wrapper'
                            onClick={handleDivClick}
                        >
                        
                        </div>     

                        <ModelDropdown setSelectedModel={setSelectedModel} selectedModel={selectedModel}/>

                        {!isLoadingResponseText && (
                            <div className='midbutton'>  
                                <button 
                                    type='button'
                                    className={`send-button ${content !== '' || files.length > 0 ? 'active-send' : 'disabled'}`}
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Megakadályozza a blur eseményt!
                                    }}
                                    onClick={handleSend} 
                                    disabled={content === '' && files.length === 0}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
                                    </svg>
                                </button>
                            </div>
                        )}

                        {isLoadingResponseText && (
                            <div className='midbutton'>  
                                <button 
                                    type='button'
                                    className={`stop-sendbutton`}
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Itt is!
                                    }}
                                    onClick={stopGenerating}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor"/>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>    
                    

                </div>
            </div>
        </div>

    )

}

const PlusArea = ({ comment, setComment, handleFileChange }) => {

    const plusIconRer = useRef(null);

    const [isOpenPlus, setIsOpenPlus] = useState(false);

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

    const setInstruction = async (instruction) =>{
        
        try{
            console.log(typeof instruction)
            await api.post('/setInstruction', {
                instruct: instruction
            });


        }catch(err){

            console.log(err);

        }


    }

    const { data: instruct } = useInstruct();
    
    useEffect(() =>{

        console.log(instruct)
        setComment(instruct);


    }, [instruct])

    return(
        <div className='chat-options-container'>
            <button className='trigger-icon' onClick={() => {setIsOpenPlus(!isOpenPlus)}}>
                <svg width="24px" height="24px" viewBox="0 0 32 32" id="i-plus" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentcolor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                    <path d="M16 2 L16 30 M2 16 L30 16" />
                </svg>
            </button>

            {isOpenPlus && (
                <div className='options-popup' ref={plusIconRer}>
                    <label htmlFor="file-upload" className="file-upload-row" >
                        📎Add files or photos
                    </label>

                    <div className='textarea-wrapper'>
                        <input 
                            type="file" 
                            id="file-upload" 
                            multiple={true}
                            style={{ display: 'none' }} 
                            onChange={(e) => {handleFileChange(e); setIsOpenPlus(false)}} 
                            accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
                        />
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
                        <button className='apply-btn' onClick={() => {void setInstruction(comment); setIsOpenPlus(false)}}>Apply</button>
                    </div>

                </div>
            )}
        </div>
    )

}

const TextInput = ( { textareaRef, content, setContent, handleFilesSelected, handleSend, files, removeFile} ) => {
    
    const { sub, isLoading: isLoadingSub } = useSub();
    const { isLoading } = useAuth()

    const navigate = useNavigate();

    const handleChange = (e) => {

        setContent(e.target.value)

        const textarea = textareaRef.current;

        if (textarea) {
            textarea.style.height = 'auto';
            const newHeight = textarea.scrollHeight;
            
            // Feltételezve, hogy a max-height 150px
            if (newHeight > 150) {
            textarea.style.height = '150px';
            textarea.style.overflowY = 'auto'; // Bekapcsolja a görgetést
            } else {
            textarea.style.height = `${newHeight}px`;
            textarea.style.overflowY = 'hidden'; // Nincs szükség görgetésre
            }
    }
    };

    const handleKeyDown = (e) => {

        if (e.key === 'Enter' && !e.shiftKey) {
        
            e.preventDefault(); 
            
            if(content !== '' || files.length > 0){

                void handleSend();

            }

        }

    };

    const handlePaste = (e) => {

        const clipboardFiles = e.clipboardData?.files;

        if (clipboardFiles && clipboardFiles.length > 0) {
            e.preventDefault(); 

            const fileArray = Array.from(clipboardFiles);
            const hasInvalidFile = fileArray.some(file => !ALLOWED_TYPES.includes(file.type));

            if (hasInvalidFile) {
                alert('Unsupported file type! Only images (JPEG, PNG, WEBP) or PDFs are allowed..');
                return;
            }

            console.log('asdasd')
            handleFilesSelected(clipboardFiles);

        }
    };
    return (
        <div className='file-text'>
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

            <textarea
                id='ai'
                className="gemini-textarea"
                ref={textareaRef}
                onClick={(sub.messages === '0' || sub.status === null) ? () => {
                    console.log(isLoading, sub, isLoadingSub)
                    if(!isLoading && !isLoadingSub){
                        void navigate('/', { state: { scrollToSubscriptions: true } })
                    }
                } : () => { console.log(sub, isLoading )}}
                onInput={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask something..."
                rows={1}
                onPaste={handlePaste}

            /> 
        </div>


    )
}