export const Resend = ({resendname}) =>{

     const [secondsLeft, setSecondsLeft] = useState(0);
      const [isSending, setIsSending] = useState(false);
    
      // 1. Az oldal betöltésekor ellenőrizzük, van-e aktív tiltás
      useEffect(() => {
        const calculateRemaining = () => {
          const expiresAt = localStorage.getItem('resend_expires_at');
          if (expiresAt) {
            const remaining = Math.round((parseInt(expiresAt) - Date.now()) / 1000);
            if (remaining > 0) {
              setSecondsLeft(remaining);
            } else {
              localStorage.removeItem('resend_expires_at');
            }
          }
        };
    
        calculateRemaining();
      }, []);
    
      // 2. A visszaszámláló időzítő (csak akkor fut, ha van hátralévő idő)
      useEffect(() => {
        // Ha lejárt az idő, nincs dolgunk
        if (secondsLeft <= 0) return;
    
        const timer = setInterval(() => {
          const expiresAt = localStorage.getItem('resend_expires_at');
          if (expiresAt) {
            // Valós idő alapján számolunk, így a böngésző "altatása" sem rontja el
            const remaining = Math.round((parseInt(expiresAt) - Date.now()) / 1000);
            
            if (remaining <= 0) {
              setSecondsLeft(0);
              localStorage.removeItem('resend_expires_at');
            } else {
              setSecondsLeft(remaining);
            }
          } else {
            setSecondsLeft(0);
          }
        }, 1000);
    
        // Takarítás a háttérben
        return () => clearInterval(timer);
      }, [secondsLeft > 0]);

      return (

        <div>
            <button 
                onClick={resend} 
                // A gomb inaktív, ha épp küldünk, VAGY ha még van vissza idő
                disabled={isSending || secondsLeft > 0}
                className={`resendb`}
                >
                {isSending 
                    ? 'Sending...' 
                    : secondsLeft > 0 
                    ? `Resend in (${secondsLeft}s)` 
                    : 'Resend code'}
            </button>
        </div>

      )

}