import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';

function Home({ onAuthenticated }) {
  return <div><Navbar onAuthenticated={onAuthenticated} /><Hero onAuthenticated={onAuthenticated} /></div>;
}
export default Home;
