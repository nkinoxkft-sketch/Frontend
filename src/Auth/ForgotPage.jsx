
import { useState, useEffect, useRef } from 'react';
import './auth.css';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { api } from '../interceptor';
import { BackendError } from '../errors';
const emailSchema = z.object({

  email: z.email({ error: 'Invalid email address format!' }),
  cf: z.string({ error: 'Please complete the captcha' }).min(1, { error: 'Please complete the captcha' } ),

});

export const ForgotPage = () =>{

    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
      const calculateRemaining = () => {
        const expiresAt = localStorage.getItem('resend_expires_at_forgot');
        if (expiresAt) {
          const remaining = Math.round((parseInt(expiresAt) - Date.now()) / 1000);
          if (remaining > 0) {
            setSecondsLeft(remaining);
          } else {
            localStorage.removeItem('resend_expires_at_forgot');
          }
        }
      };
  
      calculateRemaining();
    }, []);
  

    useEffect(() => {
  
      if (secondsLeft <= 0) return;
  
      const timer = setInterval(() => {

        const expiresAt = localStorage.getItem('resend_expires_at_forgot');

        if (expiresAt) {

          const remaining = Math.round((parseInt(expiresAt) - Date.now()) / 1000);
          
          if (remaining <= 0) {
            setSecondsLeft(0);
            localStorage.removeItem('resend_expires_at_forgot');
          } else {
            setSecondsLeft(remaining);
          }
        } else {
          setSecondsLeft(0);
        }
      }, 1000);
  

      return () => clearInterval(timer);
    }, [secondsLeft > 0]);
  
    const [sent, setSent] = useState(false);

    const [backendError, setBackendError] = useState(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
        } = useForm({
            resolver: zodResolver(emailSchema),
            mode: 'onTouched',
    });

    const resetTurnstile = () => {
        if (window.turnstile && widgetId.current !== null) {
        window.turnstile.reset(widgetId.current);
        setValue('cf', '');
        }
    };

    const forgot = async (data) =>{
        
        resetTurnstile();

        try{

            await api.post('/forgot',

                { email: data.email, cloud: data['cf'] }

            );

            
            setSent(true);

        }catch(err){

            setBackendError(err.response.data.error)

        }

        const expiresAt = Date.now() + 60000; 
        localStorage.setItem('resend_expires_at_forgot', expiresAt);
        setSecondsLeft(60);

    
    }

    const turnstileRef = useRef(null);
    const widgetId = useRef(null);

    useEffect(() => {
        register('cf');
        if (window.turnstile && turnstileRef.current && !widgetId.current) {
        widgetId.current = window.turnstile.render(turnstileRef.current, {
            sitekey: '0x4AAAAAAFm1riUeYFvJMDTX',
            callback: (token) => {
            setValue('cf', token, { shouldValidate: true, shouldDirty: true });
            },
            'expired-callback': () => {
            setValue('cf', '');
            },
        });
        }


        return () => {
        if (widgetId.current && window.turnstile) {
            window.turnstile.remove(widgetId.current);
            widgetId.current = null;
        }
        };
    }, [setValue, register]);

    return (
        <div className="auth-page">
        <div className="auth-card">
            <div className="auth-header">
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">
                Enter your Claudify account email. We'll send you a code to copy from your inbox and enter here.
            </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit(forgot)} noValidate>
            
            <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input 
                id="email"
                className="form-input"
                type="email" 
                placeholder="name@example.com"
                autoComplete="email"
                {...register('email', {
                    onChange: () => setBackendError(null)
                })}
                />
                {errors.email && <span className="error-message">{errors.email.message}</span>}
                {errors.cf && <span className="error-message">{errors.cf.message}</span>}
                <BackendError error={backendError}/>
                
                {sent && backendError === null && (
                <div className="auth-success-box">
                    <p className="auth-success-text">Email sent successfully!</p>
                </div>
                )}
            </div>

            <button 
                type="submit"
                disabled={isSubmitting || secondsLeft > 0}
                className="auth-submit-btn"
            >
                {isSubmitting 
                ? 'Sending...' 
                : secondsLeft > 0 
                ? `Resend in (${secondsLeft}s)` 
                : 'Send reset code'}
            </button>

            <div className="cloudflare-container">
                <div ref={turnstileRef}></div>
            </div>
            </form>
        </div>
        </div>
    );

}



