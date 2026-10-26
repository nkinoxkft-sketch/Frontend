import { useEffect, useState } from 'react';
import {  useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import 'react-phone-number-input/style.css';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '../../useStates/useUser';
import { api } from '../interceptor';
import './account.css'
  

const emailSchema = z.object({

  email: z.email({error: 'Invalid email address format!'}),

})

const usernameSchema = z.object({

  username: z.string().min(1, 'Username is required!'),

})


export const AccountSettings = ({ className}) => {

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

            //return;

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

    const deleteAccount = async () => {

        try{

            await api.put('/delete');

            navigate(`/authpage?action=delete_account`);

        }catch(err){


        }
        

    }

    return(
        <div className={`acc-settings-page`} >
            {error && <p className="cas-error-global">Unexpected error</p>}

            {!error && !isLoading && (
                <div className="cas-wrapper">
                    <div className="cas-header">
                        <h2 className="cas-title">Account Settings</h2>
                        <p className="cas-desc">Manage your personal information.</p>
                    </div>

                    <div className="cas-form-section">
                        {/* Felhasználónév form */}
                        <form onSubmit={handleSubmitUsername((data) => onSubmitUser(data))} noValidate className="cas-form">
                            <div className="cas-field-group">
                                <label className="cas-label" htmlFor="prof">Username</label>
                                <input
                                    className="cas-input"
                                    id="prof"
                                    type="text"
                                    {...registerUsername('username')}
                                />
                                
                                {/* Hiba- és sikerüzenetek */}
                                <div className="cas-message-box">
                                    {errorsUsername.username && <span className="cas-error-text">{errorsUsername.username.message}</span>}
                                    {submitErrorUser && <span className="cas-error-text">{submitErrorUser}</span>}
                                    {success && <span className="cas-success-text">Saved successfully</span>}
                                </div>
                                
                                <button disabled={isSubmittingUsername} type="submit" className="cas-primary-btn">
                                    Change Username
                                </button>
                            </div>
                        </form>

                        {/* Elválasztó vonal a két form közé */}
                        <hr className="cas-divider" />

                        {/* Email form */}
                        <form onSubmit={handleSubmit((data) => onSubmitEmail(data))} noValidate className="cas-form">
                            <div className="cas-field-group">
                                <label className="cas-label" htmlFor="email">E-mail address</label>
                                <input
                                    className="cas-input"
                                    id="email"
                                    type="email"
                                    placeholder="example@email.com"
                                    autoComplete="email"
                                    {...register('email')}
                                />
                                
                                {/* Hibaüzenetek */}
                                <div className="cas-message-box">
                                    {errors.email && <span className="cas-error-text">{errors.email.message}</span>}
                                    {submitErrorEmail && <span className="cas-error-text">{submitErrorEmail}</span>}
                                </div>

                                <button type="submit" disabled={isSubmitting} className="cas-primary-btn">
                                    Change E-mail
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Veszélyes zóna (Fiók törlése) */}
                    <div className="cas-danger-zone">
                        <button type="button" onClick={() => deleteAccount()} className="cas-danger-btn">
                            Delete Account
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

}

