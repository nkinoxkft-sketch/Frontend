import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ResetPage } from './Auth/forgot';
import { Auth } from './Profil/Auth';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import {  Payment } from './payment';
import { Dashboard } from './dashboard/dashboard';

import { usePub } from '../useStates/usePub';
import { useSub } from '../useStates/useSub';
import { api, setAccessToken } from './interceptor';

import './App.css';
import { useAuth } from './main';

import { NavBar } from './Navbar/Navbar';
import { Shield } from './Shield/Shield';
import { LoadingSpinner } from './Loading/Loading';
import { LoginPage } from './Auth/LoginPage';
import { RegisterPage } from './Auth/RegisterPage';
import { ForgotPage } from './Auth/ForgotPage';
import { EditProfilePage } from './Profil/Editpage';

import './Profil/profil.css';
function App() {

  const { isLogedIn, setIsLogedIn, setIsloading } = useAuth();
  const [ isVisibleNav, setIsVisibleNav ] = useState(false);

  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {

    if (loc.state?.scrollToSubscriptions) {
     
        setTimeout(() => {
            const element = document.getElementById('subscriptions');

            const scrollContainer = document.querySelector('main');

            if (element && scrollContainer) {
                const containerRect = scrollContainer.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                
                const offsetPosition = scrollContainer.scrollTop + (elementRect.top - containerRect.top) - 80;

                scrollContainer.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100);

        window.history.replaceState({}, document.title);
    }

    


    

  }, [loc])

  useLayoutEffect(() => {

    if (loc.pathname === '/dashboard') {

      setIsVisibleNav(false);

      document.body.classList.add('dash-bg')
  
    } else {
      
      document.body.classList.remove('dash-bg')
      setIsVisibleNav(true);
      
    }

  }, [loc])

  useEffect(() => {
      const verifyAuth = async () => {

          if (isLogedIn) {
        
            return;

          }

          try {

            const res = await api.post('/auth/refresh');
              
            setAccessToken(res.data.accessToken);

            setIsLogedIn(true);

            setIsloading(false);

          } catch (err) {
   
            setIsLogedIn(false);

            setIsloading(false);

            console.log(err)

          } 
      };

      void verifyAuth();

  }, []);

return (
  <div className='screen'>

      {isVisibleNav && (
        
        <NavBar/>

      )}


      <div id="mainPage" className='mainPage'>
        <Routes>

          <Route path="/" element={<Main/>} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/payment" element={<Shield><Payment /></Shield>} />
          <Route path="/loginpage" element={<LoginPage />} />
          <Route path="/registerpage" element={<RegisterPage  />} />
          <Route path="/forgotpage" element={<ForgotPage />} />
          <Route path="/profedit" element={<Shield><EditProfilePage/></Shield>} />
          <Route path="/authpage" element={<Shield><Auth /></Shield>} />
          <Route path="/reset-password" element={<ResetPage />} />
          <Route path="/dashboard" element={<Dashboard />} />

        </Routes>
      </div>
      

    </div>

  );
}

function Main(){

  const { subscriptions , isLoading } = usePub()

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const supportRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (supportRef.current && !supportRef.current.contains(event.target)) {
        setIsSupportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return(
    <main>

      <section className='starterpage'>
        <div className='starterpageText'>
          <div className='orangeMini'>
            <p>Affordable Claude API Access</p>
          </div>
          <div className='largeTitle'>
            <p>The Ultimate Claude AI Experience.</p>
          </div>
          <div className='description'>
            <p>Unlock the full potential of advanced AI with our premium chat platform. Seamlessly manage your conversations, upload documents, and enjoy lightning-fast streaming responses in a professional workspace.
Call-to-Action Choose Your Plan / Start Chatting</p>
          </div>
          <a href='#subscriptions' className='buttonBlack'>Buy subscription</a>
        </div>
      </section>

      <section id='features' className='featureDiv'>
        <div className='featureText'>
          <div>
            <div className='miniTitle'>
              <p>Rich Text & Code Support:</p>
            </div>
            <div className='description f'>
              <p>Enjoy beautiful Markdown rendering and syntax-highlighted code blocks, making it perfect for developers and writers alike.</p>
            </div>
          </div>
          <div>
            <div className='miniTitle'>
              <p>Smart Context & History:</p>
            </div>
            <div className='description f'>
              <p>Never lose an idea. Our intuitive sidebar automatically saves your sessions, allowing you to pick up any conversation right where you left off.</p>
            </div>
          </div>
          <div>
            <div className='miniTitle'>
              <p>Transparent Pricing:</p>
            </div>
            <div className='description f'>
              <p>No hidden fees. Pay securely via PayPal and keep track of your AI usage easily with our built-in credit system.</p>
            </div>
          </div>
        </div>
      </section>

            <section id='faq' className="how-credits-work-section">
        <div className="credits-container">
          <div className="credits-header">
            <h2 className="credits-title">How Credits Work</h2>
            <p className="credits-subtitle">
              Your monthly credits give you complete freedom to choose the model that fits your task. Credits are deducted based on the actual tokens (words and characters) processed and the model you select.
            </p>
          </div>

          <div className="credits-grid">
            <div className="credit-card">
              <div className="credit-badge badge-green">Most Economical</div>
              <h3 className="model-name">Claude Haiku</h3>
              <p className="model-desc">Best for quick tasks, simple Q&amp;A, and fast drafts. Uses the fewest credits.</p>
              <div className="credit-metric">
                <span className="metric-label">Token usage</span>
                <span className="metric-val">Lowest (1×)</span>
              </div>
            </div>

            <div className="credit-card">
              <div className="credit-badge badge-blue">Balanced &amp; Smart</div>
              <h3 className="model-name">Claude Sonnet</h3>
              <p className="model-desc">Great for coding, deep analysis, and writing. Consumes a moderate amount of credits.</p>
              <div className="credit-metric">
                <span className="metric-label">Token usage</span>
                <span className="metric-val">Moderate (~2×)</span>
              </div>
            </div>

            <div className="credit-card">
              <div className="credit-badge badge-purple">Maximum Capability</div>
              <h3 className="model-name">Claude Opus</h3>
              <p className="model-desc">Ideal for complex reasoning, difficult math, and large documents. Consumes the most credits.</p>
              <div className="credit-metric">
                <span className="metric-label">Token usage</span>
                <span className="metric-val">Highest (~5×)</span>
              </div>
            </div>
          </div>

  
          <div className="credits-faq-box">
            <div className="faq-icon">💡</div>
            <div className="faq-content">
              <h4>Why do responses cost more than prompts?</h4>
              <p>
                Generating answers (output) requires significantly more computing power than reading prompts (input). 
                Longer responses use slightly more credits than reading the same amount of text.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id='subscriptions' className='subDiv'>
        
        {(Array.isArray(subscriptions) && !isLoading)  && ( 
        <div className='subCards'>
          {subscriptions.map((cardItem) => (
          
          <SubCards key={cardItem.id} title={cardItem.title} price={cardItem.price} desc={cardItem.desc} data={cardItem.data}/>
          
          ))}
        </div>)}
        {(isLoading)  && (
          <LoadingSpinner/>
        )}
        <p className='desc plan'>Every plan includes all features from the lower-tier plans, plus additional benefits.</p>
      </section>



     
      <footer className='footer'>

        <div className="c-support-widget" ref={supportRef}>
          {isSupportOpen && (
            <div className="c-support-card">
              <div className="c-support-status">
                <span className="c-status-dot"></span>
                <span className="c-status-text">Support Online</span>
              </div>

              <h4 className="c-support-title">Need help with your plan?</h4>
              <p className="c-support-desc">
                Have questions about billing, tokens, or need technical assistance? We're here to help.
              </p>

              <div className="c-support-email-box">
                <span className="c-email-label">Direct email</span>
                <a href="mailto:support@yourdomain.com" className="c-email-link">
                  nkinoxkft@gmail.com
                </a>
              </div>

              <div className="c-support-footer">
                Typical response time: <strong>under 24h</strong>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSupportOpen((prev) => !prev)}
            className="c-support-btn"
            aria-label="Toggle support"
          >
            <span>💬</span>
            <span>Support</span>
          </button>
        </div>

      
        <div className='footerDiv'>
          <div className='description d'>
            <Link to='/about' className='textButton' >About</Link>
          </div>
          <div className='description d'>
            <Link to='/terms' className='textButton' >Terms</Link>
          </div>
          <div className='description d'>
            <Link className='textButton' >Privacy and Cookies Policy</Link>
          </div>
        </div>

      </footer>
  

    </main>

  );
  

}

function SubCards( {title, price, desc, data} ) {

  const { isLogedIn } = useAuth()

  const { sub , isLoading } = useSub()

  const navigate = useNavigate();

  const handlePruchase = (title, price) =>{

    void navigate('/payment', { state: { plan: title, price: price } });

  }

  return (

     <div className='subCard'>
       <div className='cardTop'>
         <div className='cardTitle'>
           <p>{title}</p>
         </div>
         <div className='cardPrice'>
           <p>{price}</p>
         </div>
       </div>
       <div className='cardBottom'>
         <div className='cardDesc'>
           <p>{desc}</p>
         </div>
         <div className='subFeatures'>
           <ul>
            {data.map((item, index) => (
            
              <li key={item}>{item}</li>
            
            ))}
           </ul>
           {!isLoading && (
              <div>
                {isLogedIn && sub && sub.status !== 'inactive' && sub.nextPlan !== title && (<button type='button' className='buttonBlack p' onClick={ () => handlePruchase(title, price)}>Change plan</button>)}
                {isLogedIn && sub && sub.nextPlan === title && (<button type='button' onClick={ () => handlePruchase(title, price)} className='buttonBlack p active' >Active subscriptions</button>)}

                {(!isLogedIn || sub.status === 'inactive') && (<button type='button' className='buttonBlack p' onClick={ () => handlePruchase(title, price)}>Purchase</button>)}
              </div>
           )}
           {isLoading && (
            <p>Loading</p>
           )}
         </div>
     </div>
   </div>


  );

}

function About(){

  return(

    <div className='aboutBox'>
      <div className='minitext'>
        <p>About us</p>
      </div>
      <div className='miniTitle'>
        <p>Transparency and Trust</p>
      </div>
      <div className='description aDesc'>
        <p>sadjkhfagsdjkhfgaksjdfhgakjd</p>
      </div>
      <div className='aboutCard'>
        <div className='miniTitle aMini'>
          <p>Official Company Details</p>
        </div>
        <div className='description aDesc bet'>
          <div>
            <p>Name</p>
          </div>
          <div className='description mini'>
            <p>asdbfkajshdfgakjhf</p>
          </div>
        </div>
        <div className='description aDesc bet'>
          <div>
            <p>Registered Office</p>
          </div>
          <div className='description mini'>
            <p>asdbfkajshdfgakjhf</p>
          </div>
        </div>
        <div className='description aDesc bet'>
          <div>
            <p>Tax ID number</p>
          </div>
          <div className='description mini'>
            <p>asdbfkajshdfgakjhf</p>
          </div>
        </div>
        <div className='description aDesc bet'>
          <div>
            <p>Company Registration Number</p>
          </div>
          <div className='description mini'>
            <p>asdbfkajshdfgakjhf</p>
          </div>
        </div>
      </div>
    </div>

  );

}

function Terms(){

  return(

    <div className='terms '>
      <div className='table'>
        <div className='term-title-section'>
          <div className='miniTitle-text'>
            <p>asdasdasd</p>
          </div>
          <div className='largeTitle-text'>
            <p>asdasdadajfglkjashlgkjahlgkjs</p>
          </div>
          <div className='description-text'>
            <p>asdasdadsd</p>
          </div>
        </div>
        <div className='parag'>
          <div className='title-text'>
            <p>asdasdjas dfkh asgdkjaasdsad</p>
          </div>
          <div className='description-text'>
            <p>asdasdadasadfasdfakjfhagsdkfjhasgdkjfhasgkdbfjhaskgdfjhaskf hsadgfj skgadfjhasdsad</p>
          </div>
        </div>
        <div className='parag'>
          <div className='title-text'>
            <p>asdasdjas dfkh asgdkjaasdsad</p>
          </div>
          <div className='description-text'>
            <p>asdasdadasadfasdfakjfhagsdkfjhasgdkjfhasgkdbfjhaskgdfjhaskf hsadgfj skgadfjhasdsad</p>
          </div>
        </div>
        <div className='parag'>
          <div className='title-text'>
            <p>asdasdjas dfkh asgdkjaasdsad</p>
          </div>
          <div className='description-text'>
            <p>asdasdadasadfasdfakjfhagsdkfjhasgdkjfhasgkdbfjhaskgdfjhaskf hsadgfj skgadfjhasdsad</p>
          </div>
        </div>
      </div>
    </div>

  );

}



export default App;