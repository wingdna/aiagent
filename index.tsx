
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Telemetry } from './services/telemetry';

// 📡 Protocol V14.0: Ignite Telemetry Engine
// 🐢 Protocol V20.0: Defer heavy analytics slightly to prioritize TTI
setTimeout(() => {
    Telemetry.init();
}, 2000);

const container = document.getElementById('root');
const root = createRoot(container!);

// 🖼️ Protocol V20.0: Clean the pipe. Remove static loader once JS takes over.
const removeBootLoader = () => {
    const loader = document.getElementById('synapse-boot-loader');
    if (loader) {
        loader.classList.add('boot-loaded');
        // Physically remove after transition to free up DOM
        setTimeout(() => {
            if(loader.parentNode) loader.parentNode.removeChild(loader);
        }, 600);
    }
};

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Execute cleanup after render
removeBootLoader();
