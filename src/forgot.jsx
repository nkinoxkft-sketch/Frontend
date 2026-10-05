import { useState, useEffect, } from 'react';
import './login.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import axios from 'axios';

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

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  

  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
  });


  useEffect(() => {
    if (!token) {
      setServerError('Invalid or missing token. Please request a new password reset link!');
    }
  }, [token]);

  const onSubmit = async (dataInput) => {

    if (!token){

      setServerError("Invalid or missing token. Please request a new password reset link!");
      return 

    } 
    
    setIsSubmitting(true);
    setServerError("");
    setSuccessMessage("");

    try {

      const response = await axios.post('/api/reset-password', {
        token: token,
        password: dataInput.password,
      });

      setSuccessMessage(response.data.message);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {

      console.log(error);

      setServerError(error.response.data.error);

    } finally {

      setIsSubmitting(false);

    }
  };

  return(

    <div className='loginPage'>
      <div className='loginPageBox'>
        <div className='logpageboxfirst'>
          <p id='loginPageTextSignIn'>Reset password</p>

          <form className='form' onSubmit={handleSubmit((data) => {onSubmit(data)})} noValidate>
            <div className='formdiv'>
              <div className='hidebdiv'>
                <label htmlFor="password" className='loginPageText'>password</label>
                <input 
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className='loginpagebutton i'
                  {...register('password')}
                ></input>
                <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className='passb'
                    >
                      {showPassword ? 'Show' : 'Hide '}
                  </button>
              </div>
              {errors.password &&  serverError === '' && <span className="errortext">{errors.password.message}</span>}
            </div>
            <div className='formdiv'>
              <div className='hidebdiv'>
                <label htmlFor="passwordagain" className='loginPageText'>Password again</label>
                <input 
                  id='passwordagain'
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password again"
                  className='loginpagebutton i'
                  {...register('passwordAgain')}
                ></input>
                <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className='passb'
                    >
                      {showPassword ? 'Show' : 'Hide '}
                  </button>
              </div>
              {errors.passwordAgain &&  serverError === '' && <span className="errortext">{errors.passwordAgain.message}</span>}
              {serverError && <span className="errortext">{serverError}</span>}
              {successMessage && <span className="desc">{successMessage}</span>}
            </div>
            <button disabled={isSubmitting} type='submit' className='loginpagebutton regpagesign'>reset</button>
          </form>
        </div>
      </div>
    </div>

  );

}