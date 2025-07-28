import { DadosCliente, DadosNegociacao } from './pdfGenerator';

export interface Ficha {
  id: string;
  dadosCliente: DadosCliente;
  dadosNegociacao: DadosNegociacao;
  consultor: string;
  dataEnvio: Date;
  status: 'pendente' | 'aceita' | 'arquivada';
  adminResponsavel?: string;
  dataAceite?: Date;
  dataArquivamento?: Date;
}

export class FichaService {
  private static readonly FICHAS_KEY = 'fichas_sistema';

  static enviarFicha(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao, nomeConsultor: string): string {
    const ficha: Ficha = {
      id: Date.now().toString(),
      dadosCliente,
      dadosNegociacao,
      consultor: nomeConsultor,
      dataEnvio: new Date(),
      status: 'pendente'
    };

    const fichas = this.getFichas();
    fichas.push(ficha);
    localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichas));
    
    return ficha.id;
  }

  static getFichas(): Ficha[] {
    try {
      const fichasString = localStorage.getItem(this.FICHAS_KEY);
      if (!fichasString) return [];
      
      const fichas = JSON.parse(fichasString);
      return fichas.map((f: any) => ({
        ...f,
        dataEnvio: new Date(f.dataEnvio),
        dataAceite: f.dataAceite ? new Date(f.dataAceite) : undefined,
        dataArquivamento: f.dataArquivamento ? new Date(f.dataArquivamento) : undefined
      }));
    } catch (error) {
      console.error('Erro ao recuperar fichas:', error);
      return [];
    }
  }

  static getFichasPendentes(): Ficha[] {
    return this.getFichas().filter(f => f.status === 'pendente');
  }

  static getFichasDoAdmin(nomeAdmin: string): Ficha[] {
    return this.getFichas().filter(f => f.adminResponsavel === nomeAdmin);
  }

  static aceitarFicha(fichaId: string, nomeAdmin: string): boolean {
    const fichas = this.getFichas();
    const ficha = fichas.find(f => f.id === fichaId);
    
    if (!ficha || ficha.status !== 'pendente') {
      return false;
    }

    ficha.status = 'aceita';
    ficha.adminResponsavel = nomeAdmin;
    ficha.dataAceite = new Date();

    localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichas));
    return true;
  }

  static arquivarFicha(fichaId: string): boolean {
    const fichas = this.getFichas();
    const ficha = fichas.find(f => f.id === fichaId);
    
    if (!ficha || ficha.status !== 'aceita') {
      return false;
    }

    ficha.status = 'arquivada';
    ficha.dataArquivamento = new Date();

    localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichas));
    return true;
  }

  static getFicha(fichaId: string): Ficha | null {
    const fichas = this.getFichas();
    return fichas.find(f => f.id === fichaId) || null;
  }

  // Limpar fichas arquivadas automaticamente às 23:59h
  static limparFichasArquivadas(): void {
    const fichas = this.getFichas();
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    
    const fichasAtivas = fichas.filter(f => {
      if (f.status !== 'arquivada' || !f.dataArquivamento) return true;
      
      const dataArquivamento = new Date(f.dataArquivamento);
      const diaArquivamento = new Date(dataArquivamento.getFullYear(), dataArquivamento.getMonth(), dataArquivamento.getDate());
      
      // Manter fichas arquivadas apenas no dia do arquivamento
      return diaArquivamento.getTime() === hoje.getTime();
    });

    localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichasAtivas));
  }
}
