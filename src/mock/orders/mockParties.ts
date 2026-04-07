import type { MockParty } from '../../types/orderEntry';

export const mockRetailers: MockParty[] = [
  {
    id: 'ret-001',
    name: 'Walmart',
    shortCode: 'WMT',
    billToAddress: {
      name: 'Walmart Inc.',
      line1: '702 SW 8th Street',
      line2: 'Accounts Payable',
      city: 'Bentonville',
      state: 'AR',
      zip: '72716',
    },
    locations: [
      {
        id: 'ret-001-loc-1',
        name: 'DC #6032 – Bentonville',
        address: {
          name: 'Walmart DC #6032',
          line1: '1200 Warehouse Blvd',
          line2: 'Dock 4',
          city: 'Bentonville',
          state: 'AR',
          zip: '72712',
        },
      },
      {
        id: 'ret-001-loc-2',
        name: 'DC #7810 – Dallas',
        address: {
          name: 'Walmart DC #7810',
          line1: '4455 Logistics Pkwy',
          line2: '',
          city: 'Dallas',
          state: 'TX',
          zip: '75201',
        },
      },
    ],
  },
  {
    id: 'ret-002',
    name: 'Kroger',
    shortCode: 'KRG',
    billToAddress: {
      name: 'The Kroger Co.',
      line1: '1014 Vine Street',
      line2: '',
      city: 'Cincinnati',
      state: 'OH',
      zip: '45202',
    },
    locations: [
      {
        id: 'ret-002-loc-1',
        name: 'DC #501 – Cincinnati',
        address: {
          name: 'Kroger DC #501',
          line1: '880 Industrial Way',
          line2: '',
          city: 'Cincinnati',
          state: 'OH',
          zip: '45204',
        },
      },
      {
        id: 'ret-002-loc-2',
        name: 'DC #505 – Atlanta',
        address: {
          name: 'Kroger DC #505',
          line1: '2390 Peachtree Industrial Blvd',
          line2: 'Bay C',
          city: 'Atlanta',
          state: 'GA',
          zip: '30341',
        },
      },
    ],
  },
  {
    id: 'ret-003',
    name: 'Target',
    shortCode: 'TGT',
    billToAddress: {
      name: 'Target Corporation',
      line1: '1000 Nicollet Mall',
      line2: 'TPS-3165',
      city: 'Minneapolis',
      state: 'MN',
      zip: '55403',
    },
    locations: [
      {
        id: 'ret-003-loc-1',
        name: 'DC #3880 – Fridley',
        address: {
          name: 'Target DC #3880',
          line1: '6200 Hwy 65 NE',
          line2: '',
          city: 'Fridley',
          state: 'MN',
          zip: '55432',
        },
      },
    ],
  },
  {
    id: 'ret-004',
    name: 'Costco',
    shortCode: 'COS',
    billToAddress: {
      name: 'Costco Wholesale Corp.',
      line1: '999 Lake Drive',
      line2: 'P.O. Box 34331',
      city: 'Issaquah',
      state: 'WA',
      zip: '98027',
    },
    locations: [
      {
        id: 'ret-004-loc-1',
        name: 'Depot #108 – Issaquah',
        address: {
          name: 'Costco Depot #108',
          line1: '1001 Commerce Way',
          line2: '',
          city: 'Issaquah',
          state: 'WA',
          zip: '98027',
        },
      },
      {
        id: 'ret-004-loc-2',
        name: 'Depot #214 – Ontario',
        address: {
          name: 'Costco Depot #214',
          line1: '3700 E Jurupa Street',
          line2: '',
          city: 'Ontario',
          state: 'CA',
          zip: '91761',
        },
      },
    ],
  },
  {
    id: 'ret-005',
    name: 'Whole Foods',
    shortCode: 'WFM',
    billToAddress: {
      name: 'Whole Foods Market Inc.',
      line1: '550 Bowie Street',
      line2: '',
      city: 'Austin',
      state: 'TX',
      zip: '78703',
    },
    locations: [
      {
        id: 'ret-005-loc-1',
        name: 'DC – Austin',
        address: {
          name: 'Whole Foods DC Austin',
          line1: '8500 Shoal Creek Blvd',
          line2: 'Receiving',
          city: 'Austin',
          state: 'TX',
          zip: '78757',
        },
      },
    ],
  },
];

