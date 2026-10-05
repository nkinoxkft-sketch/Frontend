
import { useState, forwardRef, useEffect, useRef } from 'react';
import './login.css';

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { api, setAccessToken } from './interceptor';
import { useQueryClient } from '@tanstack/react-query';
import { resfreshStates } from '../useStates/refreshStates';
import { useAuth } from './main';
import { BackendError } from './errors';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));



export const LoginCard = forwardRef(({setCardVisibility}, ref) =>{

  const { setIsLogedIn } = useAuth()
  const queryClient = useQueryClient()
  const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                resfreshStates(queryClient);
                // Fontos: a custom hook 'access_token'-t ad vissza, nem 'credential'-t!
                const res = await axios.post('/api/google-login', {
                    token: tokenResponse.access_token 
                });
                setAccessToken(res.data.token);
                localStorage.setItem('IsLogedin', 'true');
                setIsLogedIn(true);
            } catch (err) {
                console.error(err);
            }
        },
        onError: error => console.log('Login Failed:', error)
    });
    return (
      <div ref = {ref} className="Login-card">

          <p id = "title-card-login">Welcome!</p>

          <div className = 'loginbuttonslist'>
            
            <div className='google-btn'>
                <button 
                    onClick={() => loginWithGoogle()} 
                    className="google-custom-btn"
                >
                    <div className="google-icon-wrapper">
                        <svg viewBox="0 0 48 48" width="20px" height="20px">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.73 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                    </div>
                    <span className="google-btn-text">Log in with Google</span>
                </button>
            </div>

            <Link to='/loginpage'  className='logbuttons sign' onClick={() => setCardVisibility(false)}>Sign in</Link>

          </div>
          <div className='textunderbuttons'>
            <p>By clicking Sign in with Google, you agree to Claudify's Terms & Conditions and Privacy Policy.</p>
          </div>
          <div className='registertext'>
            <p>Don't have an account?</p>
          </div>
          <div className='regDiv'>
            <Link to='/registerpage' className='logbuttons reg' onClick={() => setCardVisibility(false)}>Register</Link>
          </div>
      </div>
    );
  });

const loginSchema = z.object({

  email: z.email({ message: 'Invalid email address format!' }),
  password: z.string().optional(),
  cf: z.string({
    required_error: 'Please complete the captcha',
    invalid_type_error: 'Please complete the captcha',
}).min(1, 'Please complete the captcha'),

});

