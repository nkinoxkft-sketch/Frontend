<div className='ans-ask-pair'>
          
            <div className='talkingwrap'>
            <div className={`talkingspace`} ref={talkingSpaceRef} >
              <div className='answare ' >
                
                {responseText.map((msg, index) => (
                  <div key={index} className={`message-container ${msg.sender}`}>
                 
                    {(msg.sender === 'user' && ((msg.text && msg.text !== 'file processing') || (msg.file && msg.file.length > 0) || msg.backend_file)) && (
                      
                      <div className="user-message-bubble">
                        
                        {msg.text !== 'file processing' && (
                          
                          <GeminiPromptAccordion promptText={msg.text}/>
                          
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
                          <div className="claude-message-bubble prose text-lg prose-lg prose-invert max-w-none text-base leading-relaxed break-words block space-y-8 prose-p:my-5 prose-headings:my-6 prose-ul:my-5 prose-li:my-2">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ node, inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const codeString = String(children).replace(/\n$/, '');

                                  // Kódblokknak számít, ha van nyelve, NEM inline, VAGY sortörést tartalmaz
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

                                  // Sima sorközi inline kód (`const a = 1;` a mondat belsejében)
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
              <Textarea setIsLoading={setIsLoading} isLoading={isLoading}  newTab={newTab}
               sessionName={sessionName} setSessionName={setSessionName} setResponseText={setResponseText} responseText={responseText} limit={limit} setDashboard={setDashBoard}/>
          </div> 