import { forwardRef, React, useEffect, useState } from 'react';
import './profil.css';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import 'react-phone-number-input/style.css';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useUser } from '../useStates/useUser';
import { useSub } from '../useStates/useSub';
import { Change } from './payment';
import { Shield } from './App';
import { api } from './interceptor';
import { resfreshStates } from '../useStates/refreshStates';

const logOut = async (qerry, setIsLogedIn, setCardVisibility) =>{

    localStorage.setItem('IsLogedin', 'false');
    
    await api.post('/auth/logout');

    resfreshStates(qerry)

    setIsLogedIn(false);
    
    setCardVisibility(false);

}


export const ProfilCard = forwardRef(({setCardVisibility, setIsLogedIn}, ref) =>{

    const nav = useNavigate();

    const queryClient = useQueryClient();

    const { user, error, isLoading } = useUser();

    const { sub, error1, isLoading1, expiryDatestring } = useSub();

    return (
        <div ref = {ref} className="prof-card">
            {error && (<p className='title'>Unexpected error</p>)}
            {!error && !isLoading && (
               <div>
                    <div className='top'>
                        <div className='profdata'>
                            <div className='profpic'>
                                {user.username[0]}
                            </div>
                            <div>
                                <p className='username'>{user.username}</p>
                                <p className='email'>{user.email}</p>
                            </div>
                        </div>
                        <div className='statdot'>
                            {!sub.status && (
                                <span className="substatus wrong">
                                    <span className='dot dotwrong'></span> <p className='text'>There is no subscription</p> 
                                </span>
                            )}
                            {sub.status && (
                                <span className="substatus">
                                    <span className='dot'></span> <p className='text'>{sub.status}</p> 
                                </span>
                            )}
                        </div>
                        {sub.expiry !== null && (
                            <div className='renewdiv'>
                                <div className='sub'>
                                    <p className='smini'>Remaining time:</p>
                                    <p className='descs'>{sub.expiry} days</p>
                                </div>
                                    {sub.nextPlan === null && (<div className='rtitle'>
                                        <div className='sub'>
                                            <  p className='smini wrong rr'>No upcoming plan!</p>
                                        </div>
                                    </div>)}
                                    {sub.nextPlan !== null && (<div className='rtitle'>
                                        <div className='sub'>
                                            <p className='smini rr'>Upcoming Plan:</p>
                                            <p className='descs'>{sub.nextPlan}</p>
                                        </div>
                                    </div>)}

                                <div className='sub'>
                                    <p className='smini'>Remaining messages:</p>
                                    <p className='descs'>{sub.messages}</p>
                                </div>
                            </div>
                        )}

                    </div>
                    <div className='bottom'>
                        <button className='edit' onClick={() => {setCardVisibility(false); nav('/profedit')}}>edit profil</button>
                        <button type="button" className='logout' onClick={() =>logOut(queryClient, setIsLogedIn, setCardVisibility, nav('/'))}>log out</button>
                    </div>
                </div>
            )}
        </div>
    );
  });

  

export const EditProfilePage = ({setIsLogedIn}) =>{

    const [state, setState] = useState('acc');


    return(
        <div className='page'>
            <div className='navbar'>
                <button type="button" className='navbutton' onClick={() => setState('acc')}>Account Settings</button>
                <button type="button" className='navbutton' onClick={() => setState('sub')}>Subscription</button>
            </div>
            {state === 'acc' && <Shield setIsLogedIn={setIsLogedIn}><AccountSettings/></Shield>}
            {state === 'sub' && <Shield setIsLogedIn={setIsLogedIn}><Sub/></Shield>}
      
        </div>
        

    )
}

const emailSchema = z.object({

  email: z.email({error: 'Invalid email address format!'}),

})

const usernameSchema = z.object({

  username: z.string().min(1, 'Username is required!'),

})


