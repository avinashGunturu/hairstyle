// Supabase Edge Function: detect-face-shape
// FREE TOOL - Authentication is OPTIONAL
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanBase64 = (base64: string) => {
    return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // FREE TOOL - Authentication is OPTIONAL
        // We log user if authenticated but don't require it
        const authHeader = req.headers.get('Authorization');
        let userId = 'anonymous';

        if (authHeader) {
            console.log('Auth header present, but not validating for free tool');
        }

        // 1. Get Gemini API key
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not configured');
            return new Response(JSON.stringify({ error: 'Server configuration error - API key missing' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Parse request body
        const body = await req.json();
        const base64Image = body.base64Image || body.im; // Support both field names
        const gender = body.gender;
        const age = body.age;

        if (!base64Image || !gender) {
            return new Response(JSON.stringify({ error: 'Missing required fields: base64Image, gender' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log('Processing face shape detection for:', userId, 'gender:', gender);

        // 3. Build request
        const ageText = age ? `${age} year old ` : '';
        const requestBody = {
            contents: [{
                parts: [
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: cleanBase64(base64Image)
                        }
                    },
                    {
                        text: `Analyze the geometric face shape of this ${ageText}${gender}. Be precise and scientific. Focus only on structure.`
                    }
                ]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        shape: { type: "STRING", description: "The geometric face shape (e.g., Diamond, Heart, Oblong, Oval, Round, Square)." },
                        confidence: { type: "NUMBER", description: "Confidence score between 0 and 100." },
                        description: { type: "STRING", description: "A scientific description of the facial geometry." },
                        keyFeatures: {
                            type: "ARRAY",
                            items: { type: "STRING" },
                            description: "3 key facial landmarks identified."
                        }
                    },
                    required: ["shape", "confidence", "description", "keyFeatures"]
                }
            },
            systemInstruction: {
                parts: [{ text: "You are a facial geometry expert. Analyze the uploaded face strictly for face shape classification. Do not provide styling advice." }]
            }
        };

        // 4. Call Gemini API
        console.log('Calling Gemini API...');
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', errorText);
            return new Response(JSON.stringify({ error: 'AI service error', details: errorText }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const geminiData = await geminiResponse.json();
        console.log('Gemini response received');

        const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            console.error('No text content in response:', JSON.stringify(geminiData));
            return new Response(JSON.stringify({ error: 'No response from AI' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Parse and return the result
        const result = JSON.parse(textContent);

        // Add usage metadata if available
        if (geminiData.usageMetadata) {
            result.usageMetadata = {
                promptTokenCount: geminiData.usageMetadata.promptTokenCount,
                candidatesTokenCount: geminiData.usageMetadata.candidatesTokenCount,
                totalTokenCount: geminiData.usageMetadata.totalTokenCount,
            };
        }

        console.log('Success! Face shape:', result.shape);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Edge function error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', message: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
