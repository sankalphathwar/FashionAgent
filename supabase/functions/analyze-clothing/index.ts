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
    const { imageUrl, category } = await req.json();
    
    if (!imageUrl || !category) {
      throw new Error("Missing imageUrl or category");
    }

    console.log("Analyzing clothing image:", imageUrl, "Category:", category);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Call Gemini API to analyze the image
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
            content: 'You are a fashion expert analyzing clothing items. Extract detailed information and return it in JSON format with fields: description (brief 1-2 sentence description), color (main color name), subcategory (specific type like "t-shirt", "jeans", "sneakers"), tags (array of descriptive tags), material (fabric type if visible), season (suitable season).'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this ${category} clothing item. Provide: description, color, subcategory, tags, material, and season.`
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log("AI Response:", aiResponse);
    
    // Try to parse JSON from the response
    let result;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if no JSON found
        result = {
          description: aiResponse.slice(0, 200),
          color: "unknown",
          subcategory: category,
          tags: [category],
          material: "unknown",
          season: "all-season"
        };
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      result = {
        description: aiResponse.slice(0, 200),
        color: "unknown",
        subcategory: category,
        tags: [category],
        material: "unknown",
        season: "all-season"
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
    console.error('Error in analyze-clothing function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});