export const LoginPage = ({setDashboard }) =>{
  
  const { setIsLogedIn } = useAuth()

  setDashboard(false);
  const queryClient = useQueryClient();

  const resetTurnstile = () => {
      if (window.turnstile && widgetId.current !== null) {
        window.turnstile.reset(widgetId.current);
        setValue('cf', '');
      }
  };

  const [backendError, setBackendError] = useState(null);


  const login = async (data, setIsLogedIn, setPassText, nav, loc) =>{
    
    
    setBackendError('')

    await sleep(100);

    const redirectTo = loc.state?.from?.pathname || '/';

    try{

      const response = await axios.post('/api/login',{

        email: data.email, password: data.password, cloud: data['cf']

      });

      console.log(response.data)

      setAccessToken(response.data.token)

      localStorage.setItem('IsLogedin', 'true');

      setIsLogedIn(true);

      resfreshStates(queryClient)

      nav(redirectTo, { replace: true });


    }catch(err){

      setPassText(true);
      setBackendError(err.response.data.error);
      setValue('password', '')
      resetTurnstile()
      console.log(err.response.data)
      console.log('errror')

    }
    

  }

  const navigate = useNavigate();
  const location = useLocation();

  const [passText, setPassText] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const {
      register,
      handleSubmit,
      setValue,
      clearErrors,
      formState: { errors, isSubmitting },
    } = useForm({
      resolver: zodResolver(loginSchema),
      defaultValues: {

        cf: "" 
      }
    });

  const turnstileRef = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    register('cf');
    if (window.turnstile && turnstileRef.current && !widgetId.current) {
      widgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: '1x00000000000000000000AA',
        callback: (token) => {
          setValue('cf', token, { shouldValidate: true, shouldDirty: true });
          clearErrors('email')
          clearErrors('password')
          setBackendError('')
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

  const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                resfreshStates(queryClient);
                // Fontos: a custom hook 'access_token'-t ad vissza, nem 'credential'-t!
                const res = await axios.post('/api/google-login', {
                    token: tokenResponse.access_token 
                });
                localStorage.setItem('IsLogedin', 'true');
                setAccessToken(res.data.token);
                setIsLogedIn(true);
            } catch (err) {
                console.error(err);
            }
        },
        onError: error => console.log('Login Failed:', error)
    });
    
  return(

    <div className='loginPage'>
      <div className='loginPageBox'>
        <div className='logpageboxfirst'>
          <p id='loginPageTextSignIn'>Sign in</p>

          <form onSubmit={handleSubmit((data) => {login(data, setIsLogedIn, setPassText, navigate, location); setPassText(false)})} noValidate>
            <div className='formdiv'>
              <label htmlFor="email" className='loginPageText'>Email</label>
              <input 
                id='email'
                className='loginpagebutton i'
                type='email' 
                placeholder="example@email.com"
                autoComplete="email"
                {...register('email')}
              ></input>
              {errors.email && <span className="errortext">{errors.email.message}</span>}
            </div>
            <label htmlFor="password" className='loginPageText'>password</label>
            <div className='formdiv'>
              <div className='hidebdiv'>
              <input 
                id='password'
                type={showPassword ? 'text' : 'password'} 
                placeholder="Password"
                className='loginpagebutton i'
                {...register('password')}>
              </input>
              <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className='passb s'
                >
                  {showPassword ? 'Hide' : 'Show '}
              </button>
              </div>
                <BackendError error={backendError}/>
          
                {errors?.cf && <span className="errortext">{errors.cf.message}</span>}
            </div>
            <div className='forgotb'>
              <Link to='/forgotpage' className='loginpagebutton logpageforgot' >Forgot password?</Link>
            </div>
            <button type='submit' disabled={isSubmitting} className='loginpagebutton logpagesign'>{isSubmitting ? 'Loading...' : 'Sign in'}</button>
            <div className='cloudflare'>
              <div ref={turnstileRef}></div>
          </div>
          </form>
          {passText && backendError === null && (<p className='errortext'>The password or username you entered doesn't match our records. Please check your details and try again.</p>)}
          <p className='logpagetextanother'>or sign in with</p>
        </div>
        <div className='logpageboxsecond'>
              <div className='google-btn'>
                <button 
                    onClick={() => loginWithGoogle()} 
                    className="google-custom-btn"
                >
                    <div className="google-icon-wrapper">
                        <svg viewBox="0 0 48 48" width="20px" height="20px">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.73 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                    </div>
                    <span className="google-btn-text">Log in with Google</span>
                </button>
            </div>
            <p className='logpagetextanother'>New to Claudify? Start your journey!</p>
            <div className='regb'>
              <Link to='/registerpage' className='loginpagebutton logpageregister'>Register</Link>
            </div>
        </div>
      </div>
      <div className='loginPageUnder'>
        <p className='termslogpage'>By signing in, you confirm that you have read and accepted the Claudify.COM 
        . Information about how we process your personal data can be found in the Claudify.COM 
        .</p>

      </div>
    </div>


  );

}

const regSchema = z.object({
  email: z.string().email('Invalid email address format!'),
  username: z.string().min(1, { message: "Username is required" }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long!')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter!')
    .regex(/[0-9]/, 'Must contain at least one number!')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character!'),
  passwordAgain: z.string(), 
  cf: z.string().min(1, 'Please complete the captcha'),
}).refine((data) => data.password === data.passwordAgain, {
  message: "Passwords don't match!",
  path: ['passwordAgain'], 
});

export const RegisterPage = ({ setIsLogedIn }) =>{

  const queryClient = useQueryClient();

  const [backendError, setBackendError] = useState(null);


  const registerf = async (datar, nav, setIsLogedIn) =>{

    setBackendError('')
    const resetTurnstile = () => {
      if (window.turnstile && widgetId.current !== null) {
        window.turnstile.reset(widgetId.current);
        setValue('cf', '');
      }
    };

    try{

      const response = await api.post('/register',{

        email: datar.email, userName: datar.username, password: datar.password, passwordAgain: datar.passwordAgain, cloud: datar['cf'] 

      });

      const data = response.data || null;

      if(response.status === 200){

        resfreshStates(queryClient)

        setAccessToken(data.token)

        nav('/');
        
        setIsLogedIn(true);

        localStorage.setItem('IsLogedin', 'true');


      }


    }catch(err){

      setBackendError(err.response.data.error)

      resetTurnstile()
    }
    

  }


  const nav = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [showPassword1, setShowPassword1] = useState(false);
    const {
      register,
      handleSubmit,
      setValue,
      clearErrors,
      formState: { errors, isSubmitting },
    } = useForm({
      resolver: zodResolver(regSchema),
      defaultValues: {

        cf: '',

      }
    });


  const turnstileRef = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    register('cf');
    if (window.turnstile && turnstileRef.current && !widgetId.current) {
      widgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: '0x4AAAAAAFKYH9Ss5fCyHtPD',
        callback: (token) => {
          setValue('cf', token, { shouldValidate: true, shouldDirty: true });
          setBackendError('')
          clearErrors()
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

  return(

    <div className='loginPage'>
      <div className='loginPageBox'>
        <div className='logpageboxfirst'>
          <p id='loginPageTextSignIn'>Register</p>
          <form onSubmit={handleSubmit((data) => {registerf(data, nav, setIsLogedIn)})}noValidate>
             <div className='formdiv'>
                <label htmlFor='username' className='loginPageText'>Username</label>
                <input 
                  id='username'
                  className='loginpagebutton i'
                  type='username'
                  placeholder="username"
                  {...register('username')}
                ></input>
                {errors.username && <span className="errortext">{errors.username.message}</span>}
              </div>
            <div className='formdiv'>
              <label htmlFor='email' className='loginPageText'>Email</label>
              <input 
                id='email'
                className='loginpagebutton i'
                type='email'
                placeholder="email"
                {...register('email')}
              ></input>
              {errors.email && <span className="errortext">{errors.email.message}</span>}
            </div>
            <div className='formdiv'>
              <div className='hidebdiv'>
                <label htmlFor='password' className='loginPageText'>password</label>
                <input 
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className='loginpagebutton i'
                  {...register('password')}
                  >
                </input>
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className='passb'
                  >
                    {showPassword ? 'Hide' : 'Show '}
                </button>
              </div>
              {errors.password && <span className="errortext">{errors.password.message}</span>}
            </div>
            <div className='formdiv'>
              <div className='hidebdiv'>
                <label htmlFor='passwordagain' className='loginPageText'>password</label>
                <input 
                  id='passwordagain'
                  type={showPassword1 ? 'text' : 'password'}
                  placeholder="Password again"
                  className='loginpagebutton i'
                  {...register('passwordAgain')}
                  >
                </input>
                <button 
                    type="button" 
                    onClick={() => setShowPassword1(!showPassword1)}
                    className='passb'
                  >
                    {showPassword1 ? 'Hide' : 'Show '}
                </button>
              </div>
              {errors.passwordAgain && <span className="errortext">{errors.passwordAgain.message}</span>}
              {errors.cf && <span className="errortext">{errors.cf.message}</span>}
              <BackendError error={backendError}/>
            </div>
          <button type='submit' disabled={isSubmitting} className='loginpagebutton regpagesign'> {isSubmitting ? 'Loading...' : 'Register'}</button>
          <div className='cloudflare'>
            <div ref={turnstileRef}></div>
          </div>

            
          </form>

          <p className='logpagetextanother'>or sign in with</p>
        </div>
        <div className='logpageboxsecond'>
            <button className='loginpagebutton google'>
              <svg viewBox="0 0 24 24"><path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C18.155 2.114 15.433 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.745-.079-1.32-.174-1.882H12.24z"/></svg>  
              Google
            </button>
        </div>
      </div>
      <div className='loginPageUnder'>
        <p className='termslogpage'>By signing in, you confirm that you have read and accepted the Claudify.COM 
        . Information about how we process your personal data can be found in the Claudify.COM 
        .</p>

      </div>
    </div>


  );

}

const emailSchema = z.object({

  email: z.string().email('Invalid email address format!'),
  cf: z.string().min(1, 'Please complete the captcha'),

});

export const ForgotPage = ({ setPage }) =>{

  const queryClient = useQueryClient();

  const [secondsLeft, setSecondsLeft] = useState(0);
    const [isSending, setIsSending] = useState(false);
  
    // 1. Az oldal betöltésekor ellenőrizzük, van-e aktív tiltás
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
  
    // 2. A visszaszámláló időzítő (csak akkor fut, ha van hátralévő idő)
    useEffect(() => {
      // Ha lejárt az idő, nincs dolgunk
      if (secondsLeft <= 0) return;
  
      const timer = setInterval(() => {
        const expiresAt = localStorage.getItem('resend_expires_at_forgot');
        if (expiresAt) {
          // Valós idő alapján számolunk, így a böngésző "altatása" sem rontja el
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
  
      // Takarítás a háttérben
      return () => clearInterval(timer);
    }, [secondsLeft > 0]);
  
  const [sendt, setSent] = useState(false);

  const [backendError, setBackendError] = useState(null);

  const {
      register,
      handleSubmit,
      setValue,
      formState: { errors },
    } = useForm({
      resolver: zodResolver(emailSchema),
  });

  const [isDisabled, setIsDisabled] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(0);

  const handleButtonClick = () => {

    setIsDisabled(true);
    setTimeLeft(60); 

  };



  const forgot = async (data) =>{

    setIsSending(true)

    setSent(false);
    
      if (!data['cf']) {
        setIsSending(false)
        alert('Wait for captha');
        return;
      }

      const resetTurnstile = () => {
        if (window.turnstile && widgetId.current !== null) {
          window.turnstile.reset(widgetId.current);
          setValue('cf', '');
        }
      };

    const response = await fetch('/api/forgot',{

      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: data.email, cloud: data['cf'] })


    });

    console.log(secondsLeft)
     const expiresAt = Date.now() + 60000; 
     localStorage.setItem('resend_expires_at_forgot', expiresAt);
     setSecondsLeft(60);

    const dd = await response.json();

    if(response.ok){

      console.log(dd.message);

      resfreshStates(queryClient)

    }
    else{

      setBackendError(dd.error)

      resetTurnstile()

      
    }

    setIsSending(false)

  }

  const turnstileRef = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    register('cf');
    if (window.turnstile && turnstileRef.current && !widgetId.current) {
      widgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: '0x4AAAAAAFKYH9Ss5fCyHtPD',
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

  return(

    <div className='loginPage'>
      <div className='loginPageBox forgot'>
        <div className=''>
          <p id='loginPageTextSignIn'>Forgot password?</p>
          <p id='forgottext'>Enter your Claudify account email. We'll send you a code to copy from your inbox and enter here.</p>
            <form onSubmit={handleSubmit((data)=> {forgot(data); setSent(true); handleButtonClick()})}noValidate>
              <div className='formdiv'>
              <label htmlFor='email' className='loginPageText'>Email</label>
              <input 
                className='loginpagebutton i'
                type='email' 
                id='email'
                placeholder="email"
                  {...register('email')}
              ></input>
              {errors.email && <span className="errortext">{errors.email.message}</span>}
              {backendError !== null && <span className="errortext">{backendError}</span>}
              {sendt && backendError === null  && (<div>
                <p className='descnomarg'>Email sent</p>
                </div>)}
              </div>
              <button 
                // A gomb inaktív, ha épp küldünk, VAGY ha még van vissza idő
                disabled={isSending || secondsLeft > 0}
                className='loginpagebutton regpagesign'
                >
                {isSending 
                    ? 'Sending...' 
                    : secondsLeft > 0 
                    ? `Resend in (${secondsLeft}s)` 
                    : 'Resend code'}
              </button>

            </form>
            <div className='cloudflare'>
            <div ref={turnstileRef}></div>
          </div>
        </div>
      </div>
    </div>


  );

}



