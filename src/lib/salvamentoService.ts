import { DadosCliente, DadosNegociacao, PDFGenerator } from './pdfGenerator';
import { supabase } from '@/integrations/supabase/client';

export interface SalvamentoResult {
  success: boolean;
  message: string;
  locations: string[];
  urls?: string[];
  errors: string[];
}

export interface SalvamentoOptions {
  salvarLocal: boolean;
  salvarSupabase: boolean;
  salvarIndexedDB: boolean;
  compressao?: boolean;
}

export class SalvamentoService {
  private static readonly STORAGE_KEY = 'gav_pdfs_salvos';
  private static readonly DB_NAME = 'GAVResortsDB';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'pdfs';

  // Salvar PDFs em múltiplas localizações
  static async salvarPDFs(
    clientData: DadosCliente,
    fichaData: DadosNegociacao,
    options: SalvamentoOptions = {
      salvarLocal: true,
      salvarSupabase: true,
      salvarIndexedDB: true,
      compressao: false
    }
  ): Promise<SalvamentoResult> {
    const locations: string[] = [];
    const urls: string[] = [];
    const errors: string[] = [];

    try {
      console.log('💾 Iniciando salvamento múltiplo de PDFs...');

      // Gerar PDFs
      const pdfBlob1 = PDFGenerator.gerarPDFCadastroClienteBlob(clientData);
      const pdfBlob2 = PDFGenerator.gerarPDFNegociacaoBlob(clientData, fichaData);
      const pdfBase64_1 = PDFGenerator.gerarPDFCadastroClienteBase64(clientData);
      const pdfBase64_2 = PDFGenerator.gerarPDFNegociacaoBase64(clientData, fichaData);

      // Criar identificador único
      const timestamp = new Date().toISOString();
      const clienteId = clientData.cpf?.replace(/\D/g, '') || Date.now().toString();
      const nomeSeguro = clientData.nome?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente';

      // 1. Salvamento Local (localStorage)
      if (options.salvarLocal) {
        try {
          const dadosParaSalvar = {
            id: `${clienteId}_${timestamp}`,
            cliente: clientData,
            negociacao: fichaData,
            pdfs: {
              cadastro: pdfBase64_1,
              negociacao: pdfBase64_2
            },
            timestamp,
            size: {
              cadastro: pdfBlob1.size,
              negociacao: pdfBlob2.size
            }
          };

          const pdfsSalvos = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
          pdfsSalvos.push(dadosParaSalvar);
          
          // Manter apenas os últimos 10 para não lotar o localStorage
          if (pdfsSalvos.length > 10) {
            pdfsSalvos.splice(0, pdfsSalvos.length - 10);
          }

          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pdfsSalvos));
          locations.push('LocalStorage');
          console.log('✅ Salvamento local concluído');
        } catch (error: any) {
          errors.push(`LocalStorage: ${error.message}`);
          console.error('❌ Erro no salvamento local:', error);
        }
      }

      // 2. Salvamento no Supabase Storage
      if (options.salvarSupabase) {
        try {
          console.log('☁️ Iniciando salvamento no Supabase...');
          
          const pathCadastro = `pdfs/${clienteId}/${timestamp}/cadastro_${nomeSeguro}.pdf`;
          const pathNegociacao = `pdfs/${clienteId}/${timestamp}/negociacao_${nomeSeguro}.pdf`;

          // Upload PDF de cadastro
          const { data: uploadData1, error: uploadError1 } = await supabase.storage
            .from('pdfs')
            .upload(pathCadastro, pdfBlob1, {
              contentType: 'application/pdf',
              upsert: false
            });

          if (uploadError1) {
            throw new Error(`Erro no upload do cadastro: ${uploadError1.message}`);
          }

          // Upload PDF de negociação
          const { data: uploadData2, error: uploadError2 } = await supabase.storage
            .from('pdfs')
            .upload(pathNegociacao, pdfBlob2, {
              contentType: 'application/pdf',
              upsert: false
            });

          if (uploadError2) {
            throw new Error(`Erro no upload da negociação: ${uploadError2.message}`);
          }

          // Gerar URLs públicas
          const { data: urlData1 } = supabase.storage
            .from('pdfs')
            .getPublicUrl(pathCadastro);

          const { data: urlData2 } = supabase.storage
            .from('pdfs')
            .getPublicUrl(pathNegociacao);

          urls.push(urlData1.publicUrl, urlData2.publicUrl);
          locations.push('Supabase Storage');
          console.log('✅ Salvamento no Supabase concluído');

          // Salvar metadados na tabela
          try {
            const { error: metadataError } = await supabase
              .from('pdfs_metadata')
              .insert({
                cliente_id: clienteId,
                cliente_nome: clientData.nome,
                cliente_cpf: clientData.cpf,
                pdf_cadastro_path: pathCadastro,
                pdf_negociacao_path: pathNegociacao,
                pdf_cadastro_url: urlData1.publicUrl,
                pdf_negociacao_url: urlData2.publicUrl,
                dados_cliente: clientData,
                dados_negociacao: fichaData,
                timestamp: timestamp
              });

            if (metadataError) {
              console.warn('⚠️ Erro ao salvar metadados:', metadataError);
            } else {
              console.log('✅ Metadados salvos na tabela');
            }
          } catch (metaError: any) {
            console.warn('⚠️ Erro nos metadados:', metaError);
          }

        } catch (error: any) {
          errors.push(`Supabase: ${error.message}`);
          console.error('❌ Erro no salvamento Supabase:', error);
        }
      }

