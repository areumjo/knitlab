# Serialization Format

## Overview

Knitlab uses a compact binary serialization format optimized for storage efficiency while maintaining simplicity and backward compatibility.

## Format Pipeline

```
ApplicationState → Compact Format → msgpack → deflate → base64
```

**Reverse (loading):**
```
base64 → inflate → msgpack → Compact Format → ApplicationState (with rebuilt grids)
```

## Compression Results

Based on testing with a typical 20×20 chart:

- **Original JSON:** 3,568 bytes
- **Final compressed:** 744 bytes
- **Compression ratio:** 79.1% reduction
- **Space saved:** 2,824 bytes per chart

For larger charts, compression can reach **85-90%** reduction.

## Key Optimizations

### 1. **Remove Derived Data**
The `grid` property in each layer is NOT serialized. Instead:
- Only `keyPlacements` array is saved (source of truth)
- Grid is rebuilt on load via `buildGridFromKeyPlacements()`
- **Savings:** ~60-80% for typical charts

### 2. **Abbreviated Keys**
Long property names are abbreviated in the compact format:
```typescript
{
  i: "id",           // instead of "id"
  n: "name",         // instead of "name"
  r: "rows",         // instead of "rows"
  c: "cols",         // instead of "cols"
  // ... etc
}
```
**Savings:** ~10-15%

### 3. **Binary Encoding (msgpack)**
Uses msgpack instead of JSON for binary efficiency:
- Numbers encoded as binary (not strings)
- More compact type representations
- **Savings:** ~25-30% over JSON

### 4. **Deflate Compression (fflate)**
Final compression layer using DEFLATE algorithm:
- Fast decompression (critical for UX)
- Excellent compression ratio for text-like data
- **Savings:** ~60-70% on top of msgpack

### 5. **Base64 Encoding**
Final step for safe storage in clipboard/localStorage:
- Slightly increases size (~33% overhead on binary)
- Necessary for text-based storage
- Still results in 79%+ total compression

## Backward Compatibility

The deserializer automatically detects and handles:

1. **New compressed format** (starts with base64 characters)
2. **Legacy JSON format** (starts with `{`)

Legacy files are automatically migrated to the new format structure when loaded.

## Version Management

- Current version: `v: 1`
- Version field allows future format changes
- Unknown versions trigger a warning but attempt to parse anyway

## Usage

### User-Facing File Operations

Users can save and load their charts using the Developer Menu:

1. **Download Chart** - Saves current chart as `.knitlab` file
   - File contains compressed binary data (79% smaller than JSON)
   - Filename matches active sheet name (e.g., `Sheet 1.knitlab`)

2. **Upload Chart** - Loads chart from `.knitlab` or legacy `.json` file
   - Automatically detects format (new compressed or legacy JSON)
   - Validates and rebuilds grid data on load

### Programmatic Usage

#### Serializing (Export)
```typescript
import { serialize } from './services/serializationService';

const compressed = serialize(applicationState);
// Returns base64-encoded compressed string
// Copy to clipboard, save to file, etc.
```

#### Deserializing (Import)
```typescript
import { deserialize } from './services/serializationService';

const state = deserialize(compressedData);
// Handles both new and legacy formats automatically
// Rebuilds grid data from keyPlacements
```

## Implementation Files

- **`services/serializationService.ts`** - Core serialization logic
- **`App.tsx`** - Uses `deserialize()` in `processLoadApplicationStateDirectly()`
- **`components/DeveloperMenuModal.tsx`** - Uses `serialize()` for export

## Dependencies

- **msgpackr** (^1.11.5) - MessagePack encoding/decoding
- **fflate** (^0.8.2) - Fast DEFLATE compression

Total bundle size: ~20KB minified

## Performance

- **Serialization:** ~2-5ms for typical charts
- **Deserialization:** ~5-10ms (includes grid rebuilding)
- **Impact:** Negligible for user experience

## Future Enhancements

Potential optimizations (not currently implemented):

1. **Delta encoding** for consecutive placements
2. **Run-length encoding** for repeated patterns
3. **Dictionary compression** for common color values
4. **Incremental serialization** for large charts

These optimizations would add complexity for marginal gains. The current 79%+ compression ratio achieves the 80/20 goal effectively.
