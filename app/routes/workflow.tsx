import { useOutletContext } from "react-router";
import type { MetaFunction } from "react-router";
import { WorkflowEngine } from "../../components/views/WorkflowView";
import { Agent } from "../../types";

export const meta: MetaFunction = () => {
    const description = "Design and execute complex AI agent workflows. Connect multiple neural entities to automate tasks and boost productivity.";
    return [
        { title: "Workflow Engine | YouAgent OS" },
        { name: "description", content: description.substring(0, 160) },
    ];
};

interface LayoutContext {
    agents: Agent[];
}

export default function WorkflowRoute() {
    const context = useOutletContext<LayoutContext>();
    
    return (
        <WorkflowEngine agents={context.agents} />
    );
}
