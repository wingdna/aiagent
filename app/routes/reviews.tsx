import { MetaFunction, useLoaderData } from "react-router";
import { ReviewBoard } from "../../components/views/ReviewBoard";
import { getSupabaseSystemClient } from "../../lib/supabase.server";
import { contentService } from "../../services/contentService";
import { AgentReview } from "../../types";

export const meta: MetaFunction = () => {
  return [
    { title: "Expert Intelligence Board | YouAgent OS" },
    { name: "description", content: "Neural Evaluation & Strategic Analysis of AI Agents." },
    { tagName: "link", rel: "canonical", href: "https://youagent.top/reviews" }
  ];
};

export const loader = async ({ request, context }: any) => {
    const env = context.env;
    const supabase = getSupabaseSystemClient(request, env);
    const reviews = await contentService.getAllExpertReviews(supabase);
    return { reviews };
};

export default function ReviewsRoute() {
    const { reviews } = useLoaderData() as { reviews: AgentReview[] };
    
    return (
        <div className="w-full min-h-full bg-black">
            <ReviewBoard initialReviews={reviews} />
        </div>
    );
}
