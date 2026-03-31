
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") || "/";

    if (!code) {
      navigate("/?error=auth_failed");
      return;
    }

    if (!supabase) {
      setError("Supabase client not initialized");
      setTimeout(() => navigate("/?error=auth_failed"), 3000);
      return;
    }

    let isNavigating = false;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (isNavigating) return;
      if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
        isNavigating = true;
        navigate(next);
      }
    });

    let timeoutId: any;

    const exchangeCode = async () => {
      try {
        if (!supabase) throw new Error("Supabase client not initialized");
        
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          // If it fails, it might be because detectSessionInUrl already exchanged it.
          // Wait a bit and check if we have a session.
          timeoutId = setTimeout(async () => {
            if (isNavigating || !supabase) return;
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              isNavigating = true;
              navigate(next);
              return;
            }
            
            console.error("Auth Callback Exchange Error:", exchangeError.message);
            setError(exchangeError.message);
            timeoutId = setTimeout(() => navigate("/?error=auth_failed"), 3000);
          }, 1000);
        } else {
          if (!isNavigating) {
            isNavigating = true;
            navigate(next);
          }
        }
      } catch (err: any) {
        console.error("Auth Callback Exception:", err.message);
        setError(err.message);
        timeoutId = setTimeout(() => navigate("/?error=auth_failed"), 3000);
      }
    };

    exchangeCode();

    return () => {
      authListener.subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
      <div className="text-cyan-500 animate-pulse text-xl mb-4">
        {error ? "Authentication Failed" : "Establishing Neural Link..."}
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
}
