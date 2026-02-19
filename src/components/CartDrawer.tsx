import React from 'react';
import { X, ShoppingCart, Trash2, Plus, Minus, MessageCircle, ShoppingBag, Tag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, clearCart, subtotal, totalItems } = useCart();

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleCheckoutWhatsApp = () => {
    if (items.length === 0) return;
    const lines = items.map(item => {
      const price = formatCurrency(item.price);
      const total = formatCurrency(item.price * item.quantity);
      return `• *${item.name}* (${item.quantity}x ${price}) = ${total}`;
    });
    const pixTotal = items.reduce((sum, i) => sum + (i.price_pix ?? i.price) * i.quantity, 0);
    const msg = [
      '🛒 *Pedido via Site — Óticas Master*',
      '',
      ...lines,
      '',
      `💰 *Subtotal:* ${formatCurrency(subtotal)}`,
      `✅ *Total no PIX:* ${formatCurrency(pixTotal)} _(5% de desconto)_`,
      '',
      'Gostaria de finalizar este pedido. Poderia me ajudar com as formas de pagamento e entrega?',
    ].join('\n');
    window.open(`https://wa.me/5594981796065?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const pixTotal = items.reduce((sum, i) => sum + (i.price_pix ?? i.price) * i.quantity, 0);
  const pixSavings = subtotal - pixTotal;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-lg font-bold text-gray-900">
              Meu Carrinho
              {totalItems > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            aria-label="Fechar carrinho"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-gray-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Seu carrinho está vazio</h3>
                <p className="text-sm text-gray-400">Adicione produtos para continuar</p>
              </div>
              <button
                onClick={closeCart}
                className="mt-2 bg-gold text-white px-6 py-2.5 rounded-full font-semibold hover:bg-gold/90 transition-colors text-sm"
              >
                Continuar Comprando
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3 group">
                  {/* Imagem */}
                  <div
                    className="shrink-0 bg-white rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center"
                    style={{ width: 72, height: 72 }}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-gray-200" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">{item.name}</h4>
                    {item.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>}
                    <div className="flex items-center justify-between mt-2">
                      {/* Qty controls */}
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {/* Price */}
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-400">{formatCurrency(item.price)} cada</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="self-start p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    aria-label="Remover item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Limpar carrinho */}
              <button
                onClick={clearCart}
                className="w-full text-center text-xs text-gray-400 hover:text-red-400 transition-colors py-2"
              >
                Limpar carrinho
              </button>
            </div>
          )}
        </div>

        {/* Footer com totais e checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 bg-white space-y-3">
            {/* Subtotal */}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
              <span className="font-semibold text-gray-800">{formatCurrency(subtotal)}</span>
            </div>

            {/* Desconto PIX */}
            {pixSavings > 0 && (
              <div className="flex items-center justify-between text-sm bg-green-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5 text-green-700">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="font-medium">Desconto PIX (5%)</span>
                </div>
                <span className="font-semibold text-green-700">-{formatCurrency(pixSavings)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-baseline border-t border-gray-100 pt-3">
              <div>
                <p className="font-bold text-gray-900 text-base">Total</p>
                <p className="text-xs text-green-600 font-medium">{formatCurrency(pixTotal)} no PIX</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(subtotal)}</p>
            </div>

            {/* Botão Finalizar via WhatsApp */}
            <button
              onClick={handleCheckoutWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 active:scale-95 transition-all shadow-sm text-sm"
            >
              <MessageCircle className="w-5 h-5" />
              Finalizar Pedido via WhatsApp
            </button>

            <p className="text-center text-xs text-gray-400">
              Você será redirecionado ao WhatsApp para confirmar o pedido e pagamento.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
