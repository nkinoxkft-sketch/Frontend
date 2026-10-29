import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { nord, dracula, nightOwl, kimbieDark,  } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './codeb.css';
export function CodeBlock({language, code, isLoading,  ...props  }) {

  
  

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2 mp múlva visszaáll
    } catch (err) {
      console.error('Nem sikerült a vágólapra másolni:', err);
    }
  };

  return (
  <div className="ccode-wrapper">
  <div className="ccode-header">
    <span className="ccode-lang">
      {language}
    </span>
    
    <button
      onClick={handleCopy}
      type="button"
      className="ccode-copy-btn"
    >
      {copied ? (
        <>
          <svg className="ccode-icon ccode-icon-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="ccode-text-success">Copied!</span>
        </>
      ) : (
        <>
          <svg className="ccode-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  </div>

  <SyntaxHighlighter
    {...props}
    /* CSERÉLD LE az okaidia-t egy világos témára, pl. prism-re! */
    style={okaidia} 
    language={language}
    PreTag="div"
    customStyle={{
      margin: 0,
      padding: '16px',
      fontSize: '14px',
      backgroundColor: '#2D2D2D', /* Hófehér háttér */
      overflowY: 'hidden',
      overflowX: isLoading ? 'hidden' : 'auto',
    }}
  >
    
    {code}
  </SyntaxHighlighter>
</div>
  );
}