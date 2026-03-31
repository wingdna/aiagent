
import { Link, useLocation } from 'react-router';
import { m, AnimatePresence } from 'framer-motion';
import { 
  Compass, Swords, Layers, Trophy, 
  Search, Key, LogIn, LogOut, Shield, User, BookOpen, List, FileText
} from 'lucide-react';
import { UserProfile, UserRank } from '../../types';
import { getRankInfo } from '../../services/rankService';
import { UIState, useUIStore } from '../../stores/useUIStore';

interface CommandRailProps {
    userProfile: UserProfile;
    isLoggedIn: boolean;
    onLogoutClick: () => void;
    onToggleCommander: () => void;
    isCommanderOpen: boolean;
}

interface RailButtonProps {
    icon: any;
    label: string;
    active: boolean;
    to?: string;
    onClick?: () => void;
    color?: string;
    glow?: boolean;
}

const RailButton = ({ icon: Icon, label, active, to, onClick, color = "text-cyan-400", glow = false }: RailButtonProps) => {
    const content = (
        <>
            <Icon size={22} className={active && glow ? 'animate-pulse' : ''} />
            {active && (
                <m.div 
                    layoutId="active-glow"
                    className={`absolute inset-0 rounded-xl border-2 opacity-50 ${active ? 'border-current' : 'border-transparent'}`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            )}
        </>
    );

    const className = `relative z-10 p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${
        active 
            ? `bg-white/10 ${color} shadow-[0_0_20px_rgba(255,255,255,0.1)]` 
            : 'text-gray-500 hover:text-white hover:bg-white/5'
    }`;

    return (
        <div className="relative group flex items-center justify-center w-full py-3">
            {to ? (
                <Link to={to} className={className} onClick={onClick}>
                    {content}
                </Link>
            ) : (
                <button onClick={onClick} className={className} aria-label={label}>
                    {content}
                </button>
            )}
            
            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-black border border-white/10 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none z-[60] shadow-2xl">
                <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-white/10"></div>
                {label}
            </div>
        </div>
    );
};

export const CommandRail: React.FC<CommandRailProps> = ({
    userProfile,
    isLoggedIn,
    onLogoutClick,
    onToggleCommander,
    isCommanderOpen
}) => {
    const rank: UserRank = getRankInfo(userProfile.xp);
    const location = useLocation();
    const setShowLogin = useUIStore((state: UIState) => state.setShowLogin);
    const setShowKeyVault = useUIStore((state: UIState) => state.setShowKeyVault);

    const isActive = (path: string) => {
        const currentPath = location.pathname;
        
        // List of all specific paths that have their own buttons
        const specificPaths = ['/blog', '/battle', '/workflow', '/rankings', '/directory'];
        
        if (path === '/') {
            // Discovery is active if:
            // 1. We are at root
            // 2. We are on an agent detail page (not lounge)
            // 3. We are on any other page that doesn't match the specific buttons (fallback)
            const isOnOtherSpecificPage = specificPaths.some(p => currentPath.startsWith(p));
            
            // Special case: agent lounge is NOT discovery
            if (currentPath.startsWith('/agent/') && currentPath.endsWith('/lounge')) {
                return false;
            }

            return currentPath === '/' || 
                   currentPath.startsWith('/agent/') || 
                   !isOnOtherSpecificPage;
        }
        
        return currentPath.startsWith(path);
    };

    return (
        <>
            {/* Desktop Command Rail */}
            <aside className="h-screen w-20 z-50 bg-black/40 backdrop-blur-xl border-r border-cyan-500/20 hidden md:flex flex-col items-center py-8">
                
                {/* Top: Primary Navigation */}
                <div className="flex flex-col items-center w-full gap-2 px-2">
                    <RailButton 
                        icon={Compass} 
                        label="DISCOVER_NEXUS" 
                        active={isActive('/')} 
                        to="/"
                        color="text-cyan-400"
                    />
                    <RailButton 
                        icon={BookOpen} 
                        label="NEURAL_BLOG" 
                        active={isActive('/blog')} 
                        to="/blog"
                        color="text-purple-500"
                    />
                    <RailButton 
                        icon={Trophy} 
                        label="GLOBAL_STANDINGS" 
                        active={isActive('/rankings')} 
                        to="/rankings"
                        color="text-yellow-500"
                    />
                    <RailButton 
                        icon={List} 
                        label="AGENT_DIRECTORY" 
                        active={isActive('/directory')} 
                        to="/directory"
                        color="text-green-500"
                    />
                </div>

                {/* Middle: Tactical Review Trigger & Combat/Workflow */}
                <div className="my-auto w-full flex flex-col items-center gap-4">
                    <div className="w-10 h-px bg-white/5" />
                    <RailButton 
                        icon={FileText} 
                        label="EXPERT_REVIEWS" 
                        active={isActive('/reviews')} 
                        to="/reviews"
                        color="text-cyan-400"
                        glow
                    />
                    <RailButton 
                        icon={Swords} 
                        label="ARENA_SKIRMISH" 
                        active={isActive('/battle')} 
                        to="/battle"
                        color="text-red-500"
                    />
                    <RailButton 
                        icon={Layers} 
                        label="WORKFLOW_ENGINE" 
                        active={isActive('/workflow')} 
                        to="/workflow"
                        color="text-blue-500"
                    />
                    <div className="w-10 h-px bg-white/5" />
                </div>

                {/* Bottom: System Controls & Profile */}
                <div className="flex flex-col items-center w-full gap-2 px-2 pb-4">
                    <RailButton 
                        icon={Key} 
                        label="ENCRYPTION_KEYS" 
                        active={false} 
                        onClick={() => setShowKeyVault(true)} 
                        color="text-amber-500"
                    />
                    
                    <div className="mt-4 w-full flex justify-center border-t border-white/5 pt-4">
                        <div className="relative group">
                            {isLoggedIn ? (
                                <Link 
                                    to="/profile"
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 border overflow-hidden border-cyan-500/50 bg-cyan-500/5`}
                                >
                                    <div className="w-full h-full p-1">
                                        <div className="w-full h-full rounded-lg bg-cyan-500 flex items-center justify-center text-black font-bold text-xs shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                                            {userProfile.username.substring(0, 1)}
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <button 
                                    onClick={() => setShowLogin(true)}
                                    aria-label="Login"
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 border overflow-hidden border-gray-800 bg-gray-900/50 hover:border-white/30`}
                                >
                                    <User size={20} className="text-gray-500 group-hover:text-white" />
                                </button>
                            )}
                            <div className="absolute left-full ml-4 px-3 py-1.5 bg-black border border-white/10 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none z-[60]">
                                {isLoggedIn ? `NODE: ${userProfile.username} (VIEW PROFILE)` : "LINK_NEURAL_IDENTITY"}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-t border-white/10 z-[100] md:hidden flex items-center justify-around px-1">
                <Link to="/" aria-label="Discover" className={`p-2 sm:p-3 ${isActive('/') ? 'text-cyan-400' : 'text-gray-500'}`}><Compass size={24} /></Link>
                <Link to="/battle" aria-label="Battle" className={`p-2 sm:p-3 ${isActive('/battle') ? 'text-red-500' : 'text-gray-500'}`}><Swords size={24} /></Link>
                <Link to="/reviews" aria-label="Reviews" className={`p-2 sm:p-3 ${isActive('/reviews') ? 'text-cyan-400 animate-pulse' : 'text-gray-500'}`}><FileText size={24} /></Link>
                <Link to="/directory" aria-label="Directory" className={`p-2 sm:p-3 ${isActive('/directory') ? 'text-green-500' : 'text-gray-500'}`}><List size={24} /></Link>
                <Link to="/workflow" aria-label="Workflow" className={`p-2 sm:p-3 ${isActive('/workflow') ? 'text-blue-500' : 'text-gray-500'}`}><Layers size={24} /></Link>
                {isLoggedIn ? (
                    <Link to="/profile" aria-label="Profile" className={`p-2 sm:p-3 ${isActive('/profile') ? 'text-cyan-400' : 'text-gray-500'}`}><Shield size={24} /></Link>
                ) : (
                    <button onClick={() => setShowLogin(true)} aria-label="Login" className="p-2 sm:p-3 text-gray-500"><LogIn size={24} /></button>
                )}
            </nav>
        </>
    );
};
