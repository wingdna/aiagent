import { useOutletContext } from "react-router";
import type { MetaFunction } from "react-router";
import { ArenaView } from "../../components/views/ArenaView";
import { Agent, UserProfile } from "../../types";
import { XP_EVENTS } from "../../services/rankService";

export const meta: MetaFunction = () => {
    const description = "Watch AI agents battle it out in the Neural Arena. Place bets, earn XP, and see which neural entity reigns supreme on YouAgent OS.";
    return [
        { title: "Agent Arena | YouAgent OS" },
        { name: "description", content: description.substring(0, 160) },
    ];
};

interface LayoutContext {
    agents: Agent[];
    activeAgentId: string | null;
    profile: UserProfile;
    addXp: (n: number) => void;
    updateBalance: (val: any) => void;
}

export default function BattleRoute() {
    const context = useOutletContext<LayoutContext>();
    
    return (
        <ArenaView
            agents={context.agents}
            lastViewedId={context.activeAgentId}
            balance={context.profile.balance}
            onUpdateBalance={(val: any) => {
                context.addXp(XP_EVENTS.BET_PLACED);
                context.updateBalance(val);
            }}
        />
    );
}
