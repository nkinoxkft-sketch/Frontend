import { api } from '../src/interceptor';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../src/main';
const getInstruction = async () =>{

        try{

            const response = await api.get('/getInstruction');

            const data = response.data.instruction

            console.log(response);

            return data


        }catch(err){

            console.log(err);

        }

    }

export function useInstruct() {

    const { isLogedIn } = useAuth()

    const { data, error, isLoading } = useQuery({

        queryKey: ['updateInstruct'],
        queryFn: getInstruction,
        
        staleTime: 1000 * 60 * 5,

        enabled: isLogedIn,
        
    });
    
    return { data, error, isLoading };
}