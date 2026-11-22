import {ARCTIC_SEABED_GRID,ARCTIC_SEABED_HEIGHTS,KELP_SEABED_PATCHES} from './biome-seabed-data.js';
import {CLIFF_CANYON_GRID,CLIFF_CANYON_HEIGHTS} from './cliff-canyon-data.js';
import { SEABED_LEVEL, BLUE_OCEAN_FLOOR } from "./terrain.js";
import { PREPARED_SEABED_GRID, PREPARED_SEABED_HEIGHTS } from "./prepared-seabed-data.js";
import {SHELL_FIELD_GRID,SHELL_FIELD_HEIGHTS} from './shell-field-data.js';
import {JELLYFISH_SPIRES_GRID,JELLYFISH_SPIRES_HEIGHTS} from './jellyfish-spires-data.js';

export const MIN_SEABED_HEIGHT = BLUE_OCEAN_FLOOR;
export const MAX_SEABED_HEIGHT = -140;
export const ABYSS_START_X = 2250;
export const SEABED_GRID = PREPARED_SEABED_GRID;
const SCALE = 25;
// Load the authored GPU-height snapshot; restarting never generates geography.
const heights = new Float32Array(PREPARED_SEABED_HEIGHTS);
if (heights.length !== SEABED_GRID.columns * SEABED_GRID.rows)
  throw new Error("The prepared seabed does not match its grid dimensions.");
const arcticHeights=new Float32Array(ARCTIC_SEABED_HEIGHTS),arcticGrid=ARCTIC_SEABED_GRID;
if(arcticHeights.length!==arcticGrid.columns*arcticGrid.rows||arcticGrid.minX!==SEABED_GRID.minX||arcticGrid.minY!==SEABED_GRID.minY||arcticGrid.step!==SEABED_GRID.step||arcticGrid.rows!==SEABED_GRID.rows)
  throw new Error('Arctic seabed overrides must align with the prepared base grid.');
for(let row=0;row<arcticGrid.rows;row++)heights.set(arcticHeights.subarray(row*arcticGrid.columns,(row+1)*arcticGrid.columns),row*SEABED_GRID.columns);
// Overlay authored values on the same base vertices; rendering, swimming and
// climbing keep one triangulation, without an extra terrain layer or draw.
const shellGrid=SHELL_FIELD_GRID;
if(SHELL_FIELD_HEIGHTS.length!==shellGrid.columns*shellGrid.rows||shellGrid.step!==SEABED_GRID.step)
  throw new Error('Shell Field heights must match the prepared seabed grid.');
const shellColumn=(shellGrid.minX-SEABED_GRID.minX)/SEABED_GRID.step;
const shellRow=(shellGrid.minY-SEABED_GRID.minY)/SEABED_GRID.step;
if(!Number.isInteger(shellColumn)||!Number.isInteger(shellRow))throw new Error('Shell Field vertices must align with the ocean grid.');
for(let row=0;row<shellGrid.rows;row++)heights.set(SHELL_FIELD_HEIGHTS.slice(row*shellGrid.columns,(row+1)*shellGrid.columns),
  (shellRow+row)*SEABED_GRID.columns+shellColumn);
const detailFields=[{grid:CLIFF_CANYON_GRID,heights:new Float32Array(CLIFF_CANYON_HEIGHTS)},
  ...KELP_SEABED_PATCHES.map(patch=>({grid:patch.grid,heights:new Float32Array(patch.heights)})),
  {grid:JELLYFISH_SPIRES_GRID,heights:new Float32Array(JELLYFISH_SPIRES_HEIGHTS)}];
for(const field of detailFields)if(field.heights.length!==field.grid.columns*field.grid.rows)
  throw new Error('Detailed seabed heights do not match their grid dimensions.');
export const SEABED_DETAIL_GRIDS=Object.freeze(detailFields.map(field=>Object.freeze({...field.grid})));
export const SEABED_RENDER_BOUNDS=Object.freeze({minX:SEABED_GRID.minX,maxX:JELLYFISH_SPIRES_GRID.maxX,
  minY:Math.min(SEABED_GRID.minY,JELLYFISH_SPIRES_GRID.minY),maxY:Math.max(SEABED_GRID.maxY,JELLYFISH_SPIRES_GRID.maxY)});
const contains=(grid,x,y)=>x>=grid.minX&&x<=grid.maxX&&y>=grid.minY&&y<=grid.maxY;
/** Exact visible grid resolution for local surface and climbing queries. */
export function getSeabedGridAt(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))throw new TypeError('Seabed coordinates must be finite numbers.');
  return SEABED_DETAIL_GRIDS.find(grid=>contains(grid,x,y))??SEABED_GRID;
}


