import { React, useState } from 'react';

import { useLocation } from 'react-router-dom';
import 'react-phone-number-input/style.css';
import './payment.css';
import axios from 'axios';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from './interceptor';
import { useNavigate } from 'react-router-dom';
import { resfreshStates } from '../useStates/refreshStates';
const subscriptionSchema = z.object({
  isCompany: z.boolean().optional(),
  cname: z.string().optional(),
  tax: z.string().optional(),
}).refine((data) => {

  if (!data.isCompany) return true;

  const isCnameValid = data.cname && data.cname.trim().length >= 2;

  const isTaxValid = data.tax && /^[A-Z0-9\s\-]{4,20}$/.test(data.tax.trim());

  return isCnameValid && isTaxValid;
}, {
  message: "Please fill out valid company details.",
  path: ["tax"],
});

export const Payment = () => {

    const queryClient = useQueryClient();
    const [paypall, setPaypall] = useState(true);

    const location = useLocation();
    const { plan, price } = location.state || {};

    const initialOptions = {
        "client-id": "AZP5Ri9qYNULiTcJNi8Y-qELLFD0n0pZiuzKhUMo2m_LRl_rbqAsHYYGpEajKsBOClzF9XuwGZMHvS4h",
        vault: true,
        intent: "subscription",
        currency: "USD" 
    };

    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const { register,
            watch,
            getValues,
            setError,
            formState: { errors, isValid } } = useForm({
                resolver: zodResolver(subscriptionSchema),
                mode: "onChange",
                defaultValues: { 
                    cname: "",
                    tax: ""
                }
            });
    
    const isCompany = watch('isCompany'); 
    const isFormValid = acceptedTerms && isValid;
    const nav = useNavigate();

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
                    nav('/')
                    resfreshStates(queryClient)
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


    return (

        <div className="cpay-page-container">

            {/* Töltőképernyő (Overlay) */}
            {polling && (
                <div className="cpay-loading-overlay">
                    <div className="cpay-spinner"></div>
                    <h2 className="cpay-loading-title">Finalizing Payment...</h2>
                    <p className="cpay-loading-subtitle">Please do not close this page!</p>
                </div>
            )}

            <div className="cpay-card">
                
                {/* Ár és Csomag Szekció */}
                <div className="cpay-section">
                    <div className="cpay-cost-row">
                        <p className="cpay-title">Cost:</p>
                        <p className="cpay-price-tag">{price} USD</p>
                    </div>                                
                    <p className="cpay-desc"><strong>Plan:</strong> {plan}</p>
                </div> 

                {/* Vásárlási Információk Szekció */}
                <div className="cpay-section">
                    <h3 className="cpay-section-title">Purchase Information</h3>                               
                    <ul className="cpay-info-list">
                        <li className="cpay-desc"><strong>Immediate Activation:</strong> Your new plan will start immediately after a successful payment, giving you instant access to all upgraded features.</li>
                        <li className="cpay-desc"><strong>Full Price Charged:</strong> The system will charge the full price of the higher-tier package right away (not just the price difference between the two plans).</li>
                        <li className="cpay-desc"><strong>New Billing Cycle:</strong> The day you upgrade will become your new billing date. Future subscription renewals will be automatically charged based on this new date.</li>
                    </ul>
                </div>  

                {/* Céges adatok Szekció */}
                <div className="cpay-section">
                    <form className="cpay-form">
                        <div className="cpay-checkbox-group">
                            <input
                                id="comp"
                                type="checkbox"
                                className="cpay-checkbox"
                                {...register('isCompany')}
                            />
                            <label htmlFor="comp" className="cpay-checkbox-label">Purchasing as a Company?</label>
                        </div>
                    </form> 
                    
                    {isCompany && (
                        <div className="cpay-company-fields">
                            <div className="cpay-field-group">
                                <label htmlFor="cname" className="cpay-label">Company name</label>
                                <input
                                    className="cpay-input"
                                    id="cname"
                                    type="text"
                                    placeholder="e.g. Claudify Inc."
                                    {...register('cname')}
                                />
                                {errors.cname && <span className="cpay-error-text">{errors.cname.message}</span>}
                            </div>

                            <div className="cpay-field-group">
                                <label htmlFor="tax" className="cpay-label">VAT Number</label>
                                <input
                                    className="cpay-input"
                                    id="tax"
                                    type="text"
                                    placeholder="US12345678"
                                    {...register('tax')}
                                />
                                {errors.tax && <span className="cpay-error-text">{errors.tax.message}</span>}
                            </div>
                        </div> 
                    )}
                </div>

                {/* Adatvédelmi nyilatkozat és Fizetés Szekció */}
                <div className="cpay-section cpay-no-border">
                    <div className="cpay-checkbox-group cpay-privacy-group">
                        <input
                            type="checkbox"
                            id="privacy-terms"
                            className="cpay-checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            required
                        />
                        <label htmlFor="privacy-terms" className="cpay-checkbox-label">
                            I accept the <a href="/privacy" target="_blank" rel="noreferrer" className="cpay-link">Privacy Policy</a>.
                        </label>
                    </div> 

                    {paypall && (
                        <PayPalScriptProvider options={initialOptions}>
                            <div 
                                className="cpay-paypal-wrapper"
                                style={{ 
                                    pointerEvents: isFormValid ? 'auto' : 'none', 
                                    opacity: isFormValid ? 1 : 0.5,
                                }}
                            >
                                <PayPalButtons 
                                    style={{ layout: "vertical" }}
                                    createSubscription={async (data, actions) => {
                                        try {
                                            const response = await api.post('/create-subscription', {
                                                plan: plan,
                                                name: getValues('cname'),
                                                vat: getValues('tax')
                                            });
                                            return response.data.subscriptionID;
                                        } catch (err) {
                                            const serverError = err.response?.data?.error || "Error occurred";
                                            setError("tax", {
                                                type: "server",
                                                message: serverError
                                            });
                                        }
                                    }}
                                    onApprove={async (data, actions) => {
                                        startPolling();
                                    }}
                                    onError={(err) => {
                                        console.error("PayPal error:", err);
                                    }}
                                    onCancel={async (data) => {
                                        try {
                                            await api.post('/paypal-cancel-purchase');
                                            console.log("A vásárlást megszakították.");
                                        } catch (err) {
                                            console.error("Hiba a megszakítás feldolgozásakor:", err);
                                        }
                                    }}
                                />
                            </div>
                        </PayPalScriptProvider>
                    )}
                </div>
            </div>
        </div>


    );

}

export const Change = () => {

    return (<div></div>);

}