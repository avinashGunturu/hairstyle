// Supabase Edge Function: generate-hairstyle
// Generates AI hairstyle image with user's face
// SECURE: Credit deduction happens server-side
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanBase64 = (base64: string) => {
    return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

Deno.serve(async (req) => {
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

        // Create user client for auth verification
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

        console.log('User authenticated:', user.id);

        // 2. Create admin client for credit operations (bypasses RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 3. Check user has credits (SERVER-SIDE - SECURE)
        const { data: userCredits, error: creditError } = await supabaseAdmin
            .from('user_credits')
            .select('credits')
            .eq('user_id', user.id)
            .single();

        if (creditError) {
            console.error('Error fetching credits:', creditError);
            return new Response(JSON.stringify({ error: 'Failed to verify credits' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const currentCredits = userCredits?.credits || 0;

        if (currentCredits <= 0) {
            console.log('User has no credits:', user.id);
            return new Response(JSON.stringify({
                error: 'NO_CREDITS',
                message: 'Insufficient credits. Please purchase more to continue.'
            }), {
                status: 402, // Payment Required
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log('User has credits:', currentCredits);

        // 4. Parse request body
        const body = await req.json();
        const base64Image = body.base64Image || body.im;
        const stylePrompt = body.stylePrompt;

        if (!base64Image || !stylePrompt) {
            return new Response(JSON.stringify({ error: 'Missing required fields: base64Image, stylePrompt' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 5. DEDUCT CREDIT BEFORE API CALL (SERVER-SIDE - SECURE)
        const newBalance = currentCredits - 1;
        const { error: deductError } = await supabaseAdmin
            .from('user_credits')
            .update({
                credits: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

        if (deductError) {
            console.error('Failed to deduct credit:', deductError);
            return new Response(JSON.stringify({ error: 'Failed to process credit' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log('Credit deducted:', currentCredits, '->', newBalance);

        // 6. Log the credit transaction
        await supabaseAdmin
            .from('credit_transactions')
            .insert({
                user_id: user.id,
                transaction_type: 'usage',
                credits_change: -1,
                balance_after: newBalance,
                description: `Generated style: ${stylePrompt}`,
                related_to: 'style_generation'
            });

        // 7. Get Gemini API key
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
            // Refund credit since we can't generate
            await supabaseAdmin
                .from('user_credits')
                .update({ credits: currentCredits })
                .eq('user_id', user.id);

            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 8. Build the request
        const finalPrompt = `Keep the person's face exactly the same. Change the hairstyle to ${stylePrompt}. High quality, photorealistic, cinematic lighting.`;

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
                        { text: finalPrompt },
                    ],
                },
            ],
            generationConfig: {
                responseModalities: ["IMAGE"],
            },
        };

        // 9. Call Gemini API (image generation model)
        console.log('Calling Gemini API for image generation...');
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', errorText);

            // Refund credit on API failure
            await supabaseAdmin
                .from('user_credits')
                .update({ credits: currentCredits })
                .eq('user_id', user.id);
            console.log('Credit refunded due to API error');

            return new Response(JSON.stringify({ error: 'AI service error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const geminiData = await geminiResponse.json();

        // Check for safety violations
        const candidate = geminiData.candidates?.[0];
        if (candidate?.finishReason === 'SAFETY') {
            // Refund credit on safety violation
            await supabaseAdmin
                .from('user_credits')
                .update({ credits: currentCredits })
                .eq('user_id', user.id);
            console.log('Credit refunded due to safety violation');

            return new Response(JSON.stringify({ error: 'SAFETY_VIOLATION' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Extract image data
        const parts = candidate?.content?.parts;
        if (parts && parts.length > 0) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    console.log('Image generated successfully');
                    return new Response(JSON.stringify({
                        image: `data:image/png;base64,${part.inlineData.data}`,
                        creditsRemaining: newBalance
                    }), {
                        status: 200,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }
            }
        }

        // No image generated - refund credit
        await supabaseAdmin
            .from('user_credits')
            .update({ credits: currentCredits })
            .eq('user_id', user.id);
        console.log('Credit refunded - no image generated');

        return new Response(JSON.stringify({ error: 'No image generated' }), {
            status: 500,
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
