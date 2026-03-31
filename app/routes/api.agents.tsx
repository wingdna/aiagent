import { LoaderFunction } from "react-router";
import { dataService } from "../../services/dataService";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") || "ALL";
  const q = url.searchParams.get("q");
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const page = parseInt(url.searchParams.get("page") || "0", 10);
  const sortBy = url.searchParams.get("sortBy") || "hot";
  const order = url.searchParams.get("order") || "desc";

  // Fetch agents using the agentQueryService directly for full data
  const { agentQueryService } = await import("../../services/agentQueryService");
  const agents = await agentQueryService.getAgents(page, limit, category, sortBy, order, q);

  // Return Response with required headers
  return new Response(
    JSON.stringify({
      status: "success",
      data: agents,
      meta: { total: agents.length, page: page + 1 },
    }),
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600",
      },
    }
  );
};
