
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Transform messages from OpenAI format to Gemini format
    const systemPrompt = 'Tu es un assistant IA spécialisé dans la gestion de stock et d\'équipements. Tu aides les utilisateurs avec leurs questions sur la gestion du matériel, les procédures, et l\'organisation. Réponds toujours en français et de manière professionnelle et utile. Tu peux donner des conseils pratiques, expliquer des processus, et aider à résoudre des problèmes liés à la gestion d\'inventaire, d\'équipements, de maintenance, et de personnel.';
    
    const contents = [];
    
    // Add system prompt as first user message
    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Je comprends. Je suis votre assistant IA spécialisé en gestion de stock et d\'équipements. Comment puis-je vous aider aujourd\'hui ?' }]
    });

    // Transform messages: 'user' stays 'user', 'assistant' becomes 'model'
    messages.forEach(msg => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Gemini API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Désolé, je n\'ai pas pu générer une réponse.';

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-gpt function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erreur de connexion au service IA',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