export const mockSuppliers: MockParty[] = [
  {
    id: 'sup-001',
    name: 'Acme Foods Corp',
    shortCode: 'ACM',
    billToAddress: {
      name: 'Acme Foods Corporation',
      line1: '100 Industrial Park Drive',
      line2: 'Suite 400',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
    },
    locations: [
      {
        id: 'sup-001-loc-1',
        name: 'Plant #1 – Chicago',
        address: {
          name: 'Acme Foods Plant #1',
          line1: '2200 W Grand Avenue',
          line2: '',
          city: 'Chicago',
          state: 'IL',
          zip: '60612',
        },
      },
      {
        id: 'sup-001-loc-2',
        name: 'Warehouse – Milwaukee',
        address: {
          name: 'Acme Foods Warehouse',
          line1: '450 Canal Street',
          line2: '',
          city: 'Milwaukee',
          state: 'WI',
          zip: '53202',
        },
      },
    ],
  },
  {
    id: 'sup-002',
    name: 'Pacific Produce Co',
    shortCode: 'PPC',
    billToAddress: {
      name: 'Pacific Produce Company',
      line1: '3100 Harbor Blvd',
      line2: '',
      city: 'Long Beach',
      state: 'CA',
      zip: '90802',
    },
    locations: [
      {
        id: 'sup-002-loc-1',
        name: 'Packing House – Salinas',
        address: {
          name: 'Pacific Produce Packing',
          line1: '900 Abbott Street',
          line2: '',
          city: 'Salinas',
          state: 'CA',
          zip: '93901',
        },
      },
    ],
  },
  {
    id: 'sup-003',
    name: 'Mountain Valley Organics',
    shortCode: 'MVO',
    billToAddress: {
      name: 'Mountain Valley Organics LLC',
      line1: '87 Farm Road',
      line2: '',
      city: 'Boulder',
      state: 'CO',
      zip: '80301',
    },
    locations: [
      {
        id: 'sup-003-loc-1',
        name: 'Processing – Denver',
        address: {
          name: 'MVO Processing Center',
          line1: '1600 Blake Street',
          line2: 'Unit 8',
          city: 'Denver',
          state: 'CO',
          zip: '80202',
        },
      },
    ],
  },
  {
    id: 'sup-004',
    name: 'Great Plains Meats',
    shortCode: 'GPM',
    billToAddress: {
      name: 'Great Plains Meats Inc.',
      line1: '5520 Stockyard Road',
      line2: '',
      city: 'Omaha',
      state: 'NE',
      zip: '68102',
    },
    locations: [
      {
        id: 'sup-004-loc-1',
        name: 'Cold Storage – Omaha',
        address: {
          name: 'GPM Cold Storage',
          line1: '5525 Stockyard Road',
          line2: 'Cold Dock A',
          city: 'Omaha',
          state: 'NE',
          zip: '68102',
        },
      },
    ],
  },
  {
    id: 'sup-005',
    name: 'Coastal Seafood Inc',
    shortCode: 'CSI',
    billToAddress: {
      name: 'Coastal Seafood Incorporated',
      line1: '22 Wharf Avenue',
      line2: '',
      city: 'Portland',
      state: 'ME',
      zip: '04101',
    },
    locations: [
      {
        id: 'sup-005-loc-1',
        name: 'Processing – Portland',
        address: {
          name: 'Coastal Seafood Processing',
          line1: '25 Wharf Avenue',
          line2: '',
          city: 'Portland',
          state: 'ME',
          zip: '04101',
        },
      },
    ],
  },
];
