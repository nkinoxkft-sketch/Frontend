import { useQuery } from '@tanstack/react-query';
import { api, isAccessToken } from '../src/interceptor';
import { useAuth } from '../src/main';
const getSubData = async () =>{
    
    const response = await api.get('/getSubData');

    return response.data.subData;
  
};
export function useSub() {

    const { isLogedIn } = useAuth()

    const { data, error, isLoading } = useQuery({

        queryKey: ['subData'],

        queryFn: getSubData,

        retry: false,

        staleTime: 1000 * 60 * 5,

        enabled: isLogedIn,

    });

    const sub = data ? { ...data } : { status: null, expiry: null };

    const targetDateStr = sub.expiry || ''

    const dateString = String(targetDateStr);
    const year = Number.parseInt(dateString.substring(0, 4), 10);
    const month = Number.parseInt(dateString.substring(4, 6), 10) - 1;
    const day = Number.parseInt(dateString.substring(6, 8), 10);

    const targetDate = new Date(year, month, day);


    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    sub.expiry = diffDays;

    const year1 = dateString.substring(0, 4);
    const month1 = dateString.substring(4, 6);
    const day1 = dateString.substring(6, 8);

    const expiryDatestring = `${year1}.${month1}.${day1}`;

    console.log('asdasd')

    return { sub, error, isLoading, expiryDatestring };
}