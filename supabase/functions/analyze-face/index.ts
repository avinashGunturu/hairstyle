// Supabase Edge Function: analyze-face
// Full face analysis with hairstyle suggestions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanBase64 = (base64: string) => {
    return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verify user authentication
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Parse request body
        const { base64Image, gender } = await req.json();

        if (!base64Image || !gender) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 3. Get Gemini API key
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 4. Build prompts based on gender
        const featurePrompt = gender === 'male'
            ? "MANDATORY: You must provide specific beard or facial hair styling advice that specifically complements this hairstyle and face shape."
            : "MANDATORY: You must provide specific eyebrow shaping or eyelash styling advice that specifically complements this hairstyle and face shape.";

        const featureDescription = gender === 'male'
            ? "Specific recommendation for beard or facial hair style (e.g., 'Heavy Stubble', 'Goatee', 'Clean Shaven') to match the haircut."
            : "Specific recommendation for eyebrow shape or lash style (e.g., 'Soft Arched Brows', 'Wispy Lashes') to match the haircut.";

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: cleanBase64(base64Image),
                            },
                        },
                        {
                            text: `Analyze the face shape of the person in this image. The user identifies as ${gender}. Suggest 5 diverse and trendy hairstyles that would suit this face shape perfectly. ${featurePrompt} Provide the output in JSON format.`,
                        },
                    ],
                },
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        faceShape: { type: "STRING", description: "The identified shape of the face (e.g., Oval, Square, Round)." },
                        suggestions: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    name: { type: "STRING", description: "Name of the hairstyle." },
                                    description: { type: "STRING", description: "Short visual description of the style." },
                                    reason: { type: "STRING", description: "Why this fits the face shape." },
                                    stylingAdvice: { type: "STRING", description: featureDescription },
                                },
                                required: ["name", "description", "reason", "stylingAdvice"],
                            },
                        },
                    },
                    required: ["faceShape", "suggestions"],
                },
            },
            systemInstruction: {
                parts: [{ text: "You are a professional hair stylist and makeover expert. Your suggestions should be modern, stylish, and tailored to the user's gender and face shape." }]
            },
        };

        // 5. Call Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', errorText);
            return new Response(JSON.stringify({ error: 'AI service error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const geminiData = await geminiResponse.json();
        const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            return new Response(JSON.stringify({ error: 'No response from AI' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const result = JSON.parse(textContent);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Edge function error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
