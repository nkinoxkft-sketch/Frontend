import { useEffect, useState, useRef } from "react";
import { api } from "../src/interceptor"
import { useAuth } from "../src/main";

export const useSession = (reload) => {

    const { isLogedIn } = useAuth();

    const [ isLoadingSessions, setIsLoadingSessions ] = useState(false);

    const [ sessions, setSessions ] = useState([]);

    const isLoadingPrevSession = useRef(false);

    const listRef = useRef(null);

    const isMoreToLoad = useRef(true);

    const offset = useRef(20);

    const getSessions = async ( load_more_sessions = false) =>{
        try{

            if(isLoadingSessions) return;

            console.log("getseession")

            setIsLoadingSessions(true);

            const response = await api.get('/getSessions',
                {

                params: { 
                limit: Number(offset.current),
                },

            });

            const sessionsFromBackend = response.data.sessions;

            if(sessionsFromBackend.length < 20){

                isMoreToLoad.current = false;

            }

            if(load_more_sessions){

                setSessions(prev => [...prev, ...sessionsFromBackend]);

            }
            else{

                offset.current = 20;
                isMoreToLoad.current = true;
                setSessions(sessionsFromBackend);

            }   
            

        }catch(err){

            setSessions([]);

            console.log(err);

        }finally{

            setIsLoadingSessions(false);

        }


    }

    const handleScroll = () => {

        const element = listRef.current;

        if (!element) return;

        // scrollTop = mennyit görgettünk le fentről
        // clientHeight = a doboz látható magassága
        // scrollHeight = a teljes tartalom magassága (a rejtett részekkel együtt)
        const { scrollTop, clientHeight, scrollHeight } = element;

        // Ha a aljától számítva 20 pixelen belülre érünk, és nem töltődik éppen:
        if (scrollHeight - scrollTop - clientHeight <= 20 && isMoreToLoad.current && !isLoadingPrevSession.current) {

            isLoadingPrevSession.current = true;
            offset.current += 20;
            void getSessions(true);

        }
    };

    useEffect(() => {

        if(isLoadingPrevSession.current){

            isLoadingPrevSession.current = false;
            
        }

    }, [sessions])

     
    useEffect(() =>{
       
        if(isLogedIn && !reload){
            

            void getSessions();

        }
        else{

            setIsLoadingSessions(false);

        }

    }, [isLogedIn, reload]);
    console.log(sessions);
 
    return { sessions, isLoadingSessions, handleScroll, listRef }
} 