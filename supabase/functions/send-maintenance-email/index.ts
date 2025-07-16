import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MaintenanceEmailRequest {
  technicianEmail: string;
  technicianName: string;
  equipmentName: string;
  parkNumber: string;
  serialNumber: string;
  description: string;
  priority: string;
  scheduledDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      technicianEmail,
      technicianName,
      equipmentName,
      parkNumber,
      serialNumber,
      description,
      priority,
      scheduledDate
    }: MaintenanceEmailRequest = await req.json();

    const priorityColor = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981';
    const priorityText = priority === 'high' ? 'HAUTE' : priority === 'medium' ? 'MOYENNE' : 'BASSE';

    const emailResponse = await resend.emails.send({
      from: "Secure Stock <onboarding@resend.dev>",
      to: [technicianEmail],
      subject: `Nouvelle maintenance assignée - ${equipmentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Nouvelle maintenance assignée</h1>
          </div>
          
          <div style="padding: 20px; background: #f8f9fa; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333;">Bonjour ${technicianName},</p>
            
            <p style="color: #666;">Une nouvelle maintenance vous a été assignée. Voici les détails :</p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Équipement :</td>
                  <td style="padding: 8px 0; color: #666;">${equipmentName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Numéro de parc :</td>
                  <td style="padding: 8px 0; color: #666;">${parkNumber || 'Non spécifié'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Numéro de série :</td>
                  <td style="padding: 8px 0; color: #666;">${serialNumber || 'Non spécifié'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Priorité :</td>
                  <td style="padding: 8px 0;">
                    <span style="background: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                      ${priorityText}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Date programmée :</td>
                  <td style="padding: 8px 0; color: #666;">${new Date(scheduledDate).toLocaleDateString('fr-FR')}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Description du problème :</h3>
              <p style="color: #666; line-height: 1.6; margin: 0;">${description}</p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Merci de prendre en charge cette maintenance dans les plus brefs délais.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Cet email a été généré automatiquement par le système Secure Stock.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Email envoyé avec succès:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);