const AccountSettings = () => {

    const { user, error, isLoading } = useUser();

    const {
        register,
        handleSubmit,
        reset,
        formState: { isDirty: isDirtyEmail, errors, isSubmitting },
        } = useForm({
          resolver: zodResolver(emailSchema),
          defaultValues: { email: user.email || '' } ,
    });

    const {
        register: registerUsername,
        handleSubmit: handleSubmitUsername,
        reset: resetUsername,
        formState: { isDirty, errors: errorsUsername, isSubmitting: isSubmittingUsername },
        } = useForm({
          resolver: zodResolver(usernameSchema),
          defaultValues: { username: user.username || ''} ,
    });

    useEffect(() => {

        if (user) {
            reset({
                email: user.email,
            });
            resetUsername({
                username: user.username,
            })
        }

    }, [user?.email, user?.username]);

    const [ submitErrorUser, setSubmitErrorUser ] = useState(null);
    const [ success, setSuccess] = useState(null);

    const queryClient = useQueryClient();

    const onSubmitUser = async (data) => {

        if(!isDirty){

            return;

        }
        try {
            
            await api.put('/updateUsername',

                { username: data.username },

            );

            queryClient.invalidateQueries({ queryKey: ['userData'] });

            setSuccess(true);

        } catch (err) {

            console.error(err);

            if(err.status === 429){
                
                setSubmitErrorUser(err.response.data.error);

            }

        }

    }

    
    const [ submitErrorEmail, setSubmitErrorEmail ] = useState(null);

    const onSubmitEmail = async (data) => {

        if(!isDirtyEmail){

            return;

        }

        try {
            
            await api.put('/updateEmail',

                { email: data.email },


            );

            navigate(`/authpage?email=${data.email}`);


        } catch (err) {

            console.error(err);

            if(err.status === 429){
                
                setSubmitErrorEmail(err.response.data.error);

            }

        }

    }

    const navigate = useNavigate();

    return(
        <div>
            {error && (<p className='title'>Unexpected error</p>)}
            {!error && !isLoading && (
                <div className='settingCard'>
            <div className='title'>
                <p>Account Settings</p>
            </div>
            <div className='desc'>
                <p>Manage your personal information.</p>
            </div>
            <form onSubmit={handleSubmitUsername((data) => {onSubmitUser(data)})} noValidate>
                <div className='label'>
                    <label htmlFor='prof'>Username</label>
                    <input className='input'
                    id='prof'
                    type="text" 
                    {...registerUsername('username')}
                    >
                    </input>
                    {errorsUsername.username && <span className="errortext">{errorsUsername.username.message}</span>}
                    {submitErrorUser && <span className="errortext">{submitErrorUser}</span>}
                    {success && <span className="success">Saved</span>}
                    <button disabled={isSubmittingUsername} type='submit' className='button' >Change Username</button>
                </div>
            </form>
            <form onSubmit={handleSubmit((data) => {onSubmitEmail(data)})} noValidate>
                <div className='label last'>
                    <label htmlFor='email'>E-mail address</label>
                    <input className='input'
                    id='email'
                    type='email' 
                    placeholder="pelda@email.com"
                    autoComplete="email"
                    {...register('email')}>
                    </input>
                    {errors.email && <span className="errortext">{errors.email.message}</span>}
                    {submitErrorEmail && <span className="errortext">{submitErrorEmail}</span>}
                    <button type='submit' disabled={isSubmitting} className='button e' >Change E-mail</button>
                </div>
            </form>
            <button type='button' className='deleteB'>Delete Account</button>
        </div>
            )}
        </div>
        

    );

}



