import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ParcelaPagaSala {
  id: string;
  tipo: string;
  valorTotal: string;
  valorDistribuido: string;
  quantidadeCotas: string;
  formasPagamento: string[];
}

interface Contrato {
  id: string;
  tipoContrato: string;
  empreendimento: string;
  torre: string;
  apartamento: string;
  cota: string;
  categoriaPreco: string;
  valor: string;
}

interface InformacaoPagamento {
  id: string;
  tipo: string;
  total: string;
  qtdParcelas: string;
  valorParcela: string;
  formaPagamento: string;
  primeiroVencimento: string;
}

interface Empreendimento {
  id: string;
  nome: string;
  descricao?: string;
}

interface CategoriaPreco {
  categoria_preco: string;
  vir_cota: number;
  empreendimento_id: string;
  total_entrada?: number;
  total_sinal?: number;
  total_saldo?: number;
  sinal_qtd?: number;
  saldo_qtd?: number;
  percentual_entrada?: number;
  percentual_sinal?: number;
  percentual_saldo?: number;
}

interface Torre {
  id: string;
  nome: string;
  empreendimento_id: string;
}

interface DadosCalculados {
  valorTotal: number;
  valorSinal: number;
  valorSaldo: number;
  maxParcelasSinal: number;
  maxParcelasSaldo: number;
}

