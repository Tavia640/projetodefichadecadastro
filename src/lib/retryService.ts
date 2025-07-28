export interface RetryConfig {
  maxTentativas: number;
  delayBase: number; // em milissegundos
  multiplicadorBackoff: number;
  delayMaximo: number;
  tentarDiferentesEndpoints?: boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  tentativasFeitas: number;
  tempoTotal: number;
  logs: string[];
}

export class RetryService {
  private static readonly CONFIG_PADRAO: RetryConfig = {
    maxTentativas: 3,
    delayBase: 1000, // 1 segundo
    multiplicadorBackoff: 2,
    delayMaximo: 10000, // 10 segundos
    tentarDiferentesEndpoints: true
  };

  // Sistema de retry inteligente com backoff exponencial
  static async executarComRetry<T>(
    operacao: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const configFinal = { ...this.CONFIG_PADRAO, ...config };
    const logs: string[] = [];
    const tempoInicio = Date.now();

    for (let tentativa = 1; tentativa <= configFinal.maxTentativas; tentativa++) {
      try {
        logs.push(`🔄 Tentativa ${tentativa}/${configFinal.maxTentativas} iniciada...`);
        
        const resultado = await operacao();
        
        const tempoTotal = Date.now() - tempoInicio;
        logs.push(`✅ Sucesso na tentativa ${tentativa}! Tempo total: ${tempoTotal}ms`);
        
        return {
          success: true,
          data: resultado,
          tentativasFeitas: tentativa,
          tempoTotal,
          logs
        };
        
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || 'Erro desconhecido';
        logs.push(`❌ Tentativa ${tentativa} falhou: ${errorMsg}`);
        
        // Se é a última tentativa, não aguardar
        if (tentativa === configFinal.maxTentativas) {
          const tempoTotal = Date.now() - tempoInicio;
          logs.push(`💥 Todas as ${configFinal.maxTentativas} tentativas falharam`);
          
          return {
            success: false,
            error: errorMsg,
            tentativasFeitas: tentativa,
            tempoTotal,
            logs
          };
        }
        
        // Calcular delay com backoff exponencial
        const delay = Math.min(
          configFinal.delayBase * Math.pow(configFinal.multiplicadorBackoff, tentativa - 1),
          configFinal.delayMaximo
        );
        
        logs.push(`⏱️ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Este ponto nunca deve ser alcançado, mas fica como fallback
    const tempoTotal = Date.now() - tempoInicio;
    return {
      success: false,
      error: 'Erro inesperado no sistema de retry',
      tentativasFeitas: configFinal.maxTentativas,
      tempoTotal,
      logs
    };
  }

  // Retry específico para operações de email
  static async retryEmail<T>(
    operacao: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const emailConfig: RetryConfig = {
      maxTentativas: 4, // Mais tentativas para email
      delayBase: 2000, // 2 segundos de delay inicial
      multiplicadorBackoff: 1.5, // Backoff mais suave
      delayMaximo: 15000, // 15 segundos máximo
      tentarDiferentesEndpoints: true
    };
    
    const configFinal = { ...emailConfig, ...customConfig };
    
    return this.executarComRetry(operacao, configFinal);
  }

  // Retry para operações de rede em geral
  static async retryRede<T>(
    operacao: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const redeConfig: RetryConfig = {
      maxTentativas: 5,
      delayBase: 500, // Delay menor para rede
      multiplicadorBackoff: 2,
      delayMaximo: 8000,
      tentarDiferentesEndpoints: false
    };
    
    const configFinal = { ...redeConfig, ...customConfig };
    
    return this.executarComRetry(operacao, configFinal);
  }

  // Retry com estratégias diferentes a cada tentativa
  static async retryComEstrategias<T>(
    estrategias: (() => Promise<T>)[],
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const configFinal = { ...this.CONFIG_PADRAO, ...config };
    const logs: string[] = [];
    const tempoInicio = Date.now();

    for (let i = 0; i < estrategias.length && i < configFinal.maxTentativas; i++) {
      try {
        logs.push(`🎯 Estratégia ${i + 1}/${estrategias.length} iniciada...`);
        
        const resultado = await estrategias[i]();
        
        const tempoTotal = Date.now() - tempoInicio;
        logs.push(`✅ Sucesso com estratégia ${i + 1}! Tempo total: ${tempoTotal}ms`);
        
        return {
          success: true,
          data: resultado,
          tentativasFeitas: i + 1,
          tempoTotal,
          logs
        };
        
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || 'Erro desconhecido';
        logs.push(`❌ Estratégia ${i + 1} falhou: ${errorMsg}`);
        
        // Se não é a última estratégia, aguardar um pouco
        if (i < estrategias.length - 1) {
          const delay = configFinal.delayBase * (i + 1);
          logs.push(`⏱️ Aguardando ${delay}ms antes da próxima estratégia...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    const tempoTotal = Date.now() - tempoInicio;
    logs.push(`💥 Todas as ${estrategias.length} estratégias falharam`);
    
    return {
      success: false,
      error: 'Todas as estratégias de envio falharam',
      tentativasFeitas: estrategias.length,
      tempoTotal,
      logs
    };
  }

  // Função para determinar se um erro é temporário e vale a pena tentar novamente
  static isErroTemporario(error: any): boolean {
    const errorMsg = error?.message?.toLowerCase() || '';
    
    // Erros que indicam problemas temporários
    const errosTemporarios = [
      'network error',
      'timeout',
      'connection refused',
      'connection reset',
      'temporary failure',
      'service unavailable',
      'too many requests',
      '502',
      '503',
      '504',
      'failed to fetch',
      'network request failed'
    ];
    
    return errosTemporarios.some(erro => errorMsg.includes(erro));
  }

  // Função para determinar se vale a pena fazer retry baseado no tipo de erro
  static deveDefinitivamente(error: any): boolean {
    const errorMsg = error?.message?.toLowerCase() || '';
    
    // Erros que não valem a pena tentar novamente
    const errosDefinitivos = [
      'unauthorized',
      'forbidden',
      'not found',
      'invalid api key',
      'authentication failed',
      'permission denied',
      '401',
      '403',
      '404',
      'chave api',
      'api key'
    ];
    
    return errosDefinitivos.some(erro => errorMsg.includes(erro));
  }

  // Sistema de retry inteligente que considera o tipo de erro
  static async retryInteligente<T>(
    operacao: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const configFinal = { ...this.CONFIG_PADRAO, ...config };
    const logs: string[] = [];
    const tempoInicio = Date.now();

    for (let tentativa = 1; tentativa <= configFinal.maxTentativas; tentativa++) {
      try {
        logs.push(`🧠 Tentativa inteligente ${tentativa}/${configFinal.maxTentativas}...`);
        
        const resultado = await operacao();
        
        const tempoTotal = Date.now() - tempoInicio;
        logs.push(`✅ Sucesso na tentativa ${tentativa}! Tempo total: ${tempoTotal}ms`);
        
        return {
          success: true,
          data: resultado,
          tentativasFeitas: tentativa,
          tempoTotal,
          logs
        };
        
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || 'Erro desconhecido';
        logs.push(`❌ Tentativa ${tentativa} falhou: ${errorMsg}`);
        
        // Verificar se é um erro definitivo
        if (this.deveDefinitivamente(error)) {
          logs.push(`🚫 Erro definitivo detectado. Parando tentativas.`);
          const tempoTotal = Date.now() - tempoInicio;
          
          return {
            success: false,
            error: errorMsg,
            tentativasFeitas: tentativa,
            tempoTotal,
            logs
          };
        }
        
        // Se é a última tentativa, não aguardar
        if (tentativa === configFinal.maxTentativas) {
          const tempoTotal = Date.now() - tempoInicio;
          logs.push(`💥 Todas as ${configFinal.maxTentativas} tentativas falharam`);
          
          return {
            success: false,
            error: errorMsg,
            tentativasFeitas: tentativa,
            tempoTotal,
            logs
          };
        }
        
        // Calcular delay baseado no tipo de erro
        let delay = configFinal.delayBase * Math.pow(configFinal.multiplicadorBackoff, tentativa - 1);
        
        // Se é erro temporário, aguardar mais tempo
        if (this.isErroTemporario(error)) {
          delay *= 1.5;
          logs.push(`⏱️ Erro temporário detectado. Delay aumentado para ${delay}ms`);
        }
        
        delay = Math.min(delay, configFinal.delayMaximo);
        
        logs.push(`⏱️ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    const tempoTotal = Date.now() - tempoInicio;
    return {
      success: false,
      error: 'Erro inesperado no sistema de retry inteligente',
      tentativasFeitas: configFinal.maxTentativas,
      tempoTotal,
      logs
    };
  }
}
