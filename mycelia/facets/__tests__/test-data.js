/**
 * Test Data - Realistic GEDCOM structures
 * Based on actual test data from /apps/temp-family-tree-code/gedcom-go/testdata/xavier.ged
 * 
 * This represents what the Go API returns after parsing GEDCOM files.
 */

// File metadata (what the API returns for uploaded files)
export const mockFileMetadata = {
  file_id: 'xavier-test-123',
  name: 'Xavier Family Tree',
  size: 103424, // ~101KB like xavier.ged
  upload_date: '2026-01-27T10:00:00Z',
  individual_count: 150,
  family_count: 75,
  source: 'Gramps 4.0.3',
  gedcom_version: '5.5',
  charset: 'UTF-8'
};

// Individuals from xavier.ged
export const mockIndividuals = [
  {
    xref: 'I0069',
    name: {
      full: 'Augustinho Thomas Gonsalves',
      given: 'Augustinho Thomas',
      surname: 'Gonsalves'
    },
    sex: 'M',
    birth: {
      date: '18 FEB 1894',
      place: 'Bladen Hall, British Guiana'
    },
    death: {
      date: '12 MAY 1998',
      place: 'Toronto, Canada'
    },
    families: {
      spouse: ['F0297']
    }
  },
  {
    xref: 'I0263',
    name: {
      full: 'Lucia Cecilia Xavier',
      given: 'Lucia Cecilia',
      surname: 'Xavier'
    },
    sex: 'F',
    birth: {
      date: '14 FEB 1896',
      place: 'British Guiana'
    },
    death: {
      date: '23 AUG 1967',
      place: 'Guyana'
    },
    families: {
      child: ['F0374'],
      spouse: ['F0297']
    }
  },
  {
    xref: 'I0176',
    name: {
      full: 'Antonio Rodrigues',
      given: 'Antonio',
      surname: 'Rodrigues'
    },
    sex: 'M',
    birth: {
      date: '1889',
      place: 'British Guiana'
    },
    death: {
      date: '4 FEB 1934',
      place: 'British Guiana'
    },
    families: {
      spouse: ['F0299', 'F0346', 'F0579']
    }
  },
  {
    xref: 'I0264',
    name: {
      full: 'Francis Xavier',
      given: 'Francis',
      surname: 'Xavier'
    },
    sex: 'M',
    birth: {
      date: '1866',
      place: 'British Guiana'
    },
    death: {
      date: '26 JUN 1909',
      place: 'British Guiana'
    },
    families: {
      spouse: ['F0374']
    }
  },
  {
    xref: 'I0265',
    name: {
      full: 'Carlotta Baptista',
      given: 'Carlotta',
      surname: 'Baptista',
      nickname: 'Charlotte'
    },
    sex: 'F',
    birth: {
      date: '1864',
      place: 'British Guiana'
    },
    death: {
      date: '16 DEC 1928',
      place: 'British Guiana'
    },
    families: {
      child: ['F0375'],
      spouse: ['F0374']
    }
  }
];

// Children of I0069 and I0263 (from family F0297)
export const mockChildren = [
  {
    xref: 'I0266',
    name: { full: 'Child One Gonsalves', given: 'Child One', surname: 'Gonsalves' },
    sex: 'M',
    families: { child: ['F0297'] }
  },
  {
    xref: 'I0267',
    name: { full: 'Child Two Gonsalves', given: 'Child Two', surname: 'Gonsalves' },
    sex: 'F',
    families: { child: ['F0297'] }
  },
  {
    xref: 'I0268',
    name: { full: 'Child Three Gonsalves', given: 'Child Three', surname: 'Gonsalves' },
    sex: 'M',
    families: { child: ['F0297'] }
  }
];

// Parents of I0263 (from family F0374)
export const mockParents = [
  {
    xref: 'I0264',
    name: { full: 'Francis Xavier', given: 'Francis', surname: 'Xavier' },
    sex: 'M',
    relation: 'father'
  },
  {
    xref: 'I0265',
    name: { full: 'Carlotta Baptista', given: 'Carlotta', surname: 'Baptista' },
    sex: 'F',
    relation: 'mother'
  }
];

