import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch current data from all relevant tables
    const [stockData, employeesData, maintenanceData, categoriesData, activitiesData] = await Promise.all([
      supabase.from('stock_items').select('*').limit(50),
      supabase.from('employees').select('*').limit(50),
      supabase.from('maintenance_records').select('*').limit(50),
      supabase.from('stock_categories').select('*'),
      supabase.from('activity_history').select('*').order('created_at', { ascending: false }).limit(20)
    ]);

    // Prepare context data for the AI
    const contextData = {
      stock: stockData.data || [],
      employees: employeesData.data || [],
      maintenance: maintenanceData.data || [],
      categories: categoriesData.data || [],
      recent_activities: activitiesData.data || []
    };

    // Enhanced system prompt with access to data and capabilities
    const systemPrompt = `Tu es un assistant IA spécialisé dans la gestion de stock et d'équipements avec accès complet aux données de l'entreprise. Tu peux consulter et analyser les données en temps réel.

DONNÉES ACTUELLES DISPONIBLES :
- Stock: ${contextData.stock.length} articles
- Employés: ${contextData.employees.length} personnes
- Maintenances: ${contextData.maintenance.length} interventions
- Catégories: ${contextData.categories.length} catégories
- Activités récentes: ${contextData.recent_activities.length} actions

CAPACITÉS :
- Analyser les tendances et statistiques
- Identifier les problèmes critiques (stock bas, maintenances en retard)
- Donner des recommandations basées sur les données réelles
- Expliquer les processus de gestion
- Répondre aux questions sur l'état actuel du système

INSTRUCTIONS :
- Réponds toujours en français de manière professionnelle
- Base tes réponses sur les données réelles fournies
- Identifie les alertes critiques si elles existent
- Propose des actions concrètes quand c'est pertinent
- Sois précis dans tes analyses statistiques`;

    const contents = [];
    
    // Add system prompt and context
    contents.push({
      role: 'user',
      parts: [{ 
        text: `${systemPrompt}\n\nCONTEXTE DONNÉES ACTUELLES:\n${JSON.stringify(contextData, null, 2)}`
      }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Je suis connecté à vos données en temps réel. Je peux analyser votre stock, vos équipements, votre équipe et vos maintenances. Comment puis-je vous aider à optimiser votre gestion ?' }]
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
          maxOutputTokens: 2000,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Gemini API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Désolé, je n\'ai pas pu générer une réponse.';

    // Log chat activity to database
    await supabase.from('activity_history').insert({
      action: 'Chat IA',
      description: `Consultation de l'assistant IA - Question posée`,
      page: 'Chat',
      user_id: 'system'
    });

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-gpt-enhanced function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erreur de connexion au service IA',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});