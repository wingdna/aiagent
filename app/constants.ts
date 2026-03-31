/**
 * 🛡️ Protocol V30.0: Partytown Script Type
 * In development mode, we downgrade Partytown scripts to ordinary javascript scripts
 * to ensure compatibility with HMR and dev tools.
 */
export const PARTYTOWN_SCRIPT_TYPE = import.meta.env.DEV ? "text/javascript" : "text/partytown";
