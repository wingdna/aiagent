import { useLocation, Navigate, Link } from "react-router";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
    const description = "The requested neural path does not exist. Return to base to discover cutting-edge AI agents on YouAgent OS.";
    return [
        { title: "404 Not Found | YouAgent OS" },
        { name: "description", content: description.substring(0, 160) },
    ];
};

export default function CatchAll() {
    const location = useLocation();
    
    // If it's a legacy route or something we want to handle specially
    if (location.pathname === '/old-route') {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-mono">
            <h1 className="text-4xl mb-4 text-red-500">404: NODE_NOT_FOUND</h1>
            <p className="text-gray-500 mb-8">The requested neural path does not exist in the current nexus.</p>
            <Link to="/" className="px-6 py-3 border border-cyan-500 text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-all">
                RETURN_TO_BASE
            </Link>
        </div>
    );
}
