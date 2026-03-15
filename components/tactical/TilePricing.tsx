import React from 'react';
import { Agent } from '../../types';
import { PricingMatrix } from './PricingMatrix';

interface TilePricingProps {
    agent: Agent;
}

export const TilePricing: React.FC<TilePricingProps> = ({ agent }) => {
    return (
        <div className="h-full flex flex-col">
            <PricingMatrix agent={agent} />
        </div>
    );
};
