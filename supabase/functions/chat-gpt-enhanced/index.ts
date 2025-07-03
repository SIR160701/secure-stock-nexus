import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('Clé API OpenAI non configurée dans les secrets Supabase');
    }

    const { messages } = await req.json();

    // System prompt amélioré pour le contexte de gestion
    const systemPrompt = {
      role: 'system',
      content: `Tu es un assistant IA expert en gestion de stock et d'équipements pour entreprises. 

Tu es spécialisé dans :
- Gestion et optimisation du stock et des inventaires
- Maintenance préventive et corrective des équipements
- Attribution et suivi des équipements aux employés
- Procédures de sécurité et bonnes pratiques
- Analyse de performance et de rentabilité
- Stratégies d'approvisionnement et de réapprovisionnement
- Organisation et planification des ressources

Tu dois :
- Répondre TOUJOURS en français
- Être professionnel, précis et pratique
- Donner des conseils concrets et applicables
- Proposer des solutions step-by-step quand c'est approprié
- Utiliser ton expertise pour aider à résoudre les problèmes de gestion
- Adapter tes réponses au contexte d'une PME/grande entreprise

Format tes réponses de manière structurée et facile à comprendre.`
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [systemPrompt, ...messages],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erreur OpenAI API:', response.status, errorData);
      throw new Error(`Erreur API OpenAI: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer une réponse.';

    return new Response(JSON.stringify({ reply: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erreur dans chat-gpt-enhanced function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erreur de connexion au service IA',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});