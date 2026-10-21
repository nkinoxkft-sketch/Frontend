import {  useState } from 'react';
import {  useNavigate } from 'react-router-dom';


import 'react-phone-number-input/style.css';
import { useQueryClient } from '@tanstack/react-query';
import { useSub } from '../../useStates/useSub';
import { api } from '../interceptor';
import './subscription.css'
  

export const Sub = () =>{

    
    const { sub, error, isLoading, expiryDatestring, diffDays } = useSub();

    const navigate = useNavigate();

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const queryClient = useQueryClient();

    const [backendError, setBackendError] = useState(null);

    const cancel = async () =>{

        try {
                                
            await api.post('/paypal-cancel');

            await queryClient.invalidateQueries({ queryKey: ['subData'] });


        } catch (err) {

            console.error(err);

        }

    }

    const [polling, setPolling] = useState(false)
    
    const startPolling = () => {

        setPolling(true)
        let attempts = 0;
        const maxAttempts = 60;

        const interval = setInterval(async () => {
            attempts++;
            try {
                // Rákérdezünk a backendnél a státuszra
                const response = await api.get('/polling');

                console.log(response)
    
                if (response.data.message === false) {
                    clearInterval(interval);
                    setPolling(false)
                    alert("Sikeres fizetés! A fiókod aktiválva lett.");
                    navigate('/')
                }

            } catch (error) {
                console.error("Hiba a státusz lekérdezésekor", error);
                setPolling(false)
            }

            // Ha 30 másodperc után sincs válasz (pl. késik a PayPal szervere)
            if (attempts >= maxAttempts) {
                clearInterval(interval);
                setPolling(false)
                alert("A fizetés feldolgozása a vártnál tovább tart. Kérlek, frissíts rá az oldalra pár perc múlva!");
            }
        }, 1000); // 1000 ms = 1 másodperc
    };

    return(

        <div className="csub-wrapper">
    
            {/* Töltőképernyő (Overlay) */}
            {polling && (
                <div className="csub-loading-overlay">
                    <div className="csub-spinner"></div>
                    <h2 className="csub-loading-title">Finalizing Payment...</h2>
                    <p className="csub-loading-subtitle">Please do not close this page!</p>
                </div>
            )}

            {/* Fejléc */}
            <div className="csub-header">
                <h2 className="csub-title">Subscription</h2>
                <p className="csub-desc">Manage your current plan and billing.</p>
            </div>

            {/* Aktív előfizetés státusza */}
            <div className="csub-status-section">
                <p className="csub-label">Active subscription:</p>
                <div>
                    {sub.status !== 'inactive' ? (
                        <span className="csub-status-badge">
                            <span className="csub-dot"></span> 
                            <span className="csub-status-text">{sub.status}</span> 
                        </span>
                    ) : (
                        <span className="csub-status-badge csub-status-inactive">
                            <span className="csub-dot csub-dot-inactive"></span> 
                            <span className="csub-status-text">inactive</span> 
                        </span>
                    )}
                </div>
            </div>

            {/* Részletek (Lejárat, következő terv) */}
            {sub.expiry !== null && (
                <div className="csub-details-card">
                    <div className="csub-detail-row">
                        <p className="csub-detail-label">Remaining time:</p>
                        <p className="csub-detail-value">{diffDays} days</p>
                    </div>
                    
                    <hr className="csub-divider" />
                    
                    <div className="csub-detail-row">
                        {sub.nextPlan === null ? (
                            <p className="csub-detail-label csub-text-danger">No upcoming plan!</p>
                        ) : (
                            <>
                                <p className="csub-detail-label">Upcoming Plan:</p>
                                <p className="csub-detail-value">{sub.nextPlan}</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Akció gombok */}
            <div className="csub-actions">
                <a 
                    href="#subscriptions" 
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/');
                        setTimeout(() => {
                            const element = document.getElementById('subscriptions');
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                            }
                        }, 100);
                    }} 
                    className="csub-primary-btn csub-link-btn"
                >
                    Change subscription
                </a>

                <div className="csub-secondary-actions">
                    {sub.status !== 'inactive' && sub.expiry !== null && sub.renew !== 0 && ( 
                        <button type="button" onClick={() => setIsConfirmOpen(true)} className="csub-danger-btn">
                            Cancel subscription
                        </button> 
                    )}
                    
                    {sub.renew === 0 && ( 
                        <button type="button" onClick={() => navigate('/payment')} className="csub-primary-btn">
                            Turn on auto-renew
                        </button> 
                    )}

                    {backendError && <span className="csub-error-text">{backendError}</span>}
                </div>
            </div>

            {/* Megerősítő Modális Ablak (Cancel Modal) */}
            {isConfirmOpen && (
                <div className="csub-modal-overlay">
                    <div className="csub-modal-card">
                        <h3 className="csub-modal-title">Are you sure?</h3>
                        <p className="csub-modal-desc">This action will cancel your current subscription.</p>
                        
                        <div className="csub-modal-actions">
                            <button 
                                type="button"
                                onClick={() => setIsConfirmOpen(false)}
                                className="csub-secondary-btn"
                            >
                                Cancel
                            </button>
                            
                            <button 
                                type="button"
                                onClick={() => { setIsConfirmOpen(false); cancel(); startPolling(); }}
                                className="csub-danger-btn csub-modal-confirm"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        
    )


}