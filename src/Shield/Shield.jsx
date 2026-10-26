
import { api, setAccessToken } from "../interceptor";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../main";

export function Shield({ children, className}) {

    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const { isLogedIn, setIsLogedIn } = useAuth(); 

    useEffect(() => {
     
        const verifyAuth = async () => {

            if (isLogedIn) {
                setIsChecking(false);
                return;
            }

            try {
            
                const res = await api.post('/auth/refresh');
                
                setAccessToken(res.data.accessToken);

                setIsLogedIn(true);

            } catch (err) {
     
                setIsLogedIn(false);

                if (location.pathname !== '/loginpage' && location.pathname !== '/') {

                    console.log('nav')
                    void navigate('/loginpage', { state: { from: location } });
                    

                }

                console.log(err)

            } finally {
             
                setIsChecking(false);
            }
        };

        void verifyAuth();

    }, [location, navigate, isLogedIn, setIsLogedIn]);

    if (isChecking) {
        
        return null

    }

    return (

    <div className={`base-shield ${className || ''}`}>
      {children}
    </div>
  );
}

