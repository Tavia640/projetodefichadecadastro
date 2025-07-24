import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendPDFRequest {
  clientData: any;
  fichaData: any;
  pdfData1: string; // base64 encoded PDF
  pdfData2: string; // base64 encoded PDF
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send PDFs function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientData, fichaData, pdfData1, pdfData2 }: SendPDFRequest = await req.json();

    console.log("Preparing to send PDFs via email");

    // Convert base64 to Uint8Array for attachments
    const pdf1Buffer = Uint8Array.from(atob(pdfData1), c => c.charCodeAt(0));
    const pdf2Buffer = Uint8Array.from(atob(pdfData2), c => c.charCodeAt(0));

    const emailResponse = await resend.emails.send({
      from: "GAV Resorts <noreply@gavresorts.com.br>",
      to: ["admudrive2025@gavresorts.com.br"],
      subject: `Nova Ficha de Negociação - Cliente: ${clientData.nome || 'Nome não informado'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Nova Ficha de Negociação
          </h1>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #34495e; margin-top: 0;">Dados do Cliente</h2>
            <p><strong>Nome:</strong> ${clientData.nome || 'Não informado'}</p>
            <p><strong>CPF:</strong> ${clientData.cpf || 'Não informado'}</p>
            <p><strong>Email:</strong> ${clientData.email || 'Não informado'}</p>
            <p><strong>Telefone:</strong> ${clientData.telefone || 'Não informado'}</p>
          </div>

          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #27ae60; margin-top: 0;">Dados da Negociação</h2>
            <p><strong>Liner:</strong> ${fichaData.liner || 'Não informado'}</p>
            <p><strong>Closer:</strong> ${fichaData.closer || 'Não informado'}</p>
            <p><strong>Tipo de Venda:</strong> ${fichaData.tipoVenda || 'Não informado'}</p>
          </div>

          <div style="margin: 30px 0; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
            <p style="margin: 0; color: #856404;">
              <strong>📎 Anexos:</strong> Esta mensagem contém 2 PDFs com a ficha completa de cadastro e negociação.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 12px;">
              Gerado automaticamente pelo sistema GAV Resorts<br>
              Data: ${new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Ficha_Cadastro_Cliente_${clientData.nome?.replace(/\s+/g, '_') || 'Cliente'}.pdf`,
          content: pdf1Buffer,
          contentType: 'application/pdf',
        },
        {
          filename: `Ficha_Negociacao_${clientData.nome?.replace(/\s+/g, '_') || 'Cliente'}.pdf`,
          content: pdf2Buffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-pdfs function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);