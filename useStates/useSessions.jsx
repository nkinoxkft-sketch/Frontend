import { api, isAccessToken, getAccessToken } from '../src/interceptor';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../src/main';
import { useSub } from './useSub';
const getSessions = async () =>{

    const response = await api.get('/getSessions');

    return response.data.sessions;
  
};

export function useSessions() {

    const { isLogedIn } = useAuth()

    const { sub } = useSub()

    let flag = false

    if((sub.status === 'Pro' || sub.status === 'Max') && isLogedIn){

        flag = true;

    }


    const { data, error, isLoading } = useQuery({
            
        queryKey: ['sessions'],

        queryFn: getSessions,

        staleTime: 1000 * 60 * 5,

        enabled: flag

    })

    const sessions = data || [];

    return { sessions, error, isLoading };

}