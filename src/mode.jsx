import React, { useState, useRef, useEffect } from 'react';
import './model.css';

export default function ModelDropdown( {selectedModel, setSelectedModel} ) {
  const [isOpen, setIsOpen] = useState(false);

  const [selectedEffort, setSelectedEffort] = useState('Low');
  
  const dropdownRef = useRef(null);

  // Kattintás kezelése a menün kívül (bezárja a dropdown-t)
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      {/* Legördülő panel */}
      {isOpen && (
        <div className="dropdown-menu">
          {/* Modell szekció */}
          <div 
            className={`dropdown-item ${selectedModel === 'Haiku' ? 'selected' : ''}`}
            onClick={() => { setSelectedModel('Haiku'); setIsOpen(false); }}
          >
            <span className="checkmark">{selectedModel === 'Haiku' && '✓'}</span>
            <div className="item-text">
              <div className="item-title">Haiku 4.5</div>
            </div>
          </div>

          <div 
            className={`dropdown-item ${selectedModel === 'Sonnet' ? 'selected' : ''}`}
            onClick={() => { setSelectedModel('Sonnet'); setIsOpen(false); }}
          >
            <span className="checkmark">{selectedModel === 'Sonnet' && '✓'}</span>
            <div className="item-text">
              <div className="item-title">Sonnet 5</div>
            </div>
          </div>

          <div 
            className={`dropdown-item ${selectedModel === 'Opus' ? 'selected' : ''}`}
            onClick={() => { setSelectedModel('Opus'); setIsOpen(false); }}
          >
            <span className="checkmark">{selectedModel === 'Opus' && '✓'}</span>
            <div className="item-text">
              <div className="item-title">Opus 5</div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          {/* Alszint / Szint szekció */}
          <div 
            className={`dropdown-item ${selectedEffort === 'Low' ? 'selected' : ''}`}
            onClick={() => { setSelectedEffort('Low'); setIsOpen(false); }}
          >
            <span className="checkmark">{selectedEffort === 'Low' && '✓'}</span>
            <div className="item-text">
              <div className="item-title">Low</div>
            </div>
          </div>

          <div 
            className={`dropdown-item ${selectedEffort === 'Medium' ? 'selected' : ''}`}
            onClick={() => { setSelectedEffort('Medium'); setIsOpen(false); }}
          >
            <span className="checkmark">{selectedEffort === 'Medium' && '✓'}</span>
            <div className="item-text">
              <div className="item-title">Medium</div>
            </div>
          </div>

          <div 
            className={`dropdown-item ${selectedEffort === 'High' ? 'selected' : ''}`}
            onClick={() => { setSelectedEffort('High'); setIsOpen(false); }}
          >
            <span className="checkmark">{selectedEffort === 'High' && '✓'}</span>
            <div className="item-text">
              <div className="item-title">High</div>
            </div>
          </div>
          <div 
            className={`dropdown-item ${selectedEffort === 'Max' ? 'selected' : ''}`}
            onClick={() => { setSelectedEffort('Max'); setIsOpen(false); }}
          >
            <span className="checkmark">{selectedEffort === 'Max' && '✓'}</span>
            <div className="item-text">
              <div className="item-title">Max</div>
            </div>
          </div>
        </div>
      )}

      {/* Trigger gomb */}
      <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
        {selectedModel}
      </button>
    </div>
  );
}

import plus from './assets/plus.svg'

export function PlusDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      {/* Legördülő panel */}
      {isOpen && (
        <div className="dropdown-menu">
            {/* Modell szekció */}
            <div className='dropdown-item '>
                <label htmlFor="file-upload" className="attach-btn" >
                  📎
                </label>
                <p className='texts'>Add files or photos</p>
            </div>

            <div className='dropdown-item'>
                <label htmlFor="user-comment" className='texts'>Instructions: </label>
            </div>
            <div className='dropdown-item'>
                <textarea
                    className='textbox'
                    id="user-comment"
                    value={'comment'}
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

    <img src={plus} onClick={() => {setIsOpen(!isOpen)}} className = 'plus' alt='plus'/>

    </div>
  );
}