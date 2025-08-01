import { supabase } from '@/integrations/supabase/client';

export interface FichaCompleta {
  id: string;
  dados_cliente: any;
  dados_negociacao: any;
  nome_consultor: string;
  created_at: string;
  updated_at: string;
  status: string;
  nome_admin?: string | null;
}

export class FichaSupabaseService {
  static async salvarFicha(
    dadosCliente: any,
    dadosNegociacao: any,
    nomeConsultor: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('fichas')
        .insert({
          dados_cliente: dadosCliente,
          dados_negociacao: dadosNegociacao,
          nome_consultor: nomeConsultor,
          status: 'pendente'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar ficha:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Erro ao salvar ficha:', error);
      return null;
    }
  }

  static async getFichas(): Promise<FichaCompleta[]> {
    try {
      const { data, error } = await supabase
        .from('fichas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar fichas:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao carregar fichas:', error);
      return [];
    }
  }

  static async getFicha(id: string): Promise<FichaCompleta | null> {
    try {
      const { data, error } = await supabase
        .from('fichas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao carregar ficha:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao carregar ficha:', error);
      return null;
    }
  }

  static async atualizarStatus(
    id: string,
    status: FichaCompleta['status']
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fichas')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return false;
    }
  }

  static async pegarFichaParaFazer(
    id: string,
    nomeAdmin: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fichas')
        .update({ 
          status: 'em_andamento',
          nome_admin: nomeAdmin,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('status', 'pendente');

      if (error) {
        console.error('Erro ao pegar ficha:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao pegar ficha:', error);
      return false;
    }
  }

  static async encerrarAtendimento(
    id: string,
    nomeAdmin: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fichas')
        .update({ 
          status: 'concluida',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('nome_admin', nomeAdmin)
        .eq('status', 'em_andamento');

      if (error) {
        console.error('Erro ao encerrar atendimento:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao encerrar atendimento:', error);
      return false;
    }
  }

  static async liberarFicha(
    id: string,
    nomeAdmin: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fichas')
        .update({ 
          status: 'pendente',
          nome_admin: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('nome_admin', nomeAdmin);

      if (error) {
        console.error('Erro ao liberar ficha:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao liberar ficha:', error);
      return false;
    }
  }

  static async arquivarFicha(
    id: string,
    nomeAdmin: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fichas')
        .update({ 
          status: 'arquivada',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('nome_admin', nomeAdmin)
        .eq('status', 'concluida');

      if (error) {
        console.error('Erro ao arquivar ficha:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao arquivar ficha:', error);
      return false;
    }
  }

  static async desarquivarFicha(
    id: string,
    nomeAdmin: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fichas')
        .update({ 
          status: 'concluida',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('nome_admin', nomeAdmin)
        .eq('status', 'arquivada');

      if (error) {
        console.error('Erro ao desarquivar ficha:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao desarquivar ficha:', error);
      return false;
    }
  }

  static async getFichasDoAdmin(nomeAdmin: string): Promise<FichaCompleta[]> {
    try {
      const { data, error } = await supabase
        .from('fichas')
        .select('*')
        .eq('nome_admin', nomeAdmin)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar fichas do admin:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao carregar fichas do admin:', error);
      return [];
    }
  }

  static async getEstatisticas(): Promise<{
    pendentes: number;
    em_andamento: number;
    concluidas: number;
    arquivadas: number;
    total: number;
    ultima_ficha: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('fichas')
        .select('status, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar estatísticas:', error);
        return {
          pendentes: 0,
          em_andamento: 0,
          concluidas: 0,
          arquivadas: 0,
          total: 0,
          ultima_ficha: null
        };
      }

      const stats = {
        pendentes: 0,
        em_andamento: 0,
        concluidas: 0,
        arquivadas: 0,
        total: data?.length || 0,
        ultima_ficha: data?.[0]?.created_at || null
      };

      data?.forEach(ficha => {
        switch (ficha.status) {
          case 'pendente':
            stats.pendentes++;
            break;
          case 'em_andamento':
            stats.em_andamento++;
            break;
          case 'concluida':
            stats.concluidas++;
            break;
          case 'arquivada':
            stats.arquivadas++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      return {
        pendentes: 0,
        em_andamento: 0,
        concluidas: 0,
        arquivadas: 0,
        total: 0,
        ultima_ficha: null
      };
    }
  }

  // Manter compatibilidade com o serviço anterior
  static limparFichasAntigas(): number {
    // No Supabase, podemos implementar isso como uma função scheduled
    console.log('Limpeza automática não implementada no Supabase');
    return 0;
  }

  static async exportarFichas(): Promise<string> {
    try {
      const fichas = await this.getFichas();
      return JSON.stringify(fichas, null, 2);
    } catch (error) {
      console.error('Erro ao exportar fichas:', error);
      return '[]';
    }
  }

  static async importarFichas(data: string): Promise<boolean> {
    try {
      const fichas = JSON.parse(data);
      
      for (const ficha of fichas) {
        await supabase
          .from('fichas')
          .insert({
            dados_cliente: ficha.dados_cliente,
            dados_negociacao: ficha.dados_negociacao,
            nome_consultor: ficha.nome_consultor,
            status: ficha.status || 'pendente',
            nome_admin: ficha.nome_admin
          });
      }

      return true;
    } catch (error) {
      console.error('Erro ao importar fichas:', error);
      return false;
    }
  }
}

// Alias for compatibility
export const FichaStorageService = FichaSupabaseService;