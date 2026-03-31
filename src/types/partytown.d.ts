declare module '@builder.io/partytown/react' {
  import { ReactNode } from 'react';
  export interface PartytownProps {
    debug?: boolean;
    forward?: string[];
    lib?: string;
    loadScriptsOnMainThread?: string[];
    nonce?: string;
    resolveUrl?: (url: URL, location: URL, type: string) => URL | undefined;
  }
  export const Partytown: (props: PartytownProps) => ReactNode;
}
