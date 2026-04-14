import type { MockParty, PartyKind } from '../../types/orderEntry';

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

export const mockDistributors: MockParty[] = [
  {
    id: 'dist-001',
    name: 'National Food Distributors',
    shortCode: 'NFD',
    billToAddress: {
      name: 'National Food Distributors LLC',
      line1: '500 Distribution Drive',
      line2: '',
      city: 'Memphis',
      state: 'TN',
      zip: '38118',
    },
    locations: [
      {
        id: 'dist-001-loc-1',
        name: 'Warehouse A – Memphis',
        address: {
          name: 'NFD Warehouse A',
          line1: '502 Distribution Drive',
          line2: 'Bay 1-12',
          city: 'Memphis',
          state: 'TN',
          zip: '38118',
        },
      },
      {
        id: 'dist-001-loc-2',
        name: 'Warehouse B – Nashville',
        address: {
          name: 'NFD Warehouse B',
          line1: '1800 Briley Pkwy',
          line2: '',
          city: 'Nashville',
          state: 'TN',
          zip: '37217',
        },
      },
    ],
  },
  {
    id: 'dist-002',
    name: 'Western Supply Co',
    shortCode: 'WSC',
    billToAddress: {
      name: 'Western Supply Company',
      line1: '7700 E Marginal Way S',
      line2: '',
      city: 'Seattle',
      state: 'WA',
      zip: '98108',
    },
    locations: [
      {
        id: 'dist-002-loc-1',
        name: 'Central DC – Seattle',
        address: {
          name: 'WSC Central DC',
          line1: '7705 E Marginal Way S',
          line2: '',
          city: 'Seattle',
          state: 'WA',
          zip: '98108',
        },
      },
    ],
  },
];

export const mockStores: MockParty[] = [
  {
    id: 'store-001',
    name: 'Store #1042 – Bentonville',
    shortCode: 'S1042',
    billToAddress: {
      name: 'Store #1042',
      line1: '610 SW 8th Street',
      line2: '',
      city: 'Bentonville',
      state: 'AR',
      zip: '72716',
    },
    locations: [],
  },
  {
    id: 'store-002',
    name: 'Store #2287 – Dallas',
    shortCode: 'S2287',
    billToAddress: {
      name: 'Store #2287',
      line1: '4100 Cedar Springs Rd',
      line2: '',
      city: 'Dallas',
      state: 'TX',
      zip: '75219',
    },
    locations: [],
  },
  {
    id: 'store-003',
    name: 'Store #3510 – Minneapolis',
    shortCode: 'S3510',
    billToAddress: {
      name: 'Store #3510',
      line1: '920 Nicollet Mall',
      line2: '',
      city: 'Minneapolis',
      state: 'MN',
      zip: '55402',
    },
    locations: [],
  },
];

/**
 * Returns the party list for a given PartyKind.
 * Used by the order type system to populate from/to selectors dynamically.
 */
export function getPartiesByKind(kind: PartyKind): MockParty[] {
  switch (kind) {
    case 'retailer':    return mockRetailers;
    case 'supplier':    return mockSuppliers;
    case 'distributor': return mockDistributors;
    case 'store':       return mockStores;
  }
}
