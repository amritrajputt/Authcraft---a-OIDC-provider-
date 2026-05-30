import { useState, useEffect } from 'react';
import Login from './components/Login';
import Consent from './components/Consent';

export default function App() {
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  if (route === '/consent') {
    return <Consent />;
  }

  return <Login />;
}