/** Physical feet height in simulation units, exactly on the mesh's triangle.
 * The crash/discovery region stays shallow; the eastern ocean reaches 100m.
 * @param {number} x @param {number} y @returns {number}
 */
export function getBaseSeabedHeight(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y))
    throw new TypeError("Seabed coordinates must be finite numbers.");
  const { minX, maxX, minY, maxY, step, columns, rows } = SEABED_GRID;
  // Beyond the closed world, continue the nearest prepared edge rather than
  // inventing a second surface that cannot be seen in the mesh.
  const boundedX = Math.max(minX, Math.min(maxX, x));
  const boundedY = Math.max(minY, Math.min(maxY, y));
  const gx = (boundedX - minX) / step, gy = (boundedY - minY) / step;
  const column = Math.min(columns - 2, Math.floor(gx));
  const row = Math.min(rows - 2, Math.floor(gy));
  const u = gx - column, v = gy - row;
  const index = row * columns + column;
  const a = heights[index], b = heights[index + 1];
  const c = heights[index + columns], d = heights[index + columns + 1];
  if (a === Math.fround(SEABED_LEVEL / SCALE) && a === b && a === c && a === d)
    return SEABED_LEVEL;
  if (a === Math.fround(BLUE_OCEAN_FLOOR / SCALE) && a === b && a === c && a === d)
    return BLUE_OCEAN_FLOOR;
  const height = (u + v <= 1
    ? a + (b - a) * u + (c - a) * v
    : d + (c - d) * (1 - u) + (b - d) * (1 - v)) * SCALE;
  if (Math.abs(height - SEABED_LEVEL) < .0001) return SEABED_LEVEL;
  return Math.max(MIN_SEABED_HEIGHT, Math.min(MAX_SEABED_HEIGHT, height));
}

/** Indexed X/Y-up/Z ground mesh data; both triangles share collision's diagonal.
 * @returns {{positions:Float32Array,indices:Uint32Array}}
 */
export function createSeabedMeshData() {
  const fields=[{grid:SEABED_GRID,heights},...detailFields];
  const vertexCount=fields.reduce((count,field)=>count+field.grid.columns*field.grid.rows,0);
  const triangleCount=fields.reduce((count,{grid})=>count+(grid.columns-1)*(grid.rows-1)*2,0);
  const positions=new Float32Array(vertexCount*3),indices=new Uint32Array(triangleCount*3);
  let base=0,cursor=0;
  for(const [fieldIndex,{grid:g,heights:values}]of fields.entries()){
    for(let row=0;row<g.rows;row++)for(let column=0;column<g.columns;column++){
      const local=row*g.columns+column,index=base+local,x=g.minX+column*g.step,y=g.minY+row*g.step;
      positions.set([x/SCALE,values[local],y/SCALE],index*3);
      if(column===g.columns-1||row===g.rows-1)continue;
      if(fieldIndex===0&&SEABED_DETAIL_GRIDS.some(detail=>x>=detail.minX&&x<detail.maxX&&y>=detail.minY&&y<detail.maxY))continue;
      indices.set([index,index+g.columns,index+1,index+1,index+g.columns,index+g.columns+1],cursor);cursor+=6;
    }
    base+=g.columns*g.rows;
  }
  return {positions,indices:indices.slice(0,cursor)};
}

export {CLIFF_CANYON_GRID};
/** The same authored triangles drive swimming, ground contact and rendering. */
export function getSeabedHeight(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))throw new TypeError('Seabed coordinates must be finite numbers.');
  const field=detailFields.find(candidate=>contains(candidate.grid,x,y));
  if(!field)return getBaseSeabedHeight(x,y);
  const g=field.grid,values=field.heights;
  const gx=(x-g.minX)/g.step,gy=(y-g.minY)/g.step,column=Math.min(g.columns-2,Math.floor(gx)),row=Math.min(g.rows-2,Math.floor(gy));
  const u=gx-column,v=gy-row,i=row*g.columns+column,a=values[i],b=values[i+1],c=values[i+g.columns],d=values[i+g.columns+1];
  if(a===Math.fround(SEABED_LEVEL/SCALE)&&a===b&&a===c&&a===d)return SEABED_LEVEL;
  const height=(u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v))*SCALE;
  return Math.abs(height-SEABED_LEVEL)<.0001?SEABED_LEVEL:height;
}
