import { redirect } from "react-router";
import { getSupabaseSystemClient } from "../../lib/supabase.server";

export const loader = async ({ request, context }: any) => {
  const headers = new Headers();
  const supabase = getSupabaseSystemClient(request, context.env, headers);
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return redirect("/", { headers });
  }

  return redirect(`/profile/${session.user.id}`, { headers });
};

export default function ProfileRedirect() {
  return null;
}
