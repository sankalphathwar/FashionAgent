import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    
    console.log("Stylist chat request received");

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth getUser failed:', userError);
      throw new Error("Not authenticated");
    }

    // Fetch user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Fetch user's clothes
    const { data: clothes } = await supabaseClient
      .from('clothes')
      .select('*')
      .eq('user_id', user.id);

    const clothingList = clothes?.map(item => ({
      id: item.id,
      category: item.category,
      subcategory: item.subcategory,
      color: item.color,
      description: item.ai_description,
      tags: item.tags,
      season: item.season
    })) || [];

    const systemPrompt = `You are a professional AI fashion stylist assistant. You help users create perfect outfits from their virtual closet.

USER PROFILE:
- Height: ${profile?.height || 'not specified'} cm
- Body Type: ${profile?.body_type || 'not specified'}
- Aesthetics: ${profile?.aesthetics?.join(', ') || 'not specified'}
- Color Preferences: ${profile?.color_preferences?.join(', ') || 'not specified'}

AVAILABLE CLOTHING ITEMS:
${JSON.stringify(clothingList, null, 2)}

When recommending outfits:
1. Consider the user's body type, height, and aesthetic preferences
2. Only suggest items from their available closet
3. Consider the occasion and weather they mention
4. Explain why each outfit works for them
5. Be conversational, friendly, and encouraging
6. If they don't have suitable items, suggest what types of pieces would complete the look

Keep responses concise and actionable.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in stylist-chat function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
