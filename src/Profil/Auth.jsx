
import { useEffect, useState } from 'react';

import {  useNavigate, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import 'react-phone-number-input/style.css';
import { api } from '../interceptor';
import './account.css'
import { z } from 'zod';
import { BackendError } from '../errors';
import { useQueryClient } from '@tanstack/react-query';
const authSchema = z.object({
  auth: z.string()
    .length(6, 'A 6-digit code is required!')
    .regex(/^[0-9]+$/, 'Only numbers are allowed!'), 
});


export const Auth = () =>{

    const queryClient = useQueryClient();

    const [backendError, setBackendError]= useState(null);

    const [secondsLeft, setSecondsLeft] = useState(0);
  const [isSending, setIsSending] = useState(false);

  // 1. Az oldal betöltésekor ellenőrizzük, van-e aktív tiltás
  useEffect(() => {
    const calculateRemaining = () => {
      const expiresAt = localStorage.getItem('resend_expires_at');
      if (expiresAt) {
        const remaining = Math.round((parseInt(expiresAt) - Date.now()) / 1000);
        if (remaining > 0) {
          setSecondsLeft(remaining);
        } else {
          localStorage.removeItem('resend_expires_at');
        }
      }
    };

    calculateRemaining();
  }, []);

  // 2. A visszaszámláló időzítő (csak akkor fut, ha van hátralévő idő)
  useEffect(() => {
    // Ha lejárt az idő, nincs dolgunk
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      const expiresAt = localStorage.getItem('resend_expires_at');
      if (expiresAt) {
        // Valós idő alapján számolunk, így a böngésző "altatása" sem rontja el
        const remaining = Math.round((parseInt(expiresAt) - Date.now()) / 1000);
        
        if (remaining <= 0) {
          setSecondsLeft(0);
          localStorage.removeItem('resend_expires_at');
        } else {
          setSecondsLeft(remaining);
        }
      } else {
        setSecondsLeft(0);
      }
    }, 1000);

    // Takarítás a háttérben
    return () => clearInterval(timer);
  }, [secondsLeft > 0]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        } = useForm({
          resolver: zodResolver(authSchema),
    });

    const [searchParams] = useSearchParams(); 

    const resend = async () =>{

        setBackendError(null)

        setIsSending(true);

        try {

            const action = searchParams.get('action'); 

            if(action === 'delete_account'){
                
                await api.put('/delete');

            }
            else{

                const email = searchParams.get('email');

                await api.put('/updateEmail',

                    { email: email },


                );

            }


            const expiresAt = Date.now() + 60000; // Jelenlegi idő + 60.000 ms (60 mp)
            localStorage.setItem('resend_expires_at', expiresAt);
            setSecondsLeft(60);

        } catch (err) {

            setBackendError(err.response.data.error)

            console.error(err.response.data.error);


        }finally{

            setIsSending(false);
        }

    }

    const navigate = useNavigate();

    const sendCode = async (data) =>{

        setBackendError(null)

        try {

            const action = searchParams.get('action'); 

            if(action === 'delete_account'){
                
                await api.delete('/deleteConfirm', { data: { code: data.auth } } ,);

            }
            else{

                const response = await api.put('/updateEmailConfirm',

                    { code: data.auth },

                );

                console.log(response.data.message)

            }

            queryClient.clear();
            navigate('/');

        } catch (err) {

            setBackendError(err.response.data.error)

            console.error(err.response.data.error);


        }

    }
   

    
    return(

    <div className="ca-page-container">
        <div className="ca-auth-card">
            <p className="ca-title">Check your email</p>
            <p className="ca-description">We've sent a verification code to your email address. Please enter it below.</p>
            <form onSubmit={handleSubmit((data) => {sendCode(data)})} className="ca-form">
                <input 
                    className="ca-input-code"
                    type="text"
                    maxLength={6}
                    inputMode="numeric" 
                    pattern="[0-9]*"
                    onKeyDown={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                            return;
                        }
                        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
                        if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
                            e.preventDefault(); 
                        }
                    }}
                    {...register('auth')} 
                />
                <button disabled={isSubmitting} type="submit" className="ca-btn-primary">
                    Verify and Continue    
                </button>
                {errors.auth && (
                    <span className="ca-text-danger">{errors.auth.message}</span>
                )}
                <BackendError error={backendError}/>
            </form>
            
            <div className="ca-resend-container">
                <p className="ca-subtitle">Didn't receive the code?</p>
                <button 
                    onClick={resend} 
                    disabled={isSending || secondsLeft > 0}
                    className="ca-btn-secondary"
                >
                    {isSending 
                        ? 'Sending...' 
                        : secondsLeft > 0 
                        ? `Resend in (${secondsLeft}s)` 
                        : 'Resend code'}
                </button>
            </div>
        </div>
    </div>
        
    )

}