const FichaNegociacao = () => {
  const [liner, setLiner] = useState('');
  const [closer, setCloser] = useState('');
  const [tipoVenda, setTipoVenda] = useState('');
  const [parcelasPagasSala, setParcelasPagasSala] = useState<ParcelaPagaSala[]>([{
    id: '1',
    tipo: '1ª Entrada',
    valorTotal: '',
    valorDistribuido: '',
    quantidadeCotas: '',
    formasPagamento: ['']
  }]);
  const [contratos, setContratos] = useState<Contrato[]>([{
    id: '1',
    tipoContrato: '',
    empreendimento: '',
    torre: '',
    apartamento: '',
    cota: '',
    categoriaPreco: '',
    valor: ''
  }]);
  const [informacoesPagamento, setInformacoesPagamento] = useState<InformacaoPagamento[]>([
    { id: '1', tipo: '1ª Entrada', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
    { id: '2', tipo: 'Restante da Entrada', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
    { id: '3', tipo: '2ª Entrada', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
    { id: '4', tipo: 'Sinal', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
    { id: '5', tipo: 'Saldo', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' }
  ]);

  // Estados para dados do Supabase
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [categoriasPreco, setCategoriasPreco] = useState<CategoriaPreco[]>([]);
  const [torres, setTorres] = useState<Torre[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados do Supabase
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar empreendimentos
        const { data: empreendimentosData, error: errorEmpreendimentos } = await supabase
          .from('empreendimentos')
          .select('*')
          .eq('status', 'ATIVO');

        if (errorEmpreendimentos) throw errorEmpreendimentos;
        setEmpreendimentos(empreendimentosData || []);

        // Carregar categorias de preço das vendas normais com todos os campos (apenas registros mais recentes)
        const { data: tiposVendaNormal, error: errorTiposVenda } = await supabase
          .from('tipos_venda_normal')
          .select('categoria_preco, vir_cota, empreendimento_id, total_entrada, total_sinal, total_saldo, sinal_qtd, saldo_qtd, percentual_entrada, percentual_sinal, percentual_saldo, created_at')
          .order('created_at', { ascending: false });

        if (errorTiposVenda) throw errorTiposVenda;
        
        // Filtrar apenas o registro mais recente de cada categoria por empreendimento
        const categoriasUnicas = tiposVendaNormal?.reduce((acc, curr) => {
          const key = `${curr.empreendimento_id}-${curr.categoria_preco}`;
          if (!acc[key] || new Date(curr.created_at) > new Date(acc[key].created_at)) {
            acc[key] = curr;
          }
          return acc;
        }, {} as Record<string, any>);
        
        setCategoriasPreco(Object.values(categoriasUnicas || {}));

        // Carregar torres
        const { data: torresData, error: errorTorres } = await supabase
          .from('torres')
          .select('*');

        if (errorTorres) throw errorTorres;
        setTorres(torresData || []);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Filtrar categorias por empreendimento
  const getCategoriasPorEmpreendimento = (empreendimentoId: string) => {
    return categoriasPreco.filter(cat => cat.empreendimento_id === empreendimentoId);
  };

  // Filtrar torres por empreendimento
  const getTorresPorEmpreendimento = (empreendimentoId: string) => {
    return torres.filter(torre => torre.empreendimento_id === empreendimentoId);
  };

  // Calcular dados automaticamente baseado na categoria
  const calcularDadosCategoria = (empreendimentoId: string, categoriaPreco: string): DadosCalculados | null => {
    const categoria = categoriasPreco.find(cat => 
      cat.empreendimento_id === empreendimentoId && cat.categoria_preco === categoriaPreco
    );

    if (!categoria) return null;

    return {
      valorTotal: categoria.vir_cota || 0,
      valorSinal: categoria.total_sinal || 0,
      valorSaldo: categoria.total_saldo || 0,
      maxParcelasSinal: categoria.sinal_qtd || 1,
      maxParcelasSaldo: categoria.saldo_qtd || 1
    };
  };

  // Função para calcular valor de entrada baseado no empreendimento
  const calcularValorEntrada = (empreendimentoNome: string): number => {
    const empreendimentosEspeciais = ['Gran Garden', 'Gran Valley'];
    return empreendimentosEspeciais.includes(empreendimentoNome) ? 4490 : 3990;
  };

  // Preencher automaticamente informações de pagamento
  const preencherInformacoesPagamento = (dados: DadosCalculados, empreendimentoId?: string) => {
    // Buscar nome do empreendimento se fornecido
    const empreendimento = empreendimentoId ? empreendimentos.find(emp => emp.id === empreendimentoId) : null;
    const valorEntrada = empreendimento ? calcularValorEntrada(empreendimento.nome) : 0;

    const novasInformacoes = informacoesPagamento.map(info => {
      if (info.tipo === '1ª Entrada' && empreendimento) {
        return {
          ...info,
          total: valorEntrada.toString(),
          qtdParcelas: '1',
          valorParcela: valorEntrada.toString()
        };
      }
      if (info.tipo === 'Sinal') {
        return {
          ...info,
          total: dados.valorSinal.toString(),
          qtdParcelas: dados.maxParcelasSinal.toString(),
          valorParcela: (dados.valorSinal / dados.maxParcelasSinal).toFixed(2)
        };
      }
      if (info.tipo === 'Saldo') {
        return {
          ...info,
          total: dados.valorSaldo.toString(),
          qtdParcelas: dados.maxParcelasSaldo.toString(),
          valorParcela: (dados.valorSaldo / dados.maxParcelasSaldo).toFixed(2)
        };
      }
      return info;
    });
    setInformacoesPagamento(novasInformacoes);
  };

  // Validar quantidade de parcelas
  const validarQuantidadeParcelas = (tipo: string, quantidade: number, empreendimentoId: string, categoriaPreco: string): boolean => {
    const dados = calcularDadosCategoria(empreendimentoId, categoriaPreco);
    if (!dados) return true;

    if (tipo === 'Sinal' && quantidade > dados.maxParcelasSinal) return false;
    if (tipo === 'Saldo' && quantidade > dados.maxParcelasSaldo) return false;
    return true;
  };

  const adicionarFormaPagamento = (parcelaId: string) => {
    const newParcelas = [...parcelasPagasSala];
    const parcelaIndex = newParcelas.findIndex(p => p.id === parcelaId);
    if (parcelaIndex !== -1) {
      newParcelas[parcelaIndex].formasPagamento.push('');
      setParcelasPagasSala(newParcelas);
    }
  };

  const adicionarParcelaPagaSala = () => {
    setParcelasPagasSala([...parcelasPagasSala, {
      id: Date.now().toString(),
      tipo: '',
      valorTotal: '',
      valorDistribuido: '',
      quantidadeCotas: '',
      formasPagamento: ['']
    }]);
  };

  const removerParcelaPagaSala = (id: string) => {
    setParcelasPagasSala(parcelasPagasSala.filter(p => p.id !== id));
  };

  const adicionarContrato = () => {
    setContratos([...contratos, {
      id: Date.now().toString(),
      tipoContrato: '',
      empreendimento: '',
      torre: '',
      apartamento: '',
      cota: '',
      categoriaPreco: '',
      valor: ''
    }]);
  };

  const removerContrato = (id: string) => {
    setContratos(contratos.filter(c => c.id !== id));
  };

  const adicionarEntrada = () => {
    setInformacoesPagamento([...informacoesPagamento, {
      id: Date.now().toString(),
      tipo: '',
      total: '',
      qtdParcelas: '',
      valorParcela: '',
      formaPagamento: '',
      primeiroVencimento: ''
    }]);
  };

  const removerInformacaoPagamento = (id: string) => {
    setInformacoesPagamento(informacoesPagamento.filter(i => i.id !== id));
  };

  const limparFicha = () => {
    setLiner('');
    setCloser('');
    setTipoVenda('');
    setParcelasPagasSala([{
      id: '1',
      tipo: '1ª Entrada',
      valorTotal: '',
      valorDistribuido: '',
      quantidadeCotas: '',
      formasPagamento: ['']
    }]);
    setContratos([{
      id: '1',
      tipoContrato: '',
      empreendimento: '',
      torre: '',
      apartamento: '',
      cota: '',
      categoriaPreco: '',
      valor: ''
    }]);
    setInformacoesPagamento([
      { id: '1', tipo: '1ª Entrada', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
      { id: '2', tipo: 'Restante da Entrada', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
      { id: '3', tipo: '2ª Entrada', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
      { id: '4', tipo: 'Sinal', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
      { id: '5', tipo: 'Saldo', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' }
    ]);
  };

  const salvarFicha = () => {
    console.log('Ficha salva', {
      liner,
      closer,
      tipoVenda,
      parcelasPagasSala,
      contratos,
      informacoesPagamento
    });
    alert('Ficha salva com sucesso!');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Ficha de Negociação de Cota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seção Inicial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="liner">LINER:</Label>
              <Input
                id="liner"
                value={liner}
                onChange={(e) => setLiner(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="closer">CLOSER:</Label>
              <Input
                id="closer"
                value={closer}
                onChange={(e) => setCloser(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Tipo de Venda */}
          <div>
            <Label className="text-base font-semibold">TIPO DE VENDA: *</Label>
            <RadioGroup value={tipoVenda} onValueChange={setTipoVenda} className="mt-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="semestral" id="semestral" />
                  <Label htmlFor="semestral">Semestral</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="anual" id="anual" />
                  <Label htmlFor="anual">Anual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="a-vista" id="a-vista" />
                  <Label htmlFor="a-vista">À Vista</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ate-36x" id="ate-36x" />
                  <Label htmlFor="ate-36x">Até 36x</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="padrao" id="padrao" />
                  <Label htmlFor="padrao">Padrão</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="linear" id="linear" />
                  <Label htmlFor="linear">Linear</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Tipo de Parcela Paga em Sala */}
          <div>
            <Label className="text-lg font-semibold">Tipo de Parcela Paga em Sala *</Label>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left">Tipo de Parcela Paga em Sala</th>
                    <th className="border border-border p-3 text-left">Valor Total Pago em Sala *</th>
                    <th className="border border-border p-3 text-left">Valor Distribuído para cada Unidade *</th>
                    <th className="border border-border p-3 text-left">Quantidade de Cotas *</th>
                    <th className="border border-border p-3 text-left">Forma de Pag. *</th>
                    <th className="border border-border p-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {parcelasPagasSala.map((parcela, index) => (
                    <tr key={parcela.id}>
                      <td className="border border-border p-3">
                        <Input
                          value={parcela.tipo}
                          onChange={(e) => {
                            const newParcelas = [...parcelasPagasSala];
                            newParcelas[index].tipo = e.target.value;
                            setParcelasPagasSala(newParcelas);
                          }}
                          placeholder="Tipo de parcela"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <Input
                          value={parcela.valorTotal}
                          onChange={(e) => {
                            const newParcelas = [...parcelasPagasSala];
                            newParcelas[index].valorTotal = e.target.value;
                            setParcelasPagasSala(newParcelas);
                          }}
                          placeholder="Valor total"
                          type="number"
                        />
                      </td>
                       <td className="border border-border p-3">
                         <Input
                           value={parcela.valorDistribuido}
                             onChange={(e) => {
                              const newParcelas = [...parcelasPagasSala];
                              newParcelas[index].valorDistribuido = e.target.value;
                              setParcelasPagasSala(newParcelas);

                              // Clonar valor para 1ª Entrada automaticamente
                              const novasInformacoes = [...informacoesPagamento];
                              const primeiraEntradaIndex = novasInformacoes.findIndex(info => info.tipo === '1ª Entrada');
                              if (primeiraEntradaIndex !== -1) {
                                novasInformacoes[primeiraEntradaIndex].total = e.target.value;
                                novasInformacoes[primeiraEntradaIndex].valorParcela = e.target.value;
                                novasInformacoes[primeiraEntradaIndex].qtdParcelas = '1';
                                
                                // Preencher forma de pagamento automaticamente se estiver vazia
                                if (!novasInformacoes[primeiraEntradaIndex].formaPagamento && parcela.formasPagamento[0]) {
                                  novasInformacoes[primeiraEntradaIndex].formaPagamento = parcela.formasPagamento[0];
                                }
                                
                                // Calcular Restante da Entrada
                                const restanteEntradaIndex = novasInformacoes.findIndex(info => info.tipo === 'Restante da Entrada');
                                if (restanteEntradaIndex !== -1) {
                                  const contratoAtivo = contratos.find(c => c.empreendimento);
                                  if (contratoAtivo) {
                                    const empreendimento = empreendimentos.find(emp => emp.id === contratoAtivo.empreendimento);
                                    const valorEntrada = empreendimento ? calcularValorEntrada(empreendimento.nome) : 0;
                                    const valorPrimeiraEntrada = parseFloat(e.target.value) || 0;
                                    const restante = valorEntrada - valorPrimeiraEntrada;
                                    
                                    if (restante > 0) {
                                      novasInformacoes[restanteEntradaIndex].total = restante.toString();
                                      novasInformacoes[restanteEntradaIndex].valorParcela = restante.toString();
                                      novasInformacoes[restanteEntradaIndex].qtdParcelas = '1';
                                    }
                                  }
                                }
                                
                                setInformacoesPagamento(novasInformacoes);
                              }
                            }}
                           placeholder="Valor distribuído"
                           type="number"
                         />
                       </td>
                      <td className="border border-border p-3">
                        <Input
                          value={parcela.quantidadeCotas}
                          onChange={(e) => {
                            const newParcelas = [...parcelasPagasSala];
                            newParcelas[index].quantidadeCotas = e.target.value;
                            setParcelasPagasSala(newParcelas);
                          }}
                          placeholder="Qtd cotas"
                          type="number"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <div className="space-y-2">
                          {parcela.formasPagamento.map((forma, formaIndex) => (
                            <div key={formaIndex} className="flex items-center space-x-2">
                              <Select
                                value={forma}
                                onValueChange={(value) => {
                                  const newParcelas = [...parcelasPagasSala];
                                  newParcelas[index].formasPagamento[formaIndex] = value;
                                  setParcelasPagasSala(newParcelas);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione forma" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                  <SelectItem value="cartao">Cartão</SelectItem>
                                  <SelectItem value="pix">PIX</SelectItem>
                                  <SelectItem value="transferencia">Transferência</SelectItem>
                                </SelectContent>
                              </Select>
                              {parcela.formasPagamento.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newParcelas = [...parcelasPagasSala];
                                    newParcelas[index].formasPagamento = newParcelas[index].formasPagamento.filter((_, i) => i !== formaIndex);
                                    setParcelasPagasSala(newParcelas);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adicionarFormaPagamento(parcela.id)}
                            className="w-full"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar Forma de Pagamento
                          </Button>
                        </div>
                      </td>
                      <td className="border border-border p-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removerParcelaPagaSala(parcela.id)}
                          disabled={parcelasPagasSala.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={adicionarParcelaPagaSala} className="mt-2" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Linha
            </Button>
          </div>

          <Separator />

          {/* Contratos */}
          <div>
            <Label className="text-lg font-semibold">Contratos *</Label>
            <Button onClick={adicionarContrato} className="mt-2 mb-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Contrato
            </Button>
            <div className="overflow-x-auto">
              <table className="w-full border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left">Tipo de Contrato *</th>
                    <th className="border border-border p-3 text-left">Empreendimento *</th>
                    <th className="border border-border p-3 text-left">Torre *</th>
                    <th className="border border-border p-3 text-left">Apartamento *</th>
                    <th className="border border-border p-3 text-left">Cota *</th>
                    <th className="border border-border p-3 text-left">Categoria de Preço *</th>
                    <th className="border border-border p-3 text-left">Valor *</th>
                    <th className="border border-border p-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map((contrato, index) => (
                    <tr key={contrato.id}>
                      <td className="border border-border p-3">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Físico</div>
                          <div className="text-sm text-muted-foreground">Digital</div>
                        </div>
                      </td>
                      <td className="border border-border p-3">
                        <Select
                          value={contrato.empreendimento}
                          onValueChange={(value) => {
                            const newContratos = [...contratos];
                            newContratos[index].empreendimento = value;
                            // Limpar categoria e torre quando mudar empreendimento
                            newContratos[index].categoriaPreco = '';
                            newContratos[index].torre = '';
                            setContratos(newContratos);
                          }}
                          disabled={loading}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={loading ? "Carregando..." : "Selecione empreendimento"} />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {empreendimentos.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                       <td className="border border-border p-3">
                         <Input
                           value={contrato.torre}
                           onChange={(e) => {
                             const newContratos = [...contratos];
                             newContratos[index].torre = e.target.value;
                             setContratos(newContratos);
                           }}
                           placeholder="Torre"
                         />
                       </td>
                      <td className="border border-border p-3">
                        <Input
                          value={contrato.apartamento}
                          onChange={(e) => {
                            const newContratos = [...contratos];
                            newContratos[index].apartamento = e.target.value;
                            setContratos(newContratos);
                          }}
                          placeholder="Apartamento"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <Input
                          value={contrato.cota}
                          onChange={(e) => {
                            const newContratos = [...contratos];
                            newContratos[index].cota = e.target.value;
                            setContratos(newContratos);
                          }}
                          placeholder="Cota"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <Select
                          value={contrato.categoriaPreco}
                          onValueChange={(value) => {
                            const newContratos = [...contratos];
                            newContratos[index].categoriaPreco = value;
                            // Auto-preencher valor baseado na categoria selecionada
                            const categoria = categoriasPreco.find(cat => 
                              cat.categoria_preco === value && cat.empreendimento_id === contrato.empreendimento
                            );
                            if (categoria) {
                              newContratos[index].valor = categoria.vir_cota.toString();
                              
                               // Preencher automaticamente as informações de pagamento
                               const dados = calcularDadosCategoria(contrato.empreendimento, value);
                               if (dados) {
                                 preencherInformacoesPagamento(dados, contrato.empreendimento);
                               }
                            }
                            setContratos(newContratos);
                          }}
                          disabled={!contrato.empreendimento || loading}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={
                              !contrato.empreendimento 
                                ? "Selecione empreendimento primeiro" 
                                : "Selecione categoria de preço"
                            } />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {getCategoriasPorEmpreendimento(contrato.empreendimento).map((categoria) => (
                              <SelectItem key={categoria.categoria_preco} value={categoria.categoria_preco}>
                                {categoria.categoria_preco} - R$ {categoria.vir_cota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-border p-3">
                        <Input
                          value={contrato.valor}
                          onChange={(e) => {
                            const newContratos = [...contratos];
                            newContratos[index].valor = e.target.value;
                            setContratos(newContratos);
                          }}
                          placeholder="Valor"
                          type="number"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removerContrato(contrato.id)}
                          disabled={contratos.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Local para Assinatura */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              O financeiro descrito acima é referente a cada unidade separadamente.
            </p>
            <div className="border-t border-border pt-4">
              <Label className="text-base font-semibold">Assinatura do Cliente</Label>
              <div className="h-16 border border-dashed border-border mt-2 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Local para Assinatura do Cliente</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações de Pagamento */}
          <div>
            <Label className="text-lg font-semibold">Informações de Pagamento</Label>
            <Button onClick={adicionarEntrada} className="mt-2 mb-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Entrada
            </Button>
            <div className="overflow-x-auto">
              <table className="w-full border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left">Tipo</th>
                    <th className="border border-border p-3 text-left">Total *</th>
                    <th className="border border-border p-3 text-left">Qtd. Parcelas *</th>
                    <th className="border border-border p-3 text-left">Valor Parcela *</th>
                    <th className="border border-border p-3 text-left">Forma de Pag. *</th>
                    <th className="border border-border p-3 text-left">1º Vencimento *</th>
                    <th className="border border-border p-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {informacoesPagamento.map((info, index) => (
                    <tr key={info.id}>
                      <td className="border border-border p-3 font-medium">
                        {info.tipo}
                      </td>
                      <td className="border border-border p-3">
                        <Input
                          value={info.total}
                           onChange={(e) => {
                             const newInfos = [...informacoesPagamento];
                             newInfos[index].total = e.target.value;
                             
                             // Recalcular valor da parcela automaticamente quando alterar total
                             if (newInfos[index].qtdParcelas && parseInt(newInfos[index].qtdParcelas) > 0) {
                               const total = parseFloat(e.target.value) || 0;
                               const qtdParcelas = parseInt(newInfos[index].qtdParcelas);
                               newInfos[index].valorParcela = (total / qtdParcelas).toFixed(2);
                             }
                             
                             // Se for 1ª Entrada, recalcular Restante da Entrada
                             if (info.tipo === '1ª Entrada') {
                               const restanteEntradaIndex = newInfos.findIndex(inf => inf.tipo === 'Restante da Entrada');
                               if (restanteEntradaIndex !== -1) {
                                 const contratoAtivo = contratos.find(c => c.empreendimento);
                                 if (contratoAtivo) {
                                   const empreendimento = empreendimentos.find(emp => emp.id === contratoAtivo.empreendimento);
                                   const valorEntrada = empreendimento ? calcularValorEntrada(empreendimento.nome) : 0;
                                   const valorPrimeiraEntrada = parseFloat(e.target.value) || 0;
                                   const restante = valorEntrada - valorPrimeiraEntrada;
                                   
                                   if (restante > 0) {
                                     newInfos[restanteEntradaIndex].total = restante.toString();
                                     newInfos[restanteEntradaIndex].valorParcela = restante.toString();
                                     newInfos[restanteEntradaIndex].qtdParcelas = '1';
                                   }
                                 }
                               }
                             }
                             
                             setInformacoesPagamento(newInfos);
                           }}
                          placeholder="Total"
                          type="number"
                          className="bg-background"
                        />
                      </td>
                      <td className="border border-border p-3">
                        {(() => {
                          // Encontrar o primeiro contrato com empreendimento e categoria preenchidos para validação
                          const contratoAtivo = contratos.find(c => c.empreendimento && c.categoriaPreco);
                          const dados = contratoAtivo ? calcularDadosCategoria(contratoAtivo.empreendimento, contratoAtivo.categoriaPreco) : null;
                          const maxParcelas = dados ? (info.tipo === 'Sinal' ? dados.maxParcelasSinal : dados.maxParcelasSaldo) : null;
                          
                          return (
                            <div className="space-y-1">
                              <Input
                                value={info.qtdParcelas}
                                 onChange={(e) => {
                                   const valor = parseInt(e.target.value) || 0;
                                   if (maxParcelas && valor > maxParcelas) {
                                     return; // Bloqueia entrada superior ao máximo
                                   }
                                   const newInfos = [...informacoesPagamento];
                                   newInfos[index].qtdParcelas = e.target.value;
                                   
                                   // Recalcular valor da parcela automaticamente
                                   if (newInfos[index].total && valor > 0) {
                                     const total = parseFloat(newInfos[index].total);
                                     newInfos[index].valorParcela = (total / valor).toFixed(2);
                                   }
                                   
                                   setInformacoesPagamento(newInfos);
                                 }}
                                placeholder="Qtd"
                                type="number"
                                max={maxParcelas || undefined}
                                className={`${
                                  maxParcelas && parseInt(info.qtdParcelas) > maxParcelas 
                                    ? 'border-destructive' 
                                    : ''
                                }`}
                              />
                              {maxParcelas && (info.tipo === 'Sinal' || info.tipo === 'Saldo') && (
                                <div className="text-xs text-muted-foreground">
                                  Máx: {maxParcelas} parcelas
                                </div>
                              )}
                              {maxParcelas && parseInt(info.qtdParcelas) > maxParcelas && (
                                <div className="text-xs text-destructive">
                                  Limite excedido!
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="border border-border p-3">
                        <Input
                          value={info.valorParcela}
                          onChange={(e) => {
                            const newInfos = [...informacoesPagamento];
                            newInfos[index].valorParcela = e.target.value;
                            setInformacoesPagamento(newInfos);
                          }}
                          placeholder="Valor"
                          type="number"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <Select
                          value={info.formaPagamento}
                          onValueChange={(value) => {
                            const newInfos = [...informacoesPagamento];
                            newInfos[index].formaPagamento = value;
                            setInformacoesPagamento(newInfos);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="cartao">Cartão</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="transferencia">Transferência</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-border p-3">
                        <Input
                          value={info.primeiroVencimento}
                          onChange={(e) => {
                            const newInfos = [...informacoesPagamento];
                            newInfos[index].primeiroVencimento = e.target.value;
                            setInformacoesPagamento(newInfos);
                          }}
                          type="date"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removerInformacaoPagamento(info.id)}
                          disabled={informacoesPagamento.length <= 5}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-center space-x-4 pt-6">
            <Button variant="outline" onClick={limparFicha}>
              Limpar
            </Button>
            <Button onClick={salvarFicha}>
              Salvar Ficha
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FichaNegociacao;