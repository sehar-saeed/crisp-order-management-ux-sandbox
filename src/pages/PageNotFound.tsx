import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Headline, Button } from '../ui';

export const PageNotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Panel style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      alignItems: 'center', minHeight: '400px', textAlign: 'center', margin: '2rem',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</div>
      <Headline as="h1">Page Not Found</Headline>
      <p style={{ color: 'var(--cool-gray-50)', margin: '1rem 0 2rem' }}>
        The page you're looking for doesn't exist.
      </p>
      <Button onClick={() => navigate('/')}>Go Home</Button>
    </Panel>
  );
};
