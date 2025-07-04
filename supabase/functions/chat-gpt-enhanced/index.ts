import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("INFO: Fonction chat-gpt-enhanced initialisée.");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`INFO: Requête reçue à ${new Date().toISOString()}`);

  if (req.method === 'OPTIONS') {
    console.log("INFO: Réponse à une requête OPTIONS (preflight).");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Étape 1: Récupérer la clé API
    console.log("DEBUG: Tentative de récupération de la clé API OpenAI...");
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      console.error("ERREUR FATALE: La variable d'environnement OPENAI_API_KEY est manquante ou vide !");
      throw new Error('Clé API OpenAI non configurée dans les secrets Supabase.');
    }
    console.log("DEBUG: Clé API récupérée avec succès (vérification de présence uniquement).");

    // Étape 2: Lire le corps de la requête
    console.log("DEBUG: Lecture du corps de la requête...");
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      console.error("ERREUR: Le corps de la requête est invalide ou 'messages' est manquant.");
      throw new Error("Le corps de la requête doit contenir un tableau 'messages'.");
    }
    console.log(`DEBUG: Requête reçue avec ${messages.length} message(s).`);

    // Étape 3: Définir le prompt système
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
    
    // Étape 4: Envoyer la requête à OpenAI
    console.log("DEBUG: Envoi de la requête à l'API OpenAI...");
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
      }),
    });
    console.log(`DEBUG: Réponse reçue d'OpenAI avec le statut: ${response.status}`);

    // Étape 5: Gérer la réponse d'OpenAI
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`ERREUR OPENAI: Statut ${response.status}. Réponse: ${errorData}`);
      throw new Error(`Erreur API OpenAI: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer une réponse.';
    console.log("INFO: Réponse générée avec succès.");

    // Étape 6: Renvoyer la réponse au client
    return new Response(JSON.stringify({ content: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ERREUR DANS LE BLOC CATCH:', error);
    return new Response(JSON.stringify({ 
      error: 'Erreur de connexion au service IA',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});