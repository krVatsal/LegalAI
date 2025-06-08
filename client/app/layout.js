import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'Legal AI Assistant',
  description: 'Your AI-powered legal assistant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
