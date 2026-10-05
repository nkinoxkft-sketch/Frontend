import { api } from '../src/interceptor';
import { useQuery, isAccessToken } from '@tanstack/react-query';
import { useAuth } from '../src/main';
const getUpdateData = async () => {


    const response = await api.get('/getUpdateData');

    return response.data;
     
};

export function useUpdatePlan() {

    const { isLogedIn } = useAuth()

    const { data, error, isLoading } = useQuery({

        queryKey: ['updatePlanData'],
        queryFn: getUpdateData,
        
        staleTime: 1000 * 60 * 5,

        enabled: isLogedIn,
        
    });
    
    const update = data ? { ...data } : { price: null };
    
    return { update, error, isLoading };
}