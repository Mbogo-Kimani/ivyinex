import Header from './Header';

export default function Layout({ children }) {
    return (
        <>
            <Header />
            <main className="container" style={{ minHeight: '80vh', paddingBottom: 40 }}>
                {children}
            </main>
        </>
    );
}
