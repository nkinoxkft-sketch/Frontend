import { useState } from 'react';
import './auth.css';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { api } from '../interceptor';

const resetSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long!')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter!')
    .regex(/[0-9]/, 'Must contain at least one number!')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character!'),
  passwordAgain: z.string(), 
}).refine((data) => data.password === data.passwordAgain, {
  message: "Passwords don't match!",
  path: ['passwordAgain'], 
});



export const ResetPage = () =>{

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAgain, setShowPasswordAgain] = useState(false);

  const navigate = useNavigate();
  
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
    mode: 'onTouched',
  });


  const onSubmit = async (dataInput) => {
    
    setIsSubmitting(true);
    setServerError("");
    setSuccessMessage("");

    try {

      const response = await api.post('/reset-password', {
        password: dataInput.password,
      });

      setSuccessMessage(response.data.message);
      
      setTimeout(() => {
        navigate('/loginpage');
      }, 3000);

    } catch (error) {

      console.log(error);

      setServerError(error.response.data.error);

    } finally {

      setIsSubmitting(false);

    }
  };


  return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Reset password</h1>
            <p className="auth-subtitle">Enter your new password below.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit((data) => { onSubmit(data); })} noValidate>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">New password</label>
              <div className="password-wrapper">
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  className="form-input password-input"
                  {...register('password')}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && serverError === '' && (
                <span className="error-message">{errors.password.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="passwordagain" className="form-label">Confirm new password</label>
              <div className="password-wrapper">
                <input 
                  id="passwordagain"
                  type={showPasswordAgain ? 'text' : 'password'}
                  placeholder="Confirm password"
                  className="form-input password-input"
                  {...register('passwordAgain')}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPasswordAgain(!showPasswordAgain)}
                  className="password-toggle-btn"
                >
                  {showPasswordAgain ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.passwordAgain && serverError === '' && (
                <span className="error-message">{errors.passwordAgain.message}</span>
              )}
              
              {serverError && <span className="error-message">{serverError}</span>}
              
              {successMessage && (
                <div className="auth-success-box">
                  <span className="auth-success-text">{successMessage}</span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="auth-submit-btn"
            >
              {isSubmitting ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        </div>
      </div>
    );


}