// Family F0297 - Augustinho Thomas Gonsalves & Lucia Cecilia Xavier
export const mockFamily = {
  xref: 'F0297',
  husband: {
    xref: 'I0069',
    name: { full: 'Augustinho Thomas Gonsalves' }
  },
  wife: {
    xref: 'I0263',
    name: { full: 'Lucia Cecilia Xavier' }
  },
  children: [
    { xref: 'I0266', name: { full: 'Child One Gonsalves' } },
    { xref: 'I0267', name: { full: 'Child Two Gonsalves' } },
    { xref: 'I0268', name: { full: 'Child Three Gonsalves' } },
    { xref: 'I0269', name: { full: 'Child Four Gonsalves' } },
    { xref: 'I0270', name: { full: 'Child Five Gonsalves' } },
    { xref: 'I0271', name: { full: 'Child Six Gonsalves' } },
    { xref: 'I0272', name: { full: 'Child Seven Gonsalves' } },
    { xref: 'I0273', name: { full: 'Child Eight Gonsalves' } },
    { xref: 'I0274', name: { full: 'Child Nine Gonsalves' } }
  ],
  marriage: {
    date: '1915',
    place: 'British Guiana'
  }
};

// Multiple families (list response)
export const mockFamilies = [
  {
    xref: 'F0297',
    husband: { xref: 'I0069', name: { full: 'Augustinho Thomas Gonsalves' } },
    wife: { xref: 'I0263', name: { full: 'Lucia Cecilia Xavier' } },
    children_count: 9
  },
  {
    xref: 'F0374',
    husband: { xref: 'I0264', name: { full: 'Francis Xavier' } },
    wife: { xref: 'I0265', name: { full: 'Carlotta Baptista' } },
    children_count: 5
  },
  {
    xref: 'F0299',
    husband: { xref: 'I0176', name: { full: 'Antonio Rodrigues' } },
    children_count: 3
  }
];

// Siblings (sharing same parents F0297)
export const mockSiblings = [
  {
    xref: 'I0267',
    name: { full: 'Child Two Gonsalves', given: 'Child Two', surname: 'Gonsalves' },
    sex: 'F',
    birth: { date: '1918' }
  },
  {
    xref: 'I0268',
    name: { full: 'Child Three Gonsalves', given: 'Child Three', surname: 'Gonsalves' },
    sex: 'M',
    birth: { date: '1920' }
  },
  {
    xref: 'I0269',
    name: { full: 'Child Four Gonsalves', given: 'Child Four', surname: 'Gonsalves' },
    sex: 'F',
    birth: { date: '1922' }
  }
];

// Spouses (multiple marriages of I0176)
export const mockSpouses = [
  {
    xref: 'I0500',
    name: { full: 'First Spouse Name', given: 'First Spouse', surname: 'Name' },
    sex: 'F',
    marriage: {
      family: 'F0299',
      date: '1910',
      place: 'British Guiana'
    }
  },
  {
    xref: 'I0501',
    name: { full: 'Second Spouse Name', given: 'Second Spouse', surname: 'Name' },
    sex: 'F',
    marriage: {
      family: 'F0346',
      date: '1920',
      place: 'British Guiana'
    }
  }
];

// Search results
export const mockSearchResults = [
  {
    xref: 'I0069',
    name: { full: 'Augustinho Thomas Gonsalves' },
    birth: { date: '18 FEB 1894', place: 'Bladen Hall, British Guiana' },
    match_score: 0.95
  },
  {
    xref: 'I0266',
    name: { full: 'Child One Gonsalves' },
    birth: { date: '1916', place: 'British Guiana' },
    match_score: 0.85
  }
];

