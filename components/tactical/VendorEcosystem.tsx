import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Agent } from '../../types';
import { dataService } from '../../services/dataService';
import { OverlayAgentCard } from '../ui/OverlayAgentCard';

interface VendorEcosystemProps {
    vendorSlug?: string;
    currentAgentId: string;
}

export const VendorEcosystem: React.FC<VendorEcosystemProps> = ({ vendorSlug, currentAgentId }) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!vendorSlug) {
            setLoading(false);
            return;
        }

        const fetchEcosystem = async () => {
            try {
                const data = await dataService.getAgentsByVendor(vendorSlug, currentAgentId);
                setAgents(data);
            } catch (e) {
                console.error("Vendor ecosystem fetch failed", e);
            } finally {
                setLoading(false);
            }
        };

        fetchEcosystem();
    }, [vendorSlug, currentAgentId]);

    if (loading) return <div className="h-24 animate-pulse bg-gray-900/20 rounded-xl mt-8 border border-white/5" />;
    if (!agents.length) return null;

    return (
        <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-mono text-cyan-500 tracking-wider uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
                    VENDOR_ECOSYSTEM_SYNC
                </h3>
                <Link 
                    to={`/vendor/${vendorSlug}`}
                    className="text-[10px] font-mono text-gray-500 hover:text-white transition-colors flex items-center gap-2 group"
                >
                    VIEW_ALL_UNITS <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {agents.slice(0, 5).map(agent => (
                    <OverlayAgentCard key={agent.id} agent={agent} className="w-full h-24 sm:h-28" />
                ))}
            </div>
        </div>
    );
};
