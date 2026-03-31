import { LoaderFunction } from "react-router";
import { agentQueryService } from "../../services/agentQueryService";

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing agent ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const agent = await agentQueryService.getAgentById(id);
    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(agent), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[API Agent Detail] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
