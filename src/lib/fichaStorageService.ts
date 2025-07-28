import { DadosCliente, DadosNegociacao } from './pdfGenerator';

export interface FichaCompleta {
  id: string;
  dadosCliente: DadosCliente;
  dadosNegociacao: DadosNegociacao;
  nomeConsultor: string;
  timestamp: number;
  status: 'pendente' | 'visualizada' | 'impressa' | 'em_andamento' | 'concluida';
  adminResponsavel?: string; // Nome do admin que pegou para fazer
  timestampInicio?: number; // Quando foi iniciado o atendimento
  timestampConclusao?: number; // Quando foi concluído
}

export class FichaStorageService {
  private static readonly FICHAS_KEY = 'gav_fichas_admin';
  private static readonly MAX_FICHAS = 50; // Limite para não sobrecarregar o localStorage

  static salvarFicha(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao, nomeConsultor: string): string {
    try {
      const fichas = this.getFichas();
      
      const novaFicha: FichaCompleta = {
        id: this.generateId(),
        dadosCliente,
        dadosNegociacao,
        nomeConsultor,
        timestamp: Date.now(),
        status: 'pendente'
      };

      // Adicionar nova ficha no início
      fichas.unshift(novaFicha);

      // Manter apenas as últimas MAX_FICHAS fichas
      if (fichas.length > this.MAX_FICHAS) {
        fichas.splice(this.MAX_FICHAS);
      }

      localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichas));
      
      console.log(`✅ Ficha salva para administração - ID: ${novaFicha.id}`);
      return novaFicha.id;
    } catch (error) {
      console.error('❌ Erro ao salvar ficha:', error);
      throw new Error('Erro ao salvar ficha para administração');
    }
  }

  static getFichas(): FichaCompleta[] {
    try {
      const fichasData = localStorage.getItem(this.FICHAS_KEY);
      if (!fichasData) return [];

      const fichas: FichaCompleta[] = JSON.parse(fichasData);
      
      // Filtrar fichas muito antigas (mais de 24h)
      const agora = Date.now();
      const fichasFiltradas = fichas.filter(ficha => 
        agora - ficha.timestamp < 24 * 60 * 60 * 1000
      );

      // Se filtrou alguma ficha, salvar novamente
      if (fichasFiltradas.length !== fichas.length) {
        localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichasFiltradas));
      }

      return fichasFiltradas;
    } catch (error) {
      console.error('❌ Erro ao recuperar fichas:', error);
      return [];
    }
  }

  static getFicha(id: string): FichaCompleta | null {
    const fichas = this.getFichas();
    return fichas.find(ficha => ficha.id === id) || null;
  }

  static atualizarStatus(id: string, status: FichaCompleta['status']): boolean {
    try {
      const fichas = this.getFichas();
      const index = fichas.findIndex(ficha => ficha.id === id);
      
      if (index === -1) return false;

      fichas[index].status = status;
      localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichas));
      
      console.log(`✅ Status da ficha ${id} atualizado para: ${status}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      return false;
    }
  }

  static getFichasPendentes(): FichaCompleta[] {
    return this.getFichas().filter(ficha => ficha.status === 'pendente');
  }

  static pegarFichaParaFazer(id: string, nomeAdmin: string): boolean {
    try {
      const fichas = this.getFichas();
      const index = fichas.findIndex(ficha => ficha.id === id);

      if (index === -1) return false;

      // Verificar se a ficha está disponível para ser pega
      if (fichas[index].status !== 'pendente') {
        return false;
      }

      fichas[index].status = 'em_andamento';
      fichas[index].adminResponsavel = nomeAdmin;
      fichas[index].timestampInicio = Date.now();

      localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichas));

      console.log(`✅ Ficha ${id} atribuída para ${nomeAdmin}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao atribuir ficha:', error);
      return false;
    }
  }

  static encerrarAtendimento(id: string, nomeAdmin: string): boolean {
    try {
      const fichas = this.getFichas();
      const index = fichas.findIndex(ficha => ficha.id === id);

      if (index === -1) return false;

      // Verificar se o admin é o responsável pela ficha
      if (fichas[index].adminResponsavel !== nomeAdmin) {
        console.warn(`⚠️ Admin ${nomeAdmin} não é responsável pela ficha ${id}`);
        return false;
      }

      // Verificar se a ficha está em andamento
      if (fichas[index].status !== 'em_andamento') {
        return false;
      }

      fichas[index].status = 'concluida';
      fichas[index].timestampConclusao = Date.now();

      localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichas));

      console.log(`✅ Atendimento da ficha ${id} encerrado por ${nomeAdmin}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao encerrar atendimento:', error);
      return false;
    }
  }

  static liberarFicha(id: string, nomeAdmin: string): boolean {
    try {
      const fichas = this.getFichas();
      const index = fichas.findIndex(ficha => ficha.id === id);

      if (index === -1) return false;

      // Verificar se o admin é o responsável pela ficha
      if (fichas[index].adminResponsavel !== nomeAdmin) {
        return false;
      }

      fichas[index].status = 'pendente';
      fichas[index].adminResponsavel = undefined;
      fichas[index].timestampInicio = undefined;

      localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichas));

      console.log(`✅ Ficha ${id} liberada por ${nomeAdmin}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao liberar ficha:', error);
      return false;
    }
  }

  static getFichasDoAdmin(nomeAdmin: string): FichaCompleta[] {
    return this.getFichas().filter(ficha => ficha.adminResponsavel === nomeAdmin);
  }

  static getEstatisticas() {
    const fichas = this.getFichas();

    return {
      total: fichas.length,
      pendentes: fichas.filter(f => f.status === 'pendente').length,
      visualizadas: fichas.filter(f => f.status === 'visualizada').length,
      impressas: fichas.filter(f => f.status === 'impressa').length,
      emAndamento: fichas.filter(f => f.status === 'em_andamento').length,
      concluidas: fichas.filter(f => f.status === 'concluida').length,
      ultimaFicha: fichas.length > 0 ? fichas[0].timestamp : null
    };
  }

  static limparFichasAntigas(): number {
    const fichas = this.getFichas();
    const agora = Date.now();
    const fichasValidas = fichas.filter(ficha => 
      agora - ficha.timestamp < 24 * 60 * 60 * 1000
    );

    const removidas = fichas.length - fichasValidas.length;
    
    if (removidas > 0) {
      localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichasValidas));
      console.log(`🧹 ${removidas} fichas antigas removidas`);
    }

    return removidas;
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  static exportarFichas(): string {
    const fichas = this.getFichas();
    return JSON.stringify(fichas, null, 2);
  }

  static importarFichas(data: string): boolean {
    try {
      const fichas = JSON.parse(data);
      if (Array.isArray(fichas)) {
        localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichas));
        console.log(`✅ ${fichas.length} fichas importadas`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro ao importar fichas:', error);
      return false;
    }
  }
}
