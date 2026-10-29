import { useQuery } from '@tanstack/react-query';
import { api } from '../src/interceptor';
import { useAuth } from '../src/main';
const getSubData = async () =>{
    
    const response = await api.get('/getSubData');

    return response.data.subData;
  
};
export function useSub() {

    const { isLogedIn } = useAuth()

    //console.log(isLogedIn)

    const { data, error, isLoading } = useQuery({

        queryKey: ['subData'],

        queryFn: getSubData,

        retry: false,

        staleTime: 1000 * 60 * 5,

        enabled: isLogedIn,

    });

    const sub = data ? { ...data } : { status: null, expiry: null };

    const targetDateStr = sub.expiry || ''

    const expiryDate = new Date(Number(targetDateStr));
    const now = new Date();

    const diffTime = expiryDate.getTime() - now.getTime();

    const year1 = expiryDate.getFullYear();
    const month1 = String(expiryDate.getMonth() + 1).padStart(2, '0'); // +1 mert a hónapok 0-tól indulnak
    const day1 = String(expiryDate.getDate()).padStart(2, '0');

    const expiryDatestring = `${year1}.${month1}.${day1}`;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    //console.log(diffDays)

    return { sub, error, isLoading, expiryDatestring, diffDays };
}