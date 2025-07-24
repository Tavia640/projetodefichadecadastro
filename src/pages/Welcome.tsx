import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gavLogo from '@/assets/gav-logo.png';

const Welcome = () => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);

  useEffect(() => {
    // Sequência de animações
    const timer1 = setTimeout(() => setShowConfetti(true), 500);
    const timer2 = setTimeout(() => setShowText(true), 1500);
    const timer3 = setTimeout(() => setShowSubtext(true), 2500);
    
    // Navegar para a próxima página após 6 segundos
    const timerNavigate = setTimeout(() => {
      navigate('/cadastro-cliente');
    }, 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerNavigate);
    };
  }, [navigate]);

  // Gerar confetes aleatórios
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 3,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)]
  }));

  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    animationDelay: Math.random() * 2,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Estrelas de fundo */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute w-2 h-2 bg-white rounded-full animate-pulse opacity-70"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            animationDelay: `${star.animationDelay}s`,
          }}
        />
      ))}

      {/* Confetes */}
      {showConfetti && confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 animate-bounce opacity-80"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.animationDelay}s`,
            animationDuration: '2s',
            top: '-10px',
            transform: 'rotate(45deg)',
          }}
        />
      ))}

      <div className="text-center space-y-8 z-10">
        {/* Logo com múltiplas animações */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full blur-xl opacity-50 animate-pulse scale-110" />
          <div className="relative animate-bounce">
            <div className="animate-spin-slow">
              <img 
                src={gavLogo} 
                alt="GAV Resorts" 
                className="w-56 h-56 mx-auto drop-shadow-2xl hover:scale-110 transition-transform duration-500"
              />
            </div>
          </div>
          
          {/* Círculos decorativos ao redor do logo */}
          <div className="absolute -inset-8">
            <div className="w-full h-full border-4 border-white/30 rounded-full animate-ping" />
            <div className="absolute inset-4 border-4 border-yellow-300/50 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Texto principal com animação espetacular */}
        {showText && (
          <div className="animate-fade-in space-y-6">
            <div className="relative">
              <h1 className="text-6xl md:text-7xl font-black text-white text-center leading-tight tracking-wide transform animate-bounce">
                <span className="inline-block animate-pulse bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
                  🎉 PARABÉNS! 🎉
                </span>
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-400 blur opacity-30 animate-pulse" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white/95 animate-slide-in-right">
              PELA VENDA!
            </h2>
          </div>
        )}

        {/* Subtexto com animação especial */}
        {showSubtext && (
          <div className="animate-fade-in animate-scale-in space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-2xl">
              <p className="text-3xl md:text-4xl text-white font-bold leading-relaxed">
                Você é sem dúvidas um
              </p>
              <div className="relative mt-2">
                <span className="text-5xl md:text-6xl font-black text-yellow-300 animate-pulse tracking-wider">
                  🐺 LOBO DO SUL 🐺
                </span>
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 blur-lg animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Barra de progresso animada */}
        <div className="animate-fade-in mt-8">
          <div className="w-64 h-2 bg-white/20 rounded-full mx-auto overflow-hidden backdrop-blur-sm">
            <div className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-full animate-pulse shadow-lg transform scale-x-100 origin-left transition-transform duration-6000 ease-out"></div>
          </div>
          <p className="text-white/80 mt-2 text-lg font-medium animate-pulse">
            Preparando sua área de trabalho...
          </p>
        </div>

        {/* Fogos de artifício */}
        <div className="absolute top-20 left-20 text-4xl animate-bounce opacity-80">🎆</div>
        <div className="absolute top-32 right-16 text-3xl animate-pulse opacity-80">✨</div>
        <div className="absolute bottom-32 left-12 text-5xl animate-spin-slow opacity-80">🎊</div>
        <div className="absolute bottom-20 right-20 text-4xl animate-bounce opacity-80">🌟</div>
      </div>

      {/* Overlay de celebração */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-yellow-400/10 pointer-events-none" />
    </div>
  );
};

export default Welcome;