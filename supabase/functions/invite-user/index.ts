import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get Supabase client with SERVICE ROLE key
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Get authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'No authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Verify the user's JWT token
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Check if user is admin or owner
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role, is_active')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return new Response(
                JSON.stringify({ error: 'Profile not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!['admin', 'owner'].includes(profile.role) || !profile.is_active) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Only admins and owners can invite users' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Get request body
        const { email, full_name, role } = await req.json()

        if (!email || !full_name || !role) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: email, full_name, role' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate role
        if (!['owner', 'admin', 'staff'].includes(role)) {
            return new Response(
                JSON.stringify({ error: 'Invalid role. Must be: owner, admin, or staff' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Invite user via Admin API
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            email,
            {
                data: {
                    full_name,
                    role
                },
                redirectTo: `${req.headers.get('origin')}/set-password`
            }
        )

        if (inviteError) {
            // Check if user already exists
            if (inviteError.message.includes('already been invited') || inviteError.message.includes('already registered')) {
                // User already exists, try to get their ID and update profile
                const { data: existingUser, error: existingUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email)

                if (existingUserError || !existingUser.user) {
                    return new Response(
                        JSON.stringify({ error: 'User already exists but could not be retrieved' }),
                        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }

                // Update existing profile instead of creating new one
                const { error: profileUpdateError } = await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        id: existingUser.user.id,
                        email,
                        full_name,
                        role,
                        invited_by: user.id,
                        is_active: true
                    }, {
                        onConflict: 'id'
                    })

                if (profileUpdateError) {
                    console.error('Error updating profile:', profileUpdateError)
                    return new Response(
                        JSON.stringify({ error: 'Failed to update user profile', details: profileUpdateError.message }),
                        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: 'User already exists, invitation re-sent',
                        user: {
                            id: existingUser.user.id,
                            email: existingUser.user.email
                        }
                    }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            return new Response(
                JSON.stringify({ error: inviteError.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create or update profile entry (use upsert to handle potential duplicates)
        const { error: profileInsertError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: inviteData.user.id,
                email,
                full_name,
                role,
                invited_by: user.id,
                is_active: true
            }, {
                onConflict: 'id'
            })

        if (profileInsertError) {
            console.error('Error creating profile:', profileInsertError)
            return new Response(
                JSON.stringify({ error: 'User invited but profile creation failed', details: profileInsertError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: true,
                user: {
                    id: inviteData.user.id,
                    email: inviteData.user.email
                }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