const Sub = () =>{

    
    const { sub, error, isLoading, expiryDatestring } = useSub();

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

        <div className='settingCard'>

            {polling && (

                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <h2 className="loading-title">Finalizing Payment...</h2>
                    <p className="loading-subtitle">Please do not close this page!</p>
                </div>

            )}

            <p className='stitle'>Subscription</p>
            <div className='sub'>
                <p className='title mini'>Active subscription:</p>
                <div className='canceldot'>
                    {sub.status !== 'inactive' && (
                        <span className="substatus">
                            <span className='dot'></span> <p className='text'>{sub.status}</p> 
                        </span>
                    )}
                    {sub.status === 'inactive' && (
                        <span className="substatus wrong">
                            <span className='dot dotwrong'></span> <p className='text'>inactive</p> 
                        </span>
                    )}
                </div>
            </div>
            {sub.expiry !== null && (
                <div className='renewdiv'>
                    <div className='sub'>
                        <p className='smini'>Remaining time:</p>
                        <p className='descs'>{sub.expiry} days</p>
                    </div>
                    {sub.nextPlan === null && (<div className='rtitle'>
                        <div className='sub'>
                            <  p className='smini wrong rr'>No upcoming plan!</p>
                        </div>
                    </div>)}
                    {sub.nextPlan !== null && (<div className='rtitle'>
                        <div className='sub'>
                            <p className='smini rr'>Upcoming Plan:</p>
                            <p className='descs'>{sub.nextPlan}</p>
                        </div>
                    </div>)}
                </div>
            )}
            <div className='sbutton'>
                <a 
                    href='#subscriptions' 
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
                    className='button href'
                >
                    Change subscription
                </a>
                <div className='cancelbotdiv'>
                {sub.expiry !== null && sub.renew !== 0 &&  ( <button type='button' onClick= {() => setIsConfirmOpen(true)} className='deleteB'>Cancel subscription</button> )}
                {sub.renew === 0 &&  ( <button type='button' onClick= {() => {navigate('/payment')}} className='button'>Turn on auto-renew</button> )}
                {isConfirmOpen && (
                    <div className="confcardpage">
                        <div className="confcard">
                            <p className="title">Are you sure?</p>
                            <div className="cardbuttonsdiv">
                                <button 
                                    type="button"
                                    onClick={() => setIsConfirmOpen(false)}
                                    className="button"
                                >
                                    Cancel
                                </button>
                                
                                <button 
                                    type="button"
                                    onClick={() => {setIsConfirmOpen(false); cancel(); startPolling()}}
                                    className="deleteB conf"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {backendError && <span className="errortext bottomcan">{backendError}</span>}
                </div> 
            </div>
        
        </div>
        
    )


}

const authSchema = z.object({
  auth: z.string()
    .length(6, 'A 6-digit code is required!')
    .regex(/^[0-9]+$/, 'Only numbers are allowed!'), 
});



export const Auth = () =>{

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

        setIsSending(true);

        try {

            const email = searchParams.get('email');
            
            await api.put('/updateEmail',

                { email: email },


            );

            const expiresAt = Date.now() + 60000; // Jelenlegi idő + 60.000 ms (60 mp)
            localStorage.setItem('resend_expires_at', expiresAt);
            setSecondsLeft(60);

        } catch (err) {

            console.error(err);


        }finally{

            setIsSending(false);
        }

    }

    const navigate = useNavigate();

    const sendCode = async (data) =>{

        try {

            
            const response = await api.put('/updateEmailConfirm',

                { code: data.auth },

            );

            console.log(response.data.message)

            navigate('/');

        } catch (err) {

            console.error(err.response.data.error);


        }

    }
   

    
    return(

   <div className='Authpage'>
        <div className='verifycard'>
            <p className='title'>Check your email</p>
            <p className='desc vd'>We've sent a verification code to your email address. Please enter it below.</p>
            <form onSubmit={handleSubmit((data) => {sendCode(data)})} className="verify">
                <input 
                    className='inputn'
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
                <button disabled={isSubmitting} type="submit" className="button">Verify and Continue    </button>
                {errors.auth && (
                    <span className="errortext">{errors.auth.message}</span>
                )}
            </form>
        <div className='resend'>
            <p className='title mini'>Didn't receive the code?</p>
            <button 
                onClick={resend} 
                // A gomb inaktív, ha épp küldünk, VAGY ha még van vissza idő
                disabled={isSending || secondsLeft > 0}
                className={`resendb`}
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