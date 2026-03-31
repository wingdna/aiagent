import React from 'react';
import { AgentRegistryEntity } from '../../app/types/registry';
import { PricingMatrix } from './PricingMatrix';

interface TilePricingProps {
    agent: AgentRegistryEntity;
}

export const TilePricing: React.FC<TilePricingProps> = ({ agent }) => {
    return (
        <div className="h-full flex flex-col">
            <PricingMatrix agent={agent} />
        </div>
    );
};
