
import { useState, useEffect, useRef } from 'react';
import './auth.css';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { api, setAccessToken } from '../interceptor';
import { useQueryClient } from '@tanstack/react-query';
import { resfreshStates } from '../../useStates/refreshStates';
import { BackendError } from '../errors';
import { useAuth } from '../main';

const regSchema = z.object({
  email: z.email({ error: 'Invalid email address format!' }),
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

export const RegisterPage = () =>{

    const { setIsLogedIn } = useAuth();

    const queryClient = useQueryClient();

    const [backendError, setBackendError] = useState(null);

    const nav = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    const [showPassword1, setShowPassword1] = useState(false);

    const turnstileRef = useRef(null);

    const widgetId = useRef(null);

    const resetTurnstile = () => {
        if (window.turnstile && widgetId.current !== null) {
            window.turnstile.reset(widgetId.current);
            resetDefaultValues
        }
    };

    const handleRegister = async (data) =>{

        try{

            resetTurnstile()

            const response = await api.post('/register',{

                email: data.email, userName: data.username, password: data.password, passwordAgain: data.passwordAgain, cloud: data['cf'] 

            });

            setAccessToken(response.data.token)

            setIsLogedIn(true);

            nav('/');

            resfreshStates(queryClient)


        }catch(err){

            setBackendError(err.response.data.error)


        }
        

    }

    const {
        register,
        handleSubmit,
        setValue,
        resetDefaultValues,
        clearErrors,
        formState: { errors, isSubmitting },
        } = useForm({
        resolver: zodResolver(regSchema),
        defaultValues: {

            cf: '',

        },
        mode: 'onTouched'
    });

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
            <h1 className="auth-title">Register</h1>
            </div>

            <form className="auth-form" onSubmit={handleSubmit(handleRegister)} noValidate>
            
            <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <input 
                id="username"
                className="form-input"
                type="text"
                placeholder="Enter your username"
                {...register('username',{
                    onChange: () => setBackendError(null)
                })}
                />
                {errors.username && <span className="error-message">{errors.username.message}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input 
                id="email"
                className="form-input"
                type="email"
                placeholder="name@example.com"
                {...register('email',{
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
                    placeholder="Create a password"
                    className="form-input password-input"
                    {...register('password',{
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
            </div>

            <div className="form-group">
                <label htmlFor="passwordagain" className="form-label">Confirm Password</label>
                <div className="password-wrapper">
                <input 
                    id="passwordagain"
                    type={showPassword1 ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    className="form-input password-input"
                    {...register('passwordAgain',{
                        onChange: () => setBackendError(null)
                    })}
                />
                <button 
                    type="button" 
                    onClick={() => setShowPassword1(!showPassword1)}
                    className="password-toggle-btn"
                >
                    {showPassword1 ? 'Hide' : 'Show'}
                </button>
                </div>
                {errors.passwordAgain && <span className="error-message">{errors.passwordAgain.message}</span>}
                {errors.cf && <span className="error-message">{errors.cf.message}</span>}
                <BackendError error={backendError}/>
            </div>

            <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
                {isSubmitting ? 'Loading...' : 'Register'}
            </button>

            <div className="cloudflare-container">
                <div ref={turnstileRef}></div>
            </div>
            </form>

 
        </div>

        <div className="auth-footer">
            <p className="auth-terms">
            By signing in, you confirm that you have read and accepted the Claudify.com Terms. Information about how we process your personal data can be found in the Claudify.com Privacy Policy.
            </p>
        </div>
        </div>
    );

}