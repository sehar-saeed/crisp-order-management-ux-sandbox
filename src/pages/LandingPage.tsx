import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Card, Headline, Button, Flex } from '../ui';
import { useSession } from '../mock/SessionProvider';
import { notificationService } from '../services/NotificationService';

interface RecentOrder {
  id: string;
  customerName: string;
  amount: number;
  status: 'Completed' | 'Processing' | 'Pending';
  date: string;
}

const recentOrders: RecentOrder[] = [
  { id: 'PO-2025-001', customerName: 'Walmart', amount: 24850.0, status: 'Completed', date: '2025-03-20' },
  { id: 'PO-2025-002', customerName: 'Kroger', amount: 13420.5, status: 'Processing', date: '2025-03-19' },
  { id: 'PO-2025-003', customerName: 'Target', amount: 8975.25, status: 'Completed', date: '2025-03-18' },
  { id: 'PO-2025-004', customerName: 'Costco', amount: 67230.0, status: 'Pending', date: '2025-03-17' },
];

const statusColors: Record<RecentOrder['status'], string> = {
  Completed: '#22c55e',
  Processing: '#f59e0b',
  Pending: '#ef4444',
};

const StatusBadge: React.FC<{ status: RecentOrder['status'] }> = ({ status }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
      color: '#fff',
      background: statusColors[status],
    }}
  >
    {status}
  </span>
);

const featureCards = [
  { title: 'Incoming Data', description: 'Monitor and manage incoming EDI and uploaded data records', path: '/incoming-data', icon: '📥' },
  { title: 'View Orders', description: 'Browse, search, and manage purchase orders', path: '/orders', icon: '📋' },
  { title: 'My Commissions', description: 'View your sales commission reports and details', path: null, icon: '💰' },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSession();

  const handleComingSoon = () => {
    notificationService.info('Coming soon');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <Headline as="h1">Welcome back, {user.name} 👋</Headline>

      <Card style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <Headline as="h2">Sales Dashboard</Headline>
        <p style={{ color: 'var(--cool-gray-50)', margin: '0.5rem 0 1rem' }}>
          Quick access to your key sales tools and reports.
        </p>
        <Flex style={{ gap: '1rem' }}>
          <Button onClick={handleComingSoon}>Create New Order</Button>
          <Button variant="secondary" onClick={handleComingSoon}>View My Commissions</Button>
        </Flex>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
        {featureCards.map((card) => (
          <Card
            key={card.title}
            style={{ padding: '1.5rem', cursor: 'pointer' }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{card.icon}</div>
            <Headline as="h3">{card.title}</Headline>
            <p style={{ color: 'var(--cool-gray-50)', fontSize: '14px', margin: '0.5rem 0 1rem' }}>
              {card.description}
            </p>
            <Button
              variant="secondary"
              size="S"
              onClick={() => (card.path ? navigate(card.path) : handleComingSoon())}
            >
              {card.path ? 'Go' : 'Coming Soon'}
            </Button>
          </Card>
        ))}
      </div>

      <Panel style={{ marginTop: '2rem', padding: '1.5rem' }}>
        <Headline as="h2">Recent Orders</Headline>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--cool-gray-90)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Order ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
              <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--cool-gray-90)' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{order.id}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{order.customerName}</td>
                <td style={{ padding: '0.75rem 1rem' }}>${order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={order.status} /></td>
                <td style={{ padding: '0.75rem 1rem' }}>{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Button variant="secondary" onClick={() => navigate('/orders')}>View All Orders</Button>
        </div>
      </Panel>
    </div>
  );
};
