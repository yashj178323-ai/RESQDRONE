import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppStoreProvider } from '@/context/AppStore';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ResQDroneSplash } from '@/components/splash/ResQDroneSplash';
import { router } from '@/app/router/routes';

export default function App() {
  const [booted, setBooted] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppStoreProvider>
          {!booted && <ResQDroneSplash onDone={() => setBooted(true)} />}
          {booted && <RouterProvider router={router} />}
        </AppStoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
