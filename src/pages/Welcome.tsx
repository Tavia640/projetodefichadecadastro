import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gavLogo from '@/assets/gav-logo.png';

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Navegar para a página 2 após 5 segundos
    const timer = setTimeout(() => {
      navigate('/cadastro-cliente');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center p-4">
      <div className="text-center space-y-8">
        {/* Logo com animação */}
        <div className="animate-scale-in">
          <img 
            src={gavLogo} 
            alt="GAV Resorts" 
            className="w-48 h-48 mx-auto animate-pulse hover:animate-none transition-all duration-300 drop-shadow-2xl"
          />
        </div>

        {/* Texto com animação */}
        <div className="animate-fade-in space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center leading-tight">
            Parabéns pela venda
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 font-medium">
            Você é sem dúvidas um lobo do Sul
          </p>
        </div>

        {/* Indicador de carregamento */}
        <div className="animate-fade-in">
          <div className="w-16 h-1 bg-white/30 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;