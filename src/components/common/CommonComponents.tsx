import React from 'react';
import { Panel } from '../../ui';

export const ErrorState = ({ message }: { message: string }) => (
  <div style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>Error: {message}</div>
);

export const NoRowsOverlay = ({ hasSearched, entityNamePlural }: { hasSearched: boolean; entityNamePlural: string }) => (
  <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
    {hasSearched
      ? `No ${entityNamePlural.toLowerCase()} to show based on the selected filters`
      : `Click 'Load ${entityNamePlural.toLowerCase()}' to view all ${entityNamePlural.toLowerCase()}`}
  </div>
);

export const CenteredPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    {children}
  </div>
);

export const ForbiddenAccess: React.FC = () => (
  <CenteredPanel>
    <Panel style={{ padding: '3rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⛔️</div>
      <h2 style={{ color: '#d63384', marginBottom: '1rem' }}>Forbidden</h2>
      <p style={{ color: '#6c757d', fontSize: '2rem', lineHeight: '1.5' }}>
        You do not have permission to access this section.
      </p>
    </Panel>
  </CenteredPanel>
);
