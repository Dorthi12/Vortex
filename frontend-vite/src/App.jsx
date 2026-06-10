import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-background font-body text-slate-800 selection:bg-accent/30">
        <Navbar />
        <main className="flex-grow flex flex-col">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
