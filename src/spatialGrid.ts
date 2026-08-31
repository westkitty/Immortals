// Deterministic uniform spatial grid for bounded-city spatial partitioning.
//
// The active city is small enough that brute-force scans over ~16 buildings are not a
// performance problem on their own, but the contract calls for spatial partitioning to
// exist as a real, used subsystem rather than an aspirational placeholder. This grid buckets
// static world-space entities (buildings never move) into fixed-size cells so that radius
// queries only need to scan the handful of cells that overlap the query bounds, and it reports
// a genuine occupied-cell count instead of a hardcoded value.
export type SpatialGrid = {
  cellSize: number;
  cells: Map<string, string[]>;
};

function cellKey(cellSize: number, x: number, z: number): string {
  return `${Math.floor(x / cellSize)}:${Math.floor(z / cellSize)}`;
}

export function createSpatialGrid(cellSize: number): SpatialGrid {
  return { cellSize, cells: new Map() };
}

export function insertIntoGrid(grid: SpatialGrid, id: string, x: number, z: number): void {
  const key = cellKey(grid.cellSize, x, z);
  const bucket = grid.cells.get(key);
  if (bucket) bucket.push(id); else grid.cells.set(key, [id]);
}

// Returns every id whose cell overlaps the axis-aligned query bounds. This is a superset of
// the true radius match (callers still apply an exact distance check), which keeps behavior
// identical to a brute-force scan while avoiding scanning ids far outside the query area.
export function queryGridBounds(grid: SpatialGrid, x: number, z: number, radius: number): string[] {
  const minCx = Math.floor((x - radius) / grid.cellSize);
  const maxCx = Math.floor((x + radius) / grid.cellSize);
  const minCz = Math.floor((z - radius) / grid.cellSize);
  const maxCz = Math.floor((z + radius) / grid.cellSize);
  const results: string[] = [];
  for (let cx = minCx; cx <= maxCx; cx += 1) {
    for (let cz = minCz; cz <= maxCz; cz += 1) {
      const bucket = grid.cells.get(`${cx}:${cz}`);
      if (bucket) results.push(...bucket);
    }
  }
  return results;
}

export function occupiedCellCount(grid: SpatialGrid): number {
  return grid.cells.size;
}