      // 3. Salvamento no IndexedDB
      if (options.salvarIndexedDB) {
        try {
          console.log('📱 Iniciando salvamento no IndexedDB...');
          
          const db = await this.abrirIndexedDB();
          const transaction = db.transaction([this.STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);

          const dadosIndexedDB = {
            id: `${clienteId}_${timestamp}`,
            cliente: clientData,
            negociacao: fichaData,
            pdfBlobs: {
              cadastro: pdfBlob1,
              negociacao: pdfBlob2
            },
            timestamp,
            size: {
              cadastro: pdfBlob1.size,
              negociacao: pdfBlob2.size
            }
          };

          await new Promise((resolve, reject) => {
            const request = store.add(dadosIndexedDB);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });

          locations.push('IndexedDB');
          console.log('✅ Salvamento no IndexedDB concluído');
        } catch (error: any) {
          errors.push(`IndexedDB: ${error.message}`);
          console.error('❌ Erro no salvamento IndexedDB:', error);
        }
      }

      return {
        success: locations.length > 0,
        message: `PDFs salvos em: ${locations.join(', ')}`,
        locations,
        urls,
        errors
      };

    } catch (error: any) {
      console.error('❌ Erro geral no salvamento:', error);
      return {
        success: false,
        message: `Erro no salvamento: ${error.message}`,
        locations,
        urls,
        errors: [error.message]
      };
    }
  }

  // Abrir IndexedDB
  private static async abrirIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('cliente_cpf', 'cliente.cpf', { unique: false });
        }
      };
    });
  }

  // Listar PDFs salvos localmente
  static async listarPDFsSalvos(): Promise<any[]> {
    try {
      // Do localStorage
      const localPDFs = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      
      // Do IndexedDB
      const db = await this.abrirIndexedDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const indexedDBPDFs = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return [...localPDFs, ...indexedDBPDFs].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    } catch (error: any) {
      console.error('❌ Erro ao listar PDFs:', error);
      return [];
    }
  }

  // Recuperar PDF específico
  static async recuperarPDF(id: string): Promise<any | null> {
    try {
      // Tentar no localStorage primeiro
      const localPDFs = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      const localPDF = localPDFs.find((pdf: any) => pdf.id === id);
      
      if (localPDF) {
        return localPDF;
      }

      // Tentar no IndexedDB
      const db = await this.abrirIndexedDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const indexedDBPDF = await new Promise<any>((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return indexedDBPDF || null;

    } catch (error: any) {
      console.error('❌ Erro ao recuperar PDF:', error);
      return null;
    }
  }

  // Baixar PDF salvo
  static async baixarPDFSalvo(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const dadosPDF = await this.recuperarPDF(id);
      
      if (!dadosPDF) {
        return { success: false, message: 'PDF não encontrado' };
      }

      const nomeSeguro = dadosPDF.cliente?.nome?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente';
      const timestamp = dadosPDF.timestamp?.slice(0, 10) || 'sem_data';

      // Se tem blobs (IndexedDB), usar eles
      if (dadosPDF.pdfBlobs) {
        const url1 = URL.createObjectURL(dadosPDF.pdfBlobs.cadastro);
        const url2 = URL.createObjectURL(dadosPDF.pdfBlobs.negociacao);

        // Download cadastro
        const link1 = document.createElement('a');
        link1.href = url1;
        link1.download = `Cadastro_${nomeSeguro}_${timestamp}.pdf`;
        link1.click();

        // Download negociação
        setTimeout(() => {
          const link2 = document.createElement('a');
          link2.href = url2;
          link2.download = `Negociacao_${nomeSeguro}_${timestamp}.pdf`;
          link2.click();

          URL.revokeObjectURL(url1);
          URL.revokeObjectURL(url2);
        }, 500);

      } else if (dadosPDF.pdfs) {
        // Se tem base64 (localStorage), converter para blob
        const blob1 = this.base64ToBlob(dadosPDF.pdfs.cadastro, 'application/pdf');
        const blob2 = this.base64ToBlob(dadosPDF.pdfs.negociacao, 'application/pdf');

        const url1 = URL.createObjectURL(blob1);
        const url2 = URL.createObjectURL(blob2);

        // Download cadastro
        const link1 = document.createElement('a');
        link1.href = url1;
        link1.download = `Cadastro_${nomeSeguro}_${timestamp}.pdf`;
        link1.click();

        // Download negociação
        setTimeout(() => {
          const link2 = document.createElement('a');
          link2.href = url2;
          link2.download = `Negociacao_${nomeSeguro}_${timestamp}.pdf`;
          link2.click();

          URL.revokeObjectURL(url1);
          URL.revokeObjectURL(url2);
        }, 500);
      }

      return { success: true, message: 'PDFs baixados com sucesso' };

    } catch (error: any) {
      console.error('❌ Erro ao baixar PDF salvo:', error);
      return { success: false, message: `Erro ao baixar: ${error.message}` };
    }
  }

  // Converter base64 para blob
  private static base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  // Limpar PDFs antigos
  static async limparPDFsAntigos(diasParaManter: number = 7): Promise<{ success: boolean; message: string; removidos: number }> {
    try {
      const agora = new Date();
      const limiteData = new Date(agora.getTime() - (diasParaManter * 24 * 60 * 60 * 1000));
      let removidos = 0;

      // Limpar localStorage
      const localPDFs = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      const localPDFsLimpos = localPDFs.filter((pdf: any) => {
        const dataPDF = new Date(pdf.timestamp);
        const manter = dataPDF > limiteData;
        if (!manter) removidos++;
        return manter;
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(localPDFsLimpos));

      // Limpar IndexedDB
      const db = await this.abrirIndexedDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('timestamp');

      const range = IDBKeyRange.upperBound(limiteData.toISOString());
      const request = index.openCursor(range);

      await new Promise<void>((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            removidos++;
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      return {
        success: true,
        message: `Limpeza concluída. ${removidos} PDFs antigos removidos.`,
        removidos
      };

    } catch (error: any) {
      console.error('❌ Erro na limpeza:', error);
      return {
        success: false,
        message: `Erro na limpeza: ${error.message}`,
        removidos: 0
      };
    }
  }

  // Obter estatísticas de armazenamento
  static async obterEstatisticas(): Promise<any> {
    try {
      const pdfs = await this.listarPDFsSalvos();
      
      const stats = {
        total: pdfs.length,
        localStorageCount: 0,
        indexedDBCount: 0,
        sizeTotal: 0,
        maisRecente: null as any,
        maisAntigo: null as any
      };

      pdfs.forEach(pdf => {
        if (pdf.pdfs) stats.localStorageCount++;
        if (pdf.pdfBlobs) stats.indexedDBCount++;
        
        if (pdf.size) {
          stats.sizeTotal += (pdf.size.cadastro || 0) + (pdf.size.negociacao || 0);
        }
      });

      if (pdfs.length > 0) {
        stats.maisRecente = pdfs[0];
        stats.maisAntigo = pdfs[pdfs.length - 1];
      }

      return stats;

    } catch (error: any) {
      console.error('❌ Erro nas estatísticas:', error);
      return null;
    }
  }
}
