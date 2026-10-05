import { api, isAccessToken } from '../src/interceptor';
import { useQuery } from '@tanstack/react-query';

const getDataPub = async () =>{

    const response = await api.get('/getDataPub');

    return response.data.sub;
  
};

export function usePub() {
   
    const { data, error, isLoading } = useQuery({
            
        queryKey: ['pubData'],

        queryFn: getDataPub,

        staleTime: 1000 * 60 * 5,

    })

    const subscriptions = data || [];
 
    return { subscriptions, error, isLoading };

}