import {PREPARED_WOODLONS} from './basin-life-data.js';
import {PREPARED_PERIMETER_BORDERS} from './world-perimeter-data.js';
import {SHELL_FIELD_ANCHORS} from './shell-field-placements.js';
import {PREPARED_DENSE_GRASS} from './dense-grass-data.js';
import {PREPARED_BASIN_BIRDS,PREPARED_BASIN_CAVES} from './basin-expansion-data.js';
import {PREPARED_WILDLIFE_EXPANSION} from './wildlife-expansion-data.js';
import {PREPARED_PENGUINS} from './penguin-data.js';
import {PREPARED_HAULER_BIRDS} from './hauler-birds.js';
import {CRASH_IMPACT_DATA} from './crash-impact-data.js';
import {STARTER_WRECK_SITE} from './wreck-roof-cargo.js';
import { PREPARED_HOGWONGS } from './hogwong-data.js';
import { PREPARED_TUNDRA_EXPANSION } from './tundra-expansion-data.js';
/** Croba's prepared fixed level. Edit the placement data below to change the map.
 * Loading or resetting only clones this authored snapshot; no geography, flora,
 * wildlife, or initial physics state is generated at runtime by this module.
 */
import { PREPARED_TUNDRA } from './iceberg-tundra-data.js';
import { PREPARED_FOREST } from './forest-data.js';
import { PREPARED_SEAWEED } from './seaweed-data.js';
import { PREPARED_PLANTS } from './plant-data.js';
import { PREPARED_VOID_FISH } from './void-fish-data.js';
import { PREPARED_FROST_HOUNDS } from './frost-hound-data.js';
import { PREPARED_ARCTIC_GARDENS } from './arctic-garden-data.js';
import { PREPARED_JELLYFISH } from './lantern-jellyfish-data.js';
import { PREPARED_TREE_STALKERS } from './tree-stalker.js';

export const PREPARED_WORLD_ID = 'croba-icebound-1';
export const PREPARED_WORLD_SEED = 19;

const PREPARED_WORLD = {
  inventory:{ration:3},harvestedPlants:{},harvestVersion:0,
  starterPlants:[],
  woodlons:PREPARED_WOODLONS,
  plants: PREPARED_PLANTS,
  hogwongs: PREPARED_HOGWONGS,
  penguins: [...PREPARED_PENGUINS,...PREPARED_BASIN_BIRDS,...PREPARED_HAULER_BIRDS],
  tundra: PREPARED_TUNDRA,
  forest: PREPARED_FOREST,
  seaweed: PREPARED_SEAWEED,
  treeStalkers: PREPARED_TREE_STALKERS,
  jellyfish: PREPARED_JELLYFISH,
  lanternStingCooldown: 0,
  arcticGardens: PREPARED_ARCTIC_GARDENS,
  frostHounds: PREPARED_FROST_HOUNDS,
  frostHoundPackState: {},
  voidFish: PREPARED_VOID_FISH,
  voidFishPackState: {},
  "seed": 19,
  "player": {
    "hunger": 100,
    "x": -5620,
    "y": -450,
    "z": 0,
    "heading": 1.5707963267948966,
    "warmth": 100,
    "oxygen": 100,
    "health": 100,
    "jumpTime": 0,
    "wetTime": 0,
    "jumping": false,
    "swimming": false,
    "underwater": false
  },
  "platforms": [
    {
      "id": "floe-0",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 22,
        "inner": [
          18.21,
          18.94,
          22.41,
          25.64,
          25.83,
          22.82,
          19.21,
          18.12,
          20.49,
          24.27,
          26.21,
          24.61,
          20.87
        ],
        "middle": [
          12.09,
          11.15,
          9.95,
          8.78,
          7.89,
          7.5,
          7.69,
          8.42,
          9.52,
          10.74,
          11.8,
          12.46,
          12.56
        ]
      },
      "x": 0,
      "y": 0,
      "rx": 165,
      "ry": 148,
      "seed": 13,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-1",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 12,
        "inner": [
          14.52,
          11.8,
          10.2,
          13.63,
          13.71,
          10.24,
          11.71
        ],
        "middle": [
          4.57,
          4.16,
          4.8,
          6.02,
          6.89,
          6.77,
          5.74
        ]
      },
      "x": 255,
      "y": 45,
      "rx": 82,
      "ry": 82,
      "seed": 60,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-2",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 13,
        "inner": [
          14.49,
          10.55,
          13.53,
          14.49,
          10.55,
          13.53
        ],
        "middle": [
          7.21,
          7,
          5.62,
          4.46,
          4.67,
          6.05
        ]
      },
      "x": 440,
      "y": -30,
      "rx": 88,
      "ry": 86,
      "seed": 107,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-3",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 14,
        "inner": [
          13.11,
          17,
          12.95,
          13.11,
          17,
          12.95
        ],
        "middle": [
          6.91,
          5.32,
          4.92,
          6.11,
          7.7,
          8.11
        ]
      },
      "x": 645,
      "y": 25,
      "rx": 96,
      "ry": 98,
      "seed": 154,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-4",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 11,
        "inner": [
          12.38,
          13.48,
          10.13,
          10.52,
          13.7,
          11.89,
          9.52
        ],
        "middle": [
          5.52,
          6.47,
          6.53,
          5.66,
          4.51,
          3.95,
          4.4
        ]
      },
      "x": 70,
      "y": -260,
      "rx": 90,
      "ry": 78,
      "seed": 201,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-5",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 13,
        "inner": [
          12.03,
          12.41,
          15.93,
          12.03,
          12.41,
          15.93
        ],
        "middle": [
          7.59,
          6.44,
          4.96,
          4.63,
          5.77,
          7.25
        ]
      },
      "x": -30,
      "y": -440,
      "rx": 95,
      "ry": 90,
      "seed": 248,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-6",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 12,
        "inner": [
          14.35,
          12.93,
          10.39,
          14.35,
          12.93,
          10.39
        ],
        "middle": [
          5.08,
          4.26,
          4.88,
          6.32,
          7.14,
          6.52
        ]
      },
      "x": 100,
      "y": -625,
      "rx": 108,
      "ry": 84,
      "seed": 295,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-7",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 13,
        "inner": [
          15.56,
          12.28,
          11.14,
          14.93,
          14.38,
          10.84,
          12.96
        ],
        "middle": [
          7.12,
          7.46,
          6.68,
          5.37,
          4.51,
          4.75,
          5.91
        ]
      },
      "x": -270,
      "y": 5,
      "rx": 88,
      "ry": 95,
      "seed": 342,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-8",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 12,
        "inner": [
          9.94,
          13.74,
          12.2,
          9.94,
          13.74,
          12.2
        ],
        "middle": [
          6.18,
          4.8,
          4.05,
          4.67,
          6.05,
          6.81
        ]
      },
      "x": -460,
      "y": 100,
      "rx": 85,
      "ry": 80,
      "seed": 389,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-9",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 15,
        "inner": [
          14.07,
          17.66,
          13.13,
          14.07,
          17.66,
          13.13
        ],
        "middle": [
          6.5,
          8.12,
          8.4,
          7.07,
          5.45,
          5.17
        ]
      },
      "x": -665,
      "y": 0,
      "rx": 100,
      "ry": 100,
      "seed": 436,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-10",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 13,
        "inner": [
          12.83,
          10.4,
          13.61,
          14.62,
          10.96,
          11.58,
          14.96
        ],
        "middle": [
          7.23,
          6.71,
          5.48,
          4.46,
          4.43,
          5.4,
          6.65
        ]
      },
      "x": 90,
      "y": 265,
      "rx": 95,
      "ry": 85,
      "seed": 483,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-11",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 13,
        "inner": [
          11.46,
          12.5,
          15.51,
          11.46,
          12.5,
          15.51
        ],
        "middle": [
          4.57,
          5.77,
          7.17,
          7.38,
          6.18,
          4.77
        ]
      },
      "x": 310,
      "y": 290,
      "rx": 98,
      "ry": 88,
      "seed": 530,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-12",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 14,
        "inner": [
          15.95,
          13.75,
          11.56,
          15.95,
          13.75,
          11.56
        ],
        "middle": [
          7.04,
          7.83,
          7.04,
          5.45,
          4.66,
          5.45
        ]
      },
      "x": 530,
      "y": 260,
      "rx": 92,
      "ry": 92,
      "seed": 577,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-13",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 13,
        "inner": [
          14.94,
          11.52,
          11,
          14.65,
          13.55,
          10.39,
          12.9
        ],
        "middle": [
          4.58,
          4.35,
          5.19,
          6.46,
          7.21,
          6.88,
          5.71
        ]
      },
      "x": -155,
      "y": 295,
      "rx": 85,
      "ry": 88,
      "seed": 624,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-14",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 11,
        "inner": [
          9.86,
          13.58,
          11.54,
          9.86,
          13.58,
          11.54
        ],
        "middle": [
          4.65,
          6,
          6.64,
          5.93,
          4.59,
          3.95
        ]
      },
      "x": -375,
      "y": 340,
      "rx": 100,
      "ry": 78,
      "seed": 671,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-15",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 12,
        "inner": [
          11.6,
          14.03,
          10.25,
          11.6,
          14.03,
          10.25
        ],
        "middle": [
          5.54,
          4.29,
          4.18,
          5.32,
          6.56,
          6.68
        ]
      },
      "x": -610,
      "y": 290,
      "rx": 90,
      "ry": 80,
      "seed": 718,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-16",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 12,
        "inner": [
          11.72,
          9.87,
          13.13,
          13.53,
          10.09,
          11.22,
          14.15
        ],
        "middle": [
          4.05,
          4.63,
          5.81,
          6.7,
          6.64,
          5.66,
          4.51
        ]
      },
      "x": 310,
      "y": -245,
      "rx": 80,
      "ry": 85,
      "seed": 765,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-17",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 11,
        "inner": [
          9.92,
          11.43,
          13.63,
          9.92,
          11.43,
          13.63
        ],
        "middle": [
          6.49,
          5.37,
          4.17,
          4.09,
          5.22,
          6.42
        ]
      },
      "x": -260,
      "y": -230,
      "rx": 78,
      "ry": 90,
      "seed": 812,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-18",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 11,
        "inner": [
          13.15,
          10.88,
          9.61,
          13.15,
          10.88,
          9.61
        ],
        "middle": [
          4.35,
          3.8,
          4.54,
          5.82,
          6.38,
          5.64
        ]
      },
      "x": 805,
      "y": -170,
      "rx": 75,
      "ry": 88,
      "seed": 859,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "floe-19",
      "refinedIce": true,
      "biome": "cliff-biome",
      "relief": {
        "center": 11,
        "inner": [
          12.88,
          9.76,
          9.82,
          12.92,
          11.48,
          9.02,
          11.56
        ],
        "middle": [
          6.11,
          6.22,
          5.43,
          4.33,
          3.75,
          4.13,
          5.18
        ]
      },
      "x": -805,
      "y": -205,
      "rx": 74,
      "ry": 82,
      "seed": 906,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "glacier-0",
      "x": 37.397066304491695,
      "y": 905.6131718594445,
      "rx": 311.1890027858317,
      "ry": 260.82956350641325,
      "depth": 157,
      "seed": 3557581377,
      "kind": "glacier",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 38,
        "inner": [
          45.23,
          44.34,
          36.07,
          31.83,
          37.5,
          45.23,
          44.34,
          36.07,
          31.83,
          37.5
        ],
        "middle": [
          19.95,
          21.81,
          22.1,
          20.71,
          18.17,
          15.45,
          13.59,
          13.3,
          14.69,
          17.23
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "glacier-3",
      "x": 96.03995123918678,
      "y": 2174.134293480238,
      "rx": 260.78503150492907,
      "ry": 240.53321906598285,
      "depth": 202,
      "seed": 3704513689,
      "kind": "glacier",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 35,
        "inner": [
          29.88,
          35.87,
          41.96,
          41.04,
          34.18,
          29.4,
          32.3,
          39.47,
          42.54,
          37.92,
          31
        ],
        "middle": [
          18.59,
          16.35,
          14.1,
          12.56,
          12.21,
          13.17,
          15.12,
          17.46,
          19.44,
          20.42,
          20.11
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "glacier-7",
      "x": -1817.3350576707426,
      "y": 519.8831109933112,
      "rx": 235.33732975833118,
      "ry": 264.78346321964636,
      "depth": 190,
      "seed": 3357818877,
      "kind": "glacier",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 35,
        "inner": [
          40.81,
          40.01,
          32.54,
          28.72,
          33.83,
          40.81,
          40.01,
          32.54,
          28.72,
          33.83
        ],
        "middle": [
          18,
          19.68,
          19.94,
          18.68,
          16.39,
          13.94,
          12.26,
          12,
          13.25,
          15.54
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-0",
      "x": -23.915201355508117,
      "y": -2296.0425366363306,
      "rx": 65.14826657949015,
      "ry": 65.08226136255976,
      "depth": 59,
      "seed": 2954074584,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 10,
        "inner": [
          9.22,
          9.13,
          11.21,
          7.93,
          11.15
        ],
        "middle": [
          5.53,
          4.61,
          3.42,
          3.61,
          4.91
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-4",
      "x": -1019.6235298618159,
      "y": -2152.926162542174,
      "rx": 137.88277996703982,
      "ry": 123.1137130540073,
      "depth": 108,
      "seed": 1402050241,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 18,
        "inner": [
          21.74,
          17.32,
          16.16,
          21.74,
          17.32,
          16.16
        ],
        "middle": [
          9.7,
          10.45,
          9.1,
          7.01,
          6.26,
          7.6
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-5",
      "x": -1645.368468375985,
      "y": 1681.287824320224,
      "rx": 82.97876165248454,
      "ry": 60.90272442271384,
      "depth": 64,
      "seed": 481708381,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 9,
        "inner": [
          10.23,
          7.46,
          9.62,
          10.23,
          7.46,
          9.62
        ],
        "middle": [
          5.11,
          4.95,
          3.97,
          3.15,
          3.32,
          4.3
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-6",
      "x": -1291.9943910053357,
      "y": 95.21221231105477,
      "rx": 117.73631934076548,
      "ry": 98.10528755590845,
      "depth": 104,
      "seed": 1346595550,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 14,
        "inner": [
          12.06,
          14.52,
          17.34,
          13.63,
          12.46,
          16.69,
          15.97
        ],
        "middle": [
          8.01,
          6.7,
          5.36,
          5,
          5.88,
          7.35,
          8.3
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-8",
      "x": -1736.125399055434,
      "y": 139.71456454635828,
      "rx": 78.4221950545907,
      "ry": 69.99740393510582,
      "depth": 87,
      "seed": 2054023737,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 10,
        "inner": [
          10.49,
          12.12,
          8.78,
          10.49,
          12.12,
          8.78
        ],
        "middle": [
          4.76,
          5.8,
          5.79,
          4.74,
          3.7,
          3.71
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-11",
      "x": -899.6356835583317,
      "y": 995.4446152977914,
      "rx": 82.90305709932,
      "ry": 80.93366889803666,
      "depth": 55,
      "seed": 364048635,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 12,
        "inner": [
          10.72,
          13.86,
          13.48,
          10.34,
          10.72,
          13.86,
          13.48,
          10.34
        ],
        "middle": [
          5.03,
          6.1,
          6.81,
          6.75,
          5.95,
          4.88,
          4.17,
          4.24
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-12",
      "x": 669.8897636836791,
      "y": 1185.7515008431508,
      "rx": 73.50399097194895,
      "ry": 69.34630816202711,
      "depth": 47,
      "seed": 2487110196,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 10,
        "inner": [
          12.17,
          9.29,
          10.3,
          11.54,
          8.53
        ],
        "middle": [
          4.02,
          3.56,
          4.69,
          5.84,
          5.42
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-13",
      "x": 875.8897618145659,
      "y": -1615.7100732855502,
      "rx": 126.72309631481767,
      "ry": 104.30588060530641,
      "depth": 100,
      "seed": 758294193,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 15,
        "inner": [
          16.18,
          17.74,
          12.86,
          16.18,
          17.74,
          12.86
        ],
        "middle": [
          6.89,
          5.44,
          5.62,
          7.26,
          8.72,
          8.54
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-14",
      "x": -1069.717747722587,
      "y": 265.133404495344,
      "rx": 73.69996906723827,
      "ry": 60.460321108927616,
      "depth": 82,
      "seed": 3989718007,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 9,
        "inner": [
          10.19,
          7.83,
          7.89,
          10.25,
          10.19,
          7.83,
          7.89,
          10.25
        ],
        "middle": [
          5.07,
          5.06,
          4.49,
          3.69,
          3.13,
          3.14,
          3.71,
          4.51
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-16",
      "x": -2109.297496982925,
      "y": 836.2308403504721,
      "rx": 81.43982377834618,
      "ry": 77.36585576003058,
      "depth": 61,
      "seed": 1358281293,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 11,
        "inner": [
          12,
          13.16,
          9.54,
          12,
          13.16,
          9.54
        ],
        "middle": [
          5.11,
          4.03,
          4.17,
          5.39,
          6.47,
          6.33
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-18",
      "x": -1298.686673709265,
      "y": 1171.2950469674606,
      "rx": 82.23911371082067,
      "ry": 82.0261690145815,
      "depth": 61,
      "seed": 1586683468,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 12,
        "inner": [
          10.22,
          13.35,
          12.55,
          10.71,
          14.49
        ],
        "middle": [
          4.37,
          5.92,
          6.98,
          6.09,
          4.48
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-19",
      "x": -241.8405286061684,
      "y": 2528.695481438071,
      "rx": 105.23594990372658,
      "ry": 92.3886200847904,
      "depth": 57,
      "seed": 2385488937,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 14,
        "inner": [
          13.85,
          16,
          11.59,
          13.85,
          16,
          11.59
        ],
        "middle": [
          6.28,
          7.65,
          7.64,
          6.26,
          4.88,
          4.89
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-22",
      "x": 319.9860558933284,
      "y": -2459.055692761729,
      "rx": 130.30609105015174,
      "ry": 125.21891806774481,
      "depth": 102,
      "seed": 1094415462,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 18,
        "inner": [
          21.45,
          16.05,
          17.18,
          22.08,
          18.77,
          15.34,
          20.18
        ],
        "middle": [
          6.56,
          6.54,
          8,
          9.83,
          10.66,
          9.85,
          8.03
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-23",
      "x": -789.6275509876859,
      "y": 2467.1108704743433,
      "rx": 136.80227645672858,
      "ry": 98.69565431508359,
      "depth": 113,
      "seed": 881856317,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 15,
        "inner": [
          13.44,
          17.48,
          13.35,
          13.44,
          17.48,
          13.35
        ],
        "middle": [
          7.12,
          5.48,
          5.06,
          6.27,
          7.91,
          8.34
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-24",
      "x": 533.3942053065729,
      "y": -1969.2196275711174,
      "rx": 184.4702124968171,
      "ry": 177.441435353946,
      "depth": 39,
      "seed": 512121918,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 26,
        "inner": [
          25.73,
          31.42,
          25.15,
          22.25,
          29.81,
          29.34,
          21.99
        ],
        "middle": [
          12.29,
          9.81,
          9.01,
          10.49,
          13.14,
          14.96,
          14.58
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-25",
      "x": -893.2124706231923,
      "y": 1664.8051728089524,
      "rx": 147.7553790109232,
      "ry": 130.97430294683255,
      "depth": 114,
      "seed": 185085603,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 19,
        "inner": [
          22.66,
          21.47,
          16.5,
          17.69,
          22.66,
          21.47,
          16.5,
          17.69
        ],
        "middle": [
          9.99,
          11.06,
          10.86,
          9.5,
          7.78,
          6.71,
          6.91,
          8.27
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-27",
      "x": -105.365289099512,
      "y": 1707.791130304847,
      "rx": 62.14512276928872,
      "ry": 60,
      "depth": 61,
      "seed": 1670395679,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 9,
        "inner": [
          10.61,
          8.71,
          7.33,
          9.23,
          10.61,
          8.71,
          7.33,
          9.23
        ],
        "middle": [
          4.86,
          5.1,
          4.74,
          3.99,
          3.28,
          3.04,
          3.4,
          4.15
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-29",
      "x": -515.1938711890019,
      "y": 1332.7430531526384,
      "rx": 81.9958311226219,
      "ry": 60,
      "depth": 50,
      "seed": 4040982325,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 9,
        "inner": [
          10.29,
          7.45,
          9.17,
          10.29,
          7.45,
          9.17
        ],
        "middle": [
          3.14,
          3.21,
          4.13,
          5,
          4.93,
          4.01
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-30",
      "x": -45.19239548279798,
      "y": -1219.1246608947977,
      "rx": 67.31250021606684,
      "ry": 60,
      "depth": 94,
      "seed": 861602070,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 9,
        "inner": [
          7.36,
          9.71,
          10.25,
          7.66,
          8.27,
          10.59,
          8.95
        ],
        "middle": [
          3.43,
          4.31,
          5.01,
          5,
          4.29,
          3.42,
          3.04
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-32",
      "x": -234.12385729234592,
      "y": -1476.0857701653538,
      "rx": 111.81537687079981,
      "ry": 87.96261749626561,
      "depth": 104,
      "seed": 1738236002,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 13,
        "inner": [
          14.68,
          14.65,
          10.96,
          12.63,
          15.58,
          12.59,
          10.97
        ],
        "middle": [
          6.47,
          7.4,
          7.25,
          6.13,
          4.89,
          4.46,
          5.17
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-33",
      "x": -1970.3901105342227,
      "y": 975.3665946406093,
      "rx": 68.1913333106786,
      "ry": 61.895773763641486,
      "depth": 94,
      "seed": 1925466157,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 9,
        "inner": [
          10.12,
          10.1,
          7.55,
          10.12,
          10.1,
          7.55
        ],
        "middle": [
          3.92,
          3.17,
          3.45,
          4.48,
          5.23,
          4.95
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-34",
      "x": 663.8846765883964,
      "y": 1750.8241040126225,
      "rx": 82.38531951326877,
      "ry": 70.90492848960113,
      "depth": 38,
      "seed": 3937427987,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 10,
        "inner": [
          8.71,
          10.09,
          12.49,
          11.11,
          8.71,
          10.09,
          12.49,
          11.11
        ],
        "middle": [
          5.78,
          4.97,
          4.07,
          3.6,
          3.84,
          4.65,
          5.55,
          6.02
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-35",
      "x": 465.9676361422037,
      "y": -1106.6077613276188,
      "rx": 98.08729988755658,
      "ry": 77.97461538750966,
      "depth": 112,
      "seed": 2738975930,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 11,
        "inner": [
          10.15,
          10.49,
          13.68,
          11.92,
          9.52,
          12.35,
          13.49
        ],
        "middle": [
          4.05,
          4.91,
          6.06,
          6.63,
          6.19,
          5.07,
          4.12
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-36",
      "x": 357.46743865497103,
      "y": 1452.802610270837,
      "rx": 93.5317069105804,
      "ry": 89.3680976555315,
      "depth": 83,
      "seed": 2595270273,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 13,
        "inner": [
          12.6,
          15.77,
          11.71,
          12.6,
          15.77,
          11.71
        ],
        "middle": [
          5.82,
          7.26,
          7.5,
          6.3,
          4.86,
          4.62
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-39",
      "x": -998.0021764054515,
      "y": -13.251205115755758,
      "rx": 136.73416108824313,
      "ry": 107.26768673033071,
      "depth": 38,
      "seed": 4178666781,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 16,
        "inner": [
          18.02,
          13.14,
          16.95,
          18.02,
          13.14,
          16.95
        ],
        "middle": [
          9.01,
          8.72,
          6.99,
          5.55,
          5.84,
          7.57
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-40",
      "x": -1296.0053820289845,
      "y": 1457.6532986263476,
      "rx": 96.07097335159779,
      "ry": 88.45308815119425,
      "depth": 81,
      "seed": 798349699,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 13,
        "inner": [
          15.13,
          11.7,
          11.32,
          14.75,
          15.13,
          11.7,
          11.32,
          14.75
        ],
        "middle": [
          4.63,
          4.56,
          5.34,
          6.51,
          7.38,
          7.44,
          6.66,
          5.5
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-41",
      "x": -575.7574788359711,
      "y": 1593.507264340076,
      "rx": 92.62180517893285,
      "ry": 78.64954097985326,
      "depth": 66,
      "seed": 2970612735,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 12,
        "inner": [
          10.42,
          13.46,
          13.1,
          10.05,
          10.42,
          13.46,
          13.1,
          10.05
        ],
        "middle": [
          4.89,
          5.93,
          6.62,
          6.56,
          5.78,
          4.74,
          4.05,
          4.12
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-42",
      "x": -1174.040624485861,
      "y": 728.8782128847961,
      "rx": 117.90429874090478,
      "ry": 90.06603290917683,
      "depth": 74,
      "seed": 2946842312,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 13,
        "inner": [
          11.46,
          14.22,
          14.24,
          11.45,
          15.95
        ],
        "middle": [
          7.5,
          5.87,
          4.58,
          5.4,
          7.21
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-44",
      "x": 736.3566271804644,
      "y": -1065.319369115896,
      "rx": 72.43487966246903,
      "ry": 70.02727373486074,
      "depth": 113,
      "seed": 3879101965,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 10,
        "inner": [
          10.26,
          8.91,
          12.24,
          10.26,
          8.91,
          12.24
        ],
        "middle": [
          3.55,
          4.21,
          5.41,
          5.96,
          5.3,
          4.09
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-45",
      "x": -1429.2421327840016,
      "y": 636.295169039582,
      "rx": 74.7276941430755,
      "ry": 71.55184492759214,
      "depth": 59,
      "seed": 2556053530,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 11,
        "inner": [
          9.31,
          9.63,
          12.55,
          10.94,
          8.73,
          11.33,
          12.38
        ],
        "middle": [
          3.71,
          4.51,
          5.56,
          6.09,
          5.68,
          4.65,
          3.78
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-53",
      "x": -2194.8617867067483,
      "y": 1123.3150131510567,
      "rx": 101.8917439179495,
      "ry": 84.86622208604145,
      "depth": 102,
      "seed": 2431947875,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 12,
        "inner": [
          13.53,
          14.87,
          11.85,
          10.5,
          13.53,
          14.87,
          11.85,
          10.5
        ],
        "middle": [
          6.03,
          6.96,
          7.2,
          6.59,
          5.49,
          4.55,
          4.32,
          4.93
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-56",
      "x": -861.0763029856645,
      "y": 1282.2319914587952,
      "rx": 120.69279416464269,
      "ry": 107.34530489270519,
      "depth": 92,
      "seed": 2465071861,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 16,
        "inner": [
          18.86,
          13.84,
          15.45,
          18.86,
          13.84,
          15.45
        ],
        "middle": [
          5.78,
          5.59,
          7.09,
          8.78,
          8.97,
          7.47
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "island-58",
      "x": -2069.701894959422,
      "y": 1440.146137676327,
      "rx": 72.53339074552059,
      "ry": 68.804775899333,
      "depth": 62,
      "seed": 3749227465,
      "kind": "island",
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 10,
        "inner": [
          10.08,
          8.75,
          12.02,
          10.08,
          8.75,
          12.02
        ],
        "middle": [
          3.48,
          4.13,
          5.32,
          5.85,
          5.21,
          4.02
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "hunting-glacier",
      "x": -1550,
      "y": -1050,
      "rx": 1050,
      "ry": 700,
      "depth": 220,
      "kind": "glacier",
      "seed": 7841,
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1,
      "relief": {
        "center": 0,
        "inner": [
          84.44,
          80.21,
          67.27,
          58.56,
          62.79,
          75.73,
          84.44,
          80.21,
          67.27,
          58.56,
          62.79,
          75.73
        ],
        "middle": [
          37.68,
          40.17,
          40.59,
          38.83,
          35.36,
          31.11,
          27.22,
          24.73,
          24.31,
          26.07,
          29.54,
          33.79
        ],
        "mesh": {
          "points": [
            [0, 0, 0],
            [-0.020872087, 0.023139429, 0],
            [-0.003604044, 0.023139429, 0],
            [-0.175728625, 0.194818087, 60.245260085],
            [-0.102926411, 0.251710858, 82.586010587],
            [-0.039204817, 0.251710858, 82.27509487],
            [-0.046119201, 0.296104008, 84.44],
            [-0.058361171, 0.023139429, 0],
            [-0.240880943, 0.095506094, 21.297961819],
            [-0.276096563, -0.032275261, 0],
            [-0.260824674, 0.023139429, 0],
            [-0.2339039, -0.166643316, 0],
            [-0.095374161, -0.234003428, 0],
            [-0.100123807, -0.24565683, 3.860990459],
            [-0.119854523, -0.234003428, 0],
            [0.023996883, -0.234003428, 0],
            [0.028140273, -0.274407316, 14.926206163],
            [0.172884899, -0.234003428, 0],
            [0.176794767, -0.239295519, 1.857093791],
            [0.180800012, -0.234003428, 0],
            [0.277109452, -0.106750727, 0],
            [0.109854798, 0.023139429, 0],
            [0.272746342, 0.023139429, 0],
            [0.271601909, 0.057209273, 8.72869401],
            [0.027264242, 0.023139429, 0],
            [0.233173946, 0.197897014, 48.007000773],
            [0.008832717, 0.023139429, 0],
            [0.096082353, 0.251710858, 75.275930858],
            [0.141325955, 0.251710858, 72.01598549],
            [0.10435161, 0.273374169, 75.73],
            [-0.164235251, 0.251710858, 74.255592589],
            [-0.093635953, 0.601180864, 37.68],
            [-0.227046696, 0.251710858, 68.86101819],
            [-0.356782361, 0.395539753, 40.17],
            [-0.301222018, 0.251710858, 53.161085983],
            [-0.489061308, 0.193906312, 30.3249966],
            [-0.451139402, 0.251710858, 40.469593836],
            [-0.328273118, 0.023139429, 0],
            [-0.560559688, -0.06552856, 0],
            [-0.53612343, 0.023139429, 0],
            [-0.328451903, -0.234003428, 0],
            [-0.474895796, -0.33833643, 16.140315341],
            [-0.507657208, -0.234003428, 0],
            [-0.18853437, -0.462574857, 37.48881059],
            [-0.203281669, -0.498757806, 31.11],
            [-0.264544079, -0.462574857, 32.068585054],
            [-0.165958246, -0.462574857, 39.710991563],
            [0.047436719, -0.462574857, 46.356934423],
            [0.057133281, -0.557130004, 27.22],
            [0.092732343, -0.462574857, 42.984423005],
            [0.341756564, -0.462574857, 29.965856668],
            [0.358946952, -0.485842416, 24.73],
            [0.353924001, -0.462574857, 27.340983103],
            [0.304580492, -0.234003428, 0],
            [0.376556681, -0.462574857, 24.69368579],
            [0.549547793, -0.234003428, 0],
            [0.56261616, -0.216736325, 0],
            [0.307794534, 0.023139429, 0],
            [0.554558549, 0.023139429, 0],
            [0.55143418, 0.11615216, 10.608683334],
            [0.296580594, 0.251710858, 54.014306531],
            [0.514407182, 0.251710858, 27.71679577],
            [0.47341377, 0.401790907, 29.54],
            [0.21186539, 0.555032404, 33.79],
            [-0.139755154, 0.897284872, 0],
            [-0.532510986, 0.59035784, 0],
            [-0.495396481, 0.251710858, 34.671782188],
            [-0.634853192, 0.251710858, 16.023122764],
            [-0.729942251, 0.289412407, 0],
            [-0.602873235, 0.023139429, 0],
            [-0.711950569, 0.251710858, 4.124491916],
            [-0.836656251, -0.09780382, 0],
            [-0.803325164, 0.023139429, 0],
            [-0.740332526, 0.251710858, 0],
            [-0.631812375, -0.234003428, 0],
            [-0.649279343, -0.462574857, 8.997881895],
            [-0.708799696, -0.504979746, 0],
            [-0.722115176, -0.462574857, 0],
            [-0.793888465, -0.234003428, 0],
            [-0.303405476, -0.744414635, 0],
            [0.085273554, -0.83153732, 0],
            [0.535741719, -0.725137935, 0],
            [0.549620975, -0.462574857, 12.554854883],
            [0.56170341, -0.234003428, 0],
            [0.734458939, -0.462574857, 0],
            [0.607439063, -0.234003428, 0],
            [0.839725612, -0.323487052, 0],
            [0.781047129, -0.234003428, 0],
            [0.612426859, 0.023139429, 0],
            [0.836719788, -0.234003428, 0],
            [0.828082162, 0.023139429, 0],
            [0.823036089, 0.173361433, 0],
            [0.703118519, 0.251710858, 10.131976209],
            [0.801635441, 0.251710858, 0],
            [0.706587716, 0.599687921, 0],
            [0.316217, 0.828406573, 0]
          ],
          "indices": [
            0, 1, 2,
            1, 3, 4,
            1, 4, 5,
            1, 5, 2,
            4, 6, 5,
            0, 7, 1,
            7, 8, 3,
            7, 3, 1,
            0, 9, 10,
            0, 10, 7,
            10, 8, 7,
            0, 11, 9,
            12, 13, 14,
            0, 12, 14,
            0, 14, 11,
            15, 16, 13,
            15, 13, 12,
            0, 15, 12,
            17, 18, 16,
            17, 16, 15,
            0, 17, 15,
            19, 18, 17,
            0, 20, 19,
            0, 19, 17,
            0, 21, 22,
            0, 22, 20,
            21, 23, 22,
            0, 24, 21,
            24, 25, 23,
            24, 23, 21,
            0, 26, 24,
            26, 27, 28,
            26, 28, 25,
            26, 25, 24,
            27, 29, 28,
            0, 2, 26,
            2, 5, 27,
            2, 27, 26,
            5, 6, 29,
            5, 29, 27,
            4, 3, 30,
            6, 4, 30,
            6, 30, 31,
            3, 32, 30,
            32, 33, 31,
            32, 31, 30,
            3, 8, 34,
            3, 34, 32,
            34, 33, 32,
            8, 35, 36,
            8, 36, 34,
            36, 33, 34,
            10, 9, 37,
            8, 10, 37,
            8, 37, 35,
            9, 38, 39,
            9, 39, 37,
            39, 35, 37,
            9, 11, 38,
            40, 41, 42,
            11, 40, 42,
            11, 42, 38,
            14, 13, 41,
            14, 41, 40,
            11, 14, 40,
            43, 44, 45,
            13, 43, 45,
            13, 45, 41,
            46, 44, 43,
            13, 16, 46,
            13, 46, 43,
            47, 48, 44,
            47, 44, 46,
            16, 47, 46,
            49, 48, 47,
            16, 18, 49,
            16, 49, 47,
            50, 51, 48,
            50, 48, 49,
            18, 50, 49,
            52, 51, 50,
            18, 19, 53,
            18, 53, 52,
            18, 52, 50,
            19, 20, 53,
            54, 51, 52,
            55, 54, 52,
            55, 52, 53,
            20, 56, 55,
            20, 55, 53,
            20, 22, 57,
            20, 57, 56,
            22, 23, 57,
            58, 56, 57,
            23, 59, 58,
            23, 58, 57,
            23, 25, 59,
            25, 60, 61,
            25, 61, 59,
            60, 62, 61,
            25, 28, 60,
            28, 29, 62,
            28, 62, 60,
            29, 63, 62,
            29, 6, 63,
            6, 31, 63,
            31, 33, 64,
            33, 65, 64,
            36, 35, 66,
            33, 36, 66,
            33, 66, 65,
            35, 67, 66,
            67, 68, 65,
            67, 65, 66,
            39, 38, 69,
            35, 39, 69,
            35, 69, 70,
            35, 70, 67,
            70, 68, 67,
            38, 71, 72,
            38, 72, 69,
            72, 73, 70,
            72, 70, 69,
            73, 68, 70,
            42, 41, 74,
            38, 42, 74,
            38, 74, 71,
            75, 76, 77,
            41, 75, 77,
            41, 77, 78,
            41, 78, 74,
            78, 71, 74,
            45, 44, 76,
            45, 76, 75,
            41, 45, 75,
            44, 79, 76,
            44, 48, 79,
            48, 80, 79,
            48, 51, 80,
            51, 81, 80,
            51, 54, 82,
            51, 82, 81,
            54, 55, 83,
            54, 83, 82,
            55, 56, 83,
            84, 81, 82,
            85, 86, 84,
            85, 84, 82,
            85, 82, 83,
            56, 85, 83,
            87, 86, 85,
            56, 58, 88,
            56, 88, 87,
            56, 87, 85,
            58, 59, 88,
            89, 86, 87,
            90, 89, 87,
            90, 87, 88,
            59, 91, 90,
            59, 90, 88,
            59, 61, 92,
            59, 92, 91,
            61, 62, 92,
            93, 91, 92,
            62, 94, 93,
            62, 93, 92,
            62, 63, 94,
            63, 95, 94,
            63, 31, 95,
            31, 64, 95
          ]
        },
        "restingCorridor": {
          "axis": "y",
          "center": -1123.8023996033787,
          "halfWidth": 90
        }
      }
    },
    {
      "id": "crossing-floe-0",
      "x": -1100,
      "y": -350,
      "rx": 110,
      "ry": 85,
      "depth": 80,
      "kind": "island",
      "seed": 2043,
      "iceStyle": "wind-shelf",
      "relief": {
        "center": 13,
        "inner": [
          14.79,
          11.62,
          10.63,
          13.8,
          14.79,
          11.62,
          10.63,
          13.8
        ],
        "middle": [
          7.02,
          7.19,
          6.53,
          5.42,
          4.51,
          4.34,
          5.01,
          6.12
        ]
      },
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-00",
      "x": -4850,
      "y": -4950,
      "rx": 520,
      "ry": 560,
      "depth": 80,
      "kind": "island",
      "seed": 62401,
      "relief": {
        "center": 33,
        "inner": [
          35.88,
          37.85,
          27.66,
          35.88,
          37.85,
          27.66
        ],
        "middle": [
          16,
          19,
          18.34,
          14.68,
          11.68,
          12.34
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-01",
      "x": -4780,
      "y": -3850,
      "rx": 510,
      "ry": 560,
      "depth": 97,
      "kind": "glacier",
      "seed": 62574,
      "relief": {
        "center": 70,
        "inner": [
          71.86,
          84.16,
          78.96,
          63.45,
          59.06,
          71.86,
          84.16,
          78.96,
          63.45,
          59.06
        ],
        "middle": [
          32.56,
          37.39,
          40.33,
          40.26,
          37.21,
          32.34,
          27.51,
          24.57,
          24.64,
          27.69
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-02",
      "x": -4880,
      "y": -2750,
      "rx": 530,
      "ry": 560,
      "depth": 114,
      "kind": "glacier",
      "seed": 62747,
      "relief": {
        "center": 70,
        "inner": [
          67.95,
          58.72,
          62.26,
          75.05,
          84.28,
          80.74,
          67.95,
          58.72,
          62.26,
          75.05,
          84.28,
          80.74
        ],
        "middle": [
          40.62,
          38.97,
          35.57,
          31.33,
          27.39,
          24.81,
          24.28,
          25.93,
          29.33,
          33.57,
          37.51,
          40.09
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-03",
      "x": -4800,
      "y": -1650,
      "rx": 520,
      "ry": 560,
      "depth": 360,
      "kind": "glacier",
      "seed": 62920,
      "relief": {
        "center": 45,
        "inner": [
          45,
          55,
          80,
          65,
          45,
          55,
          75,
          60,
          45,
          50,
          40
        ],
        "middle": [
          60,
          95,
          145,
          110,
          75,
          65,
          120,
          90,
          70,
          100,
          65
        ]
      },
      "biome": "iceberg-tundra"
    },
    {
      "id": "outer-ice-04",
      "x": -4890,
      "y": -550,
      "rx": 500,
      "ry": 560,
      "depth": 148,
      "kind": "island",
      "seed": 63093,
      "relief": {
        "center": 33,
        "inner": [
          35.06,
          38.46,
          27.88,
          35.06,
          38.46,
          27.88
        ],
        "middle": [
          14.94,
          11.78,
          12.18,
          15.74,
          18.9,
          18.5
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-05",
      "x": -4800,
      "y": 550,
      "rx": 520,
      "ry": 560,
      "depth": 80,
      "kind": "glacier",
      "seed": 63266,
      "relief": {
        "center": 70,
        "inner": [
          65.77,
          58.34,
          64.06,
          77.23,
          84.66,
          78.94,
          65.77,
          58.34,
          64.06,
          77.23,
          84.66,
          78.94
        ],
        "middle": [
          24.41,
          26.4,
          30.02,
          34.29,
          38.06,
          40.33,
          40.49,
          38.5,
          34.88,
          30.61,
          26.84,
          24.57
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-06",
      "x": -4880,
      "y": 1650,
      "rx": 530,
      "ry": 560,
      "depth": 97,
      "kind": "glacier",
      "seed": 63439,
      "relief": {
        "center": 70,
        "inner": [
          79.94,
          84.24,
          73.64,
          60.54,
          60.25,
          73.11,
          84.09,
          80.35,
          66.26,
          58.3,
          65.77
        ],
        "middle": [
          35.25,
          39,
          40.67,
          39.73,
          36.48,
          31.95,
          27.57,
          24.75,
          24.37,
          26.56,
          30.61
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-07",
      "x": -4780,
      "y": 2750,
      "rx": 520,
      "ry": 560,
      "depth": 114,
      "kind": "glacier",
      "seed": 63612,
      "relief": {
        "center": 70,
        "inner": [
          60.85,
          60.79,
          75.53,
          84.7,
          75.63,
          60.85,
          60.79,
          75.53,
          84.7,
          75.63
        ],
        "middle": [
          39.81,
          36.21,
          31.18,
          26.63,
          24.3,
          25.09,
          28.69,
          33.72,
          38.27,
          40.6
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-08",
      "x": -4850,
      "y": 3850,
      "rx": 510,
      "ry": 560,
      "depth": 131,
      "kind": "island",
      "seed": 63785,
      "relief": {
        "center": 33,
        "inner": [
          30.15,
          31.25,
          40.01,
          30.15,
          31.25,
          40.01
        ],
        "middle": [
          19.05,
          16.16,
          12.45,
          11.63,
          14.52,
          18.23
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-09",
      "x": -4770,
      "y": 4950,
      "rx": 550,
      "ry": 560,
      "depth": 148,
      "kind": "glacier",
      "seed": 63958,
      "relief": {
        "center": 70,
        "inner": [
          81.59,
          83.43,
          71.32,
          59.42,
          61.64,
          75.39,
          84.59,
          78.48,
          64.21,
          58.46,
          67.95
        ],
        "middle": [
          28.97,
          25.48,
          24.2,
          25.54,
          29.07,
          33.68,
          37.9,
          40.38,
          40.35,
          37.81,
          33.57
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-10",
      "x": -5600,
      "y": -4400,
      "rx": 310,
      "ry": 420,
      "depth": 80,
      "kind": "glacier",
      "seed": 64131,
      "relief": {
        "center": 46,
        "inner": [
          38.66,
          40.39,
          50.35,
          54.77,
          47.55,
          38.66,
          40.39,
          50.35,
          54.77,
          47.55
        ],
        "middle": [
          16.5,
          19.03,
          22.32,
          25.13,
          26.37,
          25.57,
          23.04,
          19.74,
          16.94,
          15.7
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-11",
      "x": -5600,
      "y": -2650,
      "rx": 310,
      "ry": 430,
      "depth": 97,
      "kind": "glacier",
      "seed": 64304,
      "relief": {
        "center": 46,
        "inner": [
          54.71,
          52.08,
          43.71,
          37.98,
          40.61,
          48.98,
          54.71,
          52.08,
          43.71,
          37.98,
          40.61,
          48.98
        ],
        "middle": [
          24.4,
          26.02,
          26.32,
          25.19,
          22.95,
          20.2,
          17.67,
          16.04,
          15.75,
          16.88,
          19.11,
          21.87
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-12",
      "x": -5500,
      "y": -850,
      "rx": 500,
      "ry": 650,
      "depth": 210,
      "kind": "island",
      "seed": 64477,
      "crashSite": true,
      "outline": [
        [
          -1,
          -0.7
        ],
        [
          -0.9,
          -1
        ],
        [
          -0.4,
          -0.96
        ],
        [
          0.1,
          -0.9
        ],
        [
          0.7,
          -0.98
        ],
        [
          1,
          -0.55
        ],
        [
          0.95,
          0.1
        ],
        [
          1,
          0.6
        ],
        [
          0.65,
          0.92
        ],
        [
          0.05,
          1
        ],
        [
          -0.65,
          0.94
        ],
        [
          -1,
          0.7
        ]
      ],
      "relief": {
        "center": 0,
        "inner": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        "middle": [
          0,
          0,
          0,
          0,
          46,
          59,
          78,
          93,
          103,
          0,
          0,
          0
        ]
      },
      "iceStyle": "wind-shelf"
    },
    {
      "id": "outer-ice-13",
      "x": -3830,
      "y": -4050,
      "rx": 420,
      "ry": 450,
      "depth": 131,
      "kind": "glacier",
      "seed": 64650,
      "relief": {
        "center": 62,
        "inner": [
          51.65,
          56.31,
          69.93,
          73.68,
          62.38,
          51.65,
          56.31,
          69.93,
          73.68,
          62.38
        ],
        "middle": [
          34.28,
          30.61,
          26.14,
          22.56,
          21.25,
          22.71,
          26.38,
          30.86,
          34.43,
          35.74
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-14",
      "x": -3820,
      "y": -2450,
      "rx": 450,
      "ry": 470,
      "depth": 148,
      "kind": "glacier",
      "seed": 64823,
      "relief": {
        "center": 66,
        "inner": [
          79.69,
          73.85,
          61.43,
          54.86,
          60.7,
          73.12,
          79.69,
          73.85,
          61.43,
          54.86,
          60.7,
          73.12
        ],
        "middle": [
          25.14,
          23.07,
          23,
          24.95,
          28.4,
          32.41,
          35.93,
          38,
          38.06,
          36.11,
          32.67,
          28.65
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-15",
      "x": -3840,
      "y": -850,
      "rx": 440,
      "ry": 470,
      "depth": 80,
      "kind": "glacier",
      "seed": 64996,
      "relief": {
        "center": 65,
        "inner": [
          77.2,
          74.28,
          61.42,
          53.66,
          60.07,
          73.16,
          77.62,
          68.24,
          55.98,
          55.18,
          66.77
        ],
        "middle": [
          25.49,
          22.83,
          22.39,
          24.33,
          28.01,
          32.29,
          35.79,
          37.4,
          36.62,
          33.69,
          29.54
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-16",
      "x": -3830,
      "y": 750,
      "rx": 420,
      "ry": 470,
      "depth": 97,
      "kind": "island",
      "seed": 65169,
      "relief": {
        "center": 33,
        "inner": [
          27.59,
          36.35,
          37.45,
          27.59,
          36.35,
          37.45
        ],
        "middle": [
          12.45,
          16.16,
          19.05,
          18.23,
          14.52,
          11.63
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-17",
      "x": -3820,
      "y": 2350,
      "rx": 450,
      "ry": 470,
      "depth": 114,
      "kind": "glacier",
      "seed": 65342,
      "relief": {
        "center": 66,
        "inner": [
          79.57,
          71.89,
          59.6,
          54.98,
          62.66,
          74.95,
          79.57,
          71.89,
          59.6,
          54.98,
          62.66,
          74.95
        ],
        "middle": [
          36.4,
          38.15,
          37.87,
          35.62,
          32,
          27.99,
          24.67,
          22.91,
          23.2,
          25.45,
          29.06,
          33.07
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-18",
      "x": -3840,
      "y": 3950,
      "rx": 440,
      "ry": 470,
      "depth": 131,
      "kind": "glacier",
      "seed": 65515,
      "relief": {
        "center": 65,
        "inner": [
          54.54,
          65.28,
          76.61,
          75.27,
          62.84,
          53.84,
          58.8,
          71.92,
          77.86,
          69.67,
          56.93
        ],
        "middle": [
          34.09,
          30.01,
          25.88,
          23.02,
          22.32,
          24.02,
          27.57,
          31.84,
          35.49,
          37.34,
          36.82
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-19",
      "x": 450,
      "y": -3050,
      "rx": 330,
      "ry": 300,
      "depth": 148,
      "kind": "glacier",
      "seed": 65688,
      "relief": {
        "center": 44,
        "inner": [
          36.59,
          42.89,
          51.89,
          51.17,
          41.71,
          36.59,
          42.89,
          51.89,
          51.17,
          41.71
        ],
        "middle": [
          23.87,
          20.97,
          17.83,
          15.66,
          15.28,
          16.84,
          19.74,
          22.88,
          25.05,
          25.43
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-20",
      "x": 320,
      "y": -3740,
      "rx": 360,
      "ry": 290,
      "depth": 80,
      "kind": "island",
      "seed": 65861,
      "relief": {
        "center": 33,
        "inner": [
          39.72,
          29.14,
          32.54,
          39.72,
          29.14,
          32.54
        ],
        "middle": [
          12.18,
          11.78,
          14.94,
          18.5,
          18.9,
          15.74
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-21",
      "x": 100,
      "y": -4330,
      "rx": 410,
      "ry": 300,
      "depth": 97,
      "kind": "glacier",
      "seed": 66034,
      "relief": {
        "center": 44,
        "inner": [
          37.85,
          45.97,
          52.78,
          50.31,
          41.46,
          36.57,
          41.36,
          50.23,
          52.81,
          46.08,
          37.91
        ],
        "middle": [
          17.86,
          20.71,
          23.44,
          25.2,
          25.42,
          24.03,
          21.47,
          18.56,
          16.22,
          15.19,
          15.8
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-22",
      "x": -150,
      "y": -4910,
      "rx": 420,
      "ry": 320,
      "depth": 114,
      "kind": "glacier",
      "seed": 66207,
      "relief": {
        "center": 47,
        "inner": [
          53.93,
          43.64,
          39.15,
          46.67,
          55.8,
          53.93,
          43.64,
          39.15,
          46.67,
          55.8
        ],
        "middle": [
          26.84,
          27.06,
          25.25,
          22.08,
          18.77,
          16.59,
          16.36,
          18.18,
          21.34,
          24.65
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-23",
      "x": -950,
      "y": -5100,
      "rx": 430,
      "ry": 360,
      "depth": 131,
      "kind": "glacier",
      "seed": 66380,
      "relief": {
        "center": 53,
        "inner": [
          62.56,
          54.09,
          45.35,
          45.08,
          53.55,
          62.29,
          62.56,
          54.09,
          45.35,
          45.08,
          53.55,
          62.29
        ],
        "middle": [
          29.76,
          30.64,
          29.85,
          27.6,
          24.51,
          21.39,
          19.09,
          18.22,
          19.01,
          21.25,
          24.34,
          27.46
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-24",
      "x": -1850,
      "y": -5200,
      "rx": 500,
      "ry": 350,
      "depth": 148,
      "kind": "island",
      "seed": 66553,
      "relief": {
        "center": 33,
        "inner": [
          29.2,
          39.75,
          32.45,
          29.2,
          39.75,
          32.45
        ],
        "middle": [
          16.91,
          13.03,
          11.46,
          13.77,
          17.65,
          19.22
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-25",
      "x": -2860,
      "y": -5140,
      "rx": 530,
      "ry": 350,
      "depth": 80,
      "kind": "glacier",
      "seed": 66726,
      "relief": {
        "center": 52,
        "inner": [
          57.66,
          46.31,
          43.28,
          52.75,
          61.63,
          57.66,
          46.31,
          43.28,
          52.75,
          61.63
        ],
        "middle": [
          17.97,
          18.05,
          20.31,
          23.88,
          27.4,
          29.53,
          29.45,
          27.19,
          23.62,
          20.09
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-26",
      "x": -3850,
      "y": -5050,
      "rx": 520,
      "ry": 390,
      "depth": 97,
      "kind": "glacier",
      "seed": 66899,
      "relief": {
        "center": 57,
        "inner": [
          66.72,
          56.7,
          48.28,
          49.89,
          59.91,
          68.33,
          66.72,
          56.7,
          48.28,
          49.89,
          59.91,
          68.33
        ],
        "middle": [
          20.4,
          19.75,
          20.9,
          23.54,
          26.96,
          30.25,
          32.52,
          33.17,
          32.02,
          29.38,
          25.96,
          22.67
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-27",
      "x": 480,
      "y": 3050,
      "rx": 330,
      "ry": 300,
      "depth": 114,
      "kind": "glacier",
      "seed": 67072,
      "relief": {
        "center": 44,
        "inner": [
          39.82,
          48.74,
          53.11,
          47.82,
          39.05,
          37.06,
          44.18,
          52.08,
          51.53,
          43.17,
          36.78
        ],
        "middle": [
          18.7,
          21.61,
          24.12,
          25.44,
          25.15,
          23.33,
          20.57,
          17.74,
          15.74,
          15.21,
          16.31
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-28",
      "x": 350,
      "y": 3740,
      "rx": 360,
      "ry": 290,
      "depth": 131,
      "kind": "island",
      "seed": 67245,
      "relief": {
        "center": 33,
        "inner": [
          36.28,
          27.6,
          37.52,
          36.28,
          27.6,
          37.52
        ],
        "middle": [
          19.16,
          17.93,
          14.11,
          11.52,
          12.75,
          16.57
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-29",
      "x": 100,
      "y": 4330,
      "rx": 410,
      "ry": 300,
      "depth": 148,
      "kind": "glacier",
      "seed": 67418,
      "relief": {
        "center": 44,
        "inner": [
          43.5,
          51.25,
          52.6,
          46.2,
          38.45,
          37.1,
          43.5,
          51.25,
          52.6,
          46.2,
          38.45,
          37.1
        ],
        "middle": [
          20.78,
          18.14,
          16.1,
          15.2,
          15.68,
          17.41,
          19.93,
          22.57,
          24.61,
          25.51,
          25.03,
          23.3
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-30",
      "x": -150,
      "y": 4910,
      "rx": 420,
      "ry": 320,
      "depth": 80,
      "kind": "glacier",
      "seed": 67591,
      "relief": {
        "center": 47,
        "inner": [
          43.79,
          53.3,
          56.42,
          49.51,
          40.65,
          40.19,
          48.68,
          56.19,
          53.93,
          44.56,
          39.02
        ],
        "middle": [
          23.01,
          19.91,
          17.37,
          16.22,
          16.81,
          18.95,
          21.97,
          24.91,
          26.84,
          27.13,
          25.71
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-31",
      "x": -950,
      "y": 5100,
      "rx": 430,
      "ry": 360,
      "depth": 97,
      "kind": "glacier",
      "seed": 67764,
      "relief": {
        "center": 53,
        "inner": [
          56.1,
          45.33,
          46.29,
          57.66,
          63.72,
          56.1,
          45.33,
          46.29,
          57.66,
          63.72
        ],
        "middle": [
          18.26,
          19.01,
          21.84,
          25.65,
          29,
          30.59,
          29.84,
          27.01,
          23.2,
          19.86
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-32",
      "x": -1850,
      "y": 5200,
      "rx": 500,
      "ry": 350,
      "depth": 114,
      "kind": "island",
      "seed": 67937,
      "relief": {
        "center": 33,
        "inner": [
          33.89,
          39.16,
          28.35,
          33.89,
          39.16,
          28.35
        ],
        "middle": [
          15.37,
          18.73,
          18.7,
          15.31,
          11.95,
          11.98
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-33",
      "x": -2860,
      "y": 5140,
      "rx": 530,
      "ry": 350,
      "depth": 131,
      "kind": "glacier",
      "seed": 68110,
      "relief": {
        "center": 52,
        "inner": [
          49.86,
          42.8,
          46.88,
          57.32,
          61.92,
          55.3,
          45.2,
          43.43,
          52.06,
          61,
          59.79
        ],
        "middle": [
          29.73,
          28.36,
          25.53,
          22.13,
          19.24,
          17.78,
          18.22,
          20.41,
          23.67,
          26.94,
          29.2
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-34",
      "x": -3850,
      "y": 5050,
      "rx": 520,
      "ry": 390,
      "depth": 148,
      "kind": "glacier",
      "seed": 68283,
      "relief": {
        "center": 57,
        "inner": [
          58.89,
          48.26,
          51.51,
          64.15,
          68.71,
          58.89,
          48.26,
          51.51,
          64.15,
          68.71
        ],
        "middle": [
          33.19,
          32.01,
          28.71,
          24.56,
          21.13,
          19.74,
          20.91,
          24.21,
          28.37,
          31.79
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-35",
      "x": -3040,
      "y": -1100,
      "rx": 400,
      "ry": 350,
      "depth": 80,
      "kind": "glacier",
      "seed": 68456,
      "relief": {
        "center": 52,
        "inner": [
          54.15,
          61.45,
          59.63,
          50.5,
          43.2,
          45.02,
          54.15,
          61.45,
          59.63,
          50.5,
          43.2,
          45.02
        ],
        "middle": [
          23.17,
          20.25,
          18.26,
          17.74,
          18.83,
          21.24,
          24.32,
          27.25,
          29.24,
          29.76,
          28.67,
          26.26
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-36",
      "x": -2520,
      "y": 750,
      "rx": 280,
      "ry": 250,
      "depth": 97,
      "kind": "island",
      "seed": 68629,
      "relief": {
        "center": 33,
        "inner": [
          31.17,
          30.22,
          40.02,
          31.17,
          30.22,
          40.02
        ],
        "middle": [
          11.53,
          14.17,
          17.97,
          19.15,
          16.51,
          12.71
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    {
      "id": "outer-ice-37",
      "x": -3100,
      "y": 750,
      "rx": 300,
      "ry": 300,
      "depth": 114,
      "kind": "glacier",
      "seed": 68802,
      "relief": {
        "center": 44,
        "inner": [
          50.06,
          52.58,
          44.42,
          36.85,
          40.34,
          50.06,
          52.58,
          44.42,
          36.85,
          40.34
        ],
        "middle": [
          22.08,
          24.62,
          25.53,
          24.46,
          21.83,
          18.63,
          16.09,
          15.18,
          16.25,
          18.88
        ]
      },
      "iceStyle": "wind-shelf",
      "iceTerrainVersion": 1
    },
    ...PREPARED_TUNDRA_EXPANSION
  ],
  "submergedIce": [
    {
      "id": "submerged-0",
      "x": 350,
      "y": -160,
      "z": -87,
      "rx": 107.99916523974389,
      "ry": 86.88585632597096,
      "depth": 99,
      "seed": 3740687845,
      "kind": "submerged"
    },
    {
      "id": "submerged-1",
      "x": -350,
      "y": 170,
      "z": -117,
      "rx": 120.06354326964356,
      "ry": 115.51988757681102,
      "depth": 96,
      "seed": 3143339142,
      "kind": "submerged"
    },
    {
      "id": "submerged-3",
      "x": -51.657994872491436,
      "y": -1464.220414926729,
      "z": -128,
      "rx": 82.21700705704279,
      "ry": 114.93665125221014,
      "depth": 90,
      "seed": 4086666450,
      "kind": "submerged"
    },
    {
      "id": "submerged-4",
      "x": -76.13772824704232,
      "y": -977.4608868861515,
      "z": -110,
      "rx": 96.64363322546706,
      "ry": 68.33303281920962,
      "depth": 82,
      "seed": 3705853191,
      "kind": "submerged"
    },
    {
      "id": "submerged-7",
      "x": -606.4286502578893,
      "y": -2076.672951130445,
      "z": -129,
      "rx": 125.06083126296289,
      "ry": 111.9635705370456,
      "depth": 60,
      "seed": 3918940970,
      "kind": "submerged"
    },
    {
      "id": "submerged-8",
      "x": -779.9116864244357,
      "y": 1636.9890631902863,
      "z": -136,
      "rx": 113.53701469255611,
      "ry": 68.99853824521415,
      "depth": 78,
      "seed": 3118964159,
      "kind": "submerged"
    },
    {
      "id": "submerged-9",
      "x": -1453.0625670002007,
      "y": 1627.1687313132727,
      "z": -123,
      "rx": 90.43276012758724,
      "ry": 94.95028417790309,
      "depth": 78,
      "seed": 950597512,
      "kind": "submerged"
    },
    {
      "id": "submerged-11",
      "x": -273.91797720482884,
      "y": -1679.0712601558419,
      "z": -123,
      "rx": 90.89081675396301,
      "ry": 92.16306874062866,
      "depth": 101,
      "seed": 3631403318,
      "kind": "submerged"
    },
    {
      "id": "submerged-13",
      "x": -470.51894759658853,
      "y": 1108.8543773963484,
      "z": -105,
      "rx": 82.28911221958697,
      "ry": 86.03684527450241,
      "depth": 71,
      "seed": 4141889073,
      "kind": "submerged"
    },
    {
      "id": "submerged-14",
      "x": -550.6303504863133,
      "y": 2107.389188815966,
      "z": -88,
      "rx": 105.76119132805616,
      "ry": 75.44132769224234,
      "depth": 86,
      "seed": 2279952845,
      "kind": "submerged"
    },
    {
      "id": "submerged-15",
      "x": -1821.091935868685,
      "y": 58.5471444465511,
      "z": -103,
      "rx": 103.3280405739788,
      "ry": 113.29915563110262,
      "depth": 73,
      "seed": 1661677326,
      "kind": "submerged"
    },
    {
      "id": "submerged-16",
      "x": -379.80166298921273,
      "y": 850.2275987808373,
      "z": -143,
      "rx": 113.43764714198187,
      "ry": 90.34520628280006,
      "depth": 104,
      "seed": 2348624563,
      "kind": "submerged"
    },
    {
      "id": "submerged-17",
      "x": 725.3744199807228,
      "y": 1044.9644001541183,
      "z": -125,
      "rx": 98.65302287042141,
      "ry": 101.58583621145226,
      "depth": 75,
      "seed": 3935357865,
      "kind": "submerged"
    }
  ],
  "crabs": [
    {
      "id": "seabed-crab-0",
      "x": 151.87495267484337,
      "y": -229.13579557090998,
      "z": -280,
      "seed": 2780870583,
      "scale": 1.1021756948903203,
      "habitat": "seabed",
      "heading": 2.387851443482946,
      "patrolRadius": 6
    },
    {
      "id": "seabed-crab-1",
      "x": 465,
      "y": 135,
      "z": -280,
      "seed": 1314130540,
      "scale": 1.051768105113879,
      "habitat": "seabed",
      "heading": 4.501323880744666,
      "patrolRadius": 6
    },
    {
      "id": "seabed-crab-2",
      "x": -340,
      "y": -120,
      "z": -280,
      "seed": 2112569285,
      "scale": 0.9021049080602825,
      "habitat": "seabed",
      "heading": 3.7067381309902245,
      "patrolRadius": 6
    },
    {
      "id": "seabed-crab-3",
      "x": 730,
      "y": 80,
      "z": -278.856688,
      "seed": 644073106,
      "scale": 1.0546292119380087,
      "habitat": "seabed",
      "heading": 2.083165678360706,
      "patrolRadius": 6
    },
    {
      "id": "seabed-crab-4",
      "x": -560,
      "y": 300,
      "z": -280,
      "seed": 2101558755,
      "scale": 0.8519241051748395,
      "habitat": "seabed",
      "heading": 2.7163481240825336,
      "patrolRadius": 6
    },
    {
      "id": "coral-crab-0",
      "x": 1175.6722485646605,
      "y": -700.1947976322845,
      "z": -267.099666,
      "seed": 3849481066,
      "scale": 0.8647499667573721,
      "habitat": "seabed",
      "heading": 6.07194078063714,
      "patrolRadius": 6
    },
    {
      "id": "coral-crab-1",
      "x": 1358.384524951689,
      "y": 371.6583208087832,
      "z": -313.13119265518344,
      "seed": 1600599785,
      "scale": 1.1601150406524539,
      "habitat": "seabed",
      "heading": 3.566368712840529,
      "patrolRadius": 6
    },
    {
      "id": "coral-crab-2",
      "x": 2333.8256873190403,
      "y": -861.7473016027361,
      "z": -2515,
      "seed": 252834754,
      "scale": 0.947090027583763,
      "habitat": "seabed",
      "heading": 6.02333144194307,
      "patrolRadius": 6
    },
    {
      "id": "coral-crab-3",
      "x": 2465.0674434844404,
      "y": 600,
      "z": -2409.523098068318,
      "seed": 2327462299,
      "scale": 0.9949720344319941,
      "habitat": "seabed",
      "heading": 5.649175708557806,
      "patrolRadius": 6
    },
    {
      "id": "coral-crab-4",
      "x": 2600,
      "y": -350,
      "z": -2515,
      "seed": 2163749920,
      "scale": 0.8663736359495671,
      "habitat": "seabed",
      "heading": 4.83341504469177,
      "patrolRadius": 6
    },
    {
      "id": "coral-crab-5",
      "x": 2900,
      "y": 680,
      "z": -2439.4815826416016,
      "seed": 1366068617,
      "scale": 1.161888820845634,
      "habitat": "seabed",
      "heading": 2.791051576444034,
      "patrolRadius": 6
    },
    {
      "id": "coral-crab-6",
      "x": 3252.707773754373,
      "y": -1312.6283911941573,
      "z": -2427.263985479811,
      "seed": 2872709796,
      "scale": 0.9522299044858665,
      "habitat": "seabed",
      "heading": 5.591670700031953,
      "patrolRadius": 6
    },
    {
      "id": "coral-crab-7",
      "x": 3550,
      "y": 650,
      "z": -2515,
      "seed": 739784797,
      "scale": 1.1989090803824367,
      "habitat": "seabed",
      "heading": 3.956507249025112,
      "patrolRadius": 6
    }
  ],
  "iceSpikes": [
    {
      "id": "floe-0-underside-spike-0",
      "x": -20.137697697572698,
      "y": 30.92609486392088,
      "z": -195,
      "radius": 3.3600322252996264,
      "length": 26.17295467268717,
      "seed": 1657400732
    },
    {
      "id": "floe-0-underside-spike-1",
      "x": -41.17491255742753,
      "y": 23.98683964017694,
      "z": -195,
      "radius": 5.556776098519563,
      "length": 44,
      "seed": 237098050
    },
    {
      "id": "floe-0-underside-spike-2",
      "x": -6.471009289501735,
      "y": -37.30307599170912,
      "z": -195,
      "radius": 5.651558746101335,
      "length": 39.01248043076181,
      "seed": 1092689755
    },
    {
      "id": "floe-0-underside-spike-3",
      "x": -33.21711397688803,
      "y": 38.84868379877706,
      "z": -195,
      "radius": 3.0180225336067377,
      "length": 30.43469240623733,
      "seed": 1393737864
    },
    {
      "id": "floe-0-underside-spike-4",
      "x": 1.3588005800931178,
      "y": 39.579596790631086,
      "z": -195,
      "radius": 4.741087349049747,
      "length": 41.95555252751723,
      "seed": 1737013454
    },
    {
      "id": "floe-0-underside-spike-5",
      "x": -41.836978553714374,
      "y": -37.541705295961165,
      "z": -195,
      "radius": 4.114790728513151,
      "length": 35.886489308591166,
      "seed": 1945337700
    },
    {
      "id": "floe-0-underside-spike-6",
      "x": -34.089572537037164,
      "y": -19.962141104747886,
      "z": -195,
      "radius": 3.4167541539575903,
      "length": 32.81067837260947,
      "seed": 4209174373
    },
    {
      "id": "floe-0-underside-spike-7",
      "x": -39.517077278234346,
      "y": 2.3221652418197283,
      "z": -195,
      "radius": 4.795971233563497,
      "length": 29.89335997574916,
      "seed": 3331170435
    },
    {
      "id": "floe-0-underside-spike-8",
      "x": -47.30295016125523,
      "y": -10.084552834103125,
      "z": -195,
      "radius": 6.195740360464901,
      "length": 44,
      "seed": 713885136
    },
    {
      "id": "floe-0-underside-spike-9",
      "x": -37.12282477760556,
      "y": -45.81161048542701,
      "z": -195,
      "radius": 3.327156779296696,
      "length": 27.800487702501712,
      "seed": 2836732374
    },
    {
      "id": "floe-0-underside-spike-10",
      "x": 21.629353084549955,
      "y": 42.847604276885264,
      "z": -195,
      "radius": 5.509003765353933,
      "length": 33.21734487145524,
      "seed": 1599163135
    },
    {
      "id": "floe-0-underside-spike-11",
      "x": 27.706542494040878,
      "y": -25.492229427510164,
      "z": -195,
      "radius": 3.1535622304882853,
      "length": 31.40302047945192,
      "seed": 2793928501
    },
    {
      "id": "floe-1-underside-spike-0",
      "x": 239.43507763449242,
      "y": 61.274374343258756,
      "z": -64,
      "radius": 3.9979734637308866,
      "length": 26.181213412486997,
      "seed": 610042519
    },
    {
      "id": "floe-1-underside-spike-1",
      "x": 258.00372105223744,
      "y": 61.103834892954644,
      "z": -64,
      "radius": 3.771797879366204,
      "length": 26.232535704453706,
      "seed": 1988074405
    },
    {
      "id": "floe-1-underside-spike-2",
      "x": 271.3222061247478,
      "y": 25.933037753227353,
      "z": -64,
      "radius": 3.299550930270925,
      "length": 25.65581336685879,
      "seed": 3507643075
    },
    {
      "id": "floe-1-underside-spike-3",
      "x": 250.7640433584606,
      "y": 68.2468676813626,
      "z": -64,
      "radius": 3.213565388461575,
      "length": 24.43819877866651,
      "seed": 2833617777
    },
    {
      "id": "floe-1-underside-spike-4",
      "x": 246.37622128738616,
      "y": 25.328252699787935,
      "z": -64,
      "radius": 3.1486859193537384,
      "length": 28.88563162526047,
      "seed": 80988387
    },
    {
      "id": "floe-1-underside-spike-5",
      "x": 272.0044651424681,
      "y": 58.44801870574201,
      "z": -64,
      "radius": 3.4355154500808567,
      "length": 29.829250416542372,
      "seed": 2961416337
    },
    {
      "id": "floe-1-underside-spike-6",
      "x": 272.48518221522465,
      "y": 35.22305029265378,
      "z": -64,
      "radius": 3.2269407354760915,
      "length": 30.301842451977144,
      "seed": 2793751287
    },
    {
      "id": "floe-1-underside-spike-7",
      "x": 234.36787061185754,
      "y": 42.47044818679771,
      "z": -64,
      "radius": 3.158117872895673,
      "length": 26.312780770591196,
      "seed": 1622474159
    },
    {
      "id": "floe-2-underside-spike-0",
      "x": 428.8028819146443,
      "y": -48.296501788691984,
      "z": -49,
      "radius": 3.283705268232152,
      "length": 31.535244761027407,
      "seed": 1912816789
    },
    {
      "id": "floe-2-underside-spike-1",
      "x": 415.2053578407978,
      "y": -36.32242041253254,
      "z": -49,
      "radius": 3.956752118239179,
      "length": 32.28721389609113,
      "seed": 2158090291
    },
    {
      "id": "floe-2-underside-spike-2",
      "x": 458.4827341292366,
      "y": -42.072285612880925,
      "z": -49,
      "radius": 3.6161486767139284,
      "length": 30.450397199437667,
      "seed": 1529925985
    },
    {
      "id": "floe-2-underside-spike-3",
      "x": 428.77121829946327,
      "y": -8.78026929941758,
      "z": -49,
      "radius": 3.8389680015463385,
      "length": 28.45010667941746,
      "seed": 1907871647
    },
    {
      "id": "floe-2-underside-spike-4",
      "x": 457.724643587013,
      "y": -20.326115767089163,
      "z": -49,
      "radius": 3.7472276334296915,
      "length": 27.927088102651346,
      "seed": 385619565
    },
    {
      "id": "floe-2-underside-spike-5",
      "x": 422.1609190468663,
      "y": -20.74665326868832,
      "z": -49,
      "radius": 4.087836103588343,
      "length": 34.62062436582865,
      "seed": 4041699650
    },
    {
      "id": "floe-2-underside-spike-6",
      "x": 445.61877829356456,
      "y": -46.346080334153655,
      "z": -49,
      "radius": 3.6213126370031388,
      "length": 32.22284302365589,
      "seed": 1189143503
    },
    {
      "id": "floe-2-underside-spike-7",
      "x": 466.7721885462518,
      "y": -23.677351340106238,
      "z": -49,
      "radius": 3.3233297582902015,
      "length": 27.714431855943605,
      "seed": 2882572428
    },
    {
      "id": "floe-3-underside-spike-0",
      "x": 660.0811217348862,
      "y": 6.432151398907521,
      "z": -65,
      "radius": 4.244022898407653,
      "length": 33.077423215541714,
      "seed": 3722972547
    },
    {
      "id": "floe-3-underside-spike-1",
      "x": 668.2344115009564,
      "y": 15.747722774287439,
      "z": -65,
      "radius": 4.190424098907039,
      "length": 33.74180573451838,
      "seed": 3771562033
    },
    {
      "id": "floe-3-underside-spike-2",
      "x": 663.1387478387122,
      "y": 49.62332162605418,
      "z": -65,
      "radius": 3.4990265093520287,
      "length": 31.41245256523131,
      "seed": 2124473046
    },
    {
      "id": "floe-3-underside-spike-3",
      "x": 617.4101851384213,
      "y": 16.32749068260425,
      "z": -65,
      "radius": 3.489518125165254,
      "length": 24.797171368346678,
      "seed": 4072517420
    },
    {
      "id": "floe-3-underside-spike-4",
      "x": 617.2565794784433,
      "y": 2.7685137308347088,
      "z": -65,
      "radius": 3.2575515341665597,
      "length": 26.111545361093103,
      "seed": 2509403085
    },
    {
      "id": "floe-3-underside-spike-5",
      "x": 670.5720483540186,
      "y": 29.814345401642697,
      "z": -65,
      "radius": 3.7682728331554682,
      "length": 32.70247575311481,
      "seed": 758097835
    },
    {
      "id": "floe-3-underside-spike-6",
      "x": 631.9789404242259,
      "y": 2.9757550630921337,
      "z": -65,
      "radius": 4.257184909176082,
      "length": 29.145764758023947,
      "seed": 2110392600
    },
    {
      "id": "floe-3-underside-spike-7",
      "x": 621.6167667877777,
      "y": 31.678645124562898,
      "z": -65,
      "radius": 3.8292203115094456,
      "length": 32.22242685667226,
      "seed": 2197373387
    },
    {
      "id": "floe-4-underside-spike-0",
      "x": 61.37006012666397,
      "y": -243.89271729088486,
      "z": -50,
      "radius": 3.7243560075294226,
      "length": 35.17106996578626,
      "seed": 1918913501
    },
    {
      "id": "floe-4-underside-spike-1",
      "x": 48.50745276036963,
      "y": -245.18275180146728,
      "z": -50,
      "radius": 3.970424078637734,
      "length": 30.35512286382148,
      "seed": 1367370555
    },
    {
      "id": "floe-4-underside-spike-2",
      "x": 60.31676449198281,
      "y": -277.82639419594466,
      "z": -50,
      "radius": 3.4662368667777628,
      "length": 25.494854140594356,
      "seed": 3991331369
    },
    {
      "id": "floe-4-underside-spike-3",
      "x": 90.2493209766972,
      "y": -273.6863460092018,
      "z": -50,
      "radius": 3.0906283513177186,
      "length": 26.0021464364887,
      "seed": 1572159527
    },
    {
      "id": "floe-4-underside-spike-4",
      "x": 89.41613187955474,
      "y": -248.88295051082412,
      "z": -50,
      "radius": 3.9881111558061093,
      "length": 37.41052092272645,
      "seed": 3234805941
    },
    {
      "id": "floe-4-underside-spike-5",
      "x": 79.8982462112708,
      "y": -279.6219240897651,
      "z": -50,
      "radius": 3.5340237743221223,
      "length": 25.82205241954435,
      "seed": 2165619928
    },
    {
      "id": "floe-4-underside-spike-6",
      "x": 76.36437526418504,
      "y": -245.52717976186733,
      "z": -50,
      "radius": 3.2982693924568594,
      "length": 24.148393857629507,
      "seed": 2184054568
    },
    {
      "id": "floe-4-underside-spike-7",
      "x": 43.514009528293336,
      "y": -268.80659135467045,
      "z": -50,
      "radius": 3.7242503678426147,
      "length": 25.786365877640286,
      "seed": 1826030190
    },
    {
      "id": "floe-5-underside-spike-0",
      "x": -34.60512712411304,
      "y": -414.3638371271443,
      "z": -35,
      "radius": 3.917600218104199,
      "length": 32.56759974015712,
      "seed": 1439779167
    },
    {
      "id": "floe-5-underside-spike-1",
      "x": -49.10245893310551,
      "y": -459.9448081563699,
      "z": -35,
      "radius": 3.1888397106807678,
      "length": 30.662453834510448,
      "seed": 4262105645
    },
    {
      "id": "floe-5-underside-spike-2",
      "x": -24.141949581222814,
      "y": -417.88546099005384,
      "z": -35,
      "radius": 4.016460532704368,
      "length": 35.92268778929595,
      "seed": 252140299
    },
    {
      "id": "floe-5-underside-spike-3",
      "x": -44.035657103358325,
      "y": -423.58370247043166,
      "z": -35,
      "radius": 3.311909178039059,
      "length": 32.100860626289055,
      "seed": 921390969
    },
    {
      "id": "floe-5-underside-spike-4",
      "x": -13.961873292140325,
      "y": -425.32995883033027,
      "z": -35,
      "radius": 4.2176911863405255,
      "length": 32.36865162028515,
      "seed": 4202192631
    },
    {
      "id": "floe-5-underside-spike-5",
      "x": -18.36450446305175,
      "y": -457.78327767631794,
      "z": -35,
      "radius": 3.95179123277776,
      "length": 32.75287922381423,
      "seed": 1765252357
    },
    {
      "id": "floe-5-underside-spike-6",
      "x": -48.86474816319806,
      "y": -435.3720155628876,
      "z": -35,
      "radius": 3.906123224599287,
      "length": 26.263994978628478,
      "seed": 3086198421
    },
    {
      "id": "floe-5-underside-spike-7",
      "x": -53.380818106956895,
      "y": -425.15656862205674,
      "z": -35,
      "radius": 3.9112086194101723,
      "length": 34.52357530335702,
      "seed": 4245465651
    },
    {
      "id": "floe-6-underside-spike-0",
      "x": 103.34699467746464,
      "y": -649.7624785524858,
      "z": -51,
      "radius": 3.673440941652283,
      "length": 25.70850819882766,
      "seed": 2821207445
    },
    {
      "id": "floe-6-underside-spike-1",
      "x": 94.9486986971097,
      "y": -605.672689816667,
      "z": -51,
      "radius": 3.29293731097877,
      "length": 26.016493717181973,
      "seed": 3849546890
    },
    {
      "id": "floe-6-underside-spike-2",
      "x": 122.34741129274866,
      "y": -622.3844834123134,
      "z": -51,
      "radius": 3.965552491363138,
      "length": 29.00131797606333,
      "seed": 2721118784
    },
    {
      "id": "floe-6-underside-spike-3",
      "x": 89.45774684048406,
      "y": -648.7227946937755,
      "z": -51,
      "radius": 3.7738521345388145,
      "length": 30.6669457570518,
      "seed": 1254310641
    },
    {
      "id": "floe-6-underside-spike-4",
      "x": 131.57708985490058,
      "y": -629.2767374812458,
      "z": -51,
      "radius": 3.33010120354034,
      "length": 27.01299462492307,
      "seed": 2575466671
    },
    {
      "id": "floe-6-underside-spike-5",
      "x": 109.84913512512445,
      "y": -603.8483133793421,
      "z": -51,
      "radius": 3.3616963848229497,
      "length": 29.608946697991396,
      "seed": 1492101885
    },
    {
      "id": "floe-6-underside-spike-6",
      "x": 69.72617434627523,
      "y": -625.18837778928,
      "z": -51,
      "radius": 3.0185259056109937,
      "length": 30.11759142547621,
      "seed": 3592513883
    },
    {
      "id": "floe-6-underside-spike-7",
      "x": 79.14364776597736,
      "y": -618.7630114217726,
      "z": -51,
      "radius": 3.100688535807654,
      "length": 31.386524911768447,
      "seed": 428459849
    },
    {
      "id": "floe-7-underside-spike-0",
      "x": -257.66876382080073,
      "y": 23.562747748063092,
      "z": -36,
      "radius": 4.0589650846738365,
      "length": 29.36478437735613,
      "seed": 2634009859
    },
    {
      "id": "floe-7-underside-spike-1",
      "x": -257.96842490011034,
      "y": -19.65697398276973,
      "z": -36,
      "radius": 3.5128852844517677,
      "length": 24.422195975199486,
      "seed": 897178545
    },
    {
      "id": "floe-7-underside-spike-2",
      "x": -290.33712347615,
      "y": 9.961791365246185,
      "z": -36,
      "radius": 4.194798411810771,
      "length": 37.09517475480162,
      "seed": 1868718959
    },
    {
      "id": "floe-7-underside-spike-3",
      "x": -290.91594704160076,
      "y": 21.523803764891877,
      "z": -36,
      "radius": 3.534973408391699,
      "length": 32.713507166662225,
      "seed": 3421112253
    },
    {
      "id": "floe-7-underside-spike-4",
      "x": -273.37433902814536,
      "y": 33.54281565591139,
      "z": -36,
      "radius": 3.883966615498066,
      "length": 34.63281231452537,
      "seed": 3657725650
    },
    {
      "id": "floe-7-underside-spike-5",
      "x": -282.2002396595207,
      "y": 25.065114135683434,
      "z": -36,
      "radius": 3.4179882428348067,
      "length": 33.664976120310385,
      "seed": 2651334562
    },
    {
      "id": "floe-7-underside-spike-6",
      "x": -252.05307408898872,
      "y": -3.1055413726600865,
      "z": -36,
      "radius": 4.180613013278693,
      "length": 26.854376165545016,
      "seed": 3912867480
    },
    {
      "id": "floe-7-underside-spike-7",
      "x": -243.2983026043447,
      "y": 7.1942175629027565,
      "z": -36,
      "radius": 3.0791765615567566,
      "length": 30.822723644572843,
      "seed": 3809137246
    },
    {
      "id": "floe-8-underside-spike-0",
      "x": -480.1814831698027,
      "y": 94.99613135673043,
      "z": -52,
      "radius": 3.2771688296925277,
      "length": 29.816829460913073,
      "seed": 2134942973
    },
    {
      "id": "floe-8-underside-spike-1",
      "x": -444.95607902699777,
      "y": 113.1739271067645,
      "z": -52,
      "radius": 3.953309148782864,
      "length": 27.55600276467661,
      "seed": 617223003
    },
    {
      "id": "floe-8-underside-spike-2",
      "x": -434.12274321518174,
      "y": 105.31259403711542,
      "z": -52,
      "radius": 3.826060318853706,
      "length": 28.613491959293295,
      "seed": 28394632
    },
    {
      "id": "floe-8-underside-spike-3",
      "x": -479.8337375372165,
      "y": 110.4121978697756,
      "z": -52,
      "radius": 3.2269691603723913,
      "length": 23.660439676826993,
      "seed": 553780603
    },
    {
      "id": "floe-8-underside-spike-4",
      "x": -472.0619425361861,
      "y": 77.77150603910782,
      "z": -52,
      "radius": 3.1023470682557672,
      "length": 26.96850200748491,
      "seed": 2003950185
    },
    {
      "id": "floe-8-underside-spike-5",
      "x": -459.37202670131353,
      "y": 124.30522546395284,
      "z": -52,
      "radius": 3.8630115350242704,
      "length": 31.378727650633184,
      "seed": 1673186553
    },
    {
      "id": "floe-8-underside-spike-6",
      "x": -469.0847392879277,
      "y": 120.57424616466945,
      "z": -52,
      "radius": 3.3493210815358907,
      "length": 32.534012869198186,
      "seed": 4135129207
    },
    {
      "id": "floe-8-underside-spike-7",
      "x": -455.59600804840187,
      "y": 115.45433271672066,
      "z": -52,
      "radius": 3.479095912305638,
      "length": 27.668573093980104,
      "seed": 2156847749
    },
    {
      "id": "floe-9-underside-spike-0",
      "x": -644.9999629145157,
      "y": 3.032931308813729,
      "z": -37,
      "radius": 3.2293692434672265,
      "length": 25.419724864391988,
      "seed": 1467497479
    },
    {
      "id": "floe-9-underside-spike-1",
      "x": -646.2693842876301,
      "y": 20.51495359800877,
      "z": -37,
      "radius": 3.5804253281559797,
      "length": 29.65815330190656,
      "seed": 395312533
    },
    {
      "id": "floe-9-underside-spike-2",
      "x": -658.1488726071826,
      "y": 22.639795008318742,
      "z": -37,
      "radius": 3.0687305972445755,
      "length": 30.572262961211436,
      "seed": 1895663923
    },
    {
      "id": "floe-9-underside-spike-3",
      "x": -642.6180961808728,
      "y": -8.273877535348554,
      "z": -37,
      "radius": 3.0139315403066576,
      "length": 24.175782320244952,
      "seed": 1309680192
    },
    {
      "id": "floe-9-underside-spike-4",
      "x": -688.9158065754931,
      "y": -15.743321343824546,
      "z": -37,
      "radius": 4.5839119562879205,
      "length": 39.596505051489515,
      "seed": 2525628102
    },
    {
      "id": "floe-9-underside-spike-5",
      "x": -675.8603978559348,
      "y": 27.470610552056005,
      "z": -37,
      "radius": 3.6745189948473125,
      "length": 28.095907209673612,
      "seed": 3676932271
    },
    {
      "id": "floe-9-underside-spike-6",
      "x": -645.6803978416083,
      "y": -17.836210756811703,
      "z": -37,
      "radius": 3.067144416784868,
      "length": 23.215666791026663,
      "seed": 812937981
    },
    {
      "id": "floe-9-underside-spike-7",
      "x": -652.3552205078511,
      "y": -26.874816235342642,
      "z": -37,
      "radius": 4.747347901761532,
      "length": 42.36980721484787,
      "seed": 1247996690
    },
    {
      "id": "floe-10-underside-spike-0",
      "x": 65.37923109088193,
      "y": 263.7833241444195,
      "z": -53,
      "radius": 3.6797407427430153,
      "length": 34.8869833571121,
      "seed": 4166633746
    },
    {
      "id": "floe-10-underside-spike-1",
      "x": 80.6018451111815,
      "y": 242.46882630552443,
      "z": -53,
      "radius": 3.0243477028794588,
      "length": 27.26473115924928,
      "seed": 2899224712
    },
    {
      "id": "floe-10-underside-spike-2",
      "x": 72.78424295187253,
      "y": 280.3178330898699,
      "z": -53,
      "radius": 3.499419265575707,
      "length": 30.49090602809227,
      "seed": 3907215566
    },
    {
      "id": "floe-10-underside-spike-3",
      "x": 68.94996426493171,
      "y": 248.27854436083126,
      "z": -53,
      "radius": 3.8078088637255134,
      "length": 36.06070860205649,
      "seed": 1585899364
    },
    {
      "id": "floe-10-underside-spike-4",
      "x": 112.21748434451524,
      "y": 256.7631448792558,
      "z": -53,
      "radius": 3.8878099078685047,
      "length": 33.77879826811806,
      "seed": 816293322
    },
    {
      "id": "floe-10-underside-spike-5",
      "x": 105.30532629573617,
      "y": 278.7327060624411,
      "z": -53,
      "radius": 4.042056008968502,
      "length": 37.54528351446747,
      "seed": 907467136
    },
    {
      "id": "floe-10-underside-spike-6",
      "x": 107.86961441805556,
      "y": 247.56136288231198,
      "z": -53,
      "radius": 3.24332000490278,
      "length": 28.433897643610933,
      "seed": 3147363334
    },
    {
      "id": "floe-10-underside-spike-7",
      "x": 115.62522721921894,
      "y": 271.32844194362775,
      "z": -53,
      "radius": 3.8945619093161077,
      "length": 26.411876501435675,
      "seed": 3409587875
    },
    {
      "id": "floe-11-underside-spike-0",
      "x": 339.18970782922423,
      "y": 296.80823717726213,
      "z": -38,
      "radius": 4.187711096618324,
      "length": 36.00944063825311,
      "seed": 3409983236
    },
    {
      "id": "floe-11-underside-spike-1",
      "x": 312.19565385190737,
      "y": 308.4961758218479,
      "z": -38,
      "radius": 4.075204055652023,
      "length": 35.24710151078904,
      "seed": 3270799466
    },
    {
      "id": "floe-11-underside-spike-2",
      "x": 334.2556729703494,
      "y": 279.8617480543876,
      "z": -38,
      "radius": 3.2808211430925875,
      "length": 29.091109393847464,
      "seed": 495844259
    },
    {
      "id": "floe-11-underside-spike-3",
      "x": 283.55256056545966,
      "y": 296.0428019021179,
      "z": -38,
      "radius": 3.236670673219487,
      "length": 24.067521640613702,
      "seed": 1969343825
    },
    {
      "id": "floe-11-underside-spike-4",
      "x": 297.76157402248657,
      "y": 264.59626647244977,
      "z": -38,
      "radius": 3.3629959991220386,
      "length": 30.41194992860442,
      "seed": 2593538063
    },
    {
      "id": "floe-11-underside-spike-5",
      "x": 317.1243680610515,
      "y": 272.58528355680187,
      "z": -38,
      "radius": 3.7457282633688305,
      "length": 31.836596920615822,
      "seed": 2272835421
    },
    {
      "id": "floe-11-underside-spike-6",
      "x": 292.5822560476275,
      "y": 277.40029100416365,
      "z": -38,
      "radius": 3.323987605797127,
      "length": 32.66899797985096,
      "seed": 10558139
    },
    {
      "id": "floe-11-underside-spike-7",
      "x": 282.01670013134395,
      "y": 280.1586105197604,
      "z": -38,
      "radius": 3.7398088562618943,
      "length": 33.62511068107018,
      "seed": 3815290281
    },
    {
      "id": "floe-12-underside-spike-0",
      "x": 538.1780592256118,
      "y": 279.79572944530884,
      "z": -54,
      "radius": 3.2511647064238787,
      "length": 26.55361131970119,
      "seed": 747411546
    },
    {
      "id": "floe-12-underside-spike-1",
      "x": 548.1583879321082,
      "y": 269.0397171277057,
      "z": -54,
      "radius": 4.330931726362556,
      "length": 33.28881352994367,
      "seed": 3229270928
    },
    {
      "id": "floe-12-underside-spike-2",
      "x": 510.5693716435586,
      "y": 237.16800259128044,
      "z": -54,
      "radius": 4.360882613427938,
      "length": 28.574296103044986,
      "seed": 1089517974
    },
    {
      "id": "floe-12-underside-spike-3",
      "x": 528.9098856574795,
      "y": 283.6174155214734,
      "z": -54,
      "radius": 3.933026668567211,
      "length": 29.11325208644222,
      "seed": 2867290092
    },
    {
      "id": "floe-12-underside-spike-4",
      "x": 554.9872682441245,
      "y": 260.8427566181866,
      "z": -54,
      "radius": 3.2840495879407974,
      "length": 32.36660002848525,
      "seed": 3366570893
    },
    {
      "id": "floe-12-underside-spike-5",
      "x": 509.26030713746775,
      "y": 252.0744472565583,
      "z": -54,
      "radius": 4.009758185153827,
      "length": 27.308354176169587,
      "seed": 3694892829
    },
    {
      "id": "floe-12-underside-spike-6",
      "x": 549.1510204932562,
      "y": 254.14997611674755,
      "z": -54,
      "radius": 3.4213307063933462,
      "length": 29.225643354528717,
      "seed": 1066305197
    },
    {
      "id": "floe-12-underside-spike-7",
      "x": 536.4517912213719,
      "y": 240.34676634024504,
      "z": -54,
      "radius": 3.0868171290457247,
      "length": 29.881176002985054,
      "seed": 2747264642
    },
    {
      "id": "floe-13-underside-spike-0",
      "x": -175.6482193333631,
      "y": 287.2642433506137,
      "z": -39,
      "radius": 3.2520399379916487,
      "length": 32.33734959555986,
      "seed": 1083593288
    },
    {
      "id": "floe-13-underside-spike-1",
      "x": -129.6295572399729,
      "y": 299.88061593612804,
      "z": -39,
      "radius": 3.3391627540066837,
      "length": 33.1706950927643,
      "seed": 2410843278
    },
    {
      "id": "floe-13-underside-spike-2",
      "x": -133.387643634457,
      "y": 286.77841892992564,
      "z": -39,
      "radius": 3.645684118475765,
      "length": 34.83378534401693,
      "seed": 1823933732
    },
    {
      "id": "floe-13-underside-spike-3",
      "x": -161.04307265036002,
      "y": 273.810068154368,
      "z": -39,
      "radius": 3.0940438652783633,
      "length": 23.92152900127872,
      "seed": 3795494282
    },
    {
      "id": "floe-13-underside-spike-4",
      "x": -150.38642432572138,
      "y": 272.98219413764343,
      "z": -39,
      "radius": 3.597573369322345,
      "length": 28.262928176772974,
      "seed": 2957220675
    },
    {
      "id": "floe-13-underside-spike-5",
      "x": -156.20117411096965,
      "y": 319.5951111955781,
      "z": -39,
      "radius": 3.787948391083628,
      "length": 30.3141557462101,
      "seed": 3700535184
    },
    {
      "id": "floe-13-underside-spike-6",
      "x": -174.70172437436193,
      "y": 309.81204771225225,
      "z": -39,
      "radius": 3.372837388040498,
      "length": 25.81749731574802,
      "seed": 1641471105
    },
    {
      "id": "floe-13-underside-spike-7",
      "x": -136.37800747389772,
      "y": 306.59508533575763,
      "z": -39,
      "radius": 3.526154245790094,
      "length": 27.15010906776212,
      "seed": 2297794484
    },
    {
      "id": "floe-14-underside-spike-0",
      "x": -376.93832457786453,
      "y": 358.71352727536663,
      "z": -55,
      "radius": 3.2238905020058155,
      "length": 28.446320009463186,
      "seed": 417790210
    },
    {
      "id": "floe-14-underside-spike-1",
      "x": -400.7735629204876,
      "y": 347.6651979931846,
      "z": -55,
      "radius": 3.954821308609098,
      "length": 27.892962551515247,
      "seed": 3440815352
    },
    {
      "id": "floe-14-underside-spike-2",
      "x": -367.7711837103305,
      "y": 323.2818915404859,
      "z": -55,
      "radius": 3.1727607934735715,
      "length": 31.217754389812107,
      "seed": 2695659336
    },
    {
      "id": "floe-14-underside-spike-3",
      "x": -364.4944253046769,
      "y": 357.7187051006167,
      "z": -55,
      "radius": 3.0178129067644477,
      "length": 24.46769744600696,
      "seed": 480973198
    },
    {
      "id": "floe-14-underside-spike-4",
      "x": -357.02538002627097,
      "y": 351.4061127678552,
      "z": -55,
      "radius": 3.557913221884519,
      "length": 32.14863566027532,
      "seed": 2335253028
    },
    {
      "id": "floe-14-underside-spike-5",
      "x": -403.010733695074,
      "y": 333.3932596603447,
      "z": -55,
      "radius": 3.205830408958718,
      "length": 23.76141156876253,
      "seed": 4194654501
    },
    {
      "id": "floe-14-underside-spike-6",
      "x": -393.18781508017116,
      "y": 353.57365863948536,
      "z": -55,
      "radius": 3.6160678807646036,
      "length": 31.247628035000826,
      "seed": 3642169690
    },
    {
      "id": "floe-14-underside-spike-7",
      "x": -347.55529893495503,
      "y": 350.10036170655246,
      "z": -55,
      "radius": 3.476111475843936,
      "length": 31.10413775785711,
      "seed": 2019509780
    },
    {
      "id": "floe-15-underside-spike-0",
      "x": -606.3490788245351,
      "y": 269.13636317243987,
      "z": -40,
      "radius": 3.0827045482583344,
      "length": 22.55515594584366,
      "seed": 3202862356
    },
    {
      "id": "floe-15-underside-spike-1",
      "x": -598.9763554279887,
      "y": 275.31885038001184,
      "z": -40,
      "radius": 3.5967640597373247,
      "length": 34.450106930768655,
      "seed": 4230709754
    },
    {
      "id": "floe-15-underside-spike-2",
      "x": -622.0259690163449,
      "y": 274.1018548804656,
      "z": -40,
      "radius": 3.9807209852151573,
      "length": 35.882447605651976,
      "seed": 756537392
    },
    {
      "id": "floe-15-underside-spike-3",
      "x": -628.2751617237767,
      "y": 283.92722068435125,
      "z": -40,
      "radius": 3.8128990733530372,
      "length": 26.008162447359133,
      "seed": 2059363745
    },
    {
      "id": "floe-15-underside-spike-4",
      "x": -612.8840802948963,
      "y": 313.421460825232,
      "z": -40,
      "radius": 3.594469689996913,
      "length": 34.04854876012162,
      "seed": 180842975
    },
    {
      "id": "floe-15-underside-spike-5",
      "x": -583.1111476643931,
      "y": 283.57178682328987,
      "z": -40,
      "radius": 3.402710647089407,
      "length": 25.40660068581401,
      "seed": 1140512429
    },
    {
      "id": "floe-15-underside-spike-6",
      "x": -637.3949750084046,
      "y": 276.4615191214851,
      "z": -40,
      "radius": 3.6570979070384055,
      "length": 26.052257919467255,
      "seed": 342033919
    },
    {
      "id": "floe-15-underside-spike-7",
      "x": -630.3380716580782,
      "y": 300.08839492414097,
      "z": -40,
      "radius": 3.2445014254190028,
      "length": 32.43131683116739,
      "seed": 1937577084
    },
    {
      "id": "floe-16-underside-spike-0",
      "x": 316.7266967857659,
      "y": -228.12919529001363,
      "z": -56,
      "radius": 3.024852367118001,
      "length": 27.74782273904776,
      "seed": 2599650298
    },
    {
      "id": "floe-16-underside-spike-1",
      "x": 296.6438110003619,
      "y": -257.5208455343082,
      "z": -56,
      "radius": 3.336542713921517,
      "length": 33.325351571950264,
      "seed": 261442096
    },
    {
      "id": "floe-16-underside-spike-2",
      "x": 293.5236671714798,
      "y": -228.9461319760921,
      "z": -56,
      "radius": 3.957666897214949,
      "length": 34.47604867991747,
      "seed": 3929293622
    },
    {
      "id": "floe-16-underside-spike-3",
      "x": 328.54027972354595,
      "y": -244.933197445469,
      "z": -56,
      "radius": 3.147447513882071,
      "length": 25.50853641663044,
      "seed": 3283883148
    },
    {
      "id": "floe-16-underside-spike-4",
      "x": 310.72466904812364,
      "y": -220.4532032760718,
      "z": -56,
      "radius": 3.2636254734825343,
      "length": 27.23830482263384,
      "seed": 917590189
    },
    {
      "id": "floe-16-underside-spike-5",
      "x": 300.74527526402255,
      "y": -266.7692600443545,
      "z": -56,
      "radius": 3.137895022286102,
      "length": 31.476118285226153,
      "seed": 1853416509
    },
    {
      "id": "floe-16-underside-spike-6",
      "x": 322.0175273161499,
      "y": -265.31070891786237,
      "z": -56,
      "radius": 3.3485510798636824,
      "length": 25.627132721118763,
      "seed": 2742306971
    },
    {
      "id": "floe-16-underside-spike-7",
      "x": 324.17087234181423,
      "y": -223.18767375298353,
      "z": -56,
      "radius": 3.4810164391528815,
      "length": 25.223691996257656,
      "seed": 2488956765
    },
    {
      "id": "floe-17-underside-spike-0",
      "x": -240.10448574589643,
      "y": -218.67195342772865,
      "z": -41,
      "radius": 3.2341154399327934,
      "length": 25.252626303844814,
      "seed": 640510384
    },
    {
      "id": "floe-17-underside-spike-1",
      "x": -254.44121524241325,
      "y": -211.28940459223807,
      "z": -41,
      "radius": 3.411132805980742,
      "length": 24.360286499045465,
      "seed": 946210486
    },
    {
      "id": "floe-17-underside-spike-2",
      "x": -272.1459573410303,
      "y": -244.66452224118078,
      "z": -41,
      "radius": 3.1877172710373998,
      "length": 25.87459134375559,
      "seed": 773144710
    },
    {
      "id": "floe-17-underside-spike-3",
      "x": -242.25248048308006,
      "y": -234.61140981879822,
      "z": -41,
      "radius": 3.154568261001259,
      "length": 31.80479626369454,
      "seed": 511918940
    },
    {
      "id": "floe-17-underside-spike-4",
      "x": -283.04387983367485,
      "y": -234.5734455662649,
      "z": -41,
      "radius": 3.3678174063097686,
      "length": 28.56649857662455,
      "seed": 3214905789
    },
    {
      "id": "floe-17-underside-spike-5",
      "x": -275.4391999058669,
      "y": -215.55656573310148,
      "z": -41,
      "radius": 3.7195040138904005,
      "length": 32.18448578929535,
      "seed": 3075910171
    },
    {
      "id": "floe-17-underside-spike-6",
      "x": -261.10707634430565,
      "y": -202.57355507123762,
      "z": -41,
      "radius": 3.0637365279253572,
      "length": 24.830441861725483,
      "seed": 2835419657
    },
    {
      "id": "floe-17-underside-spike-7",
      "x": -277.64586810079885,
      "y": -225.88056711202665,
      "z": -41,
      "radius": 3.6075638523325324,
      "length": 29.380249125726714,
      "seed": 1782926
    },
    {
      "id": "floe-18-underside-spike-0",
      "x": 810.2567963367536,
      "y": -151.81151565368242,
      "z": -57,
      "radius": 3.419556852430105,
      "length": 24.764202003534386,
      "seed": 2192544418
    },
    {
      "id": "floe-18-underside-spike-1",
      "x": 794.7564315523223,
      "y": -187.86054296500814,
      "z": -57,
      "radius": 3.118370947893709,
      "length": 28.443081852663177,
      "seed": 2276716952
    },
    {
      "id": "floe-18-underside-spike-2",
      "x": 825.8798549588338,
      "y": -176.0260285654847,
      "z": -57,
      "radius": 3.436482566408813,
      "length": 27.66269153548723,
      "seed": 3917401438
    },
    {
      "id": "floe-18-underside-spike-3",
      "x": 793.4599958408152,
      "y": -152.63641156577,
      "z": -57,
      "radius": 3.713035073596984,
      "length": 35.34458696052441,
      "seed": 2381118324
    },
    {
      "id": "floe-18-underside-spike-4",
      "x": 823.5683113388127,
      "y": -161.1287648664621,
      "z": -57,
      "radius": 3.823935264721513,
      "length": 26.243066134960273,
      "seed": 1267975514
    },
    {
      "id": "floe-18-underside-spike-5",
      "x": 818.4343687144284,
      "y": -183.83790891026246,
      "z": -57,
      "radius": 3.2589464890770614,
      "length": 24.412354868443433,
      "seed": 2744928400
    },
    {
      "id": "floe-18-underside-spike-6",
      "x": 787.1400763189546,
      "y": -170.3146826891084,
      "z": -57,
      "radius": 3.7188775995746255,
      "length": 35.72533497327884,
      "seed": 2903234198
    },
    {
      "id": "floe-18-underside-spike-7",
      "x": 785.1826913868397,
      "y": -191.40460918378608,
      "z": -57,
      "radius": 3.8798921268898994,
      "length": 33.41801291959962,
      "seed": 2503483071
    },
    {
      "id": "floe-19-underside-spike-0",
      "x": -797.5211807633003,
      "y": -186.4806287755893,
      "z": -42,
      "radius": 3.8498018798418343,
      "length": 33.60057561622315,
      "seed": 3938466740
    },
    {
      "id": "floe-19-underside-spike-1",
      "x": -817.3175104798913,
      "y": -190.66029883928067,
      "z": -42,
      "radius": 3.59952566283755,
      "length": 31.849149344639674,
      "seed": 3823039477
    },
    {
      "id": "floe-19-underside-spike-2",
      "x": -788.2196355894574,
      "y": -205.2202170052484,
      "z": -42,
      "radius": 3.8366787417326123,
      "length": 35.920414916133865,
      "seed": 3758576787
    },
    {
      "id": "floe-19-underside-spike-3",
      "x": -819.8881675559575,
      "y": -215.57942602874036,
      "z": -42,
      "radius": 3.1590163256041706,
      "length": 31.027463871841267,
      "seed": 1436097824
    },
    {
      "id": "floe-19-underside-spike-4",
      "x": -812.8294216990561,
      "y": -221.4724658271622,
      "z": -42,
      "radius": 3.0179466661065817,
      "length": 30.315027592068006,
      "seed": 3004078090
    },
    {
      "id": "floe-19-underside-spike-5",
      "x": -800.0100689177636,
      "y": -227.4892455816794,
      "z": -42,
      "radius": 3.6009755425620824,
      "length": 24.95540370701007,
      "seed": 458239927
    },
    {
      "id": "floe-19-underside-spike-6",
      "x": -818.9347615959886,
      "y": -227.86230420616977,
      "z": -42,
      "radius": 3.252531155012548,
      "length": 29.41954853721674,
      "seed": 3608264270
    },
    {
      "id": "floe-19-underside-spike-7",
      "x": -807.3525580121765,
      "y": -183.38477208627725,
      "z": -42,
      "radius": 3.0193364389706403,
      "length": 24.08954247014507,
      "seed": 447147991
    },
    {
      "id": "glacier-0-underside-spike-0",
      "x": -22.812765973578173,
      "y": 949.5427936560894,
      "z": -157,
      "radius": 10.760023175435702,
      "length": 77.80520249345722,
      "seed": 2529369308
    },
    {
      "id": "glacier-0-underside-spike-1",
      "x": 118.53007755150088,
      "y": 873.8187920047006,
      "z": -157,
      "radius": 7.704592247178554,
      "length": 54.673816102177106,
      "seed": 379156866
    },
    {
      "id": "glacier-0-underside-spike-2",
      "x": 96.88614576844284,
      "y": 868.8924761433552,
      "z": -157,
      "radius": 12.110394269100503,
      "length": 82.08036613464355,
      "seed": 2836564344
    },
    {
      "id": "glacier-0-underside-spike-3",
      "x": 68.2990500320576,
      "y": 951.1933787185893,
      "z": -157,
      "radius": 6.355595227395172,
      "length": 47.76231301536087,
      "seed": 3523956286
    },
    {
      "id": "glacier-0-underside-spike-4",
      "x": -10.691498167684017,
      "y": 874.5704188587265,
      "z": -157,
      "radius": 3.0105440811438973,
      "length": 29.73389999508859,
      "seed": 3442531668
    },
    {
      "id": "glacier-0-underside-spike-5",
      "x": 35.09859754763365,
      "y": 965.8513895835655,
      "z": -157,
      "radius": 8.2086907141558,
      "length": 52.75941410544993,
      "seed": 320258106
    },
    {
      "id": "glacier-0-underside-spike-6",
      "x": -2.336076272161847,
      "y": 968.1366745072868,
      "z": -157,
      "radius": 8.987725158159229,
      "length": 54.53990524420597,
      "seed": 2488734131
    },
    {
      "id": "glacier-0-underside-spike-7",
      "x": 2.868145542980585,
      "y": 842.4146929554232,
      "z": -157,
      "radius": 11.69675177010529,
      "length": 65.5779995680503,
      "seed": 2832096993
    },
    {
      "id": "glacier-0-underside-spike-8",
      "x": 79.22834481690369,
      "y": 842.5800036642495,
      "z": -157,
      "radius": 5.410618230758079,
      "length": 46.966807421865724,
      "seed": 3997307167
    },
    {
      "id": "glacier-0-underside-spike-9",
      "x": 114.96476083140126,
      "y": 906.6439597764395,
      "z": -157,
      "radius": 5.5804204089684655,
      "length": 42.04781650934467,
      "seed": 3348431388
    },
    {
      "id": "glacier-0-underside-spike-10",
      "x": -32.74193193211982,
      "y": 911.615520725149,
      "z": -157,
      "radius": 4.432096146359526,
      "length": 40.18057617595194,
      "seed": 526951618
    },
    {
      "id": "glacier-0-underside-spike-11",
      "x": 93.08977938571248,
      "y": 962.2581575034807,
      "z": -157,
      "radius": 8.489075653230643,
      "length": 50.50645446260881,
      "seed": 3561310904
    },
    {
      "id": "glacier-0-underside-spike-12",
      "x": -21.176164534549258,
      "y": 920.8028705503466,
      "z": -157,
      "radius": 4.993659143407766,
      "length": 34.77523988332809,
      "seed": 2645652862
    },
    {
      "id": "glacier-0-underside-spike-13",
      "x": 98.0192002795181,
      "y": 887.6198729309738,
      "z": -157,
      "radius": 3.7459973771081776,
      "length": 32.55569555880241,
      "seed": 332905108
    },
    {
      "id": "glacier-0-underside-spike-14",
      "x": 96.81897698975318,
      "y": 921.6724991538242,
      "z": -157,
      "radius": 11.936360963459883,
      "length": 76.77311994838023,
      "seed": 3270744149
    },
    {
      "id": "glacier-0-underside-spike-15",
      "x": 82.04197012335558,
      "y": 858.2227657971963,
      "z": -157,
      "radius": 3.5101540378445426,
      "length": 32.953934139987325,
      "seed": 540784101
    },
    {
      "id": "glacier-0-underside-spike-16",
      "x": 78.72008141778615,
      "y": 967.185983091435,
      "z": -157,
      "radius": 3.5017508595077405,
      "length": 29.934681106336928,
      "seed": 2376785086
    },
    {
      "id": "glacier-0-underside-spike-17",
      "x": -27.044906339509645,
      "y": 871.5362049346426,
      "z": -157,
      "radius": 3.9572403613265337,
      "length": 27.83173897488185,
      "seed": 656922580
    },
    {
      "id": "glacier-0-underside-spike-18",
      "x": 106.62462642838057,
      "y": 950.407908513952,
      "z": -157,
      "radius": 7.152122648309862,
      "length": 42.50312812009402,
      "seed": 1374283413
    },
    {
      "id": "glacier-0-underside-spike-19",
      "x": -39.66553142294433,
      "y": 925.440432744119,
      "z": -157,
      "radius": 5.88288695700547,
      "length": 40.04126792825433,
      "seed": 1591349642
    },
    {
      "id": "glacier-3-underside-spike-0",
      "x": 116.52757731458487,
      "y": 2118.061348218387,
      "z": -202,
      "radius": 6.6580638982353175,
      "length": 34.712225914001465,
      "seed": 3050323441
    },
    {
      "id": "glacier-3-underside-spike-1",
      "x": 147.7371732802955,
      "y": 2174.482234696561,
      "z": -202,
      "radius": 5.594591700497822,
      "length": 33.86539349471629,
      "seed": 2516706223
    },
    {
      "id": "glacier-3-underside-spike-2",
      "x": 45.25496065198063,
      "y": 2223.9463802238192,
      "z": -202,
      "radius": 3.9082297619993334,
      "length": 34.16498068467572,
      "seed": 3534501373
    },
    {
      "id": "glacier-3-underside-spike-3",
      "x": 18.126375817584602,
      "y": 2177.726386125326,
      "z": -202,
      "radius": 3.2637603366130414,
      "length": 31.961594450541536,
      "seed": 3603253778
    },
    {
      "id": "glacier-3-underside-spike-4",
      "x": 141.46413478579646,
      "y": 2156.0103171978312,
      "z": -202,
      "radius": 8.414858544248506,
      "length": 34.712225914001465,
      "seed": 952814306
    },
    {
      "id": "glacier-3-underside-spike-5",
      "x": 91.39275524993685,
      "y": 2227.886740302119,
      "z": -202,
      "radius": 8.665703187838675,
      "length": 35.490471839904785,
      "seed": 2291013592
    },
    {
      "id": "glacier-3-underside-spike-6",
      "x": 51.76419761048493,
      "y": 2137.503870181489,
      "z": -202,
      "radius": 3.803331850277119,
      "length": 31.367563555717243,
      "seed": 12513694
    },
    {
      "id": "glacier-3-underside-spike-7",
      "x": 29.17503342467701,
      "y": 2190.0003518622016,
      "z": -202,
      "radius": 4.2293353045581705,
      "length": 29.392874453884865,
      "seed": 2632822196
    },
    {
      "id": "glacier-3-underside-spike-8",
      "x": 61.025321333615295,
      "y": 2210.8621244184674,
      "z": -202,
      "radius": 6.852680598796354,
      "length": 35.95236015319824,
      "seed": 2909214106
    },
    {
      "id": "glacier-3-underside-spike-9",
      "x": 83.51995147840448,
      "y": 2124.936089154241,
      "z": -202,
      "radius": 7.494537441950674,
      "length": 35.41222286224365,
      "seed": 1542440656
    },
    {
      "id": "glacier-3-underside-spike-10",
      "x": 46.95448817716629,
      "y": 2194.5181802483908,
      "z": -202,
      "radius": 8.215919582377412,
      "length": 35.66377830505371,
      "seed": 2038688961
    },
    {
      "id": "glacier-3-underside-spike-11",
      "x": 28.20863342955647,
      "y": 2217.1312010224474,
      "z": -202,
      "radius": 4.413469638423994,
      "length": 30.09650141533191,
      "seed": 3690425523
    },
    {
      "id": "glacier-3-underside-spike-12",
      "x": 162.2302422407806,
      "y": 2204.5164828469874,
      "z": -202,
      "radius": 4.629214211901979,
      "length": 32.24548985273526,
      "seed": 1468932577
    },
    {
      "id": "glacier-3-underside-spike-13",
      "x": 149.93966609351523,
      "y": 2219.732667531515,
      "z": -202,
      "radius": 6.718556929226848,
      "length": 35.099656105041504,
      "seed": 1984166943
    },
    {
      "id": "glacier-3-underside-spike-14",
      "x": 33.73566447320864,
      "y": 2177.9235569999382,
      "z": -202,
      "radius": 5.190917037989212,
      "length": 36.315781593322754,
      "seed": 71122669
    },
    {
      "id": "glacier-3-underside-spike-15",
      "x": 132.31624076818025,
      "y": 2126.6376543132633,
      "z": -202,
      "radius": 3.651076463793584,
      "length": 34.712225914001465,
      "seed": 2694602641
    },
    {
      "id": "glacier-3-underside-spike-16",
      "x": 29.022072718494883,
      "y": 2151.340749653688,
      "z": -202,
      "radius": 3.0772324619862843,
      "length": 28.793718788541295,
      "seed": 3338432591
    },
    {
      "id": "glacier-3-underside-spike-17",
      "x": 65.36151006818969,
      "y": 2232.026641961533,
      "z": -202,
      "radius": 3.188189604496376,
      "length": 23.878957051355304,
      "seed": 4071626141
    },
    {
      "id": "glacier-3-underside-spike-18",
      "x": 94.42133205401105,
      "y": 2247.941831232889,
      "z": -202,
      "radius": 5.496040048272715,
      "length": 32.564001523216845,
      "seed": 4084864442
    },
    {
      "id": "glacier-7-underside-spike-0",
      "x": -1755.6817091929822,
      "y": 530.5278610858683,
      "z": -190,
      "radius": 7.522466252225385,
      "length": 48.35021322640549,
      "seed": 2411947937
    },
    {
      "id": "glacier-7-underside-spike-1",
      "x": -1849.8904642335847,
      "y": 468.809216686128,
      "z": -190,
      "radius": 3.4944976959114533,
      "length": 33.278071330686835,
      "seed": 4137739231
    },
    {
      "id": "glacier-7-underside-spike-2",
      "x": -1823.544626971863,
      "y": 565.7697636487404,
      "z": -190,
      "radius": 3.684549159215121,
      "length": 27.91570614981275,
      "seed": 3480369325
    },
    {
      "id": "glacier-7-underside-spike-3",
      "x": -1771.3407216152186,
      "y": 487.4684952388399,
      "z": -190,
      "radius": 3.8613846245612176,
      "length": 26.215928227222143,
      "seed": 1711779211
    },
    {
      "id": "glacier-7-underside-spike-4",
      "x": -1853.3288858881474,
      "y": 499.1192779378906,
      "z": -190,
      "radius": 5.482939045016483,
      "length": 36.27230607605243,
      "seed": 3174559225
    },
    {
      "id": "glacier-7-underside-spike-5",
      "x": -1868.4261508147779,
      "y": 530.1604087010717,
      "z": -190,
      "radius": 7.507079107915727,
      "length": 42.999358510440054,
      "seed": 1562372471
    },
    {
      "id": "glacier-7-underside-spike-6",
      "x": -1819.1283790851337,
      "y": 459.00478005034046,
      "z": -190,
      "radius": 7.457563235425926,
      "length": 48.87137096116504,
      "seed": 679658580
    },
    {
      "id": "glacier-7-underside-spike-7",
      "x": -1782.8153438869813,
      "y": 463.48255863981393,
      "z": -190,
      "radius": 8.886075370436645,
      "length": 49.03274383023296,
      "seed": 2837929237
    },
    {
      "id": "glacier-7-underside-spike-8",
      "x": -1757.946148631983,
      "y": 560.9566993190527,
      "z": -190,
      "radius": 6.5829192135457095,
      "length": 41.16707313659336,
      "seed": 3639279527
    },
    {
      "id": "glacier-7-underside-spike-9",
      "x": -1764.2353793056066,
      "y": 511.77505090324803,
      "z": -190,
      "radius": 5.3883476836424276,
      "length": 43.104304337677384,
      "seed": 1395235893
    },
    {
      "id": "glacier-7-underside-spike-10",
      "x": -1834.6077746712806,
      "y": 575.8482092293142,
      "z": -190,
      "radius": 3.1148962146586974,
      "length": 28.95446827064128,
      "seed": 4152978131
    },
    {
      "id": "glacier-7-underside-spike-11",
      "x": -1750.6175648714245,
      "y": 515.5724384540829,
      "z": -190,
      "radius": 5.728946669883244,
      "length": 42.43448311604463,
      "seed": 2822902394
    },
    {
      "id": "glacier-7-underside-spike-12",
      "x": -1801.2208428979784,
      "y": 459.54687609895086,
      "z": -190,
      "radius": 7.06571477811564,
      "length": 38.530015044331265,
      "seed": 3857403210
    },
    {
      "id": "glacier-7-underside-spike-13",
      "x": -1868.8449459145065,
      "y": 512.9379537124943,
      "z": -190,
      "radius": 3.999205219084948,
      "length": 26.113075612476244,
      "seed": 788993539
    },
    {
      "id": "glacier-7-underside-spike-14",
      "x": -1839.6014615982021,
      "y": 454.79884108643887,
      "z": -190,
      "radius": 4.726242320300738,
      "length": 39.17521833943057,
      "seed": 3406273713
    },
    {
      "id": "glacier-7-underside-spike-15",
      "x": -1818.8688789871874,
      "y": 587.2809141483572,
      "z": -190,
      "radius": 7.010971936602725,
      "length": 49.82603878858127,
      "seed": 2104499235
    },
    {
      "id": "glacier-7-underside-spike-16",
      "x": -1791.4880017637674,
      "y": 566.7544964480228,
      "z": -190,
      "radius": 6.38347350762372,
      "length": 35.71819516615533,
      "seed": 1745373649
    },
    {
      "id": "glacier-7-underside-spike-17",
      "x": -1792.862683094343,
      "y": 582.823711278607,
      "z": -190,
      "radius": 5.562143563411679,
      "length": 42.92043017873008,
      "seed": 452671631
    },
    {
      "id": "glacier-7-underside-spike-18",
      "x": -1847.245250546072,
      "y": 558.8662735307092,
      "z": -190,
      "radius": 6.30201945823665,
      "length": 40.77160150405028,
      "seed": 1469926365
    },
    {
      "id": "island-0-underside-spike-0",
      "x": -33.324713627783424,
      "y": -2289.659286921264,
      "z": -59,
      "radius": 3.471075074048713,
      "length": 28.81703369810997,
      "seed": 3902309055
    },
    {
      "id": "island-0-underside-spike-1",
      "x": -28.644690073286263,
      "y": -2306.494047102654,
      "z": -59,
      "radius": 3.0507537708617747,
      "length": 23.635450770642954,
      "seed": 3525421116
    },
    {
      "id": "island-0-underside-spike-2",
      "x": -15.717381113119233,
      "y": -2283.847627629506,
      "z": -59,
      "radius": 3.8796627193223685,
      "length": 35.10857233756738,
      "seed": 1479529501
    },
    {
      "id": "island-0-underside-spike-3",
      "x": -36.18223353496529,
      "y": -2299.306381371419,
      "z": -59,
      "radius": 3.0514470713678747,
      "length": 23.785247052345902,
      "seed": 2982699387
    },
    {
      "id": "island-0-underside-spike-4",
      "x": -9.950899905169404,
      "y": -2300.4500683041188,
      "z": -59,
      "radius": 3.4725267405156046,
      "length": 32.31610325966267,
      "seed": 798187659
    },
    {
      "id": "island-0-underside-spike-5",
      "x": -14.808488633515996,
      "y": -2309.0658973283953,
      "z": -59,
      "radius": 3.1182164510246366,
      "length": 26.908931792452414,
      "seed": 989481209
    },
    {
      "id": "island-0-underside-spike-6",
      "x": -27.04105804789161,
      "y": -2281.7649690178196,
      "z": -59,
      "radius": 3.109322974952844,
      "length": 30.982915965897195,
      "seed": 335080828
    },
    {
      "id": "island-0-underside-spike-7",
      "x": -7.552961392426685,
      "y": -2291.727583480745,
      "z": -59,
      "radius": 3.529275159817189,
      "length": 34.40277794779824,
      "seed": 654454544
    },
    {
      "id": "island-4-underside-spike-0",
      "x": -1034.2834389415157,
      "y": -2127.589374861903,
      "z": -108,
      "radius": 4.196154987393533,
      "length": 31.19364084021806,
      "seed": 1521115850
    },
    {
      "id": "island-4-underside-spike-1",
      "x": -1048.9071050889188,
      "y": -2160.637712772817,
      "z": -108,
      "radius": 4.637704681551879,
      "length": 36.40881019723642,
      "seed": 3282267776
    },
    {
      "id": "island-4-underside-spike-2",
      "x": -1040.5157352115205,
      "y": -2180.5742009391406,
      "z": -108,
      "radius": 3.236043629409206,
      "length": 30.122310998772946,
      "seed": 2171638833
    },
    {
      "id": "island-4-underside-spike-3",
      "x": -1010.1244104246457,
      "y": -2129.945423137853,
      "z": -108,
      "radius": 3.973066581127844,
      "length": 33.48140081609175,
      "seed": 1901770735
    },
    {
      "id": "island-4-underside-spike-4",
      "x": -1023.3941138854037,
      "y": -2132.206082946514,
      "z": -108,
      "radius": 3.2079082753625374,
      "length": 25.44692069877664,
      "seed": 3814987837
    },
    {
      "id": "island-4-underside-spike-5",
      "x": -998.154141836266,
      "y": -2169.519238573224,
      "z": -108,
      "radius": 3.882072080261668,
      "length": 36.40315599032511,
      "seed": 4011577293
    },
    {
      "id": "island-4-underside-spike-6",
      "x": -987.39930053681,
      "y": -2145.932703789441,
      "z": -108,
      "radius": 4.808511577419179,
      "length": 37.82986775140234,
      "seed": 3242927019
    },
    {
      "id": "island-4-underside-spike-7",
      "x": -994.0395436113347,
      "y": -2133.533656628799,
      "z": -108,
      "radius": 4.848107090172567,
      "length": 36.877567204718304,
      "seed": 126268696
    },
    {
      "id": "island-4-underside-spike-8",
      "x": -987.4362246004156,
      "y": -2163.2214611135237,
      "z": -108,
      "radius": 4.6821634513897985,
      "length": 39.86705918979082,
      "seed": 3765616075
    },
    {
      "id": "island-4-underside-spike-9",
      "x": -1046.8589107521668,
      "y": -2128.3768571614696,
      "z": -108,
      "radius": 4.43461515804651,
      "length": 32.75009948767476,
      "seed": 3633790392
    },
    {
      "id": "island-5-underside-spike-0",
      "x": -1656.0872102729238,
      "y": 1667.7557275171166,
      "z": -64,
      "radius": 2.906967074546133,
      "length": 23.413877614988394,
      "seed": 4255348125
    },
    {
      "id": "island-5-underside-spike-1",
      "x": -1639.692847075236,
      "y": 1694.9555399705396,
      "z": -64,
      "radius": 3.937082059914246,
      "length": 34.62857509849687,
      "seed": 3952023291
    },
    {
      "id": "island-5-underside-spike-2",
      "x": -1624.5623108926955,
      "y": 1677.8941840484651,
      "z": -64,
      "radius": 3.8921635372098535,
      "length": 34.30082662622799,
      "seed": 1207599081
    },
    {
      "id": "island-5-underside-spike-3",
      "x": -1641.5985096030051,
      "y": 1670.50709716213,
      "z": -64,
      "radius": 3.122680972563103,
      "length": 29.815817467368266,
      "seed": 2444214247
    },
    {
      "id": "island-5-underside-spike-4",
      "x": -1633.480286945347,
      "y": 1674.4480064623917,
      "z": -64,
      "radius": 3.597129228292033,
      "length": 32.64167060142826,
      "seed": 2539063925
    },
    {
      "id": "island-5-underside-spike-5",
      "x": -1659.4368334176352,
      "y": 1682.209358118136,
      "z": -64,
      "radius": 3.632966746110469,
      "length": 26.81123574859849,
      "seed": 3589013204
    },
    {
      "id": "island-5-underside-spike-6",
      "x": -1650.2785407693646,
      "y": 1693.99266860553,
      "z": -64,
      "radius": 3.564064732985571,
      "length": 25.173016007367774,
      "seed": 3902663191
    },
    {
      "id": "island-5-underside-spike-7",
      "x": -1628.9901675450974,
      "y": 1687.9539193963521,
      "z": -64,
      "radius": 3.3823791143950075,
      "length": 31.966417958760914,
      "seed": 307481993
    },
    {
      "id": "island-6-underside-spike-0",
      "x": -1268.6832502394157,
      "y": 90.9008550574354,
      "z": -104,
      "radius": 3.14429684356032,
      "length": 27.06284296693353,
      "seed": 2836744671
    },
    {
      "id": "island-6-underside-spike-1",
      "x": -1273.9525801235702,
      "y": 113.96730258518177,
      "z": -104,
      "radius": 3.6882370490417977,
      "length": 30.37448182143598,
      "seed": 1194061485
    },
    {
      "id": "island-6-underside-spike-2",
      "x": -1297.080335222399,
      "y": 115.15550495510931,
      "z": -104,
      "radius": 3.8811948253959554,
      "length": 35.26617333855029,
      "seed": 3975689099
    },
    {
      "id": "island-6-underside-spike-3",
      "x": -1276.553597490163,
      "y": 80.66537209195106,
      "z": -104,
      "radius": 3.1720096584364876,
      "length": 24.997125211144283,
      "seed": 434422777
    },
    {
      "id": "island-6-underside-spike-4",
      "x": -1322.1680334430937,
      "y": 102.22078000776783,
      "z": -104,
      "radius": 3.240831402748558,
      "length": 31.327995086157145,
      "seed": 3842150263
    },
    {
      "id": "island-6-underside-spike-5",
      "x": -1316.6135323076023,
      "y": 89.31720235579957,
      "z": -104,
      "radius": 4.169132039857504,
      "length": 38.521917706396806,
      "seed": 1056024965
    },
    {
      "id": "island-6-underside-spike-6",
      "x": -1287.2654577514863,
      "y": 113.57352481618044,
      "z": -104,
      "radius": 3.8905339885829338,
      "length": 33.39575043077983,
      "seed": 1700975381
    },
    {
      "id": "island-6-underside-spike-7",
      "x": -1262.002772411999,
      "y": 81.5078910331774,
      "z": -104,
      "radius": 3.3410892867543738,
      "length": 28.977730020041417,
      "seed": 753180837
    },
    {
      "id": "island-8-underside-spike-0",
      "x": -1715.3718777196336,
      "y": 140.86144422883058,
      "z": -87,
      "radius": 3.2547664547822093,
      "length": 26.706499956816497,
      "seed": 4205650190
    },
    {
      "id": "island-8-underside-spike-1",
      "x": -1747.2640643880463,
      "y": 151.75084711987003,
      "z": -87,
      "radius": 3.990153201390058,
      "length": 37.85460222659597,
      "seed": 3645986212
    },
    {
      "id": "island-8-underside-spike-2",
      "x": -1733.6213866229832,
      "y": 151.03981100346138,
      "z": -87,
      "radius": 3.393887585029006,
      "length": 33.436881481102574,
      "seed": 2497434122
    },
    {
      "id": "island-8-underside-spike-3",
      "x": -1750.2239999518197,
      "y": 133.84895932510702,
      "z": -87,
      "radius": 3.077517846832052,
      "length": 28.127190334130315,
      "seed": 5001667
    },
    {
      "id": "island-8-underside-spike-4",
      "x": -1744.0335339668366,
      "y": 124.02745279492146,
      "z": -87,
      "radius": 3.203698614379391,
      "length": 29.27506388252143,
      "seed": 1680427633
    },
    {
      "id": "island-8-underside-spike-5",
      "x": -1726.2268625259715,
      "y": 124.05166790402956,
      "z": -87,
      "radius": 3.3692787655163556,
      "length": 33.314456407673994,
      "seed": 101093847
    },
    {
      "id": "island-8-underside-spike-6",
      "x": -1754.0664808975666,
      "y": 144.1937600976796,
      "z": -87,
      "radius": 3.2147002967540175,
      "length": 25.24593270385143,
      "seed": 2355540251
    },
    {
      "id": "island-8-underside-spike-7",
      "x": -1740.9958346132667,
      "y": 158.95629870470106,
      "z": -87,
      "radius": 3.004306641407311,
      "length": 28.762103568726236,
      "seed": 1293445830
    },
    {
      "id": "island-11-underside-spike-0",
      "x": -876.9130946563585,
      "y": 1001.6982975632114,
      "z": -55,
      "radius": 3.7131381784565747,
      "length": 31.11917966016693,
      "seed": 361344452
    },
    {
      "id": "island-11-underside-spike-1",
      "x": -910.6109838091686,
      "y": 1009.1343849951209,
      "z": -55,
      "radius": 3.1226288806647062,
      "length": 23.180520262574525,
      "seed": 616743210
    },
    {
      "id": "island-11-underside-spike-2",
      "x": -901.776970272399,
      "y": 974.7990967009248,
      "z": -55,
      "radius": 3.00170338107273,
      "length": 27.01768957968553,
      "seed": 4039729632
    },
    {
      "id": "island-11-underside-spike-3",
      "x": -920.0584431234647,
      "y": 1005.4803091928252,
      "z": -55,
      "radius": 3.903242294676602,
      "length": 32.83335707698319,
      "seed": 2401976678
    },
    {
      "id": "island-11-underside-spike-4",
      "x": -887.7324321725181,
      "y": 1008.1358956250106,
      "z": -55,
      "radius": 3.905039151897654,
      "length": 31.83362546861364,
      "seed": 2992673697
    },
    {
      "id": "island-11-underside-spike-5",
      "x": -918.3070378207541,
      "y": 982.7244710131457,
      "z": -55,
      "radius": 3.3157463925890625,
      "length": 23.264898245627705,
      "seed": 1264018128
    },
    {
      "id": "island-11-underside-spike-6",
      "x": -903.5404023445988,
      "y": 1015.2197585680285,
      "z": -55,
      "radius": 3.132953015854582,
      "length": 30.565800016197695,
      "seed": 1906522305
    },
    {
      "id": "island-11-underside-spike-7",
      "x": -893.1959133784163,
      "y": 976.8378884739245,
      "z": -55,
      "radius": 3.7424490170087665,
      "length": 27.05925576452589,
      "seed": 3488424273
    },
    {
      "id": "island-12-underside-spike-0",
      "x": 661.8901784400473,
      "y": 1193.6622927776548,
      "z": -47,
      "radius": 3.8378657018765807,
      "length": 32.76027934475991,
      "seed": 2526490478
    },
    {
      "id": "island-12-underside-spike-1",
      "x": 655.9434847751367,
      "y": 1185.4149528120754,
      "z": -47,
      "radius": 3.6695167128928006,
      "length": 30.651260600272348,
      "seed": 2631891204
    },
    {
      "id": "island-12-underside-spike-2",
      "x": 683.7099677707029,
      "y": 1188.9496102949518,
      "z": -47,
      "radius": 3.5103069823235273,
      "length": 34.21220244252963,
      "seed": 3615433322
    },
    {
      "id": "island-12-underside-spike-3",
      "x": 680.1038904118205,
      "y": 1176.8257907606574,
      "z": -47,
      "radius": 3.4380411650054157,
      "length": 31.036500066250863,
      "seed": 3039045920
    },
    {
      "id": "island-12-underside-spike-4",
      "x": 671.6035666470045,
      "y": 1172.948854781426,
      "z": -47,
      "radius": 3.4597243266180158,
      "length": 32.877411460088965,
      "seed": 2493103782
    },
    {
      "id": "island-12-underside-spike-5",
      "x": 677.0822761134027,
      "y": 1196.3547822730059,
      "z": -47,
      "radius": 3.1326982851605862,
      "length": 30.51141937767098,
      "seed": 354688565
    },
    {
      "id": "island-12-underside-spike-6",
      "x": 657.5305600186123,
      "y": 1174.206991509779,
      "z": -47,
      "radius": 3.7549011989030987,
      "length": 26.756308404413492,
      "seed": 2746173715
    },
    {
      "id": "island-12-underside-spike-7",
      "x": 670.0587596121926,
      "y": 1202.8250308963698,
      "z": -47,
      "radius": 3.7216639446341135,
      "length": 29.3559124015514,
      "seed": 1006773057
    },
    {
      "id": "island-13-underside-spike-0",
      "x": 894.7023429347912,
      "y": -1625.0174125769418,
      "z": -100,
      "radius": 3.5931300844942062,
      "length": 28.014351781482148,
      "seed": 1022578996
    },
    {
      "id": "island-13-underside-spike-1",
      "x": 879.0922409932349,
      "y": -1591.3846671639124,
      "z": -100,
      "radius": 4.917648017047129,
      "length": 31.44245341374166,
      "seed": 1654996250
    },
    {
      "id": "island-13-underside-spike-2",
      "x": 903.0099000300656,
      "y": -1602.8608339426805,
      "z": -100,
      "radius": 3.877843706043116,
      "length": 34.13461333947024,
      "seed": 3152892496
    },
    {
      "id": "island-13-underside-spike-3",
      "x": 849.6513637178679,
      "y": -1609.4149863476573,
      "z": -100,
      "radius": 4.955582382690206,
      "length": 34.835750091186284,
      "seed": 2732679766
    },
    {
      "id": "island-13-underside-spike-4",
      "x": 888.5156055030099,
      "y": -1636.2815422850588,
      "z": -100,
      "radius": 4.607024521325477,
      "length": 38.2100054329323,
      "seed": 3982283436
    },
    {
      "id": "island-13-underside-spike-5",
      "x": 902.5968006451661,
      "y": -1618.6336008498124,
      "z": -100,
      "radius": 3.987230785386493,
      "length": 30.081708789240054,
      "seed": 2307587282
    },
    {
      "id": "island-13-underside-spike-6",
      "x": 861.848224409648,
      "y": -1597.5916095335076,
      "z": -100,
      "radius": 4.354905970730093,
      "length": 35.57567622448596,
      "seed": 893922722
    },
    {
      "id": "island-13-underside-spike-7",
      "x": 890.2186814947992,
      "y": -1595.2455057802104,
      "z": -100,
      "radius": 3.4828809288182456,
      "length": 30.712480936144264,
      "seed": 844756120
    },
    {
      "id": "island-13-underside-spike-8",
      "x": 847.6774811038875,
      "y": -1621.7969430205694,
      "z": -100,
      "radius": 4.599662639499821,
      "length": 29.67647651892302,
      "seed": 161025833
    },
    {
      "id": "island-14-underside-spike-0",
      "x": -1068.1414308732612,
      "y": 249.67991079225766,
      "z": -82,
      "radius": 3.5167367320973426,
      "length": 28.762447765493867,
      "seed": 2424048191
    },
    {
      "id": "island-14-underside-spike-1",
      "x": -1051.5365010070905,
      "y": 268.0618467309698,
      "z": -82,
      "radius": 3.489272706909105,
      "length": 33.25812251118913,
      "seed": 1605022733
    },
    {
      "id": "island-14-underside-spike-2",
      "x": -1068.9423460431162,
      "y": 276.45231764406105,
      "z": -82,
      "radius": 3.2608398608863354,
      "length": 29.945022880063767,
      "seed": 4021367650
    },
    {
      "id": "island-14-underside-spike-3",
      "x": -1058.7949965473642,
      "y": 278.5945005651081,
      "z": -82,
      "radius": 2.8482217073308087,
      "length": 22.998221980841926,
      "seed": 329030744
    },
    {
      "id": "island-14-underside-spike-4",
      "x": -1084.849289150618,
      "y": 259.9998627291125,
      "z": -82,
      "radius": 3.4150289013050497,
      "length": 25.893675240395027,
      "seed": 3979069096
    },
    {
      "id": "island-14-underside-spike-5",
      "x": -1084.946144441816,
      "y": 278.89376719689204,
      "z": -82,
      "radius": 2.575260623664491,
      "length": 27.714766447909824,
      "seed": 617530616
    },
    {
      "id": "island-14-underside-spike-6",
      "x": -1056.1039499432313,
      "y": 255.5022420083708,
      "z": -82,
      "radius": 3.7245922051370144,
      "length": 25.751192367081785,
      "seed": 3775676066
    },
    {
      "id": "island-14-underside-spike-7",
      "x": -1085.3283307846725,
      "y": 269.4710625023196,
      "z": -82,
      "radius": 3.1380334217101336,
      "length": 25.539604574663514,
      "seed": 2810301178
    },
    {
      "id": "island-16-underside-spike-0",
      "x": -2095.7087178599527,
      "y": 824.3973296933981,
      "z": -61,
      "radius": 3.784547575050965,
      "length": 28.412917841437455,
      "seed": 2790168315
    },
    {
      "id": "island-16-underside-spike-1",
      "x": -2109.7310972274054,
      "y": 854.0505774662852,
      "z": -61,
      "radius": 3.9662525875028223,
      "length": 35.672931583504855,
      "seed": 3210608617
    },
    {
      "id": "island-16-underside-spike-2",
      "x": -2094.579796127499,
      "y": 836.4864669831088,
      "z": -61,
      "radius": 3.4499997114762664,
      "length": 23.86016344415014,
      "seed": 551736302
    },
    {
      "id": "island-16-underside-spike-3",
      "x": -2127.1602464049197,
      "y": 827.4041027975223,
      "z": -61,
      "radius": 3.1795488400384784,
      "length": 30.053729510348894,
      "seed": 3974773694
    },
    {
      "id": "island-16-underside-spike-4",
      "x": -2120.23434142801,
      "y": 848.2833408349061,
      "z": -61,
      "radius": 3.1959756838623434,
      "length": 29.123909335522356,
      "seed": 2697210683
    },
    {
      "id": "island-16-underside-spike-5",
      "x": -2092.697699949987,
      "y": 846.7576003855361,
      "z": -61,
      "radius": 3.1339569518249464,
      "length": 22.599894206103706,
      "seed": 2888342091
    },
    {
      "id": "island-16-underside-spike-6",
      "x": -2102.4902580786406,
      "y": 814.3140048254112,
      "z": -61,
      "radius": 3.8041829238645732,
      "length": 34.54550486110661,
      "seed": 2982967168
    },
    {
      "id": "island-16-underside-spike-7",
      "x": -2121.767969523817,
      "y": 819.8544086540061,
      "z": -61,
      "radius": 3.0204167996998876,
      "length": 26.699175548175866,
      "seed": 3928590361
    },
    {
      "id": "island-18-underside-spike-0",
      "x": -1312.4300865554437,
      "y": 1182.7645542767295,
      "z": -61,
      "radius": 3.158552954439074,
      "length": 28.249067224697882,
      "seed": 4150120940
    },
    {
      "id": "island-18-underside-spike-1",
      "x": -1283.696998894149,
      "y": 1164.2913399800009,
      "z": -61,
      "radius": 3.9534481689333916,
      "length": 32.33059923075744,
      "seed": 784855570
    },
    {
      "id": "island-18-underside-spike-2",
      "x": -1295.6259434010135,
      "y": 1185.1314619539226,
      "z": -61,
      "radius": 3.6334484457038343,
      "length": 24.64446659818439,
      "seed": 1735674248
    },
    {
      "id": "island-18-underside-spike-3",
      "x": -1305.8294075004378,
      "y": 1153.4648039534027,
      "z": -61,
      "radius": 3.145006645238027,
      "length": 26.56380146361197,
      "seed": 1232590041
    },
    {
      "id": "island-18-underside-spike-4",
      "x": -1289.3640980254122,
      "y": 1156.103194044975,
      "z": -61,
      "radius": 3.6424818702507764,
      "length": 28.62561773740494,
      "seed": 4037312855
    },
    {
      "id": "island-18-underside-spike-5",
      "x": -1283.3473445913787,
      "y": 1181.4503554575547,
      "z": -61,
      "radius": 3.4854156931396574,
      "length": 32.23023845570904,
      "seed": 2823312889
    },
    {
      "id": "island-18-underside-spike-6",
      "x": -1314.8507995244643,
      "y": 1162.0089473298556,
      "z": -61,
      "radius": 3.3898288579657674,
      "length": 24.737688842505328,
      "seed": 2047745094
    },
    {
      "id": "island-18-underside-spike-7",
      "x": -1320.3507715281548,
      "y": 1170.8000114714332,
      "z": -61,
      "radius": 3.5761133444120556,
      "length": 34.72225320668879,
      "seed": 1101078999
    },
    {
      "id": "island-19-underside-spike-0",
      "x": -246.06911831606504,
      "y": 2545.8398071465895,
      "z": -57,
      "radius": 3.568791866793931,
      "length": 27.495585352342584,
      "seed": 189403818
    },
    {
      "id": "island-19-underside-spike-1",
      "x": -258.92366252494764,
      "y": 2545.1898426687603,
      "z": -57,
      "radius": 4.003821890539902,
      "length": 28.09881707543574,
      "seed": 2611627872
    },
    {
      "id": "island-19-underside-spike-2",
      "x": -234.5810783778316,
      "y": 2542.969708858026,
      "z": -57,
      "radius": 3.8585544923110993,
      "length": 36.059224391433155,
      "seed": 1297095398
    },
    {
      "id": "island-19-underside-spike-3",
      "x": -218.1118197634507,
      "y": 2534.437192470364,
      "z": -57,
      "radius": 3.7752090738962254,
      "length": 28.01050318770539,
      "seed": 1521275580
    },
    {
      "id": "island-19-underside-spike-4",
      "x": -266.08416039162876,
      "y": 2535.8207744231477,
      "z": -57,
      "radius": 3.268304222517718,
      "length": 25.231704832737417,
      "seed": 2667227234
    },
    {
      "id": "island-19-underside-spike-5",
      "x": -223.79617731383235,
      "y": 2519.798004519896,
      "z": -57,
      "radius": 4.329338579392151,
      "length": 35.685390681478644,
      "seed": 2029267288
    },
    {
      "id": "island-19-underside-spike-6",
      "x": -261.02775158348345,
      "y": 2524.739460315827,
      "z": -57,
      "radius": 3.1369827173819314,
      "length": 26.083290506103562,
      "seed": 1190381835
    },
    {
      "id": "island-19-underside-spike-7",
      "x": -239.3434046107092,
      "y": 2508.0399152373147,
      "z": -57,
      "radius": 3.1577659508115636,
      "length": 28.866856603531886,
      "seed": 3646352411
    },
    {
      "id": "island-22-underside-spike-0",
      "x": 326.85638410883513,
      "y": -2426.0360028569994,
      "z": -102,
      "radius": 3.7887391855844292,
      "length": 26.12321431898299,
      "seed": 2811849107
    },
    {
      "id": "island-22-underside-spike-1",
      "x": 331.5762402134549,
      "y": -2491.8447823778365,
      "z": -102,
      "radius": 3.2894365113890567,
      "length": 24.479725706278394,
      "seed": 2289082305
    },
    {
      "id": "island-22-underside-spike-2",
      "x": 298.2954103968094,
      "y": -2447.1137184911186,
      "z": -102,
      "radius": 5.092284123417994,
      "length": 39.76583830845166,
      "seed": 3216466854
    },
    {
      "id": "island-22-underside-spike-3",
      "x": 294.96537217683584,
      "y": -2462.2830388043767,
      "z": -102,
      "radius": 3.803909623445156,
      "length": 35.44419400415869,
      "seed": 2188059407
    },
    {
      "id": "island-22-underside-spike-4",
      "x": 310.4334898648523,
      "y": -2489.68092297321,
      "z": -102,
      "radius": 4.989643881693198,
      "length": 34.61360161928937,
      "seed": 3676956876
    },
    {
      "id": "island-22-underside-spike-5",
      "x": 297.5143302448506,
      "y": -2433.8259340018226,
      "z": -102,
      "radius": 5.48362600907123,
      "length": 40.24550094903087,
      "seed": 2642098674
    },
    {
      "id": "island-22-underside-spike-6",
      "x": 337.45849595539784,
      "y": -2434.496328427588,
      "z": -102,
      "radius": 3.1574749496906156,
      "length": 31.392518522968647,
      "seed": 3512886653
    },
    {
      "id": "island-22-underside-spike-7",
      "x": 348.9622501383196,
      "y": -2460.9393902520696,
      "z": -102,
      "radius": 3.7819544342508635,
      "length": 33.775267974969445,
      "seed": 1644530511
    },
    {
      "id": "island-22-underside-spike-8",
      "x": 304.91845619197153,
      "y": -2475.44473526658,
      "z": -102,
      "radius": 3.6800491532115096,
      "length": 33.789673181477795,
      "seed": 3584708447
    },
    {
      "id": "island-22-underside-spike-9",
      "x": 323.50829907650154,
      "y": -2497.8080635906526,
      "z": -102,
      "radius": 4.256646499842601,
      "length": 31.9371357783202,
      "seed": 1375701152
    },
    {
      "id": "island-23-underside-spike-0",
      "x": -761.4876078583156,
      "y": 2467.3237317946405,
      "z": -113,
      "radius": 4.4335957791761516,
      "length": 38.823784012339466,
      "seed": 2652270747
    },
    {
      "id": "island-23-underside-spike-1",
      "x": -831.232871161892,
      "y": 2476.773581075872,
      "z": -113,
      "radius": 3.733186163507755,
      "length": 30.337880789504425,
      "seed": 287363784
    },
    {
      "id": "island-23-underside-spike-2",
      "x": -827.0232427524605,
      "y": 2460.7454119886615,
      "z": -113,
      "radius": 4.121796155811641,
      "length": 28.02714444483813,
      "seed": 3116787982
    },
    {
      "id": "island-23-underside-spike-3",
      "x": -798.711239325754,
      "y": 2449.1886688606546,
      "z": -113,
      "radius": 3.1273686225896014,
      "length": 22.53875011871682,
      "seed": 719740324
    },
    {
      "id": "island-23-underside-spike-4",
      "x": -784.4736058187136,
      "y": 2487.5093147515713,
      "z": -113,
      "radius": 4.496234714933857,
      "length": 37.22344104990317,
      "seed": 1532926474
    },
    {
      "id": "island-23-underside-spike-5",
      "x": -802.238416788353,
      "y": 2487.092927809252,
      "z": -113,
      "radius": 4.637489204487693,
      "length": 41.68294042972018,
      "seed": 2903759808
    },
    {
      "id": "island-23-underside-spike-6",
      "x": -751.8069380076312,
      "y": 2467.826962420919,
      "z": -113,
      "radius": 3.0980884654608642,
      "length": 30.379345174559706,
      "seed": 1757446160
    },
    {
      "id": "island-23-underside-spike-7",
      "x": -759.9073090340232,
      "y": 2478.1301139980087,
      "z": -113,
      "radius": 4.417796329082047,
      "length": 27.86344488135054,
      "seed": 2479323232
    },
    {
      "id": "island-23-underside-spike-8",
      "x": -823.0648244651045,
      "y": 2451.115809212224,
      "z": -113,
      "radius": 3.566751206834304,
      "length": 33.12993517714156,
      "seed": 1443742896
    },
    {
      "id": "island-24-underside-spike-0",
      "x": 503.7894637005233,
      "y": -1979.0836761134792,
      "z": -39,
      "radius": 7.292110399102281,
      "length": 49.48100778452625,
      "seed": 708481321
    },
    {
      "id": "island-24-underside-spike-1",
      "x": 526.9804927759743,
      "y": -1938.2128094290506,
      "z": -39,
      "radius": 5.683378024116713,
      "length": 34.25610077393421,
      "seed": 1981069095
    },
    {
      "id": "island-24-underside-spike-2",
      "x": 515.8746911773381,
      "y": -1997.2074382569763,
      "z": -39,
      "radius": 4.000146656172167,
      "length": 32.09770026253904,
      "seed": 1728198581
    },
    {
      "id": "island-24-underside-spike-3",
      "x": 561.5036708956042,
      "y": -1945.8043330792464,
      "z": -39,
      "radius": 6.90185219878358,
      "length": 44.70291899234341,
      "seed": 510446163
    },
    {
      "id": "island-24-underside-spike-4",
      "x": 542.0382682259217,
      "y": -1938.3933858620705,
      "z": -39,
      "radius": 6.3919916800889185,
      "length": 43.825050082471776,
      "seed": 3261926017
    },
    {
      "id": "island-24-underside-spike-5",
      "x": 570.5723863475098,
      "y": -1968.1349911829066,
      "z": -39,
      "radius": 6.775529551466388,
      "length": 38.10493763397026,
      "seed": 707155903
    },
    {
      "id": "island-24-underside-spike-6",
      "x": 507.5768785696734,
      "y": -1933.2460311945188,
      "z": -39,
      "radius": 3.264859796440179,
      "length": 32.01026239612774,
      "seed": 1574945084
    },
    {
      "id": "island-24-underside-spike-7",
      "x": 506.30721163693397,
      "y": -1943.9629375993986,
      "z": -39,
      "radius": 4.022258830011465,
      "length": 34.62356348406584,
      "seed": 4264690402
    },
    {
      "id": "island-24-underside-spike-8",
      "x": 535.6719439813862,
      "y": -2002.6838833334064,
      "z": -39,
      "radius": 3.4465952552871344,
      "length": 25.26565769817964,
      "seed": 4107636696
    },
    {
      "id": "island-24-underside-spike-9",
      "x": 578.1209863882849,
      "y": -1953.4957598437245,
      "z": -39,
      "radius": 6.007888141606371,
      "length": 36.75683979355342,
      "seed": 2138020392
    },
    {
      "id": "island-24-underside-spike-10",
      "x": 571.705618850585,
      "y": -1991.1072085298372,
      "z": -39,
      "radius": 5.654674231460804,
      "length": 36.21021795505021,
      "seed": 2039685135
    },
    {
      "id": "island-24-underside-spike-11",
      "x": 553.446975366812,
      "y": -1994.419517217406,
      "z": -39,
      "radius": 3.4688882748351313,
      "length": 33.27340154111161,
      "seed": 408570316
    },
    {
      "id": "island-24-underside-spike-12",
      "x": 517.0311076570681,
      "y": -1927.1380392912088,
      "z": -39,
      "radius": 4.772923462170135,
      "length": 39.76034733563224,
      "seed": 1368037101
    },
    {
      "id": "island-24-underside-spike-13",
      "x": 496.17023943286637,
      "y": -1957.7758041073598,
      "z": -39,
      "radius": 7.188821443204154,
      "length": 47.32337392329332,
      "seed": 1392254128
    },
    {
      "id": "island-25-underside-spike-0",
      "x": -898.0792783003607,
      "y": 1690.8361061585144,
      "z": -114,
      "radius": 5.574450823621426,
      "length": 40.52954895523643,
      "seed": 1544505743
    },
    {
      "id": "island-25-underside-spike-1",
      "x": -885.3346575190964,
      "y": 1633.3257877883918,
      "z": -114,
      "radius": 4.317245526160851,
      "length": 27.555065322431147,
      "seed": 4038563037
    },
    {
      "id": "island-25-underside-spike-2",
      "x": -919.3426069898762,
      "y": 1677.8693452656537,
      "z": -114,
      "radius": 5.2425006234868246,
      "length": 33.526445265300296,
      "seed": 615992946
    },
    {
      "id": "island-25-underside-spike-3",
      "x": -864.4476396756036,
      "y": 1675.9883567108159,
      "z": -114,
      "radius": 3.707301004449114,
      "length": 28.907358917621092,
      "seed": 2563169099
    },
    {
      "id": "island-25-underside-spike-4",
      "x": -917.1357123268258,
      "y": 1648.0429762597792,
      "z": -114,
      "radius": 5.209167189448708,
      "length": 31.340401179491867,
      "seed": 255383864
    },
    {
      "id": "island-25-underside-spike-5",
      "x": -902.6002998053154,
      "y": 1640.4362508300876,
      "z": -114,
      "radius": 3.5866694795183083,
      "length": 31.41041646134354,
      "seed": 3767188360
    },
    {
      "id": "island-25-underside-spike-6",
      "x": -930.7004702686748,
      "y": 1658.8018738682385,
      "z": -114,
      "radius": 5.437288541584022,
      "length": 32.91348486286843,
      "seed": 4219367896
    },
    {
      "id": "island-25-underside-spike-7",
      "x": -895.7331838518278,
      "y": 1628.4208298643134,
      "z": -114,
      "radius": 3.1585452510974457,
      "length": 29.123268258466503,
      "seed": 648265611
    },
    {
      "id": "island-25-underside-spike-8",
      "x": -856.7089873494051,
      "y": 1668.4472680262759,
      "z": -114,
      "radius": 4.929716908742138,
      "length": 35.067534129835146,
      "seed": 3655238299
    },
    {
      "id": "island-25-underside-spike-9",
      "x": -883.2482617177483,
      "y": 1698.286076799416,
      "z": -114,
      "radius": 4.856978157373255,
      "length": 30.924839835480256,
      "seed": 792835185
    },
    {
      "id": "island-27-underside-spike-0",
      "x": -100.86347603971524,
      "y": 1697.6726370755339,
      "z": -61,
      "radius": 3.234142614295706,
      "length": 27.507661054588795,
      "seed": 1965694593
    },
    {
      "id": "island-27-underside-spike-1",
      "x": -91.49338640567069,
      "y": 1707.9529314008557,
      "z": -61,
      "radius": 3.989563063951209,
      "length": 34.277584695416685,
      "seed": 777112511
    },
    {
      "id": "island-27-underside-spike-2",
      "x": -105.75758351712163,
      "y": 1723.6224052996376,
      "z": -61,
      "radius": 3.7282421223353595,
      "length": 29.99920308651107,
      "seed": 194677133
    },
    {
      "id": "island-27-underside-spike-3",
      "x": -114.12951195118625,
      "y": 1696.0084864997586,
      "z": -61,
      "radius": 3.1948269717395306,
      "length": 28.541523834626084,
      "seed": 795338466
    },
    {
      "id": "island-27-underside-spike-4",
      "x": -118.01633515656785,
      "y": 1712.674592211451,
      "z": -61,
      "radius": 3.981031130068004,
      "length": 26.853827667438804,
      "seed": 923314494
    },
    {
      "id": "island-27-underside-spike-5",
      "x": -96.17962588256783,
      "y": 1718.7456030425608,
      "z": -61,
      "radius": 3.620553000830114,
      "length": 26.869330049381194,
      "seed": 3216153678
    },
    {
      "id": "island-27-underside-spike-6",
      "x": -91.67845318820356,
      "y": 1698.3353496553464,
      "z": -61,
      "radius": 3.2807475486770272,
      "length": 28.53159387470398,
      "seed": 4278429718
    },
    {
      "id": "island-27-underside-spike-7",
      "x": -120.13126608028503,
      "y": 1703.87032495436,
      "z": -61,
      "radius": 2.64483497107037,
      "length": 25.81643827170648,
      "seed": 4062741564
    },
    {
      "id": "island-29-underside-spike-0",
      "x": -511.04334901450255,
      "y": 1322.3414807173726,
      "z": -50,
      "radius": 3.6204001863952726,
      "length": 33.78234616243451,
      "seed": 3756027385
    },
    {
      "id": "island-29-underside-spike-1",
      "x": -530.9775185498466,
      "y": 1337.2765638208914,
      "z": -50,
      "radius": 3.718815579311922,
      "length": 33.11119841596044,
      "seed": 1977903479
    },
    {
      "id": "island-29-underside-spike-2",
      "x": -528.3709816089153,
      "y": 1326.4758984744012,
      "z": -50,
      "radius": 3.710314114112407,
      "length": 34.15630718404991,
      "seed": 733037652
    },
    {
      "id": "island-29-underside-spike-3",
      "x": -502.86157370903913,
      "y": 1336.730372534336,
      "z": -50,
      "radius": 3.6459025957155973,
      "length": 27.36399186165358,
      "seed": 4081191319
    },
    {
      "id": "island-29-underside-spike-4",
      "x": -519.956597232529,
      "y": 1345.3359926353692,
      "z": -50,
      "radius": 2.703505832189666,
      "length": 22.077247258026723,
      "seed": 976223406
    },
    {
      "id": "island-29-underside-spike-5",
      "x": -520.1312889846516,
      "y": 1320.1851521005224,
      "z": -50,
      "radius": 3.474219546187669,
      "length": 29.38113527077445,
      "seed": 4261170244
    },
    {
      "id": "island-29-underside-spike-6",
      "x": -500.9577180024658,
      "y": 1322.7319281434095,
      "z": -50,
      "radius": 3.0268533306661993,
      "length": 24.61632781049407,
      "seed": 1651267323
    },
    {
      "id": "island-29-underside-spike-7",
      "x": -510.1359584582207,
      "y": 1343.3426205577175,
      "z": -50,
      "radius": 3.03243658086285,
      "length": 28.82380799906085,
      "seed": 2218419368
    },
    {
      "id": "island-30-underside-spike-0",
      "x": -32.572637249893305,
      "y": -1216.5336802319093,
      "z": -94,
      "radius": 3.226155831012875,
      "length": 25.52443618423201,
      "seed": 2792941692
    },
    {
      "id": "island-30-underside-spike-1",
      "x": -46.55018236274679,
      "y": -1233.0106998467743,
      "z": -94,
      "radius": 3.3040908239781857,
      "length": 23.363563142305004,
      "seed": 3732135970
    },
    {
      "id": "island-30-underside-spike-2",
      "x": -30.281532104641038,
      "y": -1227.3803810655522,
      "z": -94,
      "radius": 2.514628625841868,
      "length": 26.021170352072605,
      "seed": 3586061080
    },
    {
      "id": "island-30-underside-spike-3",
      "x": -59.087112959324394,
      "y": -1216.8124335206155,
      "z": -94,
      "radius": 3.256235964363441,
      "length": 26.977851792231654,
      "seed": 1400258473
    },
    {
      "id": "island-30-underside-spike-4",
      "x": -56.90977314399734,
      "y": -1230.550627589383,
      "z": -94,
      "radius": 3.73903502128087,
      "length": 30.619269584386615,
      "seed": 2163049017
    },
    {
      "id": "island-30-underside-spike-5",
      "x": -44.79375369687089,
      "y": -1206.8157347813342,
      "z": -94,
      "radius": 3.562294273870066,
      "length": 25.449116800669998,
      "seed": 2891877303
    },
    {
      "id": "island-30-underside-spike-6",
      "x": -34.61770569349443,
      "y": -1204.547597852598,
      "z": -94,
      "radius": 2.830058648569206,
      "length": 24.539163546300955,
      "seed": 501895472
    },
    {
      "id": "island-30-underside-spike-7",
      "x": -56.71859574067301,
      "y": -1205.8556932527415,
      "z": -94,
      "radius": 3.506911059608683,
      "length": 27.894677707180975,
      "seed": 994538145
    },
    {
      "id": "island-32-underside-spike-0",
      "x": -237.68713222591657,
      "y": -1455.5256754936593,
      "z": -104,
      "radius": 3.060324265798428,
      "length": 22.320220784187622,
      "seed": 998433434
    },
    {
      "id": "island-32-underside-spike-1",
      "x": -226.89838961754586,
      "y": -1459.9397767886662,
      "z": -104,
      "radius": 3.111977201688935,
      "length": 25.012038916388256,
      "seed": 4158066579
    },
    {
      "id": "island-32-underside-spike-2",
      "x": -210.14029356655664,
      "y": -1484.3330868956716,
      "z": -104,
      "radius": 3.7749523554593694,
      "length": 34.60550179013566,
      "seed": 3474560449
    },
    {
      "id": "island-32-underside-spike-3",
      "x": -261.1683281691778,
      "y": -1476.0590993432183,
      "z": -104,
      "radius": 4.07695214167337,
      "length": 27.82284685949884,
      "seed": 1007702438
    },
    {
      "id": "island-32-underside-spike-4",
      "x": -247.80230497161097,
      "y": -1487.639960657028,
      "z": -104,
      "radius": 4.028146930467737,
      "length": 28.304431091979392,
      "seed": 1305207676
    },
    {
      "id": "island-32-underside-spike-5",
      "x": -240.4664176133965,
      "y": -1497.0743433787252,
      "z": -104,
      "radius": 4.02582329212097,
      "length": 33.4988688816847,
      "seed": 1897766175
    },
    {
      "id": "island-32-underside-spike-6",
      "x": -229.04829403791314,
      "y": -1495.2454587992077,
      "z": -104,
      "radius": 4.10281153529249,
      "length": 27.623105542087423,
      "seed": 1873679663
    },
    {
      "id": "island-32-underside-spike-7",
      "x": -255.61125017233428,
      "y": -1464.63458691348,
      "z": -104,
      "radius": 3.3822524240773197,
      "length": 31.58757183817307,
      "seed": 962384191
    },
    {
      "id": "island-33-underside-spike-0",
      "x": -1982.930166647883,
      "y": 983.8680122082438,
      "z": -94,
      "radius": 3.4408551286906004,
      "length": 30.154654364798166,
      "seed": 3050720170
    },
    {
      "id": "island-33-underside-spike-1",
      "x": -1988.1052618386698,
      "y": 974.6574895838794,
      "z": -94,
      "radius": 3.6732713964184454,
      "length": 31.090936271808857,
      "seed": 732526688
    },
    {
      "id": "island-33-underside-spike-2",
      "x": -1960.4813465544382,
      "y": 987.205643391605,
      "z": -94,
      "radius": 3.3748117438452145,
      "length": 32.10950082801628,
      "seed": 2878637030
    },
    {
      "id": "island-33-underside-spike-3",
      "x": -1968.3201091266294,
      "y": 961.2905375296099,
      "z": -94,
      "radius": 3.279127796413377,
      "length": 27.360289017114376,
      "seed": 2510950479
    },
    {
      "id": "island-33-underside-spike-4",
      "x": -1979.8500866699187,
      "y": 966.4528018211688,
      "z": -94,
      "radius": 3.380292472196743,
      "length": 29.234045921480536,
      "seed": 2087237021
    },
    {
      "id": "island-33-underside-spike-5",
      "x": -1969.7488891870205,
      "y": 987.0611410015299,
      "z": -94,
      "radius": 3.188461071345955,
      "length": 26.588129091914656,
      "seed": 1059974748
    },
    {
      "id": "island-33-underside-spike-6",
      "x": -1953.173652241273,
      "y": 975.3980419973783,
      "z": -94,
      "radius": 3.126644841628149,
      "length": 29.45785250034565,
      "seed": 3742706199
    },
    {
      "id": "island-33-underside-spike-7",
      "x": -1959.0868757164926,
      "y": 967.6276602094139,
      "z": -94,
      "radius": 3.8200484975241125,
      "length": 30.56801165550845,
      "seed": 2339591656
    },
    {
      "id": "island-34-underside-spike-0",
      "x": 648.0854453799329,
      "y": 1761.6178292971772,
      "z": -38,
      "radius": 3.934232388390228,
      "length": 30.485782731488747,
      "seed": 967198781
    },
    {
      "id": "island-34-underside-spike-1",
      "x": 672.4178524522321,
      "y": 1735.4045447489873,
      "z": -38,
      "radius": 3.4235360100865364,
      "length": 28.96560822638695,
      "seed": 3370930514
    },
    {
      "id": "island-34-underside-spike-2",
      "x": 648.4128272693653,
      "y": 1749.0003092251388,
      "z": -38,
      "radius": 3.0311031728051603,
      "length": 24.350286473844292,
      "seed": 570531528
    },
    {
      "id": "island-34-underside-spike-3",
      "x": 684.0366610263651,
      "y": 1752.8493147368224,
      "z": -38,
      "radius": 3.471477179788053,
      "length": 32.10034035435888,
      "seed": 527553806
    },
    {
      "id": "island-34-underside-spike-4",
      "x": 658.1579956946756,
      "y": 1767.0233366545747,
      "z": -38,
      "radius": 3.310941419797018,
      "length": 23.272129896984723,
      "seed": 1980720535
    },
    {
      "id": "island-34-underside-spike-5",
      "x": 675.3696290898639,
      "y": 1764.716276969289,
      "z": -38,
      "radius": 3.130244266008958,
      "length": 23.205998473620063,
      "seed": 2429312057
    },
    {
      "id": "island-34-underside-spike-6",
      "x": 656.3628384287161,
      "y": 1733.7092870472507,
      "z": -38,
      "radius": 3.0582650273572654,
      "length": 29.85483602197038,
      "seed": 3427185053
    },
    {
      "id": "island-34-underside-spike-7",
      "x": 679.462317258569,
      "y": 1744.3527407934803,
      "z": -38,
      "radius": 3.224256406072527,
      "length": 28.994602432359752,
      "seed": 1016195820
    },
    {
      "id": "island-35-underside-spike-0",
      "x": 453.64523702688825,
      "y": -1118.1532491396097,
      "z": -112,
      "radius": 3.184866382041946,
      "length": 31.82241472021937,
      "seed": 837798355
    },
    {
      "id": "island-35-underside-spike-1",
      "x": 481.35173684102546,
      "y": -1098.7073909874289,
      "z": -112,
      "radius": 3.1353002020623535,
      "length": 30.11206487129201,
      "seed": 354070017
    },
    {
      "id": "island-35-underside-spike-2",
      "x": 490.92322018424795,
      "y": -1105.2007674546155,
      "z": -112,
      "radius": 3.9748807412106544,
      "length": 33.07614991878086,
      "seed": 181174079
    },
    {
      "id": "island-35-underside-spike-3",
      "x": 449.9237880868492,
      "y": -1093.6118957871133,
      "z": -112,
      "radius": 3.277699796948582,
      "length": 27.934758562746982,
      "seed": 1092579004
    },
    {
      "id": "island-35-underside-spike-4",
      "x": 460.7920038870962,
      "y": -1129.2949144289994,
      "z": -112,
      "radius": 3.019978540483862,
      "length": 22.226384995127724,
      "seed": 1723122188
    },
    {
      "id": "island-35-underside-spike-5",
      "x": 476.9351597506916,
      "y": -1090.2975088577195,
      "z": -112,
      "radius": 3.414957133354619,
      "length": 31.430205639851373,
      "seed": 1319291759
    },
    {
      "id": "island-35-underside-spike-6",
      "x": 482.9581483754764,
      "y": -1119.8370288524163,
      "z": -112,
      "radius": 3.1609910770785064,
      "length": 31.260592769298523,
      "seed": 2936352701
    },
    {
      "id": "island-35-underside-spike-7",
      "x": 467.73867203489937,
      "y": -1090.4272123686121,
      "z": -112,
      "radius": 3.061996026430279,
      "length": 23.827623453976233,
      "seed": 26555388
    },
    {
      "id": "island-36-underside-spike-0",
      "x": 339.0400966736361,
      "y": 1457.7941781230554,
      "z": -83,
      "radius": 3.477906267832212,
      "length": 25.88122314668733,
      "seed": 2598246737
    },
    {
      "id": "island-36-underside-spike-1",
      "x": 338.92696141645797,
      "y": 1446.4274120359823,
      "z": -83,
      "radius": 3.7853950503431233,
      "length": 35.92699693020792,
      "seed": 1067527183
    },
    {
      "id": "island-36-underside-spike-2",
      "x": 336.0412149318326,
      "y": 1469.543812690417,
      "z": -83,
      "radius": 3.635306176998287,
      "length": 25.669303823529958,
      "seed": 1121272669
    },
    {
      "id": "island-36-underside-spike-3",
      "x": 354.4294603853633,
      "y": 1431.407416967431,
      "z": -83,
      "radius": 3.0882081344535193,
      "length": 22.62860731569812,
      "seed": 859457211
    },
    {
      "id": "island-36-underside-spike-4",
      "x": 360.4680125344247,
      "y": 1471.3875572325242,
      "z": -83,
      "radius": 4.055465257376623,
      "length": 26.427721950922198,
      "seed": 3230754429
    },
    {
      "id": "island-36-underside-spike-5",
      "x": 372.92754444877306,
      "y": 1461.8122817368962,
      "z": -83,
      "radius": 3.333373831857341,
      "length": 31.525068075799183,
      "seed": 1860372412
    },
    {
      "id": "island-36-underside-spike-6",
      "x": 343.2244342548946,
      "y": 1435.8562977936188,
      "z": -83,
      "radius": 3.7728122835164664,
      "length": 34.871324193391445,
      "seed": 3874026850
    },
    {
      "id": "island-36-underside-spike-7",
      "x": 348.4855245381441,
      "y": 1469.4546764257516,
      "z": -83,
      "radius": 3.4654327333219967,
      "length": 24.745423522263593,
      "seed": 88316667
    },
    {
      "id": "island-39-underside-spike-0",
      "x": -1029.0386764218854,
      "y": -19.992088693780914,
      "z": -38,
      "radius": 3.770023887396338,
      "length": 28.119391571816426,
      "seed": 1191238044
    },
    {
      "id": "island-39-underside-spike-1",
      "x": -961.3170588757644,
      "y": -5.612732177789559,
      "z": -38,
      "radius": 5.128268919104823,
      "length": 40.9644956328829,
      "seed": 1749704770
    },
    {
      "id": "island-39-underside-spike-2",
      "x": -1012.9304335160798,
      "y": 12.14345198189948,
      "z": -38,
      "radius": 4.372550813425386,
      "length": 35.942723558941054,
      "seed": 1476446776
    },
    {
      "id": "island-39-underside-spike-3",
      "x": -981.6302475774969,
      "y": 12.067323736577139,
      "z": -38,
      "radius": 3.3729433121467403,
      "length": 30.990236054676405,
      "seed": 2903698568
    },
    {
      "id": "island-39-underside-spike-4",
      "x": -993.0470120165804,
      "y": 11.888808149046957,
      "z": -38,
      "radius": 3.7588652945565824,
      "length": 32.755612527247465,
      "seed": 2829092046
    },
    {
      "id": "island-39-underside-spike-5",
      "x": -993.5793566564645,
      "y": -37.951142562248,
      "z": -38,
      "radius": 4.775710361327912,
      "length": 35.655627224834916,
      "seed": 1673765481
    },
    {
      "id": "island-39-underside-spike-6",
      "x": -1017.620923002024,
      "y": -24.120183138354477,
      "z": -38,
      "radius": 4.867942282762042,
      "length": 35.97242746008675,
      "seed": 3147732217
    },
    {
      "id": "island-39-underside-spike-7",
      "x": -981.82071462498,
      "y": -36.20634328855489,
      "z": -38,
      "radius": 3.9563815635502393,
      "length": 28.566762358614152,
      "seed": 1279245768
    },
    {
      "id": "island-39-underside-spike-8",
      "x": -1007.9051396165637,
      "y": -35.86407528056378,
      "z": -38,
      "radius": 3.2254326392293784,
      "length": 24.33644496840031,
      "seed": 127679502
    },
    {
      "id": "island-40-underside-spike-0",
      "x": -1312.9225389017429,
      "y": 1438.5296711323208,
      "z": -81,
      "radius": 3.5225513526629277,
      "length": 34.51437149017448,
      "seed": 1104134194
    },
    {
      "id": "island-40-underside-spike-1",
      "x": -1301.5942005285672,
      "y": 1438.4520751474888,
      "z": -81,
      "radius": 3.008293510035584,
      "length": 28.64543558684505,
      "seed": 847478440
    },
    {
      "id": "island-40-underside-spike-2",
      "x": -1286.9017015018856,
      "y": 1475.464382662353,
      "z": -81,
      "radius": 3.876632544738203,
      "length": 35.156200021165226,
      "seed": 3570228718
    },
    {
      "id": "island-40-underside-spike-3",
      "x": -1278.43392805709,
      "y": 1463.955153768231,
      "z": -81,
      "radius": 3.7465057030457594,
      "length": 35.3001650295889,
      "seed": 532818697
    },
    {
      "id": "island-40-underside-spike-4",
      "x": -1275.6401307199749,
      "y": 1475.0430574125332,
      "z": -81,
      "radius": 3.0478674643963157,
      "length": 22.73559148984927,
      "seed": 2334810510
    },
    {
      "id": "island-40-underside-spike-5",
      "x": -1300.253951248041,
      "y": 1477.6225238973325,
      "z": -81,
      "radius": 4.0419704898818685,
      "length": 33.20810664650021,
      "seed": 2303848996
    },
    {
      "id": "island-40-underside-spike-6",
      "x": -1292.7505715423576,
      "y": 1437.6921649358167,
      "z": -81,
      "radius": 3.226632184473506,
      "length": 24.79510501063573,
      "seed": 4108697460
    },
    {
      "id": "island-40-underside-spike-7",
      "x": -1278.7058853237045,
      "y": 1444.3682901484478,
      "z": -81,
      "radius": 4.115645654140744,
      "length": 35.66697156944345,
      "seed": 2474962174
    },
    {
      "id": "island-41-underside-spike-0",
      "x": -593.5099633777488,
      "y": 1593.25836902845,
      "z": -66,
      "radius": 3.873527461430058,
      "length": 31.697232965406094,
      "seed": 3166565297
    },
    {
      "id": "island-41-underside-spike-1",
      "x": -583.0449828665414,
      "y": 1575.3100682012587,
      "z": -66,
      "radius": 3.3793650541920215,
      "length": 32.164210633518636,
      "seed": 2265430895
    },
    {
      "id": "island-41-underside-spike-2",
      "x": -570.6345305234513,
      "y": 1579.6338870461923,
      "z": -66,
      "radius": 3.62089002574794,
      "length": 26.723182648625627,
      "seed": 1918279613
    },
    {
      "id": "island-41-underside-spike-3",
      "x": -591.5614378784195,
      "y": 1607.684027961268,
      "z": -66,
      "radius": 3.6916682205628604,
      "length": 27.87764576733601,
      "seed": 3956160333
    },
    {
      "id": "island-41-underside-spike-4",
      "x": -562.6951586549513,
      "y": 1610.173137054978,
      "z": -66,
      "radius": 3.1526203642133623,
      "length": 28.73738052999212,
      "seed": 2328555307
    },
    {
      "id": "island-41-underside-spike-5",
      "x": -553.4783483025698,
      "y": 1589.3540478182158,
      "z": -66,
      "radius": 3.643639162182808,
      "length": 32.36283875961423,
      "seed": 3507143794
    },
    {
      "id": "island-41-underside-spike-6",
      "x": -594.1917299310546,
      "y": 1582.166227771873,
      "z": -66,
      "radius": 3.9070576715748757,
      "length": 30.396944716896297,
      "seed": 3487419493
    },
    {
      "id": "island-41-underside-spike-7",
      "x": -573.3092897562784,
      "y": 1611.3408120366332,
      "z": -66,
      "radius": 3.6060188233386725,
      "length": 32.19128597056596,
      "seed": 2194988893
    },
    {
      "id": "island-42-underside-spike-0",
      "x": -1199.1979229976023,
      "y": 728.2906144731066,
      "z": -74,
      "radius": 3.2160649667529766,
      "length": 25.929547686122984,
      "seed": 2325426139
    },
    {
      "id": "island-42-underside-spike-1",
      "x": -1155.7025012196214,
      "y": 711.5823658032433,
      "z": -74,
      "radius": 3.6955250087882363,
      "length": 35.41101268480257,
      "seed": 1541618121
    },
    {
      "id": "island-42-underside-spike-2",
      "x": -1166.9171858531035,
      "y": 740.5956431170935,
      "z": -74,
      "radius": 3.169644690725807,
      "length": 26.424153362676673,
      "seed": 2537738951
    },
    {
      "id": "island-42-underside-spike-3",
      "x": -1158.8576837850476,
      "y": 743.4101796517881,
      "z": -74,
      "radius": 3.346687490857401,
      "length": 25.88178036916947,
      "seed": 485387861
    },
    {
      "id": "island-42-underside-spike-4",
      "x": -1180.2916919974093,
      "y": 709.5980928336477,
      "z": -74,
      "radius": 3.4484093818734287,
      "length": 30.731572277612916,
      "seed": 186156019
    },
    {
      "id": "island-42-underside-spike-5",
      "x": -1192.1037354074247,
      "y": 747.139475068867,
      "z": -74,
      "radius": 3.436682684159466,
      "length": 30.786729050531857,
      "seed": 4024828163
    },
    {
      "id": "island-42-underside-spike-6",
      "x": -1166.8558607175432,
      "y": 714.8060552452329,
      "z": -74,
      "radius": 3.661819821955514,
      "length": 29.069228776313622,
      "seed": 1356935941
    },
    {
      "id": "island-42-underside-spike-7",
      "x": -1194.116657892643,
      "y": 717.7423477433183,
      "z": -74,
      "radius": 3.134053292040364,
      "length": 22.677544514707662,
      "seed": 153897282
    },
    {
      "id": "island-44-underside-spike-0",
      "x": 728.2343986092612,
      "y": -1079.172308370716,
      "z": -113,
      "radius": 3.609258018899709,
      "length": 29.2010037402516,
      "seed": 4167024356
    },
    {
      "id": "island-44-underside-spike-1",
      "x": 732.5491231607349,
      "y": -1048.4724916069742,
      "z": -113,
      "radius": 3.9852322544902563,
      "length": 37.352323159370656,
      "seed": 72245578
    },
    {
      "id": "island-44-underside-spike-2",
      "x": 743.0044323362299,
      "y": -1081.0255358905358,
      "z": -113,
      "radius": 3.4184906552545726,
      "length": 27.714675907220215,
      "seed": 1680824576
    },
    {
      "id": "island-44-underside-spike-3",
      "x": 747.2964009315921,
      "y": -1063.009674921512,
      "z": -113,
      "radius": 3.262696522520855,
      "length": 24.6679448756367,
      "seed": 264322055
    },
    {
      "id": "island-44-underside-spike-4",
      "x": 748.0633702152089,
      "y": -1051.354737364234,
      "z": -113,
      "radius": 3.5012823843640737,
      "length": 24.850615066681947,
      "seed": 3202009576
    },
    {
      "id": "island-44-underside-spike-5",
      "x": 719.6797172851069,
      "y": -1056.729721361606,
      "z": -113,
      "radius": 3.780243373475969,
      "length": 34.616601524944556,
      "seed": 480198446
    },
    {
      "id": "island-44-underside-spike-6",
      "x": 723.0566511101874,
      "y": -1066.9763373677672,
      "z": -113,
      "radius": 3.362001701956615,
      "length": 24.648415975740008,
      "seed": 2230390601
    },
    {
      "id": "island-44-underside-spike-7",
      "x": 753.7886734717513,
      "y": -1069.5075858725365,
      "z": -113,
      "radius": 3.288136470705965,
      "length": 28.07470140767555,
      "seed": 139972666
    },
    {
      "id": "island-45-underside-spike-0",
      "x": -1409.79413626681,
      "y": 635.8046224571118,
      "z": -59,
      "radius": 3.027827351819724,
      "length": 27.187665117800524,
      "seed": 2224397664
    },
    {
      "id": "island-45-underside-spike-1",
      "x": -1415.548736233854,
      "y": 629.0946640110556,
      "z": -59,
      "radius": 3.527726565487683,
      "length": 27.259257846856915,
      "seed": 3076341990
    },
    {
      "id": "island-45-underside-spike-2",
      "x": -1413.2602662308682,
      "y": 645.0610225736017,
      "z": -59,
      "radius": 3.332662300941354,
      "length": 24.062261302439985,
      "seed": 1799964860
    },
    {
      "id": "island-45-underside-spike-3",
      "x": -1423.0404510844378,
      "y": 620.6722814407027,
      "z": -59,
      "radius": 3.4059530466329306,
      "length": 25.984287356978026,
      "seed": 3862072989
    },
    {
      "id": "island-45-underside-spike-4",
      "x": -1443.949050957301,
      "y": 630.556906666646,
      "z": -59,
      "radius": 3.741508901817724,
      "length": 28.792096474941463,
      "seed": 1780571693
    },
    {
      "id": "island-45-underside-spike-5",
      "x": -1443.961002209834,
      "y": 643.2445471808536,
      "z": -59,
      "radius": 3.349287570687011,
      "length": 24.700014134510646,
      "seed": 649709951
    },
    {
      "id": "island-45-underside-spike-6",
      "x": -1434.9634312140613,
      "y": 651.1566481095873,
      "z": -59,
      "radius": 3.2078186813741922,
      "length": 28.862124776073546,
      "seed": 2899102810
    },
    {
      "id": "island-45-underside-spike-7",
      "x": -1422.018505698892,
      "y": 647.6945171723412,
      "z": -59,
      "radius": 3.4099084024783224,
      "length": 23.841191956327844,
      "seed": 3045424857
    },
    {
      "id": "island-53-underside-spike-0",
      "x": -2222.0542933557035,
      "y": 1132.81032974095,
      "z": -102,
      "radius": 3.309967787695673,
      "length": 26.607902403192572,
      "seed": 4023916694
    },
    {
      "id": "island-53-underside-spike-1",
      "x": -2198.8645269382882,
      "y": 1140.5276729535701,
      "z": -102,
      "radius": 3.294199900119572,
      "length": 24.084198942836686,
      "seed": 1678985830
    },
    {
      "id": "island-53-underside-spike-2",
      "x": -2177.5415940600533,
      "y": 1109.1811903892592,
      "z": -102,
      "radius": 3.5462005702325707,
      "length": 27.900441332945498,
      "seed": 1704797756
    },
    {
      "id": "island-53-underside-spike-3",
      "x": -2215.4328381966516,
      "y": 1123.4310722004043,
      "z": -102,
      "radius": 3.4270942224189946,
      "length": 28.54815207425993,
      "seed": 4018596381
    },
    {
      "id": "island-53-underside-spike-4",
      "x": -2210.313134686572,
      "y": 1111.941907395204,
      "z": -102,
      "radius": 3.806643525526174,
      "length": 35.597903183260755,
      "seed": 557008763
    },
    {
      "id": "island-53-underside-spike-5",
      "x": -2211.097284731537,
      "y": 1140.7250843119955,
      "z": -102,
      "radius": 3.741784096195932,
      "length": 35.183036038870966,
      "seed": 3964186408
    },
    {
      "id": "island-53-underside-spike-6",
      "x": -2189.2751258639805,
      "y": 1138.664603396729,
      "z": -102,
      "radius": 3.5724004705879087,
      "length": 33.52702299279825,
      "seed": 2254005453
    },
    {
      "id": "island-53-underside-spike-7",
      "x": -2180.137672052863,
      "y": 1133.5021934821232,
      "z": -102,
      "radius": 3.299673515482447,
      "length": 29.46570026742265,
      "seed": 1296945323
    },
    {
      "id": "island-56-underside-spike-0",
      "x": -857.1173241777416,
      "y": 1261.2535024692393,
      "z": -92,
      "radius": 3.786406415683339,
      "length": 25.653905989014042,
      "seed": 749746647
    },
    {
      "id": "island-56-underside-spike-1",
      "x": -846.1329726991409,
      "y": 1300.8028860509498,
      "z": -92,
      "radius": 4.9221979677098355,
      "length": 36.837107974364606,
      "seed": 624134373
    },
    {
      "id": "island-56-underside-spike-2",
      "x": -837.2722625251624,
      "y": 1278.594868741959,
      "z": -92,
      "radius": 5.143558483532756,
      "length": 35.22827267738013,
      "seed": 3590936067
    },
    {
      "id": "island-56-underside-spike-3",
      "x": -874.543845624556,
      "y": 1253.9483240563782,
      "z": -92,
      "radius": 3.5020732582380316,
      "length": 26.813091033786602,
      "seed": 4084438803
    },
    {
      "id": "island-56-underside-spike-4",
      "x": -877.0022890903717,
      "y": 1293.093546963407,
      "z": -92,
      "radius": 3.222816350973037,
      "length": 30.719615099737002,
      "seed": 3500892576
    },
    {
      "id": "island-56-underside-spike-5",
      "x": -886.3860365492638,
      "y": 1289.5241121925435,
      "z": -92,
      "radius": 4.496723284362195,
      "length": 40.9608019402322,
      "seed": 3524328944
    },
    {
      "id": "island-56-underside-spike-6",
      "x": -825.0147170590437,
      "y": 1284.439990205494,
      "z": -92,
      "radius": 3.979356897825408,
      "length": 28.160005921464215,
      "seed": 3846895201
    },
    {
      "id": "island-56-underside-spike-7",
      "x": -889.3250919408504,
      "y": 1278.9057011521443,
      "z": -92,
      "radius": 3.0975320645311,
      "length": 22.569203952119143,
      "seed": 4089351327
    },
    {
      "id": "island-56-underside-spike-8",
      "x": -833.9448093254848,
      "y": 1299.8071577363057,
      "z": -92,
      "radius": 4.5550934884036085,
      "length": 41.71288844440879,
      "seed": 661433197
    },
    {
      "id": "island-58-underside-spike-0",
      "x": -2081.448647363989,
      "y": 1433.3098829721703,
      "z": -62,
      "radius": 3.8060438621323556,
      "length": 29.742145508925997,
      "seed": 3721715173
    },
    {
      "id": "island-58-underside-spike-1",
      "x": -2077.7046739609905,
      "y": 1451.2514921820286,
      "z": -62,
      "radius": 3.3242438382003456,
      "length": 25.39970986783087,
      "seed": 2896282371
    },
    {
      "id": "island-58-underside-spike-2",
      "x": -2064.0776801856405,
      "y": 1428.2470696870646,
      "z": -62,
      "radius": 3.6913374008145183,
      "length": 31.666217304171813,
      "seed": 2445320625
    },
    {
      "id": "island-58-underside-spike-3",
      "x": -2055.3174187942327,
      "y": 1446.510144819246,
      "z": -62,
      "radius": 3.1988928760401905,
      "length": 26.639605299846966,
      "seed": 1392194208
    },
    {
      "id": "island-58-underside-spike-4",
      "x": -2089.9331180565505,
      "y": 1444.2396006549086,
      "z": -62,
      "radius": 3.770833315094933,
      "length": 31.416934620718017,
      "seed": 1908133585
    },
    {
      "id": "island-58-underside-spike-5",
      "x": -2063.1882275359712,
      "y": 1454.6164480306884,
      "z": -62,
      "radius": 3.261066863546148,
      "length": 28.49460712207623,
      "seed": 1269227331
    },
    {
      "id": "island-58-underside-spike-6",
      "x": -2071.2703463239427,
      "y": 1458.4744978057286,
      "z": -62,
      "radius": 3.1677789730019867,
      "length": 27.71837713923864,
      "seed": 1271971092
    },
    {
      "id": "island-58-underside-spike-7",
      "x": -2054.0818439998197,
      "y": 1436.6550958854452,
      "z": -62,
      "radius": 3.6514765634201467,
      "length": 27.484674426930965,
      "seed": 3885086760
    },
    {
      "id": "hunting-glacier-underside-spike-0",
      "x": -1760.5851867845615,
      "y": -1053.0507732377332,
      "z": -220,
      "radius": 3.946255607604981,
      "length": 14.093770027160645,
      "seed": 2517049279
    },
    {
      "id": "hunting-glacier-underside-spike-1",
      "x": -1383.0146901397195,
      "y": -956.7418220767364,
      "z": -220,
      "radius": 5.587988777160645,
      "length": 19.95710277557373,
      "seed": 2242657677
    },
    {
      "id": "hunting-glacier-underside-spike-2",
      "x": -1361.7623549458767,
      "y": -1139.5082134279203,
      "z": -220,
      "radius": 5.498420639038087,
      "length": 19.637216567993164,
      "seed": 3734500203
    },
    {
      "id": "hunting-glacier-underside-spike-3",
      "x": -1401.619908199769,
      "y": -877.9239320049765,
      "z": -220,
      "radius": 5.290772361755372,
      "length": 18.895615577697754,
      "seed": 2325163225
    },
    {
      "id": "hunting-glacier-underside-spike-4",
      "x": -1387.5596518674388,
      "y": -913.2981616241777,
      "z": -220,
      "radius": 5.590311927795411,
      "length": 19.965399742126465,
      "seed": 3023771991
    },
    {
      "id": "hunting-glacier-underside-spike-5",
      "x": -1666.5228407250727,
      "y": -1202.7238767828685,
      "z": -220,
      "radius": 4.35518352508545,
      "length": 15.554226875305176,
      "seed": 3797027941
    },
    {
      "id": "hunting-glacier-underside-spike-6",
      "x": -1324.9198604017793,
      "y": -1111.8413636229284,
      "z": -220,
      "radius": 5.753359718322755,
      "length": 20.54771327972412,
      "seed": 3170983299
    },
    {
      "id": "hunting-glacier-underside-spike-7",
      "x": -1445.2193849743778,
      "y": -1171.5348878238672,
      "z": -220,
      "radius": 5.065233154296876,
      "length": 18.090118408203125,
      "seed": 2721597489
    },
    {
      "id": "hunting-glacier-underside-spike-8",
      "x": -1562.9728093119409,
      "y": -875.7125849331425,
      "z": -220,
      "radius": 4.455853385925294,
      "length": 15.913762092590332,
      "seed": 4218670063
    },
    {
      "id": "hunting-glacier-underside-spike-9",
      "x": -1685.6356706305448,
      "y": -946.4031657559958,
      "z": -220,
      "radius": 4.067693634033204,
      "length": 14.527477264404297,
      "seed": 1628146749
    },
    {
      "id": "hunting-glacier-underside-spike-10",
      "x": -1564.43850268477,
      "y": -1203.1838414451558,
      "z": -220,
      "radius": 4.64765350341797,
      "length": 16.59876251220703,
      "seed": 260026523
    },
    {
      "id": "hunting-glacier-underside-spike-11",
      "x": -1729.869438324849,
      "y": -999.7433367646688,
      "z": -220,
      "radius": 3.962444229125977,
      "length": 14.151586532592773,
      "seed": 2575287433
    },
    {
      "id": "hunting-glacier-underside-spike-12",
      "x": -1785.1511459885098,
      "y": -973.2533647992954,
      "z": -220,
      "radius": 3.9210948181152347,
      "length": 14.003910064697266,
      "seed": 631412615
    },
    {
      "id": "hunting-glacier-underside-spike-13",
      "x": -1299.9408373376425,
      "y": -1031.9945454221463,
      "z": -220,
      "radius": 4.102698466507718,
      "length": 20.88197612762451,
      "seed": 2030509333
    },
    {
      "id": "hunting-glacier-underside-spike-14",
      "x": -1408.45243960126,
      "y": -1146.0017266105433,
      "z": -220,
      "radius": 5.2943772506713875,
      "length": 18.90849018096924,
      "seed": 1647499786
    },
    {
      "id": "hunting-glacier-underside-spike-15",
      "x": -1299.207245733825,
      "y": -911.2762457582093,
      "z": -220,
      "radius": 5.856285972595216,
      "length": 20.91530704498291,
      "seed": 586554304
    },
    {
      "id": "hunting-glacier-underside-spike-16",
      "x": -1266.953454348867,
      "y": -997.2019780907805,
      "z": -220,
      "radius": 6.093474311828614,
      "length": 21.76240825653076,
      "seed": 3689043014
    },
    {
      "id": "hunting-glacier-underside-spike-17",
      "x": -1322.8766832139022,
      "y": -973.730344099904,
      "z": -220,
      "radius": 5.872407836914063,
      "length": 20.972885131835938,
      "seed": 1455425820
    },
    {
      "id": "hunting-glacier-underside-spike-18",
      "x": -1600.0334649545846,
      "y": -874.528425584362,
      "z": -220,
      "radius": 4.242524070739747,
      "length": 15.151871681213379,
      "seed": 2035725250
    },
    {
      "id": "hunting-glacier-underside-spike-19",
      "x": -1610.8307023637578,
      "y": -1214.1683302141062,
      "z": -220,
      "radius": 4.608487052917481,
      "length": 16.458882331848145,
      "seed": 1928602040
    },
    {
      "id": "crossing-floe-0-underside-spike-0",
      "x": -1122.52562714608,
      "y": -359.23078386532967,
      "z": -80,
      "radius": 3.8067348728701473,
      "length": 33.043621124702256,
      "seed": 1026370006
    },
    {
      "id": "crossing-floe-0-underside-spike-1",
      "x": -1123.8150290621502,
      "y": -342.02857995573896,
      "z": -80,
      "radius": 3.398476143311709,
      "length": 27.345438333882417,
      "seed": 3262316076
    },
    {
      "id": "crossing-floe-0-underside-spike-2",
      "x": -1103.322823219034,
      "y": -365.19990619569387,
      "z": -80,
      "radius": 3.2710710462927817,
      "length": 25.158542147877085,
      "seed": 2223729746
    },
    {
      "id": "crossing-floe-0-underside-spike-3",
      "x": -1082.134265717375,
      "y": -333.103742211969,
      "z": -80,
      "radius": 3.6810919821448627,
      "length": 30.108303283478087,
      "seed": 727327176
    },
    {
      "id": "crossing-floe-0-underside-spike-4",
      "x": -1106.9018960913907,
      "y": -333.30308017103226,
      "z": -80,
      "radius": 3.461918200124055,
      "length": 33.91622821842903,
      "seed": 3091228696
    },
    {
      "id": "crossing-floe-0-underside-spike-5",
      "x": -1070.6088546465803,
      "y": -340.9038901440762,
      "z": -80,
      "radius": 3.379931298214942,
      "length": 29.14463162077801,
      "seed": 3446768232
    },
    {
      "id": "crossing-floe-0-underside-spike-6",
      "x": -1095.8413500609788,
      "y": -329.62618208716316,
      "z": -80,
      "radius": 3.900998170673847,
      "length": 35.085523651441385,
      "seed": 4039665554
    },
    {
      "id": "crossing-floe-0-underside-spike-7",
      "x": -1132.2560138006515,
      "y": -353.57960924863136,
      "z": -80,
      "radius": 3.819227723032236,
      "length": 25.28363319404142,
      "seed": 3540732002
    },
    {
      "id": "submerged-0-underside-spike-0",
      "x": 366.9527495291508,
      "y": -175.632906419425,
      "z": -186,
      "radius": 4.143953127094863,
      "length": 33.72328190554779,
      "seed": 1446703375
    },
    {
      "id": "submerged-0-underside-spike-1",
      "x": 327.5835644047859,
      "y": -156.36191900668152,
      "z": -186,
      "radius": 3.1873126192957706,
      "length": 30.592945248229242,
      "seed": 2404819037
    },
    {
      "id": "submerged-0-underside-spike-2",
      "x": 330.66687468122586,
      "y": -173.52043801340582,
      "z": -186,
      "radius": 3.1037900459933594,
      "length": 27.83545823815424,
      "seed": 4136139707
    },
    {
      "id": "submerged-0-underside-spike-3",
      "x": 355.1257229974093,
      "y": -135.7322635248029,
      "z": -186,
      "radius": 3.604981392719709,
      "length": 29.96769807565584,
      "seed": 1431817897
    },
    {
      "id": "submerged-0-underside-spike-4",
      "x": 355.435298703288,
      "y": -178.5256421065402,
      "z": -186,
      "radius": 3.0080578501445236,
      "length": 29.26785194522681,
      "seed": 1828086190
    },
    {
      "id": "submerged-0-underside-spike-5",
      "x": 332.1568758245314,
      "y": -144.27851629861826,
      "z": -186,
      "radius": 4.160959523872164,
      "length": 30.51708417142142,
      "seed": 3674032452
    },
    {
      "id": "submerged-0-underside-spike-6",
      "x": 373.7663754872502,
      "y": -152.84429381183304,
      "z": -186,
      "radius": 3.5852179829578783,
      "length": 26.508582699183773,
      "seed": 526389957
    },
    {
      "id": "submerged-0-underside-spike-7",
      "x": 322.53448622133715,
      "y": -164.36248225411452,
      "z": -186,
      "radius": 3.364197568532247,
      "length": 32.19517885676707,
      "seed": 2424571876
    },
    {
      "id": "submerged-1-underside-spike-0",
      "x": -374.8719821156775,
      "y": 157.23962895205983,
      "z": -213,
      "radius": 4.5865495871611435,
      "length": 26,
      "seed": 4272641279
    },
    {
      "id": "submerged-1-underside-spike-1",
      "x": -352.7622048396699,
      "y": 145.0663186748146,
      "z": -213,
      "radius": 4.662575978307799,
      "length": 26,
      "seed": 395786445
    },
    {
      "id": "submerged-1-underside-spike-2",
      "x": -325.00925181397577,
      "y": 187.1716938525733,
      "z": -213,
      "radius": 4.3696558356847115,
      "length": 26,
      "seed": 2550400171
    },
    {
      "id": "submerged-1-underside-spike-3",
      "x": -323.85594345628544,
      "y": 173.1757999668527,
      "z": -213,
      "radius": 4.563618219676874,
      "length": 26,
      "seed": 3855098905
    },
    {
      "id": "submerged-1-underside-spike-4",
      "x": -331.50146257248576,
      "y": 150.30118726265457,
      "z": -213,
      "radius": 4.752276469035116,
      "length": 26,
      "seed": 724189865
    },
    {
      "id": "submerged-1-underside-spike-5",
      "x": -376.2856977820399,
      "y": 177.7994395620923,
      "z": -213,
      "radius": 3.762039446488366,
      "length": 26,
      "seed": 3517736366
    },
    {
      "id": "submerged-1-underside-spike-6",
      "x": -331.55242159174554,
      "y": 161.96197454512168,
      "z": -213,
      "radius": 3.000647606700692,
      "length": 26,
      "seed": 3747425225
    },
    {
      "id": "submerged-1-underside-spike-7",
      "x": -340.75216230427617,
      "y": 140.70203763173922,
      "z": -213,
      "radius": 5.057327849648631,
      "length": 26,
      "seed": 2730969422
    },
    {
      "id": "submerged-1-underside-spike-8",
      "x": -348.2512220889123,
      "y": 197.40936674827566,
      "z": -213,
      "radius": 4.62546010678563,
      "length": 26,
      "seed": 2994833694
    },
    {
      "id": "submerged-3-underside-spike-0",
      "x": -45.67413818543861,
      "y": -1436.1433886506015,
      "z": -218,
      "radius": 3.332867407007143,
      "length": 20.950714111328125,
      "seed": 3566774925
    },
    {
      "id": "submerged-3-underside-spike-1",
      "x": -55.89815653453538,
      "y": -1442.1124104120233,
      "z": -218,
      "radius": 3.3423382751643658,
      "length": 20.903745651245117,
      "seed": 620870626
    },
    {
      "id": "submerged-3-underside-spike-2",
      "x": -32.14727022596267,
      "y": -1465.8198195234002,
      "z": -218,
      "radius": 3.9426219589076936,
      "length": 20.999995231628418,
      "seed": 3164356824
    },
    {
      "id": "submerged-3-underside-spike-3",
      "x": -33.39015520563136,
      "y": -1445.2474320088613,
      "z": -218,
      "radius": 3.73469481151551,
      "length": 20.950714111328125,
      "seed": 1141150366
    },
    {
      "id": "submerged-3-underside-spike-4",
      "x": -69.16159933771877,
      "y": -1458.3637894240214,
      "z": -218,
      "radius": 3.1739950594492257,
      "length": 21.13010025024414,
      "seed": 1115227828
    },
    {
      "id": "submerged-3-underside-spike-5",
      "x": -58.51253369843483,
      "y": -1486.4403621771487,
      "z": -218,
      "radius": 3.8175155248027295,
      "length": 21.13010025024414,
      "seed": 467663605
    },
    {
      "id": "submerged-3-underside-spike-6",
      "x": -46.40283755691634,
      "y": -1484.9415269031044,
      "z": -218,
      "radius": 3.732325601624325,
      "length": 20.999995231628418,
      "seed": 3725036679
    },
    {
      "id": "submerged-3-underside-spike-7",
      "x": -71.26814113532274,
      "y": -1472.2092857220257,
      "z": -218,
      "radius": 3.6430248697288334,
      "length": 21.13010025024414,
      "seed": 371480228
    },
    {
      "id": "submerged-4-underside-spike-0",
      "x": -93.12872215010472,
      "y": -971.0071259804049,
      "z": -192,
      "radius": 3.3200642510782927,
      "length": 25.108889310408415,
      "seed": 653622461
    },
    {
      "id": "submerged-4-underside-spike-1",
      "x": -64.89019322718121,
      "y": -994.2630456859987,
      "z": -192,
      "radius": 3.851204231614247,
      "length": 36.492769086583735,
      "seed": 2934668571
    },
    {
      "id": "submerged-4-underside-spike-2",
      "x": -57.62312830792894,
      "y": -963.6186288911416,
      "z": -192,
      "radius": 3.134420820977539,
      "length": 23.03704927915927,
      "seed": 3662080328
    },
    {
      "id": "submerged-4-underside-spike-3",
      "x": -55.44127319609258,
      "y": -984.6889026896993,
      "z": -192,
      "radius": 3.0807407489046454,
      "length": 24.459196177217162,
      "seed": 46508942
    },
    {
      "id": "submerged-4-underside-spike-4",
      "x": -91.75721288577051,
      "y": -983.3246261889697,
      "z": -192,
      "radius": 3.6830234904773533,
      "length": 34.80392706859958,
      "seed": 4174277668
    },
    {
      "id": "submerged-4-underside-spike-5",
      "x": -79.37659532477203,
      "y": -991.428543486088,
      "z": -192,
      "radius": 3.0847171214409173,
      "length": 22.36324776681426,
      "seed": 1231599988
    },
    {
      "id": "submerged-4-underside-spike-6",
      "x": -68.55749962454647,
      "y": -965.3569437002698,
      "z": -192,
      "radius": 3.3707030264195055,
      "length": 30.471481811222326,
      "seed": 3966062409
    },
    {
      "id": "submerged-4-underside-spike-7",
      "x": -52.243075273252586,
      "y": -976.9809443849571,
      "z": -192,
      "radius": 3.0365516087040305,
      "length": 24.902296512354425,
      "seed": 3000771278
    },
    {
      "id": "submerged-7-underside-spike-0",
      "x": -574.1485634332348,
      "y": -2076.570676818301,
      "z": -189,
      "radius": 3.7737765561521432,
      "length": 31.467401641779194,
      "seed": 2712032633
    },
    {
      "id": "submerged-7-underside-spike-1",
      "x": -625.7329384561914,
      "y": -2057.6648401732814,
      "z": -189,
      "radius": 5.304726600545838,
      "length": 35.09576010315465,
      "seed": 897299703
    },
    {
      "id": "submerged-7-underside-spike-2",
      "x": -585.0449889429315,
      "y": -2082.7375532473675,
      "z": -189,
      "radius": 4.503240921162833,
      "length": 38.57285551260368,
      "seed": 1290888660
    },
    {
      "id": "submerged-7-underside-spike-3",
      "x": -638.6112124177878,
      "y": -2074.5869836152956,
      "z": -189,
      "radius": 4.5561569441074665,
      "length": 39.28385723438663,
      "seed": 3875955898
    },
    {
      "id": "submerged-7-underside-spike-4",
      "x": -611.5587367321785,
      "y": -2103.955942389659,
      "z": -189,
      "radius": 4.042437978171353,
      "length": 38.26048167528573,
      "seed": 3883218160
    },
    {
      "id": "submerged-7-underside-spike-5",
      "x": -601.9489592087847,
      "y": -2053.9074613870457,
      "z": -189,
      "radius": 5.34240214689076,
      "length": 40.58609008474848,
      "seed": 520382454
    },
    {
      "id": "submerged-7-underside-spike-6",
      "x": -582.2535595208877,
      "y": -2056.188618682078,
      "z": -189,
      "radius": 3.9057604621076494,
      "length": 37.303054815751565,
      "seed": 4235804243
    },
    {
      "id": "submerged-7-underside-spike-7",
      "x": -595.7465564081474,
      "y": -2093.5910765897224,
      "z": -189,
      "radius": 4.0676277096227835,
      "length": 36.6802072436624,
      "seed": 4139048577
    },
    {
      "id": "submerged-7-underside-spike-8",
      "x": -623.8652893490289,
      "y": -2094.365799892168,
      "z": -189,
      "radius": 3.1717799347475113,
      "length": 28.546333520660397,
      "seed": 2456283572
    },
    {
      "id": "submerged-8-underside-spike-0",
      "x": -811.4797681797124,
      "y": 1638.5113497246712,
      "z": -214,
      "radius": 3.0647310332860798,
      "length": 23.437519073486328,
      "seed": 3522604113
    },
    {
      "id": "submerged-8-underside-spike-1",
      "x": -800.9988165109913,
      "y": 1642.9183619042556,
      "z": -214,
      "radius": 3.47056603920646,
      "length": 23.437519073486328,
      "seed": 1525769999
    },
    {
      "id": "submerged-8-underside-spike-2",
      "x": -758.0827909744222,
      "y": 1634.0200133571059,
      "z": -214,
      "radius": 3.1104839467443526,
      "length": 24.01597023010254,
      "seed": 3517578444
    },
    {
      "id": "submerged-8-underside-spike-3",
      "x": -789.6192661302049,
      "y": 1626.2601298368088,
      "z": -214,
      "radius": 3.4679197520017624,
      "length": 24.01597023010254,
      "seed": 126987762
    },
    {
      "id": "submerged-8-underside-spike-4",
      "x": -749.763949340831,
      "y": 1643.568867862345,
      "z": -214,
      "radius": 3.1321444078348577,
      "length": 24.01597023010254,
      "seed": 1100336744
    },
    {
      "id": "submerged-8-underside-spike-5",
      "x": -761.9850069212321,
      "y": 1624.7946654773048,
      "z": -214,
      "radius": 3.207932717166841,
      "length": 24.01597023010254,
      "seed": 2427092910
    },
    {
      "id": "submerged-8-underside-spike-6",
      "x": -789.980685766409,
      "y": 1648.3463968436054,
      "z": -214,
      "radius": 3.921869680751115,
      "length": 23.82101535797119,
      "seed": 3681744708
    },
    {
      "id": "submerged-8-underside-spike-7",
      "x": -758.9737695482991,
      "y": 1647.9255915834658,
      "z": -214,
      "radius": 3.8399383935611695,
      "length": 23.82101535797119,
      "seed": 2045974725
    },
    {
      "id": "submerged-9-underside-spike-0",
      "x": -1468.0706740671017,
      "y": 1629.6018319875595,
      "z": -201,
      "radius": 4.314661067790577,
      "length": 37.198475572372004,
      "seed": 3588171701
    },
    {
      "id": "submerged-9-underside-spike-1",
      "x": -1439.8370607725376,
      "y": 1646.1716480883586,
      "z": -201,
      "radius": 3.133863522044351,
      "length": 26.310702079374472,
      "seed": 891890986
    },
    {
      "id": "submerged-9-underside-spike-2",
      "x": -1469.7459547289,
      "y": 1643.1380184933282,
      "z": -201,
      "radius": 3.7978677807804306,
      "length": 27.01772553271464,
      "seed": 474312160
    },
    {
      "id": "submerged-9-underside-spike-3",
      "x": -1469.3744833006444,
      "y": 1608.962655896748,
      "z": -201,
      "radius": 3.18497987365588,
      "length": 29.170551626898025,
      "seed": 193457510
    },
    {
      "id": "submerged-9-underside-spike-4",
      "x": -1451.8128975074019,
      "y": 1605.678024461272,
      "z": -201,
      "radius": 3.8662121047130684,
      "length": 26.750496882138926,
      "seed": 722792764
    },
    {
      "id": "submerged-9-underside-spike-5",
      "x": -1440.0862858306277,
      "y": 1613.0037358044315,
      "z": -201,
      "radius": 3.1302617732752904,
      "length": 31.43071594077817,
      "seed": 3934368482
    },
    {
      "id": "submerged-9-underside-spike-6",
      "x": -1433.4577729911593,
      "y": 1640.1999454041463,
      "z": -201,
      "radius": 3.503802821717617,
      "length": 33.374356299952595,
      "seed": 2376360109
    },
    {
      "id": "submerged-9-underside-spike-7",
      "x": -1452.80887738382,
      "y": 1644.729261371455,
      "z": -201,
      "radius": 3.992778403045861,
      "length": 26.12433297216052,
      "seed": 3423517862
    },
    {
      "id": "submerged-11-underside-spike-0",
      "x": -259.6576942679722,
      "y": -1661.3244176980684,
      "z": -224,
      "radius": 3.4852093302297646,
      "length": 18.136630058288574,
      "seed": 3186255834
    },
    {
      "id": "submerged-11-underside-spike-1",
      "x": -277.856508334239,
      "y": -1696.8406421393213,
      "z": -224,
      "radius": 3.6839967028733462,
      "length": 18.136630058288574,
      "seed": 90748688
    },
    {
      "id": "submerged-11-underside-spike-2",
      "x": -290.65837674295545,
      "y": -1684.368383425218,
      "z": -224,
      "radius": 3.42071468826536,
      "length": 18.136630058288574,
      "seed": 3492851990
    },
    {
      "id": "submerged-11-underside-spike-3",
      "x": -251.9735427989889,
      "y": -1682.7130168452436,
      "z": -224,
      "radius": 4.361396760151011,
      "length": 17.70728588104248,
      "seed": 2874424172
    },
    {
      "id": "submerged-11-underside-spike-4",
      "x": -287.0595697765501,
      "y": -1664.2184742395325,
      "z": -224,
      "radius": 4.008813312863762,
      "length": 18.136630058288574,
      "seed": 2444196540
    },
    {
      "id": "submerged-11-underside-spike-5",
      "x": -253.91393278484918,
      "y": -1698.4011013844047,
      "z": -224,
      "radius": 3.2021490577224467,
      "length": 18.136630058288574,
      "seed": 3757445218
    },
    {
      "id": "submerged-11-underside-spike-6",
      "x": -259.5107647105334,
      "y": -1689.5822632814968,
      "z": -224,
      "radius": 3.528635171819007,
      "length": 18.136630058288574,
      "seed": 3359782236
    },
    {
      "id": "submerged-11-underside-spike-7",
      "x": -289.8845019606981,
      "y": -1673.7356054007025,
      "z": -224,
      "radius": 3.4519089668909966,
      "length": 18.136630058288574,
      "seed": 1340754478
    },
    {
      "id": "submerged-13-underside-spike-0",
      "x": -476.99672211994954,
      "y": 1096.170578501179,
      "z": -176,
      "radius": 3.7592722887638956,
      "length": 35.66668751534127,
      "seed": 3551905931
    },
    {
      "id": "submerged-13-underside-spike-1",
      "x": -488.7232643747183,
      "y": 1107.1090661977819,
      "z": -176,
      "radius": 3.2874807675834745,
      "length": 24.735111999142227,
      "seed": 426209529
    },
    {
      "id": "submerged-13-underside-spike-2",
      "x": -458.54106717791007,
      "y": 1118.3046891048157,
      "z": -176,
      "radius": 3.5476378940511495,
      "length": 26.336838399852414,
      "seed": 476288119
    },
    {
      "id": "submerged-13-underside-spike-3",
      "x": -486.3302978430668,
      "y": 1124.6056950984084,
      "z": -176,
      "radius": 3.893988581289533,
      "length": 33.44082632214878,
      "seed": 267404933
    },
    {
      "id": "submerged-13-underside-spike-4",
      "x": -470.62798260726237,
      "y": 1123.8307688663429,
      "z": -176,
      "radius": 3.6748453248292208,
      "length": 26.35724364980518,
      "seed": 1687559738
    },
    {
      "id": "submerged-13-underside-spike-5",
      "x": -448.80704397636646,
      "y": 1107.598550123512,
      "z": -176,
      "radius": 3.771133547881618,
      "length": 28.533487996189372,
      "seed": 182159283
    },
    {
      "id": "submerged-13-underside-spike-6",
      "x": -450.98473564724617,
      "y": 1094.8252118961464,
      "z": -176,
      "radius": 3.3412888401653618,
      "length": 23.79361773281748,
      "seed": 264479969
    },
    {
      "id": "submerged-13-underside-spike-7",
      "x": -493.294268702729,
      "y": 1098.7838583816663,
      "z": -176,
      "radius": 3.757438345812261,
      "length": 28.396017524067677,
      "seed": 911982414
    },
    {
      "id": "submerged-14-underside-spike-0",
      "x": -571.5446019036883,
      "y": 2105.6231487721225,
      "z": -174,
      "radius": 3.4658162128180265,
      "length": 33.924968420144985,
      "seed": 3823821098
    },
    {
      "id": "submerged-14-underside-spike-1",
      "x": -537.2804859180713,
      "y": 2093.294043901847,
      "z": -174,
      "radius": 3.6056176419369876,
      "length": 34.6066797004878,
      "seed": 1678279136
    },
    {
      "id": "submerged-14-underside-spike-2",
      "x": -527.4472249241321,
      "y": 2104.6011448642403,
      "z": -174,
      "radius": 3.265075867064297,
      "length": 29.365424594702784,
      "seed": 2634637670
    },
    {
      "id": "submerged-14-underside-spike-3",
      "x": -547.0643058436443,
      "y": 2092.6510702694495,
      "z": -174,
      "radius": 3.3034226198215038,
      "length": 30.867651595566368,
      "seed": 3318967247
    },
    {
      "id": "submerged-14-underside-spike-4",
      "x": -555.6673812566711,
      "y": 2121.756284172364,
      "z": -174,
      "radius": 3.36717431480065,
      "length": 24.099148706825837,
      "seed": 3345922188
    },
    {
      "id": "submerged-14-underside-spike-5",
      "x": -534.5591451137016,
      "y": 2118.6993556130983,
      "z": -174,
      "radius": 3.685091882944107,
      "length": 33.61250828924642,
      "seed": 64412594
    },
    {
      "id": "submerged-14-underside-spike-6",
      "x": -568.2590903791464,
      "y": 2095.6238412043517,
      "z": -174,
      "radius": 3.8581287974957377,
      "length": 26.27419954044675,
      "seed": 3311360395
    },
    {
      "id": "submerged-14-underside-spike-7",
      "x": -557.6276711376413,
      "y": 2090.993930870058,
      "z": -174,
      "radius": 3.841623975429684,
      "length": 29.78939677854137,
      "seed": 462293628
    },
    {
      "id": "submerged-15-underside-spike-0",
      "x": -1802.1667966342936,
      "y": 68.99795794428006,
      "z": -176,
      "radius": 3.705342018224994,
      "length": 33.69854492340584,
      "seed": 2957843006
    },
    {
      "id": "submerged-15-underside-spike-1",
      "x": -1807.408387101632,
      "y": 39.62113245933014,
      "z": -176,
      "radius": 4.336833272035218,
      "length": 35.90063398757912,
      "seed": 1475692884
    },
    {
      "id": "submerged-15-underside-spike-2",
      "x": -1794.7214094985031,
      "y": 38.89509696936348,
      "z": -176,
      "radius": 3.8480187986654855,
      "length": 29.98728434293457,
      "seed": 2021706810
    },
    {
      "id": "submerged-15-underside-spike-3",
      "x": -1829.0649920376206,
      "y": 86.44712652516986,
      "z": -176,
      "radius": 3.894900513037536,
      "length": 34.17626317061644,
      "seed": 2151642890
    },
    {
      "id": "submerged-15-underside-spike-4",
      "x": -1797.0179243796165,
      "y": 56.97450136918441,
      "z": -176,
      "radius": 3.3755792858823424,
      "length": 26.894448553253483,
      "seed": 2422575296
    },
    {
      "id": "submerged-15-underside-spike-5",
      "x": -1844.0126387490118,
      "y": 64.11842752395782,
      "z": -176,
      "radius": 3.5271829728337334,
      "length": 24.847334781466273,
      "seed": 3333415238
    },
    {
      "id": "submerged-15-underside-spike-6",
      "x": -1835.9317908659536,
      "y": 39.13676321438673,
      "z": -176,
      "radius": 4.66083461313357,
      "length": 37.59126181721316,
      "seed": 2516381212
    },
    {
      "id": "submerged-15-underside-spike-7",
      "x": -1821.2986607480348,
      "y": 28.814506541613188,
      "z": -176,
      "radius": 3.969494154582939,
      "length": 30.733241036536366,
      "seed": 2987895677
    },
    {
      "id": "submerged-17-underside-spike-0",
      "x": 725.4480897158553,
      "y": 1066.664349269568,
      "z": -200,
      "radius": 4.022170291687672,
      "length": 30.515109348045335,
      "seed": 2566725751
    },
    {
      "id": "submerged-17-underside-spike-1",
      "x": 725.2981329936958,
      "y": 1021.1318463318808,
      "z": -200,
      "radius": 3.446628200965214,
      "length": 27.603685174775634,
      "seed": 2040427141
    },
    {
      "id": "submerged-17-underside-spike-2",
      "x": 704.3351621866311,
      "y": 1048.869970530022,
      "z": -200,
      "radius": 3.5756380679563113,
      "length": 27.457340362230553,
      "seed": 1913809571
    },
    {
      "id": "submerged-17-underside-spike-3",
      "x": 702.5425714156354,
      "y": 1057.9824744282976,
      "z": -200,
      "radius": 3.0520001588768264,
      "length": 24.483760130644967,
      "seed": 1685849169
    },
    {
      "id": "submerged-17-underside-spike-4",
      "x": 748.4371288682607,
      "y": 1037.2368865459991,
      "z": -200,
      "radius": 3.6534515815152075,
      "length": 26.89774214259206,
      "seed": 2369650447
    },
    {
      "id": "submerged-17-underside-spike-5",
      "x": 743.1804561272188,
      "y": 1028.3409727465316,
      "z": -200,
      "radius": 4.20206136215268,
      "length": 26.982811808640257,
      "seed": 171425373
    },
    {
      "id": "submerged-17-underside-spike-6",
      "x": 707.2868526327084,
      "y": 1028.8680990606626,
      "z": -200,
      "radius": 3.0074289594365116,
      "length": 22.18152359164916,
      "seed": 1305699826
    },
    {
      "id": "submerged-17-underside-spike-7",
      "x": 737.7483924777329,
      "y": 1068.6338611539265,
      "z": -200,
      "radius": 3.3395021634975786,
      "length": 25.22447706557408,
      "seed": 2898511464
    },
    {
      "id": "outer-ice-00-underside-spike-0",
      "x": -4752.130588465997,
      "y": -5008.237293008189,
      "z": -80,
      "radius": 4.6089175352826715,
      "length": 36.14088986637071,
      "seed": 1345344150
    },
    {
      "id": "outer-ice-00-underside-spike-1",
      "x": -4739.448382562885,
      "y": -4995.83064078799,
      "z": -80,
      "radius": 7.502241884591058,
      "length": 46.874981096930064,
      "seed": 2161232575
    },
    {
      "id": "outer-ice-00-underside-spike-2",
      "x": -4948.673052820726,
      "y": -4914.600157135504,
      "z": -80,
      "radius": 11.169657264603302,
      "length": 81.8238910253367,
      "seed": 1075826829
    },
    {
      "id": "outer-ice-00-underside-spike-3",
      "x": -4742.3705179339295,
      "y": -4971.567209357907,
      "z": -80,
      "radius": 6.839806504780427,
      "length": 39.695452672504075,
      "seed": 3299552875
    },
    {
      "id": "outer-ice-00-underside-spike-4",
      "x": -4893.658889712316,
      "y": -4841.365714704828,
      "z": -80,
      "radius": 6.877545818453655,
      "length": 43.538089754167984,
      "seed": 3373977561
    },
    {
      "id": "outer-ice-00-underside-spike-5",
      "x": -4769.7667627055125,
      "y": -5047.281339558317,
      "z": -80,
      "radius": 13.842599745141342,
      "length": 76.00624714287018,
      "seed": 1233773655
    },
    {
      "id": "outer-ice-00-underside-spike-6",
      "x": -4947.670800232542,
      "y": -5035.669682683298,
      "z": -80,
      "radius": 15.433834145544097,
      "length": 79.34585278272377,
      "seed": 4253073253
    },
    {
      "id": "outer-ice-00-underside-spike-7",
      "x": -4936.629000436804,
      "y": -4989.8344105746455,
      "z": -80,
      "radius": 10.526439963141456,
      "length": 62.309230502714136,
      "seed": 1737406595
    },
    {
      "id": "outer-ice-00-underside-spike-8",
      "x": -4837.357795067107,
      "y": -5102.289032829979,
      "z": -80,
      "radius": 18.68667130707763,
      "length": 139.39058670178855,
      "seed": 1077742385
    },
    {
      "id": "outer-ice-00-underside-spike-9",
      "x": -4796.105023102426,
      "y": -4828.079215061649,
      "z": -80,
      "radius": 14.57071150932461,
      "length": 69.79532210928134,
      "seed": 773935574
    },
    {
      "id": "outer-ice-00-underside-spike-10",
      "x": -4940.764765359496,
      "y": -4864.478510321765,
      "z": -80,
      "radius": 4.11821353668347,
      "length": 28.217259336452894,
      "seed": 3119769132
    },
    {
      "id": "outer-ice-00-underside-spike-11",
      "x": -4810.249137306511,
      "y": -5038.297737053024,
      "z": -80,
      "radius": 15.220045615686104,
      "length": 90.8675191224083,
      "seed": 3871790797
    },
    {
      "id": "outer-ice-00-underside-spike-12",
      "x": -4947.136539408835,
      "y": -4950.417214285076,
      "z": -80,
      "radius": 12.11865981691517,
      "length": 84.6614369375337,
      "seed": 2679714475
    },
    {
      "id": "outer-ice-00-underside-spike-13",
      "x": -4777.25259133907,
      "y": -4869.006568742376,
      "z": -80,
      "radius": 9.494893953204155,
      "length": 56.97841073672608,
      "seed": 1286384114
    },
    {
      "id": "outer-ice-00-underside-spike-14",
      "x": -4752.653979664974,
      "y": -4906.096547211953,
      "z": -80,
      "radius": 15.451418378856033,
      "length": 113.22516610985866,
      "seed": 3895323240
    },
    {
      "id": "outer-ice-00-underside-spike-15",
      "x": -4886.421683052514,
      "y": -5075.633490402333,
      "z": -80,
      "radius": 3.972991100512445,
      "length": 37.12716444539079,
      "seed": 4226726830
    },
    {
      "id": "outer-ice-00-underside-spike-16",
      "x": -4838.9548945266,
      "y": -5067.789203492632,
      "z": -80,
      "radius": 13.345272951293737,
      "length": 78.62392380779278,
      "seed": 2656719684
    },
    {
      "id": "outer-ice-00-underside-spike-17",
      "x": -4969.157636798681,
      "y": -4956.8017146521815,
      "z": -80,
      "radius": 3.025777670321986,
      "length": 24.019948796205167,
      "seed": 3829736645
    },
    {
      "id": "outer-ice-00-underside-spike-18",
      "x": -4882.77606634237,
      "y": -4805.2740762833055,
      "z": -80,
      "radius": 11.075696136103943,
      "length": 79.9542999774445,
      "seed": 3068953815
    },
    {
      "id": "outer-ice-00-underside-spike-19",
      "x": -4787.949312374361,
      "y": -4852.054798983822,
      "z": -80,
      "radius": 3.7588912050705403,
      "length": 33.258432688154535,
      "seed": 2936257509
    },
    {
      "id": "outer-ice-01-underside-spike-0",
      "x": -4852.949135436533,
      "y": -3946.4536954508585,
      "z": -97,
      "radius": 10.968144075013697,
      "length": 53.929903006932,
      "seed": 868144598
    },
    {
      "id": "outer-ice-01-underside-spike-1",
      "x": -4742.562328101542,
      "y": -3721.8235794724123,
      "z": -97,
      "radius": 16.09306729072705,
      "length": 113.69213760891982,
      "seed": 3216001580
    },
    {
      "id": "outer-ice-01-underside-spike-2",
      "x": -4677.132344254767,
      "y": -3912.1106893713813,
      "z": -97,
      "radius": 18.642054326832294,
      "length": 105.92387287251697,
      "seed": 2383370322
    },
    {
      "id": "outer-ice-01-underside-spike-3",
      "x": -4735.8250223191535,
      "y": -3756.643499911877,
      "z": -97,
      "radius": 17.32479389780201,
      "length": 87.17450031314172,
      "seed": 1689732779
    },
    {
      "id": "outer-ice-01-underside-spike-4",
      "x": -4781.057770370469,
      "y": -3985.7197865922067,
      "z": -97,
      "radius": 11.591218471294269,
      "length": 64.42231160082108,
      "seed": 4089894425
    },
    {
      "id": "outer-ice-01-underside-spike-5",
      "x": -4795.021593744016,
      "y": -3698.8473435138035,
      "z": -97,
      "radius": 7.0243613824713975,
      "length": 48.191841748088535,
      "seed": 1848961175
    },
    {
      "id": "outer-ice-01-underside-spike-6",
      "x": -4709.985501160802,
      "y": -3749.849083746622,
      "z": -97,
      "radius": 4.274252737639472,
      "length": 32.792785773462995,
      "seed": 4252848549
    },
    {
      "id": "outer-ice-01-underside-spike-7",
      "x": -4897.542416855932,
      "y": -3876.722904621762,
      "z": -97,
      "radius": 15.193187667289749,
      "length": 102.18256863765909,
      "seed": 3357993155
    },
    {
      "id": "outer-ice-01-underside-spike-8",
      "x": -4792.6215961613225,
      "y": -3959.521075457981,
      "z": -97,
      "radius": 9.154964122455567,
      "length": 65.47222049146245,
      "seed": 810040080
    },
    {
      "id": "outer-ice-01-underside-spike-9",
      "x": -4815.61927351286,
      "y": -3986.526795798508,
      "z": -97,
      "radius": 19.87376751587726,
      "length": 113.65053956592716,
      "seed": 3065728739
    },
    {
      "id": "outer-ice-01-underside-spike-10",
      "x": -4852.089921191152,
      "y": -3759.0092140334,
      "z": -97,
      "radius": 10.672733498504385,
      "length": 65.38474460969681,
      "seed": 1336899217
    },
    {
      "id": "outer-ice-01-underside-spike-11",
      "x": -4810.348994611472,
      "y": -3669.592086883499,
      "z": -97,
      "radius": 7.5740732934791595,
      "length": 52.80953185140358,
      "seed": 1597902671
    },
    {
      "id": "outer-ice-01-underside-spike-12",
      "x": -4752.4400224854435,
      "y": -3963.6869130787777,
      "z": -97,
      "radius": 13.64349026302807,
      "length": 97.42240301320608,
      "seed": 1180826781
    },
    {
      "id": "outer-ice-01-underside-spike-13",
      "x": -4634.28740411912,
      "y": -3836.9808867539627,
      "z": -97,
      "radius": 17.783710789168254,
      "length": 91.22290152640107,
      "seed": 3960776187
    },
    {
      "id": "outer-ice-01-underside-spike-14",
      "x": -4693.22491069358,
      "y": -3738.940745065613,
      "z": -97,
      "radius": 7.985611516749486,
      "length": 56.067216713885216,
      "seed": 3173308137
    },
    {
      "id": "outer-ice-01-underside-spike-15",
      "x": -4755.494269938873,
      "y": -3995.1626669587395,
      "z": -97,
      "radius": 9.535459143575281,
      "length": 53.432527492240254,
      "seed": 3117088248
    },
    {
      "id": "outer-ice-01-underside-spike-16",
      "x": -4695.449833492628,
      "y": -3966.6706350135214,
      "z": -97,
      "radius": 17.100421871058643,
      "length": 86.63427143955059,
      "seed": 1369210558
    },
    {
      "id": "outer-ice-01-underside-spike-17",
      "x": -4883.921735217969,
      "y": -3833.8293383494038,
      "z": -97,
      "radius": 4.628124459646642,
      "length": 30.86414223485215,
      "seed": 2572802702
    },
    {
      "id": "outer-ice-01-underside-spike-18",
      "x": -4881.419232427113,
      "y": -3966.9125611046197,
      "z": -97,
      "radius": 18.286471948493272,
      "length": 91.96605979435157,
      "seed": 3335152420
    },
    {
      "id": "outer-ice-01-underside-spike-19",
      "x": -4699.514253431267,
      "y": -3774.2035240895752,
      "z": -97,
      "radius": 3.204656606540084,
      "length": 30.76494384794927,
      "seed": 1912968074
    },
    {
      "id": "outer-ice-02-underside-spike-0",
      "x": -4989.332499616278,
      "y": -2750.487513452089,
      "z": -114,
      "radius": 19.654722549952567,
      "length": 88.84647570410229,
      "seed": 3632407094
    },
    {
      "id": "outer-ice-02-underside-spike-1",
      "x": -4739.229341966987,
      "y": -2750.840423588555,
      "z": -114,
      "radius": 16.485508585814387,
      "length": 76.50048064662872,
      "seed": 2093497228
    },
    {
      "id": "outer-ice-02-underside-spike-2",
      "x": -4895.288259990299,
      "y": -2917.1132713028624,
      "z": -114,
      "radius": 4.54663810133934,
      "length": 36.04858890351343,
      "seed": 913606322
    },
    {
      "id": "outer-ice-02-underside-spike-3",
      "x": -4831.722262288617,
      "y": -2641.884742788287,
      "z": -114,
      "radius": 12.871246123220772,
      "length": 95.47963298476662,
      "seed": 3522162984
    },
    {
      "id": "outer-ice-02-underside-spike-4",
      "x": -4977.152623199414,
      "y": -2815.959880467593,
      "z": -114,
      "radius": 11.12750533875078,
      "length": 73.8269903500395,
      "seed": 1753029742
    },
    {
      "id": "outer-ice-02-underside-spike-5",
      "x": -4885.476572842261,
      "y": -2909.930633480548,
      "z": -114,
      "radius": 3.8289589663036168,
      "length": 28.651450631036617,
      "seed": 175750660
    },
    {
      "id": "outer-ice-02-underside-spike-6",
      "x": -4973.262750766986,
      "y": -2651.360417031286,
      "z": -114,
      "radius": 9.9248127322644,
      "length": 51.321656454903575,
      "seed": 6094698
    },
    {
      "id": "outer-ice-02-underside-spike-7",
      "x": -4801.202849422744,
      "y": -2902.9612003778093,
      "z": -114,
      "radius": 7.065474040340632,
      "length": 58.448562538328375,
      "seed": 2353716768
    },
    {
      "id": "outer-ice-02-underside-spike-8",
      "x": -4922.543729680587,
      "y": -2901.6589158641646,
      "z": -114,
      "radius": 5.775762734701857,
      "length": 35.62991500857537,
      "seed": 1627902033
    },
    {
      "id": "outer-ice-02-underside-spike-9",
      "x": -4871.418128429247,
      "y": -2901.2081261961207,
      "z": -114,
      "radius": 10.017496519722044,
      "length": 50.79061980741533,
      "seed": 697876854
    },
    {
      "id": "outer-ice-02-underside-spike-10",
      "x": -4938.487073884358,
      "y": -2885.2707564906614,
      "z": -114,
      "radius": 14.145453552249819,
      "length": 94.25834474597514,
      "seed": 1055248588
    },
    {
      "id": "outer-ice-02-underside-spike-11",
      "x": -4768.991673380162,
      "y": -2816.01332487827,
      "z": -114,
      "radius": 11.962941572070122,
      "length": 88.11112391473783,
      "seed": 1490412018
    },
    {
      "id": "outer-ice-02-underside-spike-12",
      "x": -4968.367945263948,
      "y": -2849.870352326499,
      "z": -114,
      "radius": 7.8065852909348905,
      "length": 54.16857896604454,
      "seed": 3936838248
    },
    {
      "id": "outer-ice-02-underside-spike-13",
      "x": -4806.610244147824,
      "y": -2624.1233354973288,
      "z": -114,
      "radius": 4.266152031486854,
      "length": 30.620596058370214,
      "seed": 1295342393
    },
    {
      "id": "outer-ice-02-underside-spike-14",
      "x": -5013.0239419845575,
      "y": -2679.713361754192,
      "z": -114,
      "radius": 18.242393921827897,
      "length": 101.4991889740003,
      "seed": 2869019081
    },
    {
      "id": "outer-ice-02-underside-spike-15",
      "x": -4779.892017746919,
      "y": -2695.6451043184156,
      "z": -114,
      "radius": 16.137401930289343,
      "length": 111.46012825261495,
      "seed": 1562581703
    },
    {
      "id": "outer-ice-02-underside-spike-16",
      "x": -4797.235858476487,
      "y": -2611.4992668368627,
      "z": -114,
      "radius": 3.3756512706167996,
      "length": 28.23509678009018,
      "seed": 356911588
    },
    {
      "id": "outer-ice-02-underside-spike-17",
      "x": -4899.61156954412,
      "y": -2896.749522631324,
      "z": -114,
      "radius": 13.315189292654395,
      "length": 94.91294630654576,
      "seed": 2398655562
    },
    {
      "id": "outer-ice-02-underside-spike-18",
      "x": -4867.98564198699,
      "y": -2640.6100078614863,
      "z": -114,
      "radius": 15.724897949257866,
      "length": 80.5922414375622,
      "seed": 3532769539
    },
    {
      "id": "outer-ice-02-underside-spike-19",
      "x": -4844.188127152486,
      "y": -2616.2198793907946,
      "z": -114,
      "radius": 13.183213313808665,
      "length": 86.35637177162114,
      "seed": 3624990641
    },
    {
      "id": "outer-ice-03-underside-spike-0",
      "x": -4793.059068916795,
      "y": -1535.8228595243143,
      "z": -131,
      "radius": 10.734065995551646,
      "length": 74.17910903282984,
      "seed": 2292305750
    },
    {
      "id": "outer-ice-03-underside-spike-1",
      "x": -4928.697949957316,
      "y": -1657.68096887472,
      "z": -131,
      "radius": 4.484896393958479,
      "length": 31.250475343995873,
      "seed": 2497550252
    },
    {
      "id": "outer-ice-03-underside-spike-2",
      "x": -4947.818320912097,
      "y": -1668.982987545637,
      "z": -131,
      "radius": 14.464529611170292,
      "length": 86.14516913557279,
      "seed": 586897874
    },
    {
      "id": "outer-ice-03-underside-spike-3",
      "x": -4900.919278740221,
      "y": -1688.041730323827,
      "z": -131,
      "radius": 5.1015741541050375,
      "length": 32.865871051915406,
      "seed": 3786130248
    },
    {
      "id": "outer-ice-03-underside-spike-4",
      "x": -4741.001203227664,
      "y": -1777.0017094990906,
      "z": -131,
      "radius": 8.27953092660755,
      "length": 47.83565476103094,
      "seed": 1099642254
    },
    {
      "id": "outer-ice-03-underside-spike-5",
      "x": -4930.635507371402,
      "y": -1607.969017223458,
      "z": -131,
      "radius": 10.832713107811287,
      "length": 70.15138298757961,
      "seed": 1893654551
    },
    {
      "id": "outer-ice-03-underside-spike-6",
      "x": -4881.598410157711,
      "y": -1529.8715962298193,
      "z": -131,
      "radius": 10.390290553448722,
      "length": 66.95706955822939,
      "seed": 3917753637
    },
    {
      "id": "outer-ice-03-underside-spike-7",
      "x": -4813.735299125366,
      "y": -1756.4497769764318,
      "z": -131,
      "radius": 17.281567258993164,
      "length": 114.97514545127073,
      "seed": 2465630275
    },
    {
      "id": "outer-ice-03-underside-spike-8",
      "x": -4699.23987201212,
      "y": -1750.7325581207488,
      "z": -131,
      "radius": 5.140553986420855,
      "length": 42.93347562952344,
      "seed": 1961078001
    },
    {
      "id": "outer-ice-03-underside-spike-9",
      "x": -4929.672919568541,
      "y": -1580.473140188255,
      "z": -131,
      "radius": 12.024180055828765,
      "length": 90.60568367085513,
      "seed": 745740975
    },
    {
      "id": "outer-ice-03-underside-spike-10",
      "x": -4906.268407076345,
      "y": -1714.5246369782549,
      "z": -131,
      "radius": 11.032652766210958,
      "length": 62.61699149805438,
      "seed": 2838689021
    },
    {
      "id": "outer-ice-03-underside-spike-11",
      "x": -4844.928771844861,
      "y": -1748.489278086656,
      "z": -131,
      "radius": 5.953879926586524,
      "length": 36.965427206499925,
      "seed": 3875922779
    },
    {
      "id": "outer-ice-03-underside-spike-12",
      "x": -4722.525998580992,
      "y": -1546.160359939006,
      "z": -131,
      "radius": 11.398630302166566,
      "length": 65.88722155004726,
      "seed": 2009723209
    },
    {
      "id": "outer-ice-03-underside-spike-13",
      "x": -4701.713014615606,
      "y": -1706.5365437186929,
      "z": -131,
      "radius": 8.948770842747763,
      "length": 62.85067246356688,
      "seed": 3551555143
    },
    {
      "id": "outer-ice-03-underside-spike-14",
      "x": -4835.9782114596655,
      "y": -1803.0184596293675,
      "z": -131,
      "radius": 9.638771123019978,
      "length": 71.54644587761769,
      "seed": 427740629
    },
    {
      "id": "outer-ice-03-underside-spike-15",
      "x": -4765.57861043971,
      "y": -1792.632464164226,
      "z": -131,
      "radius": 8.193204486975446,
      "length": 59.706492029798135,
      "seed": 942704499
    },
    {
      "id": "outer-ice-03-underside-spike-16",
      "x": -4860.582657075199,
      "y": -1533.6907531215772,
      "z": -131,
      "radius": 8.91270195110701,
      "length": 46.00991933710782,
      "seed": 4189189793
    },
    {
      "id": "outer-ice-03-underside-spike-17",
      "x": -4802.043058942628,
      "y": -1803.8763643749771,
      "z": -131,
      "radius": 19.265105959959328,
      "length": 109.19656379752567,
      "seed": 2867707910
    },
    {
      "id": "outer-ice-03-underside-spike-18",
      "x": -4684.667884795608,
      "y": -1658.8911163723049,
      "z": -131,
      "radius": 19.78379119792953,
      "length": 120.75509502715477,
      "seed": 2398775004
    },
    {
      "id": "outer-ice-03-underside-spike-19",
      "x": -4872.346196389183,
      "y": -1567.343804823964,
      "z": -131,
      "radius": 14.925310061080381,
      "length": 111.16526702218103,
      "seed": 3098503997
    },
    {
      "id": "outer-ice-04-underside-spike-0",
      "x": -4768.90054885796,
      "y": -494.05617462643323,
      "z": -148,
      "radius": 19.167597017250955,
      "length": 73.57076263427734,
      "seed": 3866726702
    },
    {
      "id": "outer-ice-04-underside-spike-1",
      "x": -4837.336476772673,
      "y": -406.52821199895027,
      "z": -148,
      "radius": 5.428773187566549,
      "length": 36.22083693815395,
      "seed": 3266157764
    },
    {
      "id": "outer-ice-04-underside-spike-2",
      "x": -4822.037064893062,
      "y": -405.30485452432805,
      "z": -148,
      "radius": 6.012806000886485,
      "length": 48.823395008823574,
      "seed": 3719748677
    },
    {
      "id": "outer-ice-04-underside-spike-3",
      "x": -4978.203447870698,
      "y": -654.1642294465747,
      "z": -148,
      "radius": 16.40870558307506,
      "length": 88.44870185852051,
      "seed": 1052530275
    },
    {
      "id": "outer-ice-04-underside-spike-4",
      "x": -4981.319501654385,
      "y": -579.3507990398017,
      "z": -148,
      "radius": 10.795623464277014,
      "length": 83.96913133723302,
      "seed": 759226897
    },
    {
      "id": "outer-ice-04-underside-spike-5",
      "x": -4784.863870904797,
      "y": -456.92152661903845,
      "z": -148,
      "radius": 8.030198284657672,
      "length": 47.52406606883009,
      "seed": 399490767
    },
    {
      "id": "outer-ice-04-underside-spike-6",
      "x": -4948.974195910998,
      "y": -667.0522613752303,
      "z": -148,
      "radius": 4.305345930857584,
      "length": 38.57892396701265,
      "seed": 1754058781
    },
    {
      "id": "outer-ice-04-underside-spike-7",
      "x": -5007.849318398761,
      "y": -573.979076331278,
      "z": -148,
      "radius": 8.659672301495448,
      "length": 46.24450152232505,
      "seed": 2937224571
    },
    {
      "id": "outer-ice-04-underside-spike-8",
      "x": -4794.004802922598,
      "y": -443.3943918179265,
      "z": -148,
      "radius": 3.2623257874511182,
      "length": 26.989720207422415,
      "seed": 2619137320
    },
    {
      "id": "outer-ice-04-underside-spike-9",
      "x": -4793.721052558885,
      "y": -562.8388828265735,
      "z": -148,
      "radius": 4.247628963552415,
      "length": 34.94635935062799,
      "seed": 762030190
    },
    {
      "id": "outer-ice-04-underside-spike-10",
      "x": -4982.48680095145,
      "y": -514.7604273159785,
      "z": -148,
      "radius": 15.098269279114902,
      "length": 81.54941654205322,
      "seed": 3489280062
    },
    {
      "id": "outer-ice-04-underside-spike-11",
      "x": -4771.865503810717,
      "y": -579.1945573971857,
      "z": -148,
      "radius": 6.487520065624267,
      "length": 47.79978994012395,
      "seed": 1233530708
    },
    {
      "id": "outer-ice-04-underside-spike-12",
      "x": -4820.229278388999,
      "y": -687.6865653963616,
      "z": -148,
      "radius": 15.178005831316113,
      "length": 79.20151141393036,
      "seed": 3771925050
    },
    {
      "id": "outer-ice-04-underside-spike-13",
      "x": -4883.873909197644,
      "y": -400.80477850490496,
      "z": -148,
      "radius": 15.861075734719634,
      "length": 73.68603801727295,
      "seed": 2448895242
    },
    {
      "id": "outer-ice-04-underside-spike-14",
      "x": -4868.780432388341,
      "y": -436.39605329705614,
      "z": -148,
      "radius": 3.3548217858187854,
      "length": 33.333493319982566,
      "seed": 1810110144
    },
    {
      "id": "outer-ice-04-underside-spike-15",
      "x": -4943.2335489175875,
      "y": -638.4705750495492,
      "z": -148,
      "radius": 18.46237618266605,
      "length": 86.96535682678223,
      "seed": 1974643057
    },
    {
      "id": "outer-ice-04-underside-spike-16",
      "x": -5004.178590316763,
      "y": -616.0961391710118,
      "z": -148,
      "radius": 13.324424178572372,
      "length": 63.695063292782834,
      "seed": 4112290607
    },
    {
      "id": "outer-ice-04-underside-spike-17",
      "x": -4887.461567133952,
      "y": -688.2918458475184,
      "z": -148,
      "radius": 7.950993137899786,
      "length": 65.46895987156972,
      "seed": 2759966572
    },
    {
      "id": "outer-ice-04-underside-spike-18",
      "x": -4898.63347274729,
      "y": -657.6563928897998,
      "z": -148,
      "radius": 3.256130045745522,
      "length": 30.42410450168478,
      "seed": 3561881276
    },
    {
      "id": "outer-ice-04-underside-spike-19",
      "x": -4845.274573932666,
      "y": -681.6498140797025,
      "z": -148,
      "radius": 5.333914096001536,
      "length": 36.39390359715165,
      "seed": 2680640012
    },
    {
      "id": "outer-ice-05-underside-spike-0",
      "x": -4687.781613686085,
      "y": 490.0388809581699,
      "z": -80,
      "radius": 7.7172724371775985,
      "length": 55.73616348924045,
      "seed": 2650637934
    },
    {
      "id": "outer-ice-05-underside-spike-1",
      "x": -4737.3756321574565,
      "y": 657.6947803595846,
      "z": -80,
      "radius": 8.569233991671354,
      "length": 68.80985992548732,
      "seed": 2513065988
    },
    {
      "id": "outer-ice-05-underside-spike-2",
      "x": -4762.995251127384,
      "y": 416.01811419741483,
      "z": -80,
      "radius": 17.20387846045196,
      "length": 126.80686422945342,
      "seed": 2382383466
    },
    {
      "id": "outer-ice-05-underside-spike-3",
      "x": -4955.364315302516,
      "y": 562.8439628649217,
      "z": -80,
      "radius": 16.313300258945674,
      "length": 101.52724050667196,
      "seed": 3079624736
    },
    {
      "id": "outer-ice-05-underside-spike-4",
      "x": -4677.827307142856,
      "y": 567.9366593656907,
      "z": -80,
      "radius": 15.936537896282971,
      "length": 98.3680068764572,
      "seed": 1190442406
    },
    {
      "id": "outer-ice-05-underside-spike-5",
      "x": -4671.180279903716,
      "y": 607.3597167441935,
      "z": -80,
      "radius": 14.138212257064879,
      "length": 93.42463331238199,
      "seed": 3018550134
    },
    {
      "id": "outer-ice-05-underside-spike-6",
      "x": -4908.475227403953,
      "y": 555.6599460731309,
      "z": -80,
      "radius": 19.074117402080446,
      "length": 90.61121502502247,
      "seed": 2829494988
    },
    {
      "id": "outer-ice-05-underside-spike-7",
      "x": -4902.387405871198,
      "y": 467.6582105251503,
      "z": -80,
      "radius": 11.228705450892448,
      "length": 68.69403316066,
      "seed": 2216127474
    },
    {
      "id": "outer-ice-05-underside-spike-8",
      "x": -4949.0177247533575,
      "y": 522.5481016260501,
      "z": -80,
      "radius": 5.525210001971573,
      "length": 43.98818691025811,
      "seed": 3351780456
    },
    {
      "id": "outer-ice-05-underside-spike-9",
      "x": -4865.406290982527,
      "y": 470.3489319955797,
      "z": -80,
      "radius": 11.108633271418512,
      "length": 79.5451348497884,
      "seed": 2838551982
    },
    {
      "id": "outer-ice-05-underside-spike-10",
      "x": -4815.4936006464195,
      "y": 427.4732321165126,
      "z": -80,
      "radius": 11.295825057197362,
      "length": 65.58174569572571,
      "seed": 1515775300
    },
    {
      "id": "outer-ice-05-underside-spike-11",
      "x": -4875.870879273519,
      "y": 660.6241573142389,
      "z": -80,
      "radius": 16.768802059814334,
      "length": 86.72743326835531,
      "seed": 2117393578
    },
    {
      "id": "outer-ice-05-underside-spike-12",
      "x": -4920.56389497669,
      "y": 520.3015702160225,
      "z": -80,
      "radius": 3.565170308807865,
      "length": 33.77429035728011,
      "seed": 3338118371
    },
    {
      "id": "outer-ice-05-underside-spike-13",
      "x": -4736.509777052134,
      "y": 451.43650803493625,
      "z": -80,
      "radius": 15.571935249259695,
      "length": 76.50296182573553,
      "seed": 1027972241
    },
    {
      "id": "outer-ice-05-underside-spike-14",
      "x": -4653.284502383109,
      "y": 586.4928731925111,
      "z": -80,
      "radius": 7.00451482180506,
      "length": 43.02042082227499,
      "seed": 1398229686
    },
    {
      "id": "outer-ice-05-underside-spike-15",
      "x": -4824.876456086966,
      "y": 669.8977363288508,
      "z": -80,
      "radius": 8.966930563095957,
      "length": 65.02851187694344,
      "seed": 2262794252
    },
    {
      "id": "outer-ice-05-underside-spike-16",
      "x": -4915.70533956101,
      "y": 630.5990224314896,
      "z": -80,
      "radius": 14.540078043937683,
      "length": 94.89500205717611,
      "seed": 3534358322
    },
    {
      "id": "outer-ice-05-underside-spike-17",
      "x": -4720.846254337504,
      "y": 636.400893394951,
      "z": -80,
      "radius": 12.72216492285952,
      "length": 93.62513603604033,
      "seed": 680971688
    },
    {
      "id": "outer-ice-05-underside-spike-18",
      "x": -4749.559206424655,
      "y": 694.4594050896933,
      "z": -80,
      "radius": 17.368238276802003,
      "length": 127.99424093940537,
      "seed": 3941037294
    },
    {
      "id": "outer-ice-05-underside-spike-19",
      "x": -4928.588585130691,
      "y": 509.4118813899517,
      "z": -80,
      "radius": 6.524540909100324,
      "length": 44.698900686318964,
      "seed": 4030771844
    },
    {
      "id": "outer-ice-06-underside-spike-0",
      "x": -4894.954853372572,
      "y": 1771.5024698658174,
      "z": -97,
      "radius": 19.894878814928234,
      "length": 118.27228616603803,
      "seed": 1687158910
    },
    {
      "id": "outer-ice-06-underside-spike-1",
      "x": -4960.705647626691,
      "y": 1570.0064831087975,
      "z": -97,
      "radius": 6.88717780681327,
      "length": 45.63349802872486,
      "seed": 560475540
    },
    {
      "id": "outer-ice-06-underside-spike-2",
      "x": -4962.855962593574,
      "y": 1550.1209377154219,
      "z": -97,
      "radius": 8.781413109973073,
      "length": 47.71363840236772,
      "seed": 2645442170
    },
    {
      "id": "outer-ice-06-underside-spike-3",
      "x": -4982.052889165716,
      "y": 1569.472928966014,
      "z": -97,
      "radius": 3.4453364121727645,
      "length": 29.62096433194631,
      "seed": 1629950128
    },
    {
      "id": "outer-ice-06-underside-spike-4",
      "x": -4899.771072169062,
      "y": 1820.9815213808745,
      "z": -97,
      "radius": 3.355011292733252,
      "length": 28.85823765493641,
      "seed": 585479606
    },
    {
      "id": "outer-ice-06-underside-spike-5",
      "x": -4820.699055563389,
      "y": 1769.2950147500903,
      "z": -97,
      "radius": 19.938385839108378,
      "length": 113.33478046255404,
      "seed": 2085147404
    },
    {
      "id": "outer-ice-06-underside-spike-6",
      "x": -4750.7215516879405,
      "y": 1639.8804097093189,
      "z": -97,
      "radius": 19.15868765115738,
      "length": 122.39060353546998,
      "seed": 299172402
    },
    {
      "id": "outer-ice-06-underside-spike-7",
      "x": -4759.27722513223,
      "y": 1697.77324049325,
      "z": -97,
      "radius": 16.097773069050163,
      "length": 102.03451846262959,
      "seed": 3133419688
    },
    {
      "id": "outer-ice-06-underside-spike-8",
      "x": -5019.012262973901,
      "y": 1620.0757493480178,
      "z": -97,
      "radius": 9.60132027324289,
      "length": 73.21222667570572,
      "seed": 2070020078
    },
    {
      "id": "outer-ice-06-underside-spike-9",
      "x": -4814.515215552745,
      "y": 1582.122733192929,
      "z": -97,
      "radius": 14.226535829948261,
      "length": 95.94208494329386,
      "seed": 3329992183
    },
    {
      "id": "outer-ice-06-underside-spike-10",
      "x": -4981.524288011087,
      "y": 1598.5959846868514,
      "z": -97,
      "radius": 16.448097633896396,
      "length": 124.344901825531,
      "seed": 703327237
    },
    {
      "id": "outer-ice-06-underside-spike-11",
      "x": -4953.880342399248,
      "y": 1522.486519874545,
      "z": -97,
      "radius": 15.121217118576169,
      "length": 107.67626747416212,
      "seed": 1733222842
    },
    {
      "id": "outer-ice-06-underside-spike-12",
      "x": -4835.262398500065,
      "y": 1537.4543100974777,
      "z": -97,
      "radius": 13.043948914390057,
      "length": 92.28402418444578,
      "seed": 2867431920
    },
    {
      "id": "outer-ice-06-underside-spike-13",
      "x": -4764.887512226914,
      "y": 1750.746089103185,
      "z": -97,
      "radius": 12.845105825690553,
      "length": 76.76658522596014,
      "seed": 1248998581
    },
    {
      "id": "outer-ice-06-underside-spike-14",
      "x": -4999.042575608907,
      "y": 1671.0962947480148,
      "z": -97,
      "radius": 5.773888366529718,
      "length": 43.841561353326014,
      "seed": 2624364371
    },
    {
      "id": "outer-ice-06-underside-spike-15",
      "x": -4786.281543667228,
      "y": 1589.832801799157,
      "z": -97,
      "radius": 11.599210360785946,
      "length": 82.26773953880347,
      "seed": 55572353
    },
    {
      "id": "outer-ice-06-underside-spike-16",
      "x": -4899.086718059929,
      "y": 1801.0463985776114,
      "z": -97,
      "radius": 6.7568596948403865,
      "length": 47.63575985165295,
      "seed": 3734346943
    },
    {
      "id": "outer-ice-06-underside-spike-17",
      "x": -4932.718917996265,
      "y": 1779.9881222879453,
      "z": -97,
      "radius": 12.259120617760345,
      "length": 84.47653691039358,
      "seed": 1605800589
    },
    {
      "id": "outer-ice-06-underside-spike-18",
      "x": -4854.6176136762715,
      "y": 1509.735442318984,
      "z": -97,
      "radius": 16.88277943758294,
      "length": 81.87048349767451,
      "seed": 2984974288
    },
    {
      "id": "outer-ice-06-underside-spike-19",
      "x": -4736.001655739428,
      "y": 1666.2322889391219,
      "z": -97,
      "radius": 5.45249177608639,
      "length": 42.28524209217639,
      "seed": 3148094422
    },
    {
      "id": "outer-ice-07-underside-spike-0",
      "x": -4645.5891590446545,
      "y": 2686.4327255732846,
      "z": -114,
      "radius": 3.8911517886444926,
      "length": 34.79635265044444,
      "seed": 1553286238
    },
    {
      "id": "outer-ice-07-underside-spike-1",
      "x": -4679.705349326584,
      "y": 2696.858768485807,
      "z": -114,
      "radius": 10.081570003647357,
      "length": 70.47188400079834,
      "seed": 2019490420
    },
    {
      "id": "outer-ice-07-underside-spike-2",
      "x": -4889.726451944006,
      "y": 2745.112189754617,
      "z": -114,
      "radius": 3.1057973746210337,
      "length": 24.280171297291105,
      "seed": 2717584474
    },
    {
      "id": "outer-ice-07-underside-spike-3",
      "x": -4918.576726040875,
      "y": 2732.0900100406157,
      "z": -114,
      "radius": 19.12699956027791,
      "length": 120.71699619293213,
      "seed": 244619152
    },
    {
      "id": "outer-ice-07-underside-spike-4",
      "x": -4714.941447081553,
      "y": 2607.4618969724074,
      "z": -114,
      "radius": 15.016965390183032,
      "length": 78.8905494299367,
      "seed": 3735219606
    },
    {
      "id": "outer-ice-07-underside-spike-5",
      "x": -4873.219032942008,
      "y": 2735.853998323712,
      "z": -114,
      "radius": 9.078829871956259,
      "length": 50.00950635941119,
      "seed": 4218876908
    },
    {
      "id": "outer-ice-07-underside-spike-6",
      "x": -4702.090903577843,
      "y": 2872.350464160211,
      "z": -114,
      "radius": 3.3982914611697197,
      "length": 26.05646282709362,
      "seed": 2720367634
    },
    {
      "id": "outer-ice-07-underside-spike-7",
      "x": -4760.711371645609,
      "y": 2894.9259595407616,
      "z": -114,
      "radius": 10.099080429878086,
      "length": 55.50354258140877,
      "seed": 145148808
    },
    {
      "id": "outer-ice-07-underside-spike-8",
      "x": -4666.883075850352,
      "y": 2712.460104568384,
      "z": -114,
      "radius": 3.9551929822191596,
      "length": 29.039752654183545,
      "seed": 3041045454
    },
    {
      "id": "outer-ice-07-underside-spike-9",
      "x": -4845.265161392695,
      "y": 2596.5329315644967,
      "z": -114,
      "radius": 19.01260107802227,
      "length": 125.72371482849121,
      "seed": 3785497188
    },
    {
      "id": "outer-ice-07-underside-spike-10",
      "x": -4813.58687678229,
      "y": 2615.800415966413,
      "z": -114,
      "radius": 15.409280737861991,
      "length": 74.44708307136207,
      "seed": 1780318410
    },
    {
      "id": "outer-ice-07-underside-spike-11",
      "x": -4866.783074961337,
      "y": 2690.438113866544,
      "z": -114,
      "radius": 10.403530994430184,
      "length": 79.9637326717894,
      "seed": 301698970
    },
    {
      "id": "outer-ice-07-underside-spike-12",
      "x": -4859.139321120191,
      "y": 2848.0613623323875,
      "z": -114,
      "radius": 5.312707323115319,
      "length": 45.47341312532998,
      "seed": 341831888
    },
    {
      "id": "outer-ice-07-underside-spike-13",
      "x": -4702.474455074105,
      "y": 2659.5998750666195,
      "z": -114,
      "radius": 3.2954999746289104,
      "length": 29.060643444341505,
      "seed": 3456016065
    },
    {
      "id": "outer-ice-07-underside-spike-14",
      "x": -4700.308849095237,
      "y": 2858.0767878831493,
      "z": -114,
      "radius": 4.708256934769452,
      "length": 31.647598249007874,
      "seed": 2495622822
    },
    {
      "id": "outer-ice-07-underside-spike-15",
      "x": -4700.749978403744,
      "y": 2628.0312477157586,
      "z": -114,
      "radius": 6.744050791952759,
      "length": 44.30456332600211,
      "seed": 3350501500
    },
    {
      "id": "outer-ice-07-underside-spike-16",
      "x": -4780.746822088612,
      "y": 2871.908782479766,
      "z": -114,
      "radius": 4.516885393066332,
      "length": 33.38581485022953,
      "seed": 715313501
    },
    {
      "id": "outer-ice-07-underside-spike-17",
      "x": -4663.428641387644,
      "y": 2773.084415460914,
      "z": -114,
      "radius": 19.52979281404987,
      "length": 122.15094089508057,
      "seed": 3793761052
    },
    {
      "id": "outer-ice-07-underside-spike-18",
      "x": -4872.930326802251,
      "y": 2650.80544073854,
      "z": -114,
      "radius": 7.558723466936499,
      "length": 53.82986896462072,
      "seed": 3518504556
    },
    {
      "id": "outer-ice-07-underside-spike-19",
      "x": -4681.6079265784565,
      "y": 2836.913652401231,
      "z": -114,
      "radius": 16.065950892865658,
      "length": 110.9029684167764,
      "seed": 155073170
    },
    {
      "id": "outer-ice-08-underside-spike-0",
      "x": -4991.500385793416,
      "y": 3892.8661153582802,
      "z": -131,
      "radius": 15.006034136749804,
      "length": 97.65975761413574,
      "seed": 3185650070
    },
    {
      "id": "outer-ice-08-underside-spike-1",
      "x": -4887.844816485062,
      "y": 3727.2428146019947,
      "z": -131,
      "radius": 18.01162574184127,
      "length": 86.34098484800768,
      "seed": 898190783
    },
    {
      "id": "outer-ice-08-underside-spike-2",
      "x": -4785.606200599392,
      "y": 3944.4149543312187,
      "z": -131,
      "radius": 8.921753619564697,
      "length": 53.491074104636965,
      "seed": 3383458701
    },
    {
      "id": "outer-ice-08-underside-spike-3",
      "x": -4739.574648980447,
      "y": 3790.244707335365,
      "z": -131,
      "radius": 19.749818451935425,
      "length": 96.6500072479248,
      "seed": 2996289899
    },
    {
      "id": "outer-ice-08-underside-spike-4",
      "x": -4973.268037246945,
      "y": 3782.2212940015315,
      "z": -131,
      "radius": 19.006092712050304,
      "length": 96.1767463684082,
      "seed": 194972377
    },
    {
      "id": "outer-ice-08-underside-spike-5",
      "x": -4867.792588790517,
      "y": 3954.25826616901,
      "z": -131,
      "radius": 11.792933996068314,
      "length": 87.2915022576155,
      "seed": 2947974999
    },
    {
      "id": "outer-ice-08-underside-spike-6",
      "x": -4736.447531418279,
      "y": 3861.811245768128,
      "z": -131,
      "radius": 18.711948643205687,
      "length": 96.96226406097412,
      "seed": 1173391973
    },
    {
      "id": "outer-ice-08-underside-spike-7",
      "x": -4745.339341970295,
      "y": 3983.2195495724504,
      "z": -131,
      "radius": 18.755237974692136,
      "length": 97.42696571350098,
      "seed": 3219014916
    },
    {
      "id": "outer-ice-08-underside-spike-8",
      "x": -4785.983503629747,
      "y": 3970.1277902937327,
      "z": -131,
      "radius": 14.357809899374843,
      "length": 73.85655998354477,
      "seed": 2698546794
    },
    {
      "id": "outer-ice-08-underside-spike-9",
      "x": -4952.598703200709,
      "y": 3722.111502458466,
      "z": -131,
      "radius": 6.7347387741319835,
      "length": 48.90836970649867,
      "seed": 3594204448
    },
    {
      "id": "outer-ice-08-underside-spike-10",
      "x": -4755.042454958079,
      "y": 3749.0320328643543,
      "z": -131,
      "radius": 14.393416379578412,
      "length": 88.94121696997243,
      "seed": 3958991526
    },
    {
      "id": "outer-ice-08-underside-spike-11",
      "x": -4852.335226673262,
      "y": 3741.914155696379,
      "z": -131,
      "radius": 6.717943065799773,
      "length": 38.28817852457943,
      "seed": 2800836726
    },
    {
      "id": "outer-ice-08-underside-spike-12",
      "x": -4889.471121367506,
      "y": 3936.904160739381,
      "z": -131,
      "radius": 8.903328424086794,
      "length": 51.51819793816341,
      "seed": 2128597105
    },
    {
      "id": "outer-ice-08-underside-spike-13",
      "x": -4819.579180600412,
      "y": 3718.7140228879166,
      "z": -131,
      "radius": 15.89873798773624,
      "length": 92.84792769122842,
      "seed": 2902978019
    },
    {
      "id": "outer-ice-08-underside-spike-14",
      "x": -4976.769702856787,
      "y": 3918.0754430682514,
      "z": -131,
      "radius": 7.211063517024741,
      "length": 40.770665692491704,
      "seed": 1465146769
    },
    {
      "id": "outer-ice-08-underside-spike-15",
      "x": -4958.543270299417,
      "y": 3933.8444019442236,
      "z": -131,
      "radius": 9.374780969461426,
      "length": 66.20404253412487,
      "seed": 1629141537
    },
    {
      "id": "outer-ice-08-underside-spike-16",
      "x": -4946.135129326296,
      "y": 3818.8734599171107,
      "z": -131,
      "radius": 15.229719686787575,
      "length": 96.9157247543335,
      "seed": 2614918992
    },
    {
      "id": "outer-ice-08-underside-spike-17",
      "x": -4918.477723962046,
      "y": 3965.3460241103176,
      "z": -131,
      "radius": 9.695868933340535,
      "length": 61.187499287097225,
      "seed": 3490488129
    },
    {
      "id": "outer-ice-08-underside-spike-18",
      "x": -4953.217576398843,
      "y": 3899.627868508829,
      "z": -131,
      "radius": 10.739487548591569,
      "length": 69.11451407739767,
      "seed": 477910655
    },
    {
      "id": "outer-ice-08-underside-spike-19",
      "x": -4929.589175158188,
      "y": 3723.161482020781,
      "z": -131,
      "radius": 8.875374574912712,
      "length": 50.008301971846016,
      "seed": 3700969037
    },
    {
      "id": "outer-ice-09-underside-spike-0",
      "x": -4770.624933768135,
      "y": 5117.145726168797,
      "z": -148,
      "radius": 7.502163731493056,
      "length": 54.70184429254754,
      "seed": 2393834486
    },
    {
      "id": "outer-ice-09-underside-spike-1",
      "x": -4895.5265043713,
      "y": 4868.564859704862,
      "z": -148,
      "radius": 18.80145669961348,
      "length": 88.6021957397461,
      "seed": 3480018764
    },
    {
      "id": "outer-ice-09-underside-spike-2",
      "x": -4658.946326350984,
      "y": 4908.023200030869,
      "z": -148,
      "radius": 13.362845733761787,
      "length": 83.00236320495605,
      "seed": 555244658
    },
    {
      "id": "outer-ice-09-underside-spike-3",
      "x": -4813.86485552897,
      "y": 4848.391497663795,
      "z": -148,
      "radius": 4.664969095494598,
      "length": 39.112288749288425,
      "seed": 1288890600
    },
    {
      "id": "outer-ice-09-underside-spike-4",
      "x": -4631.619585513097,
      "y": 4942.136953043068,
      "z": -148,
      "radius": 15.501129171811044,
      "length": 83.07742274199602,
      "seed": 3123947054
    },
    {
      "id": "outer-ice-09-underside-spike-5",
      "x": -4880.179712429424,
      "y": 4946.636687926169,
      "z": -148,
      "radius": 18.33464487688616,
      "length": 89.22012901306152,
      "seed": 430492100
    },
    {
      "id": "outer-ice-09-underside-spike-6",
      "x": -4918.187309635,
      "y": 4918.5763340718795,
      "z": -148,
      "radius": 15.96775691024959,
      "length": 86.78853553665985,
      "seed": 4237688106
    },
    {
      "id": "outer-ice-09-underside-spike-7",
      "x": -4755.745468992443,
      "y": 4850.985675781371,
      "z": -148,
      "radius": 15.32490341947414,
      "length": 84.67215156555176,
      "seed": 761388899
    },
    {
      "id": "outer-ice-09-underside-spike-8",
      "x": -4828.16977940747,
      "y": 5078.685498321607,
      "z": -148,
      "radius": 15.801408989122137,
      "length": 89.51898670196533,
      "seed": 2074796817
    },
    {
      "id": "outer-ice-09-underside-spike-9",
      "x": -4731.682559582033,
      "y": 4818.1039394644795,
      "z": -148,
      "radius": 17.190516718896106,
      "length": 84.67215156555176,
      "seed": 2959374287
    },
    {
      "id": "outer-ice-09-underside-spike-10",
      "x": -4668.106905456857,
      "y": 4947.097736574911,
      "z": -148,
      "radius": 5.379203774733469,
      "length": 44.02469200974047,
      "seed": 3383787805
    },
    {
      "id": "outer-ice-09-underside-spike-11",
      "x": -4913.117395801135,
      "y": 4983.640402236337,
      "z": -148,
      "radius": 6.7292877251748,
      "length": 54.330847938938184,
      "seed": 1438082683
    },
    {
      "id": "outer-ice-09-underside-spike-12",
      "x": -4935.462103809542,
      "y": 4948.818146070899,
      "z": -148,
      "radius": 10.695793950464576,
      "length": 63.04840601331887,
      "seed": 2212895272
    },
    {
      "id": "outer-ice-09-underside-spike-13",
      "x": -4698.27834998184,
      "y": 5045.139892247442,
      "z": -148,
      "radius": 16.202453232370317,
      "length": 81.9001019828538,
      "seed": 946519406
    },
    {
      "id": "outer-ice-09-underside-spike-14",
      "x": -4887.021746233647,
      "y": 5030.5654999204935,
      "z": -148,
      "radius": 9.994839194463566,
      "length": 67.1293014644835,
      "seed": 4104282487
    },
    {
      "id": "outer-ice-09-underside-spike-15",
      "x": -4694.055476350178,
      "y": 4847.425232036004,
      "z": -148,
      "radius": 3.0757209237199277,
      "length": 25.225023262161343,
      "seed": 3196349317
    },
    {
      "id": "outer-ice-09-underside-spike-16",
      "x": -4674.8374473041695,
      "y": 5026.143988736063,
      "z": -148,
      "radius": 4.166304626967758,
      "length": 37.85715702408645,
      "seed": 2830535528
    },
    {
      "id": "outer-ice-09-underside-spike-17",
      "x": -4657.980814965965,
      "y": 5052.81345940743,
      "z": -148,
      "radius": 11.388232401572168,
      "length": 62.690100553316654,
      "seed": 2498041006
    },
    {
      "id": "outer-ice-09-underside-spike-18",
      "x": -4736.662156354263,
      "y": 5114.606968028371,
      "z": -148,
      "radius": 5.593275207327679,
      "length": 35.75634071426629,
      "seed": 3597185463
    },
    {
      "id": "outer-ice-09-underside-spike-19",
      "x": -4801.121550564801,
      "y": 5091.011199041404,
      "z": -148,
      "radius": 3.207808169303462,
      "length": 26.74070098340444,
      "seed": 997386693
    },
    {
      "id": "outer-ice-10-underside-spike-0",
      "x": -5687.038967698527,
      "y": -4354.646900160416,
      "z": -80,
      "radius": 10.631964527433738,
      "length": 67.77644222226556,
      "seed": 2860491833
    },
    {
      "id": "outer-ice-10-underside-spike-1",
      "x": -5540.6972184091255,
      "y": -4496.374665416109,
      "z": -80,
      "radius": 3.482511766003445,
      "length": 31.230829054312462,
      "seed": 1580015031
    },
    {
      "id": "outer-ice-10-underside-spike-2",
      "x": -5513.370033976543,
      "y": -4438.34233630867,
      "z": -80,
      "radius": 5.359156813798473,
      "length": 36.44388697240477,
      "seed": 1977415109
    },
    {
      "id": "outer-ice-10-underside-spike-3",
      "x": -5670.951261816169,
      "y": -4315.345132406935,
      "z": -80,
      "radius": 13.673853004435076,
      "length": 70.13972846361366,
      "seed": 1554760675
    },
    {
      "id": "outer-ice-10-underside-spike-4",
      "x": -5650.105549795413,
      "y": -4478.857606907091,
      "z": -80,
      "radius": 11.506865372350438,
      "length": 62.09587756575765,
      "seed": 162923409
    },
    {
      "id": "outer-ice-10-underside-spike-5",
      "x": -5632.309414934834,
      "y": -4512.293459058146,
      "z": -80,
      "radius": 5.265601142914965,
      "length": 32.37468020398245,
      "seed": 145486927
    },
    {
      "id": "outer-ice-10-underside-spike-6",
      "x": -5548.775807771369,
      "y": -4337.164179505216,
      "z": -80,
      "radius": 14.794617590708658,
      "length": 76.98547741159233,
      "seed": 4117658013
    },
    {
      "id": "outer-ice-10-underside-spike-7",
      "x": -5524.361908365876,
      "y": -4472.260914538191,
      "z": -80,
      "radius": 14.293368380069731,
      "length": 83.51455854273672,
      "seed": 1760455218
    },
    {
      "id": "outer-ice-10-underside-spike-8",
      "x": -5521.909144307038,
      "y": -4342.667614573928,
      "z": -80,
      "radius": 5.202953973915427,
      "length": 38.49526384888348,
      "seed": 598759592
    },
    {
      "id": "outer-ice-10-underside-spike-9",
      "x": -5670.442305462433,
      "y": -4394.064685743733,
      "z": -80,
      "radius": 5.802366792624817,
      "length": 35.65639754171623,
      "seed": 3779434105
    },
    {
      "id": "outer-ice-10-underside-spike-10",
      "x": -5673.917187558814,
      "y": -4436.195716789498,
      "z": -80,
      "radius": 10.54279189906083,
      "length": 63.699741810121516,
      "seed": 1049480457
    },
    {
      "id": "outer-ice-10-underside-spike-11",
      "x": -5526.067326074802,
      "y": -4391.089798402605,
      "z": -80,
      "radius": 6.320689729051664,
      "length": 38.34053181806363,
      "seed": 496221191
    },
    {
      "id": "outer-ice-10-underside-spike-12",
      "x": -5534.618397760455,
      "y": -4368.290984129535,
      "z": -80,
      "radius": 13.052779516903684,
      "length": 84.72341045979513,
      "seed": 2624552341
    },
    {
      "id": "outer-ice-10-underside-spike-13",
      "x": -5632.586171153387,
      "y": -4326.465296529461,
      "z": -80,
      "radius": 12.689898889884352,
      "length": 91.76067332313129,
      "seed": 1432179850
    },
    {
      "id": "outer-ice-10-underside-spike-14",
      "x": -5564.764555279139,
      "y": -4500.3314367240155,
      "z": -80,
      "radius": 13.770471644774078,
      "length": 86.49916056301937,
      "seed": 3758052186
    },
    {
      "id": "outer-ice-10-underside-spike-15",
      "x": -5676.023481355266,
      "y": -4411.871492262774,
      "z": -80,
      "radius": 8.863093748968094,
      "length": 52.98821740092979,
      "seed": 738322064
    },
    {
      "id": "outer-ice-10-underside-spike-16",
      "x": -5509.118259098418,
      "y": -4377.192039589396,
      "z": -80,
      "radius": 9.950598479937762,
      "length": 56.886682103896376,
      "seed": 2180808416
    },
    {
      "id": "outer-ice-10-underside-spike-17",
      "x": -5546.446853002949,
      "y": -4300.804420043551,
      "z": -80,
      "radius": 7.533597807185724,
      "length": 53.0223478285721,
      "seed": 3761120359
    },
    {
      "id": "outer-ice-10-underside-spike-18",
      "x": -5676.40160757493,
      "y": -4471.397037749956,
      "z": -80,
      "radius": 4.28267689528875,
      "length": 27.913288943809672,
      "seed": 2001906421
    },
    {
      "id": "outer-ice-10-underside-spike-19",
      "x": -5653.684423987618,
      "y": -4501.290993830979,
      "z": -80,
      "radius": 6.222949754772708,
      "length": 47.28277716094168,
      "seed": 3219779717
    },
    {
      "id": "outer-ice-11-underside-spike-0",
      "x": -5645.733061275999,
      "y": -2734.1768818967653,
      "z": -97,
      "radius": 10.501679295664653,
      "length": 52.468429676609404,
      "seed": 754172249
    },
    {
      "id": "outer-ice-11-underside-spike-1",
      "x": -5610.987697184985,
      "y": -2742.6368101890166,
      "z": -97,
      "radius": 10.080242698537186,
      "length": 77.15648631670595,
      "seed": 3668404695
    },
    {
      "id": "outer-ice-11-underside-spike-2",
      "x": -5677.874458817328,
      "y": -2663.757958118219,
      "z": -97,
      "radius": 4.945487273214384,
      "length": 36.285932612112525,
      "seed": 4055185637
    },
    {
      "id": "outer-ice-11-underside-spike-3",
      "x": -5664.980043010117,
      "y": -2647.0881796352332,
      "z": -97,
      "radius": 3.4731601460371166,
      "length": 28.362641500381628,
      "seed": 1973519875
    },
    {
      "id": "outer-ice-11-underside-spike-4",
      "x": -5578.872590381699,
      "y": -2759.148126835709,
      "z": -97,
      "radius": 8.838112380495295,
      "length": 48.152594404594,
      "seed": 2449640625
    },
    {
      "id": "outer-ice-11-underside-spike-5",
      "x": -5655.210804841421,
      "y": -2659.999717600438,
      "z": -97,
      "radius": 7.642025951715186,
      "length": 54.408210803991835,
      "seed": 1678003311
    },
    {
      "id": "outer-ice-11-underside-spike-6",
      "x": -5682.991358340168,
      "y": -2625.107767902726,
      "z": -97,
      "radius": 11.730050386134534,
      "length": 91.05425747571749,
      "seed": 25647532
    },
    {
      "id": "outer-ice-11-underside-spike-7",
      "x": -5568.932206905421,
      "y": -2576.8401946281915,
      "z": -97,
      "radius": 4.153144346773624,
      "length": 27.323961600277823,
      "seed": 52202450
    },
    {
      "id": "outer-ice-11-underside-spike-8",
      "x": -5658.981742885457,
      "y": -2698.5180129365544,
      "z": -97,
      "radius": 10.822537019457666,
      "length": 81.92286499934704,
      "seed": 3330073928
    },
    {
      "id": "outer-ice-11-underside-spike-9",
      "x": -5531.497380238173,
      "y": -2680.800155264902,
      "z": -97,
      "radius": 3.877850069766864,
      "length": 27.30526454638794,
      "seed": 3507803033
    },
    {
      "id": "outer-ice-11-underside-spike-10",
      "x": -5541.85292248309,
      "y": -2661.3289873126632,
      "z": -97,
      "radius": 6.295792511450126,
      "length": 49.801187908814676,
      "seed": 4271905303
    },
    {
      "id": "outer-ice-11-underside-spike-11",
      "x": -5536.144746883888,
      "y": -2638.7501854197076,
      "z": -97,
      "radius": 10.864024994987993,
      "length": 80.3672498466332,
      "seed": 303494516
    },
    {
      "id": "outer-ice-11-underside-spike-12",
      "x": -5572.047408123402,
      "y": -2556.3466512919586,
      "z": -97,
      "radius": 9.266587799834088,
      "length": 59.6605013000683,
      "seed": 1680149047
    },
    {
      "id": "outer-ice-11-underside-spike-13",
      "x": -5596.456750590835,
      "y": -2558.9912878398013,
      "z": -97,
      "radius": 9.829466358600182,
      "length": 56.10674148493958,
      "seed": 1669062213
    },
    {
      "id": "outer-ice-11-underside-spike-14",
      "x": -5635.830469669389,
      "y": -2754.0785377451107,
      "z": -97,
      "radius": 8.974116707174108,
      "length": 69.59288600200193,
      "seed": 4207753173
    },
    {
      "id": "outer-ice-11-underside-spike-15",
      "x": -5666.725364713727,
      "y": -2592.7726945843447,
      "z": -97,
      "radius": 12.247197210201993,
      "length": 66.47565819589414,
      "seed": 392110451
    },
    {
      "id": "outer-ice-11-underside-spike-16",
      "x": -5584.1674996704105,
      "y": -2736.102643280541,
      "z": -97,
      "radius": 10.118472287496552,
      "length": 59.3884490354519,
      "seed": 4005773473
    },
    {
      "id": "outer-ice-11-underside-spike-17",
      "x": -5541.261199466647,
      "y": -2587.7581985436123,
      "z": -97,
      "radius": 12.441802767505868,
      "length": 85.39251841607984,
      "seed": 3136201009
    },
    {
      "id": "outer-ice-11-underside-spike-18",
      "x": -5631.625909514456,
      "y": -2535.0850788217986,
      "z": -97,
      "radius": 12.28972050173208,
      "length": 66.8015771124521,
      "seed": 2292671520
    },
    {
      "id": "outer-ice-11-underside-spike-19",
      "x": -5550.719697130472,
      "y": -2682.7584588514055,
      "z": -97,
      "radius": 11.108999721100552,
      "length": 74.76112693434929,
      "seed": 2799537745
    },
    {
      "id": "outer-ice-13-underside-spike-0",
      "x": -3913.5314768035873,
      "y": -4099.853790574329,
      "z": -131,
      "radius": 16.296156279509887,
      "length": 87.3989372253418,
      "seed": 2571473145
    },
    {
      "id": "outer-ice-13-underside-spike-1",
      "x": -3767.6129472084713,
      "y": -3978.677376799627,
      "z": -131,
      "radius": 12.023499670671299,
      "length": 68.28387154400758,
      "seed": 2401809527
    },
    {
      "id": "outer-ice-13-underside-spike-2",
      "x": -3888.4944599275764,
      "y": -4137.59994702796,
      "z": -131,
      "radius": 19.410105067072436,
      "length": 89.3527774810791,
      "seed": 2711905925
    },
    {
      "id": "outer-ice-13-underside-spike-3",
      "x": -3816.2390774902083,
      "y": -3954.2700330497137,
      "z": -131,
      "radius": 14.917432790854946,
      "length": 82.62799072265625,
      "seed": 1118289571
    },
    {
      "id": "outer-ice-13-underside-spike-4",
      "x": -3920.862103282247,
      "y": -3968.818003705159,
      "z": -131,
      "radius": 13.561806378653273,
      "length": 84.22432231903076,
      "seed": 1752021073
    },
    {
      "id": "outer-ice-13-underside-spike-5",
      "x": -3953.3352180905267,
      "y": -4058.8469067291453,
      "z": -131,
      "radius": 16.395596587331966,
      "length": 85.92350769042969,
      "seed": 1152455439
    },
    {
      "id": "outer-ice-13-underside-spike-6",
      "x": -3932.2572997691236,
      "y": -4025.9223801002763,
      "z": -131,
      "radius": 18.17762964288704,
      "length": 85.90063512261355,
      "seed": 837366365
    },
    {
      "id": "outer-ice-13-underside-spike-7",
      "x": -3729.516588917034,
      "y": -4095.101901493295,
      "z": -131,
      "radius": 10.401642974698916,
      "length": 53.048636563151085,
      "seed": 1997012411
    },
    {
      "id": "outer-ice-13-underside-spike-8",
      "x": -3879.423701206691,
      "y": -3957.1845918396207,
      "z": -131,
      "radius": 13.236082532908767,
      "length": 70.6319531552519,
      "seed": 3142036072
    },
    {
      "id": "outer-ice-13-underside-spike-9",
      "x": -3848.886299920583,
      "y": -4127.53991082983,
      "z": -131,
      "radius": 4.2185927701648325,
      "length": 34.426084537167526,
      "seed": 2961982265
    },
    {
      "id": "outer-ice-13-underside-spike-10",
      "x": -3759.8345951999295,
      "y": -4100.246970762317,
      "z": -131,
      "radius": 3.1340664208400995,
      "length": 23.599435627953657,
      "seed": 1200751799
    },
    {
      "id": "outer-ice-13-underside-spike-11",
      "x": -3771.379193408804,
      "y": -4142.066086966518,
      "z": -131,
      "radius": 13.653566214023158,
      "length": 79.83129074212475,
      "seed": 1750983877
    },
    {
      "id": "outer-ice-13-underside-spike-12",
      "x": -3758.1519107427494,
      "y": -4064.8097011823234,
      "z": -131,
      "radius": 19.56063303980045,
      "length": 85.4347734451294,
      "seed": 1430969941
    },
    {
      "id": "outer-ice-13-underside-spike-13",
      "x": -3901.664744104273,
      "y": -3983.9990114850025,
      "z": -131,
      "radius": 6.376425842521712,
      "length": 35.7742772915651,
      "seed": 293370853
    },
    {
      "id": "outer-ice-13-underside-spike-14",
      "x": -3735.2533218939116,
      "y": -3976.7974524724923,
      "z": -131,
      "radius": 11.66708859638311,
      "length": 84.08940124511719,
      "seed": 2131685635
    },
    {
      "id": "outer-ice-13-underside-spike-15",
      "x": -3808.437019713549,
      "y": -4157.36864677845,
      "z": -131,
      "radius": 6.95844602258876,
      "length": 48.12275329418866,
      "seed": 4045850068
    },
    {
      "id": "outer-ice-13-underside-spike-16",
      "x": -3711.339854030415,
      "y": -3992.0232900912715,
      "z": -131,
      "radius": 7.610600729472935,
      "length": 42.04382750548236,
      "seed": 704676198
    },
    {
      "id": "outer-ice-13-underside-spike-17",
      "x": -3947.6419959220975,
      "y": -4101.968884399358,
      "z": -131,
      "radius": 14.23813102254644,
      "length": 67.08684741894055,
      "seed": 2764039484
    },
    {
      "id": "outer-ice-13-underside-spike-18",
      "x": -3844.321606540899,
      "y": -4155.69466722163,
      "z": -131,
      "radius": 8.423857030458748,
      "length": 59.50767159733077,
      "seed": 3297935622
    },
    {
      "id": "outer-ice-13-underside-spike-19",
      "x": -3758.5834322273254,
      "y": -4120.239141860026,
      "z": -131,
      "radius": 5.289663142990321,
      "length": 40.079117006107396,
      "seed": 3259058976
    },
    {
      "id": "outer-ice-14-underside-spike-0",
      "x": -3872.542096070564,
      "y": -2538.4470097340454,
      "z": -148,
      "radius": 7.027739820769057,
      "length": 43.863355917969564,
      "seed": 1144328785
    },
    {
      "id": "outer-ice-14-underside-spike-1",
      "x": -3726.514374523955,
      "y": -2452.1120512102675,
      "z": -148,
      "radius": 14.810141288908198,
      "length": 86.07727945885449,
      "seed": 2946833679
    },
    {
      "id": "outer-ice-14-underside-spike-2",
      "x": -3755.787915375966,
      "y": -2377.1782751041783,
      "z": -148,
      "radius": 9.89336281339638,
      "length": 70.08784677459403,
      "seed": 3892866141
    },
    {
      "id": "outer-ice-14-underside-spike-3",
      "x": -3874.3279497868352,
      "y": -2348.37649536854,
      "z": -148,
      "radius": 6.086754616582766,
      "length": 41.05103047533112,
      "seed": 1547495355
    },
    {
      "id": "outer-ice-14-underside-spike-4",
      "x": -3747.2296245778243,
      "y": -2334.665872233038,
      "z": -148,
      "radius": 19.532385054742917,
      "length": 98.34748363494873,
      "seed": 1378998953
    },
    {
      "id": "outer-ice-14-underside-spike-5",
      "x": -3765.3213473516457,
      "y": -2568.2475238763363,
      "z": -148,
      "radius": 17.671957246027887,
      "length": 82.7089814624988,
      "seed": 3497450926
    },
    {
      "id": "outer-ice-14-underside-spike-6",
      "x": -3913.819721548944,
      "y": -2409.1058616492196,
      "z": -148,
      "radius": 19.016632515238598,
      "length": 103.42022037506104,
      "seed": 3231469239
    },
    {
      "id": "outer-ice-14-underside-spike-7",
      "x": -3854.6984799743523,
      "y": -2348.9798167662325,
      "z": -148,
      "radius": 10.572397681651637,
      "length": 58.37967748977524,
      "seed": 1192320709
    },
    {
      "id": "outer-ice-14-underside-spike-8",
      "x": -3738.8185467279345,
      "y": -2513.68715014305,
      "z": -148,
      "radius": 12.371226287214085,
      "length": 71.3806700550974,
      "seed": 3267680341
    },
    {
      "id": "outer-ice-14-underside-spike-9",
      "x": -3711.3509993829903,
      "y": -2393.200570721318,
      "z": -148,
      "radius": 17.400183910736814,
      "length": 95.96308326721191,
      "seed": 3230604787
    },
    {
      "id": "outer-ice-14-underside-spike-10",
      "x": -3930.9541261473987,
      "y": -2472.0297671898525,
      "z": -148,
      "radius": 11.83535243012011,
      "length": 63.64248427283319,
      "seed": 3412872474
    },
    {
      "id": "outer-ice-14-underside-spike-11",
      "x": -3908.186785383658,
      "y": -2503.705526641943,
      "z": -148,
      "radius": 19.480541456025094,
      "length": 100.4216775894165,
      "seed": 1768415824
    },
    {
      "id": "outer-ice-14-underside-spike-12",
      "x": -3778.592030345874,
      "y": -2332.2760885674497,
      "z": -148,
      "radius": 8.917385959764943,
      "length": 62.78751520805345,
      "seed": 366943809
    },
    {
      "id": "outer-ice-14-underside-spike-13",
      "x": -3739.7089247649556,
      "y": -2547.7095543105074,
      "z": -148,
      "radius": 10.298669240437448,
      "length": 68.3339549674614,
      "seed": 1168591918
    },
    {
      "id": "outer-ice-14-underside-spike-14",
      "x": -3796.2483683706632,
      "y": -2354.2692065987644,
      "z": -148,
      "radius": 14.967387162614614,
      "length": 100.53938484191895,
      "seed": 3864510404
    },
    {
      "id": "outer-ice-14-underside-spike-15",
      "x": -3690.785503634695,
      "y": -2471.5762960473753,
      "z": -148,
      "radius": 17.36730389110744,
      "length": 95.59968566894531,
      "seed": 2839659306
    },
    {
      "id": "outer-ice-14-underside-spike-16",
      "x": -3702.2230843773987,
      "y": -2509.546113042761,
      "z": -148,
      "radius": 18.939752633916214,
      "length": 95.18586254119873,
      "seed": 3310497623
    },
    {
      "id": "outer-ice-14-underside-spike-17",
      "x": -3715.416100042136,
      "y": -2349.8728058618804,
      "z": -148,
      "radius": 10.888593245763332,
      "length": 83.69443414678291,
      "seed": 594385844
    },
    {
      "id": "outer-ice-14-underside-spike-18",
      "x": -3779.0250953757695,
      "y": -2537.342288191423,
      "z": -148,
      "radius": 10.455240024952218,
      "length": 80.26355951031547,
      "seed": 1000592373
    },
    {
      "id": "outer-ice-14-underside-spike-19",
      "x": -3933.413713225571,
      "y": -2536.001315355164,
      "z": -148,
      "radius": 4.250163289019838,
      "length": 36.79738800455891,
      "seed": 1879913619
    },
    {
      "id": "outer-ice-15-underside-spike-0",
      "x": -3757.1196404153707,
      "y": -831.9139175129358,
      "z": -80,
      "radius": 18.9839980059769,
      "length": 96.97146009984839,
      "seed": 3194608497
    },
    {
      "id": "outer-ice-15-underside-spike-1",
      "x": -3747.3010855614516,
      "y": -922.7767031422817,
      "z": -80,
      "radius": 15.441465885611251,
      "length": 90.88531203874679,
      "seed": 3931354415
    },
    {
      "id": "outer-ice-15-underside-spike-2",
      "x": -3905.718311712613,
      "y": -905.6021750862488,
      "z": -80,
      "radius": 6.658402980072424,
      "length": 42.783109936683964,
      "seed": 367238013
    },
    {
      "id": "outer-ice-15-underside-spike-3",
      "x": -3876.430007431037,
      "y": -949.4386751805976,
      "z": -80,
      "radius": 8.662997249746695,
      "length": 60.71974453719177,
      "seed": 3217503707
    },
    {
      "id": "outer-ice-15-underside-spike-4",
      "x": -3842.70511531966,
      "y": -958.1783645333128,
      "z": -80,
      "radius": 5.053382016951218,
      "length": 37.98526213825863,
      "seed": 1599655147
    },
    {
      "id": "outer-ice-15-underside-spike-5",
      "x": -3740.4569741597675,
      "y": -885.1381475796458,
      "z": -80,
      "radius": 19.12038178392686,
      "length": 142.16248488966897,
      "seed": 4241254395
    },
    {
      "id": "outer-ice-15-underside-spike-6",
      "x": -3787.1626823274396,
      "y": -780.4265888127954,
      "z": -80,
      "radius": 7.596222597872838,
      "length": 46.32720954991148,
      "seed": 3613657321
    },
    {
      "id": "outer-ice-15-underside-spike-7",
      "x": -3860.4009621543614,
      "y": -717.3786989626891,
      "z": -80,
      "radius": 8.697868406074122,
      "length": 69.99755254417266,
      "seed": 1975369959
    },
    {
      "id": "outer-ice-15-underside-spike-8",
      "x": -3936.0984756347443,
      "y": -890.2717592997772,
      "z": -80,
      "radius": 4.651484343456104,
      "length": 34.34363645925352,
      "seed": 2331396855
    },
    {
      "id": "outer-ice-15-underside-spike-9",
      "x": -3789.5682241597606,
      "y": -925.6201846219938,
      "z": -80,
      "radius": 17.350665933685377,
      "length": 98.46723821953665,
      "seed": 2040109319
    },
    {
      "id": "outer-ice-15-underside-spike-10",
      "x": -3932.5293570339745,
      "y": -828.9686564909265,
      "z": -80,
      "radius": 9.57173955719918,
      "length": 63.1506352944205,
      "seed": 3378005086
    },
    {
      "id": "outer-ice-15-underside-spike-11",
      "x": -3755.488955761298,
      "y": -863.5233042708728,
      "z": -80,
      "radius": 4.8901549791917205,
      "length": 35.79979143282368,
      "seed": 2623375406
    },
    {
      "id": "outer-ice-15-underside-spike-12",
      "x": -3776.902327629869,
      "y": -755.2350638623973,
      "z": -80,
      "radius": 13.463904105592519,
      "length": 101.85831797093667,
      "seed": 580983748
    },
    {
      "id": "outer-ice-15-underside-spike-13",
      "x": -3874.330437203883,
      "y": -753.4577467163466,
      "z": -80,
      "radius": 14.416663927957416,
      "length": 99.56438674059385,
      "seed": 2585607978
    },
    {
      "id": "outer-ice-15-underside-spike-14",
      "x": -3829.031075171529,
      "y": -733.0189495127037,
      "z": -80,
      "radius": 19.937440445879474,
      "length": 139.25794385698035,
      "seed": 4217145699
    },
    {
      "id": "outer-ice-15-underside-spike-15",
      "x": -3795.153387376083,
      "y": -744.9107041054796,
      "z": -80,
      "radius": 4.807886084541678,
      "length": 32.284292327054196,
      "seed": 3123740874
    },
    {
      "id": "outer-ice-15-underside-spike-16",
      "x": -3916.951762121821,
      "y": -881.334669364711,
      "z": -80,
      "radius": 8.484753528609872,
      "length": 49.00046638891866,
      "seed": 2999881626
    },
    {
      "id": "outer-ice-15-underside-spike-17",
      "x": -3749.043428045672,
      "y": -800.0092597190194,
      "z": -80,
      "radius": 5.07398201781325,
      "length": 38.293141090791266,
      "seed": 907109765
    },
    {
      "id": "outer-ice-15-underside-spike-18",
      "x": -3870.7912645986908,
      "y": -990.7422755218381,
      "z": -80,
      "radius": 9.244731107261032,
      "length": 48.70736700652298,
      "seed": 1262124392
    },
    {
      "id": "outer-ice-15-underside-spike-19",
      "x": -3923.8656319162574,
      "y": -848.5948465498345,
      "z": -80,
      "radius": 9.836107794428244,
      "length": 69.02765663143546,
      "seed": 2667742939
    },
    {
      "id": "outer-ice-16-underside-spike-0",
      "x": -3898.002429625123,
      "y": 686.1690449752747,
      "z": -97,
      "radius": 19.58171698427759,
      "length": 134.89591212819983,
      "seed": 680663449
    },
    {
      "id": "outer-ice-16-underside-spike-1",
      "x": -3840.2072452296875,
      "y": 650.1136804874137,
      "z": -97,
      "radius": 16.207153263501823,
      "length": 91.41449672485656,
      "seed": 2144408926
    },
    {
      "id": "outer-ice-16-underside-spike-2",
      "x": -3882.2191154045786,
      "y": 650.648142019073,
      "z": -97,
      "radius": 5.265139971394092,
      "length": 37.67980740626027,
      "seed": 296944500
    },
    {
      "id": "outer-ice-16-underside-spike-3",
      "x": -3819.824099750428,
      "y": 850.7746788993164,
      "z": -97,
      "radius": 18.891833448782563,
      "length": 89.18286510818282,
      "seed": 830442842
    },
    {
      "id": "outer-ice-16-underside-spike-4",
      "x": -3731.2184438086697,
      "y": 721.5429459831952,
      "z": -97,
      "radius": 16.1688258680515,
      "length": 102.89800983495591,
      "seed": 340775056
    },
    {
      "id": "outer-ice-16-underside-spike-5",
      "x": -3925.117465967189,
      "y": 733.5028619259535,
      "z": -97,
      "radius": 12.221212438773364,
      "length": 94.78891306483162,
      "seed": 2842487008
    },
    {
      "id": "outer-ice-16-underside-spike-6",
      "x": -3886.275138651289,
      "y": 818.296026784993,
      "z": -97,
      "radius": 17.454604824073613,
      "length": 98.63226554079638,
      "seed": 237883494
    },
    {
      "id": "outer-ice-16-underside-spike-7",
      "x": -3776.3635822136353,
      "y": 816.7983657773509,
      "z": -97,
      "radius": 5.137036717031151,
      "length": 36.94336941581935,
      "seed": 799276092
    },
    {
      "id": "outer-ice-16-underside-spike-8",
      "x": -3709.1375681084164,
      "y": 768.4552357381881,
      "z": -97,
      "radius": 19.191019546240568,
      "length": 106.48576877478638,
      "seed": 1772004834
    },
    {
      "id": "outer-ice-16-underside-spike-9",
      "x": -3913.720106302224,
      "y": 764.7429994419053,
      "z": -97,
      "radius": 7.95610699057579,
      "length": 58.674962324671505,
      "seed": 678578
    },
    {
      "id": "outer-ice-16-underside-spike-10",
      "x": -3797.27235602526,
      "y": 628.3296986891477,
      "z": -97,
      "radius": 5.710026764776558,
      "length": 45.248124774133906,
      "seed": 3292407080
    },
    {
      "id": "outer-ice-16-underside-spike-11",
      "x": -3857.8541300112684,
      "y": 839.6185823020187,
      "z": -97,
      "radius": 12.13659639423713,
      "length": 93.0848681548376,
      "seed": 3472016248
    },
    {
      "id": "outer-ice-16-underside-spike-12",
      "x": -3751.57150223295,
      "y": 815.8994780093748,
      "z": -97,
      "radius": 12.335089976899326,
      "length": 62.94718496139283,
      "seed": 4089002046
    },
    {
      "id": "outer-ice-16-underside-spike-13",
      "x": -3818.1054213470306,
      "y": 626.0549192658084,
      "z": -97,
      "radius": 7.300938293337822,
      "length": 39.62360910333103,
      "seed": 2499786226
    },
    {
      "id": "outer-ice-16-underside-spike-14",
      "x": -3776.1699806402753,
      "y": 633.4275968834596,
      "z": -97,
      "radius": 8.204264858271927,
      "length": 58.708774443350435,
      "seed": 837391976
    },
    {
      "id": "outer-ice-16-underside-spike-15",
      "x": -3782.7191810920012,
      "y": 667.323557867324,
      "z": -97,
      "radius": 8.573040370130911,
      "length": 60.98727159342031,
      "seed": 171957211
    },
    {
      "id": "outer-ice-16-underside-spike-16",
      "x": -3896.7572464480563,
      "y": 846.8007283292463,
      "z": -97,
      "radius": 3.7379091545008123,
      "length": 28.413743707722166,
      "seed": 3630843656
    },
    {
      "id": "outer-ice-16-underside-spike-17",
      "x": -3915.4555721337547,
      "y": 821.0836602512013,
      "z": -97,
      "radius": 9.473044171696529,
      "length": 74.41065216809714,
      "seed": 2818363481
    },
    {
      "id": "outer-ice-16-underside-spike-18",
      "x": -3773.923250309483,
      "y": 683.0249687818856,
      "z": -97,
      "radius": 4.853598672663793,
      "length": 30.565358155148978,
      "seed": 968556265
    },
    {
      "id": "outer-ice-16-underside-spike-19",
      "x": -3759.3994521644995,
      "y": 681.6566054723442,
      "z": -97,
      "radius": 4.320992893539369,
      "length": 39.26273545542307,
      "seed": 398892782
    },
    {
      "id": "outer-ice-17-underside-spike-0",
      "x": -3852.3981179350503,
      "y": 2262.3261599374355,
      "z": -114,
      "radius": 15.423430667957291,
      "length": 96.04206796804584,
      "seed": 1298523297
    },
    {
      "id": "outer-ice-17-underside-spike-1",
      "x": -3898.6399804849507,
      "y": 2336.6603242569886,
      "z": -114,
      "radius": 16.333331224508584,
      "length": 116.17519631491255,
      "seed": 2661549574
    },
    {
      "id": "outer-ice-17-underside-spike-2",
      "x": -3782.831885448274,
      "y": 2239.8486277122383,
      "z": -114,
      "radius": 12.970833791885525,
      "length": 94.22784989481836,
      "seed": 1678703836
    },
    {
      "id": "outer-ice-17-underside-spike-3",
      "x": -3700.5568537919567,
      "y": 2391.506121156881,
      "z": -114,
      "radius": 9.86270694504492,
      "length": 51.697534611778586,
      "seed": 712014141
    },
    {
      "id": "outer-ice-17-underside-spike-4",
      "x": -3887.5906450085936,
      "y": 2285.0155187289392,
      "z": -114,
      "radius": 13.951074946904555,
      "length": 83.13437065589434,
      "seed": 1575024027
    },
    {
      "id": "outer-ice-17-underside-spike-5",
      "x": -3794.7588516134183,
      "y": 2443.0440417837044,
      "z": -114,
      "radius": 9.260423477506265,
      "length": 62.4064550644514,
      "seed": 2284626313
    },
    {
      "id": "outer-ice-17-underside-spike-6",
      "x": -3855.332749556045,
      "y": 2460.239037531877,
      "z": -114,
      "radius": 7.0353315838146955,
      "length": 50.95105698971808,
      "seed": 358632583
    },
    {
      "id": "outer-ice-17-underside-spike-7",
      "x": -3830.0807374258857,
      "y": 2451.755144020452,
      "z": -114,
      "radius": 17.56898448150605,
      "length": 114.09282589652192,
      "seed": 3624327646
    },
    {
      "id": "outer-ice-17-underside-spike-8",
      "x": -3741.1644852964705,
      "y": 2377.023129489111,
      "z": -114,
      "radius": 11.232765837805346,
      "length": 87.77566104306996,
      "seed": 3411604647
    },
    {
      "id": "outer-ice-17-underside-spike-9",
      "x": -3919.258322941298,
      "y": 2423.456830589038,
      "z": -114,
      "radius": 13.562118737725541,
      "length": 82.68913066697154,
      "seed": 1658956085
    },
    {
      "id": "outer-ice-17-underside-spike-10",
      "x": -3713.7885853819525,
      "y": 2331.464583761983,
      "z": -114,
      "radius": 13.52413691394031,
      "length": 85.59952447836437,
      "seed": 171539626
    },
    {
      "id": "outer-ice-17-underside-spike-11",
      "x": -3886.357521607957,
      "y": 2471.1793472570216,
      "z": -114,
      "radius": 18.184055181220174,
      "length": 93.85098714673704,
      "seed": 4140172154
    },
    {
      "id": "outer-ice-17-underside-spike-12",
      "x": -3913.3907490181664,
      "y": 2313.383672467726,
      "z": -114,
      "radius": 3.858710657339543,
      "length": 29.772530710671443,
      "seed": 3333844400
    },
    {
      "id": "outer-ice-17-underside-spike-13",
      "x": -3842.079500935451,
      "y": 2475.745348554619,
      "z": -114,
      "radius": 7.087014930089936,
      "length": 40.27363939042888,
      "seed": 2875447585
    },
    {
      "id": "outer-ice-17-underside-spike-14",
      "x": -3930.5845569252706,
      "y": 2324.227954753882,
      "z": -114,
      "radius": 13.694800627650693,
      "length": 96.26410292672827,
      "seed": 2850679135
    },
    {
      "id": "outer-ice-17-underside-spike-15",
      "x": -3720.559802643701,
      "y": 2418.5253802700017,
      "z": -114,
      "radius": 4.247929499717429,
      "length": 27.639156947312674,
      "seed": 960393583
    },
    {
      "id": "outer-ice-17-underside-spike-16",
      "x": -3882.678680022065,
      "y": 2241.6634515180986,
      "z": -114,
      "radius": 19.213950947625563,
      "length": 123.18458825104021,
      "seed": 1335633341
    },
    {
      "id": "outer-ice-17-underside-spike-17",
      "x": -3821.9160505299737,
      "y": 2256.1598989759736,
      "z": -114,
      "radius": 5.377458710456267,
      "length": 46.193312695370416,
      "seed": 560307739
    },
    {
      "id": "outer-ice-17-underside-spike-18",
      "x": -3926.830330504534,
      "y": 2371.053545032273,
      "z": -114,
      "radius": 19.266740169143304,
      "length": 109.82392340343705,
      "seed": 4229391881
    },
    {
      "id": "outer-ice-17-underside-spike-19",
      "x": -3757.047152179845,
      "y": 2233.9997192279125,
      "z": -114,
      "radius": 4.896012432174757,
      "length": 43.50037860489266,
      "seed": 913132807
    },
    {
      "id": "outer-ice-18-underside-spike-0",
      "x": -3936.716012251848,
      "y": 4007.1720648835335,
      "z": -131,
      "radius": 16.172546189045534,
      "length": 84.99987411499023,
      "seed": 1945615177
    },
    {
      "id": "outer-ice-18-underside-spike-1",
      "x": -3833.897167901088,
      "y": 3838.8418127030923,
      "z": -131,
      "radius": 19.65403266926296,
      "length": 87.64620113372803,
      "seed": 2718656583
    },
    {
      "id": "outer-ice-18-underside-spike-2",
      "x": -3753.989007380455,
      "y": 3841.6338034113064,
      "z": -131,
      "radius": 11.970668500987813,
      "length": 72.66946820583662,
      "seed": 2606856149
    },
    {
      "id": "outer-ice-18-underside-spike-3",
      "x": -3866.048136830696,
      "y": 4076.9071063208658,
      "z": -131,
      "radius": 15.815471852431074,
      "length": 83.9844970703125,
      "seed": 687956339
    },
    {
      "id": "outer-ice-18-underside-spike-4",
      "x": -3749.654517815132,
      "y": 3968.3969119033436,
      "z": -131,
      "radius": 7.120116220554337,
      "length": 41.577933748452615,
      "seed": 1602453665
    },
    {
      "id": "outer-ice-18-underside-spike-5",
      "x": -3896.829145251373,
      "y": 3865.362668547612,
      "z": -131,
      "radius": 18.04917596024461,
      "length": 87.93762016296387,
      "seed": 4057789663
    },
    {
      "id": "outer-ice-18-underside-spike-6",
      "x": -3778.5203462996374,
      "y": 4055.8833665149386,
      "z": -131,
      "radius": 13.524416369153187,
      "length": 83.8880090713501,
      "seed": 4285825453
    },
    {
      "id": "outer-ice-18-underside-spike-7",
      "x": -3741.8937255481674,
      "y": 3921.6205373730636,
      "z": -131,
      "radius": 17.658889070386067,
      "length": 86.29606056213379,
      "seed": 1140354699
    },
    {
      "id": "outer-ice-18-underside-spike-8",
      "x": -3737.4117242366674,
      "y": 4013.386270781439,
      "z": -131,
      "radius": 11.044069997733459,
      "length": 59.29449082590775,
      "seed": 1705862905
    },
    {
      "id": "outer-ice-18-underside-spike-9",
      "x": -3769.0052424619,
      "y": 4032.357229412474,
      "z": -131,
      "radius": 5.576441350625828,
      "length": 48.102484741492255,
      "seed": 1932417655
    },
    {
      "id": "outer-ice-18-underside-spike-10",
      "x": -3718.4479708761746,
      "y": 3971.7837815904286,
      "z": -131,
      "radius": 14.495270448504016,
      "length": 83.47341799451415,
      "seed": 64314501
    },
    {
      "id": "outer-ice-18-underside-spike-11",
      "x": -3724.092644515275,
      "y": 3896.189238328929,
      "z": -131,
      "radius": 3.6045497213490307,
      "length": 31.50310083248471,
      "seed": 338395812
    },
    {
      "id": "outer-ice-18-underside-spike-12",
      "x": -3843.6089994381687,
      "y": 4045.112342781161,
      "z": -131,
      "radius": 5.662479365943,
      "length": 36.12709796186628,
      "seed": 4268348325
    },
    {
      "id": "outer-ice-18-underside-spike-13",
      "x": -3923.5089571436283,
      "y": 3909.607660607456,
      "z": -131,
      "radius": 4.652137829223648,
      "length": 34.136394460737364,
      "seed": 3154434755
    },
    {
      "id": "outer-ice-18-underside-spike-14",
      "x": -3811.3277216896945,
      "y": 3813.2610553416894,
      "z": -131,
      "radius": 5.816584395477548,
      "length": 35.477362760735325,
      "seed": 199445459
    },
    {
      "id": "outer-ice-18-underside-spike-15",
      "x": -3944.5034187847455,
      "y": 3909.4754475352033,
      "z": -131,
      "radius": 11.790008327225223,
      "length": 70.94192214546683,
      "seed": 1950499043
    },
    {
      "id": "outer-ice-18-underside-spike-16",
      "x": -3949.1522284101156,
      "y": 3964.9054198591402,
      "z": -131,
      "radius": 19.1595223674085,
      "length": 85.94806480407715,
      "seed": 1351112849
    },
    {
      "id": "outer-ice-18-underside-spike-17",
      "x": -3765.1034324091597,
      "y": 4007.398052503364,
      "z": -131,
      "radius": 5.698169002309442,
      "length": 44.629842462825955,
      "seed": 3791059226
    },
    {
      "id": "outer-ice-18-underside-spike-18",
      "x": -3714.491591669813,
      "y": 3940.6846370119943,
      "z": -131,
      "radius": 5.784102428238839,
      "length": 45.49484523538285,
      "seed": 2878746192
    },
    {
      "id": "outer-ice-18-underside-spike-19",
      "x": -3933.8738456583146,
      "y": 3883.693823007184,
      "z": -131,
      "radius": 13.888868951937184,
      "length": 88.32042503356934,
      "seed": 789633601
    },
    {
      "id": "outer-ice-19-underside-spike-0",
      "x": 444.9642507817842,
      "y": -2992.011086878749,
      "z": -148,
      "radius": 7.704602790204808,
      "length": 59.97963776085074,
      "seed": 3352307401
    },
    {
      "id": "outer-ice-19-underside-spike-1",
      "x": 492.6206732703801,
      "y": -3110.2596365049403,
      "z": -148,
      "radius": 3.7514064418617634,
      "length": 34.18552942580223,
      "seed": 703338439
    },
    {
      "id": "outer-ice-19-underside-spike-2",
      "x": 374.90611052357394,
      "y": -3045.8359925578297,
      "z": -148,
      "radius": 10.80242451815866,
      "length": 78.11856226750648,
      "seed": 3013823317
    },
    {
      "id": "outer-ice-19-underside-spike-3",
      "x": 543.3347256298002,
      "y": -3063.1968301260817,
      "z": -148,
      "radius": 6.491633195802569,
      "length": 54.82031660025073,
      "seed": 1293266250
    },
    {
      "id": "outer-ice-19-underside-spike-4",
      "x": 357.0734807367331,
      "y": -3034.832685231569,
      "z": -148,
      "radius": 7.769040237413718,
      "length": 50.46516048905543,
      "seed": 2410477059
    },
    {
      "id": "outer-ice-19-underside-spike-5",
      "x": 497.27409877778484,
      "y": -3003.0614719201535,
      "z": -148,
      "radius": 8.715372782154008,
      "length": 53.51124585036685,
      "seed": 2141617329
    },
    {
      "id": "outer-ice-19-underside-spike-6",
      "x": 516.3848992645218,
      "y": -3066.4014381898114,
      "z": -148,
      "radius": 7.072289896616712,
      "length": 42.81419830752362,
      "seed": 2816261231
    },
    {
      "id": "outer-ice-19-underside-spike-7",
      "x": 470.11677080138946,
      "y": -2979.6096085142162,
      "z": -148,
      "radius": 3.3446162844076754,
      "length": 33.334840862497316,
      "seed": 614314790
    },
    {
      "id": "outer-ice-19-underside-spike-8",
      "x": 379.61903840939164,
      "y": -3114.034686470738,
      "z": -148,
      "radius": 12.824115588376298,
      "length": 91,
      "seed": 763041935
    },
    {
      "id": "outer-ice-19-underside-spike-9",
      "x": 402.0488037550507,
      "y": -3129.4838924708956,
      "z": -148,
      "radius": 4.578471092646941,
      "length": 32.75580020233099,
      "seed": 1992698845
    },
    {
      "id": "outer-ice-19-underside-spike-10",
      "x": 376.93020441738724,
      "y": -3079.786832398093,
      "z": -148,
      "radius": 6.407867959141731,
      "length": 41.88060220309647,
      "seed": 865571186
    },
    {
      "id": "outer-ice-19-underside-spike-11",
      "x": 477.5059644797217,
      "y": -2991.395553002958,
      "z": -148,
      "radius": 7.673445678781717,
      "length": 53.334066082739405,
      "seed": 2709665256
    },
    {
      "id": "outer-ice-19-underside-spike-12",
      "x": 461.5095222110519,
      "y": -2967.4552888627436,
      "z": -148,
      "radius": 6.162797519378364,
      "length": 41.190434236998584,
      "seed": 3004451630
    },
    {
      "id": "outer-ice-19-underside-spike-13",
      "x": 375.75733627090847,
      "y": -3021.2956515109345,
      "z": -148,
      "radius": 9.414659603778272,
      "length": 72.35515842446529,
      "seed": 35784388
    },
    {
      "id": "outer-ice-19-underside-spike-14",
      "x": 489.03060775923973,
      "y": -2981.0949253505323,
      "z": -148,
      "radius": 5.546661678096279,
      "length": 44.91610112207698,
      "seed": 1901252165
    },
    {
      "id": "outer-ice-19-underside-spike-15",
      "x": 479.0174704632387,
      "y": -3126.431553674296,
      "z": -148,
      "radius": 8.63832058017142,
      "length": 66.9558227252506,
      "seed": 1992439907
    },
    {
      "id": "outer-ice-19-underside-spike-16",
      "x": 491.9134558538158,
      "y": -3096.8572386150818,
      "z": -148,
      "radius": 6.636184403998777,
      "length": 37.13193682195221,
      "seed": 439694353
    },
    {
      "id": "outer-ice-19-underside-spike-17",
      "x": 425.6671672633195,
      "y": -2984.3329511689235,
      "z": -148,
      "radius": 10.286348738428204,
      "length": 52.5665544558535,
      "seed": 125179776
    },
    {
      "id": "outer-ice-19-underside-spike-18",
      "x": 412.11045989038,
      "y": -3005.684643010058,
      "z": -148,
      "radius": 3.1878277930431067,
      "length": 24.21803910172905,
      "seed": 1470184984
    },
    {
      "id": "outer-ice-19-underside-spike-19",
      "x": 414.92700229939777,
      "y": -3112.7326399201806,
      "z": -148,
      "radius": 14.296525995992123,
      "length": 91,
      "seed": 3375371742
    },
    {
      "id": "outer-ice-20-underside-spike-0",
      "x": 277.9935904060946,
      "y": -3791.808767399895,
      "z": -80,
      "radius": 5.889521169606596,
      "length": 36.08653650373542,
      "seed": 1446148252
    },
    {
      "id": "outer-ice-20-underside-spike-1",
      "x": 250.0357860980088,
      "y": -3679.574366115869,
      "z": -80,
      "radius": 8.721336938291788,
      "length": 46.76635900021067,
      "seed": 258754370
    },
    {
      "id": "outer-ice-20-underside-spike-2",
      "x": 390.6654305665267,
      "y": -3773.7015171574067,
      "z": -80,
      "radius": 4.185750534441322,
      "length": 27.233106614021306,
      "seed": 4195793208
    },
    {
      "id": "outer-ice-20-underside-spike-3",
      "x": 324.48342480632516,
      "y": -3801.911997637659,
      "z": -80,
      "radius": 6.687393757514656,
      "length": 38.49874985040978,
      "seed": 1249071102
    },
    {
      "id": "outer-ice-20-underside-spike-4",
      "x": 254.30791922613741,
      "y": -3720.130560845533,
      "z": -80,
      "radius": 9.847299287784844,
      "length": 61.79263439737742,
      "seed": 1506779412
    },
    {
      "id": "outer-ice-20-underside-spike-5",
      "x": 411.3632110822928,
      "y": -3755.266914968215,
      "z": -80,
      "radius": 10.950159826353193,
      "length": 66.32359950002902,
      "seed": 1186706938
    },
    {
      "id": "outer-ice-20-underside-spike-6",
      "x": 337.6307201137573,
      "y": -3681.2926902044933,
      "z": -80,
      "radius": 12.96722993535921,
      "length": 78.2062616741315,
      "seed": 907373616
    },
    {
      "id": "outer-ice-20-underside-spike-7",
      "x": 379.1833143424371,
      "y": -3788.8520450120272,
      "z": -80,
      "radius": 7.965939914323389,
      "length": 57.08166236574963,
      "seed": 3489715510
    },
    {
      "id": "outer-ice-20-underside-spike-8",
      "x": 387.2545510403659,
      "y": -3675.0184391318094,
      "z": -80,
      "radius": 11.295816864268854,
      "length": 73.75265747810536,
      "seed": 483456479
    },
    {
      "id": "outer-ice-20-underside-spike-9",
      "x": 260.84527405729955,
      "y": -3779.508211950716,
      "z": -80,
      "radius": 9.509045588253066,
      "length": 69.05443647701333,
      "seed": 3150133933
    },
    {
      "id": "outer-ice-20-underside-spike-10",
      "x": 407.59095555104085,
      "y": -3709.018278819238,
      "z": -80,
      "radius": 13.888785091051831,
      "length": 72.96330124571983,
      "seed": 444997515
    },
    {
      "id": "outer-ice-20-underside-spike-11",
      "x": 348.95849338551847,
      "y": -3794.686732574402,
      "z": -80,
      "radius": 8.592403821637854,
      "length": 68.13817298549017,
      "seed": 1777094649
    },
    {
      "id": "outer-ice-20-underside-spike-12",
      "x": 234.22672224868626,
      "y": -3698.4625982892367,
      "z": -80,
      "radius": 7.934345967890695,
      "length": 60.832271386366735,
      "seed": 2234432375
    },
    {
      "id": "outer-ice-20-underside-spike-13",
      "x": 287.6951727817139,
      "y": -3810.8284819392156,
      "z": -80,
      "radius": 3.6759824545215816,
      "length": 31.160101025001435,
      "seed": 768963973
    },
    {
      "id": "outer-ice-20-underside-spike-14",
      "x": 305.4414005247251,
      "y": -3682.637213318038,
      "z": -80,
      "radius": 9.816406253054737,
      "length": 61.76867432702223,
      "seed": 1825082
    },
    {
      "id": "outer-ice-20-underside-spike-15",
      "x": 309.2985970880689,
      "y": -3660.6812110071764,
      "z": -80,
      "radius": 9.235260586570949,
      "length": 73.3927677443742,
      "seed": 1144743280
    },
    {
      "id": "outer-ice-20-underside-spike-16",
      "x": 373.92524823820816,
      "y": -3698.937917730964,
      "z": -80,
      "radius": 10.401753530222923,
      "length": 62.27383111741369,
      "seed": 2994521668
    },
    {
      "id": "outer-ice-20-underside-spike-17",
      "x": 365.69679448646735,
      "y": -3676.556120333182,
      "z": -80,
      "radius": 7.977615011259913,
      "length": 48.14457095759413,
      "seed": 2195486122
    },
    {
      "id": "outer-ice-20-underside-spike-18",
      "x": 289.70014901203507,
      "y": -3791.0220114592316,
      "z": -80,
      "radius": 3.750065552070737,
      "length": 25.00121291869473,
      "seed": 3859496058
    },
    {
      "id": "outer-ice-20-underside-spike-19",
      "x": 252.58480714454478,
      "y": -3743.968881981728,
      "z": -80,
      "radius": 5.995794701837003,
      "length": 39.63954811408496,
      "seed": 4278115822
    },
    {
      "id": "outer-ice-21-underside-spike-0",
      "x": 59.355442348964694,
      "y": -4278.804544313849,
      "z": -97,
      "radius": 8.593009306769817,
      "length": 68.13289723695982,
      "seed": 1008275704
    },
    {
      "id": "outer-ice-21-underside-spike-1",
      "x": 145.0629587098511,
      "y": -4389.343328492659,
      "z": -97,
      "radius": 3.743761888705194,
      "length": 32.018218227350275,
      "seed": 2241214910
    },
    {
      "id": "outer-ice-21-underside-spike-2",
      "x": 66.8303780985899,
      "y": -4249.262759685081,
      "z": -97,
      "radius": 12.795566174481063,
      "length": 72.89274323486268,
      "seed": 1309674708
    },
    {
      "id": "outer-ice-21-underside-spike-3",
      "x": 57.7335759286767,
      "y": -4396.077378958158,
      "z": -97,
      "radius": 13.057084977999327,
      "length": 98.18404448014908,
      "seed": 608375738
    },
    {
      "id": "outer-ice-21-underside-spike-4",
      "x": 26.274192300330128,
      "y": -4360.791127893295,
      "z": -97,
      "radius": 9.799075467791408,
      "length": 72.87963678625782,
      "seed": 842378224
    },
    {
      "id": "outer-ice-21-underside-spike-5",
      "x": 36.145368548660294,
      "y": -4392.580320996026,
      "z": -97,
      "radius": 4.325587524427101,
      "length": 34.43418746988338,
      "seed": 2719546465
    },
    {
      "id": "outer-ice-21-underside-spike-6",
      "x": 174.6719090722334,
      "y": -4375.127326919988,
      "z": -97,
      "radius": 6.1919993022456765,
      "length": 37.260676760412196,
      "seed": 3583553734
    },
    {
      "id": "outer-ice-21-underside-spike-7",
      "x": 191.86495207493107,
      "y": -4297.098771111603,
      "z": -97,
      "radius": 13.756752121914177,
      "length": 105.99644120426686,
      "seed": 1381884316
    },
    {
      "id": "outer-ice-21-underside-spike-8",
      "x": 159.23550999911774,
      "y": -4374.442848209938,
      "z": -97,
      "radius": 6.479971615690737,
      "length": 40.77096803031971,
      "seed": 2904255724
    },
    {
      "id": "outer-ice-21-underside-spike-9",
      "x": 40.168789174972055,
      "y": -4301.888516175451,
      "z": -97,
      "radius": 5.776066325604916,
      "length": 39.32387638832313,
      "seed": 1093334290
    },
    {
      "id": "outer-ice-21-underside-spike-10",
      "x": 8.620634311108859,
      "y": -4314.483038332186,
      "z": -97,
      "radius": 12.215772899519651,
      "length": 63.61035902855001,
      "seed": 2632938632
    },
    {
      "id": "outer-ice-21-underside-spike-11",
      "x": 135.529984170186,
      "y": -4407.897508195261,
      "z": -97,
      "radius": 8.567980114929377,
      "length": 54.17465143697975,
      "seed": 600755406
    },
    {
      "id": "outer-ice-21-underside-spike-12",
      "x": 105.05060971267181,
      "y": -4247.848446831027,
      "z": -97,
      "radius": 9.82566832685843,
      "length": 68.59961082743222,
      "seed": 639628132
    },
    {
      "id": "outer-ice-21-underside-spike-13",
      "x": 182.2377721939098,
      "y": -4349.001149498679,
      "z": -97,
      "radius": 10.4142300310079,
      "length": 55.31159769872837,
      "seed": 1943115367
    },
    {
      "id": "outer-ice-21-underside-spike-14",
      "x": 166.70753550350886,
      "y": -4281.180905942091,
      "z": -97,
      "radius": 4.117013394227252,
      "length": 31.897311909330156,
      "seed": 2277772533
    },
    {
      "id": "outer-ice-21-underside-spike-15",
      "x": 149.47548073919893,
      "y": -4295.103571445176,
      "z": -97,
      "radius": 8.963504287227988,
      "length": 52.61172818411683,
      "seed": 496296810
    },
    {
      "id": "outer-ice-21-underside-spike-16",
      "x": 133.8336809373308,
      "y": -4276.86855918375,
      "z": -97,
      "radius": 9.517064699018373,
      "length": 52.09875685793092,
      "seed": 3932594327
    },
    {
      "id": "outer-ice-21-underside-spike-17",
      "x": 21.49879980581869,
      "y": -4334.960279103953,
      "z": -97,
      "radius": 5.866966755827889,
      "length": 47.87346173192814,
      "seed": 3273345445
    },
    {
      "id": "outer-ice-21-underside-spike-18",
      "x": 172.01093571956392,
      "y": -4397.788083206721,
      "z": -97,
      "radius": 7.880276551237329,
      "length": 44.46091223538771,
      "seed": 3300195125
    },
    {
      "id": "outer-ice-21-underside-spike-19",
      "x": 204.98455838526905,
      "y": -4382.368366028944,
      "z": -97,
      "radius": 12.341748392209409,
      "length": 93.9034838039259,
      "seed": 2378397354
    },
    {
      "id": "outer-ice-22-underside-spike-0",
      "x": -152.33015849812307,
      "y": -4846.408040837953,
      "z": -114,
      "radius": 15.011728157568722,
      "length": 86.25840296244962,
      "seed": 3296744588
    },
    {
      "id": "outer-ice-22-underside-spike-1",
      "x": -235.83212894263778,
      "y": -4917.939982752893,
      "z": -114,
      "radius": 11.020636092424393,
      "length": 79.35923686060615,
      "seed": 334010290
    },
    {
      "id": "outer-ice-22-underside-spike-2",
      "x": -227.14974006234613,
      "y": -4958.287011687508,
      "z": -114,
      "radius": 12.643210926633328,
      "length": 76.3629083587122,
      "seed": 745159208
    },
    {
      "id": "outer-ice-22-underside-spike-3",
      "x": -180.8928838181981,
      "y": -4824.685398292511,
      "z": -114,
      "radius": 10.074402390830219,
      "length": 55.76858913010297,
      "seed": 656792942
    },
    {
      "id": "outer-ice-22-underside-spike-4",
      "x": -117.96426307134945,
      "y": -4977.58118784776,
      "z": -114,
      "radius": 9.625093147549778,
      "length": 64.8752385470221,
      "seed": 3353818884
    },
    {
      "id": "outer-ice-22-underside-spike-5",
      "x": -225.493273880883,
      "y": -4852.772558654919,
      "z": -114,
      "radius": 9.592565849041566,
      "length": 51.414915990840676,
      "seed": 1600981893
    },
    {
      "id": "outer-ice-22-underside-spike-6",
      "x": -253.9528807785395,
      "y": -4955.742747850556,
      "z": -114,
      "radius": 5.896660273941233,
      "length": 40.05619651736894,
      "seed": 113834915
    },
    {
      "id": "outer-ice-22-underside-spike-7",
      "x": -97.80256557616713,
      "y": -4847.887260296565,
      "z": -114,
      "radius": 9.610558543084188,
      "length": 53.846371033798086,
      "seed": 2667892049
    },
    {
      "id": "outer-ice-22-underside-spike-8",
      "x": -147.14325651108902,
      "y": -4970.551921455561,
      "z": -114,
      "radius": 4.89180167902261,
      "length": 40.57088151968822,
      "seed": 1910645366
    },
    {
      "id": "outer-ice-22-underside-spike-9",
      "x": -86.28893248416608,
      "y": -4967.776633756531,
      "z": -114,
      "radius": 12.668510859394445,
      "length": 82.18601642451658,
      "seed": 1044788255
    },
    {
      "id": "outer-ice-22-underside-spike-10",
      "x": -278.2387599110351,
      "y": -4919.181329543047,
      "z": -114,
      "radius": 3.507837808448821,
      "length": 33.60630820983086,
      "seed": 774324508
    },
    {
      "id": "outer-ice-22-underside-spike-11",
      "x": -268.661251427845,
      "y": -4886.592470264113,
      "z": -114,
      "radius": 15.224486034661531,
      "length": 95.0451804306431,
      "seed": 3885902786
    },
    {
      "id": "outer-ice-22-underside-spike-12",
      "x": -62.61245291860429,
      "y": -4866.146486710384,
      "z": -114,
      "radius": 4.049770995508879,
      "length": 28.857089801129572,
      "seed": 667539896
    },
    {
      "id": "outer-ice-22-underside-spike-13",
      "x": -55.25978472243885,
      "y": -4929.893626481685,
      "z": -114,
      "radius": 12.043368954705073,
      "length": 76.7270767218131,
      "seed": 1144525803
    },
    {
      "id": "outer-ice-22-underside-spike-14",
      "x": -167.10265160472116,
      "y": -4978.082713023604,
      "z": -114,
      "radius": 12.24495478590019,
      "length": 64.1001143313189,
      "seed": 1419341563
    },
    {
      "id": "outer-ice-22-underside-spike-15",
      "x": -268.5578370536534,
      "y": -4917.610189402013,
      "z": -114,
      "radius": 4.180147613631561,
      "length": 27.699049598089637,
      "seed": 2648559115
    },
    {
      "id": "outer-ice-22-underside-spike-16",
      "x": -77.8283257716028,
      "y": -4948.644743477134,
      "z": -114,
      "radius": 3.6666323204152285,
      "length": 33.6381549776837,
      "seed": 1852365560
    },
    {
      "id": "outer-ice-22-underside-spike-17",
      "x": -135.04404321306262,
      "y": -4998.185497470998,
      "z": -114,
      "radius": 3.5013888350967317,
      "length": 28.466035368858478,
      "seed": 2870961311
    },
    {
      "id": "outer-ice-22-underside-spike-18",
      "x": -118.26018628102894,
      "y": -4862.895790677114,
      "z": -114,
      "radius": 3.854689414193854,
      "length": 31.458046609737302,
      "seed": 3612918637
    },
    {
      "id": "outer-ice-22-underside-spike-19",
      "x": -198.58337966909173,
      "y": -4974.241346699277,
      "z": -114,
      "radius": 12.272283313712105,
      "length": 76.78432643963666,
      "seed": 3628599037
    },
    {
      "id": "outer-ice-23-underside-spike-0",
      "x": -942.5813059793493,
      "y": -5032.188719590167,
      "z": -131,
      "radius": 13.538719814177604,
      "length": 104.343672016844,
      "seed": 4133983888
    },
    {
      "id": "outer-ice-23-underside-spike-1",
      "x": -1026.091608502595,
      "y": -5166.411100791728,
      "z": -131,
      "radius": 16.307650459595024,
      "length": 107.74100112915039,
      "seed": 170079382
    },
    {
      "id": "outer-ice-23-underside-spike-2",
      "x": -887.4616757305276,
      "y": -5179.705155454792,
      "z": -131,
      "radius": 7.365637074876577,
      "length": 53.36303674787354,
      "seed": 3481289452
    },
    {
      "id": "outer-ice-23-underside-spike-3",
      "x": -975.7100326371171,
      "y": -5041.028571635854,
      "z": -131,
      "radius": 15.302856059968473,
      "length": 101.73441629650029,
      "seed": 1527094034
    },
    {
      "id": "outer-ice-23-underside-spike-4",
      "x": -1055.5151312804285,
      "y": -5055.840707605956,
      "z": -131,
      "radius": 15.515069527477028,
      "length": 108.582594871521,
      "seed": 3227737058
    },
    {
      "id": "outer-ice-23-underside-spike-5",
      "x": -1039.2049321454724,
      "y": -5098.5134901139845,
      "z": -131,
      "radius": 12.537569139730186,
      "length": 78.49137066228039,
      "seed": 4234731736
    },
    {
      "id": "outer-ice-23-underside-spike-6",
      "x": -973.0527742944187,
      "y": -5196.10637396595,
      "z": -131,
      "radius": 4.972299528680741,
      "length": 31.77368706321777,
      "seed": 3542364830
    },
    {
      "id": "outer-ice-23-underside-spike-7",
      "x": -1018.0153532950396,
      "y": -5038.757877865819,
      "z": -131,
      "radius": 10.650094178421423,
      "length": 53.7266634868256,
      "seed": 3395005177
    },
    {
      "id": "outer-ice-23-underside-spike-8",
      "x": -992.305594412422,
      "y": -5167.977919647043,
      "z": -131,
      "radius": 11.080621915021911,
      "length": 80.96289248781669,
      "seed": 1199930999
    },
    {
      "id": "outer-ice-23-underside-spike-9",
      "x": -908.5802692939598,
      "y": -5041.017547682117,
      "z": -131,
      "radius": 12.612158217234537,
      "length": 92.31710041289382,
      "seed": 300563481
    },
    {
      "id": "outer-ice-23-underside-spike-10",
      "x": -1052.4040184350988,
      "y": -5139.805463108468,
      "z": -131,
      "radius": 15.059899097643793,
      "length": 105.53720362598273,
      "seed": 353941982
    },
    {
      "id": "outer-ice-23-underside-spike-11",
      "x": -867.5980993843104,
      "y": -5179.027869702374,
      "z": -131,
      "radius": 4.4603730809781705,
      "length": 31.208948285654333,
      "seed": 241980583
    },
    {
      "id": "outer-ice-23-underside-spike-12",
      "x": -871.3191107211218,
      "y": -5045.730644190676,
      "z": -131,
      "radius": 4.036614691112191,
      "length": 32.72696683560817,
      "seed": 3029689668
    },
    {
      "id": "outer-ice-23-underside-spike-13",
      "x": -956.4461002899463,
      "y": -5175.3794283053785,
      "z": -131,
      "radius": 3.1734539475291967,
      "length": 28.53607896397444,
      "seed": 1223515306
    },
    {
      "id": "outer-ice-23-underside-spike-14",
      "x": -867.8971522382141,
      "y": -5128.054249929412,
      "z": -131,
      "radius": 12.075187700511888,
      "length": 85.33863134253902,
      "seed": 1168778467
    },
    {
      "id": "outer-ice-23-underside-spike-15",
      "x": -923.51887379682,
      "y": -5018.8123418608375,
      "z": -131,
      "radius": 3.9997154653351754,
      "length": 31.339648046497818,
      "seed": 2638486673
    },
    {
      "id": "outer-ice-23-underside-spike-16",
      "x": -1005.0067649795275,
      "y": -5188.209413802504,
      "z": -131,
      "radius": 8.399045441038908,
      "length": 48.54349468268752,
      "seed": 663210678
    },
    {
      "id": "outer-ice-23-underside-spike-17",
      "x": -843.7594591458522,
      "y": -5112.4433768222625,
      "z": -131,
      "radius": 7.86864780401811,
      "length": 47.55301237102545,
      "seed": 3085328976
    },
    {
      "id": "outer-ice-23-underside-spike-18",
      "x": -1024.706848192892,
      "y": -5112.430337648203,
      "z": -131,
      "radius": 5.348122821925209,
      "length": 37.13522435097596,
      "seed": 3398409793
    },
    {
      "id": "outer-ice-23-underside-spike-19",
      "x": -869.3233917293088,
      "y": -5021.2983191130625,
      "z": -131,
      "radius": 4.106824932033196,
      "length": 32.415881513994506,
      "seed": 2838273407
    },
    {
      "id": "outer-ice-24-underside-spike-0",
      "x": -1795.5755122331602,
      "y": -5276.41520669798,
      "z": -148,
      "radius": 3.129635243956,
      "length": 27.663514282207814,
      "seed": 3731568780
    },
    {
      "id": "outer-ice-24-underside-spike-1",
      "x": -1822.3793106091669,
      "y": -5272.525210194756,
      "z": -148,
      "radius": 3.6415436804294585,
      "length": 33.23653575200993,
      "seed": 3041876914
    },
    {
      "id": "outer-ice-24-underside-spike-2",
      "x": -1779.0878164210715,
      "y": -5150.012989546141,
      "z": -148,
      "radius": 10.859337313380092,
      "length": 73.917160987854,
      "seed": 2400575016
    },
    {
      "id": "outer-ice-24-underside-spike-3",
      "x": -1742.8175645502404,
      "y": -5198.537349313318,
      "z": -148,
      "radius": 14.790781286917628,
      "length": 73.917160987854,
      "seed": 1465344366
    },
    {
      "id": "outer-ice-24-underside-spike-4",
      "x": -1744.6361847625449,
      "y": -5168.794662717714,
      "z": -148,
      "radius": 5.168956857221201,
      "length": 45.25060489446396,
      "seed": 1328829815
    },
    {
      "id": "outer-ice-24-underside-spike-5",
      "x": -1952.7505914511983,
      "y": -5192.120486978398,
      "z": -148,
      "radius": 7.581001922814176,
      "length": 49.36074374717507,
      "seed": 3460677509
    },
    {
      "id": "outer-ice-24-underside-spike-6",
      "x": -1840.162733249885,
      "y": -5135.222204410317,
      "z": -148,
      "radius": 11.795313130924479,
      "length": 62.43014146161124,
      "seed": 2502627235
    },
    {
      "id": "outer-ice-24-underside-spike-7",
      "x": -1914.9568571492107,
      "y": -5162.461338390926,
      "z": -148,
      "radius": 4.860663454374299,
      "length": 33.55744889209939,
      "seed": 2137866577
    },
    {
      "id": "outer-ice-24-underside-spike-8",
      "x": -1928.8109933838034,
      "y": -5225.219728881366,
      "z": -148,
      "radius": 5.05273536038585,
      "length": 38.76048193293687,
      "seed": 2686784527
    },
    {
      "id": "outer-ice-24-underside-spike-9",
      "x": -1762.33553138599,
      "y": -5257.550923848222,
      "z": -148,
      "radius": 11.547422608081252,
      "length": 61.39721270379395,
      "seed": 1177931212
    },
    {
      "id": "outer-ice-24-underside-spike-10",
      "x": -1938.676960862752,
      "y": -5150.829867067814,
      "z": -148,
      "radius": 8.906517872214318,
      "length": 49.72885035343975,
      "seed": 2209724146
    },
    {
      "id": "outer-ice-24-underside-spike-11",
      "x": -1889.937377757486,
      "y": -5252.095269965754,
      "z": -148,
      "radius": 6.083944896608591,
      "length": 47.87489194695995,
      "seed": 3813273538
    },
    {
      "id": "outer-ice-24-underside-spike-12",
      "x": -1905.3773480338045,
      "y": -5283.51868850294,
      "z": -148,
      "radius": 6.659766911622137,
      "length": 38.631649438611774,
      "seed": 676494776
    },
    {
      "id": "outer-ice-24-underside-spike-13",
      "x": -1798.7555386017411,
      "y": -5126.764213991035,
      "z": -148,
      "radius": 13.150322687393055,
      "length": 73.07222938537598,
      "seed": 2747142857
    },
    {
      "id": "outer-ice-24-underside-spike-14",
      "x": -1873.7489976277875,
      "y": -5127.886382149477,
      "z": -148,
      "radius": 10.14932934846729,
      "length": 59.183419548632855,
      "seed": 2948734030
    },
    {
      "id": "outer-ice-24-underside-spike-15",
      "x": -1930.1441842718828,
      "y": -5199.745796006314,
      "z": -148,
      "radius": 4.664700153283775,
      "length": 37.46127507270161,
      "seed": 2138905630
    },
    {
      "id": "outer-ice-24-underside-spike-16",
      "x": -1761.3855284926701,
      "y": -5234.647023128351,
      "z": -148,
      "radius": 9.02324792300351,
      "length": 69.64518985945841,
      "seed": 2225466343
    },
    {
      "id": "outer-ice-24-underside-spike-17",
      "x": -1838.0002244741117,
      "y": -5266.502122996447,
      "z": -148,
      "radius": 9.640580837242306,
      "length": 53.75115383618894,
      "seed": 2376972222
    },
    {
      "id": "outer-ice-24-underside-spike-18",
      "x": -1912.4962143638727,
      "y": -5245.5979279259855,
      "z": -148,
      "radius": 5.6938054514117535,
      "length": 49.827858665384106,
      "seed": 3323337428
    },
    {
      "id": "outer-ice-24-underside-spike-19",
      "x": -1850.2503318555464,
      "y": -5286.614431281572,
      "z": -148,
      "radius": 10.981269399728626,
      "length": 54.65395056187331,
      "seed": 1749742056
    },
    {
      "id": "outer-ice-25-underside-spike-0",
      "x": -2814.7310802337056,
      "y": -5205.596166341246,
      "z": -80,
      "radius": 4.995813949685544,
      "length": 42.44274883992799,
      "seed": 3939576016
    },
    {
      "id": "outer-ice-25-underside-spike-1",
      "x": -2975.072716348579,
      "y": -5146.378178415744,
      "z": -80,
      "radius": 3.085308528877795,
      "length": 31.219389385843716,
      "seed": 2139120854
    },
    {
      "id": "outer-ice-25-underside-spike-2",
      "x": -2777.4909574871317,
      "y": -5187.075251052448,
      "z": -80,
      "radius": 15.766840536240489,
      "length": 113.86003025950359,
      "seed": 725000492
    },
    {
      "id": "outer-ice-25-underside-spike-3",
      "x": -2754.7331489276035,
      "y": -5110.059775962212,
      "z": -80,
      "radius": 5.271920366585254,
      "length": 33.73043594735181,
      "seed": 572143442
    },
    {
      "id": "outer-ice-25-underside-spike-4",
      "x": -2722.6164094965993,
      "y": -5154.323190407718,
      "z": -80,
      "radius": 12.244848379399627,
      "length": 61.92470064287843,
      "seed": 3167278280
    },
    {
      "id": "outer-ice-25-underside-spike-5",
      "x": -2857.450909350881,
      "y": -5230.3812148850475,
      "z": -80,
      "radius": 8.781932657025756,
      "length": 70.54507560585674,
      "seed": 2854476558
    },
    {
      "id": "outer-ice-25-underside-spike-6",
      "x": -2915.3511505190245,
      "y": -5203.043310726775,
      "z": -80,
      "radius": 8.798297705221922,
      "length": 68.42360889143151,
      "seed": 3787571108
    },
    {
      "id": "outer-ice-25-underside-spike-7",
      "x": -2739.5643918237956,
      "y": -5124.324161800121,
      "z": -80,
      "radius": 3.480573635129258,
      "length": 33.82509519273202,
      "seed": 1840084133
    },
    {
      "id": "outer-ice-25-underside-spike-8",
      "x": -2961.4617298710355,
      "y": -5113.990412821503,
      "z": -80,
      "radius": 6.313187605747953,
      "length": 44.389299332424024,
      "seed": 941503427
    },
    {
      "id": "outer-ice-25-underside-spike-9",
      "x": -2822.6055427403717,
      "y": -5061.8859860451585,
      "z": -80,
      "radius": 3.37494328035973,
      "length": 24.02911008774079,
      "seed": 1669962865
    },
    {
      "id": "outer-ice-25-underside-spike-10",
      "x": -2995.3829442721194,
      "y": -5133.3137124135255,
      "z": -80,
      "radius": 4.859323266567662,
      "length": 38.64678981011093,
      "seed": 1774202415
    },
    {
      "id": "outer-ice-25-underside-spike-11",
      "x": -2864.2110709643134,
      "y": -5205.99818698645,
      "z": -80,
      "radius": 9.345543442619965,
      "length": 59.48376880927056,
      "seed": 3127970941
    },
    {
      "id": "outer-ice-25-underside-spike-12",
      "x": -2734.002070053565,
      "y": -5084.944341617364,
      "z": -80,
      "radius": 10.943421045178548,
      "length": 81.30581811956611,
      "seed": 592961243
    },
    {
      "id": "outer-ice-25-underside-spike-13",
      "x": -2750.532505764672,
      "y": -5154.890154514769,
      "z": -80,
      "radius": 3.1265880940016357,
      "length": 22.57765632335962,
      "seed": 3324227785
    },
    {
      "id": "outer-ice-25-underside-spike-14",
      "x": -2853.771658078359,
      "y": -5061.534691724689,
      "z": -80,
      "radius": 12.076008935831487,
      "length": 59.962263231268025,
      "seed": 3409039950
    },
    {
      "id": "outer-ice-25-underside-spike-15",
      "x": -2954.7128802610664,
      "y": -5204.282803415819,
      "z": -80,
      "radius": 9.774657122092322,
      "length": 53.78172780020848,
      "seed": 1485771735
    },
    {
      "id": "outer-ice-25-underside-spike-16",
      "x": -2954.46997196661,
      "y": -5161.875561431809,
      "z": -80,
      "radius": 6.006055211042986,
      "length": 49.57193844112991,
      "seed": 1314618489
    },
    {
      "id": "outer-ice-25-underside-spike-17",
      "x": -2701.492402158472,
      "y": -5110.586665528138,
      "z": -80,
      "radius": 10.313203112594785,
      "length": 62.61690821939157,
      "seed": 193850814
    },
    {
      "id": "outer-ice-25-underside-spike-18",
      "x": -2899.656899790691,
      "y": -5227.670095063138,
      "z": -80,
      "radius": 7.565486450213939,
      "length": 61.95726166844155,
      "seed": 3621331156
    },
    {
      "id": "outer-ice-25-underside-spike-19",
      "x": -2948.856999615014,
      "y": -5077.572858363919,
      "z": -80,
      "radius": 12.303297967789694,
      "length": 64.31524427683686,
      "seed": 1831011221
    },
    {
      "id": "outer-ice-26-underside-spike-0",
      "x": -3972.417995053653,
      "y": -5122.076672391875,
      "z": -97,
      "radius": 17.259470133874565,
      "length": 122.63311532547183,
      "seed": 4242754684
    },
    {
      "id": "outer-ice-26-underside-spike-1",
      "x": -3894.7383266092265,
      "y": -4970.380217174448,
      "z": -97,
      "radius": 11.126622307151555,
      "length": 63.0570011464138,
      "seed": 989733922
    },
    {
      "id": "outer-ice-26-underside-spike-2",
      "x": -3812.243982630996,
      "y": -4963.785748125411,
      "z": -97,
      "radius": 13.659854081030934,
      "length": 87.80177539953449,
      "seed": 2685540120
    },
    {
      "id": "outer-ice-26-underside-spike-3",
      "x": -3723.6212977085556,
      "y": -5072.885869068802,
      "z": -97,
      "radius": 9.53378372233361,
      "length": 55.160670877028444,
      "seed": 1470555870
    },
    {
      "id": "outer-ice-26-underside-spike-4",
      "x": -3747.1379176409846,
      "y": -5127.762429072231,
      "z": -97,
      "radius": 16.24897650601342,
      "length": 118.9353107933748,
      "seed": 1196321012
    },
    {
      "id": "outer-ice-26-underside-spike-5",
      "x": -3952.981201846684,
      "y": -5069.254583052505,
      "z": -97,
      "radius": 18.622839719429614,
      "length": 103.52280683092405,
      "seed": 3513444058
    },
    {
      "id": "outer-ice-26-underside-spike-6",
      "x": -3782.746163170707,
      "y": -4969.97949305669,
      "z": -97,
      "radius": 11.220471890252083,
      "length": 74.93336414950362,
      "seed": 2957671952
    },
    {
      "id": "outer-ice-26-underside-spike-7",
      "x": -3916.875523308244,
      "y": -4994.077433095243,
      "z": -97,
      "radius": 16.907355886436996,
      "length": 125.21478975043091,
      "seed": 1756332054
    },
    {
      "id": "outer-ice-26-underside-spike-8",
      "x": -3768.681340058088,
      "y": -4998.338704024,
      "z": -97,
      "radius": 13.030980849210172,
      "length": 93.82854872491184,
      "seed": 2619200108
    },
    {
      "id": "outer-ice-26-underside-spike-9",
      "x": -3802.720312201403,
      "y": -5142.8101528872985,
      "z": -97,
      "radius": 7.039610732495785,
      "length": 53.10484781619893,
      "seed": 1921339026
    },
    {
      "id": "outer-ice-26-underside-spike-10",
      "x": -3708.8624387281898,
      "y": -5050.288555132052,
      "z": -97,
      "radius": 4.435987534727901,
      "length": 40.32575808561336,
      "seed": 3089179144
    },
    {
      "id": "outer-ice-26-underside-spike-11",
      "x": -3717.4882628186424,
      "y": -5106.264601402497,
      "z": -97,
      "radius": 13.055595489498227,
      "length": 68.18496602667032,
      "seed": 1732802648
    },
    {
      "id": "outer-ice-26-underside-spike-12",
      "x": -3952.014949271586,
      "y": -5020.306899821419,
      "z": -97,
      "radius": 17.83061634474434,
      "length": 87.93144493453347,
      "seed": 931478539
    },
    {
      "id": "outer-ice-26-underside-spike-13",
      "x": -3833.367952094523,
      "y": -4942.011133697411,
      "z": -97,
      "radius": 4.646757193570957,
      "length": 35.0327347664773,
      "seed": 2963073145
    },
    {
      "id": "outer-ice-26-underside-spike-14",
      "x": -3930.6179590030597,
      "y": -5148.695672844237,
      "z": -97,
      "radius": 9.620165253030136,
      "length": 72.27182266239294,
      "seed": 473559031
    },
    {
      "id": "outer-ice-26-underside-spike-15",
      "x": -3934.3209628805835,
      "y": -4977.7566276576335,
      "z": -97,
      "radius": 3.618169404147193,
      "length": 31.058869110846288,
      "seed": 1320379909
    },
    {
      "id": "outer-ice-26-underside-spike-16",
      "x": -3781.5163949074285,
      "y": -5107.91683604257,
      "z": -97,
      "radius": 11.167420131722464,
      "length": 60.26563185288874,
      "seed": 1132552739
    },
    {
      "id": "outer-ice-26-underside-spike-17",
      "x": -3751.661607992266,
      "y": -5056.213066722418,
      "z": -97,
      "radius": 7.197331220498309,
      "length": 40.30129802994202,
      "seed": 517988305
    },
    {
      "id": "outer-ice-26-underside-spike-18",
      "x": -3742.8107585269777,
      "y": -5012.798539882471,
      "z": -97,
      "radius": 7.76034823355265,
      "length": 54.658201638310985,
      "seed": 1262657167
    },
    {
      "id": "outer-ice-26-underside-spike-19",
      "x": -3868.045982508595,
      "y": -4975.919722642936,
      "z": -97,
      "radius": 8.979234202606603,
      "length": 54.48847657777865,
      "seed": 3402760669
    },
    {
      "id": "outer-ice-27-underside-spike-0",
      "x": 418.21818188493404,
      "y": 3091.709279130799,
      "z": -114,
      "radius": 12.931594473402946,
      "length": 97.73751966519019,
      "seed": 2546418008
    },
    {
      "id": "outer-ice-27-underside-spike-1",
      "x": 538.9545257240605,
      "y": 3007.1286989869404,
      "z": -114,
      "radius": 7.6931314548477525,
      "length": 61.27280868786985,
      "seed": 1494544158
    },
    {
      "id": "outer-ice-27-underside-spike-2",
      "x": 442.3501841409924,
      "y": 3000.010042499469,
      "z": -114,
      "radius": 4.014274503383786,
      "length": 31.295641503303074,
      "seed": 3860913972
    },
    {
      "id": "outer-ice-27-underside-spike-3",
      "x": 541.0506689220218,
      "y": 3053.9895479163556,
      "z": -114,
      "radius": 3.0256873179227113,
      "length": 29.96479089913944,
      "seed": 1597823770
    },
    {
      "id": "outer-ice-27-underside-spike-4",
      "x": 426.09188932390686,
      "y": 3124.8155787206492,
      "z": -114,
      "radius": 12.551391505496575,
      "length": 64.9515166064813,
      "seed": 3357409811
    },
    {
      "id": "outer-ice-27-underside-spike-5",
      "x": 497.566993491478,
      "y": 2999.237738319167,
      "z": -114,
      "radius": 11.453047883464022,
      "length": 87.21583954050854,
      "seed": 2444219457
    },
    {
      "id": "outer-ice-27-underside-spike-6",
      "x": 444.5353223727561,
      "y": 2984.1016717356683,
      "z": -114,
      "radius": 8.157310058036819,
      "length": 43.950571247388226,
      "seed": 707765119
    },
    {
      "id": "outer-ice-27-underside-spike-7",
      "x": 409.3876851688626,
      "y": 3029.851812634206,
      "z": -114,
      "radius": 6.318191800033674,
      "length": 47.073031127646274,
      "seed": 1901917005
    },
    {
      "id": "outer-ice-27-underside-spike-8",
      "x": 526.4406526895303,
      "y": 2989.6412323000363,
      "z": -114,
      "radius": 8.148559492081404,
      "length": 51.77151383089249,
      "seed": 4250045346
    },
    {
      "id": "outer-ice-27-underside-spike-9",
      "x": 544.26917059672,
      "y": 3101.851001968568,
      "z": -114,
      "radius": 5.641535130143165,
      "length": 38.138903026124495,
      "seed": 667857010
    },
    {
      "id": "outer-ice-27-underside-spike-10",
      "x": 529.9433974565554,
      "y": 3089.7586279722836,
      "z": -114,
      "radius": 4.431285155843943,
      "length": 35.20608990061283,
      "seed": 2828901608
    },
    {
      "id": "outer-ice-27-underside-spike-11",
      "x": 510.01415656640967,
      "y": 3110.8747588308847,
      "z": -114,
      "radius": 11.126351508311926,
      "length": 76.56939383439499,
      "seed": 3614947886
    },
    {
      "id": "outer-ice-27-underside-spike-12",
      "x": 468.83910674885027,
      "y": 3120.8694117626765,
      "z": -114,
      "radius": 7.120408054534345,
      "length": 59.6707461363969,
      "seed": 4016258500
    },
    {
      "id": "outer-ice-27-underside-spike-13",
      "x": 409.9188698548936,
      "y": 3061.9210252009275,
      "z": -114,
      "radius": 4.11295224535279,
      "length": 32.21791989152497,
      "seed": 3344361689
    },
    {
      "id": "outer-ice-27-underside-spike-14",
      "x": 497.20009666925733,
      "y": 3133.1134948478434,
      "z": -114,
      "radius": 9.291659669112413,
      "length": 62.0868537956633,
      "seed": 690277928
    },
    {
      "id": "outer-ice-27-underside-spike-15",
      "x": 434.67788095343536,
      "y": 3106.7274880853665,
      "z": -114,
      "radius": 3.345149707607925,
      "length": 32.190870122169486,
      "seed": 2994917742
    },
    {
      "id": "outer-ice-27-underside-spike-16",
      "x": 424.602370315049,
      "y": 3022.272640735164,
      "z": -114,
      "radius": 5.255617780471221,
      "length": 33.618765320977815,
      "seed": 115508599
    },
    {
      "id": "outer-ice-27-underside-spike-17",
      "x": 534.1416969621449,
      "y": 3071.3384101408487,
      "z": -114,
      "radius": 5.66983965053223,
      "length": 34.37356197331654,
      "seed": 1443262341
    },
    {
      "id": "outer-ice-27-underside-spike-18",
      "x": 452.01276075518206,
      "y": 3131.599880986325,
      "z": -114,
      "radius": 9.684645444201305,
      "length": 71.03667273187637,
      "seed": 189415331
    },
    {
      "id": "outer-ice-27-underside-spike-19",
      "x": 419.7717370899905,
      "y": 3008.6089287424306,
      "z": -114,
      "radius": 5.411448951205239,
      "length": 35.286675323291064,
      "seed": 2230085285
    },
    {
      "id": "outer-ice-28-underside-spike-0",
      "x": 391.22360843263056,
      "y": 3704.705005442472,
      "z": -131,
      "radius": 12.503148917946964,
      "length": 60.04868970214403,
      "seed": 4081642252
    },
    {
      "id": "outer-ice-28-underside-spike-1",
      "x": 284.3329699742558,
      "y": 3780.5271824720226,
      "z": -131,
      "radius": 6.149799836156889,
      "length": 37.69123306197576,
      "seed": 3863361837
    },
    {
      "id": "outer-ice-28-underside-spike-2",
      "x": 292.60290934318243,
      "y": 3685.316206205875,
      "z": -131,
      "radius": 3.751202422985807,
      "length": 28.293277298622623,
      "seed": 2721647115
    },
    {
      "id": "outer-ice-28-underside-spike-3",
      "x": 240.12017492353277,
      "y": 3748.946900829749,
      "z": -131,
      "radius": 4.6867446288373324,
      "length": 29.907305398946352,
      "seed": 3786983033
    },
    {
      "id": "outer-ice-28-underside-spike-4",
      "x": 411.0300279315763,
      "y": 3803.9196452393385,
      "z": -131,
      "radius": 6.4088216913957154,
      "length": 47.50874294959538,
      "seed": 3727252983
    },
    {
      "id": "outer-ice-28-underside-spike-5",
      "x": 276.82382338986,
      "y": 3718.283247882007,
      "z": -131,
      "radius": 13.10693624923937,
      "length": 90.6513264498329,
      "seed": 1680204805
    },
    {
      "id": "outer-ice-28-underside-spike-6",
      "x": 411.96592399573694,
      "y": 3749.37612652154,
      "z": -131,
      "radius": 8.824742332929745,
      "length": 46.776827953958644,
      "seed": 1078620195
    },
    {
      "id": "outer-ice-28-underside-spike-7",
      "x": 320.9690356063739,
      "y": 3781.792002804927,
      "z": -131,
      "radius": 8.28361340395175,
      "length": 50.55118926382642,
      "seed": 3788963281
    },
    {
      "id": "outer-ice-28-underside-spike-8",
      "x": 373.36627304753137,
      "y": 3666.6845871278038,
      "z": -131,
      "radius": 12.301133768202863,
      "length": 61.56158031588304,
      "seed": 2471838554
    },
    {
      "id": "outer-ice-28-underside-spike-9",
      "x": 355.2341971626054,
      "y": 3804.7751689213965,
      "z": -131,
      "radius": 13.596138377655297,
      "length": 77.57328938224936,
      "seed": 1323221012
    },
    {
      "id": "outer-ice-28-underside-spike-10",
      "x": 445.03188453673806,
      "y": 3742.9448572307565,
      "z": -131,
      "radius": 12.03948691137135,
      "length": 74.46091012066942,
      "seed": 3656326394
    },
    {
      "id": "outer-ice-28-underside-spike-11",
      "x": 358.62619105847307,
      "y": 3688.9908456872254,
      "z": -131,
      "radius": 6.869775575827807,
      "length": 45.11930630771807,
      "seed": 131128112
    },
    {
      "id": "outer-ice-28-underside-spike-12",
      "x": 269.91179160229956,
      "y": 3751.4419590273524,
      "z": -131,
      "radius": 11.785492886155843,
      "length": 70.88369701380131,
      "seed": 527542050
    },
    {
      "id": "outer-ice-28-underside-spike-13",
      "x": 329.61782246706423,
      "y": 3685.357267701909,
      "z": -131,
      "radius": 5.441182157602161,
      "length": 36.05301547462915,
      "seed": 1081721368
    },
    {
      "id": "outer-ice-28-underside-spike-14",
      "x": 415.01676429362004,
      "y": 3702.3250326110924,
      "z": -131,
      "radius": 8.987798924585803,
      "length": 62.50160629547105,
      "seed": 3528858281
    },
    {
      "id": "outer-ice-28-underside-spike-15",
      "x": 273.9220772603691,
      "y": 3686.7953381310754,
      "z": -131,
      "radius": 8.9393889120128,
      "length": 59.77233264188381,
      "seed": 1563434297
    },
    {
      "id": "outer-ice-28-underside-spike-16",
      "x": 298.56495152107465,
      "y": 3700.622234613642,
      "z": -131,
      "radius": 5.889937874386087,
      "length": 45.23966782428963,
      "seed": 989126891
    },
    {
      "id": "outer-ice-28-underside-spike-17",
      "x": 414.0395089866376,
      "y": 3772.7148462166892,
      "z": -131,
      "radius": 6.310878308778628,
      "length": 39.0834087703259,
      "seed": 1322999361
    },
    {
      "id": "outer-ice-28-underside-spike-18",
      "x": 434.91055059914834,
      "y": 3708.9344201651397,
      "z": -131,
      "radius": 7.671930094873533,
      "length": 40.81213975911489,
      "seed": 1589946065
    },
    {
      "id": "outer-ice-28-underside-spike-19",
      "x": 407.67076987961866,
      "y": 3716.0933501257323,
      "z": -131,
      "radius": 3.958318804241717,
      "length": 35.82204129092769,
      "seed": 4179470838
    },
    {
      "id": "outer-ice-29-underside-spike-0",
      "x": 166.18863128150983,
      "y": 4352.5780292440895,
      "z": -148,
      "radius": 12.308024769555777,
      "length": 83.02279567718506,
      "seed": 2480607304
    },
    {
      "id": "outer-ice-29-underside-spike-1",
      "x": 183.65181565067297,
      "y": 4329.445498826985,
      "z": -148,
      "radius": 6.552500571124256,
      "length": 41.562921905490484,
      "seed": 3421231758
    },
    {
      "id": "outer-ice-29-underside-spike-2",
      "x": 115.82696258397581,
      "y": 4384.947106715966,
      "z": -148,
      "radius": 6.24595388257876,
      "length": 36.75499431783633,
      "seed": 3863765796
    },
    {
      "id": "outer-ice-29-underside-spike-3",
      "x": 12.56312823378667,
      "y": 4367.712653085229,
      "z": -148,
      "radius": 4.857607744261622,
      "length": 34.31576795007602,
      "seed": 720868234
    },
    {
      "id": "outer-ice-29-underside-spike-4",
      "x": 137.33526610482238,
      "y": 4248.890640410615,
      "z": -148,
      "radius": 14.29135340368375,
      "length": 79.9551830291748,
      "seed": 3955697984
    },
    {
      "id": "outer-ice-29-underside-spike-5",
      "x": 30.38627630615376,
      "y": 4284.147043322044,
      "z": -148,
      "radius": 5.164874836010858,
      "length": 41.50245526084372,
      "seed": 1055784433
    },
    {
      "id": "outer-ice-29-underside-spike-6",
      "x": -14.816057962044582,
      "y": 4306.800483644865,
      "z": -148,
      "radius": 13.54111630017869,
      "length": 81.21536827087402,
      "seed": 2489184897
    },
    {
      "id": "outer-ice-29-underside-spike-7",
      "x": 97.24775759510301,
      "y": 4391.548389234048,
      "z": -148,
      "radius": 10.21320720151998,
      "length": 68.61382441310215,
      "seed": 1271791551
    },
    {
      "id": "outer-ice-29-underside-spike-8",
      "x": 2.612520485374503,
      "y": 4334.332290324045,
      "z": -148,
      "radius": 3.921854079281911,
      "length": 26.154417917457437,
      "seed": 4179893645
    },
    {
      "id": "outer-ice-29-underside-spike-9",
      "x": 12.553869173454729,
      "y": 4319.295481286267,
      "z": -148,
      "radius": 6.372771344007924,
      "length": 51.44407688649622,
      "seed": 1090048875
    },
    {
      "id": "outer-ice-29-underside-spike-10",
      "x": 46.49860956743947,
      "y": 4270.779703377283,
      "z": -148,
      "radius": 10.804384101508184,
      "length": 81.31700611114502,
      "seed": 492375257
    },
    {
      "id": "outer-ice-29-underside-spike-11",
      "x": 158.79805820710692,
      "y": 4278.7795791918215,
      "z": -148,
      "radius": 6.944218152249231,
      "length": 44.741279327066124,
      "seed": 4145412439
    },
    {
      "id": "outer-ice-29-underside-spike-12",
      "x": 144.94166980315705,
      "y": 4385.089214149055,
      "z": -148,
      "radius": 8.427332861814648,
      "length": 52.4094147536169,
      "seed": 1465413044
    },
    {
      "id": "outer-ice-29-underside-spike-13",
      "x": 111.70313360947468,
      "y": 4267.3413191763175,
      "z": -148,
      "radius": 10.924179887166247,
      "length": 66.39711441582631,
      "seed": 1200311797
    },
    {
      "id": "outer-ice-29-underside-spike-14",
      "x": 47.8039596318928,
      "y": 4396.832938934575,
      "z": -148,
      "radius": 7.008778720395639,
      "length": 56.64663432737681,
      "seed": 561536659
    },
    {
      "id": "outer-ice-29-underside-spike-15",
      "x": 94.48753985933607,
      "y": 4416.9548226317165,
      "z": -148,
      "radius": 3.6961637207306923,
      "length": 33.35238587356,
      "seed": 3199532452
    },
    {
      "id": "outer-ice-29-underside-spike-16",
      "x": 27.675605837265337,
      "y": 4374.691123695995,
      "z": -148,
      "radius": 9.410195082938298,
      "length": 47.79333138620041,
      "seed": 3928910349
    },
    {
      "id": "outer-ice-29-underside-spike-17",
      "x": 85.08176701738006,
      "y": 4265.3095712275,
      "z": -148,
      "radius": 12.99768194183707,
      "length": 78.49577002503443,
      "seed": 806609250
    },
    {
      "id": "outer-ice-29-underside-spike-18",
      "x": 200.52258679861689,
      "y": 4316.854516391982,
      "z": -148,
      "radius": 12.259266776125877,
      "length": 82.92909717559814,
      "seed": 1457019480
    },
    {
      "id": "outer-ice-29-underside-spike-19",
      "x": 67.02281128913604,
      "y": 4279.771464302671,
      "z": -148,
      "radius": 5.437879769783467,
      "length": 38.498745443579274,
      "seed": 420332600
    },
    {
      "id": "outer-ice-30-underside-spike-0",
      "x": -166.1182891672577,
      "y": 4843.808239114969,
      "z": -80,
      "radius": 6.356415739255025,
      "length": 50.2154125733291,
      "seed": 2280233019
    },
    {
      "id": "outer-ice-30-underside-spike-1",
      "x": -264.7716389916126,
      "y": 4923.573758542456,
      "z": -80,
      "radius": 8.674704201025888,
      "length": 54.99058011321852,
      "seed": 1792698153
    },
    {
      "id": "outer-ice-30-underside-spike-2",
      "x": -112.19258193199974,
      "y": 5007.998085646782,
      "z": -80,
      "radius": 8.752400063434616,
      "length": 63.94492631420321,
      "seed": 110255399
    },
    {
      "id": "outer-ice-30-underside-spike-3",
      "x": -208.66906811951023,
      "y": 4968.606719840505,
      "z": -80,
      "radius": 13.639467195337637,
      "length": 87.23884451812157,
      "seed": 2615881141
    },
    {
      "id": "outer-ice-30-underside-spike-4",
      "x": -120.08500254911614,
      "y": 4832.62323149174,
      "z": -80,
      "radius": 4.978312521697953,
      "length": 32.774546603350444,
      "seed": 3238170707
    },
    {
      "id": "outer-ice-30-underside-spike-5",
      "x": -226.5903377239416,
      "y": 4879.2696428885,
      "z": -80,
      "radius": 8.402024167506024,
      "length": 55.997448460727256,
      "seed": 3120898177
    },
    {
      "id": "outer-ice-30-underside-spike-6",
      "x": -182.3579085814518,
      "y": 4985.195891320888,
      "z": -80,
      "radius": 9.864639020645992,
      "length": 57.84742813586428,
      "seed": 2726968767
    },
    {
      "id": "outer-ice-30-underside-spike-7",
      "x": -31.616857599620204,
      "y": 4943.934230152125,
      "z": -80,
      "radius": 7.599665299644694,
      "length": 53.53333839187425,
      "seed": 3921210253
    },
    {
      "id": "outer-ice-30-underside-spike-8",
      "x": -98.21332638444679,
      "y": 4992.726833191919,
      "z": -80,
      "radius": 5.506093524741009,
      "length": 42.29092605976225,
      "seed": 3954028907
    },
    {
      "id": "outer-ice-30-underside-spike-9",
      "x": -126.58138225485357,
      "y": 4992.796904459356,
      "z": -80,
      "radius": 9.277574603212997,
      "length": 50.94791143409802,
      "seed": 685341401
    },
    {
      "id": "outer-ice-30-underside-spike-10",
      "x": -238.7721483720993,
      "y": 4955.081671798304,
      "z": -80,
      "radius": 12.152826552400365,
      "length": 65.97065197888574,
      "seed": 3494999895
    },
    {
      "id": "outer-ice-30-underside-spike-11",
      "x": -232.31046135867027,
      "y": 4895.933096910314,
      "z": -80,
      "radius": 3.9259534807596355,
      "length": 33.66564908450709,
      "seed": 1496407399
    },
    {
      "id": "outer-ice-30-underside-spike-12",
      "x": -38.479211784830554,
      "y": 4922.6568041644105,
      "z": -80,
      "radius": 9.175128514235839,
      "length": 65.73658645343932,
      "seed": 1901124597
    },
    {
      "id": "outer-ice-30-underside-spike-13",
      "x": -76.74329845612151,
      "y": 4946.775958089642,
      "z": -80,
      "radius": 7.8305738152284174,
      "length": 43.598470541736674,
      "seed": 2078801043
    },
    {
      "id": "outer-ice-30-underside-spike-14",
      "x": -59.74984457499902,
      "y": 4959.550095607349,
      "z": -80,
      "radius": 5.247852343088016,
      "length": 34.17473969341631,
      "seed": 1731693333
    },
    {
      "id": "outer-ice-30-underside-spike-15",
      "x": -187.15206715912618,
      "y": 4860.006032016669,
      "z": -80,
      "radius": 11.97353259843774,
      "length": 80.52240608271073,
      "seed": 717343411
    },
    {
      "id": "outer-ice-30-underside-spike-16",
      "x": -90.19615985316244,
      "y": 4849.791923178306,
      "z": -80,
      "radius": 13.53731767955236,
      "length": 66.08246881078624,
      "seed": 1972899809
    },
    {
      "id": "outer-ice-30-underside-spike-17",
      "x": -17.311791001356994,
      "y": 4890.290810675193,
      "z": -80,
      "radius": 3.7254924929514526,
      "length": 30.860615043878255,
      "seed": 3246209606
    },
    {
      "id": "outer-ice-30-underside-spike-18",
      "x": -145.7936360404378,
      "y": 5001.936752906577,
      "z": -80,
      "radius": 6.941105999881401,
      "length": 41.77788728795814,
      "seed": 4055413295
    },
    {
      "id": "outer-ice-30-underside-spike-19",
      "x": -47.45431165279852,
      "y": 4871.5983635374905,
      "z": -80,
      "radius": 4.380100571354851,
      "length": 38.08934531086056,
      "seed": 3522195581
    },
    {
      "id": "outer-ice-31-underside-spike-0",
      "x": -856.9833134548378,
      "y": 5156.289430939319,
      "z": -97,
      "radius": 12.171684197047727,
      "length": 84.38316052745246,
      "seed": 389488471
    },
    {
      "id": "outer-ice-31-underside-spike-1",
      "x": -858.8030753921739,
      "y": 5050.079819786291,
      "z": -97,
      "radius": 9.11340274698101,
      "length": 49.05450953825773,
      "seed": 4266549861
    },
    {
      "id": "outer-ice-31-underside-spike-2",
      "x": -1072.717022566743,
      "y": 5102.120260633826,
      "z": -97,
      "radius": 10.078377626957373,
      "length": 75.23539442024693,
      "seed": 2824307587
    },
    {
      "id": "outer-ice-31-underside-spike-3",
      "x": -869.8329034055179,
      "y": 5073.6639045463435,
      "z": -97,
      "radius": 13.717195149986074,
      "length": 92.72990598532559,
      "seed": 1788198449
    },
    {
      "id": "outer-ice-31-underside-spike-4",
      "x": -1002.1673001258987,
      "y": 5169.3612605376065,
      "z": -97,
      "radius": 14.076340190554038,
      "length": 101.57526530119621,
      "seed": 1916408303
    },
    {
      "id": "outer-ice-31-underside-spike-5",
      "x": -1032.7012452707643,
      "y": 5100.429637333061,
      "z": -97,
      "radius": 12.204591066827998,
      "length": 74.91140605751593,
      "seed": 2360353341
    },
    {
      "id": "outer-ice-31-underside-spike-6",
      "x": -959.0808788339191,
      "y": 5197.416803367626,
      "z": -97,
      "radius": 10.264481011172757,
      "length": 71.47081329913641,
      "seed": 1334991309
    },
    {
      "id": "outer-ice-31-underside-spike-7",
      "x": -895.6002832133381,
      "y": 5036.5616658743465,
      "z": -97,
      "radius": 9.403332157032565,
      "length": 54.54677539979896,
      "seed": 3552107947
    },
    {
      "id": "outer-ice-31-underside-spike-8",
      "x": -958.7344435271864,
      "y": 5029.009791263729,
      "z": -97,
      "radius": 5.6511738465260715,
      "length": 32.74471563798932,
      "seed": 2825057561
    },
    {
      "id": "outer-ice-31-underside-spike-9",
      "x": -992.6462055763499,
      "y": 5022.462120240319,
      "z": -97,
      "radius": 3.892654368141666,
      "length": 26.063890102678844,
      "seed": 541937559
    },
    {
      "id": "outer-ice-31-underside-spike-10",
      "x": -951.2816759561262,
      "y": 5178.666707065765,
      "z": -97,
      "radius": 4.961394027415663,
      "length": 43.900637026916236,
      "seed": 501385460
    },
    {
      "id": "outer-ice-31-underside-spike-11",
      "x": -975.082906902095,
      "y": 5040.795533169887,
      "z": -97,
      "radius": 7.224982339404524,
      "length": 48.4010057253735,
      "seed": 1182007934
    },
    {
      "id": "outer-ice-31-underside-spike-12",
      "x": -1031.9776454591117,
      "y": 5071.249922347133,
      "z": -97,
      "radius": 11.109840763024986,
      "length": 76.06883385977216,
      "seed": 2510376526
    },
    {
      "id": "outer-ice-31-underside-spike-13",
      "x": -933.6844835813724,
      "y": 5189.542639758375,
      "z": -97,
      "radius": 13.36769925037399,
      "length": 73.70938582027821,
      "seed": 2536933604
    },
    {
      "id": "outer-ice-31-underside-spike-14",
      "x": -854.678643327241,
      "y": 5121.338052662358,
      "z": -97,
      "radius": 8.914905638108031,
      "length": 61.763242936335175,
      "seed": 3091449319
    },
    {
      "id": "outer-ice-31-underside-spike-15",
      "x": -1021.3142166632042,
      "y": 5127.537067131249,
      "z": -97,
      "radius": 15.16703665575944,
      "length": 75.06683780311985,
      "seed": 2083217525
    },
    {
      "id": "outer-ice-31-underside-spike-16",
      "x": -1058.5417491438063,
      "y": 5057.850010459055,
      "z": -97,
      "radius": 4.992363171223551,
      "length": 42.13428060600019,
      "seed": 3766926548
    },
    {
      "id": "outer-ice-31-underside-spike-17",
      "x": -1069.3217746037703,
      "y": 5076.053080398955,
      "z": -97,
      "radius": 9.656294641289861,
      "length": 60.40919240379215,
      "seed": 2832725540
    },
    {
      "id": "outer-ice-31-underside-spike-18",
      "x": -837.3844322795817,
      "y": 5107.951570449634,
      "z": -97,
      "radius": 4.630172903286294,
      "length": 38.134032920222694,
      "seed": 2722001755
    },
    {
      "id": "outer-ice-31-underside-spike-19",
      "x": -1033.1990890057457,
      "y": 5049.0528740147065,
      "z": -97,
      "radius": 6.981188782146201,
      "length": 38.72942888360859,
      "seed": 128710685
    },
    {
      "id": "outer-ice-32-underside-spike-0",
      "x": -1758.9152518754258,
      "y": 5210.347747230399,
      "z": -114,
      "radius": 10.685045009711757,
      "length": 55.99802352200096,
      "seed": 307916403
    },
    {
      "id": "outer-ice-32-underside-spike-1",
      "x": -1947.3074706447271,
      "y": 5212.722761319812,
      "z": -114,
      "radius": 15.571664744010196,
      "length": 81.479904429707,
      "seed": 1284498849
    },
    {
      "id": "outer-ice-32-underside-spike-2",
      "x": -1964.370086461362,
      "y": 5228.381209637551,
      "z": -114,
      "radius": 4.012356343539432,
      "length": 30.67276589473555,
      "seed": 3346264543
    },
    {
      "id": "outer-ice-32-underside-spike-3",
      "x": -1785.2764787845679,
      "y": 5131.075972737379,
      "z": -114,
      "radius": 8.837993172509595,
      "length": 68.10636513198656,
      "seed": 2443400877
    },
    {
      "id": "outer-ice-32-underside-spike-4",
      "x": -1993.6258973569077,
      "y": 5156.072150869318,
      "z": -114,
      "radius": 11.810866022855043,
      "length": 60.900803554720575,
      "seed": 3785293442
    },
    {
      "id": "outer-ice-32-underside-spike-5",
      "x": -1985.1390279463058,
      "y": 5186.241135671989,
      "z": -114,
      "radius": 13.949872227665038,
      "length": 75.2838619924136,
      "seed": 1358014072
    },
    {
      "id": "outer-ice-32-underside-spike-6",
      "x": -1874.0206059499137,
      "y": 5113.05792813639,
      "z": -114,
      "radius": 8.64858358791098,
      "length": 62.745841609030634,
      "seed": 4062959816
    },
    {
      "id": "outer-ice-32-underside-spike-7",
      "x": -1831.579497201957,
      "y": 5146.307812484232,
      "z": -114,
      "radius": 15.341915958188475,
      "length": 90.43847147051856,
      "seed": 2493103886
    },
    {
      "id": "outer-ice-32-underside-spike-8",
      "x": -1915.212490714417,
      "y": 5256.2589665447385,
      "z": -114,
      "radius": 8.01710783438757,
      "length": 54.40043723002625,
      "seed": 4120609700
    },
    {
      "id": "outer-ice-32-underside-spike-9",
      "x": -1820.414643363847,
      "y": 5276.904244465268,
      "z": -114,
      "radius": 4.313095491752028,
      "length": 38.43937642013311,
      "seed": 1432555530
    },
    {
      "id": "outer-ice-32-underside-spike-10",
      "x": -1798.8054080884997,
      "y": 5274.725774468843,
      "z": -114,
      "radius": 7.866814825963229,
      "length": 53.448631147673126,
      "seed": 461971904
    },
    {
      "id": "outer-ice-32-underside-spike-11",
      "x": -1792.6626562127637,
      "y": 5240.407500744277,
      "z": -114,
      "radius": 12.748964521475136,
      "length": 77.70211900589388,
      "seed": 2281548358
    },
    {
      "id": "outer-ice-32-underside-spike-12",
      "x": -1857.3748381056134,
      "y": 5285.403759801862,
      "z": -114,
      "radius": 15.935909418202938,
      "length": 101.04972238947059,
      "seed": 373557270
    },
    {
      "id": "outer-ice-32-underside-spike-13",
      "x": -1841.526436517231,
      "y": 5120.138793290001,
      "z": -114,
      "radius": 6.622617182973773,
      "length": 40.12459743657388,
      "seed": 3779336812
    },
    {
      "id": "outer-ice-32-underside-spike-14",
      "x": -1727.3288602117068,
      "y": 5227.799572567863,
      "z": -114,
      "radius": 16.769623754918577,
      "length": 93.25897224186762,
      "seed": 1434408594
    },
    {
      "id": "outer-ice-32-underside-spike-15",
      "x": -1891.2312065917858,
      "y": 5252.744583676482,
      "z": -114,
      "radius": 3.658898866083473,
      "length": 26.14115727515163,
      "seed": 849406472
    },
    {
      "id": "outer-ice-32-underside-spike-16",
      "x": -1894.205629840871,
      "y": 5277.423068502298,
      "z": -114,
      "radius": 9.095428272150457,
      "length": 49.154709987866354,
      "seed": 1330361934
    },
    {
      "id": "outer-ice-32-underside-spike-17",
      "x": -1959.4681850429022,
      "y": 5257.478573632908,
      "z": -114,
      "radius": 16.60529519459233,
      "length": 95.34225339420553,
      "seed": 945973928
    },
    {
      "id": "outer-ice-32-underside-spike-18",
      "x": -1822.6977593865633,
      "y": 5292.503088977438,
      "z": -114,
      "radius": 4.580659415479749,
      "length": 39.64611681606499,
      "seed": 2688444664
    },
    {
      "id": "outer-ice-32-underside-spike-19",
      "x": -1945.9101089043538,
      "y": 5143.403546220099,
      "z": -114,
      "radius": 10.945362368132919,
      "length": 86.5070228529635,
      "seed": 347290440
    },
    {
      "id": "outer-ice-33-underside-spike-0",
      "x": -2806.218605409607,
      "y": 5202.933418299633,
      "z": -131,
      "radius": 8.75724980835803,
      "length": 65.38959584788157,
      "seed": 2271218247
    },
    {
      "id": "outer-ice-33-underside-spike-1",
      "x": -2726.4570099550233,
      "y": 5178.964387488995,
      "z": -131,
      "radius": 7.970369468210265,
      "length": 42.742296344064165,
      "seed": 1841203669
    },
    {
      "id": "outer-ice-33-underside-spike-2",
      "x": -2803.183310868625,
      "y": 5092.989318560112,
      "z": -131,
      "radius": 8.44149758205749,
      "length": 55.18130321724644,
      "seed": 1943495539
    },
    {
      "id": "outer-ice-33-underside-spike-3",
      "x": -2891.9514763013235,
      "y": 5219.0012663748785,
      "z": -131,
      "radius": 12.437052004924045,
      "length": 69.06581545675994,
      "seed": 1142878881
    },
    {
      "id": "outer-ice-33-underside-spike-4",
      "x": -2963.1108744365365,
      "y": 5227.464313918328,
      "z": -131,
      "radius": 10.1444793489296,
      "length": 59.28014964499518,
      "seed": 3045480159
    },
    {
      "id": "outer-ice-33-underside-spike-5",
      "x": -2749.960333036857,
      "y": 5206.680739840823,
      "z": -131,
      "radius": 11.34762539039366,
      "length": 57.390355333182065,
      "seed": 9458605
    },
    {
      "id": "outer-ice-33-underside-spike-6",
      "x": -3002.0973120608196,
      "y": 5093.851723673176,
      "z": -131,
      "radius": 14.751315071666614,
      "length": 89.45636771903516,
      "seed": 1579626635
    },
    {
      "id": "outer-ice-33-underside-spike-7",
      "x": -2767.8549028184984,
      "y": 5160.902984407863,
      "z": -131,
      "radius": 5.623770027374849,
      "length": 40.6404436547691,
      "seed": 2364250361
    },
    {
      "id": "outer-ice-33-underside-spike-8",
      "x": -2757.2917581112793,
      "y": 5085.413802284165,
      "z": -131,
      "radius": 4.8405306272674355,
      "length": 42.515833421336595,
      "seed": 234126455
    },
    {
      "id": "outer-ice-33-underside-spike-9",
      "x": -2765.387167081725,
      "y": 5188.02735087418,
      "z": -131,
      "radius": 5.695776090351865,
      "length": 44.61364110328743,
      "seed": 1278733957
    },
    {
      "id": "outer-ice-33-underside-spike-10",
      "x": -2932.734135986817,
      "y": 5207.781530055234,
      "z": -131,
      "radius": 12.958850287506356,
      "length": 76.85794706082046,
      "seed": 1645545123
    },
    {
      "id": "outer-ice-33-underside-spike-11",
      "x": -2859.075818386523,
      "y": 5208.103383440549,
      "z": -131,
      "radius": 14.145362385967747,
      "length": 100.97079659365264,
      "seed": 2758668211
    },
    {
      "id": "outer-ice-33-underside-spike-12",
      "x": -2979.301477957151,
      "y": 5175.8361483866365,
      "z": -131,
      "radius": 11.147342547168956,
      "length": 67.70219383012935,
      "seed": 2887830753
    },
    {
      "id": "outer-ice-33-underside-spike-13",
      "x": -2894.9959019551547,
      "y": 5063.249416489103,
      "z": -131,
      "radius": 9.995472401054577,
      "length": 62.05490658823788,
      "seed": 4064251679
    },
    {
      "id": "outer-ice-33-underside-spike-14",
      "x": -2831.025114508171,
      "y": 5223.078254508916,
      "z": -131,
      "radius": 11.61914336392656,
      "length": 89.47892618259597,
      "seed": 3822458908
    },
    {
      "id": "outer-ice-33-underside-spike-15",
      "x": -2855.515866796733,
      "y": 5046.992658590228,
      "z": -131,
      "radius": 7.705480859521777,
      "length": 58.55363111252676,
      "seed": 1920680812
    },
    {
      "id": "outer-ice-33-underside-spike-16",
      "x": -2959.1200485787563,
      "y": 5102.473610694331,
      "z": -131,
      "radius": 3.4556260011624547,
      "length": 32.331850035839544,
      "seed": 2087544077
    },
    {
      "id": "outer-ice-33-underside-spike-17",
      "x": -2936.9744811927008,
      "y": 5089.724352078661,
      "z": -131,
      "radius": 4.03838836052455,
      "length": 29.879001954523996,
      "seed": 2218819307
    },
    {
      "id": "outer-ice-33-underside-spike-18",
      "x": -2740.5688664214326,
      "y": 5154.151119543605,
      "z": -131,
      "radius": 14.421508686617017,
      "length": 107.86042499542236,
      "seed": 3281775802
    },
    {
      "id": "outer-ice-33-underside-spike-19",
      "x": -2837.1065578019943,
      "y": 5059.623231938054,
      "z": -131,
      "radius": 9.37674235389568,
      "length": 63.660153479541634,
      "seed": 1217644595
    },
    {
      "id": "outer-ice-34-underside-spike-0",
      "x": -3970.1060560068786,
      "y": 5050.146179677429,
      "z": -148,
      "radius": 12.38008599163033,
      "length": 69.88324853754054,
      "seed": 1446172371
    },
    {
      "id": "outer-ice-34-underside-spike-1",
      "x": -3865.132272270858,
      "y": 4947.885418026284,
      "z": -148,
      "radius": 5.560847972463816,
      "length": 44.06799797963071,
      "seed": 1923896416
    },
    {
      "id": "outer-ice-34-underside-spike-2",
      "x": -3894.572482469841,
      "y": 4930.989800535322,
      "z": -148,
      "radius": 8.900694599635898,
      "length": 47.962901998542804,
      "seed": 58556390
    },
    {
      "id": "outer-ice-34-underside-spike-3",
      "x": -3919.9511212459156,
      "y": 4984.89084141244,
      "z": -148,
      "radius": 9.704148848745971,
      "length": 63.24956749959782,
      "seed": 3273445308
    },
    {
      "id": "outer-ice-34-underside-spike-4",
      "x": -3721.1356321240314,
      "y": 4995.791210174531,
      "z": -148,
      "radius": 4.500559904677793,
      "length": 31.2886123082028,
      "seed": 2114486685
    },
    {
      "id": "outer-ice-34-underside-spike-5",
      "x": -3972.2122495872013,
      "y": 5109.203423186531,
      "z": -148,
      "radius": 11.041437899256124,
      "length": 68.6002145859054,
      "seed": 1313653499
    },
    {
      "id": "outer-ice-34-underside-spike-6",
      "x": -3951.92430417739,
      "y": 5011.454207985449,
      "z": -148,
      "radius": 7.177364391898736,
      "length": 57.358844213741385,
      "seed": 1761856489
    },
    {
      "id": "outer-ice-34-underside-spike-7",
      "x": -3930.4975572754606,
      "y": 5111.3560171457275,
      "z": -148,
      "radius": 8.791866396032272,
      "length": 64.30125837033549,
      "seed": 2404519918
    },
    {
      "id": "outer-ice-34-underside-spike-8",
      "x": -3809.575496608056,
      "y": 5127.635211953073,
      "z": -148,
      "radius": 9.185184951173142,
      "length": 62.74792289733778,
      "seed": 2365519351
    },
    {
      "id": "outer-ice-34-underside-spike-9",
      "x": -3810.2584005626095,
      "y": 4938.5905535426145,
      "z": -148,
      "radius": 11.355932212946936,
      "length": 83.90802001953125,
      "seed": 2867903493
    },
    {
      "id": "outer-ice-34-underside-spike-10",
      "x": -3850.5224458986527,
      "y": 5151.791001181557,
      "z": -148,
      "radius": 11.74797336104326,
      "length": 75.26353225137528,
      "seed": 980452757
    },
    {
      "id": "outer-ice-34-underside-spike-11",
      "x": -3824.878076855165,
      "y": 4965.833375708716,
      "z": -148,
      "radius": 13.6644032713864,
      "length": 75.31348239251992,
      "seed": 2987381043
    },
    {
      "id": "outer-ice-34-underside-spike-12",
      "x": -3763.89895557155,
      "y": 5078.548287935615,
      "z": -148,
      "radius": 5.459711372712627,
      "length": 44.57503201796418,
      "seed": 2959449667
    },
    {
      "id": "outer-ice-34-underside-spike-13",
      "x": -3749.998141053657,
      "y": 4987.700728126972,
      "z": -148,
      "radius": 9.816434955289587,
      "length": 49.312465177707125,
      "seed": 1000772337
    },
    {
      "id": "outer-ice-34-underside-spike-14",
      "x": -3783.9507503040318,
      "y": 5116.273486609741,
      "z": -148,
      "radius": 9.96883239481598,
      "length": 71.66401935226612,
      "seed": 1066085526
    },
    {
      "id": "outer-ice-34-underside-spike-15",
      "x": -3736.2912524214953,
      "y": 5016.391198412091,
      "z": -148,
      "radius": 12.268249279204756,
      "length": 72.2366806945841,
      "seed": 2815589100
    },
    {
      "id": "outer-ice-34-underside-spike-16",
      "x": -3941.5886328253755,
      "y": 4986.620191084822,
      "z": -148,
      "radius": 5.477542409850284,
      "length": 45.573444019840124,
      "seed": 2871353997
    },
    {
      "id": "outer-ice-34-underside-spike-17",
      "x": -3957.6580561163923,
      "y": 5072.77201782512,
      "z": -148,
      "radius": 4.111096929414198,
      "length": 34.32719773718502,
      "seed": 2851663389
    },
    {
      "id": "outer-ice-34-underside-spike-18",
      "x": -3798.705242837877,
      "y": 5159.122754388963,
      "z": -148,
      "radius": 17.87040196929127,
      "length": 93.89730548858643,
      "seed": 532032470
    },
    {
      "id": "outer-ice-34-underside-spike-19",
      "x": -3920.683928919919,
      "y": 5010.484572686043,
      "z": -148,
      "radius": 11.126795290689914,
      "length": 73.62281197194908,
      "seed": 308333680
    },
    {
      "id": "outer-ice-35-underside-spike-0",
      "x": -3096.872132544253,
      "y": -1039.13087764257,
      "z": -80,
      "radius": 6.267272281693295,
      "length": 40.31782551223616,
      "seed": 3914693703
    },
    {
      "id": "outer-ice-35-underside-spike-1",
      "x": -2947.7330162693975,
      "y": -1064.4917131179209,
      "z": -80,
      "radius": 5.808132992265746,
      "length": 49.42799208367627,
      "seed": 2876369877
    },
    {
      "id": "outer-ice-35-underside-spike-2",
      "x": -2960.0612093859813,
      "y": -1044.6211513423727,
      "z": -80,
      "radius": 10.276101583102719,
      "length": 59.24788638646723,
      "seed": 1781347699
    },
    {
      "id": "outer-ice-35-underside-spike-3",
      "x": -3093.2845807583994,
      "y": -1162.8772336108398,
      "z": -80,
      "radius": 15.515171592822298,
      "length": 77.63697585018323,
      "seed": 959952033
    },
    {
      "id": "outer-ice-35-underside-spike-4",
      "x": -3089.02818935762,
      "y": -1191.4547277679417,
      "z": -80,
      "radius": 8.208041098387913,
      "length": 54.01478560437398,
      "seed": 2480834783
    },
    {
      "id": "outer-ice-35-underside-spike-5",
      "x": -2967.1489028262863,
      "y": -1163.4166656089762,
      "z": -80,
      "radius": 5.836298990668729,
      "length": 37.703618303694284,
      "seed": 165212399
    },
    {
      "id": "outer-ice-35-underside-spike-6",
      "x": -3122.601711642138,
      "y": -1101.477190860979,
      "z": -80,
      "radius": 6.893137057079002,
      "length": 51.68500626457999,
      "seed": 3141880125
    },
    {
      "id": "outer-ice-35-underside-spike-7",
      "x": -3058.6102687620532,
      "y": -1037.247799034291,
      "z": -80,
      "radius": 3.276869786018506,
      "length": 29.474800784260392,
      "seed": 717964699
    },
    {
      "id": "outer-ice-35-underside-spike-8",
      "x": -2953.104328397285,
      "y": -1100.0377567381774,
      "z": -80,
      "radius": 12.335386094218121,
      "length": 79.17528034235404,
      "seed": 1067479433
    },
    {
      "id": "outer-ice-35-underside-spike-9",
      "x": -3005.954667018734,
      "y": -1031.8380460821074,
      "z": -80,
      "radius": 16.263728228257968,
      "length": 91.62581036192573,
      "seed": 288464007
    },
    {
      "id": "outer-ice-35-underside-spike-10",
      "x": -2947.1629577903955,
      "y": -1141.483460744506,
      "z": -80,
      "radius": 15.459039808390663,
      "length": 101.0564312930105,
      "seed": 1799600661
    },
    {
      "id": "outer-ice-35-underside-spike-11",
      "x": -3119.269360926994,
      "y": -1151.9098119496339,
      "z": -80,
      "radius": 6.135758623341099,
      "length": 41.852930375756245,
      "seed": 1148567987
    },
    {
      "id": "outer-ice-35-underside-spike-12",
      "x": -3062.929866051706,
      "y": -1011.2731407971669,
      "z": -80,
      "radius": 10.550150855770335,
      "length": 67.13351432636416,
      "seed": 383487713
    },
    {
      "id": "outer-ice-35-underside-spike-13",
      "x": -3120.8494876386044,
      "y": -1138.0712511419679,
      "z": -80,
      "radius": 5.404572480591014,
      "length": 37.570361788839534,
      "seed": 111788319
    },
    {
      "id": "outer-ice-35-underside-spike-14",
      "x": -2987.2426792765277,
      "y": -1181.3978923577874,
      "z": -80,
      "radius": 16.64032014082186,
      "length": 77.06822983546223,
      "seed": 2368379885
    },
    {
      "id": "outer-ice-35-underside-spike-15",
      "x": -3087.927010449662,
      "y": -1053.9134288813436,
      "z": -80,
      "radius": 4.446097868168726,
      "length": 31.951884838969356,
      "seed": 108259019
    },
    {
      "id": "outer-ice-35-underside-spike-16",
      "x": -3113.3276800901804,
      "y": -1057.7135293464203,
      "z": -80,
      "radius": 14.064813100453467,
      "length": 72.01900840839724,
      "seed": 1639561912
    },
    {
      "id": "outer-ice-35-underside-spike-17",
      "x": -3077.7266658853,
      "y": -1044.3974962993884,
      "z": -80,
      "radius": 5.562136496091261,
      "length": 38.66784922776611,
      "seed": 621285611
    },
    {
      "id": "outer-ice-35-underside-spike-18",
      "x": -3058.114723955647,
      "y": -1167.4341992512107,
      "z": -80,
      "radius": 5.473361567175016,
      "length": 40.96059326559907,
      "seed": 2280357465
    },
    {
      "id": "outer-ice-35-underside-spike-19",
      "x": -2967.1205438524357,
      "y": -1080.0100344826524,
      "z": -80,
      "radius": 3.5410167234018446,
      "length": 29.02854514553173,
      "seed": 4288726054
    },
    {
      "id": "outer-ice-36-underside-spike-0",
      "x": -2564.4613672740306,
      "y": 713.7692247298531,
      "z": -97,
      "radius": 4.161722662160173,
      "length": 34.33060140007249,
      "seed": 141569499
    },
    {
      "id": "outer-ice-36-underside-spike-1",
      "x": -2493.497997486508,
      "y": 682.1747868836623,
      "z": -97,
      "radius": 3.400851441314444,
      "length": 29.690890939934043,
      "seed": 2027603913
    },
    {
      "id": "outer-ice-36-underside-spike-2",
      "x": -2482.291506224909,
      "y": 721.2332334814478,
      "z": -97,
      "radius": 3.287272659363225,
      "length": 28.242104166650613,
      "seed": 2228515015
    },
    {
      "id": "outer-ice-36-underside-spike-3",
      "x": -2587.103037109795,
      "y": 761.3419791834713,
      "z": -97,
      "radius": 11.090300337178633,
      "length": 81.32303019428488,
      "seed": 3447037013
    },
    {
      "id": "outer-ice-36-underside-spike-4",
      "x": -2518.2940005993514,
      "y": 802.5548490268949,
      "z": -97,
      "radius": 7.179246073588729,
      "length": 42.773861465356305,
      "seed": 1678602826
    },
    {
      "id": "outer-ice-36-underside-spike-5",
      "x": -2464.835581779367,
      "y": 736.0036525485322,
      "z": -97,
      "radius": 3.792561065638438,
      "length": 27.48673244080263,
      "seed": 1451867907
    },
    {
      "id": "outer-ice-36-underside-spike-6",
      "x": -2483.9433316993623,
      "y": 795.9395232313374,
      "z": -97,
      "radius": 6.2966156078036875,
      "length": 37.74538851992928,
      "seed": 1115536817
    },
    {
      "id": "outer-ice-36-underside-spike-7",
      "x": -2462.2917799566158,
      "y": 765.567401727934,
      "z": -97,
      "radius": 4.780870118178427,
      "length": 32.24391089638496,
      "seed": 1474217558
    },
    {
      "id": "outer-ice-36-underside-spike-8",
      "x": -2561.3573751676727,
      "y": 731.3616935706057,
      "z": -97,
      "radius": 5.030996514949948,
      "length": 36.158932715610945,
      "seed": 807540396
    },
    {
      "id": "outer-ice-36-underside-spike-9",
      "x": -2566.3537802251217,
      "y": 776.3881569308825,
      "z": -97,
      "radius": 10.132407220546156,
      "length": 54.76291939097246,
      "seed": 2078352892
    },
    {
      "id": "outer-ice-36-underside-spike-10",
      "x": -2549.609762282932,
      "y": 810.0762899001212,
      "z": -97,
      "radius": 4.684770680498332,
      "length": 41.296717096039615,
      "seed": 4057067408
    },
    {
      "id": "outer-ice-36-underside-spike-11",
      "x": -2464.262803541186,
      "y": 723.3704496891079,
      "z": -97,
      "radius": 5.198855217313394,
      "length": 37.0430763850838,
      "seed": 3747880065
    },
    {
      "id": "outer-ice-36-underside-spike-12",
      "x": -2477.1836615886045,
      "y": 773.8165957606018,
      "z": -97,
      "radius": 7.864591206656769,
      "length": 61.91383129779889,
      "seed": 3259390399
    },
    {
      "id": "outer-ice-36-underside-spike-13",
      "x": -2513.30258276276,
      "y": 684.959377720116,
      "z": -97,
      "radius": 5.885628490475938,
      "length": 37.24598921857918,
      "seed": 134293389
    },
    {
      "id": "outer-ice-36-underside-spike-14",
      "x": -2531.626507730209,
      "y": 700.4106913546044,
      "z": -97,
      "radius": 11.04940209374763,
      "length": 80.51252198276039,
      "seed": 4101573995
    },
    {
      "id": "outer-ice-36-underside-spike-15",
      "x": -2464.401123038175,
      "y": 795.4200604155232,
      "z": -97,
      "radius": 7.2616620229091495,
      "length": 56.24055632176921,
      "seed": 3618043609
    },
    {
      "id": "outer-ice-36-underside-spike-16",
      "x": -2450.098925535397,
      "y": 735.5803720783625,
      "z": -97,
      "radius": 6.737942507257685,
      "length": 43.41234480468993,
      "seed": 3515401577
    },
    {
      "id": "outer-ice-36-underside-spike-17",
      "x": -2496.3612883384867,
      "y": 806.485852602646,
      "z": -97,
      "radius": 6.338578952243552,
      "length": 38.00615529375833,
      "seed": 2410827977
    },
    {
      "id": "outer-ice-36-underside-spike-18",
      "x": -2550.603483819151,
      "y": 708.368899320414,
      "z": -97,
      "radius": 7.223139024339616,
      "length": 40.35909566866288,
      "seed": 3050893902
    },
    {
      "id": "outer-ice-36-underside-spike-19",
      "x": -2582.974546930655,
      "y": 727.3121030480337,
      "z": -97,
      "radius": 3.1709838048554957,
      "length": 24.737029747656955,
      "seed": 2827250604
    },
    {
      "id": "outer-ice-37-underside-spike-0",
      "x": -3030.7444563735576,
      "y": 781.9625046567828,
      "z": -114,
      "radius": 3.9475165585521608,
      "length": 26.299918046637412,
      "seed": 1120249271
    },
    {
      "id": "outer-ice-37-underside-spike-1",
      "x": -3167.1101912958825,
      "y": 798.3817891486736,
      "z": -114,
      "radius": 9.766543588181957,
      "length": 72.34471419517588,
      "seed": 1692876229
    },
    {
      "id": "outer-ice-37-underside-spike-2",
      "x": -3176.4088274074006,
      "y": 741.2289689323876,
      "z": -114,
      "radius": 5.274311849847436,
      "length": 42.23304385053206,
      "seed": 1581878906
    },
    {
      "id": "outer-ice-37-underside-spike-3",
      "x": -3041.5791959835196,
      "y": 798.9848868324501,
      "z": -114,
      "radius": 3.884555975999683,
      "length": 26.792655145050663,
      "seed": 226746544
    },
    {
      "id": "outer-ice-37-underside-spike-4",
      "x": -3135.751497473803,
      "y": 797.6589321070569,
      "z": -114,
      "radius": 11.087014493532477,
      "length": 55.19715417736161,
      "seed": 2769814966
    },
    {
      "id": "outer-ice-37-underside-spike-5",
      "x": -3145.1716430656197,
      "y": 685.4110750237704,
      "z": -114,
      "radius": 13.85480291219428,
      "length": 85.50355352246405,
      "seed": 2227479308
    },
    {
      "id": "outer-ice-37-underside-spike-6",
      "x": -3050.0037334409585,
      "y": 703.5927564977474,
      "z": -114,
      "radius": 6.5103095744736486,
      "length": 54.09128684702959,
      "seed": 437799516
    },
    {
      "id": "outer-ice-37-underside-spike-7",
      "x": -3154.9188339233624,
      "y": 756.5355762601497,
      "z": -114,
      "radius": 11.519464478641748,
      "length": 72.1520157208289,
      "seed": 1461082882
    },
    {
      "id": "outer-ice-37-underside-spike-8",
      "x": -3071.8023223666037,
      "y": 806.1588688334094,
      "z": -114,
      "radius": 11.613413852127268,
      "length": 60.070277344851775,
      "seed": 3086271771
    },
    {
      "id": "outer-ice-37-underside-spike-9",
      "x": -3016.567616531956,
      "y": 736.6449854024233,
      "z": -114,
      "radius": 11.922529167355968,
      "length": 69.46665159831147,
      "seed": 3148295211
    },
    {
      "id": "outer-ice-37-underside-spike-10",
      "x": -3156.3634059101064,
      "y": 717.5255446602553,
      "z": -114,
      "radius": 5.174924133298918,
      "length": 30.814299685259307,
      "seed": 2931994521
    },
    {
      "id": "outer-ice-37-underside-spike-11",
      "x": -3081.616443037654,
      "y": 669.0024873704999,
      "z": -114,
      "radius": 11.016119577968492,
      "length": 73.57951355109046,
      "seed": 907810327
    },
    {
      "id": "outer-ice-37-underside-spike-12",
      "x": -3101.865741743622,
      "y": 811.943668627222,
      "z": -114,
      "radius": 4.408853511605411,
      "length": 31.55996647260021,
      "seed": 4249756020
    },
    {
      "id": "outer-ice-37-underside-spike-13",
      "x": -3051.4717324722665,
      "y": 791.9398873076319,
      "z": -114,
      "radius": 5.34328735708259,
      "length": 45.54582934921413,
      "seed": 1207321781
    },
    {
      "id": "outer-ice-37-underside-spike-14",
      "x": -3151.565648014681,
      "y": 810.1000647258463,
      "z": -114,
      "radius": 6.896594827109947,
      "length": 54.275721503027285,
      "seed": 2138973255
    },
    {
      "id": "outer-ice-37-underside-spike-15",
      "x": -3130.8560827925176,
      "y": 703.7521606516963,
      "z": -114,
      "radius": 7.0141060406807805,
      "length": 53.46630266370635,
      "seed": 2065499735
    },
    {
      "id": "outer-ice-37-underside-spike-16",
      "x": -3093.3488119971917,
      "y": 688.1721743559854,
      "z": -114,
      "radius": 4.588269200501964,
      "length": 41.49260041521846,
      "seed": 254608121
    },
    {
      "id": "outer-ice-37-underside-spike-17",
      "x": -3174.862611140728,
      "y": 774.0842759250382,
      "z": -114,
      "radius": 6.653174934117123,
      "length": 53.242811565354565,
      "seed": 3305265545
    },
    {
      "id": "outer-ice-37-underside-spike-18",
      "x": -3040.2394319143214,
      "y": 758.3549860666388,
      "z": -114,
      "radius": 4.419991497276351,
      "length": 35.16857009194394,
      "seed": 4020737049
    },
    {
      "id": "outer-ice-37-underside-spike-19",
      "x": -3049.1120127958266,
      "y": 727.4941599653009,
      "z": -114,
      "radius": 13.973048264812677,
      "length": 91.09575606536653,
      "seed": 320050280
    },
    {
      "id": "outer-ice-12-underside-spike-0",
      "x": -5487.330438612932,
      "y": -997.7705021576012,
      "z": -210,
      "radius": 5.933603288372979,
      "length": 32.66248607635498,
      "seed": 852457185
    },
    {
      "id": "outer-ice-12-underside-spike-1",
      "x": -5573.454904071338,
      "y": -1005.1467578375558,
      "z": -210,
      "radius": 8.365444869995118,
      "length": 29.876588821411133,
      "seed": 2457626911
    },
    {
      "id": "outer-ice-12-underside-spike-2",
      "x": -5386.7030828473025,
      "y": -799.1212928275745,
      "z": -210,
      "radius": 10.140058250427247,
      "length": 36.21449375152588,
      "seed": 947258349
    },
    {
      "id": "outer-ice-12-underside-spike-3",
      "x": -5370.623799566283,
      "y": -822.271520566987,
      "z": -210,
      "radius": 8.53698530816473,
      "length": 37.56980800628662,
      "seed": 461508299
    },
    {
      "id": "outer-ice-12-underside-spike-4",
      "x": -5643.930814272906,
      "y": -683.0542994636642,
      "z": -210,
      "radius": 8.537331314086915,
      "length": 30.490468978881836,
      "seed": 148944185
    },
    {
      "id": "outer-ice-12-underside-spike-5",
      "x": -5618.237757021373,
      "y": -713.3670827383228,
      "z": -210,
      "radius": 5.039762455271557,
      "length": 31.302260398864746,
      "seed": 1441556151
    },
    {
      "id": "outer-ice-12-underside-spike-6",
      "x": -5576.483807120596,
      "y": -681.067618657383,
      "z": -210,
      "radius": 9.199963302612305,
      "length": 32.857011795043945,
      "seed": 1029879493
    },
    {
      "id": "outer-ice-12-underside-spike-7",
      "x": -5378.871007646314,
      "y": -758.6319282896154,
      "z": -210,
      "radius": 10.420605392456055,
      "length": 37.216447830200195,
      "seed": 1406024931
    },
    {
      "id": "outer-ice-12-underside-spike-8",
      "x": -5396.962447886981,
      "y": -733.3415668111626,
      "z": -210,
      "radius": 10.195279808044434,
      "length": 36.41171360015869,
      "seed": 3972625553
    },
    {
      "id": "outer-ice-12-underside-spike-9",
      "x": -5385.335007403439,
      "y": -926.2512160464178,
      "z": -210,
      "radius": 9.949860305786133,
      "length": 35.53521537780762,
      "seed": 1998258870
    },
    {
      "id": "outer-ice-12-underside-spike-10",
      "x": -5442.10567059983,
      "y": -1013.4457605982249,
      "z": -210,
      "radius": 6.103995973709971,
      "length": 34.518527030944824,
      "seed": 4177491980
    },
    {
      "id": "outer-ice-12-underside-spike-11",
      "x": -5387.52453817652,
      "y": -948.5735050606795,
      "z": -210,
      "radius": 9.552208304405212,
      "length": 36.90135383605957,
      "seed": 1005862706
    },
    {
      "id": "outer-ice-12-underside-spike-12",
      "x": -5395.452302872577,
      "y": -654.2082128032207,
      "z": -210,
      "radius": 6.200747296446934,
      "length": 36.13729381561279,
      "seed": 958034699
    },
    {
      "id": "outer-ice-12-underside-spike-13",
      "x": -5572.156453318845,
      "y": -1035.206612026284,
      "z": -210,
      "radius": 6.846676809247583,
      "length": 29.876588821411133,
      "seed": 3169321976
    },
    {
      "id": "outer-ice-12-underside-spike-14",
      "x": -5385.542276019221,
      "y": -711.0341995563808,
      "z": -210,
      "radius": 10.321844787597657,
      "length": 36.863731384277344,
      "seed": 1601295550
    },
    {
      "id": "outer-ice-12-underside-spike-15",
      "x": -5494.657797330314,
      "y": -670.8537768821928,
      "z": -210,
      "radius": 9.573002548217774,
      "length": 34.18929481506348,
      "seed": 1774339335
    },
    {
      "id": "outer-ice-12-underside-spike-16",
      "x": -5554.1156328910465,
      "y": -680.0997553696524,
      "z": -210,
      "radius": 9.199963302612305,
      "length": 32.857011795043945,
      "seed": 1289387669
    },
    {
      "id": "outer-ice-12-underside-spike-17",
      "x": -5607.919672409215,
      "y": -647.2139940181316,
      "z": -210,
      "radius": 8.843800277709962,
      "length": 31.58500099182129,
      "seed": 1073032229
    },
    {
      "id": "outer-ice-12-underside-spike-18",
      "x": -5363.9562658539435,
      "y": -880.3036499673108,
      "z": -210,
      "radius": 7.924883468309417,
      "length": 37.4563684463501,
      "seed": 4205104963
    },
    {
      "id": "outer-ice-12-underside-spike-19",
      "x": -5586.130633689912,
      "y": -724.0088390101561,
      "z": -210,
      "radius": 8.76463291168213,
      "length": 31.302260398864746,
      "seed": 2989161457
    },
    {
      "id": "tundra-continent-underside-spike-0",
      "x": -1651.66044782063,
      "y": -8184.466872740513,
      "z": -185,
      "radius": 8.02772865863517,
      "length": 52.110636294325815,
      "seed": 2046472596
    },
    {
      "id": "tundra-continent-underside-spike-1",
      "x": -1789.3427367005502,
      "y": -8872.918452280335,
      "z": -185,
      "radius": 4.803462298586965,
      "length": 30.142650342401392,
      "seed": 3631719034
    },
    {
      "id": "tundra-continent-underside-spike-2",
      "x": -3133.6083937762132,
      "y": -8770.673835099355,
      "z": -185,
      "radius": 8.31313259480521,
      "length": 49.18740828212937,
      "seed": 2354599088
    },
    {
      "id": "tundra-continent-underside-spike-3",
      "x": -2905.3443810733056,
      "y": -8943.99041659576,
      "z": -185,
      "radius": 4.3686185562983155,
      "length": 28.874162643948747,
      "seed": 1508366774
    },
    {
      "id": "tundra-continent-underside-spike-4",
      "x": -1545.5811331283999,
      "y": -8466.935782358427,
      "z": -185,
      "radius": 4.711222762707621,
      "length": 37.22719678401103,
      "seed": 402446092
    },
    {
      "id": "tundra-continent-underside-spike-5",
      "x": -2761.980990305194,
      "y": -7723.774228637861,
      "z": -185,
      "radius": 10.962253868579865,
      "length": 54,
      "seed": 114550322
    },
    {
      "id": "tundra-continent-underside-spike-6",
      "x": -1470.0358788397853,
      "y": -8381.245960227343,
      "z": -185,
      "radius": 8.136063331272453,
      "length": 54,
      "seed": 899609768
    },
    {
      "id": "tundra-continent-underside-spike-7",
      "x": -2637.2647825451477,
      "y": -7544.533762507979,
      "z": -185,
      "radius": 3.277426010929048,
      "length": 32.09987476901276,
      "seed": 1256301550
    },
    {
      "id": "tundra-continent-underside-spike-8",
      "x": -3485.1953391730067,
      "y": -8335.888923897573,
      "z": -185,
      "radius": 12.110349603462964,
      "length": 54,
      "seed": 3841108356
    },
    {
      "id": "tundra-continent-underside-spike-9",
      "x": -2970.3936686877378,
      "y": -7750.761757413605,
      "z": -185,
      "radius": 4.246530679985881,
      "length": 28.10515277507835,
      "seed": 255471338
    },
    {
      "id": "tundra-continent-underside-spike-10",
      "x": -3096.358124240105,
      "y": -8816.24934450338,
      "z": -185,
      "radius": 6.3112454186193645,
      "length": 53.9488210922455,
      "seed": 1174745504
    },
    {
      "id": "tundra-continent-underside-spike-11",
      "x": -2647.098204988565,
      "y": -8923.673848034472,
      "z": -185,
      "radius": 4.614970927126706,
      "length": 32.12115551597552,
      "seed": 101049126
    },
    {
      "id": "tundra-continent-underside-spike-12",
      "x": -3289.112315204211,
      "y": -7782.967394268707,
      "z": -185,
      "radius": 4.542978367302567,
      "length": 31.44284975102343,
      "seed": 1037633788
    },
    {
      "id": "tundra-continent-underside-spike-13",
      "x": -2693.9233036373153,
      "y": -8868.431823320117,
      "z": -185,
      "radius": 13.965021904557943,
      "length": 54,
      "seed": 4146617506
    },
    {
      "id": "tundra-continent-underside-spike-14",
      "x": -3374.500062121164,
      "y": -8449.765426361364,
      "z": -185,
      "radius": 12.495567818637937,
      "length": 54,
      "seed": 2185358232
    },
    {
      "id": "tundra-continent-underside-spike-15",
      "x": -3186.572119016061,
      "y": -7717.0513574078905,
      "z": -185,
      "radius": 13.674265923909843,
      "length": 54,
      "seed": 708605790
    },
    {
      "id": "tundra-continent-underside-spike-16",
      "x": -2999.441078018963,
      "y": -7772.730938825298,
      "z": -185,
      "radius": 15.120000000000001,
      "length": 54,
      "seed": 1224791412
    },
    {
      "id": "tundra-continent-underside-spike-17",
      "x": -2913.9654951407583,
      "y": -7632.474105652518,
      "z": -185,
      "radius": 15.120000000000001,
      "length": 54,
      "seed": 1238388570
    },
    {
      "id": "tundra-continent-underside-spike-18",
      "x": -2481.7028488163055,
      "y": -8862.530020587243,
      "z": -185,
      "radius": 4.932650450151414,
      "length": 34.086155784372636,
      "seed": 371196560
    },
    {
      "id": "tundra-continent-underside-spike-19",
      "x": -1767.1849848454126,
      "y": -7952.9589112910435,
      "z": -185,
      "radius": 9.074800671078265,
      "length": 54,
      "seed": 1541488790
    }
  ],
  "tubeCoral": [
    {
      "id": "blue-tube-0",
      "clusterId": "tube-cluster-0",
      "x": 123.23995686760178,
      "y": -123.67765077128975,
      "z": -373.927097,
      "height": 34.30083532561548,
      "radius": 7.613140197470784,
      "seed": 1105833514,
      "groundOffset": 0
    },
    {
      "id": "blue-tube-1",
      "clusterId": "tube-cluster-0",
      "x": 115.94280006585122,
      "y": -145.39898109774356,
      "z": -390.07364,
      "height": 51.27574853086844,
      "radius": 8.801282017724589,
      "seed": 746551877,
      "groundOffset": 0
    },
    {
      "id": "blue-tube-2",
      "clusterId": "tube-cluster-0",
      "x": 125.86161237446478,
      "y": -104.85329775221281,
      "z": -335.651171,
      "height": 28.059298113686964,
      "radius": 9.12554582906887,
      "seed": 333969428,
      "groundOffset": 0
    },
    {
      "id": "blue-tube-3",
      "clusterId": "tube-cluster-0",
      "x": 144.45536375469632,
      "y": -139.40413428540037,
      "z": -369.870005,
      "height": 32.350403597578406,
      "radius": 10.15801917645149,
      "seed": 1168548935,
      "groundOffset": 0
    },
    {
      "id": "blue-tube-4",
      "clusterId": "tube-cluster-1",
      "x": 290.17611396029264,
      "y": -276.34607461821497,
      "z": -280,
      "height": 28.874103478854522,
      "radius": 8.660188524518162,
      "seed": 423909592
    },
    {
      "id": "blue-tube-5",
      "clusterId": "tube-cluster-1",
      "x": 273.88547266143763,
      "y": -268.3438338442635,
      "z": -280,
      "height": 33.23727074358612,
      "radius": 5.302792096277699,
      "seed": 3419532155
    },
    {
      "id": "blue-tube-6",
      "clusterId": "tube-cluster-1",
      "x": 294.6953600635292,
      "y": -250.56643720043445,
      "z": -280,
      "height": 29.801875439705327,
      "radius": 10.15926793217659,
      "seed": 186501298
    },
    {
      "id": "blue-tube-7",
      "clusterId": "tube-cluster-1",
      "x": 264.02282492685134,
      "y": -281.49973242188497,
      "z": -280,
      "height": 30.71753715677187,
      "radius": 6.447818208718672,
      "seed": 867663153
    },
    {
      "id": "blue-tube-8",
      "clusterId": "tube-cluster-2",
      "x": 204.37744836570096,
      "y": -43.05405445824875,
      "z": -379.479203,
      "height": 50.09618578501977,
      "radius": 5.021418577991426,
      "seed": 1877273558,
      "groundOffset": 0
    },
    {
      "id": "blue-tube-9",
      "clusterId": "tube-cluster-2",
      "x": 224.14519724277062,
      "y": -40.15137398249415,
      "z": -358.725423,
      "height": 32.24520729621872,
      "radius": 4.153997598448768,
      "seed": 581884297,
      "groundOffset": 0
    },
    {
      "id": "blue-tube-10",
      "clusterId": "tube-cluster-2",
      "x": 227.29431329748692,
      "y": -58.07096496350234,
      "z": -368.407726,
      "height": 54.08350911340676,
      "radius": 7.640342684928328,
      "seed": 1114485704,
      "groundOffset": 0
    },
    {
      "id": "blue-tube-11",
      "clusterId": "tube-cluster-3",
      "x": 314.89832822552944,
      "y": -358.9253679894072,
      "z": -280,
      "height": 38.44401900237426,
      "radius": 4.7549125796649605,
      "seed": 1785992217
    },
    {
      "id": "blue-tube-12",
      "clusterId": "tube-cluster-3",
      "x": 331.70736189846156,
      "y": -380.70884426829207,
      "z": -280,
      "height": 26.640372968977317,
      "radius": 4.937232507858425,
      "seed": 2793437720
    },
    {
      "id": "blue-tube-13",
      "clusterId": "tube-cluster-3",
      "x": 332.287581308889,
      "y": -365.8408285009282,
      "z": -280,
      "height": 39.33569075167179,
      "radius": 4.186619610292837,
      "seed": 3975276831
    },
    {
      "id": "blue-tube-14",
      "clusterId": "tube-cluster-3",
      "x": 298.156408855851,
      "y": -349.77990264944975,
      "z": -280,
      "height": 41.812722370261326,
      "radius": 9.921188573352993,
      "seed": 2282753350
    },
    {
      "id": "blue-tube-15",
      "clusterId": "tube-cluster-4",
      "x": 289.7481808398137,
      "y": -64.04738808222862,
      "z": -280,
      "height": 52.43783841654658,
      "radius": 7.554514434887096,
      "seed": 2311414063
    },
    {
      "id": "blue-tube-16",
      "clusterId": "tube-cluster-4",
      "x": 274.43620754691386,
      "y": -46.958692661444786,
      "z": -280,
      "height": 39.91089728125371,
      "radius": 7.906884006224573,
      "seed": 444279574
    },
    {
      "id": "blue-tube-17",
      "clusterId": "tube-cluster-4",
      "x": 302.31189463704607,
      "y": -78.60967117818764,
      "z": -280,
      "height": 63.65078690974042,
      "radius": 6.58247846388258,
      "seed": 2020817921
    },
    {
      "id": "blue-tube-18",
      "clusterId": "tube-cluster-4",
      "x": 303.2155603177001,
      "y": -50.38650910354893,
      "z": -280,
      "height": 34.5663635188248,
      "radius": 5.544914152938873,
      "seed": 3534567776
    },
    {
      "id": "blue-tube-19",
      "clusterId": "tube-cluster-4",
      "x": 265.9634327445032,
      "y": -72.86537200574688,
      "z": -335.569709,
      "height": 57.305286339484155,
      "radius": 5.346370845800266,
      "seed": 3785080035,
      "groundOffset": 0
    },
    {
      "id": "blue-tube-20",
      "clusterId": "tube-cluster-5",
      "x": -221.0687582343843,
      "y": -358.0111613695677,
      "z": -280,
      "height": 46.9602755473461,
      "radius": 7.508969374466687,
      "seed": 3077031344
    },
    {
      "id": "blue-tube-21",
      "clusterId": "tube-cluster-5",
      "x": -213.91545512212878,
      "y": -335.12584553684366,
      "z": -280,
      "height": 57.99137397389859,
      "radius": 6.135792519664392,
      "seed": 1090205171
    },
    {
      "id": "blue-tube-22",
      "clusterId": "tube-cluster-6",
      "x": -446.7207410941966,
      "y": 358.9561743366576,
      "z": -280,
      "height": 47.30554709187709,
      "radius": 10.293413619045168,
      "seed": 591709608
    },
    {
      "id": "blue-tube-23",
      "clusterId": "tube-cluster-6",
      "x": -449.4070880119035,
      "y": 336.79246212673615,
      "z": -280,
      "height": 24.29117610771209,
      "radius": 5.6804196739103645,
      "seed": 2203579147
    },
    {
      "id": "blue-tube-24",
      "clusterId": "tube-cluster-6",
      "x": -449.54447888955485,
      "y": 387.7203365626527,
      "z": -280,
      "height": 49.713241308229044,
      "radius": 10.648324714973569,
      "seed": 3010422762
    },
    {
      "id": "blue-tube-25",
      "clusterId": "tube-cluster-7",
      "x": 321.6832886356343,
      "y": -269.0450349570563,
      "z": -280,
      "height": 31.33801730442792,
      "radius": 7.223971826722845,
      "seed": 3935845675
    },
    {
      "id": "blue-tube-26",
      "clusterId": "tube-cluster-8",
      "x": 40.38638283318858,
      "y": -210.16782586478993,
      "z": -390.367312,
      "height": 65.75983820552938,
      "radius": 7.869029487948865,
      "seed": 2580973860,
      "groundOffset": 0
    },
    {
      "id": "blue-tube-27",
      "clusterId": "tube-cluster-8",
      "x": 39.83031978893495,
      "y": -191.20927917711498,
      "z": -395.976681,
      "height": 56.05116628203541,
      "radius": 6.421141603728756,
      "seed": 170453051,
      "groundOffset": 0
    },
    {
      "id": "blue-tube-28",
      "clusterId": "tube-cluster-8",
      "x": 37.15543070962819,
      "y": -235.3544032368074,
      "z": -384.997126,
      "height": 30.48845372837968,
      "radius": 10.193512603640556,
      "seed": 1757256306,
      "groundOffset": 0
    },
    {
      "id": "blue-tube-29",
      "clusterId": "tube-cluster-9",
      "x": 174.1700657475975,
      "y": 386.0296228846254,
      "z": -280,
      "height": 60.58872562460601,
      "radius": 8.07876509311609,
      "seed": 1864936743
    },
    {
      "id": "blue-tube-30",
      "clusterId": "tube-cluster-9",
      "x": 197.38421326950458,
      "y": 385.6295991785972,
      "z": -280,
      "height": 46.46352252946235,
      "radius": 4.994230286218226,
      "seed": 1996588078
    },
    {
      "id": "blue-tube-31",
      "clusterId": "tube-cluster-9",
      "x": 179.18217086399687,
      "y": 367.32651856307575,
      "z": -280,
      "height": 45.9859330705367,
      "radius": 5.96775602013804,
      "seed": 139352505
    },
    {
      "id": "blue-tube-32",
      "clusterId": "tube-cluster-10",
      "x": 477.8539724129673,
      "y": -338.13734611885775,
      "z": -280,
      "height": 25.855659323045984,
      "radius": 8.764494863338768,
      "seed": 2046163966
    },
    {
      "id": "blue-tube-33",
      "clusterId": "tube-cluster-10",
      "x": 455.0838045642095,
      "y": -351.2809225769515,
      "z": -280,
      "height": 39.7108284314163,
      "radius": 9.621486050309613,
      "seed": 1982249869
    },
    {
      "id": "blue-tube-34",
      "clusterId": "tube-cluster-10",
      "x": 504.86552769875044,
      "y": -340.8666583984883,
      "z": -280,
      "height": 29.17992817494087,
      "radius": 10.777899613138288,
      "seed": 2306928444
    },
    {
      "id": "blue-tube-35",
      "clusterId": "tube-cluster-11",
      "x": -402.7012967058916,
      "y": 313.4222752253827,
      "z": -280,
      "height": 40.90179753722623,
      "radius": 8.741316148312762,
      "seed": 3165947677
    },
    {
      "id": "blue-tube-36",
      "clusterId": "tube-cluster-11",
      "x": -377.29160116833225,
      "y": 303.8115258267014,
      "z": -280,
      "height": 37.25242531555705,
      "radius": 4.394320101942867,
      "seed": 4135084684
    },
    {
      "id": "blue-tube-37",
      "clusterId": "tube-cluster-11",
      "x": -398.49973743993087,
      "y": 331.35625969079086,
      "z": -280,
      "height": 36.234039230272174,
      "radius": 4.055057449964806,
      "seed": 1528278375
    },
    {
      "id": "blue-tube-38",
      "clusterId": "tube-cluster-12",
      "x": 27.661915378493845,
      "y": 214.90826193003463,
      "z": -280,
      "height": 46.327100882073864,
      "radius": 9.583957672584802,
      "seed": 2571652304
    },
    {
      "id": "blue-tube-39",
      "clusterId": "tube-cluster-12",
      "x": 14.442803701112432,
      "y": 239.60685486721704,
      "z": -280,
      "height": 37.87344882916659,
      "radius": 10.649850118672475,
      "seed": 3052752019
    },
    {
      "id": "blue-tube-40",
      "clusterId": "tube-cluster-12",
      "x": 20.098460518827462,
      "y": 195.64578916142827,
      "z": -280,
      "height": 41.726771413581446,
      "radius": 8.415510969236493,
      "seed": 1631899242
    },
    {
      "id": "blue-tube-41",
      "clusterId": "tube-cluster-13",
      "x": 325.67327211609063,
      "y": 315.67352720948713,
      "z": -280,
      "height": 57.200977897271514,
      "radius": 4.616169727174565,
      "seed": 487966087
    },
    {
      "id": "blue-tube-42",
      "clusterId": "tube-cluster-13",
      "x": 315.58921664200665,
      "y": 295.1087235546054,
      "z": -280,
      "height": 61.523909790674224,
      "radius": 5.467932664789259,
      "seed": 1307991822
    },
    {
      "id": "blue-tube-43",
      "clusterId": "tube-cluster-13",
      "x": 337.42437474133055,
      "y": 342.0256548720388,
      "z": -280,
      "height": 38.30197070958093,
      "radius": 7.799831086071208,
      "seed": 3190889821
    },
    {
      "id": "blue-tube-44",
      "clusterId": "tube-cluster-13",
      "x": 317.6474723400281,
      "y": 330.0800292697743,
      "z": -280,
      "height": 59.994378733215854,
      "radius": 6.681149499025196,
      "seed": 1439496140
    },
    {
      "id": "blue-tube-45",
      "clusterId": "tube-cluster-14",
      "x": -211.97088641568862,
      "y": 55.89484259880709,
      "z": -375.53842,
      "height": 50.037107029464096,
      "radius": 10.16700785444118,
      "seed": 2170370985,
      "groundOffset": 0
    },
    {
      "id": "blue-tube-46",
      "clusterId": "tube-cluster-14",
      "x": -208.49700450349127,
      "y": 37.0895746448621,
      "z": -393.266707,
      "height": 31.985418069874868,
      "radius": 6.066833967808634,
      "seed": 3112720744,
      "groundOffset": 0
    },
    {
      "id": "blue-tube-47",
      "clusterId": "tube-cluster-15",
      "x": -1390.5030600260943,
      "y": 1076.0416905395687,
      "z": -282.216685,
      "height": 31.869123,
      "radius": 5.4304932586383075,
      "seed": 4124507711
    },
    {
      "id": "blue-tube-48",
      "clusterId": "tube-cluster-15",
      "x": -1400.7019208672393,
      "y": 1057.901664821551,
      "z": -282.295274,
      "height": 65.038869,
      "radius": 8.913601292297244,
      "seed": 4220004474
    },
    {
      "id": "blue-tube-49",
      "clusterId": "tube-cluster-16",
      "x": -2490.0142282713205,
      "y": -1269.2184820305556,
      "z": -285.961547,
      "height": 63.970268,
      "radius": 9.480809250148013,
      "seed": 2264920989
    },
    {
      "id": "blue-tube-50",
      "clusterId": "tube-cluster-16",
      "x": -2473.618006178301,
      "y": -1288.3896392263177,
      "z": -285.868821,
      "height": 55.414017,
      "radius": 5.2867464437149465,
      "seed": 268619020
    },
    {
      "id": "blue-tube-51",
      "clusterId": "tube-cluster-16",
      "x": -2480.559177692773,
      "y": -1245.6662234532746,
      "z": -286.086871,
      "height": 48.910028,
      "radius": 10.44936277042143,
      "seed": 1755431519
    },
    {
      "id": "blue-tube-52",
      "clusterId": "tube-cluster-16",
      "x": -2469.0043041886606,
      "y": -1271.6164200055998,
      "z": -285.957342,
      "height": 27.516221,
      "radius": 6.833688939921558,
      "seed": 2661022086
    },
    {
      "id": "blue-tube-53",
      "clusterId": "tube-cluster-17",
      "x": -2141.808262700215,
      "y": -1939.5928945858032,
      "z": -419.208119,
      "height": 32.325682,
      "radius": 4.200008930871263,
      "seed": 1317236857
    },
    {
      "id": "blue-tube-54",
      "clusterId": "tube-cluster-17",
      "x": -2164.766592274817,
      "y": -1951.6750594882774,
      "z": -425.478565,
      "height": 29.73595,
      "radius": 7.067963799927384,
      "seed": 268962040
    },
    {
      "id": "blue-tube-55",
      "clusterId": "tube-cluster-17",
      "x": -2121.7118053367653,
      "y": -1918.861408835517,
      "z": -397.737778,
      "height": 64.124909,
      "radius": 7.87040870054625,
      "seed": 2853824283
    },
    {
      "id": "blue-tube-56",
      "clusterId": "tube-cluster-17",
      "x": -2139.544893282503,
      "y": -1966.1306791409731,
      "z": -466.957355,
      "height": 47.513981,
      "radius": 5.356349311769009,
      "seed": 2584818130
    },
    {
      "id": "blue-tube-57",
      "clusterId": "tube-cluster-18",
      "x": 592.839960148558,
      "y": -594.7772963438183,
      "z": -280.06376869201574,
      "height": 27.946414485108107,
      "radius": 4.54567588516511,
      "seed": 1570334673
    },
    {
      "id": "blue-tube-58",
      "clusterId": "tube-cluster-18",
      "x": 592.841103420361,
      "y": -571.1155274071792,
      "z": -280.0330610098007,
      "height": 45.562741638859734,
      "radius": 9.35227768914774,
      "seed": 1466016752
    },
    {
      "id": "blue-tube-59",
      "clusterId": "tube-cluster-18",
      "x": 575.625364591039,
      "y": -605.1805381433304,
      "z": -280.0632205543523,
      "height": 31.1705923108384,
      "radius": 6.118366908049211,
      "seed": 3927110451
    },
    {
      "id": "blue-tube-60",
      "clusterId": "tube-cluster-18",
      "x": 576.2602238368931,
      "y": -586.0590526790916,
      "z": -280.04062307214764,
      "height": 26.907303563551977,
      "radius": 4.0785605404525995,
      "seed": 2158974602
    },
    {
      "id": "blue-tube-61",
      "clusterId": "tube-cluster-18",
      "x": 611.6592505009797,
      "y": -583.9360266753594,
      "z": -280.06347050202254,
      "height": 45.60876743728295,
      "radius": 8.062867201166227,
      "seed": 4271940901
    },
    {
      "id": "blue-tube-62",
      "clusterId": "tube-cluster-19",
      "x": -235.04030024632812,
      "y": -1445.6965932389721,
      "z": -275.595707,
      "height": 51.446861,
      "radius": 6.652013624552637,
      "seed": 3879533544
    },
    {
      "id": "blue-tube-63",
      "clusterId": "tube-cluster-19",
      "x": -216.73847103126528,
      "y": -1463.5061445945462,
      "z": -278.436951,
      "height": 61.377152,
      "radius": 5.511879121651873,
      "seed": 1452648523
    },
    {
      "id": "blue-tube-64",
      "clusterId": "tube-cluster-19",
      "x": -243.27283268807082,
      "y": -1469.459149066992,
      "z": -282.907651,
      "height": 63.152617,
      "radius": 6.238539453595877,
      "seed": 1545068610
    },
    {
      "id": "blue-tube-65",
      "clusterId": "tube-cluster-19",
      "x": -245.55753506114067,
      "y": -1425.357264753284,
      "z": -275.498259,
      "height": 52.738933,
      "radius": 6.933372096391395,
      "seed": 3801902333
    },
    {
      "id": "blue-tube-66",
      "clusterId": "tube-cluster-20",
      "x": 348.59555708244443,
      "y": 392.4089532578364,
      "z": -280,
      "height": 41.71304604946636,
      "radius": 10.802729543764144,
      "seed": 312275168
    },
    {
      "id": "blue-tube-67",
      "clusterId": "tube-cluster-20",
      "x": 350.9210335321888,
      "y": 417.61524038486385,
      "z": -279.621551,
      "height": 46.699264,
      "radius": 8.167989790206775,
      "seed": 4272776803
    },
    {
      "id": "blue-tube-68",
      "clusterId": "tube-cluster-20",
      "x": 323.6312068575405,
      "y": 383.18202847594887,
      "z": -280,
      "height": 55.448525903979316,
      "radius": 4.67350182775408,
      "seed": 3868591310
    },
    {
      "id": "blue-tube-69",
      "clusterId": "tube-cluster-21",
      "x": -157.85762504674494,
      "y": -1312.479160213843,
      "z": -274.961938,
      "height": 50.241801,
      "radius": 4.769687317544594,
      "seed": 728952481
    },
    {
      "id": "blue-tube-70",
      "clusterId": "tube-cluster-21",
      "x": -184.82765135350627,
      "y": -1319.2848815490045,
      "z": -275.026439,
      "height": 41.727704,
      "radius": 8.919860858935863,
      "seed": 2090212736
    },
    {
      "id": "blue-tube-71",
      "clusterId": "tube-cluster-21",
      "x": -158.4762661331775,
      "y": -1293.2498847458226,
      "z": -274.899902,
      "height": 28.730972,
      "radius": 4.760832838481292,
      "seed": 2080873603
    },
    {
      "id": "blue-tube-72",
      "clusterId": "tube-cluster-21",
      "x": -141.61586120622954,
      "y": -1334.4089757996576,
      "z": -275.024546,
      "height": 38.861356,
      "radius": 7.409763103350997,
      "seed": 1989367962
    },
    {
      "id": "blue-tube-73",
      "clusterId": "tube-cluster-22",
      "x": -2030.5012850556523,
      "y": -1295.4391601029783,
      "z": -285.053468,
      "height": 61.280214,
      "radius": 10.684702590340748,
      "seed": 3731559361
    },
    {
      "id": "blue-tube-74",
      "clusterId": "tube-cluster-22",
      "x": -2038.1712791149084,
      "y": -1313.7546760817816,
      "z": -284.931444,
      "height": 36.463322,
      "radius": 5.4412511312402785,
      "seed": 3668000200
    },
    {
      "id": "blue-tube-75",
      "clusterId": "tube-cluster-23",
      "x": 672.4192308727652,
      "y": 969.7670664638281,
      "z": -275.798053,
      "height": 38.518309,
      "radius": 8.71013705036603,
      "seed": 718261171
    },
    {
      "id": "blue-tube-76",
      "clusterId": "tube-cluster-23",
      "x": 694.3057388655069,
      "y": 984.8837657328148,
      "z": -275.797663,
      "height": 65.677986,
      "radius": 6.125818053260446,
      "seed": 516816138
    },
    {
      "id": "blue-tube-77",
      "clusterId": "tube-cluster-23",
      "x": 649.0105503177545,
      "y": 955.9770025636539,
      "z": -275.823075,
      "height": 63.430387,
      "radius": 9.507803685264662,
      "seed": 3568771493
    },
    {
      "id": "blue-tube-78",
      "clusterId": "tube-cluster-23",
      "x": 666.4657756249841,
      "y": 992.9269435992751,
      "z": -276.022992,
      "height": 27.375237,
      "radius": 5.169051266741008,
      "seed": 652920308
    },
    {
      "id": "blue-tube-79",
      "clusterId": "tube-cluster-24",
      "x": -1807.9503952991217,
      "y": 606.5851769410074,
      "z": -284.393076,
      "height": 46.050951,
      "radius": 10.033443835331127,
      "seed": 3689980719
    },
    {
      "id": "blue-tube-80",
      "clusterId": "tube-cluster-24",
      "x": -1802.8879975945265,
      "y": 632.9179985075409,
      "z": -284.322221,
      "height": 30.010178,
      "radius": 10.251761606894433,
      "seed": 1765942550
    },
    {
      "id": "blue-tube-81",
      "clusterId": "tube-cluster-24",
      "x": -1829.1227820171378,
      "y": 598.5864698427505,
      "z": -284.451372,
      "height": 34.808454,
      "radius": 5.9693277480546385,
      "seed": 495717889
    },
    {
      "id": "blue-tube-82",
      "clusterId": "tube-cluster-25",
      "x": -2327.207604702562,
      "y": 1750.184270576574,
      "z": -281.380559,
      "height": 61.268418,
      "radius": 6.657733934465796,
      "seed": 1084968712
    },
    {
      "id": "blue-tube-83",
      "clusterId": "tube-cluster-25",
      "x": -2348.3922708535742,
      "y": 1751.0150897401543,
      "z": -281.405674,
      "height": 45.020511,
      "radius": 5.090361473849043,
      "seed": 2859653867
    },
    {
      "id": "blue-tube-84",
      "clusterId": "tube-cluster-25",
      "x": -2309.989873913986,
      "y": 1748.1117393738884,
      "z": -281.365803,
      "height": 29.267767,
      "radius": 8.513630235567689,
      "seed": 3251384394
    },
    {
      "id": "blue-tube-85",
      "clusterId": "tube-cluster-26",
      "x": 672.4650104995817,
      "y": -1910.6643155682832,
      "z": -283.234336,
      "height": 27.496837,
      "radius": 6.305221056798473,
      "seed": 1231267561
    },
    {
      "id": "blue-tube-86",
      "clusterId": "tube-cluster-26",
      "x": 700.6158050836232,
      "y": -1916.4429055066887,
      "z": -283.443858,
      "height": 33.272411,
      "radius": 6.098975996021181,
      "seed": 320294824
    },
    {
      "id": "blue-tube-87",
      "clusterId": "tube-cluster-26",
      "x": 668.9105791165746,
      "y": -1885.6959834649817,
      "z": -282.948404,
      "height": 26.100885,
      "radius": 6.799625029554591,
      "seed": 505681163
    },
    {
      "id": "blue-tube-88",
      "clusterId": "tube-cluster-27",
      "x": -2134.308281354606,
      "y": 1672.6428606314585,
      "z": -281.425728,
      "height": 30.55792,
      "radius": 6.344785796478391,
      "seed": 1823670762
    },
    {
      "id": "blue-tube-89",
      "clusterId": "tube-cluster-27",
      "x": -2136.9209288142024,
      "y": 1698.2801725587633,
      "z": -281.326535,
      "height": 61.413375,
      "radius": 8.095818086760119,
      "seed": 2296440581
    },
    {
      "id": "blue-tube-90",
      "clusterId": "tube-cluster-27",
      "x": -2153.8901184479296,
      "y": 1660.3622077647676,
      "z": -281.503418,
      "height": 43.914835,
      "radius": 5.269217195454985,
      "seed": 223518792
    },
    {
      "id": "blue-tube-91",
      "clusterId": "tube-cluster-28",
      "x": -461.33971023373306,
      "y": 823.5664957202971,
      "z": -280.311362,
      "height": 65.886179,
      "radius": 8.036181690869853,
      "seed": 974674199
    },
    {
      "id": "blue-tube-92",
      "clusterId": "tube-cluster-28",
      "x": -485.1237997865476,
      "y": 808.9814261657922,
      "z": -280.412059,
      "height": 42.824604,
      "radius": 8.976852600462735,
      "seed": 1436187230
    },
    {
      "id": "blue-tube-93",
      "clusterId": "tube-cluster-28",
      "x": -438.17690936773835,
      "y": 825.9045431237931,
      "z": -280.235967,
      "height": 26.538595,
      "radius": 9.31197123718448,
      "seed": 3551576685
    },
    {
      "id": "blue-tube-94",
      "clusterId": "tube-cluster-28",
      "x": -483.11346557870166,
      "y": 839.2878594037377,
      "z": -280.348308,
      "height": 57.274026,
      "radius": 10.216792134102434,
      "seed": 3484184220
    },
    {
      "id": "blue-tube-95",
      "clusterId": "tube-cluster-29",
      "x": -478.56928086839616,
      "y": 749.9790702015162,
      "z": -280.502221,
      "height": 31.492678,
      "radius": 7.102759483968839,
      "seed": 3562160723
    },
    {
      "id": "blue-tube-96",
      "clusterId": "tube-cluster-29",
      "x": -482.1577980483023,
      "y": 778.2614782906901,
      "z": -280.460089,
      "height": 41.080777,
      "radius": 5.830301912501454,
      "seed": 39327018
    },
    {
      "id": "blue-tube-97",
      "clusterId": "tube-cluster-29",
      "x": -505.4336741723411,
      "y": 747.0395939984074,
      "z": -280.59477,
      "height": 64.120988,
      "radius": 6.594123273389414,
      "seed": 3864192325
    },
    {
      "id": "blue-tube-98",
      "clusterId": "tube-cluster-29",
      "x": -488.6402757099528,
      "y": 733.3247384640827,
      "z": -280.585684,
      "height": 30.351327,
      "radius": 9.521379699464887,
      "seed": 1020664124
    },
    {
      "id": "blue-tube-99",
      "clusterId": "tube-cluster-30",
      "x": 179.40039806999266,
      "y": -720.2588368207216,
      "z": -277.326209,
      "height": 58.702956,
      "radius": 6.138992901658639,
      "seed": 2237198451
    },
    {
      "id": "blue-tube-100",
      "clusterId": "tube-cluster-30",
      "x": 193.1767862413271,
      "y": -727.1999419140758,
      "z": -276.895392,
      "height": 29.159917,
      "radius": 4.594769889488816,
      "seed": 3890632394
    },
    {
      "id": "blue-tube-101",
      "clusterId": "tube-cluster-30",
      "x": 177.98791129174765,
      "y": -703.5537853509234,
      "z": -278.335245,
      "height": 65.366677,
      "radius": 8.371087393956259,
      "seed": 1560132709
    },
    {
      "id": "blue-tube-102",
      "clusterId": "tube-cluster-30",
      "x": 164.98359343188025,
      "y": -727.3072184514735,
      "z": -276.932796,
      "height": 56.024007,
      "radius": 5.339238355401903,
      "seed": 3060822568
    },
    {
      "id": "blue-tube-103",
      "clusterId": "tube-cluster-31",
      "x": -1552.4033158551902,
      "y": 1618.8839740119874,
      "z": -280.709954,
      "height": 57.895566,
      "radius": 6.693265062524006,
      "seed": 2358705135
    },
    {
      "id": "blue-tube-104",
      "clusterId": "tube-cluster-31",
      "x": -1534.1141712378942,
      "y": 1639.8979587604624,
      "z": -280.601604,
      "height": 23.804204,
      "radius": 9.35039574559778,
      "seed": 3801506518
    },
    {
      "id": "blue-tube-105",
      "clusterId": "tube-cluster-31",
      "x": -1562.0939501535943,
      "y": 1641.724556417236,
      "z": -280.642725,
      "height": 63.730065,
      "radius": 4.333983555668965,
      "seed": 1354005697
    },
    {
      "id": "blue-tube-106",
      "clusterId": "tube-cluster-33",
      "x": 331.9751032628119,
      "y": 1313.4733041981235,
      "z": -277.718417,
      "height": 41.503338,
      "radius": 5.086782331112772,
      "seed": 1276699496
    },
    {
      "id": "blue-tube-107",
      "clusterId": "tube-cluster-33",
      "x": 335.3808786349411,
      "y": 1334.5107175020507,
      "z": -277.678651,
      "height": 38.860563,
      "radius": 4.1592970544006675,
      "seed": 3337929163
    },
    {
      "id": "blue-tube-108",
      "clusterId": "tube-cluster-33",
      "x": 335.3522269426444,
      "y": 1298.261611507105,
      "z": -277.728764,
      "height": 63.719474,
      "radius": 5.46873190626502,
      "seed": 1471161282
    },
    {
      "id": "blue-tube-109",
      "clusterId": "tube-cluster-33",
      "x": 316.3553454486859,
      "y": 1331.9716196526804,
      "z": -277.708557,
      "height": 65.781925,
      "radius": 7.856467948528007,
      "seed": 2454254205
    },
    {
      "id": "outer-blue-tube-0",
      "clusterId": "outer-tube-cluster-0",
      "x": -4282,
      "y": -4975,
      "z": -802.482551,
      "height": 25.529383,
      "radius": 7.612235177773982,
      "seed": 1562141696
    },
    {
      "id": "outer-blue-tube-1",
      "clusterId": "outer-tube-cluster-0",
      "x": -4258,
      "y": -4925,
      "z": -871.216827,
      "height": 35.478218,
      "radius": 8.463351033395156,
      "seed": 2663594243
    },
    {
      "id": "outer-blue-tube-2",
      "clusterId": "outer-tube-cluster-1",
      "x": -4222,
      "y": -3875,
      "z": -985.359638,
      "height": 57.5027,
      "radius": 5.107663726434112,
      "seed": 3126801178
    },
    {
      "id": "outer-blue-tube-3",
      "clusterId": "outer-tube-cluster-1",
      "x": -4198,
      "y": -3825,
      "z": -895.558796,
      "height": 61.141559,
      "radius": 10.56530274800025,
      "seed": 2284993043
    },
    {
      "id": "outer-blue-tube-4",
      "clusterId": "outer-tube-cluster-2",
      "x": -4302,
      "y": -2775,
      "z": -865.883476,
      "height": 33.717432,
      "radius": 8.20330129750073,
      "seed": 3339916778
    },
    {
      "id": "outer-blue-tube-5",
      "clusterId": "outer-tube-cluster-2",
      "x": -4278,
      "y": -2725,
      "z": -865.696941,
      "height": 62.562676,
      "radius": 6.724372891942039,
      "seed": 3542627337
    },
    {
      "id": "outer-blue-tube-6",
      "clusterId": "outer-tube-cluster-3",
      "x": -4232,
      "y": -1675,
      "z": -279.982672,
      "height": 35.90342,
      "radius": 10.238784306682646,
      "seed": 529481358
    },
    {
      "id": "outer-blue-tube-7",
      "clusterId": "outer-tube-cluster-3",
      "x": -4208,
      "y": -1625,
      "z": -278.459596,
      "height": 65.211621,
      "radius": 7.79894217220135,
      "seed": 789358301
    },
    {
      "id": "outer-blue-tube-8",
      "clusterId": "outer-tube-cluster-4",
      "x": -4342,
      "y": -575,
      "z": -275.322364,
      "height": 59.340137,
      "radius": 10.39557246863842,
      "seed": 2984118386
    },
    {
      "id": "outer-blue-tube-9",
      "clusterId": "outer-tube-cluster-4",
      "x": -4318,
      "y": -525,
      "z": -275.474646,
      "height": 55.793914,
      "radius": 6.484685232164338,
      "seed": 3596781165
    },
    {
      "id": "outer-blue-tube-10",
      "clusterId": "outer-tube-cluster-5",
      "x": -4232,
      "y": 525,
      "z": -281.292272,
      "height": 35.255527,
      "radius": 8.561538782902062,
      "seed": 1197181438
    },
    {
      "id": "outer-blue-tube-11",
      "clusterId": "outer-tube-cluster-5",
      "x": -4208,
      "y": 575,
      "z": -282.493176,
      "height": 59.882369,
      "radius": 7.345014554681256,
      "seed": 1986638221
    },
    {
      "id": "outer-blue-tube-12",
      "clusterId": "outer-tube-cluster-6",
      "x": -4302,
      "y": 1625,
      "z": -282.826202,
      "height": 65.444995,
      "radius": 10.192271222826093,
      "seed": 310660412
    },
    {
      "id": "outer-blue-tube-13",
      "clusterId": "outer-tube-cluster-6",
      "x": -4278,
      "y": 1675,
      "z": -282.779496,
      "height": 50.853407,
      "radius": 8.244137445697561,
      "seed": 1625841881
    },
    {
      "id": "outer-blue-tube-14",
      "clusterId": "outer-tube-cluster-7",
      "x": -4212,
      "y": 2725,
      "z": -281.014493,
      "height": 50.80735,
      "radius": 5.796869902405888,
      "seed": 2303089624
    },
    {
      "id": "outer-blue-tube-15",
      "clusterId": "outer-tube-cluster-7",
      "x": -4188,
      "y": 2775,
      "z": -280.866982,
      "height": 35.424894,
      "radius": 8.506237737601623,
      "seed": 1869721987
    },
    {
      "id": "outer-blue-tube-16",
      "clusterId": "outer-tube-cluster-8",
      "x": -4292,
      "y": 3825,
      "z": -279.371906,
      "height": 61.207035,
      "radius": 6.057980244979262,
      "seed": 541391258
    },
    {
      "id": "outer-blue-tube-17",
      "clusterId": "outer-tube-cluster-8",
      "x": -4268,
      "y": 3875,
      "z": -279.218755,
      "height": 47.68192,
      "radius": 4.640589576913044,
      "seed": 2119294959
    },
    {
      "id": "outer-blue-tube-18",
      "clusterId": "outer-tube-cluster-9",
      "x": -4172,
      "y": 4925,
      "z": -279.794309,
      "height": 37.676809,
      "radius": 9.423743552528322,
      "seed": 3499833046
    },
    {
      "id": "outer-blue-tube-19",
      "clusterId": "outer-tube-cluster-9",
      "x": -4148,
      "y": 4975,
      "z": -279.815464,
      "height": 36.860365,
      "radius": 5.56695069395937,
      "seed": 1561690305
    },
    {
      "id": "outer-blue-tube-20",
      "clusterId": "outer-tube-cluster-10",
      "x": -5242,
      "y": -4425,
      "z": -832.37908,
      "height": 64.136578,
      "radius": 9.240537717472762,
      "seed": 1587423316
    },
    {
      "id": "outer-blue-tube-21",
      "clusterId": "outer-tube-cluster-10",
      "x": -5218,
      "y": -4375,
      "z": -854.062458,
      "height": 53.594869,
      "radius": 7.455544571625069,
      "seed": 203886869
    },
    {
      "id": "outer-blue-tube-22",
      "clusterId": "outer-tube-cluster-11",
      "x": -5242,
      "y": -2675,
      "z": -462.283534,
      "height": 49.445203,
      "radius": 8.517030175309628,
      "seed": 4185407908
    },
    {
      "id": "outer-blue-tube-23",
      "clusterId": "outer-tube-cluster-11",
      "x": -5218,
      "y": -2625,
      "z": -498.294854,
      "height": 45.543571,
      "radius": 7.108682066900656,
      "seed": 1037692959
    },
    {
      "id": "outer-blue-tube-24",
      "clusterId": "outer-tube-cluster-12",
      "x": -5242,
      "y": 4325,
      "z": -287.984605,
      "height": 55.902568,
      "radius": 7.365267390850931,
      "seed": 3466581864
    },
    {
      "id": "outer-blue-tube-25",
      "clusterId": "outer-tube-cluster-12",
      "x": -5218,
      "y": 4375,
      "z": -287.961284,
      "height": 40.306802,
      "radius": 9.903622453799471,
      "seed": 2275108299
    },
    {
      "id": "outer-blue-tube-26",
      "clusterId": "outer-tube-cluster-13",
      "x": -3362,
      "y": -4075,
      "z": -893.910175,
      "height": 37.755479,
      "radius": 5.99006908852607,
      "seed": 427464830
    },
    {
      "id": "outer-blue-tube-27",
      "clusterId": "outer-tube-cluster-13",
      "x": -3338,
      "y": -4025,
      "z": -889.332743,
      "height": 36.332534,
      "radius": 10.730539053445682,
      "seed": 301741027
    },
    {
      "id": "outer-blue-tube-28",
      "clusterId": "outer-tube-cluster-14",
      "x": -3322,
      "y": -2475,
      "z": -803.636009,
      "height": 63.133735,
      "radius": 4.775134576484561,
      "seed": 1991857786
    },
    {
      "id": "outer-blue-tube-29",
      "clusterId": "outer-tube-cluster-14",
      "x": -3298,
      "y": -2425,
      "z": -806.368956,
      "height": 54.751029,
      "radius": 4.990505108842626,
      "seed": 3683108185
    },
    {
      "id": "outer-blue-tube-30",
      "clusterId": "outer-tube-cluster-15",
      "x": -3352,
      "y": -875,
      "z": -281.732851,
      "height": 31.654527,
      "radius": 6.763627314940095,
      "seed": 4148400458
    },
    {
      "id": "outer-blue-tube-31",
      "clusterId": "outer-tube-cluster-15",
      "x": -3328,
      "y": -825,
      "z": -281.824396,
      "height": 64.374372,
      "radius": 6.731749347643927,
      "seed": 1500511461
    },
    {
      "id": "outer-blue-tube-32",
      "clusterId": "outer-tube-cluster-16",
      "x": -3362,
      "y": 725,
      "z": -283.607532,
      "height": 64.293544,
      "radius": 10.348140201997012,
      "seed": 2295098420
    },
    {
      "id": "outer-blue-tube-33",
      "clusterId": "outer-tube-cluster-16",
      "x": -3338,
      "y": 775,
      "z": -284.316604,
      "height": 38.431206,
      "radius": 7.079033273505047,
      "seed": 1837334133
    },
    {
      "id": "outer-blue-tube-34",
      "clusterId": "outer-tube-cluster-17",
      "x": -3322,
      "y": 2325,
      "z": -280.476719,
      "height": 39.194336,
      "radius": 6.349101385567337,
      "seed": 454362872
    },
    {
      "id": "outer-blue-tube-35",
      "clusterId": "outer-tube-cluster-17",
      "x": -3298,
      "y": 2375,
      "z": -280.266125,
      "height": 65.72971,
      "radius": 10.453948305686936,
      "seed": 1522674971
    },
    {
      "id": "outer-blue-tube-36",
      "clusterId": "outer-tube-cluster-18",
      "x": -3352,
      "y": 3925,
      "z": -276.313449,
      "height": 43.597652,
      "radius": 4.721471711527556,
      "seed": 4157285076
    },
    {
      "id": "outer-blue-tube-37",
      "clusterId": "outer-tube-cluster-18",
      "x": -3328,
      "y": 3975,
      "z": -276.189045,
      "height": 33.021271,
      "radius": 9.82000148924999,
      "seed": 1973627911
    },
    {
      "id": "outer-blue-tube-38",
      "clusterId": "outer-tube-cluster-19",
      "x": 828,
      "y": -3075,
      "z": -289.813271,
      "height": 48.435835,
      "radius": 4.0133368307724595,
      "seed": 1950915470
    },
    {
      "id": "outer-blue-tube-39",
      "clusterId": "outer-tube-cluster-19",
      "x": 852,
      "y": -3025,
      "z": -289.756157,
      "height": 51.924367,
      "radius": 9.307835602434352,
      "seed": 477855709
    },
    {
      "id": "outer-blue-tube-40",
      "clusterId": "outer-tube-cluster-20",
      "x": 728,
      "y": -3765,
      "z": -289.455446,
      "height": 29.037031,
      "radius": 7.5998421953991055,
      "seed": 35679070
    },
    {
      "id": "outer-blue-tube-41",
      "clusterId": "outer-tube-cluster-20",
      "x": 752,
      "y": -3715,
      "z": -287.524817,
      "height": 30.667484,
      "radius": 5.385465881088749,
      "seed": 2781468201
    },
    {
      "id": "outer-blue-tube-42",
      "clusterId": "outer-tube-cluster-21",
      "x": 558,
      "y": -4355,
      "z": -347.235098,
      "height": 38.607724,
      "radius": 6.059883082751185,
      "seed": 1737521640
    },
    {
      "id": "outer-blue-tube-43",
      "clusterId": "outer-tube-cluster-21",
      "x": 582,
      "y": -4305,
      "z": -337.144851,
      "height": 35.535382,
      "radius": 7.980002936674282,
      "seed": 1772779695
    },
    {
      "id": "outer-blue-tube-44",
      "clusterId": "outer-tube-cluster-22",
      "x": 318,
      "y": -4935,
      "z": -279.115099,
      "height": 46.035727,
      "radius": 4.15413352008909,
      "seed": 2393945238
    },
    {
      "id": "outer-blue-tube-45",
      "clusterId": "outer-tube-cluster-22",
      "x": 342,
      "y": -4885,
      "z": -279.471628,
      "height": 35.220882,
      "radius": 7.184071333846077,
      "seed": 721150299
    },
    {
      "id": "outer-blue-tube-46",
      "clusterId": "outer-tube-cluster-23",
      "x": -472,
      "y": -5125,
      "z": -285.014372,
      "height": 23.503959,
      "radius": 5.015957362949848,
      "seed": 1918573330
    },
    {
      "id": "outer-blue-tube-47",
      "clusterId": "outer-tube-cluster-23",
      "x": -448,
      "y": -5075,
      "z": -291.588317,
      "height": 23.520217,
      "radius": 8.957438567886129,
      "seed": 3311413721
    },
    {
      "id": "outer-blue-tube-48",
      "clusterId": "outer-tube-cluster-24",
      "x": -1302,
      "y": -5225,
      "z": -361.846226,
      "height": 58.672211,
      "radius": 6.02340737124905,
      "seed": 1633490316
    },
    {
      "id": "outer-blue-tube-49",
      "clusterId": "outer-tube-cluster-24",
      "x": -1278,
      "y": -5175,
      "z": -448.828208,
      "height": 52.691856,
      "radius": 6.853439979022369,
      "seed": 2339480195
    },
    {
      "id": "outer-blue-tube-50",
      "clusterId": "outer-tube-cluster-25",
      "x": -2282,
      "y": -5165,
      "z": -281.632293,
      "height": 37.042662,
      "radius": 8.691948533989489,
      "seed": 129730158
    },
    {
      "id": "outer-blue-tube-51",
      "clusterId": "outer-tube-cluster-25",
      "x": -2258,
      "y": -5115,
      "z": -292.774751,
      "height": 53.968114,
      "radius": 9.916610077256337,
      "seed": 1439885761
    },
    {
      "id": "outer-blue-tube-52",
      "clusterId": "outer-tube-cluster-26",
      "x": -3282,
      "y": -5075,
      "z": -422.6581,
      "height": 32.124447,
      "radius": 8.094175114762038,
      "seed": 2224889172
    },
    {
      "id": "outer-blue-tube-53",
      "clusterId": "outer-tube-cluster-26",
      "x": -3258,
      "y": -5025,
      "z": -509.935135,
      "height": 26.397811,
      "radius": 10.014000330818817,
      "seed": 427629839
    },
    {
      "id": "outer-blue-tube-54",
      "clusterId": "outer-tube-cluster-27",
      "x": 858,
      "y": 3025,
      "z": -285.325344,
      "height": 34.279049,
      "radius": 4.575122742913663,
      "seed": 3832114038
    },
    {
      "id": "outer-blue-tube-55",
      "clusterId": "outer-tube-cluster-27",
      "x": 882,
      "y": 3075,
      "z": -285.392653,
      "height": 42.414974,
      "radius": 8.445592290954664,
      "seed": 2630637477
    },
    {
      "id": "outer-blue-tube-56",
      "clusterId": "outer-tube-cluster-28",
      "x": 758,
      "y": 3715,
      "z": -283.578673,
      "height": 31.618608,
      "radius": 8.272278127726167,
      "seed": 2359902748
    },
    {
      "id": "outer-blue-tube-57",
      "clusterId": "outer-tube-cluster-28",
      "x": 782,
      "y": 3765,
      "z": -283.574786,
      "height": 35.888344,
      "radius": 6.047527340007946,
      "seed": 2317011247
    },
    {
      "id": "outer-blue-tube-58",
      "clusterId": "outer-tube-cluster-29",
      "x": 558,
      "y": 4305,
      "z": -282.968562,
      "height": 25.931781,
      "radius": 4.0416075605899096,
      "seed": 647158954
    },
    {
      "id": "outer-blue-tube-59",
      "clusterId": "outer-tube-cluster-29",
      "x": 582,
      "y": 4355,
      "z": -282.998584,
      "height": 31.711915,
      "radius": 9.480461252154782,
      "seed": 1973131021
    },
    {
      "id": "outer-blue-tube-60",
      "clusterId": "outer-tube-cluster-30",
      "x": 318,
      "y": 4885,
      "z": -284.629027,
      "height": 51.57419,
      "radius": 4.033417941536754,
      "seed": 3421339660
    },
    {
      "id": "outer-blue-tube-61",
      "clusterId": "outer-tube-cluster-30",
      "x": 342,
      "y": 4935,
      "z": -284.652119,
      "height": 41.25983,
      "radius": 7.539836481912062,
      "seed": 586991967
    },
    {
      "id": "outer-blue-tube-62",
      "clusterId": "outer-tube-cluster-31",
      "x": -472,
      "y": 5075,
      "z": -284.875985,
      "height": 27.495202,
      "radius": 6.9500146163627505,
      "seed": 4167402630
    },
    {
      "id": "outer-blue-tube-63",
      "clusterId": "outer-tube-cluster-31",
      "x": -448,
      "y": 5125,
      "z": -285.436369,
      "height": 36.50331,
      "radius": 9.257512230658904,
      "seed": 3486071217
    },
    {
      "id": "outer-blue-tube-64",
      "clusterId": "outer-tube-cluster-32",
      "x": -1302,
      "y": 5175,
      "z": -280.172473,
      "height": 30.468782,
      "radius": 5.935284578707069,
      "seed": 3907150508
    },
    {
      "id": "outer-blue-tube-65",
      "clusterId": "outer-tube-cluster-32",
      "x": -1278,
      "y": 5225,
      "z": -280.378959,
      "height": 46.101225,
      "radius": 10.465847679181024,
      "seed": 4235730303
    },
    {
      "id": "outer-blue-tube-66",
      "clusterId": "outer-tube-cluster-33",
      "x": -2282,
      "y": 5115,
      "z": -274.984481,
      "height": 24.353687,
      "radius": 9.192369335331023,
      "seed": 1328937102
    },
    {
      "id": "outer-blue-tube-67",
      "clusterId": "outer-tube-cluster-33",
      "x": -2258,
      "y": 5165,
      "z": -274.415379,
      "height": 51.52084,
      "radius": 10.119890653761104,
      "seed": 2802735325
    },
    {
      "id": "outer-blue-tube-68",
      "clusterId": "outer-tube-cluster-34",
      "x": -3282,
      "y": 5025,
      "z": -273.52415,
      "height": 54.740732,
      "radius": 4.6520878416486084,
      "seed": 1260943168
    },
    {
      "id": "outer-blue-tube-69",
      "clusterId": "outer-tube-cluster-34",
      "x": -3258,
      "y": 5075,
      "z": -273.164976,
      "height": 30.628132,
      "radius": 7.633102890802547,
      "seed": 1444682159
    },
    {
      "id": "outer-blue-tube-70",
      "clusterId": "outer-tube-cluster-35",
      "x": -2592,
      "y": -1125,
      "z": -286.378641,
      "height": 26.826395,
      "radius": 10.91965093370527,
      "seed": 2390765974
    },
    {
      "id": "outer-blue-tube-71",
      "clusterId": "outer-tube-cluster-35",
      "x": -2568,
      "y": -1075,
      "z": -286.583281,
      "height": 34.916539,
      "radius": 8.735280808294192,
      "seed": 324759825
    },
    {
      "id": "outer-blue-tube-72",
      "clusterId": "outer-tube-cluster-36",
      "x": -2192,
      "y": 725,
      "z": -284.688991,
      "height": 30.849881,
      "radius": 7.604518781881779,
      "seed": 904773220
    },
    {
      "id": "outer-blue-tube-73",
      "clusterId": "outer-tube-cluster-36",
      "x": -2168,
      "y": 775,
      "z": -284.552749,
      "height": 33.531114,
      "radius": 5.0152097817044705,
      "seed": 1915367255
    },
    {
      "id": "outer-blue-tube-74",
      "clusterId": "outer-tube-cluster-37",
      "x": -2752,
      "y": 725,
      "z": -282.556018,
      "height": 32.212348,
      "radius": 8.633110255002975,
      "seed": 750976434
    },
    {
      "id": "outer-blue-tube-75",
      "clusterId": "outer-tube-cluster-37",
      "x": -2728,
      "y": 775,
      "z": -283.210064,
      "height": 28.958059,
      "radius": 7.580917869927362,
      "seed": 102342317
    }
  ],
  "hangingPlants": [
    {
      "id": "purple-hanging-0",
      "platformId": "floe-0",
      "x": 35.13419549118893,
      "y": -38.500828033338465,
      "z": -195,
      "length": 66.3401871919632,
      "width": 3.099888819968328,
      "attachment": "underside",
      "seed": 2811142463
    },
    {
      "id": "purple-hanging-1",
      "platformId": "floe-0",
      "x": 21.011222413984015,
      "y": -39.93642132293238,
      "z": -195,
      "length": 41.68149197846651,
      "width": 3.538054337957874,
      "attachment": "underside",
      "seed": 784432797
    },
    {
      "id": "purple-hanging-2",
      "platformId": "floe-0",
      "x": -16.496672971674187,
      "y": 43.82052942033141,
      "z": -195,
      "length": 47.83080476522446,
      "width": 3.9535983426030725,
      "attachment": "underside",
      "seed": 2651524719
    },
    {
      "id": "purple-hanging-3",
      "platformId": "floe-0",
      "x": -26.521906858180362,
      "y": -37.87062670385258,
      "z": -195,
      "length": 32.914153315126896,
      "width": 3.6968903134111315,
      "attachment": "underside",
      "seed": 3791930373
    },
    {
      "id": "purple-hanging-4",
      "platformId": "glacier-0",
      "x": 18.998353996871927,
      "y": 952.9570725839825,
      "z": -157,
      "length": 45.02112738788128,
      "width": 6.26505291974172,
      "attachment": "underside",
      "seed": 3167231987
    },
    {
      "id": "purple-hanging-5",
      "platformId": "glacier-0",
      "x": 65.47182120616529,
      "y": 971.6162162504327,
      "z": -157,
      "length": 70.93604511767626,
      "width": 5.087994743604213,
      "attachment": "underside",
      "seed": 4279824205
    },
    {
      "id": "purple-hanging-6",
      "platformId": "glacier-0",
      "x": 29.5759023920663,
      "y": 849.7994028208221,
      "z": -157,
      "length": 77.57069665193558,
      "width": 10.818837373983115,
      "attachment": "underside",
      "seed": 3505393551
    },
    {
      "id": "purple-hanging-7",
      "platformId": "glacier-0",
      "x": 51.96137540907437,
      "y": 841.0456997093437,
      "z": -157,
      "length": 45.389804147183895,
      "width": 5.933956688735634,
      "attachment": "underside",
      "seed": 2423019577
    },
    {
      "id": "purple-hanging-8",
      "platformId": "glacier-3",
      "x": 166.0709489676945,
      "y": 2163.703949893186,
      "z": -202,
      "length": 63.92435484463158,
      "width": 5.437099387403578,
      "attachment": "underside",
      "seed": 2203242259
    },
    {
      "id": "purple-hanging-9",
      "platformId": "glacier-3",
      "x": 59.269310358634364,
      "y": 2117.9307153862924,
      "z": -202,
      "length": 64.90527985967117,
      "width": 6.891640412155539,
      "attachment": "underside",
      "seed": 2148137281
    },
    {
      "id": "purple-hanging-10",
      "platformId": "glacier-3",
      "x": 144.80213960744075,
      "y": 2196.179221144753,
      "z": -202,
      "length": 63.58657540380955,
      "width": 8.498635665979236,
      "attachment": "underside",
      "seed": 4273070907
    },
    {
      "id": "purple-hanging-11",
      "platformId": "glacier-3",
      "x": 118.94990420940735,
      "y": 2234.542259318649,
      "z": -202,
      "length": 64.83738,
      "width": 10.341432670596987,
      "attachment": "underside",
      "seed": 2457603089
    },
    {
      "id": "purple-hanging-12",
      "platformId": "glacier-7",
      "x": -1884.0962434457958,
      "y": 508.75869848371445,
      "z": -190,
      "length": 79.09002965688705,
      "width": 6.392904564272612,
      "attachment": "underside",
      "seed": 2768991599
    },
    {
      "id": "purple-hanging-13",
      "platformId": "glacier-7",
      "x": -1815.89679921751,
      "y": 440.21350915429514,
      "z": -190,
      "length": 70.47068408876657,
      "width": 5.585884497035295,
      "attachment": "underside",
      "seed": 1678984757
    },
    {
      "id": "purple-hanging-14",
      "platformId": "glacier-7",
      "x": -1876.9428143449773,
      "y": 551.8175225829673,
      "z": -190,
      "length": 35.44832327961922,
      "width": 9.959789137821645,
      "attachment": "underside",
      "seed": 3546772439
    },
    {
      "id": "purple-hanging-15",
      "platformId": "glacier-7",
      "x": -1865.827966326788,
      "y": 483.83857169319106,
      "z": -190,
      "length": 67.2056872472167,
      "width": 6.942512719426304,
      "attachment": "underside",
      "seed": 527604169
    },
    {
      "id": "purple-hanging-16",
      "platformId": "hunting-glacier",
      "x": -1375.8285264927213,
      "y": -1220.00064761455,
      "z": -220,
      "length": 48.69549703064928,
      "width": 8.859112638514489,
      "attachment": "underside",
      "seed": 1302278855
    },
    {
      "id": "purple-hanging-17",
      "platformId": "hunting-glacier",
      "x": -1413.8156897343306,
      "y": -1217.435857303491,
      "z": -220,
      "length": 48.231158594326416,
      "width": 6.688017458189279,
      "attachment": "underside",
      "seed": 2070924885
    },
    {
      "id": "purple-hanging-18",
      "platformId": "hunting-glacier",
      "x": -1842.1072607065785,
      "y": -1047.2712791625765,
      "z": -220,
      "length": 43.306037981560905,
      "width": 10.898275022860616,
      "attachment": "underside",
      "seed": 240575475
    },
    {
      "id": "purple-hanging-19",
      "platformId": "hunting-glacier",
      "x": -1542.9471738186974,
      "y": -899.4085683090149,
      "z": -220,
      "length": 45.70419049315694,
      "width": 8.564675085712224,
      "attachment": "underside",
      "seed": 882732005
    },
    {
      "id": "purple-hanging-20",
      "platformId": "submerged-1",
      "x": -363.28647322248247,
      "y": 187.89715753288658,
      "z": -213,
      "length": 55,
      "width": 7.64959032041952,
      "attachment": "underside",
      "seed": 2267806719
    },
    {
      "id": "purple-hanging-21",
      "platformId": "submerged-16",
      "x": -364.8066962630718,
      "y": 837.8939904487263,
      "z": -247,
      "length": 19.248862872209088,
      "width": 5.233852973673493,
      "attachment": "underside",
      "seed": 2604723545
    },
    {
      "id": "purple-hanging-22",
      "platformId": "submerged-17",
      "x": 742.6374731830631,
      "y": 1054.1428104994072,
      "z": -200,
      "length": 43.34908053278923,
      "width": 6.063986423891038,
      "attachment": "underside",
      "seed": 680493159
    },
    {
      "id": "outer-purple-hanging-0",
      "platformId": "outer-ice-01",
      "x": -4883.651943562861,
      "y": -3907.1474953285538,
      "z": -97,
      "length": 47.034673016518354,
      "width": 5.845643329434097,
      "attachment": "underside",
      "seed": 2902152612
    },
    {
      "id": "outer-purple-hanging-1",
      "platformId": "outer-ice-01",
      "x": -4879.439091002763,
      "y": -3768.2965149888782,
      "z": -97,
      "length": 62.26337333396077,
      "width": 7.128341939300299,
      "attachment": "underside",
      "seed": 2221748442
    },
    {
      "id": "outer-purple-hanging-2",
      "platformId": "outer-ice-01",
      "x": -4683.332012957367,
      "y": -3815.729808823091,
      "z": -97,
      "length": 65.80299326404929,
      "width": 10.718627722002566,
      "attachment": "underside",
      "seed": 241064376
    },
    {
      "id": "outer-purple-hanging-3",
      "platformId": "outer-ice-01",
      "x": -4797.462243358065,
      "y": -3722.705720595986,
      "z": -97,
      "length": 48.2298962213099,
      "width": 5.700387565419078,
      "attachment": "underside",
      "seed": 656686054
    },
    {
      "id": "outer-purple-hanging-4",
      "platformId": "outer-ice-02",
      "x": -4791.347345546473,
      "y": -2648.6466021804913,
      "z": -114,
      "length": 47.44299955293536,
      "width": 10.584148338995874,
      "attachment": "underside",
      "seed": 1983032252
    },
    {
      "id": "outer-purple-hanging-5",
      "platformId": "outer-ice-02",
      "x": -4840.837053874365,
      "y": -2873.0755708332217,
      "z": -114,
      "length": 51.54918758943677,
      "width": 5.714773900806904,
      "attachment": "underside",
      "seed": 966687074
    },
    {
      "id": "outer-purple-hanging-6",
      "platformId": "outer-ice-02",
      "x": -4922.708797341669,
      "y": -2858.5408280045167,
      "z": -114,
      "length": 33.21512683853507,
      "width": 5.716812745667994,
      "attachment": "underside",
      "seed": 3966775896
    },
    {
      "id": "outer-purple-hanging-7",
      "platformId": "outer-ice-02",
      "x": -4989.755719096558,
      "y": -2703.767827767141,
      "z": -114,
      "length": 41.33686536923051,
      "width": 9.301810877397656,
      "attachment": "underside",
      "seed": 1535449118
    },
    {
      "id": "outer-purple-hanging-8",
      "platformId": "outer-ice-03",
      "x": -4713.9554664408815,
      "y": -1763.3011211208768,
      "z": -131,
      "length": 34.41596196219325,
      "width": 5.335179637186229,
      "attachment": "underside",
      "seed": 37257268
    },
    {
      "id": "outer-purple-hanging-9",
      "platformId": "outer-ice-03",
      "x": -4677.0020115642565,
      "y": -1608.1605589864096,
      "z": -131,
      "length": 49.40900393202901,
      "width": 6.997759576886892,
      "attachment": "underside",
      "seed": 3364500506
    },
    {
      "id": "outer-purple-hanging-10",
      "platformId": "outer-ice-03",
      "x": -4656.8643408080325,
      "y": -1573.8873321449641,
      "z": -131,
      "length": 44.13925467059016,
      "width": 5.969779427163303,
      "attachment": "underside",
      "seed": 2166437588
    },
    {
      "id": "outer-purple-hanging-11",
      "platformId": "outer-ice-03",
      "x": -4658.5338053218275,
      "y": -1624.9249228120134,
      "z": -131,
      "length": 48.59992988780141,
      "width": 5.878052692860365,
      "attachment": "underside",
      "seed": 145649082
    },
    {
      "id": "outer-purple-hanging-12",
      "platformId": "outer-ice-05",
      "x": -4706.812140264194,
      "y": 483.7258705347555,
      "z": -80,
      "length": 38.296671997755766,
      "width": 5.313061906956136,
      "attachment": "underside",
      "seed": 3157546060
    },
    {
      "id": "outer-purple-hanging-13",
      "platformId": "outer-ice-05",
      "x": -4902.679627594609,
      "y": 597.9577091913246,
      "z": -80,
      "length": 38.544075448065996,
      "width": 6.122784819453955,
      "attachment": "underside",
      "seed": 404125530
    },
    {
      "id": "outer-purple-hanging-14",
      "platformId": "outer-ice-05",
      "x": -4848.008182501271,
      "y": 420.80681714632505,
      "z": -80,
      "length": 51.24055748805404,
      "width": 6.776064035482705,
      "attachment": "underside",
      "seed": 2888729312
    },
    {
      "id": "outer-purple-hanging-15",
      "platformId": "outer-ice-05",
      "x": -4865.525729679183,
      "y": 629.1796252446583,
      "z": -80,
      "length": 73.43479998782277,
      "width": 8.743430566042662,
      "attachment": "underside",
      "seed": 3559543034
    },
    {
      "id": "outer-purple-hanging-16",
      "platformId": "outer-ice-06",
      "x": -4994.989587323206,
      "y": 1548.9738335774207,
      "z": -97,
      "length": 61.63168286904693,
      "width": 5.519724418409169,
      "attachment": "underside",
      "seed": 23162672
    },
    {
      "id": "outer-purple-hanging-17",
      "platformId": "outer-ice-06",
      "x": -5024.27199785255,
      "y": 1682.362783643018,
      "z": -97,
      "length": 45.65688230469823,
      "width": 6.174136940389872,
      "attachment": "underside",
      "seed": 836578250
    },
    {
      "id": "outer-purple-hanging-18",
      "platformId": "outer-ice-06",
      "x": -5014.083271619639,
      "y": 1716.2591665089346,
      "z": -97,
      "length": 51.66051962599158,
      "width": 6.738824614323676,
      "attachment": "underside",
      "seed": 4094689064
    },
    {
      "id": "outer-purple-hanging-19",
      "platformId": "outer-ice-06",
      "x": -4983.133440262051,
      "y": 1764.5565293159239,
      "z": -97,
      "length": 79.79218940809369,
      "width": 6.273065023124218,
      "attachment": "underside",
      "seed": 3704925570
    },
    {
      "id": "outer-purple-hanging-20",
      "platformId": "outer-ice-07",
      "x": -4734.296417829981,
      "y": 2920.011768611315,
      "z": -114,
      "length": 38.95786405727267,
      "width": 9.73050597216934,
      "attachment": "underside",
      "seed": 1252805676
    },
    {
      "id": "outer-purple-hanging-21",
      "platformId": "outer-ice-07",
      "x": -4628.4301096269,
      "y": 2744.483757935205,
      "z": -114,
      "length": 78.94380472972989,
      "width": 10.908463045954704,
      "attachment": "underside",
      "seed": 3928017490
    },
    {
      "id": "outer-purple-hanging-22",
      "platformId": "outer-ice-07",
      "x": -4736.145815225833,
      "y": 2630.533186783996,
      "z": -114,
      "length": 50.75143280252814,
      "width": 7.270316713489592,
      "attachment": "underside",
      "seed": 1511368
    },
    {
      "id": "outer-purple-hanging-23",
      "platformId": "outer-ice-07",
      "x": -4732.294553769432,
      "y": 2567.2724767658583,
      "z": -114,
      "length": 39.63907051458955,
      "width": 5.112676912918687,
      "attachment": "underside",
      "seed": 3863641614
    },
    {
      "id": "outer-purple-hanging-24",
      "platformId": "outer-ice-09",
      "x": -4666.8016072986975,
      "y": 5005.656516237043,
      "z": -148,
      "length": 62.89317601546645,
      "width": 5.214318466372788,
      "attachment": "underside",
      "seed": 2428303552
    },
    {
      "id": "outer-purple-hanging-25",
      "platformId": "outer-ice-09",
      "x": -4716.625032688912,
      "y": 5091.339808235673,
      "z": -148,
      "length": 51.11515002325177,
      "width": 5.870562456548214,
      "attachment": "underside",
      "seed": 3617052866
    },
    {
      "id": "outer-purple-hanging-26",
      "platformId": "outer-ice-09",
      "x": -4893.899301104837,
      "y": 4974.599111425278,
      "z": -148,
      "length": 40.91954741999507,
      "width": 6.426370705477893,
      "attachment": "underside",
      "seed": 3310751380
    },
    {
      "id": "outer-purple-hanging-27",
      "platformId": "outer-ice-09",
      "x": -4643.0551714192,
      "y": 4966.945348363716,
      "z": -148,
      "length": 32.580675441771746,
      "width": 6.120891939848661,
      "attachment": "underside",
      "seed": 2874136442
    },
    {
      "id": "outer-purple-hanging-28",
      "platformId": "outer-ice-10",
      "x": -5604.96737971992,
      "y": -4296.396510164674,
      "z": -80,
      "length": 34.60445312783122,
      "width": 8.314772027544677,
      "attachment": "underside",
      "seed": 1849866212
    },
    {
      "id": "outer-purple-hanging-29",
      "platformId": "outer-ice-10",
      "x": -5691.725129737535,
      "y": -4376.954957168302,
      "z": -80,
      "length": 35.20275165513158,
      "width": 6.534260515123606,
      "attachment": "underside",
      "seed": 4252914250
    },
    {
      "id": "outer-purple-hanging-30",
      "platformId": "outer-ice-10",
      "x": -5579.823258259564,
      "y": -4311.813272277756,
      "z": -80,
      "length": 60.865206461399794,
      "width": 10.97033519577235,
      "attachment": "underside",
      "seed": 1889465652
    },
    {
      "id": "outer-purple-hanging-31",
      "platformId": "outer-ice-10",
      "x": -5596.504460660949,
      "y": -4511.761865052613,
      "z": -80,
      "length": 67.95339692011476,
      "width": 10.464872607961297,
      "attachment": "underside",
      "seed": 3877972206
    },
    {
      "id": "outer-purple-hanging-32",
      "platformId": "outer-ice-11",
      "x": -5644.727384194568,
      "y": -2566.4150983147947,
      "z": -97,
      "length": 63.91064187511802,
      "width": 10.320463539101183,
      "attachment": "underside",
      "seed": 3623739384
    },
    {
      "id": "outer-purple-hanging-33",
      "platformId": "outer-ice-11",
      "x": -5596.895093323823,
      "y": -2518.1425386327364,
      "z": -97,
      "length": 74.82508208230138,
      "width": 9.029130194336176,
      "attachment": "underside",
      "seed": 2065548682
    },
    {
      "id": "outer-purple-hanging-34",
      "platformId": "outer-ice-11",
      "x": -5553.464297177303,
      "y": -2715.244564796692,
      "z": -97,
      "length": 72.6891569904983,
      "width": 7.192306916229427,
      "attachment": "underside",
      "seed": 3075453556
    },
    {
      "id": "outer-purple-hanging-35",
      "platformId": "outer-ice-11",
      "x": -5548.045571653294,
      "y": -2742.421821947155,
      "z": -97,
      "length": 69.91627069190145,
      "width": 10.014899339526892,
      "attachment": "underside",
      "seed": 2845836378
    },
    {
      "id": "outer-purple-hanging-36",
      "platformId": "outer-ice-13",
      "x": -3834.83495922398,
      "y": -4136.605232704834,
      "z": -131,
      "length": 42.59990040585399,
      "width": 5.600946160964668,
      "attachment": "underside",
      "seed": 1660212164
    },
    {
      "id": "outer-purple-hanging-37",
      "platformId": "outer-ice-13",
      "x": -3747.6261146279253,
      "y": -4010.3000868872864,
      "z": -131,
      "length": 53.897107530385256,
      "width": 5.14985615760088,
      "attachment": "underside",
      "seed": 1990294754
    },
    {
      "id": "outer-purple-hanging-38",
      "platformId": "outer-ice-13",
      "x": -3844.7585195474603,
      "y": -3948.8254627478655,
      "z": -131,
      "length": 71.60612953826785,
      "width": 7.053387924097478,
      "attachment": "underside",
      "seed": 3946086028
    },
    {
      "id": "outer-purple-hanging-39",
      "platformId": "outer-ice-13",
      "x": -3740.35849177892,
      "y": -4035.992266669989,
      "z": -131,
      "length": 47.20167179778218,
      "width": 8.669915731996298,
      "attachment": "underside",
      "seed": 3407382426
    },
    {
      "id": "outer-purple-hanging-40",
      "platformId": "outer-ice-14",
      "x": -3885.8207954587774,
      "y": -2367.9001381255243,
      "z": -148,
      "length": 73.75195571407676,
      "width": 5.427587331272662,
      "attachment": "underside",
      "seed": 126722680
    },
    {
      "id": "outer-purple-hanging-41",
      "platformId": "outer-ice-14",
      "x": -3696.225110508989,
      "y": -2434.7932508063222,
      "z": -148,
      "length": 77.19295175746083,
      "width": 7.805801194161177,
      "attachment": "underside",
      "seed": 2268758330
    },
    {
      "id": "outer-purple-hanging-42",
      "platformId": "outer-ice-14",
      "x": -3817.821660354052,
      "y": -2590.988842651699,
      "z": -148,
      "length": 33.98406533524394,
      "width": 6.4631987093016505,
      "attachment": "underside",
      "seed": 3729768356
    },
    {
      "id": "outer-purple-hanging-43",
      "platformId": "outer-ice-14",
      "x": -3809.323769068176,
      "y": -2564.52125513782,
      "z": -148,
      "length": 55.656832087785006,
      "width": 6.75805202126503,
      "attachment": "underside",
      "seed": 2126204146
    },
    {
      "id": "outer-purple-hanging-44",
      "platformId": "outer-ice-15",
      "x": -3936.983515249678,
      "y": -910.3629135329353,
      "z": -80,
      "length": 54.57118512317538,
      "width": 5.3831588020548224,
      "attachment": "underside",
      "seed": 3690845804
    },
    {
      "id": "outer-purple-hanging-45",
      "platformId": "outer-ice-15",
      "x": -3816.516417129008,
      "y": -946.3632424165783,
      "z": -80,
      "length": 37.078687343746424,
      "width": 7.7976697366684675,
      "attachment": "underside",
      "seed": 4060722662
    },
    {
      "id": "outer-purple-hanging-46",
      "platformId": "outer-ice-15",
      "x": -3900.4057752698036,
      "y": -928.9277936189212,
      "z": -80,
      "length": 56.048143427819014,
      "width": 9.04753043036908,
      "attachment": "underside",
      "seed": 1008463076
    },
    {
      "id": "outer-purple-hanging-47",
      "platformId": "outer-ice-15",
      "x": -3950.488827111858,
      "y": -852.2283657880637,
      "z": -80,
      "length": 66.49127427116036,
      "width": 9.239910421893,
      "attachment": "underside",
      "seed": 4262528294
    },
    {
      "id": "outer-purple-hanging-48",
      "platformId": "outer-ice-17",
      "x": -3743.2809048501344,
      "y": 2266.8941904784824,
      "z": -114,
      "length": 78.45078353211284,
      "width": 7.3595766900107265,
      "attachment": "underside",
      "seed": 518085156
    },
    {
      "id": "outer-purple-hanging-49",
      "platformId": "outer-ice-17",
      "x": -3699.1288518118095,
      "y": 2307.7726952225476,
      "z": -114,
      "length": 56.40412547066808,
      "width": 7.249255273491144,
      "attachment": "underside",
      "seed": 3604222602
    },
    {
      "id": "outer-purple-hanging-50",
      "platformId": "outer-ice-17",
      "x": -3924.545011665934,
      "y": 2291.700080259541,
      "z": -114,
      "length": 32.09464546665549,
      "width": 10.06816575024277,
      "attachment": "underside",
      "seed": 1349035576
    },
    {
      "id": "outer-purple-hanging-51",
      "platformId": "outer-ice-17",
      "x": -3810.613019678191,
      "y": 2241.6955276508525,
      "z": -114,
      "length": 47.185323778539896,
      "width": 6.047729821875691,
      "attachment": "underside",
      "seed": 3793327358
    },
    {
      "id": "outer-purple-hanging-52",
      "platformId": "outer-ice-18",
      "x": -3795.0443783477726,
      "y": 3838.0054056214544,
      "z": -131,
      "length": 55.11386064812541,
      "width": 6.7255093632265925,
      "attachment": "underside",
      "seed": 2346714980
    },
    {
      "id": "outer-purple-hanging-53",
      "platformId": "outer-ice-18",
      "x": -3853.7343443281725,
      "y": 3797.800110947446,
      "z": -131,
      "length": 63.042217675596476,
      "width": 5.193206148222089,
      "attachment": "underside",
      "seed": 4179337374
    },
    {
      "id": "outer-purple-hanging-54",
      "platformId": "outer-ice-18",
      "x": -3881.8720155433357,
      "y": 4037.2819919502463,
      "z": -131,
      "length": 60.10348440334201,
      "width": 9.008301525376737,
      "attachment": "underside",
      "seed": 3195074092
    },
    {
      "id": "outer-purple-hanging-55",
      "platformId": "outer-ice-18",
      "x": -3919.7678535997393,
      "y": 4032.742308277251,
      "z": -131,
      "length": 55.619731817394495,
      "width": 5.889627693220973,
      "attachment": "underside",
      "seed": 4065420198
    },
    {
      "id": "outer-purple-hanging-56",
      "platformId": "outer-ice-19",
      "x": 516.7971807670967,
      "y": -3023.209105942874,
      "z": -148,
      "length": 67.12164982780814,
      "width": 7.3711791494861245,
      "attachment": "underside",
      "seed": 3893288984
    },
    {
      "id": "outer-purple-hanging-57",
      "platformId": "outer-ice-19",
      "x": 396.55728141778,
      "y": -3089.869793150315,
      "z": -148,
      "length": 54.73921271041036,
      "width": 7.872070666402578,
      "attachment": "underside",
      "seed": 2806766362
    },
    {
      "id": "outer-purple-hanging-58",
      "platformId": "outer-ice-19",
      "x": 534.5026584068523,
      "y": -3040.120085402514,
      "z": -148,
      "length": 36.541969653218985,
      "width": 7.084370707161725,
      "attachment": "underside",
      "seed": 3701571664
    },
    {
      "id": "outer-purple-hanging-59",
      "platformId": "outer-ice-19",
      "x": 508.39231128777095,
      "y": -3105.515955386459,
      "z": -148,
      "length": 61.131734285503626,
      "width": 6.04663866572082,
      "attachment": "underside",
      "seed": 4236165670
    },
    {
      "id": "outer-purple-hanging-60",
      "platformId": "outer-ice-21",
      "x": 12.853613191920218,
      "y": -4398.532700979225,
      "z": -97,
      "length": 55.62260985001922,
      "width": 9.934179742820561,
      "attachment": "underside",
      "seed": 3220497648
    },
    {
      "id": "outer-purple-hanging-61",
      "platformId": "outer-ice-21",
      "x": 196.58866417928624,
      "y": -4325.727935117705,
      "z": -97,
      "length": 59.91048410907388,
      "width": 5.589106244966388,
      "attachment": "underside",
      "seed": 4106428870
    },
    {
      "id": "outer-purple-hanging-62",
      "platformId": "outer-ice-21",
      "x": 208.7552052068081,
      "y": -4341.473182363777,
      "z": -97,
      "length": 78.61918937787414,
      "width": 6.499151055701077,
      "attachment": "underside",
      "seed": 136944016
    },
    {
      "id": "outer-purple-hanging-63",
      "platformId": "outer-ice-21",
      "x": 30.185018956355478,
      "y": -4274.440770269386,
      "z": -97,
      "length": 60.023752365261316,
      "width": 9.997996477410197,
      "attachment": "underside",
      "seed": 3555610982
    },
    {
      "id": "outer-purple-hanging-64",
      "platformId": "outer-ice-22",
      "x": -251.78108842293932,
      "y": -4854.947293533557,
      "z": -114,
      "length": 58.8080392293632,
      "width": 5.751541691832244,
      "attachment": "underside",
      "seed": 3474406500
    },
    {
      "id": "outer-purple-hanging-65",
      "platformId": "outer-ice-22",
      "x": -186.14765341742978,
      "y": -4850.42188631601,
      "z": -114,
      "length": 65.36386055126786,
      "width": 5.359999852254987,
      "attachment": "underside",
      "seed": 4233706910
    },
    {
      "id": "outer-purple-hanging-66",
      "platformId": "outer-ice-22",
      "x": -64.03534838858306,
      "y": -4901.97390677622,
      "z": -114,
      "length": 35.393644358962774,
      "width": 8.396269210614264,
      "attachment": "underside",
      "seed": 2971389480
    },
    {
      "id": "outer-purple-hanging-67",
      "platformId": "outer-ice-22",
      "x": -118.31677779719097,
      "y": -4840.551540612952,
      "z": -114,
      "length": 75.17455679550767,
      "width": 5.462768645957112,
      "attachment": "underside",
      "seed": 1832636158
    },
    {
      "id": "outer-purple-hanging-68",
      "platformId": "outer-ice-23",
      "x": -926.9786213490439,
      "y": -5184.3763370867855,
      "z": -131,
      "length": 53.89797006174922,
      "width": 6.633187438361347,
      "attachment": "underside",
      "seed": 1605986324
    },
    {
      "id": "outer-purple-hanging-69",
      "platformId": "outer-ice-23",
      "x": -839.0716405184177,
      "y": -5137.907669759685,
      "z": -131,
      "length": 36.66446718946099,
      "width": 7.106668969616294,
      "attachment": "underside",
      "seed": 3362583606
    },
    {
      "id": "outer-purple-hanging-70",
      "platformId": "outer-ice-23",
      "x": -956.5808049530644,
      "y": -5205.558533732421,
      "z": -131,
      "length": 58.93821036443114,
      "width": 7.28064099419862,
      "attachment": "underside",
      "seed": 3573602256
    },
    {
      "id": "outer-purple-hanging-71",
      "platformId": "outer-ice-23",
      "x": -852.4685244837145,
      "y": -5167.539557729757,
      "z": -131,
      "length": 69.04838483408093,
      "width": 8.309446968138218,
      "attachment": "underside",
      "seed": 1977224994
    },
    {
      "id": "outer-purple-hanging-72",
      "platformId": "outer-ice-25",
      "x": -2885.732811281449,
      "y": -5064.012649413739,
      "z": -80,
      "length": 61.97317403182387,
      "width": 10.833683681674302,
      "attachment": "underside",
      "seed": 432770240
    },
    {
      "id": "outer-purple-hanging-73",
      "platformId": "outer-ice-25",
      "x": -2923.732313574794,
      "y": -5080.070334433921,
      "z": -80,
      "length": 65.46201299503446,
      "width": 7.506316676735878,
      "attachment": "underside",
      "seed": 2909108626
    },
    {
      "id": "outer-purple-hanging-74",
      "platformId": "outer-ice-25",
      "x": -2963.206250304236,
      "y": -5139.424715635773,
      "z": -80,
      "length": 70.12081637606025,
      "width": 5.238030278123915,
      "attachment": "underside",
      "seed": 3508417800
    },
    {
      "id": "outer-purple-hanging-75",
      "platformId": "outer-ice-25",
      "x": -2790.0857764155403,
      "y": -5081.279314668881,
      "z": -80,
      "length": 43.32061267271638,
      "width": 9.305869841948152,
      "attachment": "underside",
      "seed": 4128565582
    },
    {
      "id": "outer-purple-hanging-76",
      "platformId": "outer-ice-26",
      "x": -3724.252021096401,
      "y": -4990.115751083794,
      "z": -97,
      "length": 76.06085688993335,
      "width": 6.8413962488994,
      "attachment": "underside",
      "seed": 818368348
    },
    {
      "id": "outer-purple-hanging-77",
      "platformId": "outer-ice-26",
      "x": -4004.115477579876,
      "y": -5061.851494962434,
      "z": -97,
      "length": 50.3899847753346,
      "width": 7.416780091822147,
      "attachment": "underside",
      "seed": 3645302178
    },
    {
      "id": "outer-purple-hanging-78",
      "platformId": "outer-ice-26",
      "x": -3995.24354529856,
      "y": -5038.757720891647,
      "z": -97,
      "length": 47.010549049824476,
      "width": 8.89662543963641,
      "attachment": "underside",
      "seed": 491095668
    },
    {
      "id": "outer-purple-hanging-79",
      "platformId": "outer-ice-26",
      "x": -3887.3049330748154,
      "y": -5135.31910618209,
      "z": -97,
      "length": 53.21559854224324,
      "width": 8.66807421669364,
      "attachment": "underside",
      "seed": 1565407322
    },
    {
      "id": "outer-purple-hanging-80",
      "platformId": "outer-ice-27",
      "x": 559.9404803777775,
      "y": 3058.034201279166,
      "z": -114,
      "length": 32.51059104129672,
      "width": 6.883094965480268,
      "attachment": "underside",
      "seed": 1331822572
    },
    {
      "id": "outer-purple-hanging-81",
      "platformId": "outer-ice-27",
      "x": 544.1953663926943,
      "y": 3035.175083216171,
      "z": -114,
      "length": 52.68874206021428,
      "width": 8.457004953175783,
      "attachment": "underside",
      "seed": 1047707242
    },
    {
      "id": "outer-purple-hanging-82",
      "platformId": "outer-ice-27",
      "x": 394.5114010303461,
      "y": 3109.7701557167693,
      "z": -114,
      "length": 78.32657637819648,
      "width": 9.97503634635359,
      "attachment": "underside",
      "seed": 3926063624
    },
    {
      "id": "outer-purple-hanging-83",
      "platformId": "outer-ice-27",
      "x": 394.20473885148317,
      "y": 3051.3295190555464,
      "z": -114,
      "length": 35.43117916956544,
      "width": 5.2900749538093805,
      "attachment": "underside",
      "seed": 1327725038
    },
    {
      "id": "outer-purple-hanging-84",
      "platformId": "outer-ice-29",
      "x": 10.865670753387406,
      "y": 4282.325600252944,
      "z": -148,
      "length": 70.32744875177741,
      "width": 9.265622549690306,
      "attachment": "underside",
      "seed": 1428507464
    },
    {
      "id": "outer-purple-hanging-85",
      "platformId": "outer-ice-29",
      "x": 196.5139086723239,
      "y": 4370.686480106371,
      "z": -148,
      "length": 76.49306722357869,
      "width": 10.477547135204077,
      "attachment": "underside",
      "seed": 899401050
    },
    {
      "id": "outer-purple-hanging-86",
      "platformId": "outer-ice-29",
      "x": 62.84231615385886,
      "y": 4257.139637370882,
      "z": -148,
      "length": 51.67827236279845,
      "width": 5.2067551063373685,
      "attachment": "underside",
      "seed": 2472822928
    },
    {
      "id": "outer-purple-hanging-87",
      "platformId": "outer-ice-29",
      "x": 122.6737628122782,
      "y": 4410.342976236322,
      "z": -148,
      "length": 79.97673571482301,
      "width": 5.136636326089501,
      "attachment": "underside",
      "seed": 2089052270
    },
    {
      "id": "outer-purple-hanging-88",
      "platformId": "outer-ice-30",
      "x": -28.207298136051406,
      "y": 4876.664106227451,
      "z": -80,
      "length": 41.80501041933894,
      "width": 6.382203216664493,
      "attachment": "underside",
      "seed": 2174283604
    },
    {
      "id": "outer-purple-hanging-89",
      "platformId": "outer-ice-30",
      "x": -256.7576527665918,
      "y": 4864.545224583672,
      "z": -80,
      "length": 44.85141332820058,
      "width": 5.873200576752424,
      "attachment": "underside",
      "seed": 1977598522
    },
    {
      "id": "outer-purple-hanging-90",
      "platformId": "outer-ice-30",
      "x": -64.25454499620332,
      "y": 4979.56565897028,
      "z": -80,
      "length": 58.71726478263736,
      "width": 5.684441461227834,
      "attachment": "underside",
      "seed": 4160175308
    },
    {
      "id": "outer-purple-hanging-91",
      "platformId": "outer-ice-30",
      "x": -151.7431148998059,
      "y": 4833.724731210535,
      "z": -80,
      "length": 59.10279976204038,
      "width": 5.709976702928543,
      "attachment": "underside",
      "seed": 1709501938
    },
    {
      "id": "outer-purple-hanging-92",
      "platformId": "outer-ice-31",
      "x": -885.1300786655036,
      "y": 5160.206279934293,
      "z": -97,
      "length": 62.75500939413905,
      "width": 10.691791008226573,
      "attachment": "underside",
      "seed": 1193915188
    },
    {
      "id": "outer-purple-hanging-93",
      "platformId": "outer-ice-31",
      "x": -988.7574788167018,
      "y": 5198.812807430848,
      "z": -97,
      "length": 63.585524681955576,
      "width": 6.477796087041497,
      "attachment": "underside",
      "seed": 2398246638
    },
    {
      "id": "outer-purple-hanging-94",
      "platformId": "outer-ice-31",
      "x": -827.7921078695924,
      "y": 5086.345365766658,
      "z": -97,
      "length": 76.2227165363729,
      "width": 5.807548166252673,
      "attachment": "underside",
      "seed": 409271800
    },
    {
      "id": "outer-purple-hanging-95",
      "platformId": "outer-ice-31",
      "x": -1034.1558265085516,
      "y": 5157.418617147467,
      "z": -97,
      "length": 68.03537121787667,
      "width": 5.6902996879071,
      "attachment": "underside",
      "seed": 2470295078
    },
    {
      "id": "outer-purple-hanging-96",
      "platformId": "outer-ice-33",
      "x": -2884.8081779367817,
      "y": 5044.303294884359,
      "z": -131,
      "length": 60.84002919122577,
      "width": 6.083964607678354,
      "attachment": "underside",
      "seed": 1514046460
    },
    {
      "id": "outer-purple-hanging-97",
      "platformId": "outer-ice-33",
      "x": -2980.829696346112,
      "y": 5112.028360003115,
      "z": -131,
      "length": 38.924960885196924,
      "width": 6.587198419496417,
      "attachment": "underside",
      "seed": 1239160262
    },
    {
      "id": "outer-purple-hanging-98",
      "platformId": "outer-ice-33",
      "x": -2999.025214188227,
      "y": 5192.873999210945,
      "z": -131,
      "length": 78.73876364156604,
      "width": 7.082762605510652,
      "attachment": "underside",
      "seed": 2494815900
    },
    {
      "id": "outer-purple-hanging-99",
      "platformId": "outer-ice-33",
      "x": -2929.364975867292,
      "y": 5056.092084576304,
      "z": -131,
      "length": 76.326865170151,
      "width": 8.199682867154479,
      "attachment": "underside",
      "seed": 3094041494
    },
    {
      "id": "outer-purple-hanging-100",
      "platformId": "outer-ice-34",
      "x": -3724.0337181645705,
      "y": 5040.485672598137,
      "z": -148,
      "length": 76.21710186824203,
      "width": 6.522444006986916,
      "attachment": "underside",
      "seed": 1683850720
    },
    {
      "id": "outer-purple-hanging-101",
      "platformId": "outer-ice-34",
      "x": -3735.849803793504,
      "y": 5077.816508171011,
      "z": -148,
      "length": 40.852300483733416,
      "width": 10.830776762217283,
      "attachment": "underside",
      "seed": 3471223802
    },
    {
      "id": "outer-purple-hanging-102",
      "platformId": "outer-ice-34",
      "x": -3985.992974148644,
      "y": 5078.330290200427,
      "z": -148,
      "length": 45.328557189553976,
      "width": 7.656466108746827,
      "attachment": "underside",
      "seed": 2862166656
    },
    {
      "id": "outer-purple-hanging-103",
      "platformId": "outer-ice-34",
      "x": -3986.556833014524,
      "y": 5021.129782367571,
      "z": -148,
      "length": 66.36980489268899,
      "width": 10.409707201644778,
      "attachment": "underside",
      "seed": 3115664646
    },
    {
      "id": "outer-purple-hanging-104",
      "platformId": "outer-ice-35",
      "x": -3027.58218514154,
      "y": -1001.3108901037087,
      "z": -80,
      "length": 59.63523280248046,
      "width": 5.010004078038037,
      "attachment": "underside",
      "seed": 3866527440
    },
    {
      "id": "outer-purple-hanging-105",
      "platformId": "outer-ice-35",
      "x": -3030.27868360266,
      "y": -1173.799669147225,
      "z": -80,
      "length": 51.874277982860804,
      "width": 6.709828970953822,
      "attachment": "underside",
      "seed": 2495616166
    },
    {
      "id": "outer-purple-hanging-106",
      "platformId": "outer-ice-35",
      "x": -3144.7305439572665,
      "y": -1136.643231069904,
      "z": -80,
      "length": 36.139562260359526,
      "width": 10.14821411576122,
      "attachment": "underside",
      "seed": 1449791948
    },
    {
      "id": "outer-purple-hanging-107",
      "platformId": "outer-ice-35",
      "x": -3145.022375797951,
      "y": -1077.298351239074,
      "z": -80,
      "length": 57.38976030424237,
      "width": 8.747891895473003,
      "attachment": "underside",
      "seed": 1261797122
    },
    {
      "id": "outer-purple-hanging-108",
      "platformId": "outer-ice-37",
      "x": -3114.2989681448457,
      "y": 826.5610971813569,
      "z": -114,
      "length": 73.80729692801833,
      "width": 6.32653568405658,
      "attachment": "underside",
      "seed": 559273856
    },
    {
      "id": "outer-purple-hanging-109",
      "platformId": "outer-ice-37",
      "x": -3015.756310040447,
      "y": 759.2953073986805,
      "z": -114,
      "length": 69.19261543825269,
      "width": 5.327006943523884,
      "attachment": "underside",
      "seed": 138120802
    },
    {
      "id": "outer-purple-hanging-110",
      "platformId": "outer-ice-37",
      "x": -3022.5649385172064,
      "y": 796.8860280644434,
      "z": -114,
      "length": 74.2344615124166,
      "width": 8.045620740391314,
      "attachment": "underside",
      "seed": 749849208
    },
    {
      "id": "outer-purple-hanging-111",
      "platformId": "outer-ice-37",
      "x": -3070.9912949757613,
      "y": 689.4965220279857,
      "z": -114,
      "length": 40.224800143390894,
      "width": 5.380591226741672,
      "attachment": "underside",
      "seed": 2576080262
    }
  ],
  "borders": [
    {
      "id": "border-0",
      "x": -6081.621621621622,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 868.354,
      "seed": 869707590
    },
    {
      "id": "border-1",
      "x": -6081.621621621622,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 793.421,
      "seed": 1213662824
    },
    {
      "id": "border-2",
      "x": -5884.864864864865,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 613.676,
      "seed": 231785434
    },
    {
      "id": "border-3",
      "x": -5884.864864864865,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 633.332,
      "seed": 3660827676
    },
    {
      "id": "border-4",
      "x": -5688.108108108108,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1001.478,
      "seed": 452720558
    },
    {
      "id": "border-5",
      "x": -5688.108108108108,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 601.039,
      "seed": 1958294288
    },
    {
      "id": "border-6",
      "x": -5491.351351351352,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1031.916,
      "seed": 2137824962
    },
    {
      "id": "border-7",
      "x": -5491.351351351352,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 773.631,
      "seed": 2541924164
    },
    {
      "id": "border-8",
      "x": -5294.594594594595,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 560.01,
      "seed": 3060944150
    },
    {
      "id": "border-9",
      "x": -5294.594594594595,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 820.442,
      "seed": 2739467448
    },
    {
      "id": "border-10",
      "x": -5097.837837837838,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 776.899,
      "seed": 1521211050
    },
    {
      "id": "border-11",
      "x": -5097.837837837838,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 648.823,
      "seed": 521533292
    },
    {
      "id": "border-12",
      "x": -4901.081081081082,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 911.108,
      "seed": 2237353854
    },
    {
      "id": "border-13",
      "x": -4901.081081081082,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 581.247,
      "seed": 3602443104
    },
    {
      "id": "border-14",
      "x": -4704.324324324324,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 954.239,
      "seed": 2566523794
    },
    {
      "id": "border-15",
      "x": -4704.324324324324,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 929.701,
      "seed": 3329901716
    },
    {
      "id": "border-16",
      "x": -4507.5675675675675,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 910.531,
      "seed": 2332860134
    },
    {
      "id": "border-17",
      "x": -4507.5675675675675,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 976.282,
      "seed": 135247624
    },
    {
      "id": "border-18",
      "x": -4310.810810810811,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 940.739,
      "seed": 20372858
    },
    {
      "id": "border-19",
      "x": -4310.810810810811,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 943.954,
      "seed": 886060732
    },
    {
      "id": "border-20",
      "x": -4114.054054054054,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 621.749,
      "seed": 3582974798
    },
    {
      "id": "border-21",
      "x": -4114.054054054054,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 960.392,
      "seed": 4045928368
    },
    {
      "id": "border-22",
      "x": -3917.2972972972975,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 834.381,
      "seed": 3593858146
    },
    {
      "id": "border-23",
      "x": -3917.2972972972975,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 884.85,
      "seed": 2504814052
    },
    {
      "id": "border-24",
      "x": -3720.540540540541,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 494.815,
      "seed": 3559040182
    },
    {
      "id": "border-25",
      "x": -3720.540540540541,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1006.997,
      "seed": 657476952
    },
    {
      "id": "border-26",
      "x": -3523.7837837837837,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 508.069,
      "seed": 1430181962
    },
    {
      "id": "border-27",
      "x": -3523.7837837837837,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 909.658,
      "seed": 431458828
    },
    {
      "id": "border-28",
      "x": -3327.027027027027,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 580.981,
      "seed": 2109119262
    },
    {
      "id": "border-29",
      "x": -3327.027027027027,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 794.391,
      "seed": 2234210304
    },
    {
      "id": "border-30",
      "x": -3130.2702702702704,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 987.12,
      "seed": 76366130
    },
    {
      "id": "border-31",
      "x": -3130.2702702702704,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 559.837,
      "seed": 3438160692
    },
    {
      "id": "border-32",
      "x": -2933.5135135135138,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 927.066,
      "seed": 1198612102
    },
    {
      "id": "border-33",
      "x": -2933.5135135135138,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 645.799,
      "seed": 3866081192
    },
    {
      "id": "border-34",
      "x": -2736.756756756757,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 714.507,
      "seed": 3520120602
    },
    {
      "id": "border-35",
      "x": -2736.756756756757,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 790.957,
      "seed": 3043029340
    },
    {
      "id": "border-36",
      "x": -2540.0000000000005,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 861.571,
      "seed": 3945565934
    },
    {
      "id": "border-37",
      "x": -2540.0000000000005,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1003.185,
      "seed": 824708176
    },
    {
      "id": "border-38",
      "x": -2343.2432432432433,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1003.852,
      "seed": 11340290
    },
    {
      "id": "border-39",
      "x": -2343.2432432432433,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 604.386,
      "seed": 1200913540
    },
    {
      "id": "border-40",
      "x": -2146.4864864864867,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 604.548,
      "seed": 4260744278
    },
    {
      "id": "border-41",
      "x": -2146.4864864864867,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 506.8,
      "seed": 2966615544
    },
    {
      "id": "border-42",
      "x": -1949.72972972973,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 660.166,
      "seed": 3912870378
    },
    {
      "id": "border-43",
      "x": -1949.72972972973,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 864.713,
      "seed": 681667756
    },
    {
      "id": "border-44",
      "x": -1752.9729729729734,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 625.217,
      "seed": 1452193470
    },
    {
      "id": "border-45",
      "x": -1752.9729729729734,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 688.495,
      "seed": 3234010272
    },
    {
      "id": "border-46",
      "x": -1556.2162162162167,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 932.346,
      "seed": 2256684754
    },
    {
      "id": "border-47",
      "x": -1556.2162162162167,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1002.933,
      "seed": 1085563348
    },
    {
      "id": "border-48",
      "x": -1359.45945945946,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1035.333,
      "seed": 1139600934
    },
    {
      "id": "border-49",
      "x": -1359.45945945946,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 690.766,
      "seed": 3332311112
    },
    {
      "id": "border-50",
      "x": -1162.7027027027034,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 777.408,
      "seed": 3573973178
    },
    {
      "id": "border-51",
      "x": -1162.7027027027034,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 617.376,
      "seed": 495844348
    },
    {
      "id": "border-52",
      "x": -965.9459459459467,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1018.303,
      "seed": 2478445198
    },
    {
      "id": "border-53",
      "x": -965.9459459459467,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 887.568,
      "seed": 2095149296
    },
    {
      "id": "border-54",
      "x": -769.1891891891892,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 740.491,
      "seed": 20576162
    },
    {
      "id": "border-55",
      "x": -769.1891891891892,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 824.383,
      "seed": 2768427812
    },
    {
      "id": "border-56",
      "x": -572.4324324324325,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 582.052,
      "seed": 1758708726
    },
    {
      "id": "border-57",
      "x": -572.4324324324325,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 534.864,
      "seed": 2371415704
    },
    {
      "id": "border-58",
      "x": -375.67567567567585,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 578.589,
      "seed": 1711557514
    },
    {
      "id": "border-59",
      "x": -375.67567567567585,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 782.739,
      "seed": 393977676
    },
    {
      "id": "border-60",
      "x": -178.9189189189192,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 631.644,
      "seed": 3788218974
    },
    {
      "id": "border-61",
      "x": -178.9189189189192,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 890.93,
      "seed": 2074616128
    },
    {
      "id": "border-62",
      "x": 17.83783783783747,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 924.049,
      "seed": 1530993778
    },
    {
      "id": "border-63",
      "x": 17.83783783783747,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 831.852,
      "seed": 1651828852
    },
    {
      "id": "border-64",
      "x": 214.59459459459413,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 789.644,
      "seed": 2405912006
    },
    {
      "id": "border-65",
      "x": 214.59459459459413,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 650.413,
      "seed": 3754273000
    },
    {
      "id": "border-66",
      "x": 411.3513513513508,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 979.81,
      "seed": 3560966746
    },
    {
      "id": "border-67",
      "x": 411.3513513513508,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 803.682,
      "seed": 3271513756
    },
    {
      "id": "border-68",
      "x": 608.1081081081074,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 684.24,
      "seed": 3139462702
    },
    {
      "id": "border-69",
      "x": 608.1081081081074,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 852.132,
      "seed": 4034667920
    },
    {
      "id": "border-70",
      "x": 804.8648648648641,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 826.4,
      "seed": 3460609346
    },
    {
      "id": "border-71",
      "x": 804.8648648648641,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 944.423,
      "seed": 3091171780
    },
    {
      "id": "border-72",
      "x": 1001.6216216216208,
      "y": -11390,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 701.108,
      "seed": 2107935638
    },
    {
      "id": "border-73",
      "x": 1001.6216216216208,
      "y": 5790,
      "rx": 275.4594594594594,
      "ry": 90,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 956.636,
      "seed": 1575630648
    },
    {
      "id": "border-74",
      "x": 1198.3333333333333,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 640.594,
      "seed": 2399583530
    },
    {
      "id": "border-75",
      "x": 1198.3333333333333,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 611.863,
      "seed": 1173234156
    },
    {
      "id": "border-76",
      "x": 1395,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 764.926,
      "seed": 2773835262
    },
    {
      "id": "border-77",
      "x": 1395,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 690.898,
      "seed": 2080538080
    },
    {
      "id": "border-78",
      "x": 1591.6666666666665,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 688.247,
      "seed": 3006382610
    },
    {
      "id": "border-79",
      "x": 1591.6666666666665,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 354.661,
      "seed": 2262286100
    },
    {
      "id": "border-80",
      "x": 1788.3333333333333,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 634.456,
      "seed": 1825078630
    },
    {
      "id": "border-81",
      "x": 1788.3333333333333,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 721.414,
      "seed": 3171654024
    },
    {
      "id": "border-82",
      "x": 1985,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 514.361,
      "seed": 216359930
    },
    {
      "id": "border-83",
      "x": 1985,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 325.63,
      "seed": 2405237052
    },
    {
      "id": "border-84",
      "x": 2181.6666666666665,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 628.973,
      "seed": 21465550
    },
    {
      "id": "border-85",
      "x": 2181.6666666666665,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 424.959,
      "seed": 2082482736
    },
    {
      "id": "border-86",
      "x": 2378.333333333333,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 525.607,
      "seed": 1379222242
    },
    {
      "id": "border-87",
      "x": 2378.333333333333,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 378.337,
      "seed": 2683471972
    },
    {
      "id": "border-88",
      "x": 2575,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 448.551,
      "seed": 3645907766
    },
    {
      "id": "border-89",
      "x": 2575,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 603.657,
      "seed": 397332440
    },
    {
      "id": "border-90",
      "x": 2771.6666666666665,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 484.319,
      "seed": 2611543754
    },
    {
      "id": "border-91",
      "x": 2771.6666666666665,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 469.616,
      "seed": 2812343436
    },
    {
      "id": "border-92",
      "x": 2968.333333333333,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 660.767,
      "seed": 3675515294
    },
    {
      "id": "border-93",
      "x": 2968.333333333333,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 352.653,
      "seed": 1543121536
    },
    {
      "id": "border-94",
      "x": 3165,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 647.566,
      "seed": 2998679474
    },
    {
      "id": "border-95",
      "x": 3165,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 653.099,
      "seed": 377808308
    },
    {
      "id": "border-96",
      "x": 3361.6666666666665,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 661.815,
      "seed": 1392016646
    },
    {
      "id": "border-97",
      "x": 3361.6666666666665,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 615.937,
      "seed": 1033427496
    },
    {
      "id": "border-98",
      "x": 3558.333333333333,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 570.801,
      "seed": 811503002
    },
    {
      "id": "border-99",
      "x": 3558.333333333333,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 392.816,
      "seed": 5176284
    },
    {
      "id": "border-100",
      "x": 3755,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 451.175,
      "seed": 3122101614
    },
    {
      "id": "border-101",
      "x": 3755,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 440.21,
      "seed": 3824516816
    },
    {
      "id": "border-102",
      "x": 3951.6666666666665,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 306.061,
      "seed": 1802739842
    },
    {
      "id": "border-103",
      "x": 3951.6666666666665,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 507.85,
      "seed": 2395199236
    },
    {
      "id": "border-104",
      "x": 4148.333333333333,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 543.855,
      "seed": 1287555798
    },
    {
      "id": "border-105",
      "x": 4148.333333333333,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 589.835,
      "seed": 63879288
    },
    {
      "id": "border-106",
      "x": 4345,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 683.74,
      "seed": 928190570
    },
    {
      "id": "border-107",
      "x": 4345,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 653.058,
      "seed": 3292272428
    },
    {
      "id": "border-108",
      "x": 4541.666666666666,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 493.183,
      "seed": 1894729022
    },
    {
      "id": "border-109",
      "x": 4541.666666666666,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 332.83,
      "seed": 2310481696
    },
    {
      "id": "border-110",
      "x": 4738.333333333333,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 312.914,
      "seed": 1917353298
    },
    {
      "id": "border-111",
      "x": 4738.333333333333,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 376.855,
      "seed": 2384747604
    },
    {
      "id": "border-112",
      "x": 4935,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 754.175,
      "seed": 3974057126
    },
    {
      "id": "border-113",
      "x": 4935,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 641.936,
      "seed": 2492820168
    },
    {
      "id": "border-114",
      "x": 5131.666666666666,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 652.236,
      "seed": 1679001402
    },
    {
      "id": "border-115",
      "x": 5131.666666666666,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 445.059,
      "seed": 662521468
    },
    {
      "id": "border-116",
      "x": 5328.333333333333,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 319.454,
      "seed": 3984081166
    },
    {
      "id": "border-117",
      "x": 5328.333333333333,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 566.744,
      "seed": 3223593840
    },
    {
      "id": "border-118",
      "x": 5525,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 704.391,
      "seed": 3966225954
    },
    {
      "id": "border-119",
      "x": 5525,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 646.8,
      "seed": 3411768740
    },
    {
      "id": "border-120",
      "x": 5721.666666666666,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 533.742,
      "seed": 3705127542
    },
    {
      "id": "border-121",
      "x": 5721.666666666666,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 493.884,
      "seed": 3211915544
    },
    {
      "id": "border-122",
      "x": 5918.333333333333,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 727.114,
      "seed": 2171400714
    },
    {
      "id": "border-123",
      "x": 5918.333333333333,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 704.491,
      "seed": 3077016012
    },
    {
      "id": "border-124",
      "x": 6115,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 423.9,
      "seed": 147812574
    },
    {
      "id": "border-125",
      "x": 6115,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 470.278,
      "seed": 1197568960
    },
    {
      "id": "border-126",
      "x": 6311.666666666666,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 770.769,
      "seed": 4265513714
    },
    {
      "id": "border-127",
      "x": 6311.666666666666,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 503.858,
      "seed": 2120098548
    },
    {
      "id": "border-128",
      "x": 6508.333333333333,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 572.547,
      "seed": 426044486
    },
    {
      "id": "border-129",
      "x": 6508.333333333333,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 684.452,
      "seed": 1227443048
    },
    {
      "id": "border-130",
      "x": 6705,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 664.492,
      "seed": 1097617626
    },
    {
      "id": "border-131",
      "x": 6705,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 590.042,
      "seed": 2861555996
    },
    {
      "id": "border-132",
      "x": 6901.666666666666,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 399.233,
      "seed": 1464980654
    },
    {
      "id": "border-133",
      "x": 6901.666666666666,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 321.917,
      "seed": 2094274576
    },
    {
      "id": "border-134",
      "x": 7098.333333333333,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 504.896,
      "seed": 2608450498
    },
    {
      "id": "border-135",
      "x": 7098.333333333333,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 564.75,
      "seed": 2959172676
    },
    {
      "id": "border-136",
      "x": 7295,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 674.17,
      "seed": 3263416854
    },
    {
      "id": "border-137",
      "x": 7295,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 470.602,
      "seed": 1002469816
    },
    {
      "id": "border-138",
      "x": 7491.666666666666,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 701.338,
      "seed": 224306090
    },
    {
      "id": "border-139",
      "x": 7491.666666666666,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 587.481,
      "seed": 818629740
    },
    {
      "id": "border-140",
      "x": 7688.333333333333,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 385.537,
      "seed": 4171000958
    },
    {
      "id": "border-141",
      "x": 7688.333333333333,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 670.363,
      "seed": 2871070816
    },
    {
      "id": "border-142",
      "x": 7885,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 631.752,
      "seed": 1460041874
    },
    {
      "id": "border-143",
      "x": 7885,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 304.805,
      "seed": 2346334612
    },
    {
      "id": "border-144",
      "x": 8081.666666666666,
      "y": -11390,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 731.337,
      "seed": 3950074854
    },
    {
      "id": "border-145",
      "x": 8081.666666666666,
      "y": 5790,
      "rx": 314.6666666666667,
      "ry": 90,
      "kind": "stone",
      "baseZ": -2515,
      "height": 458.543,
      "seed": 914127880
    },
    {
      "id": "border-146",
      "x": -6090,
      "y": -11200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 902.79,
      "seed": 3587238522
    },
    {
      "id": "border-147",
      "x": 8090,
      "y": -11200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 410.715,
      "seed": 3274623932
    },
    {
      "id": "border-148",
      "x": -6090,
      "y": -11000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 888.02,
      "seed": 1737242702
    },
    {
      "id": "border-149",
      "x": 8090,
      "y": -11000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 708.602,
      "seed": 1512922288
    },
    {
      "id": "border-150",
      "x": -6090,
      "y": -10800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1032.16,
      "seed": 856791394
    },
    {
      "id": "border-151",
      "x": 8090,
      "y": -10800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 689.028,
      "seed": 2893914852
    },
    {
      "id": "border-152",
      "x": -6090,
      "y": -10600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1043.613,
      "seed": 1789567414
    },
    {
      "id": "border-153",
      "x": 8090,
      "y": -10600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 504.803,
      "seed": 3185726040
    },
    {
      "id": "border-154",
      "x": -6090,
      "y": -10400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 548.36,
      "seed": 3801097546
    },
    {
      "id": "border-155",
      "x": 8090,
      "y": -10400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 686.859,
      "seed": 1947164428
    },
    {
      "id": "border-156",
      "x": -6090,
      "y": -10200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 800.682,
      "seed": 1245591582
    },
    {
      "id": "border-157",
      "x": 8090,
      "y": -10200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 431.965,
      "seed": 2669542656
    },
    {
      "id": "border-158",
      "x": -6090,
      "y": -10000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1049.825,
      "seed": 1896361522
    },
    {
      "id": "border-159",
      "x": 8090,
      "y": -10000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 654.157,
      "seed": 1866506292
    },
    {
      "id": "border-160",
      "x": -6090,
      "y": -9800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 654.035,
      "seed": 2850855814
    },
    {
      "id": "border-161",
      "x": 8090,
      "y": -9800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 455.281,
      "seed": 2344025256
    },
    {
      "id": "border-162",
      "x": -6090,
      "y": -9600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1016.396,
      "seed": 2729006106
    },
    {
      "id": "border-163",
      "x": 8090,
      "y": -9600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 384.293,
      "seed": 1057097308
    },
    {
      "id": "border-164",
      "x": -6090,
      "y": -9400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 987.918,
      "seed": 1108306926
    },
    {
      "id": "border-165",
      "x": 8090,
      "y": -9400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 431.189,
      "seed": 1817702736
    },
    {
      "id": "border-166",
      "x": -6090,
      "y": -9200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 690.311,
      "seed": 1637299970
    },
    {
      "id": "border-167",
      "x": 8090,
      "y": -9200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 685.728,
      "seed": 1113076100
    },
    {
      "id": "border-168",
      "x": -6090,
      "y": -9000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 825.875,
      "seed": 1983138134
    },
    {
      "id": "border-169",
      "x": 8090,
      "y": -9000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 411.318,
      "seed": 3741285112
    },
    {
      "id": "border-170",
      "x": -6090,
      "y": -8800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 700.95,
      "seed": 2087286506
    },
    {
      "id": "border-171",
      "x": 8090,
      "y": -8800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 389.725,
      "seed": 1490796972
    },
    {
      "id": "border-172",
      "x": -6090,
      "y": -8600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 620.367,
      "seed": 3147617214
    },
    {
      "id": "border-173",
      "x": 8090,
      "y": -8600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 739.482,
      "seed": 3783276960
    },
    {
      "id": "border-174",
      "x": -6090,
      "y": -8400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 725.324,
      "seed": 883667922
    },
    {
      "id": "border-175",
      "x": 8090,
      "y": -8400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 719.139,
      "seed": 4114175700
    },
    {
      "id": "border-176",
      "x": -6090,
      "y": -8200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 502.142,
      "seed": 3485379366
    },
    {
      "id": "border-177",
      "x": 8090,
      "y": -8200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 522.753,
      "seed": 3422604616
    },
    {
      "id": "border-178",
      "x": -6090,
      "y": -8000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1044.32,
      "seed": 2640154042
    },
    {
      "id": "border-179",
      "x": 8090,
      "y": -8000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 463.256,
      "seed": 2142343420
    },
    {
      "id": "border-180",
      "x": -6090,
      "y": -7800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 853.348,
      "seed": 3200479118
    },
    {
      "id": "border-181",
      "x": 8090,
      "y": -7800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 625.583,
      "seed": 2608584176
    },
    {
      "id": "border-182",
      "x": -6090,
      "y": -7600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 702.691,
      "seed": 3379733666
    },
    {
      "id": "border-183",
      "x": 8090,
      "y": -7600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 405.709,
      "seed": 144248868
    },
    {
      "id": "border-184",
      "x": -6090,
      "y": -7400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 628.404,
      "seed": 3121135862
    },
    {
      "id": "border-185",
      "x": 8090,
      "y": -7400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 307.992,
      "seed": 2353001368
    },
    {
      "id": "border-186",
      "x": -6090,
      "y": -7200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 852.799,
      "seed": 3394410634
    },
    {
      "id": "border-187",
      "x": 8090,
      "y": -7200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 450.441,
      "seed": 1255699532
    },
    {
      "id": "border-188",
      "x": -6090,
      "y": -7000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 858.615,
      "seed": 3198173022
    },
    {
      "id": "border-189",
      "x": 8090,
      "y": -7000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 751.825,
      "seed": 74434112
    },
    {
      "id": "border-190",
      "x": -6090,
      "y": -6800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 698.109,
      "seed": 2119764338
    },
    {
      "id": "border-191",
      "x": 8090,
      "y": -6800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 324.744,
      "seed": 4268514676
    },
    {
      "id": "border-192",
      "x": -6090,
      "y": -6600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 756.538,
      "seed": 198150854
    },
    {
      "id": "border-193",
      "x": 8090,
      "y": -6600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 339.064,
      "seed": 3464621544
    },
    {
      "id": "border-194",
      "x": -6090,
      "y": -6400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 908.428,
      "seed": 794138458
    },
    {
      "id": "border-195",
      "x": 8090,
      "y": -6400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 548.351,
      "seed": 2061855644
    },
    {
      "id": "border-196",
      "x": -6090,
      "y": -6200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 720.105,
      "seed": 1771062062
    },
    {
      "id": "border-197",
      "x": 8090,
      "y": -6200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 602.202,
      "seed": 2747337360
    },
    {
      "id": "border-198",
      "x": -6090,
      "y": -6000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 778.899,
      "seed": 17556034
    },
    {
      "id": "border-199",
      "x": 8090,
      "y": -6000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 357.597,
      "seed": 2850569924
    },
    {
      "id": "border-200",
      "x": -6090,
      "y": -5800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 796.481,
      "seed": 1058015382
    },
    {
      "id": "border-201",
      "x": 8090,
      "y": -5800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 615.687,
      "seed": 114015288
    },
    {
      "id": "border-202",
      "x": -6090,
      "y": -5600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 572.743,
      "seed": 800295466
    },
    {
      "id": "border-203",
      "x": 8090,
      "y": -5600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 625.637,
      "seed": 1236104940
    },
    {
      "id": "border-204",
      "x": -6090,
      "y": -5400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 897.689,
      "seed": 2033220350
    },
    {
      "id": "border-205",
      "x": 8090,
      "y": -5400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 640.423,
      "seed": 1846846176
    },
    {
      "id": "border-206",
      "x": -6090,
      "y": -5200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1039.75,
      "seed": 511192850
    },
    {
      "id": "border-207",
      "x": 8090,
      "y": -5200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 426.731,
      "seed": 2139206676
    },
    {
      "id": "border-208",
      "x": -6090,
      "y": -5000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1051.975,
      "seed": 1090992742
    },
    {
      "id": "border-209",
      "x": 8090,
      "y": -5000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 358.332,
      "seed": 3194117768
    },
    {
      "id": "border-210",
      "x": -6090,
      "y": -4800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 682.525,
      "seed": 905539834
    },
    {
      "id": "border-211",
      "x": 8090,
      "y": -4800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 488.59,
      "seed": 3125122620
    },
    {
      "id": "border-212",
      "x": -6090,
      "y": -4600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 546.922,
      "seed": 2187192014
    },
    {
      "id": "border-213",
      "x": 8090,
      "y": -4600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 683.983,
      "seed": 357535536
    },
    {
      "id": "border-214",
      "x": -6090,
      "y": -4400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 494.474,
      "seed": 2462773218
    },
    {
      "id": "border-215",
      "x": 8090,
      "y": -4400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 761.782,
      "seed": 3840785764
    },
    {
      "id": "border-216",
      "x": -6090,
      "y": -4200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 540.323,
      "seed": 1110581302
    },
    {
      "id": "border-217",
      "x": 8090,
      "y": -4200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 639.281,
      "seed": 3821720792
    },
    {
      "id": "border-218",
      "x": -6090,
      "y": -4000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 725.553,
      "seed": 2213825482
    },
    {
      "id": "border-219",
      "x": 8090,
      "y": -4000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 620.206,
      "seed": 3909273996
    },
    {
      "id": "border-220",
      "x": -6090,
      "y": -3800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 986.793,
      "seed": 3308619422
    },
    {
      "id": "border-221",
      "x": 8090,
      "y": -3800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 643.219,
      "seed": 1486278528
    },
    {
      "id": "border-222",
      "x": -6090,
      "y": -3600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 543.754,
      "seed": 3648070834
    },
    {
      "id": "border-223",
      "x": 8090,
      "y": -3600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 746.622,
      "seed": 2166446772
    },
    {
      "id": "border-224",
      "x": -6090,
      "y": -3400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1032.138,
      "seed": 2253240838
    },
    {
      "id": "border-225",
      "x": 8090,
      "y": -3400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 391.692,
      "seed": 449453864
    },
    {
      "id": "border-226",
      "x": -6090,
      "y": -3200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 592.352,
      "seed": 45161114
    },
    {
      "id": "border-227",
      "x": 8090,
      "y": -3200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 554.249,
      "seed": 1534726364
    },
    {
      "id": "border-228",
      "x": -6090,
      "y": -3000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 587.472,
      "seed": 4245969518
    },
    {
      "id": "border-229",
      "x": 8090,
      "y": -3000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 314.377,
      "seed": 1414489040
    },
    {
      "id": "border-230",
      "x": -6090,
      "y": -2800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1006.893,
      "seed": 4246195586
    },
    {
      "id": "border-231",
      "x": 8090,
      "y": -2800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 604.421,
      "seed": 2354154500
    },
    {
      "id": "border-232",
      "x": -6090,
      "y": -2600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 795.088,
      "seed": 878118870
    },
    {
      "id": "border-233",
      "x": 8090,
      "y": -2600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 459.665,
      "seed": 207961464
    },
    {
      "id": "border-234",
      "x": -6090,
      "y": -2400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 611.941,
      "seed": 310173034
    },
    {
      "id": "border-235",
      "x": 8090,
      "y": -2400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 560.31,
      "seed": 1350593580
    },
    {
      "id": "border-236",
      "x": -6090,
      "y": -2200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 526.067,
      "seed": 815227454
    },
    {
      "id": "border-237",
      "x": 8090,
      "y": -2200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 591.671,
      "seed": 3525200928
    },
    {
      "id": "border-238",
      "x": -6090,
      "y": -2000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 729.566,
      "seed": 1739319890
    },
    {
      "id": "border-239",
      "x": 8090,
      "y": -2000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 717.708,
      "seed": 536039764
    },
    {
      "id": "border-240",
      "x": -6090,
      "y": -1800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 921.652,
      "seed": 646646182
    },
    {
      "id": "border-241",
      "x": 8090,
      "y": -1800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 553.296,
      "seed": 3068211144
    },
    {
      "id": "border-242",
      "x": -6090,
      "y": -1600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1015.587,
      "seed": 1524929594
    },
    {
      "id": "border-243",
      "x": 8090,
      "y": -1600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 490.873,
      "seed": 271244156
    },
    {
      "id": "border-244",
      "x": -6090,
      "y": -1400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 818.364,
      "seed": 2174459406
    },
    {
      "id": "border-245",
      "x": 8090,
      "y": -1400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 422.35,
      "seed": 2565376112
    },
    {
      "id": "border-246",
      "x": -6090,
      "y": -1200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1051.568,
      "seed": 2992274210
    },
    {
      "id": "border-247",
      "x": 8090,
      "y": -1200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 475.436,
      "seed": 2260445860
    },
    {
      "id": "border-248",
      "x": -6090,
      "y": -1000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 788.867,
      "seed": 3127295862
    },
    {
      "id": "border-249",
      "x": 8090,
      "y": -1000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 460.748,
      "seed": 3183670808
    },
    {
      "id": "border-250",
      "x": -6090,
      "y": -800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 828.554,
      "seed": 2595569418
    },
    {
      "id": "border-251",
      "x": 8090,
      "y": -800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 520.374,
      "seed": 1003380428
    },
    {
      "id": "border-252",
      "x": -6090,
      "y": -600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 926.588,
      "seed": 4248702430
    },
    {
      "id": "border-253",
      "x": 8090,
      "y": -600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 383.756,
      "seed": 3167951040
    },
    {
      "id": "border-254",
      "x": -6090,
      "y": -400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 694.568,
      "seed": 1972404210
    },
    {
      "id": "border-255",
      "x": 8090,
      "y": -400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 431.042,
      "seed": 2359269364
    },
    {
      "id": "border-256",
      "x": -6090,
      "y": -200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 954.08,
      "seed": 2695309638
    },
    {
      "id": "border-257",
      "x": 8090,
      "y": -200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 314.308,
      "seed": 3117387880
    },
    {
      "id": "border-258",
      "x": -6090,
      "y": 0,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 765.849,
      "seed": 2012995034
    },
    {
      "id": "border-259",
      "x": 8090,
      "y": 0,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 465.269,
      "seed": 503313948
    },
    {
      "id": "border-260",
      "x": -6090,
      "y": 200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 939.143,
      "seed": 1809559982
    },
    {
      "id": "border-261",
      "x": 8090,
      "y": 200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 584.386,
      "seed": 4014144784
    },
    {
      "id": "border-262",
      "x": -6090,
      "y": 400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 945.852,
      "seed": 419100866
    },
    {
      "id": "border-263",
      "x": 8090,
      "y": 400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 676.514,
      "seed": 3470006596
    },
    {
      "id": "border-264",
      "x": -6090,
      "y": 600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 902.693,
      "seed": 2907260694
    },
    {
      "id": "border-265",
      "x": 8090,
      "y": 600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 383.454,
      "seed": 2299264696
    },
    {
      "id": "border-266",
      "x": -6090,
      "y": 800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 979.978,
      "seed": 1342533802
    },
    {
      "id": "border-267",
      "x": 8090,
      "y": 800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 523.09,
      "seed": 4204044652
    },
    {
      "id": "border-268",
      "x": -6090,
      "y": 1000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 1034.371,
      "seed": 554797438
    },
    {
      "id": "border-269",
      "x": 8090,
      "y": 1000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 456.962,
      "seed": 3470603616
    },
    {
      "id": "border-270",
      "x": -6090,
      "y": 1200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 546.079,
      "seed": 2743526802
    },
    {
      "id": "border-271",
      "x": 8090,
      "y": 1200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 635.446,
      "seed": 198061716
    },
    {
      "id": "border-272",
      "x": -6090,
      "y": 1400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 799.92,
      "seed": 2810845414
    },
    {
      "id": "border-273",
      "x": 8090,
      "y": 1400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 394.912,
      "seed": 2663203080
    },
    {
      "id": "border-274",
      "x": -6090,
      "y": 1600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 524.692,
      "seed": 123664250
    },
    {
      "id": "border-275",
      "x": 8090,
      "y": 1600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 592.512,
      "seed": 1587634364
    },
    {
      "id": "border-276",
      "x": -6090,
      "y": 1800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 944.294,
      "seed": 3418133838
    },
    {
      "id": "border-277",
      "x": 8090,
      "y": 1800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 443.483,
      "seed": 931578288
    },
    {
      "id": "border-278",
      "x": -6090,
      "y": 2000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 873.031,
      "seed": 2338408034
    },
    {
      "id": "border-279",
      "x": 8090,
      "y": 2000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 748.108,
      "seed": 1933760484
    },
    {
      "id": "border-280",
      "x": -6090,
      "y": 2200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 954.532,
      "seed": 434544310
    },
    {
      "id": "border-281",
      "x": 8090,
      "y": 2200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 744.723,
      "seed": 1399347032
    },
    {
      "id": "border-282",
      "x": -6090,
      "y": 2400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 822.736,
      "seed": 3654644298
    },
    {
      "id": "border-283",
      "x": 8090,
      "y": 2400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 539.414,
      "seed": 1887122444
    },
    {
      "id": "border-284",
      "x": -6090,
      "y": 2600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 562.37,
      "seed": 1174000926
    },
    {
      "id": "border-285",
      "x": 8090,
      "y": 2600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 369.296,
      "seed": 2456068608
    },
    {
      "id": "border-286",
      "x": -6090,
      "y": 2800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 829.359,
      "seed": 2247564082
    },
    {
      "id": "border-287",
      "x": 8090,
      "y": 2800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 372.505,
      "seed": 4129756468
    },
    {
      "id": "border-288",
      "x": -6090,
      "y": 3000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 710.61,
      "seed": 572250246
    },
    {
      "id": "border-289",
      "x": 8090,
      "y": 3000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 399.304,
      "seed": 886194600
    },
    {
      "id": "border-290",
      "x": -6090,
      "y": 3200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 553.606,
      "seed": 712368410
    },
    {
      "id": "border-291",
      "x": 8090,
      "y": 3200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 462.942,
      "seed": 1068964700
    },
    {
      "id": "border-292",
      "x": -6090,
      "y": 3400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 551.238,
      "seed": 1697007854
    },
    {
      "id": "border-293",
      "x": 8090,
      "y": 3400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 655.154,
      "seed": 635164240
    },
    {
      "id": "border-294",
      "x": -6090,
      "y": 3600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 882.334,
      "seed": 1475699714
    },
    {
      "id": "border-295",
      "x": 8090,
      "y": 3600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 415.438,
      "seed": 2528110212
    },
    {
      "id": "border-296",
      "x": -6090,
      "y": 3800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 771.292,
      "seed": 1093060182
    },
    {
      "id": "border-297",
      "x": 8090,
      "y": 3800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 472.509,
      "seed": 1442840568
    },
    {
      "id": "border-298",
      "x": -6090,
      "y": 4000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 837.289,
      "seed": 1401766890
    },
    {
      "id": "border-299",
      "x": 8090,
      "y": 4000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 488.571,
      "seed": 355079852
    },
    {
      "id": "border-300",
      "x": -6090,
      "y": 4200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 662.474,
      "seed": 3386831038
    },
    {
      "id": "border-301",
      "x": 8090,
      "y": 4200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 691.28,
      "seed": 1704025760
    },
    {
      "id": "border-302",
      "x": -6090,
      "y": 4400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 811.6,
      "seed": 2773033170
    },
    {
      "id": "border-303",
      "x": 8090,
      "y": 4400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 760.57,
      "seed": 3092401108
    },
    {
      "id": "border-304",
      "x": -6090,
      "y": 4600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 946.524,
      "seed": 725903398
    },
    {
      "id": "border-305",
      "x": 8090,
      "y": 4600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 707.696,
      "seed": 2671153736
    },
    {
      "id": "border-306",
      "x": -6090,
      "y": 4800,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 694.021,
      "seed": 1990761146
    },
    {
      "id": "border-307",
      "x": 8090,
      "y": 4800,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 561.165,
      "seed": 3270059516
    },
    {
      "id": "border-308",
      "x": -6090,
      "y": 5000,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 916.334,
      "seed": 2952842382
    },
    {
      "id": "border-309",
      "x": 8090,
      "y": 5000,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 522.429,
      "seed": 1114258160
    },
    {
      "id": "border-310",
      "x": -6090,
      "y": 5200,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 888.922,
      "seed": 3240055202
    },
    {
      "id": "border-311",
      "x": 8090,
      "y": 5200,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 534.488,
      "seed": 1875068196
    },
    {
      "id": "border-312",
      "x": -6090,
      "y": 5400,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 760.814,
      "seed": 2549202422
    },
    {
      "id": "border-313",
      "x": 8090,
      "y": 5400,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 689.784,
      "seed": 502986904
    },
    {
      "id": "border-314",
      "x": -6090,
      "y": 5600,
      "rx": 90,
      "ry": 280,
      "kind": "iceberg",
      "baseZ": -280,
      "height": 512.033,
      "seed": 1284826506
    },
    {
      "id": "border-315",
      "x": 8090,
      "y": 5600,
      "rx": 90,
      "ry": 320,
      "kind": "stone",
      "baseZ": -2515,
      "height": 711.047,
      "seed": 4098443596
    }
  ],
  "isopods": [
    {
      "id": "ice-isopod-0",
      "x": -100,
      "y": 210,
      "z": -269.345522,
      "homeX": -100,
      "homeY": 210,
      "seed": 1970,
      "heading": 3.8283624293132954,
      "size": 1.2914518670877442
    },
    {
      "id": "ice-isopod-1",
      "x": 240,
      "y": 180,
      "z": -351.011078,
      "homeX": 240,
      "homeY": 180,
      "seed": 1115,
      "heading": 2.0699731518790245,
      "size": 0.7173072650446557
    },
    {
      "id": "ice-isopod-2",
      "x": 510,
      "y": -210,
      "z": -273.453765,
      "homeX": 510,
      "homeY": -210,
      "seed": 1981,
      "heading": 2.5990328772944693,
      "size": 0.7934830707963556
    },
    {
      "id": "ice-isopod-3",
      "x": -302.3938847603989,
      "y": 231.41285677383155,
      "z": -271.368315,
      "homeX": -320,
      "homeY": 190,
      "seed": 7874,
      "heading": 0.4224123493641601,
      "size": 1.0462648084503599
    },
    {
      "id": "ice-isopod-4",
      "x": 1741.7639015987515,
      "y": -853.0630179913715,
      "z": -499.967855,
      "homeX": 1741.7639015987515,
      "homeY": -853.0630179913715,
      "seed": 3665,
      "heading": 1.268219839383968,
      "size": 1.1149282327736727
    },
    {
      "id": "ice-isopod-5",
      "x": 1383.3979216916487,
      "y": -989.0045925742015,
      "z": -238.933374,
      "homeX": 1383.3979216916487,
      "homeY": -989.0045925742015,
      "seed": 6962,
      "heading": 0.11212840198087248,
      "size": 1.2991740764700808
    },
    {
      "id": "ice-isopod-6",
      "x": 1739.715560367331,
      "y": 540,
      "z": -519.778273,
      "homeX": 1739.715560367331,
      "homeY": 540,
      "seed": 2934,
      "heading": 4.798291670439393,
      "size": 0.7161660736775958
    },
    {
      "id": "ice-isopod-7",
      "x": 3014.348282762803,
      "y": -938.0289227468893,
      "z": -2470.286084,
      "homeX": 3014.348282762803,
      "homeY": -938.0289227468893,
      "seed": 7709,
      "heading": 1.6799077879309303,
      "size": 0.655629091442097
    },
    {
      "id": "ice-isopod-8",
      "x": 1846.30387628451,
      "y": 480.04137470852584,
      "z": -958.40063,
      "homeX": 1846.30387628451,
      "homeY": 480.04137470852584,
      "seed": 1752,
      "heading": 5.262420986739817,
      "size": 0.6662599382805638
    },
    {
      "id": "ice-isopod-9",
      "x": 2982.7412423258647,
      "y": -435.03620044793934,
      "z": -2505.494144,
      "homeX": 2982.7412423258647,
      "homeY": -435.03620044793934,
      "seed": 5057,
      "heading": 5.12187810454179,
      "size": 1.1522249952540733
    },
    {
      "id": "ice-isopod-10",
      "x": 3097.72678588517,
      "y": -320.4140488291159,
      "z": -2508.463025,
      "homeX": 3097.72678588517,
      "homeY": -320.4140488291159,
      "seed": 1689,
      "heading": 5.339679767849588,
      "size": 0.7923606363474391
    },
    {
      "id": "ice-isopod-11",
      "x": 2239.852041755803,
      "y": -124.2145675001666,
      "z": -2475.226266,
      "homeX": 2239.852041755803,
      "homeY": -124.2145675001666,
      "seed": 9605,
      "heading": 2.861598884394009,
      "size": 0.987905295577366
    }
  ],
  "centipedes": [
    {
      "id": "ice-centipede-147",
      "x": -800.9764818701977,
      "y": -1123.8023996033787,
      "z": 0,
      "platformId": "hunting-glacier",
      "lengthMeters": 60,
      "heading": 0,
      "pitch": 0,
      "state": "patrol",
      "attackCooldown": 0,
      "spacing": 37.5,
      "vertices": [
        {
          "x": -1696.7429113006824,
          "y": -421.9005898170559
        },
        {
          "x": -2109.136535371844,
          "y": -636.7495120199636
        },
        {
          "x": -2316.4393640286294,
          "y": -847.4113153358983
        },
        {
          "x": -2428.489063453826,
          "y": -1118.4626741465383
        },
        {
          "x": -2294.2396806304314,
          "y": -1403.485821930036
        },
        {
          "x": -1868.5757499805723,
          "y": -1571.0902446661057
        },
        {
          "x": -1460.462768731357,
          "y": -1632.0761239314056
        },
        {
          "x": -987.4711950669816,
          "y": -1557.5965544491287
        },
        {
          "x": -668.2881070619658,
          "y": -1276.440936569506
        },
        {
          "x": -685.8121067318256,
          "y": -928.6469965594863
        },
        {
          "x": -808.0828984730517,
          "y": -630.2184553335327
        },
        {
          "x": -1217.972149642148,
          "y": -470.11539883847854
        }
      ],
      "segments": [
        {
          "x": -800.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -838.4764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -875.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -913.4764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -950.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -988.4764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1025.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1063.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1100.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1138.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1175.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1213.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1250.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1288.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1325.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1363.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1400.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1438.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1475.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1513.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1550.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1588.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1625.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1663.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1700.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1738.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1775.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1813.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1850.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1888.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1925.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1963.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2000.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2038.4764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2075.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2113.476481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2150.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2188.476481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2225.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2263.476481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2300.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        }
      ],
      "trail": [
        {
          "x": -800.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -806.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -812.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -818.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -824.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -830.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -836.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -842.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -848.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -854.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -860.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -866.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -872.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -878.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -884.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -890.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -896.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -902.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -908.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -914.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -920.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -926.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -932.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -938.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -944.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -950.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -956.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -962.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -968.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -974.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -980.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -986.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -992.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -998.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1004.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1010.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1016.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1022.9764818701977,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1028.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1034.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1040.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1046.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1052.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1058.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1064.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1070.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1076.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1082.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1088.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1094.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1100.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1106.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1112.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1118.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1124.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1130.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1136.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1142.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1148.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1154.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1160.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1166.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1172.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1178.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1184.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1190.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1196.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1202.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1208.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1214.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1220.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1226.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1232.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1238.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1244.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1250.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1256.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1262.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1268.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1274.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1280.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1286.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1292.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1298.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1304.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1310.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1316.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1322.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1328.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1334.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1340.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1346.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1352.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1358.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1364.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1370.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1376.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1382.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1388.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1394.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1400.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1406.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1412.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1418.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1424.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1430.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1436.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1442.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1448.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1454.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1460.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1466.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1472.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1478.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1484.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1490.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1496.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1502.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1508.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1514.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1520.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1526.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1532.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1538.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1544.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1550.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1556.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1562.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1568.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1574.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1580.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1586.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1592.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1598.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1604.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1610.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1616.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1622.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1628.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1634.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1640.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1646.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1652.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1658.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1664.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1670.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1676.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1682.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1688.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1694.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1700.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1706.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1712.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1718.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1724.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1730.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1736.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1742.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1748.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1754.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1760.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1766.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1772.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1778.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1784.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1790.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1796.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1802.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1808.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1814.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1820.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1826.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1832.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1838.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1844.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1850.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1856.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1862.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1868.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1874.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1880.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1886.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1892.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1898.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1904.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1910.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1916.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1922.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1928.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1934.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1940.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1946.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1952.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1958.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1964.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1970.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1976.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1982.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1988.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -1994.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2000.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2006.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2012.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2018.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2024.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2030.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2036.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2042.9764818701979,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2048.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2054.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2060.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2066.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2072.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2078.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2084.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2090.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2096.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2102.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2108.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2114.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2120.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2126.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2132.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2138.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2144.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2150.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2156.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2162.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2168.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2174.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2180.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2186.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2192.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2198.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2204.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2210.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2216.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2222.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2228.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2234.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2240.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2246.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2252.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2258.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2264.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2270.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2276.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2282.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2288.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2294.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2300.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2306.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2312.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2318.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2324.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2330.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2336.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2342.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2348.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2354.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2360.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2366.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2372.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2378.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        },
        {
          "x": -2384.976481870198,
          "y": -1123.8023996033787,
          "z": 0
        }
      ],
      "route": [],
      "routeMode": "",
      "destinationId": "",
      "previousDestination": "",
      "routeTimer": 0,
      "targetPoint": null,
      "visitedPlatforms": [
        "hunting-glacier"
      ]
    }
  ],
  "squids": [
    {
      "id": "arctic-squid-0",
      "x": 240,
      "y": 50,
      "z": -120,
      "px": 240,
      "py": 50,
      "pz": -120,
      "homeX": 240,
      "homeY": 50,
      "homeZ": -120,
      "heading": 1.072549960033807,
      "seed": 3631,
      "headRadius": 15,
      "lengthMeters": 3,
      "tentacles": [
        [
          {
            "x": 245.25674428698056,
            "y": 59.662641434995784,
            "z": -129,
            "px": 245.25674428698056,
            "py": 59.662641434995784,
            "pz": -129
          },
          {
            "x": 245.25674428698056,
            "y": 59.662641434995784,
            "z": -135.375,
            "px": 245.25674428698056,
            "py": 59.662641434995784,
            "pz": -135.375
          },
          {
            "x": 245.25674428698056,
            "y": 59.662641434995784,
            "z": -141.75,
            "px": 245.25674428698056,
            "py": 59.662641434995784,
            "pz": -141.75
          },
          {
            "x": 245.25674428698056,
            "y": 59.662641434995784,
            "z": -148.125,
            "px": 245.25674428698056,
            "py": 59.662641434995784,
            "pz": -148.125
          },
          {
            "x": 245.25674428698056,
            "y": 59.662641434995784,
            "z": -154.5,
            "px": 245.25674428698056,
            "py": 59.662641434995784,
            "pz": -154.5
          },
          {
            "x": 245.25674428698056,
            "y": 59.662641434995784,
            "z": -160.875,
            "px": 245.25674428698056,
            "py": 59.662641434995784,
            "pz": -160.875
          },
          {
            "x": 245.25674428698056,
            "y": 59.662641434995784,
            "z": -167.25,
            "px": 245.25674428698056,
            "py": 59.662641434995784,
            "pz": -167.25
          },
          {
            "x": 245.25674428698056,
            "y": 59.662641434995784,
            "z": -173.625,
            "px": 245.25674428698056,
            "py": 59.662641434995784,
            "pz": -173.625
          },
          {
            "x": 245.25674428698056,
            "y": 59.662641434995784,
            "z": -180,
            "px": 245.25674428698056,
            "py": 59.662641434995784,
            "pz": -180
          }
        ],
        [
          {
            "x": 236.88456024942795,
            "y": 60.54959881514722,
            "z": -129,
            "px": 236.88456024942795,
            "py": 60.54959881514722,
            "pz": -129
          },
          {
            "x": 236.88456024942795,
            "y": 60.54959881514722,
            "z": -135.375,
            "px": 236.88456024942795,
            "py": 60.54959881514722,
            "pz": -135.375
          },
          {
            "x": 236.88456024942795,
            "y": 60.54959881514722,
            "z": -141.75,
            "px": 236.88456024942795,
            "py": 60.54959881514722,
            "pz": -141.75
          },
          {
            "x": 236.88456024942795,
            "y": 60.54959881514722,
            "z": -148.125,
            "px": 236.88456024942795,
            "py": 60.54959881514722,
            "pz": -148.125
          },
          {
            "x": 236.88456024942795,
            "y": 60.54959881514722,
            "z": -154.5,
            "px": 236.88456024942795,
            "py": 60.54959881514722,
            "pz": -154.5
          },
          {
            "x": 236.88456024942795,
            "y": 60.54959881514722,
            "z": -160.875,
            "px": 236.88456024942795,
            "py": 60.54959881514722,
            "pz": -160.875
          },
          {
            "x": 236.88456024942795,
            "y": 60.54959881514722,
            "z": -167.25,
            "px": 236.88456024942795,
            "py": 60.54959881514722,
            "pz": -167.25
          },
          {
            "x": 236.88456024942795,
            "y": 60.54959881514722,
            "z": -173.625,
            "px": 236.88456024942795,
            "py": 60.54959881514722,
            "pz": -173.625
          },
          {
            "x": 236.88456024942795,
            "y": 60.54959881514722,
            "z": -180,
            "px": 236.88456024942795,
            "py": 60.54959881514722,
            "pz": -180
          }
        ],
        [
          {
            "x": 230.33735856500422,
            "y": 55.25674428698055,
            "z": -129,
            "px": 230.33735856500422,
            "py": 55.25674428698055,
            "pz": -129
          },
          {
            "x": 230.33735856500422,
            "y": 55.25674428698055,
            "z": -135.375,
            "px": 230.33735856500422,
            "py": 55.25674428698055,
            "pz": -135.375
          },
          {
            "x": 230.33735856500422,
            "y": 55.25674428698055,
            "z": -141.75,
            "px": 230.33735856500422,
            "py": 55.25674428698055,
            "pz": -141.75
          },
          {
            "x": 230.33735856500422,
            "y": 55.25674428698055,
            "z": -148.125,
            "px": 230.33735856500422,
            "py": 55.25674428698055,
            "pz": -148.125
          },
          {
            "x": 230.33735856500422,
            "y": 55.25674428698055,
            "z": -154.5,
            "px": 230.33735856500422,
            "py": 55.25674428698055,
            "pz": -154.5
          },
          {
            "x": 230.33735856500422,
            "y": 55.25674428698055,
            "z": -160.875,
            "px": 230.33735856500422,
            "py": 55.25674428698055,
            "pz": -160.875
          },
          {
            "x": 230.33735856500422,
            "y": 55.25674428698055,
            "z": -167.25,
            "px": 230.33735856500422,
            "py": 55.25674428698055,
            "pz": -167.25
          },
          {
            "x": 230.33735856500422,
            "y": 55.25674428698055,
            "z": -173.625,
            "px": 230.33735856500422,
            "py": 55.25674428698055,
            "pz": -173.625
          },
          {
            "x": 230.33735856500422,
            "y": 55.25674428698055,
            "z": -180,
            "px": 230.33735856500422,
            "py": 55.25674428698055,
            "pz": -180
          }
        ],
        [
          {
            "x": 229.45040118485278,
            "y": 46.884560249427956,
            "z": -129,
            "px": 229.45040118485278,
            "py": 46.884560249427956,
            "pz": -129
          },
          {
            "x": 229.45040118485278,
            "y": 46.884560249427956,
            "z": -135.375,
            "px": 229.45040118485278,
            "py": 46.884560249427956,
            "pz": -135.375
          },
          {
            "x": 229.45040118485278,
            "y": 46.884560249427956,
            "z": -141.75,
            "px": 229.45040118485278,
            "py": 46.884560249427956,
            "pz": -141.75
          },
          {
            "x": 229.45040118485278,
            "y": 46.884560249427956,
            "z": -148.125,
            "px": 229.45040118485278,
            "py": 46.884560249427956,
            "pz": -148.125
          },
          {
            "x": 229.45040118485278,
            "y": 46.884560249427956,
            "z": -154.5,
            "px": 229.45040118485278,
            "py": 46.884560249427956,
            "pz": -154.5
          },
          {
            "x": 229.45040118485278,
            "y": 46.884560249427956,
            "z": -160.875,
            "px": 229.45040118485278,
            "py": 46.884560249427956,
            "pz": -160.875
          },
          {
            "x": 229.45040118485278,
            "y": 46.884560249427956,
            "z": -167.25,
            "px": 229.45040118485278,
            "py": 46.884560249427956,
            "pz": -167.25
          },
          {
            "x": 229.45040118485278,
            "y": 46.884560249427956,
            "z": -173.625,
            "px": 229.45040118485278,
            "py": 46.884560249427956,
            "pz": -173.625
          },
          {
            "x": 229.45040118485278,
            "y": 46.884560249427956,
            "z": -180,
            "px": 229.45040118485278,
            "py": 46.884560249427956,
            "pz": -180
          }
        ],
        [
          {
            "x": 234.74325571301947,
            "y": 40.337358565004216,
            "z": -129,
            "px": 234.74325571301947,
            "py": 40.337358565004216,
            "pz": -129
          },
          {
            "x": 234.74325571301947,
            "y": 40.337358565004216,
            "z": -135.375,
            "px": 234.74325571301947,
            "py": 40.337358565004216,
            "pz": -135.375
          },
          {
            "x": 234.74325571301947,
            "y": 40.337358565004216,
            "z": -141.75,
            "px": 234.74325571301947,
            "py": 40.337358565004216,
            "pz": -141.75
          },
          {
            "x": 234.74325571301947,
            "y": 40.337358565004216,
            "z": -148.125,
            "px": 234.74325571301947,
            "py": 40.337358565004216,
            "pz": -148.125
          },
          {
            "x": 234.74325571301947,
            "y": 40.337358565004216,
            "z": -154.5,
            "px": 234.74325571301947,
            "py": 40.337358565004216,
            "pz": -154.5
          },
          {
            "x": 234.74325571301947,
            "y": 40.337358565004216,
            "z": -160.875,
            "px": 234.74325571301947,
            "py": 40.337358565004216,
            "pz": -160.875
          },
          {
            "x": 234.74325571301947,
            "y": 40.337358565004216,
            "z": -167.25,
            "px": 234.74325571301947,
            "py": 40.337358565004216,
            "pz": -167.25
          },
          {
            "x": 234.74325571301947,
            "y": 40.337358565004216,
            "z": -173.625,
            "px": 234.74325571301947,
            "py": 40.337358565004216,
            "pz": -173.625
          },
          {
            "x": 234.74325571301947,
            "y": 40.337358565004216,
            "z": -180,
            "px": 234.74325571301947,
            "py": 40.337358565004216,
            "pz": -180
          }
        ],
        [
          {
            "x": 243.11543975057202,
            "y": 39.45040118485278,
            "z": -129,
            "px": 243.11543975057202,
            "py": 39.45040118485278,
            "pz": -129
          },
          {
            "x": 243.11543975057202,
            "y": 39.45040118485278,
            "z": -135.375,
            "px": 243.11543975057202,
            "py": 39.45040118485278,
            "pz": -135.375
          },
          {
            "x": 243.11543975057202,
            "y": 39.45040118485278,
            "z": -141.75,
            "px": 243.11543975057202,
            "py": 39.45040118485278,
            "pz": -141.75
          },
          {
            "x": 243.11543975057202,
            "y": 39.45040118485278,
            "z": -148.125,
            "px": 243.11543975057202,
            "py": 39.45040118485278,
            "pz": -148.125
          },
          {
            "x": 243.11543975057202,
            "y": 39.45040118485278,
            "z": -154.5,
            "px": 243.11543975057202,
            "py": 39.45040118485278,
            "pz": -154.5
          },
          {
            "x": 243.11543975057202,
            "y": 39.45040118485278,
            "z": -160.875,
            "px": 243.11543975057202,
            "py": 39.45040118485278,
            "pz": -160.875
          },
          {
            "x": 243.11543975057202,
            "y": 39.45040118485278,
            "z": -167.25,
            "px": 243.11543975057202,
            "py": 39.45040118485278,
            "pz": -167.25
          },
          {
            "x": 243.11543975057202,
            "y": 39.45040118485278,
            "z": -173.625,
            "px": 243.11543975057202,
            "py": 39.45040118485278,
            "pz": -173.625
          },
          {
            "x": 243.11543975057202,
            "y": 39.45040118485278,
            "z": -180,
            "px": 243.11543975057202,
            "py": 39.45040118485278,
            "pz": -180
          }
        ],
        [
          {
            "x": 249.66264143499578,
            "y": 44.74325571301945,
            "z": -129,
            "px": 249.66264143499578,
            "py": 44.74325571301945,
            "pz": -129
          },
          {
            "x": 249.66264143499578,
            "y": 44.74325571301945,
            "z": -135.375,
            "px": 249.66264143499578,
            "py": 44.74325571301945,
            "pz": -135.375
          },
          {
            "x": 249.66264143499578,
            "y": 44.74325571301945,
            "z": -141.75,
            "px": 249.66264143499578,
            "py": 44.74325571301945,
            "pz": -141.75
          },
          {
            "x": 249.66264143499578,
            "y": 44.74325571301945,
            "z": -148.125,
            "px": 249.66264143499578,
            "py": 44.74325571301945,
            "pz": -148.125
          },
          {
            "x": 249.66264143499578,
            "y": 44.74325571301945,
            "z": -154.5,
            "px": 249.66264143499578,
            "py": 44.74325571301945,
            "pz": -154.5
          },
          {
            "x": 249.66264143499578,
            "y": 44.74325571301945,
            "z": -160.875,
            "px": 249.66264143499578,
            "py": 44.74325571301945,
            "pz": -160.875
          },
          {
            "x": 249.66264143499578,
            "y": 44.74325571301945,
            "z": -167.25,
            "px": 249.66264143499578,
            "py": 44.74325571301945,
            "pz": -167.25
          },
          {
            "x": 249.66264143499578,
            "y": 44.74325571301945,
            "z": -173.625,
            "px": 249.66264143499578,
            "py": 44.74325571301945,
            "pz": -173.625
          },
          {
            "x": 249.66264143499578,
            "y": 44.74325571301945,
            "z": -180,
            "px": 249.66264143499578,
            "py": 44.74325571301945,
            "pz": -180
          }
        ],
        [
          {
            "x": 250.54959881514722,
            "y": 53.11543975057204,
            "z": -129,
            "px": 250.54959881514722,
            "py": 53.11543975057204,
            "pz": -129
          },
          {
            "x": 250.54959881514722,
            "y": 53.11543975057204,
            "z": -135.375,
            "px": 250.54959881514722,
            "py": 53.11543975057204,
            "pz": -135.375
          },
          {
            "x": 250.54959881514722,
            "y": 53.11543975057204,
            "z": -141.75,
            "px": 250.54959881514722,
            "py": 53.11543975057204,
            "pz": -141.75
          },
          {
            "x": 250.54959881514722,
            "y": 53.11543975057204,
            "z": -148.125,
            "px": 250.54959881514722,
            "py": 53.11543975057204,
            "pz": -148.125
          },
          {
            "x": 250.54959881514722,
            "y": 53.11543975057204,
            "z": -154.5,
            "px": 250.54959881514722,
            "py": 53.11543975057204,
            "pz": -154.5
          },
          {
            "x": 250.54959881514722,
            "y": 53.11543975057204,
            "z": -160.875,
            "px": 250.54959881514722,
            "py": 53.11543975057204,
            "pz": -160.875
          },
          {
            "x": 250.54959881514722,
            "y": 53.11543975057204,
            "z": -167.25,
            "px": 250.54959881514722,
            "py": 53.11543975057204,
            "pz": -167.25
          },
          {
            "x": 250.54959881514722,
            "y": 53.11543975057204,
            "z": -173.625,
            "px": 250.54959881514722,
            "py": 53.11543975057204,
            "pz": -173.625
          },
          {
            "x": 250.54959881514722,
            "y": 53.11543975057204,
            "z": -180,
            "px": 250.54959881514722,
            "py": 53.11543975057204,
            "pz": -180
          }
        ]
      ]
    },
    {
      "id": "arctic-squid-1",
      "x": -440,
      "y": 100,
      "z": -130,
      "px": -440,
      "py": 100,
      "pz": -130,
      "homeX": -440,
      "homeY": 100,
      "homeZ": -130,
      "heading": 0.5280657925398656,
      "seed": 431,
      "headRadius": 15,
      "lengthMeters": 3,
      "tentacles": [
        [
          {
            "x": -430.49838411451873,
            "y": 105.54249903606397,
            "z": -139,
            "px": -430.49838411451873,
            "py": 105.54249903606397,
            "pz": -139
          },
          {
            "x": -430.49838411451873,
            "y": 105.54249903606397,
            "z": -145.375,
            "px": -430.49838411451873,
            "py": 105.54249903606397,
            "pz": -145.375
          },
          {
            "x": -430.49838411451873,
            "y": 105.54249903606397,
            "z": -151.75,
            "px": -430.49838411451873,
            "py": 105.54249903606397,
            "pz": -151.75
          },
          {
            "x": -430.49838411451873,
            "y": 105.54249903606397,
            "z": -158.125,
            "px": -430.49838411451873,
            "py": 105.54249903606397,
            "pz": -158.125
          },
          {
            "x": -430.49838411451873,
            "y": 105.54249903606397,
            "z": -164.5,
            "px": -430.49838411451873,
            "py": 105.54249903606397,
            "pz": -164.5
          },
          {
            "x": -430.49838411451873,
            "y": 105.54249903606397,
            "z": -170.875,
            "px": -430.49838411451873,
            "py": 105.54249903606397,
            "pz": -170.875
          },
          {
            "x": -430.49838411451873,
            "y": 105.54249903606397,
            "z": -177.25,
            "px": -430.49838411451873,
            "py": 105.54249903606397,
            "pz": -177.25
          },
          {
            "x": -430.49838411451873,
            "y": 105.54249903606397,
            "z": -183.625,
            "px": -430.49838411451873,
            "py": 105.54249903606397,
            "pz": -183.625
          },
          {
            "x": -430.49838411451873,
            "y": 105.54249903606397,
            "z": -190,
            "px": -430.49838411451873,
            "py": 105.54249903606397,
            "pz": -190
          }
        ],
        [
          {
            "x": -437.2004816282671,
            "y": 110.63779567797437,
            "z": -139,
            "px": -437.2004816282671,
            "py": 110.63779567797437,
            "pz": -139
          },
          {
            "x": -437.2004816282671,
            "y": 110.63779567797437,
            "z": -145.375,
            "px": -437.2004816282671,
            "py": 110.63779567797437,
            "pz": -145.375
          },
          {
            "x": -437.2004816282671,
            "y": 110.63779567797437,
            "z": -151.75,
            "px": -437.2004816282671,
            "py": 110.63779567797437,
            "pz": -151.75
          },
          {
            "x": -437.2004816282671,
            "y": 110.63779567797437,
            "z": -158.125,
            "px": -437.2004816282671,
            "py": 110.63779567797437,
            "pz": -158.125
          },
          {
            "x": -437.2004816282671,
            "y": 110.63779567797437,
            "z": -164.5,
            "px": -437.2004816282671,
            "py": 110.63779567797437,
            "pz": -164.5
          },
          {
            "x": -437.2004816282671,
            "y": 110.63779567797437,
            "z": -170.875,
            "px": -437.2004816282671,
            "py": 110.63779567797437,
            "pz": -170.875
          },
          {
            "x": -437.2004816282671,
            "y": 110.63779567797437,
            "z": -177.25,
            "px": -437.2004816282671,
            "py": 110.63779567797437,
            "pz": -177.25
          },
          {
            "x": -437.2004816282671,
            "y": 110.63779567797437,
            "z": -183.625,
            "px": -437.2004816282671,
            "py": 110.63779567797437,
            "pz": -183.625
          },
          {
            "x": -437.2004816282671,
            "y": 110.63779567797437,
            "z": -190,
            "px": -437.2004816282671,
            "py": 110.63779567797437,
            "pz": -190
          }
        ],
        [
          {
            "x": -445.542499036064,
            "y": 109.50161588548127,
            "z": -139,
            "px": -445.542499036064,
            "py": 109.50161588548127,
            "pz": -139
          },
          {
            "x": -445.542499036064,
            "y": 109.50161588548127,
            "z": -145.375,
            "px": -445.542499036064,
            "py": 109.50161588548127,
            "pz": -145.375
          },
          {
            "x": -445.542499036064,
            "y": 109.50161588548127,
            "z": -151.75,
            "px": -445.542499036064,
            "py": 109.50161588548127,
            "pz": -151.75
          },
          {
            "x": -445.542499036064,
            "y": 109.50161588548127,
            "z": -158.125,
            "px": -445.542499036064,
            "py": 109.50161588548127,
            "pz": -158.125
          },
          {
            "x": -445.542499036064,
            "y": 109.50161588548127,
            "z": -164.5,
            "px": -445.542499036064,
            "py": 109.50161588548127,
            "pz": -164.5
          },
          {
            "x": -445.542499036064,
            "y": 109.50161588548127,
            "z": -170.875,
            "px": -445.542499036064,
            "py": 109.50161588548127,
            "pz": -170.875
          },
          {
            "x": -445.542499036064,
            "y": 109.50161588548127,
            "z": -177.25,
            "px": -445.542499036064,
            "py": 109.50161588548127,
            "pz": -177.25
          },
          {
            "x": -445.542499036064,
            "y": 109.50161588548127,
            "z": -183.625,
            "px": -445.542499036064,
            "py": 109.50161588548127,
            "pz": -183.625
          },
          {
            "x": -445.542499036064,
            "y": 109.50161588548127,
            "z": -190,
            "px": -445.542499036064,
            "py": 109.50161588548127,
            "pz": -190
          }
        ],
        [
          {
            "x": -450.63779567797434,
            "y": 102.79951837173289,
            "z": -139,
            "px": -450.63779567797434,
            "py": 102.79951837173289,
            "pz": -139
          },
          {
            "x": -450.63779567797434,
            "y": 102.79951837173289,
            "z": -145.375,
            "px": -450.63779567797434,
            "py": 102.79951837173289,
            "pz": -145.375
          },
          {
            "x": -450.63779567797434,
            "y": 102.79951837173289,
            "z": -151.75,
            "px": -450.63779567797434,
            "py": 102.79951837173289,
            "pz": -151.75
          },
          {
            "x": -450.63779567797434,
            "y": 102.79951837173289,
            "z": -158.125,
            "px": -450.63779567797434,
            "py": 102.79951837173289,
            "pz": -158.125
          },
          {
            "x": -450.63779567797434,
            "y": 102.79951837173289,
            "z": -164.5,
            "px": -450.63779567797434,
            "py": 102.79951837173289,
            "pz": -164.5
          },
          {
            "x": -450.63779567797434,
            "y": 102.79951837173289,
            "z": -170.875,
            "px": -450.63779567797434,
            "py": 102.79951837173289,
            "pz": -170.875
          },
          {
            "x": -450.63779567797434,
            "y": 102.79951837173289,
            "z": -177.25,
            "px": -450.63779567797434,
            "py": 102.79951837173289,
            "pz": -177.25
          },
          {
            "x": -450.63779567797434,
            "y": 102.79951837173289,
            "z": -183.625,
            "px": -450.63779567797434,
            "py": 102.79951837173289,
            "pz": -183.625
          },
          {
            "x": -450.63779567797434,
            "y": 102.79951837173289,
            "z": -190,
            "px": -450.63779567797434,
            "py": 102.79951837173289,
            "pz": -190
          }
        ],
        [
          {
            "x": -449.50161588548127,
            "y": 94.45750096393604,
            "z": -139,
            "px": -449.50161588548127,
            "py": 94.45750096393604,
            "pz": -139
          },
          {
            "x": -449.50161588548127,
            "y": 94.45750096393604,
            "z": -145.375,
            "px": -449.50161588548127,
            "py": 94.45750096393604,
            "pz": -145.375
          },
          {
            "x": -449.50161588548127,
            "y": 94.45750096393604,
            "z": -151.75,
            "px": -449.50161588548127,
            "py": 94.45750096393604,
            "pz": -151.75
          },
          {
            "x": -449.50161588548127,
            "y": 94.45750096393604,
            "z": -158.125,
            "px": -449.50161588548127,
            "py": 94.45750096393604,
            "pz": -158.125
          },
          {
            "x": -449.50161588548127,
            "y": 94.45750096393604,
            "z": -164.5,
            "px": -449.50161588548127,
            "py": 94.45750096393604,
            "pz": -164.5
          },
          {
            "x": -449.50161588548127,
            "y": 94.45750096393604,
            "z": -170.875,
            "px": -449.50161588548127,
            "py": 94.45750096393604,
            "pz": -170.875
          },
          {
            "x": -449.50161588548127,
            "y": 94.45750096393604,
            "z": -177.25,
            "px": -449.50161588548127,
            "py": 94.45750096393604,
            "pz": -177.25
          },
          {
            "x": -449.50161588548127,
            "y": 94.45750096393604,
            "z": -183.625,
            "px": -449.50161588548127,
            "py": 94.45750096393604,
            "pz": -183.625
          },
          {
            "x": -449.50161588548127,
            "y": 94.45750096393604,
            "z": -190,
            "px": -449.50161588548127,
            "py": 94.45750096393604,
            "pz": -190
          }
        ],
        [
          {
            "x": -442.7995183717329,
            "y": 89.36220432202563,
            "z": -139,
            "px": -442.7995183717329,
            "py": 89.36220432202563,
            "pz": -139
          },
          {
            "x": -442.7995183717329,
            "y": 89.36220432202563,
            "z": -145.375,
            "px": -442.7995183717329,
            "py": 89.36220432202563,
            "pz": -145.375
          },
          {
            "x": -442.7995183717329,
            "y": 89.36220432202563,
            "z": -151.75,
            "px": -442.7995183717329,
            "py": 89.36220432202563,
            "pz": -151.75
          },
          {
            "x": -442.7995183717329,
            "y": 89.36220432202563,
            "z": -158.125,
            "px": -442.7995183717329,
            "py": 89.36220432202563,
            "pz": -158.125
          },
          {
            "x": -442.7995183717329,
            "y": 89.36220432202563,
            "z": -164.5,
            "px": -442.7995183717329,
            "py": 89.36220432202563,
            "pz": -164.5
          },
          {
            "x": -442.7995183717329,
            "y": 89.36220432202563,
            "z": -170.875,
            "px": -442.7995183717329,
            "py": 89.36220432202563,
            "pz": -170.875
          },
          {
            "x": -442.7995183717329,
            "y": 89.36220432202563,
            "z": -177.25,
            "px": -442.7995183717329,
            "py": 89.36220432202563,
            "pz": -177.25
          },
          {
            "x": -442.7995183717329,
            "y": 89.36220432202563,
            "z": -183.625,
            "px": -442.7995183717329,
            "py": 89.36220432202563,
            "pz": -183.625
          },
          {
            "x": -442.7995183717329,
            "y": 89.36220432202563,
            "z": -190,
            "px": -442.7995183717329,
            "py": 89.36220432202563,
            "pz": -190
          }
        ],
        [
          {
            "x": -434.457500963936,
            "y": 90.49838411451873,
            "z": -139,
            "px": -434.457500963936,
            "py": 90.49838411451873,
            "pz": -139
          },
          {
            "x": -434.457500963936,
            "y": 90.49838411451873,
            "z": -145.375,
            "px": -434.457500963936,
            "py": 90.49838411451873,
            "pz": -145.375
          },
          {
            "x": -434.457500963936,
            "y": 90.49838411451873,
            "z": -151.75,
            "px": -434.457500963936,
            "py": 90.49838411451873,
            "pz": -151.75
          },
          {
            "x": -434.457500963936,
            "y": 90.49838411451873,
            "z": -158.125,
            "px": -434.457500963936,
            "py": 90.49838411451873,
            "pz": -158.125
          },
          {
            "x": -434.457500963936,
            "y": 90.49838411451873,
            "z": -164.5,
            "px": -434.457500963936,
            "py": 90.49838411451873,
            "pz": -164.5
          },
          {
            "x": -434.457500963936,
            "y": 90.49838411451873,
            "z": -170.875,
            "px": -434.457500963936,
            "py": 90.49838411451873,
            "pz": -170.875
          },
          {
            "x": -434.457500963936,
            "y": 90.49838411451873,
            "z": -177.25,
            "px": -434.457500963936,
            "py": 90.49838411451873,
            "pz": -177.25
          },
          {
            "x": -434.457500963936,
            "y": 90.49838411451873,
            "z": -183.625,
            "px": -434.457500963936,
            "py": 90.49838411451873,
            "pz": -183.625
          },
          {
            "x": -434.457500963936,
            "y": 90.49838411451873,
            "z": -190,
            "px": -434.457500963936,
            "py": 90.49838411451873,
            "pz": -190
          }
        ],
        [
          {
            "x": -429.36220432202566,
            "y": 97.2004816282671,
            "z": -139,
            "px": -429.36220432202566,
            "py": 97.2004816282671,
            "pz": -139
          },
          {
            "x": -429.36220432202566,
            "y": 97.2004816282671,
            "z": -145.375,
            "px": -429.36220432202566,
            "py": 97.2004816282671,
            "pz": -145.375
          },
          {
            "x": -429.36220432202566,
            "y": 97.2004816282671,
            "z": -151.75,
            "px": -429.36220432202566,
            "py": 97.2004816282671,
            "pz": -151.75
          },
          {
            "x": -429.36220432202566,
            "y": 97.2004816282671,
            "z": -158.125,
            "px": -429.36220432202566,
            "py": 97.2004816282671,
            "pz": -158.125
          },
          {
            "x": -429.36220432202566,
            "y": 97.2004816282671,
            "z": -164.5,
            "px": -429.36220432202566,
            "py": 97.2004816282671,
            "pz": -164.5
          },
          {
            "x": -429.36220432202566,
            "y": 97.2004816282671,
            "z": -170.875,
            "px": -429.36220432202566,
            "py": 97.2004816282671,
            "pz": -170.875
          },
          {
            "x": -429.36220432202566,
            "y": 97.2004816282671,
            "z": -177.25,
            "px": -429.36220432202566,
            "py": 97.2004816282671,
            "pz": -177.25
          },
          {
            "x": -429.36220432202566,
            "y": 97.2004816282671,
            "z": -183.625,
            "px": -429.36220432202566,
            "py": 97.2004816282671,
            "pz": -183.625
          },
          {
            "x": -429.36220432202566,
            "y": 97.2004816282671,
            "z": -190,
            "px": -429.36220432202566,
            "py": 97.2004816282671,
            "pz": -190
          }
        ]
      ]
    },
    {
      "id": "arctic-squid-2",
      "x": -1350,
      "y": 600,
      "z": -145,
      "px": -1350,
      "py": 600,
      "pz": -145,
      "homeX": -1350,
      "homeY": 600,
      "homeZ": -145,
      "heading": 0.6106247580350195,
      "seed": 3481,
      "headRadius": 15,
      "lengthMeters": 3,
      "tentacles": [
        [
          {
            "x": -1340.9878105020784,
            "y": 606.3071737294572,
            "z": -154,
            "px": -1340.9878105020784,
            "py": 606.3071737294572,
            "pz": -154
          },
          {
            "x": -1340.9878105020784,
            "y": 606.3071737294572,
            "z": -160.375,
            "px": -1340.9878105020784,
            "py": 606.3071737294572,
            "pz": -160.375
          },
          {
            "x": -1340.9878105020784,
            "y": 606.3071737294572,
            "z": -166.75,
            "px": -1340.9878105020784,
            "py": 606.3071737294572,
            "pz": -166.75
          },
          {
            "x": -1340.9878105020784,
            "y": 606.3071737294572,
            "z": -173.125,
            "px": -1340.9878105020784,
            "py": 606.3071737294572,
            "pz": -173.125
          },
          {
            "x": -1340.9878105020784,
            "y": 606.3071737294572,
            "z": -179.5,
            "px": -1340.9878105020784,
            "py": 606.3071737294572,
            "pz": -179.5
          },
          {
            "x": -1340.9878105020784,
            "y": 606.3071737294572,
            "z": -185.875,
            "px": -1340.9878105020784,
            "py": 606.3071737294572,
            "pz": -185.875
          },
          {
            "x": -1340.9878105020784,
            "y": 606.3071737294572,
            "z": -192.25,
            "px": -1340.9878105020784,
            "py": 606.3071737294572,
            "pz": -192.25
          },
          {
            "x": -1340.9878105020784,
            "y": 606.3071737294572,
            "z": -198.625,
            "px": -1340.9878105020784,
            "py": 606.3071737294572,
            "pz": -198.625
          },
          {
            "x": -1340.9878105020784,
            "y": 606.3071737294572,
            "z": -205,
            "px": -1340.9878105020784,
            "py": 606.3071737294572,
            "pz": -205
          }
        ],
        [
          {
            "x": -1348.0872650069023,
            "y": 610.8324256215392,
            "z": -154,
            "px": -1348.0872650069023,
            "py": 610.8324256215392,
            "pz": -154
          },
          {
            "x": -1348.0872650069023,
            "y": 610.8324256215392,
            "z": -160.375,
            "px": -1348.0872650069023,
            "py": 610.8324256215392,
            "pz": -160.375
          },
          {
            "x": -1348.0872650069023,
            "y": 610.8324256215392,
            "z": -166.75,
            "px": -1348.0872650069023,
            "py": 610.8324256215392,
            "pz": -166.75
          },
          {
            "x": -1348.0872650069023,
            "y": 610.8324256215392,
            "z": -173.125,
            "px": -1348.0872650069023,
            "py": 610.8324256215392,
            "pz": -173.125
          },
          {
            "x": -1348.0872650069023,
            "y": 610.8324256215392,
            "z": -179.5,
            "px": -1348.0872650069023,
            "py": 610.8324256215392,
            "pz": -179.5
          },
          {
            "x": -1348.0872650069023,
            "y": 610.8324256215392,
            "z": -185.875,
            "px": -1348.0872650069023,
            "py": 610.8324256215392,
            "pz": -185.875
          },
          {
            "x": -1348.0872650069023,
            "y": 610.8324256215392,
            "z": -192.25,
            "px": -1348.0872650069023,
            "py": 610.8324256215392,
            "pz": -192.25
          },
          {
            "x": -1348.0872650069023,
            "y": 610.8324256215392,
            "z": -198.625,
            "px": -1348.0872650069023,
            "py": 610.8324256215392,
            "pz": -198.625
          },
          {
            "x": -1348.0872650069023,
            "y": 610.8324256215392,
            "z": -205,
            "px": -1348.0872650069023,
            "py": 610.8324256215392,
            "pz": -205
          }
        ],
        [
          {
            "x": -1356.3071737294572,
            "y": 609.0121894979214,
            "z": -154,
            "px": -1356.3071737294572,
            "py": 609.0121894979214,
            "pz": -154
          },
          {
            "x": -1356.3071737294572,
            "y": 609.0121894979214,
            "z": -160.375,
            "px": -1356.3071737294572,
            "py": 609.0121894979214,
            "pz": -160.375
          },
          {
            "x": -1356.3071737294572,
            "y": 609.0121894979214,
            "z": -166.75,
            "px": -1356.3071737294572,
            "py": 609.0121894979214,
            "pz": -166.75
          },
          {
            "x": -1356.3071737294572,
            "y": 609.0121894979214,
            "z": -173.125,
            "px": -1356.3071737294572,
            "py": 609.0121894979214,
            "pz": -173.125
          },
          {
            "x": -1356.3071737294572,
            "y": 609.0121894979214,
            "z": -179.5,
            "px": -1356.3071737294572,
            "py": 609.0121894979214,
            "pz": -179.5
          },
          {
            "x": -1356.3071737294572,
            "y": 609.0121894979214,
            "z": -185.875,
            "px": -1356.3071737294572,
            "py": 609.0121894979214,
            "pz": -185.875
          },
          {
            "x": -1356.3071737294572,
            "y": 609.0121894979214,
            "z": -192.25,
            "px": -1356.3071737294572,
            "py": 609.0121894979214,
            "pz": -192.25
          },
          {
            "x": -1356.3071737294572,
            "y": 609.0121894979214,
            "z": -198.625,
            "px": -1356.3071737294572,
            "py": 609.0121894979214,
            "pz": -198.625
          },
          {
            "x": -1356.3071737294572,
            "y": 609.0121894979214,
            "z": -205,
            "px": -1356.3071737294572,
            "py": 609.0121894979214,
            "pz": -205
          }
        ],
        [
          {
            "x": -1360.8324256215392,
            "y": 601.9127349930976,
            "z": -154,
            "px": -1360.8324256215392,
            "py": 601.9127349930976,
            "pz": -154
          },
          {
            "x": -1360.8324256215392,
            "y": 601.9127349930976,
            "z": -160.375,
            "px": -1360.8324256215392,
            "py": 601.9127349930976,
            "pz": -160.375
          },
          {
            "x": -1360.8324256215392,
            "y": 601.9127349930976,
            "z": -166.75,
            "px": -1360.8324256215392,
            "py": 601.9127349930976,
            "pz": -166.75
          },
          {
            "x": -1360.8324256215392,
            "y": 601.9127349930976,
            "z": -173.125,
            "px": -1360.8324256215392,
            "py": 601.9127349930976,
            "pz": -173.125
          },
          {
            "x": -1360.8324256215392,
            "y": 601.9127349930976,
            "z": -179.5,
            "px": -1360.8324256215392,
            "py": 601.9127349930976,
            "pz": -179.5
          },
          {
            "x": -1360.8324256215392,
            "y": 601.9127349930976,
            "z": -185.875,
            "px": -1360.8324256215392,
            "py": 601.9127349930976,
            "pz": -185.875
          },
          {
            "x": -1360.8324256215392,
            "y": 601.9127349930976,
            "z": -192.25,
            "px": -1360.8324256215392,
            "py": 601.9127349930976,
            "pz": -192.25
          },
          {
            "x": -1360.8324256215392,
            "y": 601.9127349930976,
            "z": -198.625,
            "px": -1360.8324256215392,
            "py": 601.9127349930976,
            "pz": -198.625
          },
          {
            "x": -1360.8324256215392,
            "y": 601.9127349930976,
            "z": -205,
            "px": -1360.8324256215392,
            "py": 601.9127349930976,
            "pz": -205
          }
        ],
        [
          {
            "x": -1359.0121894979216,
            "y": 593.6928262705428,
            "z": -154,
            "px": -1359.0121894979216,
            "py": 593.6928262705428,
            "pz": -154
          },
          {
            "x": -1359.0121894979216,
            "y": 593.6928262705428,
            "z": -160.375,
            "px": -1359.0121894979216,
            "py": 593.6928262705428,
            "pz": -160.375
          },
          {
            "x": -1359.0121894979216,
            "y": 593.6928262705428,
            "z": -166.75,
            "px": -1359.0121894979216,
            "py": 593.6928262705428,
            "pz": -166.75
          },
          {
            "x": -1359.0121894979216,
            "y": 593.6928262705428,
            "z": -173.125,
            "px": -1359.0121894979216,
            "py": 593.6928262705428,
            "pz": -173.125
          },
          {
            "x": -1359.0121894979216,
            "y": 593.6928262705428,
            "z": -179.5,
            "px": -1359.0121894979216,
            "py": 593.6928262705428,
            "pz": -179.5
          },
          {
            "x": -1359.0121894979216,
            "y": 593.6928262705428,
            "z": -185.875,
            "px": -1359.0121894979216,
            "py": 593.6928262705428,
            "pz": -185.875
          },
          {
            "x": -1359.0121894979216,
            "y": 593.6928262705428,
            "z": -192.25,
            "px": -1359.0121894979216,
            "py": 593.6928262705428,
            "pz": -192.25
          },
          {
            "x": -1359.0121894979216,
            "y": 593.6928262705428,
            "z": -198.625,
            "px": -1359.0121894979216,
            "py": 593.6928262705428,
            "pz": -198.625
          },
          {
            "x": -1359.0121894979216,
            "y": 593.6928262705428,
            "z": -205,
            "px": -1359.0121894979216,
            "py": 593.6928262705428,
            "pz": -205
          }
        ],
        [
          {
            "x": -1351.9127349930977,
            "y": 589.1675743784608,
            "z": -154,
            "px": -1351.9127349930977,
            "py": 589.1675743784608,
            "pz": -154
          },
          {
            "x": -1351.9127349930977,
            "y": 589.1675743784608,
            "z": -160.375,
            "px": -1351.9127349930977,
            "py": 589.1675743784608,
            "pz": -160.375
          },
          {
            "x": -1351.9127349930977,
            "y": 589.1675743784608,
            "z": -166.75,
            "px": -1351.9127349930977,
            "py": 589.1675743784608,
            "pz": -166.75
          },
          {
            "x": -1351.9127349930977,
            "y": 589.1675743784608,
            "z": -173.125,
            "px": -1351.9127349930977,
            "py": 589.1675743784608,
            "pz": -173.125
          },
          {
            "x": -1351.9127349930977,
            "y": 589.1675743784608,
            "z": -179.5,
            "px": -1351.9127349930977,
            "py": 589.1675743784608,
            "pz": -179.5
          },
          {
            "x": -1351.9127349930977,
            "y": 589.1675743784608,
            "z": -185.875,
            "px": -1351.9127349930977,
            "py": 589.1675743784608,
            "pz": -185.875
          },
          {
            "x": -1351.9127349930977,
            "y": 589.1675743784608,
            "z": -192.25,
            "px": -1351.9127349930977,
            "py": 589.1675743784608,
            "pz": -192.25
          },
          {
            "x": -1351.9127349930977,
            "y": 589.1675743784608,
            "z": -198.625,
            "px": -1351.9127349930977,
            "py": 589.1675743784608,
            "pz": -198.625
          },
          {
            "x": -1351.9127349930977,
            "y": 589.1675743784608,
            "z": -205,
            "px": -1351.9127349930977,
            "py": 589.1675743784608,
            "pz": -205
          }
        ],
        [
          {
            "x": -1343.6928262705428,
            "y": 590.9878105020786,
            "z": -154,
            "px": -1343.6928262705428,
            "py": 590.9878105020786,
            "pz": -154
          },
          {
            "x": -1343.6928262705428,
            "y": 590.9878105020786,
            "z": -160.375,
            "px": -1343.6928262705428,
            "py": 590.9878105020786,
            "pz": -160.375
          },
          {
            "x": -1343.6928262705428,
            "y": 590.9878105020786,
            "z": -166.75,
            "px": -1343.6928262705428,
            "py": 590.9878105020786,
            "pz": -166.75
          },
          {
            "x": -1343.6928262705428,
            "y": 590.9878105020786,
            "z": -173.125,
            "px": -1343.6928262705428,
            "py": 590.9878105020786,
            "pz": -173.125
          },
          {
            "x": -1343.6928262705428,
            "y": 590.9878105020786,
            "z": -179.5,
            "px": -1343.6928262705428,
            "py": 590.9878105020786,
            "pz": -179.5
          },
          {
            "x": -1343.6928262705428,
            "y": 590.9878105020786,
            "z": -185.875,
            "px": -1343.6928262705428,
            "py": 590.9878105020786,
            "pz": -185.875
          },
          {
            "x": -1343.6928262705428,
            "y": 590.9878105020786,
            "z": -192.25,
            "px": -1343.6928262705428,
            "py": 590.9878105020786,
            "pz": -192.25
          },
          {
            "x": -1343.6928262705428,
            "y": 590.9878105020786,
            "z": -198.625,
            "px": -1343.6928262705428,
            "py": 590.9878105020786,
            "pz": -198.625
          },
          {
            "x": -1343.6928262705428,
            "y": 590.9878105020786,
            "z": -205,
            "px": -1343.6928262705428,
            "py": 590.9878105020786,
            "pz": -205
          }
        ],
        [
          {
            "x": -1339.1675743784608,
            "y": 598.0872650069024,
            "z": -154,
            "px": -1339.1675743784608,
            "py": 598.0872650069024,
            "pz": -154
          },
          {
            "x": -1339.1675743784608,
            "y": 598.0872650069024,
            "z": -160.375,
            "px": -1339.1675743784608,
            "py": 598.0872650069024,
            "pz": -160.375
          },
          {
            "x": -1339.1675743784608,
            "y": 598.0872650069024,
            "z": -166.75,
            "px": -1339.1675743784608,
            "py": 598.0872650069024,
            "pz": -166.75
          },
          {
            "x": -1339.1675743784608,
            "y": 598.0872650069024,
            "z": -173.125,
            "px": -1339.1675743784608,
            "py": 598.0872650069024,
            "pz": -173.125
          },
          {
            "x": -1339.1675743784608,
            "y": 598.0872650069024,
            "z": -179.5,
            "px": -1339.1675743784608,
            "py": 598.0872650069024,
            "pz": -179.5
          },
          {
            "x": -1339.1675743784608,
            "y": 598.0872650069024,
            "z": -185.875,
            "px": -1339.1675743784608,
            "py": 598.0872650069024,
            "pz": -185.875
          },
          {
            "x": -1339.1675743784608,
            "y": 598.0872650069024,
            "z": -192.25,
            "px": -1339.1675743784608,
            "py": 598.0872650069024,
            "pz": -192.25
          },
          {
            "x": -1339.1675743784608,
            "y": 598.0872650069024,
            "z": -198.625,
            "px": -1339.1675743784608,
            "py": 598.0872650069024,
            "pz": -198.625
          },
          {
            "x": -1339.1675743784608,
            "y": 598.0872650069024,
            "z": -205,
            "px": -1339.1675743784608,
            "py": 598.0872650069024,
            "pz": -205
          }
        ]
      ]
    },
    {
      "id": "arctic-squid-3",
      "x": 650,
      "y": -1050,
      "z": -130,
      "px": 650,
      "py": -1050,
      "pz": -130,
      "homeX": 650,
      "homeY": -1050,
      "homeZ": -130,
      "heading": 2.962321269599929,
      "seed": 6304,
      "headRadius": 15,
      "lengthMeters": 3,
      "tentacles": [
        [
          {
            "x": 639.1762873701823,
            "y": -1048.0385605012837,
            "z": -139,
            "px": 639.1762873701823,
            "py": -1048.0385605012837,
            "pz": -139
          },
          {
            "x": 639.1762873701823,
            "y": -1048.0385605012837,
            "z": -145.375,
            "px": 639.1762873701823,
            "py": -1048.0385605012837,
            "pz": -145.375
          },
          {
            "x": 639.1762873701823,
            "y": -1048.0385605012837,
            "z": -151.75,
            "px": 639.1762873701823,
            "py": -1048.0385605012837,
            "pz": -151.75
          },
          {
            "x": 639.1762873701823,
            "y": -1048.0385605012837,
            "z": -158.125,
            "px": 639.1762873701823,
            "py": -1048.0385605012837,
            "pz": -158.125
          },
          {
            "x": 639.1762873701823,
            "y": -1048.0385605012837,
            "z": -164.5,
            "px": 639.1762873701823,
            "py": -1048.0385605012837,
            "pz": -164.5
          },
          {
            "x": 639.1762873701823,
            "y": -1048.0385605012837,
            "z": -170.875,
            "px": 639.1762873701823,
            "py": -1048.0385605012837,
            "pz": -170.875
          },
          {
            "x": 639.1762873701823,
            "y": -1048.0385605012837,
            "z": -177.25,
            "px": 639.1762873701823,
            "py": -1048.0385605012837,
            "pz": -177.25
          },
          {
            "x": 639.1762873701823,
            "y": -1048.0385605012837,
            "z": -183.625,
            "px": 639.1762873701823,
            "py": -1048.0385605012837,
            "pz": -183.625
          },
          {
            "x": 639.1762873701823,
            "y": -1048.0385605012837,
            "z": -190,
            "px": 639.1762873701823,
            "py": -1048.0385605012837,
            "pz": -190
          }
        ],
        [
          {
            "x": 640.9595322314119,
            "y": -1056.266573427729,
            "z": -139,
            "px": 640.9595322314119,
            "py": -1056.266573427729,
            "pz": -139
          },
          {
            "x": 640.9595322314119,
            "y": -1056.266573427729,
            "z": -145.375,
            "px": 640.9595322314119,
            "py": -1056.266573427729,
            "pz": -145.375
          },
          {
            "x": 640.9595322314119,
            "y": -1056.266573427729,
            "z": -151.75,
            "px": 640.9595322314119,
            "py": -1056.266573427729,
            "pz": -151.75
          },
          {
            "x": 640.9595322314119,
            "y": -1056.266573427729,
            "z": -158.125,
            "px": 640.9595322314119,
            "py": -1056.266573427729,
            "pz": -158.125
          },
          {
            "x": 640.9595322314119,
            "y": -1056.266573427729,
            "z": -164.5,
            "px": 640.9595322314119,
            "py": -1056.266573427729,
            "pz": -164.5
          },
          {
            "x": 640.9595322314119,
            "y": -1056.266573427729,
            "z": -170.875,
            "px": 640.9595322314119,
            "py": -1056.266573427729,
            "pz": -170.875
          },
          {
            "x": 640.9595322314119,
            "y": -1056.266573427729,
            "z": -177.25,
            "px": 640.9595322314119,
            "py": -1056.266573427729,
            "pz": -177.25
          },
          {
            "x": 640.9595322314119,
            "y": -1056.266573427729,
            "z": -183.625,
            "px": 640.9595322314119,
            "py": -1056.266573427729,
            "pz": -183.625
          },
          {
            "x": 640.9595322314119,
            "y": -1056.266573427729,
            "z": -190,
            "px": 640.9595322314119,
            "py": -1056.266573427729,
            "pz": -190
          }
        ],
        [
          {
            "x": 648.0385605012837,
            "y": -1060.8237126298177,
            "z": -139,
            "px": 648.0385605012837,
            "py": -1060.8237126298177,
            "pz": -139
          },
          {
            "x": 648.0385605012837,
            "y": -1060.8237126298177,
            "z": -145.375,
            "px": 648.0385605012837,
            "py": -1060.8237126298177,
            "pz": -145.375
          },
          {
            "x": 648.0385605012837,
            "y": -1060.8237126298177,
            "z": -151.75,
            "px": 648.0385605012837,
            "py": -1060.8237126298177,
            "pz": -151.75
          },
          {
            "x": 648.0385605012837,
            "y": -1060.8237126298177,
            "z": -158.125,
            "px": 648.0385605012837,
            "py": -1060.8237126298177,
            "pz": -158.125
          },
          {
            "x": 648.0385605012837,
            "y": -1060.8237126298177,
            "z": -164.5,
            "px": 648.0385605012837,
            "py": -1060.8237126298177,
            "pz": -164.5
          },
          {
            "x": 648.0385605012837,
            "y": -1060.8237126298177,
            "z": -170.875,
            "px": 648.0385605012837,
            "py": -1060.8237126298177,
            "pz": -170.875
          },
          {
            "x": 648.0385605012837,
            "y": -1060.8237126298177,
            "z": -177.25,
            "px": 648.0385605012837,
            "py": -1060.8237126298177,
            "pz": -177.25
          },
          {
            "x": 648.0385605012837,
            "y": -1060.8237126298177,
            "z": -183.625,
            "px": 648.0385605012837,
            "py": -1060.8237126298177,
            "pz": -183.625
          },
          {
            "x": 648.0385605012837,
            "y": -1060.8237126298177,
            "z": -190,
            "px": 648.0385605012837,
            "py": -1060.8237126298177,
            "pz": -190
          }
        ],
        [
          {
            "x": 656.2665734277291,
            "y": -1059.040467768588,
            "z": -139,
            "px": 656.2665734277291,
            "py": -1059.040467768588,
            "pz": -139
          },
          {
            "x": 656.2665734277291,
            "y": -1059.040467768588,
            "z": -145.375,
            "px": 656.2665734277291,
            "py": -1059.040467768588,
            "pz": -145.375
          },
          {
            "x": 656.2665734277291,
            "y": -1059.040467768588,
            "z": -151.75,
            "px": 656.2665734277291,
            "py": -1059.040467768588,
            "pz": -151.75
          },
          {
            "x": 656.2665734277291,
            "y": -1059.040467768588,
            "z": -158.125,
            "px": 656.2665734277291,
            "py": -1059.040467768588,
            "pz": -158.125
          },
          {
            "x": 656.2665734277291,
            "y": -1059.040467768588,
            "z": -164.5,
            "px": 656.2665734277291,
            "py": -1059.040467768588,
            "pz": -164.5
          },
          {
            "x": 656.2665734277291,
            "y": -1059.040467768588,
            "z": -170.875,
            "px": 656.2665734277291,
            "py": -1059.040467768588,
            "pz": -170.875
          },
          {
            "x": 656.2665734277291,
            "y": -1059.040467768588,
            "z": -177.25,
            "px": 656.2665734277291,
            "py": -1059.040467768588,
            "pz": -177.25
          },
          {
            "x": 656.2665734277291,
            "y": -1059.040467768588,
            "z": -183.625,
            "px": 656.2665734277291,
            "py": -1059.040467768588,
            "pz": -183.625
          },
          {
            "x": 656.2665734277291,
            "y": -1059.040467768588,
            "z": -190,
            "px": 656.2665734277291,
            "py": -1059.040467768588,
            "pz": -190
          }
        ],
        [
          {
            "x": 660.8237126298177,
            "y": -1051.9614394987163,
            "z": -139,
            "px": 660.8237126298177,
            "py": -1051.9614394987163,
            "pz": -139
          },
          {
            "x": 660.8237126298177,
            "y": -1051.9614394987163,
            "z": -145.375,
            "px": 660.8237126298177,
            "py": -1051.9614394987163,
            "pz": -145.375
          },
          {
            "x": 660.8237126298177,
            "y": -1051.9614394987163,
            "z": -151.75,
            "px": 660.8237126298177,
            "py": -1051.9614394987163,
            "pz": -151.75
          },
          {
            "x": 660.8237126298177,
            "y": -1051.9614394987163,
            "z": -158.125,
            "px": 660.8237126298177,
            "py": -1051.9614394987163,
            "pz": -158.125
          },
          {
            "x": 660.8237126298177,
            "y": -1051.9614394987163,
            "z": -164.5,
            "px": 660.8237126298177,
            "py": -1051.9614394987163,
            "pz": -164.5
          },
          {
            "x": 660.8237126298177,
            "y": -1051.9614394987163,
            "z": -170.875,
            "px": 660.8237126298177,
            "py": -1051.9614394987163,
            "pz": -170.875
          },
          {
            "x": 660.8237126298177,
            "y": -1051.9614394987163,
            "z": -177.25,
            "px": 660.8237126298177,
            "py": -1051.9614394987163,
            "pz": -177.25
          },
          {
            "x": 660.8237126298177,
            "y": -1051.9614394987163,
            "z": -183.625,
            "px": 660.8237126298177,
            "py": -1051.9614394987163,
            "pz": -183.625
          },
          {
            "x": 660.8237126298177,
            "y": -1051.9614394987163,
            "z": -190,
            "px": 660.8237126298177,
            "py": -1051.9614394987163,
            "pz": -190
          }
        ],
        [
          {
            "x": 659.0404677685881,
            "y": -1043.733426572271,
            "z": -139,
            "px": 659.0404677685881,
            "py": -1043.733426572271,
            "pz": -139
          },
          {
            "x": 659.0404677685881,
            "y": -1043.733426572271,
            "z": -145.375,
            "px": 659.0404677685881,
            "py": -1043.733426572271,
            "pz": -145.375
          },
          {
            "x": 659.0404677685881,
            "y": -1043.733426572271,
            "z": -151.75,
            "px": 659.0404677685881,
            "py": -1043.733426572271,
            "pz": -151.75
          },
          {
            "x": 659.0404677685881,
            "y": -1043.733426572271,
            "z": -158.125,
            "px": 659.0404677685881,
            "py": -1043.733426572271,
            "pz": -158.125
          },
          {
            "x": 659.0404677685881,
            "y": -1043.733426572271,
            "z": -164.5,
            "px": 659.0404677685881,
            "py": -1043.733426572271,
            "pz": -164.5
          },
          {
            "x": 659.0404677685881,
            "y": -1043.733426572271,
            "z": -170.875,
            "px": 659.0404677685881,
            "py": -1043.733426572271,
            "pz": -170.875
          },
          {
            "x": 659.0404677685881,
            "y": -1043.733426572271,
            "z": -177.25,
            "px": 659.0404677685881,
            "py": -1043.733426572271,
            "pz": -177.25
          },
          {
            "x": 659.0404677685881,
            "y": -1043.733426572271,
            "z": -183.625,
            "px": 659.0404677685881,
            "py": -1043.733426572271,
            "pz": -183.625
          },
          {
            "x": 659.0404677685881,
            "y": -1043.733426572271,
            "z": -190,
            "px": 659.0404677685881,
            "py": -1043.733426572271,
            "pz": -190
          }
        ],
        [
          {
            "x": 651.9614394987163,
            "y": -1039.1762873701823,
            "z": -139,
            "px": 651.9614394987163,
            "py": -1039.1762873701823,
            "pz": -139
          },
          {
            "x": 651.9614394987163,
            "y": -1039.1762873701823,
            "z": -145.375,
            "px": 651.9614394987163,
            "py": -1039.1762873701823,
            "pz": -145.375
          },
          {
            "x": 651.9614394987163,
            "y": -1039.1762873701823,
            "z": -151.75,
            "px": 651.9614394987163,
            "py": -1039.1762873701823,
            "pz": -151.75
          },
          {
            "x": 651.9614394987163,
            "y": -1039.1762873701823,
            "z": -158.125,
            "px": 651.9614394987163,
            "py": -1039.1762873701823,
            "pz": -158.125
          },
          {
            "x": 651.9614394987163,
            "y": -1039.1762873701823,
            "z": -164.5,
            "px": 651.9614394987163,
            "py": -1039.1762873701823,
            "pz": -164.5
          },
          {
            "x": 651.9614394987163,
            "y": -1039.1762873701823,
            "z": -170.875,
            "px": 651.9614394987163,
            "py": -1039.1762873701823,
            "pz": -170.875
          },
          {
            "x": 651.9614394987163,
            "y": -1039.1762873701823,
            "z": -177.25,
            "px": 651.9614394987163,
            "py": -1039.1762873701823,
            "pz": -177.25
          },
          {
            "x": 651.9614394987163,
            "y": -1039.1762873701823,
            "z": -183.625,
            "px": 651.9614394987163,
            "py": -1039.1762873701823,
            "pz": -183.625
          },
          {
            "x": 651.9614394987163,
            "y": -1039.1762873701823,
            "z": -190,
            "px": 651.9614394987163,
            "py": -1039.1762873701823,
            "pz": -190
          }
        ],
        [
          {
            "x": 643.7334265722709,
            "y": -1040.959532231412,
            "z": -139,
            "px": 643.7334265722709,
            "py": -1040.959532231412,
            "pz": -139
          },
          {
            "x": 643.7334265722709,
            "y": -1040.959532231412,
            "z": -145.375,
            "px": 643.7334265722709,
            "py": -1040.959532231412,
            "pz": -145.375
          },
          {
            "x": 643.7334265722709,
            "y": -1040.959532231412,
            "z": -151.75,
            "px": 643.7334265722709,
            "py": -1040.959532231412,
            "pz": -151.75
          },
          {
            "x": 643.7334265722709,
            "y": -1040.959532231412,
            "z": -158.125,
            "px": 643.7334265722709,
            "py": -1040.959532231412,
            "pz": -158.125
          },
          {
            "x": 643.7334265722709,
            "y": -1040.959532231412,
            "z": -164.5,
            "px": 643.7334265722709,
            "py": -1040.959532231412,
            "pz": -164.5
          },
          {
            "x": 643.7334265722709,
            "y": -1040.959532231412,
            "z": -170.875,
            "px": 643.7334265722709,
            "py": -1040.959532231412,
            "pz": -170.875
          },
          {
            "x": 643.7334265722709,
            "y": -1040.959532231412,
            "z": -177.25,
            "px": 643.7334265722709,
            "py": -1040.959532231412,
            "pz": -177.25
          },
          {
            "x": 643.7334265722709,
            "y": -1040.959532231412,
            "z": -183.625,
            "px": 643.7334265722709,
            "py": -1040.959532231412,
            "pz": -183.625
          },
          {
            "x": 643.7334265722709,
            "y": -1040.959532231412,
            "z": -190,
            "px": 643.7334265722709,
            "py": -1040.959532231412,
            "pz": -190
          }
        ]
      ]
    }
  ],
  "threat": {
    "active": false,
    "distance": Infinity,
    "message": ""
  },
  "biome": "arctic",
  "items": [
    {
      "id": "crash-log",
      "x": -5640,
      "y": -520,
      "z": 12,
      "kind": "wreck",
      "label": "Crash site",
      "collected": false
    },
    {
      "id": "glacier-heart",
      "x": 0,
      "y": 0,
      "z": -265,
      "kind": "glacier",
      "label": "Glacier underside",
      "collected": false
    },
    {
      "id": "seabed-signal",
      "x": 300,
      "y": 100,
      "z": -260,
      "kind": "seabed",
      "label": "Seabed signal",
      "collected": false
    }
  ],
  "ship": STARTER_WRECK_SITE,
  "beacons": [
    {
      "x": 440,
      "y": -30,
      "z": 13
    },
    {
      "x": -460,
      "y": 100,
      "z": 12
    },
    {
      "x": -30,
      "y": -440,
      "z": 13
    },
    {
      "x": -5320,
      "y": -600,
      "z": 40.53398953325237
    }
  ],
  "collected": 0,
  "complete": false,
  "elapsed": 0,
  "notice": "You survived the crash on Croba. Explore your wreck, avoid the giant ice centipede, and dive among the Red Root Crabs.",
  "noticeTime": 8,
  "respawns": 0,
  "lastJumpInput": false,
  "mapId": "croba-icebound-1",
  "spawn": {"x":-5620,"y":-450,"z":0,"heading":1.5707963267948966},
  "bestiary": {},
  "adultSquids": [
    {
      "id": "adult-crobonic-1",
      "designVersion": 2,
      "x": 3650,
      "y": -1500,
      "z": -850,
      "px": 3650,
      "py": -1500,
      "pz": -850,
      "homeX": 3650,
      "homeY": -1500,
      "homeZ": -850,
      "heading": 1.5707963267948966,
      "seed": 6019,
      "headRadius": 100,
      "lengthMeters": 30,
      "armLength": 605.5630601663429,
      "armRadius": 18,
      "clawLength": 24,
      "eyeScale": 0.62,
      "orientation": {
        "x": 0,
        "y": 0,
        "z": 0,
        "w": 1
      },
      "activeArm": null,
      "noticedPlayer": false,
      "surfaceGrips": [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "tentacles": [
        [
          {
            "x": 3563.670633989181,
            "y": -1418.5884408957297,
            "z": -884.8123372919752,
            "px": 3563.670633989181,
            "py": -1418.5884408957297,
            "pz": -884.8123372919752
          },
          {
            "x": 3520.8508593612114,
            "y": -1375.76866626776,
            "z": -930.2295668044509,
            "px": 3520.8508593612114,
            "py": -1375.76866626776,
            "pz": -930.2295668044509
          },
          {
            "x": 3496.764736132978,
            "y": -1351.682543039527,
            "z": -997.8277048752432,
            "px": 3496.764736132978,
            "py": -1351.682543039527,
            "pz": -997.8277048752432
          },
          {
            "x": 3496.764736132978,
            "y": -1351.682543039527,
            "z": -1073.523087396036,
            "px": 3496.764736132978,
            "py": -1351.682543039527,
            "pz": -1073.523087396036
          },
          {
            "x": 3496.764736132978,
            "y": -1351.682543039527,
            "z": -1149.2184699168288,
            "px": 3496.764736132978,
            "py": -1351.682543039527,
            "pz": -1149.2184699168288
          },
          {
            "x": 3496.764736132978,
            "y": -1351.682543039527,
            "z": -1224.9138524376217,
            "px": 3496.764736132978,
            "py": -1351.682543039527,
            "pz": -1224.9138524376217
          },
          {
            "x": 3496.764736132978,
            "y": -1351.682543039527,
            "z": -1300.6092349584146,
            "px": 3496.764736132978,
            "py": -1351.682543039527,
            "pz": -1300.6092349584146
          },
          {
            "x": 3496.764736132978,
            "y": -1351.682543039527,
            "z": -1376.3046174792075,
            "px": 3496.764736132978,
            "py": -1351.682543039527,
            "pz": -1376.3046174792075
          },
          {
            "x": 3496.764736132978,
            "y": -1351.682543039527,
            "z": -1452.0000000000005,
            "px": 3496.764736132978,
            "py": -1351.682543039527,
            "pz": -1452.0000000000005
          }
        ],
        [
          {
            "x": 3532,
            "y": -1474.9399537159159,
            "z": -881,
            "px": 3532,
            "py": -1474.9399537159159,
            "pz": -881
          },
          {
            "x": 3473.507100073869,
            "y": -1459.2668284177544,
            "z": -926.4172295124757,
            "px": 3473.507100073869,
            "py": -1459.2668284177544,
            "pz": -926.4172295124757
          },
          {
            "x": 3440.60484386542,
            "y": -1450.4506954375388,
            "z": -994.015367583268,
            "px": 3440.60484386542,
            "py": -1450.4506954375388,
            "pz": -994.015367583268
          },
          {
            "x": 3440.60484386542,
            "y": -1450.4506954375388,
            "z": -1069.710750104061,
            "px": 3440.60484386542,
            "py": -1450.4506954375388,
            "pz": -1069.710750104061
          },
          {
            "x": 3440.60484386542,
            "y": -1450.4506954375388,
            "z": -1145.4061326248539,
            "px": 3440.60484386542,
            "py": -1450.4506954375388,
            "pz": -1145.4061326248539
          },
          {
            "x": 3440.60484386542,
            "y": -1450.4506954375388,
            "z": -1221.1015151456465,
            "px": 3440.60484386542,
            "py": -1450.4506954375388,
            "pz": -1221.1015151456465
          },
          {
            "x": 3440.60484386542,
            "y": -1450.4506954375388,
            "z": -1296.7968976664395,
            "px": 3440.60484386542,
            "py": -1450.4506954375388,
            "pz": -1296.7968976664395
          },
          {
            "x": 3440.60484386542,
            "y": -1450.4506954375388,
            "z": -1372.4922801872322,
            "px": 3440.60484386542,
            "py": -1450.4506954375388,
            "pz": -1372.4922801872322
          },
          {
            "x": 3440.60484386542,
            "y": -1450.4506954375388,
            "z": -1448.187662708025,
            "px": 3440.60484386542,
            "py": -1450.4506954375388,
            "pz": -1448.187662708025
          }
        ],
        [
          {
            "x": 3532,
            "y": -1525.0600462840841,
            "z": -881,
            "px": 3532,
            "py": -1525.0600462840841,
            "pz": -881
          },
          {
            "x": 3473.507100073869,
            "y": -1540.7331715822456,
            "z": -926.4172295124757,
            "px": 3473.507100073869,
            "py": -1540.7331715822456,
            "pz": -926.4172295124757
          },
          {
            "x": 3440.60484386542,
            "y": -1549.5493045624612,
            "z": -994.015367583268,
            "px": 3440.60484386542,
            "py": -1549.5493045624612,
            "pz": -994.015367583268
          },
          {
            "x": 3440.60484386542,
            "y": -1549.5493045624612,
            "z": -1069.710750104061,
            "px": 3440.60484386542,
            "py": -1549.5493045624612,
            "pz": -1069.710750104061
          },
          {
            "x": 3440.60484386542,
            "y": -1549.5493045624612,
            "z": -1145.4061326248539,
            "px": 3440.60484386542,
            "py": -1549.5493045624612,
            "pz": -1145.4061326248539
          },
          {
            "x": 3440.60484386542,
            "y": -1549.5493045624612,
            "z": -1221.1015151456465,
            "px": 3440.60484386542,
            "py": -1549.5493045624612,
            "pz": -1221.1015151456465
          },
          {
            "x": 3440.60484386542,
            "y": -1549.5493045624612,
            "z": -1296.7968976664395,
            "px": 3440.60484386542,
            "py": -1549.5493045624612,
            "pz": -1296.7968976664395
          },
          {
            "x": 3440.60484386542,
            "y": -1549.5493045624612,
            "z": -1372.4922801872322,
            "px": 3440.60484386542,
            "py": -1549.5493045624612,
            "pz": -1372.4922801872322
          },
          {
            "x": 3440.60484386542,
            "y": -1549.5493045624612,
            "z": -1448.187662708025,
            "px": 3440.60484386542,
            "py": -1549.5493045624612,
            "pz": -1448.187662708025
          }
        ],
        [
          {
            "x": 3563.670633989181,
            "y": -1581.4115591042703,
            "z": -884.8123372919752,
            "px": 3563.670633989181,
            "py": -1581.4115591042703,
            "pz": -884.8123372919752
          },
          {
            "x": 3520.850859361211,
            "y": -1624.23133373224,
            "z": -930.2295668044509,
            "px": 3520.850859361211,
            "py": -1624.23133373224,
            "pz": -930.2295668044509
          },
          {
            "x": 3496.764736132978,
            "y": -1648.317456960473,
            "z": -997.8277048752432,
            "px": 3496.764736132978,
            "py": -1648.317456960473,
            "pz": -997.8277048752432
          },
          {
            "x": 3496.764736132978,
            "y": -1648.317456960473,
            "z": -1073.523087396036,
            "px": 3496.764736132978,
            "py": -1648.317456960473,
            "pz": -1073.523087396036
          },
          {
            "x": 3496.764736132978,
            "y": -1648.317456960473,
            "z": -1149.2184699168288,
            "px": 3496.764736132978,
            "py": -1648.317456960473,
            "pz": -1149.2184699168288
          },
          {
            "x": 3496.764736132978,
            "y": -1648.317456960473,
            "z": -1224.9138524376217,
            "px": 3496.764736132978,
            "py": -1648.317456960473,
            "pz": -1224.9138524376217
          },
          {
            "x": 3496.764736132978,
            "y": -1648.317456960473,
            "z": -1300.6092349584146,
            "px": 3496.764736132978,
            "py": -1648.317456960473,
            "pz": -1300.6092349584146
          },
          {
            "x": 3496.764736132978,
            "y": -1648.317456960473,
            "z": -1376.3046174792075,
            "px": 3496.764736132978,
            "py": -1648.317456960473,
            "pz": -1376.3046174792075
          },
          {
            "x": 3496.764736132978,
            "y": -1648.317456960473,
            "z": -1452.0000000000005,
            "px": 3496.764736132978,
            "py": -1648.317456960473,
            "pz": -1452.0000000000005
          }
        ],
        [
          {
            "x": 3736.329366010819,
            "y": -1581.4115591042703,
            "z": -884.8123372919752,
            "px": 3736.329366010819,
            "py": -1581.4115591042703,
            "pz": -884.8123372919752
          },
          {
            "x": 3779.1491406387886,
            "y": -1624.23133373224,
            "z": -930.2295668044509,
            "px": 3779.1491406387886,
            "py": -1624.23133373224,
            "pz": -930.2295668044509
          },
          {
            "x": 3803.235263867022,
            "y": -1648.317456960473,
            "z": -997.8277048752432,
            "px": 3803.235263867022,
            "py": -1648.317456960473,
            "pz": -997.8277048752432
          },
          {
            "x": 3803.235263867022,
            "y": -1648.317456960473,
            "z": -1073.523087396036,
            "px": 3803.235263867022,
            "py": -1648.317456960473,
            "pz": -1073.523087396036
          },
          {
            "x": 3803.235263867022,
            "y": -1648.317456960473,
            "z": -1149.2184699168288,
            "px": 3803.235263867022,
            "py": -1648.317456960473,
            "pz": -1149.2184699168288
          },
          {
            "x": 3803.235263867022,
            "y": -1648.317456960473,
            "z": -1224.9138524376217,
            "px": 3803.235263867022,
            "py": -1648.317456960473,
            "pz": -1224.9138524376217
          },
          {
            "x": 3803.235263867022,
            "y": -1648.317456960473,
            "z": -1300.6092349584146,
            "px": 3803.235263867022,
            "py": -1648.317456960473,
            "pz": -1300.6092349584146
          },
          {
            "x": 3803.235263867022,
            "y": -1648.317456960473,
            "z": -1376.3046174792075,
            "px": 3803.235263867022,
            "py": -1648.317456960473,
            "pz": -1376.3046174792075
          },
          {
            "x": 3803.235263867022,
            "y": -1648.317456960473,
            "z": -1452.0000000000005,
            "px": 3803.235263867022,
            "py": -1648.317456960473,
            "pz": -1452.0000000000005
          }
        ],
        [
          {
            "x": 3768,
            "y": -1525.0600462840841,
            "z": -881,
            "px": 3768,
            "py": -1525.0600462840841,
            "pz": -881
          },
          {
            "x": 3826.492899926131,
            "y": -1540.7331715822456,
            "z": -926.4172295124757,
            "px": 3826.492899926131,
            "py": -1540.7331715822456,
            "pz": -926.4172295124757
          },
          {
            "x": 3859.39515613458,
            "y": -1549.5493045624612,
            "z": -994.015367583268,
            "px": 3859.39515613458,
            "py": -1549.5493045624612,
            "pz": -994.015367583268
          },
          {
            "x": 3859.39515613458,
            "y": -1549.5493045624612,
            "z": -1069.710750104061,
            "px": 3859.39515613458,
            "py": -1549.5493045624612,
            "pz": -1069.710750104061
          },
          {
            "x": 3859.39515613458,
            "y": -1549.5493045624612,
            "z": -1145.4061326248539,
            "px": 3859.39515613458,
            "py": -1549.5493045624612,
            "pz": -1145.4061326248539
          },
          {
            "x": 3859.39515613458,
            "y": -1549.5493045624612,
            "z": -1221.1015151456465,
            "px": 3859.39515613458,
            "py": -1549.5493045624612,
            "pz": -1221.1015151456465
          },
          {
            "x": 3859.39515613458,
            "y": -1549.5493045624612,
            "z": -1296.7968976664395,
            "px": 3859.39515613458,
            "py": -1549.5493045624612,
            "pz": -1296.7968976664395
          },
          {
            "x": 3859.39515613458,
            "y": -1549.5493045624612,
            "z": -1372.4922801872322,
            "px": 3859.39515613458,
            "py": -1549.5493045624612,
            "pz": -1372.4922801872322
          },
          {
            "x": 3859.39515613458,
            "y": -1549.5493045624612,
            "z": -1448.187662708025,
            "px": 3859.39515613458,
            "py": -1549.5493045624612,
            "pz": -1448.187662708025
          }
        ],
        [
          {
            "x": 3768,
            "y": -1474.9399537159156,
            "z": -881,
            "px": 3768,
            "py": -1474.9399537159156,
            "pz": -881
          },
          {
            "x": 3826.492899926131,
            "y": -1459.2668284177544,
            "z": -926.4172295124757,
            "px": 3826.492899926131,
            "py": -1459.2668284177544,
            "pz": -926.4172295124757
          },
          {
            "x": 3859.39515613458,
            "y": -1450.4506954375386,
            "z": -994.015367583268,
            "px": 3859.39515613458,
            "py": -1450.4506954375386,
            "pz": -994.015367583268
          },
          {
            "x": 3859.39515613458,
            "y": -1450.4506954375386,
            "z": -1069.710750104061,
            "px": 3859.39515613458,
            "py": -1450.4506954375386,
            "pz": -1069.710750104061
          },
          {
            "x": 3859.39515613458,
            "y": -1450.4506954375386,
            "z": -1145.4061326248539,
            "px": 3859.39515613458,
            "py": -1450.4506954375386,
            "pz": -1145.4061326248539
          },
          {
            "x": 3859.39515613458,
            "y": -1450.4506954375386,
            "z": -1221.1015151456465,
            "px": 3859.39515613458,
            "py": -1450.4506954375386,
            "pz": -1221.1015151456465
          },
          {
            "x": 3859.39515613458,
            "y": -1450.4506954375386,
            "z": -1296.7968976664395,
            "px": 3859.39515613458,
            "py": -1450.4506954375386,
            "pz": -1296.7968976664395
          },
          {
            "x": 3859.39515613458,
            "y": -1450.4506954375386,
            "z": -1372.4922801872322,
            "px": 3859.39515613458,
            "py": -1450.4506954375386,
            "pz": -1372.4922801872322
          },
          {
            "x": 3859.39515613458,
            "y": -1450.4506954375386,
            "z": -1448.187662708025,
            "px": 3859.39515613458,
            "py": -1450.4506954375386,
            "pz": -1448.187662708025
          }
        ],
        [
          {
            "x": 3736.329366010819,
            "y": -1418.58844089573,
            "z": -884.8123372919752,
            "px": 3736.329366010819,
            "py": -1418.58844089573,
            "pz": -884.8123372919752
          },
          {
            "x": 3779.149140638789,
            "y": -1375.76866626776,
            "z": -930.2295668044509,
            "px": 3779.149140638789,
            "py": -1375.76866626776,
            "pz": -930.2295668044509
          },
          {
            "x": 3803.235263867022,
            "y": -1351.682543039527,
            "z": -997.8277048752432,
            "px": 3803.235263867022,
            "py": -1351.682543039527,
            "pz": -997.8277048752432
          },
          {
            "x": 3803.235263867022,
            "y": -1351.682543039527,
            "z": -1073.523087396036,
            "px": 3803.235263867022,
            "py": -1351.682543039527,
            "pz": -1073.523087396036
          },
          {
            "x": 3803.235263867022,
            "y": -1351.682543039527,
            "z": -1149.2184699168288,
            "px": 3803.235263867022,
            "py": -1351.682543039527,
            "pz": -1149.2184699168288
          },
          {
            "x": 3803.235263867022,
            "y": -1351.682543039527,
            "z": -1224.9138524376217,
            "px": 3803.235263867022,
            "py": -1351.682543039527,
            "pz": -1224.9138524376217
          },
          {
            "x": 3803.235263867022,
            "y": -1351.682543039527,
            "z": -1300.6092349584146,
            "px": 3803.235263867022,
            "py": -1351.682543039527,
            "pz": -1300.6092349584146
          },
          {
            "x": 3803.235263867022,
            "y": -1351.682543039527,
            "z": -1376.3046174792075,
            "px": 3803.235263867022,
            "py": -1351.682543039527,
            "pz": -1376.3046174792075
          },
          {
            "x": 3803.235263867022,
            "y": -1351.682543039527,
            "z": -1452.0000000000005,
            "px": 3803.235263867022,
            "py": -1351.682543039527,
            "pz": -1452.0000000000005
          }
        ]
      ],
      "clawClosure": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "propulsionTime": 0,
      "propulsionPulse": 0,
      "headSideRatio": 0.92,
      "headYScale": 1.24
    },
    {
      "id": "adult-crobonic-2",
      "designVersion": 2,
      "x": 6500,
      "y": -6000,
      "z": -1100,
      "px": 6500,
      "py": -6000,
      "pz": -1100,
      "homeX": 6500,
      "homeY": -6000,
      "homeZ": -1100,
      "heading": 1.5707963267948966,
      "seed": 6116,
      "headRadius": 100,
      "lengthMeters": 30,
      "armLength": 605.5630601663429,
      "armRadius": 18,
      "clawLength": 24,
      "eyeScale": 0.62,
      "orientation": {
        "x": 0,
        "y": 0,
        "z": 0,
        "w": 1
      },
      "activeArm": null,
      "noticedPlayer": false,
      "surfaceGrips": [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "tentacles": [
        [
          {
            "x": 6413.670633989181,
            "y": -5918.58844089573,
            "z": -1134.8123372919752,
            "px": 6413.670633989181,
            "py": -5918.58844089573,
            "pz": -1134.8123372919752
          },
          {
            "x": 6370.850859361211,
            "y": -5875.76866626776,
            "z": -1180.229566804451,
            "px": 6370.850859361211,
            "py": -5875.76866626776,
            "pz": -1180.229566804451
          },
          {
            "x": 6346.764736132978,
            "y": -5851.682543039527,
            "z": -1247.8277048752432,
            "px": 6346.764736132978,
            "py": -5851.682543039527,
            "pz": -1247.8277048752432
          },
          {
            "x": 6346.764736132978,
            "y": -5851.682543039527,
            "z": -1323.523087396036,
            "px": 6346.764736132978,
            "py": -5851.682543039527,
            "pz": -1323.523087396036
          },
          {
            "x": 6346.764736132978,
            "y": -5851.682543039527,
            "z": -1399.2184699168288,
            "px": 6346.764736132978,
            "py": -5851.682543039527,
            "pz": -1399.2184699168288
          },
          {
            "x": 6346.764736132978,
            "y": -5851.682543039527,
            "z": -1474.9138524376217,
            "px": 6346.764736132978,
            "py": -5851.682543039527,
            "pz": -1474.9138524376217
          },
          {
            "x": 6346.764736132978,
            "y": -5851.682543039527,
            "z": -1550.6092349584146,
            "px": 6346.764736132978,
            "py": -5851.682543039527,
            "pz": -1550.6092349584146
          },
          {
            "x": 6346.764736132978,
            "y": -5851.682543039527,
            "z": -1626.3046174792075,
            "px": 6346.764736132978,
            "py": -5851.682543039527,
            "pz": -1626.3046174792075
          },
          {
            "x": 6346.764736132978,
            "y": -5851.682543039527,
            "z": -1702.0000000000005,
            "px": 6346.764736132978,
            "py": -5851.682543039527,
            "pz": -1702.0000000000005
          }
        ],
        [
          {
            "x": 6382,
            "y": -5974.939953715915,
            "z": -1131,
            "px": 6382,
            "py": -5974.939953715915,
            "pz": -1131
          },
          {
            "x": 6323.507100073869,
            "y": -5959.266828417754,
            "z": -1176.4172295124756,
            "px": 6323.507100073869,
            "py": -5959.266828417754,
            "pz": -1176.4172295124756
          },
          {
            "x": 6290.60484386542,
            "y": -5950.450695437539,
            "z": -1244.015367583268,
            "px": 6290.60484386542,
            "py": -5950.450695437539,
            "pz": -1244.015367583268
          },
          {
            "x": 6290.60484386542,
            "y": -5950.450695437539,
            "z": -1319.710750104061,
            "px": 6290.60484386542,
            "py": -5950.450695437539,
            "pz": -1319.710750104061
          },
          {
            "x": 6290.60484386542,
            "y": -5950.450695437539,
            "z": -1395.4061326248539,
            "px": 6290.60484386542,
            "py": -5950.450695437539,
            "pz": -1395.4061326248539
          },
          {
            "x": 6290.60484386542,
            "y": -5950.450695437539,
            "z": -1471.1015151456465,
            "px": 6290.60484386542,
            "py": -5950.450695437539,
            "pz": -1471.1015151456465
          },
          {
            "x": 6290.60484386542,
            "y": -5950.450695437539,
            "z": -1546.7968976664395,
            "px": 6290.60484386542,
            "py": -5950.450695437539,
            "pz": -1546.7968976664395
          },
          {
            "x": 6290.60484386542,
            "y": -5950.450695437539,
            "z": -1622.4922801872322,
            "px": 6290.60484386542,
            "py": -5950.450695437539,
            "pz": -1622.4922801872322
          },
          {
            "x": 6290.60484386542,
            "y": -5950.450695437539,
            "z": -1698.187662708025,
            "px": 6290.60484386542,
            "py": -5950.450695437539,
            "pz": -1698.187662708025
          }
        ],
        [
          {
            "x": 6382,
            "y": -6025.060046284085,
            "z": -1131,
            "px": 6382,
            "py": -6025.060046284085,
            "pz": -1131
          },
          {
            "x": 6323.507100073869,
            "y": -6040.733171582246,
            "z": -1176.4172295124756,
            "px": 6323.507100073869,
            "py": -6040.733171582246,
            "pz": -1176.4172295124756
          },
          {
            "x": 6290.60484386542,
            "y": -6049.549304562461,
            "z": -1244.015367583268,
            "px": 6290.60484386542,
            "py": -6049.549304562461,
            "pz": -1244.015367583268
          },
          {
            "x": 6290.60484386542,
            "y": -6049.549304562461,
            "z": -1319.710750104061,
            "px": 6290.60484386542,
            "py": -6049.549304562461,
            "pz": -1319.710750104061
          },
          {
            "x": 6290.60484386542,
            "y": -6049.549304562461,
            "z": -1395.4061326248539,
            "px": 6290.60484386542,
            "py": -6049.549304562461,
            "pz": -1395.4061326248539
          },
          {
            "x": 6290.60484386542,
            "y": -6049.549304562461,
            "z": -1471.1015151456465,
            "px": 6290.60484386542,
            "py": -6049.549304562461,
            "pz": -1471.1015151456465
          },
          {
            "x": 6290.60484386542,
            "y": -6049.549304562461,
            "z": -1546.7968976664395,
            "px": 6290.60484386542,
            "py": -6049.549304562461,
            "pz": -1546.7968976664395
          },
          {
            "x": 6290.60484386542,
            "y": -6049.549304562461,
            "z": -1622.4922801872322,
            "px": 6290.60484386542,
            "py": -6049.549304562461,
            "pz": -1622.4922801872322
          },
          {
            "x": 6290.60484386542,
            "y": -6049.549304562461,
            "z": -1698.187662708025,
            "px": 6290.60484386542,
            "py": -6049.549304562461,
            "pz": -1698.187662708025
          }
        ],
        [
          {
            "x": 6413.670633989181,
            "y": -6081.41155910427,
            "z": -1134.8123372919752,
            "px": 6413.670633989181,
            "py": -6081.41155910427,
            "pz": -1134.8123372919752
          },
          {
            "x": 6370.850859361211,
            "y": -6124.231333732239,
            "z": -1180.229566804451,
            "px": 6370.850859361211,
            "py": -6124.231333732239,
            "pz": -1180.229566804451
          },
          {
            "x": 6346.764736132978,
            "y": -6148.317456960473,
            "z": -1247.8277048752432,
            "px": 6346.764736132978,
            "py": -6148.317456960473,
            "pz": -1247.8277048752432
          },
          {
            "x": 6346.764736132978,
            "y": -6148.317456960473,
            "z": -1323.523087396036,
            "px": 6346.764736132978,
            "py": -6148.317456960473,
            "pz": -1323.523087396036
          },
          {
            "x": 6346.764736132978,
            "y": -6148.317456960473,
            "z": -1399.2184699168288,
            "px": 6346.764736132978,
            "py": -6148.317456960473,
            "pz": -1399.2184699168288
          },
          {
            "x": 6346.764736132978,
            "y": -6148.317456960473,
            "z": -1474.9138524376217,
            "px": 6346.764736132978,
            "py": -6148.317456960473,
            "pz": -1474.9138524376217
          },
          {
            "x": 6346.764736132978,
            "y": -6148.317456960473,
            "z": -1550.6092349584146,
            "px": 6346.764736132978,
            "py": -6148.317456960473,
            "pz": -1550.6092349584146
          },
          {
            "x": 6346.764736132978,
            "y": -6148.317456960473,
            "z": -1626.3046174792075,
            "px": 6346.764736132978,
            "py": -6148.317456960473,
            "pz": -1626.3046174792075
          },
          {
            "x": 6346.764736132978,
            "y": -6148.317456960473,
            "z": -1702.0000000000005,
            "px": 6346.764736132978,
            "py": -6148.317456960473,
            "pz": -1702.0000000000005
          }
        ],
        [
          {
            "x": 6586.329366010819,
            "y": -6081.41155910427,
            "z": -1134.8123372919752,
            "px": 6586.329366010819,
            "py": -6081.41155910427,
            "pz": -1134.8123372919752
          },
          {
            "x": 6629.149140638789,
            "y": -6124.23133373224,
            "z": -1180.229566804451,
            "px": 6629.149140638789,
            "py": -6124.23133373224,
            "pz": -1180.229566804451
          },
          {
            "x": 6653.235263867022,
            "y": -6148.317456960473,
            "z": -1247.8277048752432,
            "px": 6653.235263867022,
            "py": -6148.317456960473,
            "pz": -1247.8277048752432
          },
          {
            "x": 6653.235263867022,
            "y": -6148.317456960473,
            "z": -1323.523087396036,
            "px": 6653.235263867022,
            "py": -6148.317456960473,
            "pz": -1323.523087396036
          },
          {
            "x": 6653.235263867022,
            "y": -6148.317456960473,
            "z": -1399.2184699168288,
            "px": 6653.235263867022,
            "py": -6148.317456960473,
            "pz": -1399.2184699168288
          },
          {
            "x": 6653.235263867022,
            "y": -6148.317456960473,
            "z": -1474.9138524376217,
            "px": 6653.235263867022,
            "py": -6148.317456960473,
            "pz": -1474.9138524376217
          },
          {
            "x": 6653.235263867022,
            "y": -6148.317456960473,
            "z": -1550.6092349584146,
            "px": 6653.235263867022,
            "py": -6148.317456960473,
            "pz": -1550.6092349584146
          },
          {
            "x": 6653.235263867022,
            "y": -6148.317456960473,
            "z": -1626.3046174792075,
            "px": 6653.235263867022,
            "py": -6148.317456960473,
            "pz": -1626.3046174792075
          },
          {
            "x": 6653.235263867022,
            "y": -6148.317456960473,
            "z": -1702.0000000000005,
            "px": 6653.235263867022,
            "py": -6148.317456960473,
            "pz": -1702.0000000000005
          }
        ],
        [
          {
            "x": 6618,
            "y": -6025.060046284085,
            "z": -1131,
            "px": 6618,
            "py": -6025.060046284085,
            "pz": -1131
          },
          {
            "x": 6676.492899926131,
            "y": -6040.733171582246,
            "z": -1176.4172295124756,
            "px": 6676.492899926131,
            "py": -6040.733171582246,
            "pz": -1176.4172295124756
          },
          {
            "x": 6709.39515613458,
            "y": -6049.549304562461,
            "z": -1244.015367583268,
            "px": 6709.39515613458,
            "py": -6049.549304562461,
            "pz": -1244.015367583268
          },
          {
            "x": 6709.39515613458,
            "y": -6049.549304562461,
            "z": -1319.710750104061,
            "px": 6709.39515613458,
            "py": -6049.549304562461,
            "pz": -1319.710750104061
          },
          {
            "x": 6709.39515613458,
            "y": -6049.549304562461,
            "z": -1395.4061326248539,
            "px": 6709.39515613458,
            "py": -6049.549304562461,
            "pz": -1395.4061326248539
          },
          {
            "x": 6709.39515613458,
            "y": -6049.549304562461,
            "z": -1471.1015151456465,
            "px": 6709.39515613458,
            "py": -6049.549304562461,
            "pz": -1471.1015151456465
          },
          {
            "x": 6709.39515613458,
            "y": -6049.549304562461,
            "z": -1546.7968976664395,
            "px": 6709.39515613458,
            "py": -6049.549304562461,
            "pz": -1546.7968976664395
          },
          {
            "x": 6709.39515613458,
            "y": -6049.549304562461,
            "z": -1622.4922801872322,
            "px": 6709.39515613458,
            "py": -6049.549304562461,
            "pz": -1622.4922801872322
          },
          {
            "x": 6709.39515613458,
            "y": -6049.549304562461,
            "z": -1698.187662708025,
            "px": 6709.39515613458,
            "py": -6049.549304562461,
            "pz": -1698.187662708025
          }
        ],
        [
          {
            "x": 6618,
            "y": -5974.939953715915,
            "z": -1131,
            "px": 6618,
            "py": -5974.939953715915,
            "pz": -1131
          },
          {
            "x": 6676.492899926131,
            "y": -5959.266828417754,
            "z": -1176.4172295124756,
            "px": 6676.492899926131,
            "py": -5959.266828417754,
            "pz": -1176.4172295124756
          },
          {
            "x": 6709.39515613458,
            "y": -5950.450695437539,
            "z": -1244.015367583268,
            "px": 6709.39515613458,
            "py": -5950.450695437539,
            "pz": -1244.015367583268
          },
          {
            "x": 6709.39515613458,
            "y": -5950.450695437539,
            "z": -1319.710750104061,
            "px": 6709.39515613458,
            "py": -5950.450695437539,
            "pz": -1319.710750104061
          },
          {
            "x": 6709.39515613458,
            "y": -5950.450695437539,
            "z": -1395.4061326248539,
            "px": 6709.39515613458,
            "py": -5950.450695437539,
            "pz": -1395.4061326248539
          },
          {
            "x": 6709.39515613458,
            "y": -5950.450695437539,
            "z": -1471.1015151456465,
            "px": 6709.39515613458,
            "py": -5950.450695437539,
            "pz": -1471.1015151456465
          },
          {
            "x": 6709.39515613458,
            "y": -5950.450695437539,
            "z": -1546.7968976664395,
            "px": 6709.39515613458,
            "py": -5950.450695437539,
            "pz": -1546.7968976664395
          },
          {
            "x": 6709.39515613458,
            "y": -5950.450695437539,
            "z": -1622.4922801872322,
            "px": 6709.39515613458,
            "py": -5950.450695437539,
            "pz": -1622.4922801872322
          },
          {
            "x": 6709.39515613458,
            "y": -5950.450695437539,
            "z": -1698.187662708025,
            "px": 6709.39515613458,
            "py": -5950.450695437539,
            "pz": -1698.187662708025
          }
        ],
        [
          {
            "x": 6586.329366010819,
            "y": -5918.58844089573,
            "z": -1134.8123372919752,
            "px": 6586.329366010819,
            "py": -5918.58844089573,
            "pz": -1134.8123372919752
          },
          {
            "x": 6629.149140638789,
            "y": -5875.76866626776,
            "z": -1180.229566804451,
            "px": 6629.149140638789,
            "py": -5875.76866626776,
            "pz": -1180.229566804451
          },
          {
            "x": 6653.235263867022,
            "y": -5851.682543039527,
            "z": -1247.8277048752432,
            "px": 6653.235263867022,
            "py": -5851.682543039527,
            "pz": -1247.8277048752432
          },
          {
            "x": 6653.235263867022,
            "y": -5851.682543039527,
            "z": -1323.523087396036,
            "px": 6653.235263867022,
            "py": -5851.682543039527,
            "pz": -1323.523087396036
          },
          {
            "x": 6653.235263867022,
            "y": -5851.682543039527,
            "z": -1399.2184699168288,
            "px": 6653.235263867022,
            "py": -5851.682543039527,
            "pz": -1399.2184699168288
          },
          {
            "x": 6653.235263867022,
            "y": -5851.682543039527,
            "z": -1474.9138524376217,
            "px": 6653.235263867022,
            "py": -5851.682543039527,
            "pz": -1474.9138524376217
          },
          {
            "x": 6653.235263867022,
            "y": -5851.682543039527,
            "z": -1550.6092349584146,
            "px": 6653.235263867022,
            "py": -5851.682543039527,
            "pz": -1550.6092349584146
          },
          {
            "x": 6653.235263867022,
            "y": -5851.682543039527,
            "z": -1626.3046174792075,
            "px": 6653.235263867022,
            "py": -5851.682543039527,
            "pz": -1626.3046174792075
          },
          {
            "x": 6653.235263867022,
            "y": -5851.682543039527,
            "z": -1702.0000000000005,
            "px": 6653.235263867022,
            "py": -5851.682543039527,
            "pz": -1702.0000000000005
          }
        ]
      ],
      "clawClosure": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "propulsionTime": 0,
      "propulsionPulse": 0,
      "headSideRatio": 0.92,
      "headYScale": 1.24
    },
    {
      "id": "adult-crobonic-3",
      "designVersion": 2,
      "x": 3000,
      "y": -10300,
      "z": -1000,
      "px": 3000,
      "py": -10300,
      "pz": -1000,
      "homeX": 3000,
      "homeY": -10300,
      "homeZ": -1000,
      "heading": 1.5707963267948966,
      "seed": 6048,
      "headRadius": 100,
      "lengthMeters": 30,
      "armLength": 605.5630601663429,
      "armRadius": 18,
      "clawLength": 24,
      "eyeScale": 0.62,
      "orientation": {
        "x": 0,
        "y": 0,
        "z": 0,
        "w": 1
      },
      "activeArm": null,
      "noticedPlayer": false,
      "surfaceGrips": [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "tentacles": [
        [
          {
            "x": 2913.670633989181,
            "y": -10218.58844089573,
            "z": -1034.8123372919752,
            "px": 2913.670633989181,
            "py": -10218.58844089573,
            "pz": -1034.8123372919752
          },
          {
            "x": 2870.8508593612114,
            "y": -10175.76866626776,
            "z": -1080.2295668044508,
            "px": 2870.8508593612114,
            "py": -10175.76866626776,
            "pz": -1080.2295668044508
          },
          {
            "x": 2846.764736132978,
            "y": -10151.682543039527,
            "z": -1147.8277048752432,
            "px": 2846.764736132978,
            "py": -10151.682543039527,
            "pz": -1147.8277048752432
          },
          {
            "x": 2846.764736132978,
            "y": -10151.682543039527,
            "z": -1223.523087396036,
            "px": 2846.764736132978,
            "py": -10151.682543039527,
            "pz": -1223.523087396036
          },
          {
            "x": 2846.764736132978,
            "y": -10151.682543039527,
            "z": -1299.2184699168288,
            "px": 2846.764736132978,
            "py": -10151.682543039527,
            "pz": -1299.2184699168288
          },
          {
            "x": 2846.764736132978,
            "y": -10151.682543039527,
            "z": -1374.9138524376217,
            "px": 2846.764736132978,
            "py": -10151.682543039527,
            "pz": -1374.9138524376217
          },
          {
            "x": 2846.764736132978,
            "y": -10151.682543039527,
            "z": -1450.6092349584146,
            "px": 2846.764736132978,
            "py": -10151.682543039527,
            "pz": -1450.6092349584146
          },
          {
            "x": 2846.764736132978,
            "y": -10151.682543039527,
            "z": -1526.3046174792075,
            "px": 2846.764736132978,
            "py": -10151.682543039527,
            "pz": -1526.3046174792075
          },
          {
            "x": 2846.764736132978,
            "y": -10151.682543039527,
            "z": -1602.0000000000005,
            "px": 2846.764736132978,
            "py": -10151.682543039527,
            "pz": -1602.0000000000005
          }
        ],
        [
          {
            "x": 2882,
            "y": -10274.939953715915,
            "z": -1031,
            "px": 2882,
            "py": -10274.939953715915,
            "pz": -1031
          },
          {
            "x": 2823.507100073869,
            "y": -10259.266828417754,
            "z": -1076.4172295124758,
            "px": 2823.507100073869,
            "py": -10259.266828417754,
            "pz": -1076.4172295124758
          },
          {
            "x": 2790.60484386542,
            "y": -10250.45069543754,
            "z": -1144.015367583268,
            "px": 2790.60484386542,
            "py": -10250.45069543754,
            "pz": -1144.015367583268
          },
          {
            "x": 2790.60484386542,
            "y": -10250.45069543754,
            "z": -1219.710750104061,
            "px": 2790.60484386542,
            "py": -10250.45069543754,
            "pz": -1219.710750104061
          },
          {
            "x": 2790.60484386542,
            "y": -10250.45069543754,
            "z": -1295.4061326248539,
            "px": 2790.60484386542,
            "py": -10250.45069543754,
            "pz": -1295.4061326248539
          },
          {
            "x": 2790.60484386542,
            "y": -10250.45069543754,
            "z": -1371.1015151456465,
            "px": 2790.60484386542,
            "py": -10250.45069543754,
            "pz": -1371.1015151456465
          },
          {
            "x": 2790.60484386542,
            "y": -10250.45069543754,
            "z": -1446.7968976664395,
            "px": 2790.60484386542,
            "py": -10250.45069543754,
            "pz": -1446.7968976664395
          },
          {
            "x": 2790.60484386542,
            "y": -10250.45069543754,
            "z": -1522.4922801872322,
            "px": 2790.60484386542,
            "py": -10250.45069543754,
            "pz": -1522.4922801872322
          },
          {
            "x": 2790.60484386542,
            "y": -10250.45069543754,
            "z": -1598.187662708025,
            "px": 2790.60484386542,
            "py": -10250.45069543754,
            "pz": -1598.187662708025
          }
        ],
        [
          {
            "x": 2882,
            "y": -10325.060046284085,
            "z": -1031,
            "px": 2882,
            "py": -10325.060046284085,
            "pz": -1031
          },
          {
            "x": 2823.507100073869,
            "y": -10340.733171582246,
            "z": -1076.4172295124758,
            "px": 2823.507100073869,
            "py": -10340.733171582246,
            "pz": -1076.4172295124758
          },
          {
            "x": 2790.60484386542,
            "y": -10349.54930456246,
            "z": -1144.015367583268,
            "px": 2790.60484386542,
            "py": -10349.54930456246,
            "pz": -1144.015367583268
          },
          {
            "x": 2790.60484386542,
            "y": -10349.54930456246,
            "z": -1219.710750104061,
            "px": 2790.60484386542,
            "py": -10349.54930456246,
            "pz": -1219.710750104061
          },
          {
            "x": 2790.60484386542,
            "y": -10349.54930456246,
            "z": -1295.4061326248539,
            "px": 2790.60484386542,
            "py": -10349.54930456246,
            "pz": -1295.4061326248539
          },
          {
            "x": 2790.60484386542,
            "y": -10349.54930456246,
            "z": -1371.1015151456465,
            "px": 2790.60484386542,
            "py": -10349.54930456246,
            "pz": -1371.1015151456465
          },
          {
            "x": 2790.60484386542,
            "y": -10349.54930456246,
            "z": -1446.7968976664395,
            "px": 2790.60484386542,
            "py": -10349.54930456246,
            "pz": -1446.7968976664395
          },
          {
            "x": 2790.60484386542,
            "y": -10349.54930456246,
            "z": -1522.4922801872322,
            "px": 2790.60484386542,
            "py": -10349.54930456246,
            "pz": -1522.4922801872322
          },
          {
            "x": 2790.60484386542,
            "y": -10349.54930456246,
            "z": -1598.187662708025,
            "px": 2790.60484386542,
            "py": -10349.54930456246,
            "pz": -1598.187662708025
          }
        ],
        [
          {
            "x": 2913.670633989181,
            "y": -10381.41155910427,
            "z": -1034.8123372919752,
            "px": 2913.670633989181,
            "py": -10381.41155910427,
            "pz": -1034.8123372919752
          },
          {
            "x": 2870.850859361211,
            "y": -10424.23133373224,
            "z": -1080.2295668044508,
            "px": 2870.850859361211,
            "py": -10424.23133373224,
            "pz": -1080.2295668044508
          },
          {
            "x": 2846.764736132978,
            "y": -10448.317456960473,
            "z": -1147.8277048752432,
            "px": 2846.764736132978,
            "py": -10448.317456960473,
            "pz": -1147.8277048752432
          },
          {
            "x": 2846.764736132978,
            "y": -10448.317456960473,
            "z": -1223.523087396036,
            "px": 2846.764736132978,
            "py": -10448.317456960473,
            "pz": -1223.523087396036
          },
          {
            "x": 2846.764736132978,
            "y": -10448.317456960473,
            "z": -1299.2184699168288,
            "px": 2846.764736132978,
            "py": -10448.317456960473,
            "pz": -1299.2184699168288
          },
          {
            "x": 2846.764736132978,
            "y": -10448.317456960473,
            "z": -1374.9138524376217,
            "px": 2846.764736132978,
            "py": -10448.317456960473,
            "pz": -1374.9138524376217
          },
          {
            "x": 2846.764736132978,
            "y": -10448.317456960473,
            "z": -1450.6092349584146,
            "px": 2846.764736132978,
            "py": -10448.317456960473,
            "pz": -1450.6092349584146
          },
          {
            "x": 2846.764736132978,
            "y": -10448.317456960473,
            "z": -1526.3046174792075,
            "px": 2846.764736132978,
            "py": -10448.317456960473,
            "pz": -1526.3046174792075
          },
          {
            "x": 2846.764736132978,
            "y": -10448.317456960473,
            "z": -1602.0000000000005,
            "px": 2846.764736132978,
            "py": -10448.317456960473,
            "pz": -1602.0000000000005
          }
        ],
        [
          {
            "x": 3086.329366010819,
            "y": -10381.41155910427,
            "z": -1034.8123372919752,
            "px": 3086.329366010819,
            "py": -10381.41155910427,
            "pz": -1034.8123372919752
          },
          {
            "x": 3129.1491406387886,
            "y": -10424.23133373224,
            "z": -1080.2295668044508,
            "px": 3129.1491406387886,
            "py": -10424.23133373224,
            "pz": -1080.2295668044508
          },
          {
            "x": 3153.235263867022,
            "y": -10448.317456960473,
            "z": -1147.8277048752432,
            "px": 3153.235263867022,
            "py": -10448.317456960473,
            "pz": -1147.8277048752432
          },
          {
            "x": 3153.235263867022,
            "y": -10448.317456960473,
            "z": -1223.523087396036,
            "px": 3153.235263867022,
            "py": -10448.317456960473,
            "pz": -1223.523087396036
          },
          {
            "x": 3153.235263867022,
            "y": -10448.317456960473,
            "z": -1299.2184699168288,
            "px": 3153.235263867022,
            "py": -10448.317456960473,
            "pz": -1299.2184699168288
          },
          {
            "x": 3153.235263867022,
            "y": -10448.317456960473,
            "z": -1374.9138524376217,
            "px": 3153.235263867022,
            "py": -10448.317456960473,
            "pz": -1374.9138524376217
          },
          {
            "x": 3153.235263867022,
            "y": -10448.317456960473,
            "z": -1450.6092349584146,
            "px": 3153.235263867022,
            "py": -10448.317456960473,
            "pz": -1450.6092349584146
          },
          {
            "x": 3153.235263867022,
            "y": -10448.317456960473,
            "z": -1526.3046174792075,
            "px": 3153.235263867022,
            "py": -10448.317456960473,
            "pz": -1526.3046174792075
          },
          {
            "x": 3153.235263867022,
            "y": -10448.317456960473,
            "z": -1602.0000000000005,
            "px": 3153.235263867022,
            "py": -10448.317456960473,
            "pz": -1602.0000000000005
          }
        ],
        [
          {
            "x": 3118,
            "y": -10325.060046284085,
            "z": -1031,
            "px": 3118,
            "py": -10325.060046284085,
            "pz": -1031
          },
          {
            "x": 3176.492899926131,
            "y": -10340.733171582246,
            "z": -1076.4172295124758,
            "px": 3176.492899926131,
            "py": -10340.733171582246,
            "pz": -1076.4172295124758
          },
          {
            "x": 3209.39515613458,
            "y": -10349.54930456246,
            "z": -1144.015367583268,
            "px": 3209.39515613458,
            "py": -10349.54930456246,
            "pz": -1144.015367583268
          },
          {
            "x": 3209.39515613458,
            "y": -10349.54930456246,
            "z": -1219.710750104061,
            "px": 3209.39515613458,
            "py": -10349.54930456246,
            "pz": -1219.710750104061
          },
          {
            "x": 3209.39515613458,
            "y": -10349.54930456246,
            "z": -1295.4061326248539,
            "px": 3209.39515613458,
            "py": -10349.54930456246,
            "pz": -1295.4061326248539
          },
          {
            "x": 3209.39515613458,
            "y": -10349.54930456246,
            "z": -1371.1015151456465,
            "px": 3209.39515613458,
            "py": -10349.54930456246,
            "pz": -1371.1015151456465
          },
          {
            "x": 3209.39515613458,
            "y": -10349.54930456246,
            "z": -1446.7968976664395,
            "px": 3209.39515613458,
            "py": -10349.54930456246,
            "pz": -1446.7968976664395
          },
          {
            "x": 3209.39515613458,
            "y": -10349.54930456246,
            "z": -1522.4922801872322,
            "px": 3209.39515613458,
            "py": -10349.54930456246,
            "pz": -1522.4922801872322
          },
          {
            "x": 3209.39515613458,
            "y": -10349.54930456246,
            "z": -1598.187662708025,
            "px": 3209.39515613458,
            "py": -10349.54930456246,
            "pz": -1598.187662708025
          }
        ],
        [
          {
            "x": 3118,
            "y": -10274.939953715915,
            "z": -1031,
            "px": 3118,
            "py": -10274.939953715915,
            "pz": -1031
          },
          {
            "x": 3176.492899926131,
            "y": -10259.266828417754,
            "z": -1076.4172295124758,
            "px": 3176.492899926131,
            "py": -10259.266828417754,
            "pz": -1076.4172295124758
          },
          {
            "x": 3209.39515613458,
            "y": -10250.45069543754,
            "z": -1144.015367583268,
            "px": 3209.39515613458,
            "py": -10250.45069543754,
            "pz": -1144.015367583268
          },
          {
            "x": 3209.39515613458,
            "y": -10250.45069543754,
            "z": -1219.710750104061,
            "px": 3209.39515613458,
            "py": -10250.45069543754,
            "pz": -1219.710750104061
          },
          {
            "x": 3209.39515613458,
            "y": -10250.45069543754,
            "z": -1295.4061326248539,
            "px": 3209.39515613458,
            "py": -10250.45069543754,
            "pz": -1295.4061326248539
          },
          {
            "x": 3209.39515613458,
            "y": -10250.45069543754,
            "z": -1371.1015151456465,
            "px": 3209.39515613458,
            "py": -10250.45069543754,
            "pz": -1371.1015151456465
          },
          {
            "x": 3209.39515613458,
            "y": -10250.45069543754,
            "z": -1446.7968976664395,
            "px": 3209.39515613458,
            "py": -10250.45069543754,
            "pz": -1446.7968976664395
          },
          {
            "x": 3209.39515613458,
            "y": -10250.45069543754,
            "z": -1522.4922801872322,
            "px": 3209.39515613458,
            "py": -10250.45069543754,
            "pz": -1522.4922801872322
          },
          {
            "x": 3209.39515613458,
            "y": -10250.45069543754,
            "z": -1598.187662708025,
            "px": 3209.39515613458,
            "py": -10250.45069543754,
            "pz": -1598.187662708025
          }
        ],
        [
          {
            "x": 3086.329366010819,
            "y": -10218.58844089573,
            "z": -1034.8123372919752,
            "px": 3086.329366010819,
            "py": -10218.58844089573,
            "pz": -1034.8123372919752
          },
          {
            "x": 3129.149140638789,
            "y": -10175.76866626776,
            "z": -1080.2295668044508,
            "px": 3129.149140638789,
            "py": -10175.76866626776,
            "pz": -1080.2295668044508
          },
          {
            "x": 3153.235263867022,
            "y": -10151.682543039527,
            "z": -1147.8277048752432,
            "px": 3153.235263867022,
            "py": -10151.682543039527,
            "pz": -1147.8277048752432
          },
          {
            "x": 3153.235263867022,
            "y": -10151.682543039527,
            "z": -1223.523087396036,
            "px": 3153.235263867022,
            "py": -10151.682543039527,
            "pz": -1223.523087396036
          },
          {
            "x": 3153.235263867022,
            "y": -10151.682543039527,
            "z": -1299.2184699168288,
            "px": 3153.235263867022,
            "py": -10151.682543039527,
            "pz": -1299.2184699168288
          },
          {
            "x": 3153.235263867022,
            "y": -10151.682543039527,
            "z": -1374.9138524376217,
            "px": 3153.235263867022,
            "py": -10151.682543039527,
            "pz": -1374.9138524376217
          },
          {
            "x": 3153.235263867022,
            "y": -10151.682543039527,
            "z": -1450.6092349584146,
            "px": 3153.235263867022,
            "py": -10151.682543039527,
            "pz": -1450.6092349584146
          },
          {
            "x": 3153.235263867022,
            "y": -10151.682543039527,
            "z": -1526.3046174792075,
            "px": 3153.235263867022,
            "py": -10151.682543039527,
            "pz": -1526.3046174792075
          },
          {
            "x": 3153.235263867022,
            "y": -10151.682543039527,
            "z": -1602.0000000000005,
            "px": 3153.235263867022,
            "py": -10151.682543039527,
            "pz": -1602.0000000000005
          }
        ]
      ],
      "clawClosure": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "propulsionTime": 0,
      "propulsionPulse": 0,
      "headSideRatio": 0.92,
      "headYScale": 1.24
    }
  ],
  "squidEncounter": null,
  "treeStalkerEncounter": null,
  "centipedeEncounter": null
};

/** Each expedition receives independent mutable simulation and discovery state. */
export function loadPreparedWorld({includeShellField=true}={}) {
  const world = structuredClone(PREPARED_WORLD);
  world.borders=structuredClone(PREPARED_PERIMETER_BORDERS);
  for(const ice of world.platforms){
    const impact=CRASH_IMPACT_DATA[ice.id];
    if(impact)ice.relief={...structuredClone(impact.baseRelief),mesh:structuredClone(impact.mesh)};
  }
  world.arcticGardens.grass.push(...structuredClone(PREPARED_DENSE_GRASS));
  // These glaciers now enclose the cave networks and are grounded below the
  // seabed. Their old shallow attachment cones must not hang inside the caves.
  const groundedBasins=[...new Set(PREPARED_BASIN_CAVES.map(cave=>cave.platformId))];
  world.iceSpikes=world.iceSpikes.filter(spike=>!groundedBasins.some(id=>spike.id.startsWith(id+'-underside-spike-')));
  // These authored additions retain all original identities and encounter state.
  // The other regional species import their additions in their own data modules.
  for (const key of ['crabs', 'isopods', 'squids'])
    world[key].push(...structuredClone(PREPARED_WILDLIFE_EXPANSION[key]));
  if(includeShellField)for(const [key,patches] of Object.entries(SHELL_FIELD_ANCHORS)){
    for(const animal of world[key]??[]){
      if(!patches[animal.id])continue;
      Object.assign(animal,structuredClone(patches[animal.id]));
      if(key==='isopods')for(const field of ['surfaceSpine','surfaceOrientation','surfaceContact','surfaceNormal','surfaceForward'])delete animal[field];
    }
  }
  return world;
}
