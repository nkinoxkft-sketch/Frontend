import { useQuery } from '@tanstack/react-query';
import { api, isAccessToken } from '../src/interceptor';
import { useAuth } from '../src/main';
const getUserData = async () =>{
    
    const response = await api.get('/getUserData');

    return response.data.userData;
  
};


export function useUser() {
    
    const { isLogedIn } = useAuth()


    const { data, error, isLoading } = useQuery({
            
        queryKey: ['userData'],

        queryFn: getUserData,

        staleTime: 1000 * 60 * 5,

        enabled: isLogedIn,

    })

    const user = data || { username: 'null', email: 'null' };

    return { user, error, isLoading };

}