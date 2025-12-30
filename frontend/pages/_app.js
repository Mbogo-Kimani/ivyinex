import '../styles/globals.css';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';

export default function MyApp({ Component, pageProps }) {
    return (
        <AuthProvider>
            <ToastProvider>
                <Component {...pageProps} />
            </ToastProvider>
        </AuthProvider>
    );
}
