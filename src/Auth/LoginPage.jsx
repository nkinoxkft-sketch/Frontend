import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import {  setAccessToken } from '../interceptor';
import { useQueryClient } from '@tanstack/react-query';
import { resfreshStates } from '../../useStates/refreshStates';
import { useAuth } from '../main';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BackendError } from '../errors';
import './auth.css';
const loginSchema = z.object({

  email: z.email({ message: 'Invalid email address format!' }),
  password: z.string().min(1, { error: 'Empty password' }),
  cf: z.string({ error: 'Please complete the captcha' }).min(1, { error: 'Please complete the captcha' } ),

});


export const LoginPage = () =>{
  
  const { setIsLogedIn } = useAuth()

  const location = useLocation();

  const [passText, setPassText] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [backendError, setBackendError] = useState(null);

  const queryClient = useQueryClient();

  const nav = useNavigate();

  const resetTurnstile = () => {
      if (window.turnstile && widgetId.current !== null) {
        window.turnstile.reset(widgetId.current);
        setValue('cf', '');
      }
  };

  const login = async (data ) =>{

    const redirectTo = location.state?.from?.pathname || '/';

    try{

      resetTurnstile()

      const response = await axios.post('/api/login',{

        email: data.email, password: data.password, cloud: data['cf']

      });

      setAccessToken(response.data.token)

      setIsLogedIn(true);

      resfreshStates(queryClient)

      void nav(redirectTo, { replace: true });


    }catch(err){

      setPassText(true);

      setBackendError(err.response.data.error);

    }
    

  }


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
      },
      mode: 'onTouched'
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
                // Fontos: a custom hook 'access_token'-t ad vissza, nem 'credential'-t!
                const response = await axios.post('/api/google-login', {
                    token: tokenResponse.access_token 
                });

                setAccessToken(response.data.token);
                setIsLogedIn(true);
                resfreshStates(queryClient);
                void nav(redirectTo, { replace: true });
            } catch (err) {
              setBackendError(err.response.data.error);
            }
        },
        onError: error => console.log('Login Failed:', error)
    });
    
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title" id='loginPageTextSignIn'>Sign in</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(login)} noValidate>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input 
              id="email"
              className="form-input"
              type="email" 
              placeholder="example@email.com"
              autoComplete="email"
              {...register('email', {
                onChange: () => setBackendError(null)
              })}
            />
            {errors.email && <span className="error-message">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="password-wrapper">
              <input 
                id="password"
                type={showPassword ? 'text' : 'password'} 
                placeholder="Password"
                className="form-input password-input"
                {...register('password', {
                  onChange: () => setBackendError(null)
                })}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password.message}</span>}
            <BackendError error={backendError}/>
            {errors?.cf && <span className="error-message">{errors.cf.message}</span>}
          </div>

          <div className="auth-forgot-container">
            <Link to='/forgotpage' className="auth-forgot-link">Forgot password?</Link>
          </div>

          <button type='submit' disabled={isSubmitting} className="auth-submit-btn">
            {isSubmitting ? 'Loading...' : 'Sign in'}
          </button>

          <div className="cloudflare-container">
            <div ref={turnstileRef}></div>
          </div>
        </form>

        {passText && backendError === null && (
          <p className="error-message auth-global-error">
            The password or username you entered doesn't match our records. Please check your details and try again.
          </p>
        )}

        <div className="auth-divider">
          <span>or sign in with</span>
        </div>

        <div className="auth-social">
          <button type="button" onClick={() => loginWithGoogle()} className="social-btn google-btn">
            <div className="google-icon-wrapper">
              <svg viewBox="0 0 48 48" width="18" height="18">
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

        <div className="auth-register-prompt">
          <p className="auth-register-text">New to Claudify? Start your journey!</p>
          <Link to='/registerpage' className="auth-register-link-btn">Register</Link>
        </div>
      </div>

      <div className="auth-footer">
        <p className="auth-terms">
          By signing in, you confirm that you have read and accepted the Claudify.COM Terms. Information about how we process your personal data can be found in the Claudify.COM Privacy Policy.
        </p>
      </div>
    </div>
  );

}