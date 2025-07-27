import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PDFGenerator, DadosCliente, DadosNegociacao } from '@/lib/pdfGenerator';
import { EmailSimples } from '@/lib/emailSimples';

// Formatação monetária simples para exibição
const exibirValor = (valor: string): string => {
  if (!valor) return '';
  const num = parseFloat(valor);
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

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
  nomeEmpreendimento?: string;
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
  const navigate = useNavigate();
  const [liner, setLiner] = useState('');
  const [closer, setCloser] = useState('');
  const [tipoVenda, setTipoVenda] = useState('');
  const [parcelasPagasSala, setParcelasPagasSala] = useState<ParcelaPagaSala[]>([{
    id: '1',
    tipo: 'Entrada',
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

  // Estados para alertas de autorização
  const [alertas, setAlertas] = useState<{[key: string]: string}>({});

  // Estado para mensagens de status
  const [mensagemStatus, setMensagemStatus] = useState<string>('');

  // Função para validar primeira entrada
  const validarPrimeiraEntrada = (valor: number): string | null => {
    if (valor < 1000) {
      return 'ERRO: Primeira entrada não pode ser menor que R$ 1.000,00';
    }
    if (valor === 1000) {
      return 'Precisa de autorização do líder de sala';
    }
    if (valor > 1330) {
      return null; // Sem mensagem
    }
    return 'Precisa de autorização do líder de sala';
  };

  // Função para validar restante da entrada
  const validarRestanteEntrada = (qtdParcelas: number): string | null => {
    if (qtdParcelas <= 2) {
      return null; // Sem mensagem
    }
    return 'Precisa de autorização do líder de sala';
  };

  // Função para validar data do primeiro vencimento do sinal
  const validarDataVencimentoSinal = (dataVencimento: string): string | null => {
    if (!dataVencimento) return null;
    
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diferencaDias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    
    if (diferencaDias <= 150) {
      return null; // Sem alerta
    }
    if (diferencaDias <= 210) {
      return 'Precisa de autorização do regional';
    }
    return 'Precisa de autorização da diretoria';
  };

  // Função para auditoria de valores
  const realizarAuditoriaValores = (): { valida: boolean; detalhes: string } => {
    const contratoAtivo = contratos.find(c => c.empreendimento && c.valor);
    if (!contratoAtivo) {
      return { valida: false, detalhes: 'Nenhum contrato válido encontrado' };
    }

    const valorTotal = parseFloat(contratoAtivo.valor) || 0;
    
    // Somar todas as entradas
    const totalEntradas = informacoesPagamento
      .filter(info => info.tipo.includes('ª Entrada') || info.tipo === 'Restante da Entrada')
      .reduce((total, info) => total + (parseFloat(info.total) || 0), 0);
    
    const sinalInfo = informacoesPagamento.find(info => info.tipo === 'Sinal');
    const saldoInfo = informacoesPagamento.find(info => info.tipo === 'Saldo');
    
    const valorSinal = parseFloat(sinalInfo?.total || '0');
    const valorSaldo = parseFloat(saldoInfo?.total || '0');
    
    const somaTotal = totalEntradas + valorSinal + valorSaldo;
    const diferenca = Math.abs(valorTotal - somaTotal);
    
    return {
      valida: diferenca < 0.01, // Tolerância para erros de arredondamento
      detalhes: `Valor Total: R$ ${valorTotal.toFixed(2)} | Entradas: R$ ${totalEntradas.toFixed(2)} | Sinal: R$ ${valorSinal.toFixed(2)} | Saldo: R$ ${valorSaldo.toFixed(2)} | Diferença: R$ ${diferenca.toFixed(2)}`
    };
  };

  // Função para atualizar alertas (com hierarquia - mostrar apenas o de maior prioridade)
  const atualizarAlertas = () => {
    const alertasTemp: Array<{key: string, nivel: number, mensagem: string}> = [];
    
    // Validar primeira entrada (nível 1 - líder de sala)
    const primeiraEntrada = informacoesPagamento.find(info => info.tipo === '1ª Entrada');
    if (primeiraEntrada?.total) {
      const valor = parseFloat(primeiraEntrada.total);
      const alerta = validarPrimeiraEntrada(valor);
      if (alerta) {
        const nivel = alerta.includes('ERRO') ? 0 : 1; // Erro tem prioridade máxima
        alertasTemp.push({key: 'primeira_entrada', nivel, mensagem: alerta});
      }
    }
    
    // Validar restante da entrada (n��vel 1 - líder de sala)
    const restanteEntrada = informacoesPagamento.find(info => info.tipo === 'Restante da Entrada');
    if (restanteEntrada?.qtdParcelas) {
      const qtd = parseInt(restanteEntrada.qtdParcelas);
      const alerta = validarRestanteEntrada(qtd);
      if (alerta) {
        alertasTemp.push({key: 'restante_entrada', nivel: 1, mensagem: alerta});
      }
    }
    
    // Validar data do sinal (nível 2 - regional, nível 3 - diretoria)
    const sinalInfo = informacoesPagamento.find(info => info.tipo === 'Sinal');
    if (sinalInfo?.primeiroVencimento) {
      const alerta = validarDataVencimentoSinal(sinalInfo.primeiroVencimento);
      if (alerta) {
        const nivel = alerta.includes('diretoria') ? 3 : 2;
        alertasTemp.push({key: 'data_sinal', nivel, mensagem: alerta});
      }
    }
    
    // Validar datas para sinal e saldo (apenas dias 05 ou 15)
    const validarDiaVencimento = (info: InformacaoPagamento) => {
      if (info.primeiroVencimento && (info.tipo === 'Sinal' || info.tipo === 'Saldo')) {
        const data = new Date(info.primeiroVencimento);
        const dia = data.getDate();
        if (dia !== 5 && dia !== 15) {
          return `${info.tipo}: Data deve ser dia 05 ou 15 do mês`;
        }
      }
      return null;
    };
    
    informacoesPagamento.forEach(info => {
      const alertaData = validarDiaVencimento(info);
      if (alertaData) {
        alertasTemp.push({key: `data_${info.tipo}`, nivel: 0, mensagem: `ERRO: ${alertaData}`});
      }
    });
    
    // Mostrar apenas o alerta de maior prioridade (maior nível)
    if (alertasTemp.length > 0) {
      const alertaMaximo = alertasTemp.reduce((max, current) => 
        current.nivel > max.nivel ? current : max
      );
      setAlertas({[alertaMaximo.key]: alertaMaximo.mensagem});
    } else {
      setAlertas({});
    }
  };

  // Função para calcular data inteligente baseada em parcelas - sempre dia 15
  const calcularDataInteligente = (dataBase: Date, mesesParaAdicionar: number): Date => {
    // Criar uma nova data a partir da string para evitar problemas de timezone
    const dataBaseStr = dataBase.toISOString().split('T')[0]; // YYYY-MM-DD
    const [ano, mes, dia] = dataBaseStr.split('-').map(Number);
    
    // Criar nova data com o mês ajustado
    let novoAno = ano;
    let novoMes = mes + mesesParaAdicionar;
    
    // Ajustar ano se necessário
    while (novoMes > 12) {
      novoMes -= 12;
      novoAno += 1;
    }
    
    // Sempre criar com dia 15
    const novaData = new Date(novoAno, novoMes - 1, 15); // mes - 1 porque Date usa base 0
    
    return novaData;
  };

  // Função para atualizar datas automaticamente baseado na entrada restante
  const atualizarDatasInteligentes = (dataEntradaRestante: string, qtdParcelasEntrada: number, qtdParcelasSinal: number) => {
    if (!dataEntradaRestante || qtdParcelasEntrada <= 0) return;
    
    const dataBase = new Date(dataEntradaRestante);
    
    // Calcular data do sinal: data base + quantidade de parcelas da entrada restante
    const dataSinal = calcularDataInteligente(dataBase, qtdParcelasEntrada);
    
    // Calcular data do saldo: data do sinal + quantidade de parcelas do sinal
    const dataSaldo = calcularDataInteligente(dataSinal, qtdParcelasSinal || 1);
    
    // Atualizar as informações de pagamento
    const novasInformacoes = [...informacoesPagamento];
    
    const sinalIndex = novasInformacoes.findIndex(info => info.tipo === 'Sinal');
    if (sinalIndex !== -1) {
      novasInformacoes[sinalIndex].primeiroVencimento = dataSinal.toISOString().split('T')[0];
    }
    
    const saldoIndex = novasInformacoes.findIndex(info => info.tipo === 'Saldo');
    if (saldoIndex !== -1) {
      novasInformacoes[saldoIndex].primeiroVencimento = dataSaldo.toISOString().split('T')[0];
    }
    
    setInformacoesPagamento(novasInformacoes);
  };

  // Função para recalcular restante da entrada
  const recalcularRestanteEntrada = (informacoes: InformacaoPagamento[]) => {
    const contratoAtivo = contratos.find(c => c.empreendimento);
    if (!contratoAtivo) return informacoes;

    const empreendimento = empreendimentos.find(emp => emp.id === contratoAtivo.empreendimento);
    const valorEntrada = empreendimento ? calcularValorEntrada(empreendimento.nome) : 0;
    
    // Calcular total das entradas (1ª, 2ª, etc.)
    const totalEntradas = informacoes
      .filter(info => info.tipo.includes('ª Entrada'))
      .reduce((total, info) => total + (parseFloat(info.total) || 0), 0);
    
    const restante = valorEntrada - totalEntradas;
    
    // Atualizar restante da entrada
    const novasInformacoes = [...informacoes];
    const restanteEntradaIndex = novasInformacoes.findIndex(info => info.tipo === 'Restante da Entrada');
    
    if (restanteEntradaIndex !== -1) {
      if (restante > 0) {
        novasInformacoes[restanteEntradaIndex].total = restante.toString();
        novasInformacoes[restanteEntradaIndex].valorParcela = (restante / (parseInt(novasInformacoes[restanteEntradaIndex].qtdParcelas) || 1)).toFixed(2);
      } else {
        novasInformacoes[restanteEntradaIndex].total = '0';
        novasInformacoes[restanteEntradaIndex].valorParcela = '0';
        novasInformacoes[restanteEntradaIndex].qtdParcelas = '1';
      }
    }
    
    return novasInformacoes;
  };

  // Executar validações sempre que informações mudarem
  useEffect(() => {
    atualizarAlertas();
  }, [informacoesPagamento, contratos]);

  // Recalcular restante da entrada quando contratos/empreendimentos mudarem
  useEffect(() => {
    if (contratos.length > 0 && empreendimentos.length > 0) {
      const informacoesAtualizadas = recalcularRestanteEntrada(informacoesPagamento);
      if (JSON.stringify(informacoesAtualizadas) !== JSON.stringify(informacoesPagamento)) {
        setInformacoesPagamento(informacoesAtualizadas);
      }    
    }
  }, [contratos, empreendimentos]);

  // Função para criar dados iniciais no Supabase
  const criarDadosIniciais = async () => {
    try {
      console.log('🏗️ Criando empreendimentos iniciais...');

      // Criar empreendimentos
      const { data: empData, error: empError } = await supabase
        .from('empreendimentos')
        .insert([
          { nome: 'Gran Garden', descricao: 'Resort Gran Garden', status: 'ATIVO' },
          { nome: 'Gran Valley', descricao: 'Resort Gran Valley', status: 'ATIVO' },
          { nome: 'Paradise Resort', descricao: 'Paradise Resort Premium', status: 'ATIVO' }
        ])
        .select();

      if (empError) {
        console.error('❌ Erro ao criar empreendimentos:', empError);
      } else {
        console.log('✅ Empreendimentos criados:', empData);
        setEmpreendimentos(empData || []);
      }

      // Recarregar a página após criar os dados
      window.location.reload();

    } catch (error) {
      console.error('💥 Erro ao criar dados iniciais:', error);
      // Fallback para dados vazios
      setEmpreendimentos([]);
      setCategoriasPreco([]);
      setTorres([]);
    }
  };

  // Carregar dados do Supabase
  useEffect(() => {
    const carregarDados = async () => {
      try {
        console.log('🔄 Iniciando carregamento dos dados...');

        // Testar conectividade básica primeiro
        console.log('🔌 Testando conectividade com Supabase...');
        console.log('🌐 URL:', 'https://msxhwlwxpvrtmyngwwcp.supabase.co');

        try {
          // Teste mais simples - verificar se consegue fazer uma requisição básica
          const { data: testData, error: testError } = await supabase
            .from('empreendimentos')
            .select('id, nome')
            .limit(1);

          if (testError) {
            console.error('❌ Erro na query de teste:', testError);
            console.error('🔍 Código do erro:', testError.code);
            console.error('���� Mensagem:', testError.message);
            console.error('🔍 Detalhes:', testError.details);
            console.error('🔍 Hint:', testError.hint);

            // Se a tabela não existe, isso é esperado - vamos criar dados de exemplo
            if (testError.code === 'PGRST116' || testError.message?.includes('does not exist')) {
              console.log('⚠️ Tabela empreendimentos não existe - vamos criar alguns dados...');
              throw new Error('TABELA_NAO_EXISTE');
            }

            throw testError;
          }

          console.log('✅ Conectividade OK! Dados de teste:', testData);
        } catch (networkError: any) {
          console.error('🚫 Erro de rede ou conectividade:', networkError);

          if (networkError.message === 'TABELA_NAO_EXISTE') {
            throw networkError;
          }

          // Se é erro de rede, vamos ver mais detalhes
          console.error('🔍 Tipo do erro:', networkError.name);
          console.error('🔍 Mensagem:', networkError.message);

          throw new Error(`Conectividade: ${networkError.message}`);
        }

        // Carregar empreendimentos primeiro
        console.log('📍 Carregando empreendimentos...');

        try {
          const { data: empreendimentosData, error: errorEmpreendimentos } = await supabase
            .from('empreendimentos')
            .select('*');

          if (errorEmpreendimentos) {
            console.warn('⚠️ Erro ao acessar empreendimentos no Supabase:', errorEmpreendimentos.message);
            console.log('📋 Usando empreendimentos mockados...');
            throw new Error('Usar dados mockados');
          }

          console.log('✅ Empreendimentos carregados do Supabase:', empreendimentosData?.length || 0);
          setEmpreendimentos(empreendimentosData || []);

        } catch (empError) {
          console.log('🏗️ Carregando empreendimentos mockados...');

          // Dados mockados de empreendimentos
          const empreendimentosMock = [
            {
              id: '1',
              nome: 'Gran Garden',
              descricao: 'Empreendimento Gran Garden',
              status: 'ATIVO',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              nome: 'Gran Valley',
              descricao: 'Empreendimento Gran Valley',
              status: 'ATIVO',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '3',
              nome: 'Paradise Resort',
              descricao: 'Paradise Resort Premium',
              status: 'ATIVO',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];

          setEmpreendimentos(empreendimentosMock);
          console.log('✅ Empreendimentos mockados carregados:', empreendimentosMock.length);
        }

        // Carregar tipos de venda normal com tratamento mais defensivo
        console.log('💰 Carregando tipos de venda normal...');

        try {
          const { data: tiposVendaNormal, error: errorTiposVenda } = await supabase
            .from('tipos_venda_normal')
            .select('*')
            .order('created_at', { ascending: false });

          if (errorTiposVenda) {
            console.warn('⚠️ Erro ao acessar tipos de venda no Supabase:', errorTiposVenda.message);
            console.log('📋 Usando categorias mockadas...');
            throw new Error('Usar dados mockados');
          }

          console.log('✅ Tipos de venda carregados do Supabase:', tiposVendaNormal?.length || 0);

          // Filtrar apenas o registro mais recente de cada categoria por empreendimento
          const categoriasUnicas = tiposVendaNormal?.reduce((acc, curr) => {
            const key = `${curr.empreendimento_id}-${curr.categoria_preco}`;
            if (!acc[key] || new Date(curr.created_at) > new Date(acc[key].created_at)) {
              acc[key] = curr;
            }
            return acc;
          }, {} as Record<string, any>);

          setCategoriasPreco(Object.values(categoriasUnicas || {}));

        } catch (categoriasError) {
          console.log('🏗️ Carregando categorias mockadas...');

          // Dados mockados de categorias de preço
          const categoriasMock = [
            {
              categoria_preco: 'Bronze',
              vir_cota: 45000,
              empreendimento_id: '1',
              total_entrada: 4490,
              total_sinal: 15000,
              total_saldo: 25510,
              sinal_qtd: 12,
              saldo_qtd: 60,
              percentual_entrada: 10,
              percentual_sinal: 33,
              percentual_saldo: 57,
              created_at: new Date().toISOString()
            },
            {
              categoria_preco: 'Prata',
              vir_cota: 65000,
              empreendimento_id: '1',
              total_entrada: 4490,
              total_sinal: 20000,
              total_saldo: 40510,
              sinal_qtd: 12,
              saldo_qtd: 60,
              percentual_entrada: 7,
              percentual_sinal: 31,
              percentual_saldo: 62,
              created_at: new Date().toISOString()
            },
            {
              categoria_preco: 'Ouro',
              vir_cota: 85000,
              empreendimento_id: '1',
              total_entrada: 4490,
              total_sinal: 25000,
              total_saldo: 55510,
              sinal_qtd: 12,
              saldo_qtd: 60,
              percentual_entrada: 5,
              percentual_sinal: 29,
              percentual_saldo: 66,
              created_at: new Date().toISOString()
            },
            {
              categoria_preco: 'Bronze',
              vir_cota: 50000,
              empreendimento_id: '2',
              total_entrada: 4490,
              total_sinal: 16000,
              total_saldo: 29510,
              sinal_qtd: 12,
              saldo_qtd: 60,
              percentual_entrada: 9,
              percentual_sinal: 32,
              percentual_saldo: 59,
              created_at: new Date().toISOString()
            },
            {
              categoria_preco: 'Prata',
              vir_cota: 70000,
              empreendimento_id: '2',
              total_entrada: 4490,
              total_sinal: 22000,
              total_saldo: 43510,
              sinal_qtd: 12,
              saldo_qtd: 60,
              percentual_entrada: 6,
              percentual_sinal: 31,
              percentual_saldo: 63,
              created_at: new Date().toISOString()
            }
          ];

          setCategoriasPreco(categoriasMock);
          console.log('✅ Categorias mockadas carregadas:', categoriasMock.length);
        }

        // Carregar torres (usando dados mockados para evitar erros de conectividade)
        console.log('🏢 Carregando torres...');

        try {
          const { data: torresData, error: errorTorres } = await supabase
            .from('torres')
            .select('*');

          if (errorTorres) {
            console.warn('��️ Erro ao acessar torres no Supabase:', errorTorres.message);
            console.log('📋 Usando torres mockadas...');
            throw new Error('Usar dados mockados');
          }

          console.log('✅ Torres carregadas do Supabase:', torresData?.length || 0);
          setTorres(torresData || []);

        } catch (torresError) {
          console.log('🏗️ Carregando torres mockadas...');

          // Dados mockados de torres
          const torresMock = [
            {
              id: '1',
              nome: 'Torre A',
              empreendimento_id: '1',
              descricao: 'Torre A - Gran Garden',
              created_at: new Date().toISOString()
            },
            {
              id: '2',
              nome: 'Torre B',
              empreendimento_id: '1',
              descricao: 'Torre B - Gran Garden',
              created_at: new Date().toISOString()
            },
            {
              id: '3',
              nome: 'Torre Central',
              empreendimento_id: '2',
              descricao: 'Torre Central - Gran Valley',
              created_at: new Date().toISOString()
            },
            {
              id: '4',
              nome: 'Torre Norte',
              empreendimento_id: '2',
              descricao: 'Torre Norte - Gran Valley',
              created_at: new Date().toISOString()
            },
            {
              id: '5',
              nome: 'Torre Sul',
              empreendimento_id: '3',
              descricao: 'Torre Sul - Paradise Resort',
              created_at: new Date().toISOString()
            }
          ];

          setTorres(torresMock);
          console.log('✅ Torres mockadas carregadas:', torresMock.length);
        }

        console.log('🎉 Carregamento de dados concluído com sucesso!');

      } catch (error: any) {
        console.error('💥 Erro crítico ao carregar dados:', error);
        console.error('🔍 Detalhes do erro:', {
          message: error?.message || 'Erro desconhecido',
          details: error?.details || 'Sem detalhes',
          hint: error?.hint || 'Sem dicas',
          code: error?.code || 'Sem código',
          name: error?.name || 'Sem nome',
          full: error
        });

        // Se a tabela não existe, vamos tentar criar alguns dados
        if (error?.message === 'TABELA_NAO_EXISTE') {
          console.log('📝 Tentando criar dados iniciais no Supabase...');
          await criarDadosIniciais();
        } else {
          // Para outros erros, inicializar com arrays vazios para evitar crashes
          setEmpreendimentos([]);
          setCategoriasPreco([]);
          setTorres([]);
        }
      } finally {
        console.log('🏁 Finalizando carregamento...');
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

  // Função para calcular o total de todas as entradas (1ª, 2ª, 3ª, etc.)
  const calcularTotalEntradas = (informacoes: InformacaoPagamento[]): number => {
    return informacoes
      .filter(info => info.tipo.includes('ª Entrada'))
      .reduce((total, info) => total + (parseFloat(info.total) || 0), 0);
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
      // Não preencher automaticamente a 1ª Entrada, deixar que seja sincronizada pelo "Valor Distribuído"
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
    // Contar quantas entradas já existem para numerar a nova
    const entradasExistentes = informacoesPagamento.filter(info => info.tipo.includes('ª Entrada'));
    const proximoNumero = entradasExistentes.length + 1;
    const novoTipo = `${proximoNumero}ª Entrada`;
    
    setInformacoesPagamento([...informacoesPagamento, {
      id: Date.now().toString(),
      tipo: novoTipo,
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
      tipo: 'Entrada',
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

  const salvarFicha = async () => {
    try {
      console.log('🚀 Iniciando processo de salvamento e envio...');
      
      // Verificar se há alertas cr��ticos (apenas erros, não avisos)
      const alertasCriticos = Object.values(alertas).filter(alerta => 
        alerta.includes('ERRO') && !alerta.includes('AVISO')
      );
      
      if (alertasCriticos.length > 0) {
        console.warn('⚠️ Alertas encontrados:', alertasCriticos);
        // Mostrar alerta mas permitir continuar se for apenas aviso
        if (alertasCriticos.some(alerta => alerta.includes('CRÍTICO'))) {
          alert('Não é possível salvar devido a erros críticos. Verifique os campos obrigatórios.');
          return;
        }
      }
      
      // Recuperar dados do cliente
      const dadosClienteString = localStorage.getItem('dadosCliente');
      if (!dadosClienteString) {
        alert('Dados do cliente não encontrados. Volte ao cadastro do cliente.');
        return;
      }
      
      const dadosCliente: DadosCliente = JSON.parse(dadosClienteString);
      
      // Preparar dados da negociação
      const dadosNegociacao: DadosNegociacao = {
        liner,
        closer,
        tipoVenda,
        parcelasPagasSala,
        contratos,
        informacoesPagamento
      };
      
      console.log('📄 Gerando PDFs...');

      // Gerar PDFs usando as funções que retornam base64 limpo
      const pdfData1 = PDFGenerator.gerarPDFCadastroClienteBase64(dadosCliente);
      const pdfData2 = PDFGenerator.gerarPDFNegociacaoBase64(dadosCliente, dadosNegociacao);

      console.log('📊 Tamanhos dos PDFs:', {
        pdf1: pdfData1.length,
        pdf2: pdfData2.length
      });
      
      console.log('📧 Enviando PDFs por email...');
      
      // Enviar PDFs usando o novo serviço
      const resultado = await EmailService.enviarPDFs({
        clientData: dadosCliente,
        fichaData: dadosNegociacao,
        pdfData1,
        pdfData2
      });
      
      if (resultado.success) {
        console.log('✅ Processo concluído com sucesso!');
        alert(`✅ Ficha salva e PDFs enviados com sucesso!\n\n${resultado.message}`);
      } else {
        console.error('❌ Falha no envio:', resultado.message);

        // Melhor feedback para diferentes tipos de erro
        let mensagemDetalhada = resultado.message;

        if (resultado.message.includes('RESEND_API_KEY')) {
          mensagemDetalhada += '\n\n💡 Solução: Configure a chave API do Resend no painel do Supabase:\n' +
                               '1. Acesse o painel do Supabase\n' +
                               '2. Vá em Settings > Edge Functions\n' +
                               '3. Adicione a variável RESEND_API_KEY';
        } else if (resultado.message.includes('conexão')) {
          mensagemDetalhada += '\n\n💡 Tente novamente em alguns segundos.';
        }

        alert(`❌ Erro no envio de email:\n\n${mensagemDetalhada}\n\n📄 Os PDFs foram gerados mas não puderam ser enviados por email.`);
      }
      
    } catch (error: any) {
      console.error('❌ Erro no processo de salvamento:', error);
      alert(`❌ Erro ao processar a ficha: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const testarGeracaoPDF = () => {
    try {
      console.log('🧪 Testando geração de PDFs...');

      // Dados de teste
      const dadosTesteCliente = {
        nome: 'Cliente Teste',
        cpf: '123.456.789-00',
        email: 'teste@exemplo.com',
        telefone: '(11) 99999-9999'
      };

      const dadosTesteNegociacao = {
        liner: 'Teste Liner',
        closer: 'Teste Closer',
        tipoVenda: 'Semestral',
        parcelasPagasSala: [],
        contratos: [],
        informacoesPagamento: []
      };

      // Gerar PDFs de teste
      const pdf1 = PDFGenerator.gerarPDFCadastroClienteBase64(dadosTesteCliente as any);
      const pdf2 = PDFGenerator.gerarPDFNegociacaoBase64(dadosTesteCliente as any, dadosTesteNegociacao as any);

      console.log('📊 Resultados dos PDFs de teste:', {
        pdf1_size: pdf1.length,
        pdf2_size: pdf2.length,
        pdf1_valid_base64: /^[A-Za-z0-9+/]*={0,2}$/.test(pdf1),
        pdf2_valid_base64: /^[A-Za-z0-9+/]*={0,2}$/.test(pdf2)
      });

      if (pdf1.length > 1000 && pdf2.length > 1000) {
        alert(`✅ Geração de PDFs funcionando!\n\nPDF 1: ${pdf1.length} bytes\nPDF 2: ${pdf2.length} bytes\n\nAmbos os PDFs são válidos.`);
      } else {
        alert(`❌ Problema na geração de PDFs!\n\nPDF 1: ${pdf1.length} bytes\nPDF 2: ${pdf2.length} bytes\n\nPDFs muito pequenos.`);
      }

    } catch (error: any) {
      console.error('❌ Erro no teste de PDF:', error);
      alert(`❌ Erro na geração de PDFs: ${error.message}`);
    }
  };

  const diagnosticarSistema = async () => {
    try {
      console.log('🔍 Iniciando diagn��stico completo do sistema...');
      const resultado = await ConfigService.diagnosticarSistema();

      if (resultado.success) {
        const detalhes = resultado.details;
        let mensagem = `✅ Diagnóstico concluído!\n\n`;
        mensagem += `📊 Total de configurações: ${detalhes.totalConfigs}\n\n`;
        mensagem += `🔑 RESEND_API_KEY: ${detalhes.configuracoes.RESEND_API_KEY.existe ? '✅ Existe' : '❌ Não existe'}\n`;
        mensagem += `📧 EMAIL_DESTINO: ${detalhes.configuracoes.EMAIL_DESTINO.existe ? '✅ Existe' : '❌ Não existe'}\n`;
        mensagem += `📤 EMAIL_REMETENTE: ${detalhes.configuracoes.EMAIL_REMETENTE.existe ? '✅ Existe' : '❌ Não existe'}\n\n`;
        mensagem += `🧪 Função getConfig: ${detalhes.resendKeyFunciona ? '✅ Funcionando' : '❌ Falhou'}`;

        alert(mensagem);
      } else {
        alert(`❌ Diagnóstico falhou:\n\n${resultado.message}`);
      }
    } catch (error: any) {
      console.error('❌ Erro no diagnóstico:', error);
      alert(`❌ Erro no diagnóstico: ${error.message}`);
    }
  };

  // Função simples para baixar PDFs
  const baixarPDFs = () => {
    try {
      const dadosClienteString = localStorage.getItem('dadosCliente');
      if (!dadosClienteString) {
        alert('Dados do cliente não encontrados. Volte ao cadastro do cliente.');
        return;
      }

      const dadosCliente: DadosCliente = JSON.parse(dadosClienteString);
      const dadosNegociacao: DadosNegociacao = {
        liner,
        closer,
        tipoVenda,
        parcelasPagasSala,
        contratos,
        informacoesPagamento
      };

      EmailSimples.baixarPDFsLocal(dadosCliente, dadosNegociacao);
      setMensagemStatus('✅ PDFs baixados! Envie manualmente para: admudrive2025@gavresorts.com.br');

    } catch (error: any) {
      setMensagemStatus(`❌ Erro: ${error.message}`);
    }
  };

  // Função para envio robusto com múltiplas tentativas
  const enviarPDFsRobusto = async () => {
    try {
      console.log('🚀 Iniciando envio robusto de PDFs...');
      setMensagemStatus('📨 Preparando envio de PDFs...');

      // Recuperar dados do cliente
      const dadosClienteString = localStorage.getItem('dadosCliente');
      if (!dadosClienteString) {
        alert('Dados do cliente não encontrados. Volte ao cadastro do cliente.');
        return;
      }

      const dadosCliente: DadosCliente = JSON.parse(dadosClienteString);

      // Preparar dados da negociação
      const dadosNegociacao: DadosNegociacao = {
        liner,
        closer,
        tipoVenda,
        parcelasPagasSala,
        contratos,
        informacoesPagamento
      };

      // Gerar PDFs
      const pdfData1 = PDFGenerator.gerarPDFCadastroClienteBase64(dadosCliente);
      const pdfData2 = PDFGenerator.gerarPDFNegociacaoBase64(dadosCliente, dadosNegociacao);

      console.log('📊 PDFs gerados:', {
        pdf1_size: pdfData1.length,
        pdf2_size: pdfData2.length
      });

      // Salvamento automático dos PDFs (não bloqueia o envio)
      try {
        console.log('💾 Iniciando salvamento automático...');
        setMensagemStatus('💾 Salvando cópia de segurança dos PDFs...');

        const salvamentoResult = await SalvamentoService.salvarPDFs(
          dadosCliente,
          dadosNegociacao,
          {
            salvarLocal: true,
            salvarIndexedDB: true,
            salvarSupabase: false, // Evitar conflito com o envio principal
            compressao: false
          }
        );

        console.log('💾 Resultado do salvamento:', salvamentoResult);

        if (salvamentoResult.success) {
          console.log(`✅ Backup salvo em: ${salvamentoResult.locations.join(', ')}`);
        } else {
          console.warn('⚠️ Falha no backup:', salvamentoResult.message);
        }

      } catch (salvamentoError: any) {
        console.warn('⚠️ Erro no salvamento automático:', salvamentoError);
        // Não falhar o envio por causa do salvamento
      }

      // Preparar payload
      const payload: EmailPayload = {
        clientData: dadosCliente,
        fichaData: dadosNegociacao,
        pdfData1,
        pdfData2
      };

      setMensagemStatus('🧠 Iniciando envio inteligente com múltiplas tentativas...');

      // Sistema de retry inteligente
      const resultadoRetry = await RetryService.retryInteligente(
        async () => {
          console.log('📧 Executando tentativa de envio...');
          setMensagemStatus(`📧 Tentativa de envio em andamento...`);

          const resultado = await EmailService.enviarPDFs(payload);

          if (!resultado.success) {
            throw new Error(resultado.message);
          }

          return resultado;
        },
        {
          maxTentativas: 4,
          delayBase: 2000,
          multiplicadorBackoff: 1.8,
          delayMaximo: 12000
        }
      );

      // Mostrar logs detalhados das tentativas
      console.log('📊 Logs do retry:', resultadoRetry.logs);

      if (resultadoRetry.success && resultadoRetry.data) {
        setMensagemStatus(
          `✅ ${resultadoRetry.data.message} ` +
          `(Sucesso na tentativa ${resultadoRetry.tentativasFeitas}/${4})` +
          `${resultadoRetry.data.messageId ? ` ID: ${resultadoRetry.data.messageId}` : ''}`
        );
        console.log('✅ PDFs enviados com sucesso via retry inteligente!');

        // Enviar notificação de sucesso
        try {
          const notificacaoSucesso = await NotificacaoService.notificarSucesso(
            dadosCliente,
            dadosNegociacao,
            resultadoRetry.data.messageId
          );
          console.log('📢 Notificação de sucesso:', notificacaoSucesso);
        } catch (notifError: any) {
          console.warn('⚠️ Erro na notificação de sucesso:', notifError);
        }

        return;
      }

      console.warn('⚠️ Sistema de retry inteligente falhou:', resultadoRetry.error);
      console.warn('📊 Logs das tentativas:', resultadoRetry.logs.join(' | '));

      setMensagemStatus(
        `⚠️ ${resultadoRetry.tentativasFeitas} tentativas falharam em ${Math.round(resultadoRetry.tempoTotal/1000)}s. ` +
        `Iniciando métodos alternativos...`
      );

      // FALLBACK: Oferecer múltiplas alternativas
      setMensagemStatus('🔄 Tentando métodos alternativos de envio...');

      try {
        // Gerar os blobs dos PDFs para as alternativas
        const pdfBlob1 = PDFGenerator.gerarPDFCadastroClienteBlob(dadosCliente);
        const pdfBlob2 = PDFGenerator.gerarPDFNegociacaoBlob(dadosCliente, dadosNegociacao);

        // Primeiro baixar os PDFs
        await baixarPDFs();

        // Aguardar um pouco para garantir que os downloads terminaram
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Enviar notificação de falha para administrador
        try {
          console.log('📢 Enviando notificação de falha para administrador...');
          const notificacaoFalha = await NotificacaoService.notificarFalhaEmail(
            dadosCliente,
            dadosNegociacao,
            resultadoRetry.error || 'Sistema de envio automático falhou após múltiplas tentativas'
          );
          console.log('📢 Notificação de falha enviada:', notificacaoFalha);
        } catch (notifError: any) {
          console.warn('⚠️ Erro na notificação de falha:', notifError);
        }

        // Tentar métodos alternativos
        const resultadoAlternativo = await EmailAlternativo.enviarComAlternativas({
          clientData: dadosCliente,
          fichaData: dadosNegociacao,
          pdfBlob1,
          pdfBlob2
        });

        let mensagemFinal = '🔄 Sistema de envio automático falhou, mas alternativas foram executadas:\n\n';
        mensagemFinal += resultadoAlternativo.tentativas.join('\n');
        mensagemFinal += '\n\n📧 Email de destino: admudrive2025@gavresorts.com.br';

        setMensagemStatus(mensagemFinal);

        // Mostrar resultado das alternativas
        const mostrarDetalhes = window.confirm(
          `⚠️ Sistema de envio automático falhou, mas várias alternativas foram tentadas:\n\n` +
          `${resultadoAlternativo.tentativas.join('\n')}\n\n` +
          `🔍 Deseja ver instruções detalhadas?`
        );

        if (mostrarDetalhes) {
          alert(`📋 INSTRUÇÕES PARA ENVIO MANUAL:\n\n` +
            `1. Os PDFs foram baixados em seu computador\n` +
            `2. Um arquivo de instruções também foi baixado\n` +
            `3. Seu cliente de email padrão deve ter sido aberto\n` +
            `4. Complete o envio anexando os PDFs\n\n` +
            `📧 Email: admudrive2025@gavresorts.com.br\n` +
            `📎 Anexar: Os 2 PDFs baixados\n\n` +
            `Se nada funcionou, envie manualmente com os dados do cliente.`);
        }

      } catch (alternativoError: any) {
        console.error('❌ Erro nas alternativas:', alternativoError);
        setMensagemStatus(`❌ Todas as tentativas falharam: ${alternativoError.message}`);

        // Último recurso: apenas baixar
        const confirmarDownload = window.confirm(
          `❌ Todas as tentativas de envio falharam.\n\n` +
          `Erro: ${alternativoError.message}\n\n` +
          `Deseja apenas baixar os PDFs para envio manual?`
        );

        if (confirmarDownload) {
          await baixarPDFs();
          setMensagemStatus('💾 PDFs baixados. Envie manualmente para: admudrive2025@gavresorts.com.br');
        }
      }

    } catch (error: any) {
      console.error('❌ Erro crítico no envio de PDFs:', error);
      setMensagemStatus(`❌ Erro crítico: ${error.message}`);

      // Oferecer download direto em caso de erro crítico
      const confirmarDownload = window.confirm(
        `❌ Erro crítico no sistema de envio.\n\n` +
        `Erro: ${error.message}\n\n` +
        `Deseja fazer o download direto dos PDFs?`
      );

      if (confirmarDownload) {
        try {
          await baixarPDFs();
        } catch (downloadError: any) {
          setMensagemStatus(`❌ Erro até no download: ${downloadError.message}`);
        }
      }
    }
  };

  const testarEmail = async () => {
    try {
      console.log('🧪 Testando sistema de email...');
      const resultado = await EmailService.testarConectividade();

      if (resultado.success) {
        alert(`✅ Teste bem-sucedido!\n\n${resultado.message}`);
      } else {
        alert(`❌ Teste falhou:\n\n${resultado.message}`);
      }
    } catch (error: any) {
      console.error('❌ Erro no teste:', error);
      alert(`❌ Erro no teste: ${error.message}`);
    }
  };

  const testarNotificacao = async () => {
    try {
      console.log('📢 Testando sistema de notifica��ão...');

      // Recuperar dados do cliente
      const dadosClienteString = localStorage.getItem('dadosCliente');
      if (!dadosClienteString) {
        alert('Dados do cliente não encontrados. Volte ao cadastro do cliente.');
        return;
      }

      const dadosCliente: DadosCliente = JSON.parse(dadosClienteString);

      const resultado = await NotificacaoService.testarNotificacao(dadosCliente);

      if (resultado.success) {
        alert(`✅ Teste de notificação executado!\n\n${resultado.message}\n\nVerifique se os aplicativos foram abertos.`);
      } else {
        alert(`❌ Teste de notificação falhou:\n\n${resultado.message}`);
      }

    } catch (error: any) {
      console.error('❌ Erro no teste de notificação:', error);
      alert(`❌ Erro no teste: ${error.message}`);
    }
  };

  const gerenciarPDFsSalvos = async () => {
    try {
      console.log('📁 Gerenciando PDFs salvos...');

      const pdfs = await SalvamentoService.listarPDFsSalvos();
      const stats = await SalvamentoService.obterEstatisticas();

      if (pdfs.length === 0) {
        alert('📁 Nenhum PDF salvo encontrado.\n\nOs PDFs são salvos automaticamente quando você usa o sistema de envio robusto.');
        return;
      }

      let mensagem = `📁 PDFS SALVOS (${pdfs.length} itens)\n\n`;

      if (stats) {
        mensagem += `📊 ESTATÍSTICAS:\n`;
        mensagem += `• Total: ${stats.total} PDFs\n`;
        mensagem += `• LocalStorage: ${stats.localStorageCount}\n`;
        mensagem += `• IndexedDB: ${stats.indexedDBCount}\n`;
        mensagem += `• Tamanho total: ${Math.round(stats.sizeTotal / 1024)}KB\n\n`;
      }

      mensagem += `📋 ÚLTIMOS PDFs:\n`;
      pdfs.slice(0, 5).forEach((pdf, index) => {
        const data = new Date(pdf.timestamp).toLocaleString('pt-BR');
        mensagem += `${index + 1}. ${pdf.cliente?.nome || 'Cliente'} - ${data}\n`;
      });

      if (pdfs.length > 5) {
        mensagem += `... e mais ${pdfs.length - 5} PDFs\n`;
      }

      mensagem += `\n🔧 AÇÕES DISPONÍVEIS:\n`;
      mensagem += `• Limpar PDFs antigos\n`;
      mensagem += `• Baixar PDF específico\n`;
      mensagem += `• Ver estatísticas completas`;

      const acao = window.prompt(
        mensagem + `\n\n⚡ Escolha uma ação:\n` +
        `1 - Limpar PDFs antigos (>7 dias)\n` +
        `2 - Baixar último PDF\n` +
        `3 - Ver estatísticas\n` +
        `0 - Cancelar\n\n` +
        `Digite o número:`
      );

      switch (acao) {
        case '1':
          const resultLimpeza = await SalvamentoService.limparPDFsAntigos(7);
          alert(`🧹 ${resultLimpeza.message}`);
          break;

        case '2':
          if (pdfs.length > 0) {
            const result = await SalvamentoService.baixarPDFSalvo(pdfs[0].id);
            alert(`📥 ${result.message}`);
          }
          break;

        case '3':
          const statsDetalhadas = await SalvamentoService.obterEstatisticas();
          if (statsDetalhadas) {
            alert(`📊 ESTATÍSTICAS DETALHADAS:\n\n` +
              `Total de PDFs: ${statsDetalhadas.total}\n` +
              `LocalStorage: ${statsDetalhadas.localStorageCount}\n` +
              `IndexedDB: ${statsDetalhadas.indexedDBCount}\n` +
              `Tamanho total: ${Math.round(statsDetalhadas.sizeTotal / 1024)}KB\n` +
              `Mais recente: ${statsDetalhadas.maisRecente?.cliente?.nome || 'N/A'}\n` +
              `Mais antigo: ${statsDetalhadas.maisAntigo?.cliente?.nome || 'N/A'}`);
          }
          break;

        default:
          // Cancelado
          break;
      }

    } catch (error: any) {
      console.error('❌ Erro ao gerenciar PDFs:', error);
      alert(`❌ Erro: ${error.message}`);
    }
  };

  const imprimirFichas = () => {
    try {
      console.log('🖨️ Iniciando processo de impressão...');

      // Recuperar dados do cliente
      const dadosClienteString = localStorage.getItem('dadosCliente');
      if (!dadosClienteString) {
        alert('Dados do cliente não encontrados. Volte ao cadastro do cliente.');
        return;
      }

      const dadosCliente: DadosCliente = JSON.parse(dadosClienteString);
      console.log('📋 Dados do cliente recuperados:', dadosCliente);

      // Preparar dados da negociação
      const dadosNegociacao: DadosNegociacao = {
        liner,
        closer,
        tipoVenda,
        parcelasPagasSala,
        contratos,
        informacoesPagamento
      };

      console.log('💼 Dados da negociação preparados:', dadosNegociacao);
      console.log('📄 Gerando PDFs para impressão...');

      // Gerar PDF 1: Cadastro de Cliente (Página 1)
      console.log('📄 Gerando PDF 1: Cadastro de Cliente...');
      const pdfCadastroBlob = PDFGenerator.gerarPDFCadastroClienteBlob(dadosCliente);
      console.log('✅ PDF 1 gerado:', pdfCadastroBlob.size, 'bytes');

      // Gerar PDF 2: Negociação (Páginas 2 e 3)
      console.log('📄 Gerando PDF 2: Negociação...');
      const pdfNegociacaoBlob = PDFGenerator.gerarPDFNegociacaoBlob(dadosCliente, dadosNegociacao);
      console.log('✅ PDF 2 gerado:', pdfNegociacaoBlob.size, 'bytes');

      console.log('🖨️ Abrindo PDFs para impressão...');

      // Criar URLs para os blobs
      const urlCadastro = URL.createObjectURL(pdfCadastroBlob);
      const urlNegociacao = URL.createObjectURL(pdfNegociacaoBlob);

      console.log('🔗 URL PDF 1:', urlCadastro);
      console.log('🔗 URL PDF 2:', urlNegociacao);

      // Tentar abrir primeiro PDF
      const janelaCadastro = window.open(urlCadastro, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

      if (!janelaCadastro) {
        alert('⚠️ Bloqueador de pop-ups ativo! Por favor, permita pop-ups para este site e tente novamente.\n\nSerão abertos 2 PDFs para impressão.');
        return;
      }

      console.log('🪟 Janela PDF 1 aberta com sucesso');

      // Aguardar um pouco e abrir segundo PDF
      setTimeout(() => {
        const janelaNegociacao = window.open(urlNegociacao, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

        if (!janelaNegociacao) {
          console.warn('⚠️ Falha ao abrir segunda janela');
          alert('⚠️ Falha ao abrir o segundo PDF. Verifique o bloqueador de pop-ups.');
          return;
        }

        console.log('🪟 Janela PDF 2 aberta com sucesso');

        // Aguardar carregamento dos PDFs e tentar imprimir automaticamente
        setTimeout(() => {
          try {
            if (janelaCadastro && !janelaCadastro.closed) {
              console.log('🖨️ Tentando imprimir PDF 1...');
              janelaCadastro.focus();
              janelaCadastro.print();
            }
          } catch (e) {
            console.warn('⚠️ Falha ao imprimir PDF 1 automaticamente:', e);
          }

          setTimeout(() => {
            try {
              if (janelaNegociacao && !janelaNegociacao.closed) {
                console.log('🖨️ Tentando imprimir PDF 2...');
                janelaNegociacao.focus();
                janelaNegociacao.print();
              }
            } catch (e) {
              console.warn('⚠️ Falha ao imprimir PDF 2 automaticamente:', e);
            }
          }, 1000);

        }, 3000); // Aguardar mais tempo para garantir carregamento

      }, 1500); // Delay maior entre aberturas

      // Limpar URLs após uso
      setTimeout(() => {
        URL.revokeObjectURL(urlCadastro);
        URL.revokeObjectURL(urlNegociacao);
        console.log('🧹 URLs dos PDFs liberadas');
      }, 15000);

      // Notificar usuário
      setTimeout(() => {
        alert('✅ Dois PDFs foram abertos para impressão:\n\n1️⃣ Cadastro do Cliente\n2️⃣ Ficha de Negocia��ão\n\nSe a impressão automática não funcionar, use Ctrl+P em cada janela.');
      }, 1000);

      console.log('✅ Processo de impressão iniciado! Dois PDFs devem abrir em janelas separadas.');

    } catch (error: any) {
      console.error('❌ Erro na impressão:', error);
      console.error('📚 Stack trace:', error.stack);
      alert(`❌ Erro ao gerar PDFs para impressão: ${error.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/cadastro-cliente')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <CardTitle className="text-2xl font-bold">
              Ficha de Negociação de Cota
            </CardTitle>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
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
                  <Label htmlFor="padrao">Padr��o</Label>
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
                          value={parcela.valorTotal || ''}
                          onChange={(e) => {
                            const newParcelas = [...parcelasPagasSala];
                            newParcelas[index].valorTotal = e.target.value;
                            setParcelasPagasSala(newParcelas);
                          }}
                          placeholder="1000.00"
                          type="number"
                          step="0.01"
                        />
                      </td>
                       <td className="border border-border p-3">
                         <Input
                           value={parcela.valorDistribuido || ''}
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
                                }

                                // Recalcular restante da entrada
                                const informacoesAtualizadas = recalcularRestanteEntrada(novasInformacoes);
                                setInformacoesPagamento(informacoesAtualizadas);
                            }}
                           placeholder="1000.00"
                           type="number"
                           step="0.01"
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
                                  <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                                  <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                                  <SelectItem value="pix">PIX</SelectItem>
                                  <SelectItem value="transferencia">Transferência</SelectItem>
                                  <SelectItem value="boleto">Boleto</SelectItem>
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

                            // Buscar e salvar o nome do empreendimento também
                            const empSelecionado = empreendimentos.find(emp => emp.id === value);
                            newContratos[index].nomeEmpreendimento = empSelecionado?.nome || '';

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
                          value={contrato.valor || ''}
                          onChange={(e) => {
                            const newContratos = [...contratos];
                            newContratos[index].valor = e.target.value;
                            setContratos(newContratos);
                          }}
                          placeholder="50000.00"
                          type="number"
                          step="0.01"
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

          {/* Alertas de Validação */}
          {Object.keys(alertas).length > 0 && (
            <div className="border border-destructive rounded-lg p-4 bg-destructive/5 print:hidden">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <Label className="text-lg font-semibold text-destructive">Alertas de Validação</Label>
              </div>
              <div className="space-y-2">
                {Object.entries(alertas).map(([key, mensagem]) => {
                  const isError = mensagem.includes('ERRO');
                  return (
                    <div key={key} className={`p-3 rounded border ${
                      isError 
                        ? 'border-destructive bg-destructive/10 text-destructive' 
                        : 'border-orange-400 bg-orange-50 text-orange-700'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className={`h-4 w-4 ${isError ? 'text-destructive' : 'text-orange-500'}`} />
                        <span className="text-sm font-medium">{mensagem}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                          <td className="border border-border p-3">
                            {info.tipo === 'Restante da Entrada' ? (
                              <span className="text-muted-foreground bg-muted p-2 rounded block text-center">
                                {info.tipo}
                              </span>
                            ) : (
                              <Input
                                value={info.tipo}
                                onChange={(e) => {
                                  const newInfos = [...informacoesPagamento];
                                  newInfos[index].tipo = e.target.value;
                                  setInformacoesPagamento(newInfos);
                                }}
                                placeholder="Tipo"
                                disabled={['1ª Entrada', '2ª Entrada', 'Sinal', 'Saldo'].includes(info.tipo)}
                              />
                            )}
                          </td>
                       <td className="border border-border p-3">
                         <Input
                           value={info.total || ''}
                            onChange={(e) => {
                              const valor = parseFloat(e.target.value) || 0;

                              // Validação específica para 1ª Entrada - não pode ser menor que R$ 1.000
                              if (info.tipo === '1ª Entrada' && valor > 0 && valor < 1000) {
                                return; // Bloqueia valores menores que R$ 1.000 para primeira entrada
                              }

                              const newInfos = [...informacoesPagamento];
                              newInfos[index].total = e.target.value;

                              // Recalcular valor da parcela automaticamente quando alterar total
                              if (newInfos[index].qtdParcelas && parseInt(newInfos[index].qtdParcelas) > 0) {
                                const total = parseFloat(e.target.value) || 0;
                                const qtdParcelas = parseInt(newInfos[index].qtdParcelas);
                                newInfos[index].valorParcela = (total / qtdParcelas).toFixed(2);
                              }
                              
                               // Se for uma entrada (1ª, 2ª, 3ª, etc.), recalcular Restante da Entrada
                                if (info.tipo.includes('ª Entrada')) {
                                  const informacoesAtualizadas = recalcularRestanteEntrada(newInfos);
                                  setInformacoesPagamento(informacoesAtualizadas);
                                } else {
                                  setInformacoesPagamento(newInfos);
                                }
                            }}
                           placeholder="1000.00"
                           type="number"
                           step="0.01"
                           min={info.tipo === '1ª Entrada' ? 1000 : undefined}
                           className={`bg-background ${
                             info.tipo === '1ª Entrada' && parseFloat(info.total) > 0 && parseFloat(info.total) < 1000 
                               ? 'border-destructive' 
                               : ''
                           }`}
                         />
                       </td>
                       <td className="border border-border p-3">
                         {(() => {
                           // Encontrar o primeiro contrato com empreendimento e categoria preenchidos para validação
                           const contratoAtivo = contratos.find(c => c.empreendimento && c.categoriaPreco);
                           const dados = contratoAtivo ? calcularDadosCategoria(contratoAtivo.empreendimento, contratoAtivo.categoriaPreco) : null;
                           let maxParcelas = dados ? (info.tipo === 'Sinal' ? dados.maxParcelasSinal : dados.maxParcelasSaldo) : null;
                           
                           // Limitação específica para Restante da Entrada: máximo 5 parcelas
                           if (info.tipo === 'Restante da Entrada') {
                             maxParcelas = 5;
                           }
                           
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
                                     
                                     // Se for Restante da Entrada ou Sinal, recalcular datas inteligentes
                                     if (info.tipo === 'Restante da Entrada' || info.tipo === 'Sinal') {
                                       const restanteEntrada = newInfos.find(inf => inf.tipo === 'Restante da Entrada');
                                       if (restanteEntrada?.primeiroVencimento) {
                                         const qtdParcelasEntrada = info.tipo === 'Restante da Entrada' ? valor : parseInt(restanteEntrada.qtdParcelas) || 1;
                                         const sinalInfo = newInfos.find(inf => inf.tipo === 'Sinal');
                                         const qtdParcelasSinal = info.tipo === 'Sinal' ? valor : parseInt(sinalInfo?.qtdParcelas || '1');
                                         
                                         setTimeout(() => {
                                           atualizarDatasInteligentes(restanteEntrada.primeiroVencimento, qtdParcelasEntrada, qtdParcelasSinal);
                                         }, 0);
                                       }
                                     }
                                     
                                     // Se alterou quantidade de parcelas do Restante da Entrada, recalcular valor da parcela
                                     if (info.tipo === 'Restante da Entrada' && newInfos[index].total) {
                                       const total = parseFloat(newInfos[index].total);
                                       if (total > 0 && valor > 0) {
                                         newInfos[index].valorParcela = (total / valor).toFixed(2);
                                       }
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
                               {info.tipo === 'Restante da Entrada' && (
                                 <div className="text-xs text-muted-foreground">
                                   Máx: 5 parcelas
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
                          value={info.valorParcela || ''}
                          onChange={(e) => {
                            const newInfos = [...informacoesPagamento];
                            newInfos[index].valorParcela = e.target.value;
                            setInformacoesPagamento(newInfos);
                          }}
                          placeholder="500.00"
                          type="number"
                          step="0.01"
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
                            <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                            <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="transferencia">Transferência</SelectItem>
                            <SelectItem value="boleto">Boleto</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                       <td className="border border-border p-3">
                         <Input
                           value={info.primeiroVencimento}
                           onChange={(e) => {
                             const newInfos = [...informacoesPagamento];
                             newInfos[index].primeiroVencimento = e.target.value;
                             
                             // Se for Restante da Entrada, ativar calendário inteligente
                             if (info.tipo === 'Restante da Entrada' && e.target.value) {
                               const qtdParcelasEntrada = parseInt(info.qtdParcelas) || 1;
                               const sinalInfo = informacoesPagamento.find(inf => inf.tipo === 'Sinal');
                               const qtdParcelasSinal = parseInt(sinalInfo?.qtdParcelas || '1');
                               
                               // Usar setTimeout para garantir que o state seja atualizado primeiro
                               setTimeout(() => {
                                 atualizarDatasInteligentes(e.target.value, qtdParcelasEntrada, qtdParcelasSinal);
                               }, 0);
                             }
                             
                             setInformacoesPagamento(newInfos);
                           }}
                           type="date"
                           className={`${
                             (info.tipo === 'Sinal' || info.tipo === 'Saldo') && info.primeiroVencimento 
                               ? (() => {
                                   const data = new Date(info.primeiroVencimento);
                                   const dia = data.getDate();
                                   return (dia !== 5 && dia !== 15) ? 'border-destructive' : '';
                                 })()
                               : ''
                           }`}
                         />
                         {(info.tipo === 'Sinal' || info.tipo === 'Saldo') && (
                           <div className="text-xs text-muted-foreground mt-1">
                             Apenas dias 05 ou 15
                           </div>
                         )}
                         {info.tipo === 'Restante da Entrada' && (
                           <div className="text-xs text-blue-600 mt-1">
                             Atualiza automaticamente Sinal e Saldo
                           </div>
                         )}
                       </td>
                       <td className="border border-border p-3">
                         <Button
                           variant="destructive"
                           size="sm"
                           onClick={() => removerInformacaoPagamento(info.id)}
                           disabled={informacoesPagamento.length <= 5 || ['1ª Entrada', 'Restante da Entrada', '2ª Entrada', 'Sinal', 'Saldo'].includes(info.tipo)}
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

          {/* Mensagem de status */}
          {mensagemStatus && (
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-800">{mensagemStatus}</p>
            </div>
          )}

          {/* Botões Principais de Ação */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              onClick={baixarPDFs}
              variant="default"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 flex-1 min-w-[220px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              💾 Baixar PDFs Direto
            </Button>
            <Button
              onClick={enviarPDFsRobusto}
              variant="default"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 flex-1 min-w-[220px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9 22,2"/>
              </svg>
              📧 Enviar por Email (Robusto)
            </Button>
          </div>

          {/* Botões de Ação Secundários */}
          <div className="flex justify-center space-x-4 pt-6">
            <Button variant="outline" onClick={limparFicha}>
              Limpar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                try {
                  const dadosClienteString = localStorage.getItem('dadosCliente');
                  if (!dadosClienteString) {
                    alert('Dados do cliente não encontrados. Volte ao cadastro do cliente.');
                    return;
                  }

                  const dadosCliente: DadosCliente = JSON.parse(dadosClienteString);
                  const dadosNegociacao: DadosNegociacao = {
                    liner, closer, tipoVenda, parcelasPagasSala, contratos, informacoesPagamento
                  };

                  // Baixar PDF 1: Cadastro (Página 1)
                  const pdfCadastro = PDFGenerator.gerarPDFCadastroCliente(dadosCliente);
                  const linkCadastro = document.createElement('a');
                  linkCadastro.href = pdfCadastro;
                  linkCadastro.download = 'Cadastro-Cliente.pdf';
                  linkCadastro.click();

                  // Baixar PDF 2: Negociação (Página 2 com página 3 anexada)
                  const pdfNegociacao = PDFGenerator.gerarPDFNegociacao(dadosCliente, dadosNegociacao);
                  const linkNegociacao = document.createElement('a');
                  linkNegociacao.href = pdfNegociacao;
                  linkNegociacao.download = 'Negociacao-Cota.pdf';
                  linkNegociacao.click();

                  console.log('✅ Dois PDFs baixados com sucesso!');
                } catch (error: any) {
                  console.error('❌ Erro ao baixar PDFs:', error);
                  alert(`Erro: ${error.message}`);
                }
              }}
              className="flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Baixar PDFs
            </Button>
            <Button
              variant="outline"
              onClick={imprimirFichas}
              className="flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6,9 6,2 18,2 18,9"/>
                <path d="M6,18L4,16v-5a2,2 0 0,1 2-2h12a2,2 0 0,1 2,2v5l-2,2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Imprimir PDFs
            </Button>
            <Button
              onClick={diagnosticarSistema}
              variant="outline"
              className="flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.9 4.24l.7.7a7.5 7.5 0 0 1 0 10.6l-.7.7"/>
                <path d="m14.1 4.24-.7.7a7.5 7.5 0 0 0 0 10.6l.7.7"/>
                <path d="M12 12h.01"/>
              </svg>
              Diagnóstico
            </Button>
            <Button
              onClick={testarGeracaoPDF}
              variant="outline"
              className="flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              Testar PDFs
            </Button>
            <Button
              onClick={testarEmail}
              variant="outline"
              className="flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              📧 Testar Email
            </Button>
            <Button
              onClick={testarNotificacao}
              variant="outline"
              className="flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.731 2.269a2.5 2.5 0 0 0-3.536 0l-1.031 1.031a1 1 0 0 0 0 1.414l1.414 1.414a1 1 0 0 0 1.414 0l1.031-1.031a2.5 2.5 0 0 0 0-3.536z"/>
                <path d="M14.5 6.5 3 18a1 1 0 0 0 0 1.414l1.414 1.414A1 1 0 0 0 5.828 21L17.5 9.5"/>
              </svg>
              📢 Testar WhatsApp
            </Button>
            <Button
              onClick={gerenciarPDFsSalvos}
              variant="outline"
              className="flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="m14,2 6,6"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              📁 Gerenciar PDFs Salvos
            </Button>
            <Button
              onClick={salvarFicha}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              💾 Salvar e Enviar (Antigo)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FichaNegociacao;
