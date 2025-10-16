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
    const { occasion, weather } = await req.json();
    
    console.log("Generating outfit recommendations for:", { occasion, weather });

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the current user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Not authenticated");
    }

    // Fetch user's profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile error:", profileError);
    }

    // Fetch user's clothes
    const { data: clothes, error: clothesError } = await supabaseClient
      .from('clothes')
      .select('*')
      .eq('user_id', user.id);

    if (clothesError) {
      throw new Error(`Failed to fetch clothes: ${clothesError.message}`);
    }

    if (!clothes || clothes.length === 0) {
      return new Response(
        JSON.stringify({ outfits: [], message: "No clothes in closet" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    console.log(`Found ${clothes.length} clothing items`);

    // Prepare clothing data for AI
    const clothingList = clothes.map(item => ({
      id: item.id,
      category: item.category,
      subcategory: item.subcategory,
      color: item.color,
      description: item.ai_description,
      tags: item.tags,
      season: item.season
    }));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Call Gemini API for outfit recommendations
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a professional fashion stylist. Create outfit recommendations by combining clothing items from the user's closet. Return ONLY valid JSON in this exact format:
{
  "outfits": [
    {
      "name": "Outfit Name",
      "items": ["item description 1", "item description 2", "item description 3"],
      "reasoning": "Why this outfit works for the occasion and weather"
    }
  ]
}
Generate 3-5 complete outfits. Each outfit should include items from different categories (tops, bottoms, footwear, etc.) that work well together.`
          },
          {
            role: 'user',
            content: `Create outfit recommendations for:
Occasion: ${occasion}
Weather: ${weather}
${profile ? `User preferences: Height ${profile.height}cm, Body type: ${profile.body_type}, Aesthetics: ${profile.aesthetics?.join(', ')}` : ''}

Available clothing items:
${JSON.stringify(clothingList, null, 2)}

Return complete outfit combinations with reasoning.`
          }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`AI recommendation failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log("AI Response:", aiResponse);
    
    // Parse the JSON response
    let result;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a fallback outfit
      result = {
        outfits: [{
          name: "Casual Everyday Look",
          items: clothingList.slice(0, 3).map(item => `${item.color} ${item.subcategory}`),
          reasoning: "A simple combination from your closet that works for most occasions."
        }]
      };
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in recommend-outfits function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});