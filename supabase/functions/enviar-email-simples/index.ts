import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  emailData: {
    from: string;
    to: string;
    subject: string;
    html: string;
    attachments: Array<{
      filename: string;
      content: string;
      encoding: string;
      contentType: string;
    }>;
  };
  apiKey: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🚀 Edge Function: enviar-email-simples iniciada");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📨 Processando requisição de email...");
    
    const { emailData, apiKey }: EmailRequest = await req.json();

    // Validações básicas
    if (!emailData || !apiKey) {
      console.error("❌ Dados incompletos");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Dados de email ou API key não fornecidos" 
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    if (!emailData.to || !emailData.subject || !emailData.html) {
      console.error("❌ Dados de email incompletos");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Dados de email incompletos (to, subject, html obrigatórios)" 
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log("✅ Dados validados, inicializando Resend...");

    // Inicializar Resend
    const resend = new Resend(apiKey);

    // Preparar attachments
    const attachments = emailData.attachments?.map(att => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType || 'application/pdf'
    })) || [];

    console.log(`📎 Preparando envio com ${attachments.length} anexos...`);

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      attachments: attachments
    });

    console.log("📊 Resposta do Resend:", emailResponse);

    if (emailResponse.error) {
      console.error("❌ Erro no Resend:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Resend API Error: ${emailResponse.error.message}` 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    if (!emailResponse.data?.id) {
      console.error("❌ Resposta inválida do Resend:", emailResponse);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Resposta inválida do serviço de email" 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log("✅ Email enviado com sucesso! ID:", emailResponse.data.id);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResponse.data.id,
        message: `Email enviado com sucesso para ${emailData.to}`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("❌ ERRO CRÍTICO:", error);
    console.error("📋 Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro interno do servidor",
        details: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);
