/** Authored Croba botany. These are habitat rules and visual dimensions, never
 * runtime spawn rules; prepared placements are stored separately in plant-data.js.
 * Dimensions and discovery distances use simulation units (25 = one metre).
 */
const plants = [
  { id: "frost-feather", name: "Frost Feather", biome: "arctic", habitat: "Sheltered Arctic seabed and deep kelp shelves",
    family: "frond", color: "ice blue", height: [55, 140], width: [32, 65], depth: [4, 50],
    description: "Fine blue fronds unfold from a gripping root crown. Pale margins catch the light beneath the broken ice." },
  { id: "brine-bell", name: "Brine Bell", biome: "arctic", habitat: "Cold glacier channels and deep kelp hollows",
    family: "cuticle", color: "blue and white", height: [25, 70], width: [24, 48], depth: [5, 50],
    description: "Cupped blue bells shelter tiny luminous nodules inside their white rims. They grow in low clusters near glacier channels." },
  { id: "glassroot-bloom", name: "Glassroot Bloom", biome: "arctic", habitat: "Arctic sediment and deep kelp slopes",
    family: "frond", color: "blue and violet", height: [16, 40], width: [26, 55], depth: [3, 50],
    description: "A low, star-shaped rosette spreads fleshy blue blades over the sediment. Violet tips distinguish it from the taller feather beds." },
  { id: "azure-sail-kelp", name: "Azure Sail Kelp", biome: "blue-ocean", habitat: "Clear ocean shelves",
    family: "frond", color: "deep cobalt", height: [100, 230], width: [45, 85], depth: [8, 45],
    description: "Broad cobalt sails curl around branching stipes. Their raised ribs flex in the clear coastal current." },
  { id: "tideglass-rosette", name: "Tideglass Rosette", biome: "blue-ocean", habitat: "Ocean terraces and basin margins",
    family: "cuticle", color: "teal with amber seed pods", height: [35, 85], width: [35, 65], depth: [10, 100],
    description: "Thick teal leaves curl around small amber seed pods. The low rosettes gather on ocean terraces and along the deep basin margins." },
  { id: "abyss-lantern-reed", name: "Abyss Lantern Reed", biome: "blue-ocean", habitat: "Deep ocean basin",
    family: "cuticle", color: "midnight blue with luminous nodes", height: [90, 210], width: [25, 50], depth: [65, 100],
    description: "Dark reeds carry small cyan and violet lanterns above the abyssal mud. Their light stays in the nodes, leaving the stems almost black." },
  { id: "violet-pitcher", name: "Violet Pitcher", biome: "forest", habitat: "Violet Spruce Forest understory",
    family: "cuticle", color: "purple with green rims", height: [20, 52], width: [18, 32], depth: null,
    description: "Curled purple pitchers open beneath green rims. Small nectar nodes glimmer gently in the shelter of the spruce canopy." },
  { id: "crown-fern", name: "Crown Fern", biome: "forest", habitat: "Mossy forest ground",
    family: "frond", color: "green with violet tips", height: [22, 58], width: [24, 44], depth: null,
    description: "Pinnate green fronds form a crown around tightly rolled fiddleheads. New growth carries violet tips." },
  { id: "moonbell-bloom", name: "Moonbell Bloom", biome: "forest", habitat: "Forest clearings and trail margins",
    family: "frond", color: "pale violet and green", height: [28, 65], width: [18, 32], depth: null,
    description: "Pale violet bells hang from slender green stems. Delicate anthers sit inside the curved petals." },
];

export const PLANT_CATALOG = Object.freeze(plants.map((plant) => Object.freeze({ ...plant,
  height: Object.freeze(plant.height), width: Object.freeze(plant.width),
  depth: plant.depth ? Object.freeze(plant.depth) : null })));
const byId = new Map(PLANT_CATALOG.map((plant) => [plant.id, plant]));

export function getPlantSpecies(id) { return byId.get(id) ?? null; }
