import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoDark from '../../assets/logo-dark.png';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/login', { replace: true }), 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      onClick={() => navigate('/login', { replace: true })}
      className="min-h-screen bg-navy flex flex-col items-center justify-center gap-4 cursor-pointer"
    >
      <img src={logoDark} alt="MBEUND MI" className="h-10" />
      <div className="flex items-center gap-3">
        <span className="w-6 h-px bg-navy-50" />
        <span className="text-xs font-semibold tracking-widest uppercase text-navy-50">Bul Xaar, Waajal Ko.</span>
        <span className="w-6 h-px bg-navy-50" />
      </div>
      <span className="mt-2.5 text-xs font-bold tracking-wider uppercase text-navy-400">
        Plateforme de prévention des inondations
      </span>
      <div className="mt-10 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-navy-50 animate-pulse"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
