export type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  imagePath: string;
  icon: string;
  children: readonly { name: string; slug: string; description: string }[];
};

const child = (name: string, slug: string, description: string) => ({ name, slug, description });

export const POULTRY_TAXONOMY: readonly SeedCategory[] = [
  {
    name: "Live Birds", slug: "live-birds", icon: "bird", imagePath: "/images/poultry/live-birds.webp",
    description: "Source market-ready birds, growing stock and breeding birds from poultry farms.",
    children: [
      child("Broiler Chickens", "broiler-chickens", "Meat birds available by live weight, age or flock quantity."),
      child("Layer Chickens", "layer-chickens", "Pullets, point-of-lay birds and active laying hens."),
      child("Cockerels", "cockerels", "Cockerel chickens for rearing, breeding or table use."),
      child("Turkeys", "turkeys", "Live indigenous and improved turkey varieties."),
      child("Ducks", "ducks", "Live meat, laying and breeding ducks."),
      child("Guinea Fowl", "guinea-fowl", "Live guinea fowl for production and breeding."),
      child("Quail", "quail", "Live quail for eggs, meat and breeding."),
      child("Geese", "geese", "Live geese for farms and breeding programmes."),
      child("Breeder Stock", "breeder-stock", "Parent stock and proven breeding birds across poultry species."),
    ],
  },
  {
    name: "Day-Old Chicks & Poults", slug: "day-old-chicks-poults", icon: "chick", imagePath: "/images/poultry/day-old-chicks.webp",
    description: "Book hatchery supply of healthy chicks, poults, ducklings and keets.",
    children: [
      child("Broiler Chicks", "broiler-chicks", "Day-old broiler chicks for commercial meat production."),
      child("Layer Chicks", "layer-chicks", "Day-old layer chicks for egg-production flocks."),
      child("Cockerel Chicks", "cockerel-chicks", "Day-old cockerel chicks for hardy grow-out systems."),
      child("Turkey Poults", "turkey-poults", "Day-old and started turkey poults."),
      child("Ducklings", "ducklings", "Young ducks for meat, egg and mixed production."),
      child("Guinea Fowl Keets", "guinea-fowl-keets", "Young guinea fowl from poultry hatcheries."),
      child("Quail Chicks", "quail-chicks", "Young quail for egg and meat production."),
    ],
  },
  {
    name: "Eggs", slug: "eggs", icon: "egg", imagePath: "/images/poultry/eggs.webp",
    description: "Buy eating and fertile hatching eggs by tray, crate or bulk quantity.",
    children: [
      child("Table Eggs", "table-eggs", "Fresh chicken eggs for homes, retailers and food businesses."),
      child("Hatching Eggs", "hatching-eggs", "Fertile chicken eggs selected for incubation."),
      child("Quail Eggs", "quail-eggs", "Fresh and fertile quail eggs."),
      child("Turkey Eggs", "turkey-eggs", "Fresh and fertile turkey eggs."),
      child("Duck Eggs", "duck-eggs", "Fresh and fertile duck eggs."),
    ],
  },
  {
    name: "Poultry Feed", slug: "poultry-feed", icon: "feed", imagePath: "/images/poultry/feed.webp",
    description: "Complete rations, ingredients and supplements for every poultry growth stage.",
    children: [
      child("Chick Starter", "chick-starter", "Starter rations for chicks during early growth."),
      child("Grower Feed", "grower-feed", "Balanced feed for growing replacement and meat birds."),
      child("Finisher Feed", "finisher-feed", "Finishing rations for market-ready meat birds."),
      child("Layer Mash", "layer-mash", "Egg-production feed for laying flocks."),
      child("Breeder Feed", "breeder-feed", "Rations formulated for breeder fertility and condition."),
      child("Turkey Feed", "turkey-feed", "Stage-appropriate complete feed for turkeys."),
      child("Duck Feed", "duck-feed", "Complete feed suitable for ducks."),
      child("Quail Feed", "quail-feed", "Fine feed formulations for growing and laying quail."),
      child("Feed Ingredients", "feed-ingredients", "Maize, soya, concentrates and other formulation inputs."),
      child("Feed Supplements", "feed-supplements", "Additives that support feed quality and flock performance."),
    ],
  },
  {
    name: "Poultry Equipment", slug: "poultry-equipment", icon: "equipment", imagePath: "/images/poultry/equipment.webp",
    description: "Practical equipment for feeding, watering, brooding, housing and daily farm work.",
    children: [
      child("Feeders", "feeders", "Manual and automatic poultry feeding equipment."),
      child("Drinkers", "drinkers", "Bell, nipple, trough and chick drinking systems."),
      child("Brooders", "brooders", "Gas, electric and charcoal brooding equipment."),
      child("Incubators", "incubators", "Egg incubators for small and commercial hatcheries."),
      child("Hatchers", "hatchers", "Dedicated hatching cabinets and baskets."),
      child("Egg Trays & Crates", "egg-trays-crates", "Reusable and disposable egg handling trays and crates."),
      child("Cages", "cages", "Layer, breeder, transport and display cages."),
      child("Nesting Equipment", "nesting-equipment", "Nest boxes and roll-away nesting systems."),
      child("Heating Equipment", "heating-equipment", "Farm heaters, regulators and heat accessories."),
      child("Ventilation Equipment", "ventilation-equipment", "Fans, inlets and cooling equipment for poultry houses."),
      child("Lighting Equipment", "lighting-equipment", "Farm-safe bulbs, timers and lighting systems."),
      child("Scales", "scales", "Bird, egg and feed weighing scales."),
      child("Cleaning Equipment", "cleaning-equipment", "Washers, sprayers and farm cleaning tools."),
    ],
  },
  {
    name: "Veterinary & Health", slug: "veterinary-health", icon: "health", imagePath: "/images/poultry/veterinary.webp",
    description: "Poultry health, prevention, treatment and biosecurity products from responsible suppliers.",
    children: [
      child("Vaccines", "vaccines", "Poultry vaccines supplied with appropriate handling information."),
      child("Antibiotics", "antibiotics", "Veterinary antibiotics for responsible use under professional guidance."),
      child("Vitamins & Supplements", "vitamins-supplements", "Vitamins, minerals, electrolytes and performance support."),
      child("Dewormers", "dewormers", "Products for poultry parasite-control programmes."),
      child("Disinfectants", "disinfectants", "Farm, equipment and water-system disinfectants."),
      child("Coccidiosis Products", "coccidiosis-products", "Prevention and treatment products for coccidiosis control."),
      child("Biosecurity Products", "biosecurity-products", "Footbaths, sanitisers and other disease-exclusion supplies."),
      child("Diagnostic Products", "diagnostic-products", "Sampling, rapid-test and flock monitoring products."),
    ],
  },
  {
    name: "Hatchery Supplies", slug: "hatchery-supplies", icon: "hatchery", imagePath: "/images/poultry/hatchery-supplies.webp",
    description: "Tools and consumables for clean, consistent egg incubation and chick handling.",
    children: [
      child("Incubation Accessories", "incubation-accessories", "Trays, thermometers, hygrometers and incubator spares."),
      child("Candling Equipment", "candling-equipment", "Lights and cabinets for checking embryo development."),
      child("Chick Boxes", "chick-boxes", "Ventilated boxes for safe chick transport."),
      child("Hatchery Hygiene Products", "hatchery-hygiene-products", "Cleaning and sanitation products for hatchery operations."),
    ],
  },
  {
    name: "Poultry Housing & Farm Infrastructure", slug: "poultry-housing-farm-infrastructure", icon: "housing", imagePath: "/images/poultry/housing.webp",
    description: "Structures and systems for safe, productive poultry farms in tropical conditions.",
    children: [
      child("Poultry Houses", "poultry-houses", "Complete poultry houses, building kits and installations."),
      child("Pens", "pens", "Brooding, grow-out and breeder pen systems."),
      child("Flooring & Litter", "flooring-litter", "Floor systems and litter materials for poultry houses."),
      child("Curtains", "curtains", "Weather and ventilation curtains for open-sided houses."),
      child("Fencing", "fencing", "Farm perimeter, run and bird-control fencing."),
      child("Water Systems", "water-systems", "Tanks, pipes, filters and poultry water distribution."),
      child("Feed Storage", "feed-storage", "Bins, pallets and protected storage for poultry feed."),
    ],
  },
  {
    name: "Processing & Packaging", slug: "processing-packaging", icon: "processing", imagePath: "/images/poultry/processing.webp",
    description: "Equipment and packaging for hygienic poultry and egg handling after the farm gate.",
    children: [
      child("Pluckers", "pluckers", "Manual and powered poultry defeathering machines."),
      child("Scalders", "scalders", "Poultry scalding tanks and temperature-control equipment."),
      child("Slaughter Equipment", "slaughter-equipment", "Equipment for hygienic small and commercial processing."),
      child("Processing Tables", "processing-tables", "Food-grade work tables and cutting surfaces."),
      child("Freezers & Cold Storage", "freezers-cold-storage", "Cold-chain, freezer and chilled storage equipment."),
      child("Packaging Materials", "packaging-materials", "Food-grade bags, labels, seals and cartons."),
      child("Egg Packaging", "egg-packaging", "Retail packs, labels and protective egg packaging."),
    ],
  },
  {
    name: "Farm Inputs & Consumables", slug: "farm-inputs-consumables", icon: "inputs", imagePath: "/images/poultry/farm-inputs.webp",
    description: "Everyday poultry-farm consumables for litter, cleaning, hygiene and worker protection.",
    children: [
      child("Wood Shavings", "wood-shavings", "Dry wood shavings suitable for poultry-house litter."),
      child("Sawdust", "sawdust", "Clean sawdust for appropriate poultry-farm uses."),
      child("Litter Treatments", "litter-treatments", "Products for moisture, ammonia and litter management."),
      child("Cleaning Supplies", "cleaning-supplies", "Brushes, detergents, buckets and routine sanitation supplies."),
      child("Farm Clothing & PPE", "farm-clothing-ppe", "Coveralls, boots, gloves, masks and farm protective wear."),
    ],
  },
] as const;
