import React from 'react';
import './Loading.css';


export function LoadingSpinner({ message = "Loading..." }) {
    return (
        <div className="loading-container">
            <div className="spinner-wrapper">
                <div className="spinner"></div>
            </div>
            {message && <p className="loading-text">{message}</p>}
        </div>
    );
}

export function LoadingBar() {
    return (
        <div className="loader-container">
            <div className="loader-bar"></div>
        </div>
    );
}