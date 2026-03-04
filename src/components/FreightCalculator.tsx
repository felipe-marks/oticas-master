import { useState } from 'react';
import { Truck, Loader2 } from 'lucide-react';

interface FreightOption {
  codigo: string;
  nome: string;
  preco: number;
  prazo: number;
  prazoMin: number;
  empresa: string;
}

interface Props {
  valorProdutos: number;
  onSelectFrete: (frete: FreightOption | null) => void;
  freteAtual: FreightOption | null;
}

export function FreightCalculator({ valorProdutos, onSelectFrete, freteAtual }: Props) {
  const [cep, setCep] = useState('');
  const [fretes, setFretes] = useState<FreightOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [calculado, setCalculado] = useState(false);

  const formatarCep = (valor: string) => {
    return valor
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  const calcularFrete = async () => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setErro('Digite um CEP válido com 8 dígitos.');
      return;
    }

    setLoading(true);
    setErro('');
    setFretes([]);
    onSelectFrete(null);
    setCalculado(false);

    try {
      const res = await fetch(
        `/api/freight?cep=${cepLimpo}&valor=${valorProdutos}&peso=0.3&comprimento=20&altura=10&largura=15`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao calcular frete.');

      setFretes(data.fretes);
      setCalculado(true);

      // Selecionar automaticamente a opção mais barata
      if (data.fretes.length > 0) {
        const maisBarato = data.fretes.reduce((a: FreightOption, b: FreightOption) =>
          a.preco < b.preco ? a : b
        );
        onSelectFrete(maisBarato);
      }
    } catch (e: any) {
      setErro(e.message || 'Erro ao calcular frete.');
    } finally {
      setLoading(false);
    }
  };

  const selecionarFrete = (frete: FreightOption) => {
    onSelectFrete(frete);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Truck className="w-4 h-4 text-amber-700" />
        <span className="text-sm font-semibold text-gray-700">Calcular Frete</span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Digite seu CEP (ex: 01310-100)"
          value={cep}
          onChange={(e) => setCep(formatarCep(e.target.value))}
          maxLength={9}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          onKeyDown={(e) => e.key === 'Enter' && calcularFrete()}
        />
        <button
          onClick={calcularFrete}
          disabled={loading}
          className="px-4 py-2 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Calcular'
          )}
        </button>
      </div>

      <a
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-amber-700 hover:underline mt-1 inline-block"
      >
        Não sei meu CEP
      </a>

      {erro && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>
      )}

      {calculado && fretes.length > 0 && (
        <div className="mt-3 space-y-2">
          {fretes.map((frete) => {
            const selecionado = freteAtual?.codigo === frete.codigo;
            return (
              <div
                key={frete.codigo}
                onClick={() => selecionarFrete(frete)}
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selecionado
                    ? 'border-amber-700 bg-amber-50'
                    : 'border-gray-200 bg-white hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selecionado ? 'border-amber-700' : 'border-gray-300'
                    }`}
                  >
                    {selecionado && (
                      <div className="w-2 h-2 rounded-full bg-amber-700" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{frete.nome}</p>
                    <p className="text-xs text-gray-500">
                      Entrega em {frete.prazoMin === frete.prazo
                        ? `${frete.prazo} dias úteis`
                        : `${frete.prazoMin} a ${frete.prazo} dias úteis`}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-800">
                  R$ {frete.preco.toFixed(2).replace('.', ',')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
