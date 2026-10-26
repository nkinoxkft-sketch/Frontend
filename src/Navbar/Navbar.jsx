import { useNavigate, Link } from "react-router-dom";
import ai from '../assets/ai.svg'
import profil from '../assets/profil.svg'
import React from "react";
import { useAuth } from "../main";
import { LoginCard } from "./LoginCard";
import { useEffect, useRef, useState } from "react";
import { Shield } from "../Shield/Shield";
import './NavBar.css';
import { ProfilCard } from "../Profil/ProfilCard";

export const NavBar = React.memo(function Navbar()  {

    const { isLogedIn } = useAuth()

    const [ isOpen, setIsOpen ] = useState(false);

    const cardRef = useRef(null);

    const navigate = useNavigate();

    const scroll = (id) =>{

        const element = document.getElementById(id);

        if(element){

            element.scrollIntoView({ behavior: 'smooth' });

        }

    }

    useEffect(() => {
        // Ez a függvény fut le, amikor bárhová kattintasz az oldalon
        const handleClickOutside = (event) => {
            // Ha a kártya nyitva van, ÉS a kattintás KÍVÜL esik a kártyán
            if (cardRef.current && !cardRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        // Csak akkor rakjuk fel a figyelőt, ha a kártya látszik
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Takarítás: leszedjük a figyelőt, ha bezáródik vagy unmountolódik
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (

        <div className='navBar'>
         <div className='navMain'>
           <div className='mainnavunder'>
             <Link to='/' className='logoB'>
               <img src={ai} className='navLogo' alt='logo'/>
             </Link>
             <p>Cloudify</p>
           </div>
           <Link to='/dashboard' className='textButton'>Ai Chat</Link>
         </div>
         <div className='navLinks'>
           <a 
             href='#features' 
             onClick={(e) => {
                 e.preventDefault();
                 navigate('/');
                 scroll("features");
             }} 
             className='textButton invisiblebutton'
         >
                       Features
         </a>
          <a 
             href='#subscriptions' 
             onClick={(e) => {
                 e.preventDefault();
                 navigate('/');
                 scroll('subscriptions');
             }} 
             className='textButton invisiblebutton'
         >
           Subscriptions
         </a>
         <a 
             href='#subscriptions' 
             onClick={(e) => {
                 e.preventDefault();
                 navigate('/');
                 scroll('faq');
             }} 
             className='textButton invisiblebutton'
         >
           FAQ
         </a>
           {!isLogedIn && (
               <button type='button' href='login' className='textButton relativebutton' onClick={() => setIsOpen(!isOpen)}>Login</button>
           )}
           {isLogedIn && (
             
               <div>
                 <button  type='button' href='login' className='textButton relativebutton' onClick={() => setIsOpen(!isOpen)}><img src={profil} className='navLogo' alt='logo'/></button>
                 {isOpen && <Shield><ProfilCard ref={cardRef} setCardVisibility={setIsOpen}/></Shield>}
               </div>
           ) }
           {isOpen && !isLogedIn && <LoginCard ref={cardRef} setCardVisibility={setIsOpen}/>}
         </div>
        </div>
    )
});


