import { LoaderFunction } from "react-router";
import { supabaseServer } from "../../lib/supabase.server";

export const loader: LoaderFunction = async () => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: "Supabase not initialized" }), { status: 500 });
  }

  const { data, error } = await supabaseServer
    .from('agents')
    .select('category');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const categories = Array.from(new Set(data.map((d: any) => d.category).filter(Boolean)));
  
  return new Response(JSON.stringify(categories), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=3600",
    },
  });
};
