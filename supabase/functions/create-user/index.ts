// =====================================================
// EDGE FUNCTION: create-user
// Descripción: Crea usuarios de forma segura usando service_role
// Autor: AquaService
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Configuración CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Roles válidos del sistema
const VALID_ROLES = ["admin", "vendedor", "delivery", "cajero"];
const VALID_BRANCHES = ["geminis", "omega"];

// Función para respuestas CORS
function corsResponse(status: number, body: object) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Función para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para validar teléfono (opcional)
function isValidPhone(phone: string | null): boolean {
  if (!phone) return true; // Es opcional
  const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
  return phoneRegex.test(phone);
}

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verificar que sea POST
    if (req.method !== "POST") {
      return corsResponse(405, {
        success: false,
        error: "Método no permitido. Use POST.",
      });
    }

    // 2. Verificar autenticación del usuario que llama
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return corsResponse(401, {
        success: false,
        error: "No autorizado. Falta token de autenticación.",
      });
    }

    // 3. Crear cliente con el usuario autenticado para verificar permisos
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // 4. Verificar que el usuario sea admin
    const { data: { user: currentUser }, error: authError } = 
      await supabaseAuth.auth.getUser();

    if (authError || !currentUser) {
      return corsResponse(401, {
        success: false,
        error: "Token de autenticación inválido.",
      });
    }

    // 5. Verificar que el usuario actual sea admin
    const { data: currentProfile, error: profileError } = await supabaseAuth
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (profileError || !currentProfile || currentProfile.role !== "admin") {
      return corsResponse(403, {
        success: false,
        error: "Acceso denegado. Solo administradores pueden crear usuarios.",
      });
    }

    // 6. Parsear el body de la petición
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return corsResponse(400, {
        success: false,
        error: "JSON inválido en el body de la petición.",
      });
    }

    const { email, password, full_name, phone, role, branch } = body;

    // 7. Validaciones de campos obligatorios
    if (!email || !password || !full_name || !role || !branch) {
      return corsResponse(400, {
        success: false,
        error: "Faltan campos obligatorios: email, password, full_name, role, branch.",
      });
    }

    // 8. Validar formato de email
    if (!isValidEmail(email)) {
      return corsResponse(400, {
        success: false,
        error: "Formato de email inválido.",
      });
    }

    // 9. Validar longitud de contraseña
    if (password.length < 6) {
      return corsResponse(400, {
        success: false,
        error: "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    // 10. Validar nombre completo
    if (full_name.trim().length < 3) {
      return corsResponse(400, {
        success: false,
        error: "El nombre completo debe tener al menos 3 caracteres.",
      });
    }

    // 11. Validar teléfono si se proporciona
    if (phone && !isValidPhone(phone)) {
      return corsResponse(400, {
        success: false,
        error: "Formato de teléfono inválido.",
      });
    }

    // 12. Validar rol
    if (!VALID_ROLES.includes(role)) {
      return corsResponse(400, {
        success: false,
        error: `Rol inválido. Debe ser uno de: ${VALID_ROLES.join(", ")}.`,
      });
    }

    // 13. Validar sucursal
    if (!VALID_BRANCHES.includes(branch)) {
      return corsResponse(400, {
        success: false,
        error: `Sucursal inválida. Debe ser una de: ${VALID_BRANCHES.join(", ")}.`,
      });
    }

    // 14. Crear cliente admin con service_role (SEGURIDAD MÁXIMA)
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 15. Verificar si el email ya existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      return corsResponse(409, {
        success: false,
        error: "Ya existe un usuario con ese email.",
      });
    }

    // 16. Crear el usuario en auth.users
    const { data: authData, error: authCreateError } = 
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
          role: role,
          branch: branch,
          phone: phone || null,
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
        },
      });

    if (authCreateError) {
      console.error("Error creando usuario en auth:", authCreateError);
      
      // Mensajes de error más amigables
      let errorMessage = "Error al crear el usuario.";
      if (authCreateError.message.includes("already")) {
        errorMessage = "Ya existe un usuario con ese email.";
      } else if (authCreateError.message.includes("weak")) {
        errorMessage = "La contraseña es muy débil.";
      }
      
      return corsResponse(400, {
        success: false,
        error: errorMessage,
      });
    }

    // 17. Verificar que el trigger creó el perfil
    // Esperar un momento para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: profile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    // 18. Si el perfil no existe o tiene datos incorrectos, actualizarlo
    if (profileCheckError || !profile) {
      // Crear el perfil manualmente
      const { error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authData.user.id,
          full_name: full_name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone || null,
          role: role,
          branch: branch,
          is_active: true,
        });

      if (insertError) {
        console.error("Error creando perfil:", insertError);
        // El usuario se creó pero el perfil no, esto es crítico
        return corsResponse(500, {
          success: false,
          error: "Usuario creado pero error al crear perfil. Contacte al administrador.",
        });
      }
    } else {
      // Actualizar el perfil con los datos correctos (por si el trigger usó valores por defecto)
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: full_name.trim(),
          phone: phone || null,
          role: role,
          branch: branch,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id);

      if (updateError) {
        console.error("Error actualizando perfil:", updateError);
      }
    }

    // 19. Éxito - Devolver respuesta
    return corsResponse(200, {
      success: true,
      message: `Usuario ${full_name} creado exitosamente.`,
      user_id: authData.user.id,
      email: email.toLowerCase().trim(),
      role: role,
      branch: branch,
    });

  } catch (error) {
    // Error inesperado
    console.error("Error inesperado en create-user:", error);
    
    return corsResponse(500, {
      success: false,
      error: "Error interno del servidor. Intente nuevamente.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});