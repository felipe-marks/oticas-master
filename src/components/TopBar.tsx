import React from 'react';
import { Truck, CreditCard } from 'lucide-react';

export const TopBar: React.FC = () => {
  return (
    <div className="bg-gray-900 text-white text-xs md:text-sm py-2 px-4">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-gold" />
          <span>Enviamos para todo o Brasil</span>
        </div>
        <div className="hidden md:block text-gray-400">|</div>
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gold" />
          <span>Parcelamento em até 3x sem juros</span>
        </div>
        <div className="hidden md:block text-gray-400">|</div>
        <div className="font-semibold text-gold">
          5% de desconto no PIX
        </div>
      </div>
    </div>
  );
};