// Ancestors (going back generations)
export const mockAncestors = [
  // Generation 1 (parents)
  {
    xref: 'I0264',
    name: { full: 'Francis Xavier' },
    generation: 1,
    relationship: 'father'
  },
  {
    xref: 'I0265',
    name: { full: 'Carlotta Baptista' },
    generation: 1,
    relationship: 'mother'
  },
  // Generation 2 (grandparents)
  {
    xref: 'I0500',
    name: { full: 'Grandfather Xavier' },
    generation: 2,
    relationship: 'paternal grandfather'
  },
  {
    xref: 'I0501',
    name: { full: 'Grandmother Xavier' },
    generation: 2,
    relationship: 'paternal grandmother'
  }
];

// Descendants (going forward generations)
export const mockDescendants = [
  // Generation 1 (children)
  {
    xref: 'I0266',
    name: { full: 'Child One Gonsalves' },
    generation: 1,
    relationship: 'child'
  },
  {
    xref: 'I0267',
    name: { full: 'Child Two Gonsalves' },
    generation: 1,
    relationship: 'child'
  },
  // Generation 2 (grandchildren)
  {
    xref: 'I0600',
    name: { full: 'Grandchild One' },
    generation: 2,
    relationship: 'grandchild'
  },
  {
    xref: 'I0601',
    name: { full: 'Grandchild Two' },
    generation: 2,
    relationship: 'grandchild'
  }
];

// Validation result
export const mockValidationResult = {
  valid: true,
  errors: [],
  warnings: [
    'Individual I0176 has no death date but is likely deceased (born 1889)',
    'Family F0299 is missing spouse information'
  ],
  statistics: {
    individuals: 150,
    families: 75,
    sources: 5,
    notes: 45,
    repositories: 2
  }
};

// Duplicate detection results
export const mockDuplicates = [
  {
    individual1: {
      xref: 'I0069',
      name: { full: 'Augustinho Thomas Gonsalves' },
      birth: { date: '18 FEB 1894' }
    },
    individual2: {
      xref: 'I0500',
      name: { full: 'Augustinho T. Gonsalves' },
      birth: { date: '18 FEB 1894' }
    },
    similarity_score: 0.92,
    matching_fields: ['name', 'birth_date', 'birth_place']
  }
];

// Graph metrics
export const mockGraphMetrics = {
  diameter: 12,
  density: 0.045,
  average_path_length: 5.2,
  total_individuals: 150,
  total_families: 75,
  connected_components: 3,
  largest_component_size: 142
};

// Centrality measures
export const mockCentrality = [
  {
    xref: 'I0069',
    name: { full: 'Augustinho Thomas Gonsalves' },
    degree_centrality: 15,
    betweenness_centrality: 0.234
  },
  {
    xref: 'I0263',
    name: { full: 'Lucia Cecilia Xavier' },
    degree_centrality: 14,
    betweenness_centrality: 0.198
  }
];

// Relationship calculation
export const mockRelationship = {
  individual1: 'I0266',
  individual2: 'I0264',
  relationship: 'grandson',
  degree: 2,
  path: [
    { xref: 'I0266', name: 'Child One Gonsalves', relationship: 'self' },
    { xref: 'I0263', name: 'Lucia Cecilia Xavier', relationship: 'mother' },
    { xref: 'I0264', name: 'Francis Xavier', relationship: 'grandfather' }
  ]
};

// Paths between individuals
export const mockPaths = [
  {
    path: ['I0266', 'I0263', 'I0264'],
    length: 2,
    relationships: ['child', 'parent']
  },
  {
    path: ['I0266', 'I0069', 'F0297', 'I0263', 'I0264'],
    length: 4,
    relationships: ['child', 'spouse', 'spouse', 'parent']
  }
];

// API response wrapper helper
export const wrapApiResponse = (data) => ({
  data,
  status: 'success',
  timestamp: new Date().toISOString()
});

// Helper to create paginated response
export const createPaginatedResponse = (items, page = 1, limit = 10) => ({
  data: {
    individuals: items,
    total: items.length,
    page,
    limit,
    total_pages: Math.ceil(items.length / limit)
  }
});

