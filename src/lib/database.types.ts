// Database type definitions for Supabase
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: 'owner' | 'admin' | 'staff'
                    is_active: boolean
                    invited_by: string | null
                    last_sign_in_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    role?: 'owner' | 'admin' | 'staff'
                    is_active?: boolean
                    invited_by?: string | null
                    last_sign_in_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role?: 'owner' | 'admin' | 'staff'
                    is_active?: boolean
                    invited_by?: string | null
                    last_sign_in_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            clients: {
                Row: {
                    id: string
                    name: string
                    clickup_folder: string | null
                    contact_name: string | null
                    contact_email: string | null
                    contact_phone: string | null
                    tiktok_username: string | null
                    tiktok_password: string | null
                    snapchat_ad_account_id: string | null
                    snapchat_ad_account_name: string | null
                    facebook_username: string | null
                    facebook_password: string | null
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    clickup_folder?: string | null
                    contact_name?: string | null
                    contact_email?: string | null
                    contact_phone?: string | null
                    tiktok_username?: string | null
                    tiktok_password?: string | null
                    snapchat_ad_account_id?: string | null
                    snapchat_ad_account_name?: string | null
                    facebook_username?: string | null
                    facebook_password?: string | null
                    created_by: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    clickup_folder?: string | null
                    contact_name?: string | null
                    contact_email?: string | null
                    contact_phone?: string | null
                    tiktok_username?: string | null
                    tiktok_password?: string | null
                    snapchat_ad_account_id?: string | null
                    snapchat_ad_account_name?: string | null
                    facebook_username?: string | null
                    facebook_password?: string | null
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            campaigns: {
                Row: {
                    id: string
                    client_id: string
                    name: string
                    platform: 'tiktok' | 'snapchat' | 'facebook'
                    campaign_data: Json
                    status: 'active' | 'paused' | 'completed'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    client_id: string
                    name: string
                    platform: 'tiktok' | 'snapchat' | 'facebook'
                    campaign_data?: Json
                    status?: 'active' | 'paused' | 'completed'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    client_id?: string
                    name?: string
                    platform?: 'tiktok' | 'snapchat' | 'facebook'
                    campaign_data?: Json
                    status?: 'active' | 'paused' | 'completed'
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: 'owner' | 'admin' | 'staff'
            campaign_status: 'active' | 'paused' | 'completed'
            platform_type: 'tiktok' | 'snapchat' | 'facebook'
        }
    }
}
