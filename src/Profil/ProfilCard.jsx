import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from "../main";
import { resfreshStates } from '../../useStates/refreshStates';
import { useUser } from '../../useStates/useUser';
import { useSub } from '../../useStates/useSub';
import { api } from '../interceptor';
import { forwardRef } from 'react';
import { useNavigate } from "react-router-dom";
import './profil.css';
const logOut = async (setIsLogedIn, queryClient, setCardVisibility) => {
    try {
        await api.post('/auth/logout');
        
        resfreshStates(queryClient); 

        setIsLogedIn(false);

        setCardVisibility(false);

    } catch (err) {
        console.log(err);
    }
};

export const ProfilCard = forwardRef(({ setCardVisibility }, ref) => {
    
    const nav = useNavigate();
    
    const { setIsLogedIn } = useAuth();
    const queryClient = useQueryClient();

    const { user, error, isLoading } = useUser();
    const { sub, expiryDatestring, diffDays } = useSub();

    return (
       <div ref={ref} className="cp-card-popup">
    {error ? (
        <div className="cp-error-header">
            <h1 className="cp-error-title">Unexpected error</h1>
        </div>
    ) : (
        !isLoading && (
            <div className="cp-inner-container">
                <div className="cp-content-top">
                    
                    {/* Profil adatok */}
                    <div className="cp-user-profile">
                        <div className="cp-avatar">{user.username[0]}</div>
                        <div className="cp-user-info">
                            <p className="cp-username">{user.username}</p>
                            <p className="cp-email">{user.email}</p>
                        </div>
                    </div>

                    {/* Előfizetés státusz */}
                    <div className="cp-status-container">
                        {!sub.status ? (
                            <span className="cp-status-badge cp-status-error">
                                <span className="cp-dot cp-dot-error"></span>
                                <p className="cp-status-text">There is no subscription</p>
                            </span>
                        ) : (
                            <span className="cp-status-badge">
                                <span className="cp-dot"></span>
                                <p className="cp-status-text">{sub.status}</p>
                            </span>
                        )}
                    </div>

                    {/* Részletek (csak ha van lejárati idő) */}
                    {sub.expiry !== null && (
                        <div className="cp-details-card">
                            <div className="cp-detail-row">
                                <p className="cp-detail-label">Remaining time:</p>
                                <p className="cp-detail-value">{diffDays} days</p>
                            </div>

                            <div className="cp-divider-row">
                                <div className="cp-detail-row">
                                    {sub.nextPlan === null ? (
                                        <p className="cp-detail-label cp-text-danger">No upcoming plan!</p>
                                    ) : (
                                        <>
                                            <p className="cp-detail-label">Upcoming Plan:</p>
                                            <p className="cp-detail-value">{sub.nextPlan}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="cp-detail-row">
                                <p className="cp-detail-label">Remaining messages:</p>
                                <p className="cp-detail-value">{sub.messages}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Gombok */}
                <div className="cp-actions">
                    <button
                        className="cp-btn-secondary"
                        onClick={() => {
                            setCardVisibility(false);
                            nav('/profedit');
                        }}
                    >
                        Edit profile
                    </button>
                    <button
                        type="button"
                        className="cp-btn-danger"
                        onClick={() => {
                            logOut(setIsLogedIn, queryClient, setCardVisibility);
                            nav('/');
                        }}
                    >
                        Log out
                    </button>
                </div>
            </div>
        )
    )}
</div>)
});