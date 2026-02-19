import React, { useState, useEffect, useRef } from 'react';
import { Truck, CreditCard, Tag, Phone } from 'lucide-react';

const messages = [
  {
    icon: <Truck className="w-3.5 h-3.5 shrink-0" />,
    text: 'Enviamos para todo o Brasil',
  },
  {
    icon: <CreditCard className="w-3.5 h-3.5 shrink-0" />,
    text: 'Parcelamos em até 10 vezes',
  },
  {
    icon: <Tag className="w-3.5 h-3.5 shrink-0" />,
    text: '10% de desconto no PIX',
  },
  {
    icon: <Phone className="w-3.5 h-3.5 shrink-0" />,
    text: '(94) 98179-6065',
  },
];

export const TopBar: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % messages.length);
        setAnimating(false);
      }, 300);
    }, 3000);
  };

  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const goTo = (index: number) => {
    if (index === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 300);
    startInterval();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      const next = diff > 0
        ? (current + 1) % messages.length
        : (current - 1 + messages.length) % messages.length;
      goTo(next);
    }
    touchStartX.current = null;
  };

  return (
    <div className="bg-gray-900 text-white">
      {/* Mobile: carrossel com uma mensagem por vez */}
      <div
        className="md:hidden flex flex-col items-center py-1.5 px-4 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`flex items-center gap-2 text-xs font-medium transition-opacity duration-300 ${
            animating ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <span className="text-gold">{messages[current].icon}</span>
          <span>{messages[current].text}</span>
        </div>
        {/* Indicadores de ponto */}
        <div className="flex gap-1 mt-1">
          {messages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'bg-gold w-4 h-1' : 'bg-white/30 w-1.5 h-1'
              }`}
              aria-label={`Mensagem ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: todas as mensagens lado a lado */}
      <div className="hidden md:flex items-center justify-center gap-8 py-2 px-4 text-xs font-medium">
        {messages.map((msg, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-1.5">
              <span className="text-gold">{msg.icon}</span>
              <span>{msg.text}</span>
            </div>
            {i < messages.length - 1 && (
              <span className="text-gray-600">|</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
