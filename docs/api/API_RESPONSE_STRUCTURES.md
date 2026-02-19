# API Response Structures - Complete Reference

**Date:** January 28, 2026  
**Purpose:** Document all actual API response structures for facet development

---

## 📋 Table of Contents

1. [Families Endpoints](#families-endpoints)
2. [Graph/Relationship Endpoints](#graphrelationship-endpoints)
3. [Duplicates Endpoints](#duplicates-endpoints)
4. [Response Patterns](#response-patterns)

---

## Families Endpoints

### 1. List Families
**Endpoint:** `GET /api/v1/files/{file_id}/families?limit=N&offset=N`

**Response Structure:**
```json
{
  "data": {
    "families": [
      {
        "xref": "@F0364@",
        "husband": {
          "xref": "@I0231@",
          "name": "John /Alphonso/"
        },
        "wife": {
          "xref": "@I0218@",
          "name": "Delma /Gonsalves/"
        },
        "children": [
          {
            "xref": "@I0232@",
            "name": "Donald /Alphonso/"
          },
          {
            "xref": "@I0233@",
            "name": "Ronald /Alphonso/"
          }
        ],
        "children_count": 5
      }
    ],
    "meta": {
      "total": 310,
      "limit": 2,
      "offset": 0
    }
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601",
    "version": "v1"
  }
}
```

**Key Points:**
- Families wrapped in `data.families` array
- Each family has optional `husband` and `wife` objects
- Children array contains objects with `xref` and `name`
- `children_count` gives total count
- Pagination info in `data.meta`

---

### 2. Get Specific Family
**Endpoint:** `GET /api/v1/files/{file_id}/families/{xref}`

**Response Structure:**
```json
{
  "data": {
    "xref": "@F0364@",
    "husband": {
      "xref": "@I0231@",
      "name": "John /Alphonso/"
    },
    "wife": {
      "xref": "@I0218@",
      "name": "Delma /Gonsalves/"
    },
    "children": [
      {
        "xref": "@I0232@",
        "name": "Donald /Alphonso/"
      },
      {
        "xref": "@I0233@",
        "name": "Ronald /Alphonso/"
      },
      {
        "xref": "@I0234@",
        "name": "Quinn /Alphonso/"
      },
      {
        "xref": "@I0235@",
        "name": "Dwight /Alphonso/"
      },
      {
        "xref": "@I0236@",
        "name": "Michelle /Alphonso/"
      }
    ],
    "children_count": 5
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601",
    "version": "v1"
  }
}
```

**Key Points:**
- Single family object in `data`
- Same structure as list items
- No wrapping `families` array

---

## Graph/Relationship Endpoints

### 3. Get Ancestors
**Endpoint:** `GET /api/v1/files/{file_id}/individuals/{xref}/ancestors?generations=N`

**Response Structure:**
```json
{
  "data": {
    "ancestors": [
      {
        "xref": "@I0083@",
        "name": "Ulfat Shirley /Khan/",
        "given_name": "Ulfat Shirley",
        "surname": "Khan",
        "sex": "F",
        "birth_date": "3 JUN 1935",
        "birth_place": "Mahaica, British Guiana",
        "death_date": "25 APR 2004",
        "death_place": "California, USA",
        "living": false,
        "generation": 1,
        "has_parents": true,
        "has_children": true,
        "has_siblings": true,
        "has_spouse": true,
        "parents_count": 2,
        "children_count": 8,
        "siblings_count": 10,
        "spouses_count": 1
      }
    ],
    "meta": {
      "total": 3
    }
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601",
    "version": "v1"
  }
}
```

**Key Points:**
- Wrapped in `data.ancestors` array
- Includes `generation` field (1 = parents, 2 = grandparents, etc.)
- Rich metadata about relationships
- Counts for relatives

---

### 4. Get Descendants
**Endpoint:** `GET /api/v1/files/{file_id}/individuals/{xref}/descendants?generations=N`

**Response Structure:**
```json
{
  "data": {
    "descendants": [
      {
        "xref": "@I0145@",
        "name": "Aaron Peter /Gonsalves/",
        "given_name": "Aaron Peter",
        "surname": "Gonsalves",
        "sex": "M",
        "birth_date": "10 SEP 1994",
        "birth_place": "Walnut Creek, California",
        "living": true,
        "has_parents": true,
        "has_siblings": true,
        "parents_count": 2,
        "siblings_count": 3
      }
    ],
    "meta": {
      "total": 4
    }
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601",
    "version": "v1"
  }
}
```

**Key Points:**
- Wrapped in `data.descendants` array
- Similar structure to ancestors
- No `generation` field for descendants
- Includes living status

---

### 5. Get Relationship Between Two Individuals
**Endpoint:** `GET /api/v1/files/{file_id}/individuals/{xref1}/relationship/{xref2}`

**Response Structure:**
```json
{
  "data": {
    "from": {
      "xref": "@I0087@",
      "name": "Norman Peter /Gonsalves/"
    },
    "to": {
      "xref": "@I0096@",
      "name": "Monica /Gonsalves/"
    },
    "relationship_type": "parent",
    "is_direct": true,
    "is_collateral": false,
    "degree": 0,
    "removal": 0,
    "path": {
      "nodes": [
        "@I0087@",
        "@I0096@"
      ],
      "length": 2
    }
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601",
    "version": "v1"
  }
}
```

**Key Points:**
- Single relationship object in `data`
- `relationship_type`: "parent", "child", "sibling", "cousin", etc.
- `is_direct`: true for lineal relationships (parent/child)
- `is_collateral`: true for non-lineal (siblings, cousins)
- `degree`: genealogical degree
- `removal`: for cousin relationships
- `path`: shortest path between individuals

---

### 6. Get Paths Between Individuals
**Endpoint:** `GET /api/v1/files/{file_id}/individuals/{xref1}/paths/{xref2}?max_paths=N`

**Response Structure:**
```json
{
  "data": {
    "shortest_path": {
      "nodes": [
        "@I0087@",
        "@I0144@"
      ],
      "length": 2,
      "type": "mixed"
    }
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601",
    "version": "v1"
  }
}
```

**Key Points:**
- `shortest_path` object in `data`
- `nodes`: array of XREFs in path
- `length`: number of edges in path
- `type`: "blood", "marriage", "mixed"

---

### 7. Get Graph Metrics
**Endpoint:** `GET /api/v1/files/{file_id}/metrics`

**Status:** ⚠️ **TIMEOUT** - This endpoint takes too long or may not be fully implemented  
**Recommendation:** Skip this endpoint or implement with very long timeout (60s+)

---

### 8. Get Centrality Measures
**Endpoint:** `GET /api/v1/files/{file_id}/centrality?type=degree&limit=N`

**Response Structure:**
```json
{
  "data": {
    "@I0000@": 4,
    "@I0001@": 4,
    "@I0002@": 8,
    "@I0087@": 5,
    "@I0484@": 10,
    "...": "..."
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601",
    "version": "v1"
  }
}
```

**Key Points:**
- Flat object mapping XREFs to centrality scores
- `type` parameter: "degree", "betweenness", "closeness"
- Higher scores = more connected
- Returns ALL individuals in file (can be large!)

---

### 9. Get Most Connected Individuals
**Endpoint:** `GET /api/v1/files/{file_id}/most-connected?limit=N&type=degree`

**Response Structure:**
```json
{
  "data": [
    {
      "xref": "@I0484@",
      "name": "Martina Rita /Rodrigues/",
      "centrality": 10
    },
    {
      "xref": "@I0481@",
      "name": "Rosa /Xavier/",
      "centrality": 10
    },
    {
      "xref": "@I0068@",
      "name": "Manoel Louis /Gonsalves/",
      "centrality": 8
    }
  ],
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601",
    "version": "v1"
  }
}
```

**Key Points:**
- Flat array in `data`
- Sorted by centrality (highest first)
- Each item has `xref`, `name`, `centrality`
- `type` parameter: "degree", "betweenness", "closeness"

---

## Duplicates Endpoints

### 10. Find Duplicates Within File
**Endpoint:** `POST /api/v1/files/{file_id}/duplicates`

**Request Body:**
```json
{
  "min_score": 0.8,
  "include_living": false
}
```

**Response Structure:**
```json
{
  "data": {
    "matches": [
      {
        "individual1": {
          "xref": "@I0838@",
          "name": "Patsy /Alphonso/"
        },
        "individual2": {
          "xref": "@I0924@",
          "name": "Sandra /Alphonso/"
        },
        "similarity_score": 0.0,
        "confidence": "exact",
        "matching_fields": [
          "birth_date",
          "sex"
        ],
        "differences": [
          "name"
        ],
        "breakdown": {
          "name_score": 0.67,
          "date_score": 0.9,
          "place_score": 0.0,
          "sex_score": 1.0,
          "relationship_score": 0.0
        }
      }
    ],
    "meta": {
      "total_matches": 157,
      "threshold": 0.8
    }
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601",
    "version": "v1"
  }
}
```

**Key Points:**
- Wrapped in `data.matches` array
- Each match has two individuals
- `similarity_score`: overall similarity (0-1)
- `confidence`: "exact", "high", "medium", "low"
- `matching_fields`: list of fields that match
- `differences`: list of fields that differ
- `breakdown`: detailed score breakdown

---

### 11. Compare Two Files for Duplicates
**Endpoint:** `POST /api/v1/duplicates/compare`

**Request Body:**
```json
{
  "file_id1": "uuid1",
  "file_id2": "uuid2",
  "min_score": 0.8
}
```

**Response Structure:** (Similar to duplicates within file)
```json
{
  "data": {
    "matches": [
      {
        "individual1": {
          "xref": "@I0001@",
          "name": "John /Doe/",
          "file_id": "uuid1"
        },
        "individual2": {
          "xref": "@I0050@",
          "name": "John /Doe/",
          "file_id": "uuid2"
        },
        "similarity_score": 0.95,
        "confidence": "high",
        "matching_fields": ["name", "birth_date", "sex"],
        "differences": ["birth_place"],
        "breakdown": {
          "name_score": 1.0,
          "date_score": 1.0,
          "place_score": 0.5,
          "sex_score": 1.0,
          "relationship_score": 0.0
        }
      }
    ],
    "meta": {
      "total_matches": 42,
      "threshold": 0.8,
      "file1_individuals": 150,
      "file2_individuals": 200
    }
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601",
    "version": "v1"
  }
}
```

**Key Points:**
- Same structure as within-file duplicates
- Individuals include `file_id` to distinguish source
- Meta includes counts for both files

---

## Response Patterns

### Common Patterns

#### 1. List Endpoints (Paginated)
```json
{
  "data": {
    "items_key": [...],  // e.g., "families", "individuals", "ancestors"
    "meta": {
      "total": N,
      "limit": N,
      "offset": N
    }
  },
  "meta": { ... }
}
```

#### 2. Single Resource Endpoints
```json
{
  "data": {
    // Direct object properties
  },
  "meta": { ... }
}
```

#### 3. Relationship List Endpoints
```json
{
  "data": [
    // Flat array of items
  ],
  "meta": { ... }
}
```

#### 4. Map/Dictionary Endpoints
```json
{
  "data": {
    "key1": value1,
    "key2": value2
  },
  "meta": { ... }
}
```

---

## Field Naming Conventions

### Consistent Patterns
- **Snake case:** `birth_date`, `death_date`, `given_name`, `children_count`
- **XREFs:** Always include `@` symbols: `@I0069@`, `@F0364@`
- **Names:** Simple strings, not objects: `"John /Doe/"`
- **Dates:** Strings in GEDCOM format: `"18 FEB 1894"`
- **Booleans:** `living`, `has_children`, `has_parents`, etc.
- **Counts:** `children_count`, `parents_count`, `siblings_count`, `spouses_count`

### Object References
When referencing other entities, API returns minimal objects:
```json
{
  "xref": "@I0069@",
  "name": "Full /Name/"
}
```

Sometimes with additional context:
```json
{
  "xref": "@I0069@",
  "name": "Full /Name/",
  "birth_date": "18 FEB 1894",
  "living": false
}
```

---

## Error Responses

All endpoints follow this error format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      // Optional additional context
    }
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601",
    "version": "v1"
  }
}
```

Common error codes:
- `FILE_NOT_FOUND`
- `INDIVIDUAL_NOT_FOUND`
- `FAMILY_NOT_FOUND`
- `INVALID_PARAMETERS`
- `VALIDATION_ERROR`

---

## Facet Implementation Notes

### For `families.js` Facet
- ✅ `getFamilies`: Parse `data.families` and `data.meta`
- ✅ `getFamily`: Parse flat `data` object

### For `graph.js` Facet
- ✅ `getAncestors`: Parse `data.ancestors`
- ✅ `getDescendants`: Parse `data.descendants`
- ✅ `getRelationship`: Parse flat `data` object
- ✅ `getPaths`: Parse `data.shortest_path`
- ⚠️ `getMetrics`: **SKIP** or implement with 60s+ timeout
- ✅ `getCentrality`: Parse flat `data` map (xref → score)
- ✅ `getMostConnected`: Parse flat `data` array

### For `duplicates.js` Facet
- ✅ `findDuplicates`: Parse `data.matches` and `data.meta`
- ✅ `compareFiles`: Parse `data.matches` and `data.meta`

---

## Testing Checklist

Before updating facets:
- [x] Test families list
- [x] Test get family
- [x] Test ancestors
- [x] Test descendants
- [x] Test relationship
- [x] Test paths
- [ ] Test metrics (skipped - timeout)
- [x] Test centrality
- [x] Test most-connected
- [x] Test find duplicates
- [ ] Test compare files (needs second file)

---

**Last Updated:** January 28, 2026  
**Status:** COMPLETE (except metrics endpoint)  
**Next Step:** Update facets to match these structures


