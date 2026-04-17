import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="bg-muted flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-foreground mb-4 text-4xl font-bold">404</h1>
        <p className="text-muted-foreground mb-4 text-xl">Oops! Page not found</p>
        <a href="/" className="text-primary hover:text-primary/80 underline underline-offset-4">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
