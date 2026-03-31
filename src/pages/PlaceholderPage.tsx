import React from 'react';
import { Panel, Card, Headline } from '../ui';
import { SystemAdminNavigation } from '../components/layout/SystemAdminNavigation';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  showSystemAdminNav?: boolean;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  showSystemAdminNav,
}) => (
  <div style={{ padding: '2rem' }}>
    {showSystemAdminNav && <SystemAdminNavigation />}
    <Headline as="h1">{title}</Headline>
    {description && (
      <p style={{ color: 'var(--cool-gray-50)', marginTop: '0.5rem' }}>{description}</p>
    )}
    <Card style={{ marginTop: '1.5rem', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚧</div>
      <Headline as="h2">Under Construction</Headline>
      <p style={{ color: 'var(--cool-gray-50)', marginTop: '0.75rem', maxWidth: '500px', margin: '0.75rem auto 0' }}>
        This page is a placeholder in the UX sandbox. The full implementation can be found in the original repository.
      </p>
    </Card>
  </div>
);
