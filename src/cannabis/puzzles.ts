import type { Difficulty, Puzzle } from "../game/types";

const difficulties: Difficulty[] = [
  "Seedling",
  "Home Grower",
  "Experienced Grower",
  "Phenohunter",
  "Breeder Brain",
];

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function puzzle(
  category: string,
  answer: string,
  note: string,
  index: number,
  hint = "Use the category and visible letter pattern.",
  aliases: string[] = [],
): Puzzle {
  return {
    id: `${slug(category)}-${slug(answer)}-${index}`,
    answer: answer.toUpperCase(),
    category,
    difficulty: difficulties[index % difficulties.length],
    hint,
    educationalNote: note,
    acceptedAliases: aliases.map((item) => item.toUpperCase()),
    tags: [slug(category), "cannabis-education"],
    sourceNote: "Curated for The Great Ganja Spin; factual claims are intentionally cautious.",
    verificationStatus: "reviewed",
  };
}

const classicStrains = [
  "Afghani", "Acapulco Gold", "Apollo 13", "Blue Dream", "Blueberry", "Bubble Gum", "Chemdog", "Durban Poison", "G13", "Granddaddy Purple", "Green Crack", "Hindu Kush", "Jack Herer", "Lamb's Bread", "Maui Wowie", "Northern Lights", "OG Kush", "Purple Haze", "Skunk Number One", "Sour Diesel", "Super Lemon Haze", "Super Silver Haze", "Thai", "White Widow", "AK Forty Seven", "Amnesia Haze", "Bubba Kush", "California Orange", "Chocolope", "Death Star", "Ghost Train Haze", "Golden Goat", "Harlequin", "Headband", "Ice Cream Cake", "Island Sweet Skunk", "Kosher Kush", "LA Confidential", "Master Kush", "Mazar", "Romulan", "Skywalker OG", "Strawberry Cough", "Tahoe OG", "Tangie", "Trainwreck", "Wedding Cake", "Gelato", "Gorilla Glue Four", "Do Si Dos", "Sunset Sherbet", "Forbidden Fruit", "Runtz", "Zkittlez", "MAC One", "Gary Payton", "Jealousy", "Permanent Marker", "Oreoz", "Animal Cookies",
];

const cultivarPuzzles = classicStrains.map((answer, index) =>
  puzzle("Cultivar Archive", answer, "Cultivar names can refer to different cuts or seed populations; a name alone does not guarantee chemistry or lineage.", index, "A recognized cannabis cultivar name."),
);

const terpeneNames = [
  "Myrcene", "Limonene", "Beta Caryophyllene", "Alpha Pinene", "Beta Pinene", "Linalool", "Humulene", "Terpinolene", "Ocimene", "Nerolidol", "Bisabolol", "Camphene", "Borneol", "Fenchol", "Geraniol", "Valencene", "Guaiol", "Eucalyptol", "Sabinene", "Phytol", "Farnesene", "Carene", "Terpineol", "Phellandrene", "Cedrene",
];

const aromaRoots = ["Citrus", "Pine", "Diesel", "Blueberry", "Floral", "Herbal", "Peppery", "Earthy", "Tropical Fruit", "Creamy Gas", "Skunky", "Incense", "Sour Cherry", "Grapefruit", "Lavender", "Sandalwood", "Minty", "Coffee", "Chocolate", "Burnt Rubber"];
const aromaForms = ["Aroma", "Top Note", "Back Note", "Finish", "Sensory Profile", "Character", "Nose", "Volatile Impression"];

const terpenePuzzles = [
  ...terpeneNames.map((answer, index) => puzzle("Terpenes", answer, "Terpenes are volatile aromatic compounds found across many plants. Sensory descriptors are not medical predictions.", index, "A named aromatic compound.")),
  ...aromaRoots.flatMap((root, rootIndex) => aromaForms.map((form, formIndex) => puzzle("Aromas and Sensory", `${root} ${form}`, "Sensory language records perception; it should not be treated as a precise chemical analysis.", rootIndex * aromaForms.length + formIndex, "A cannabis aroma description."))),
];

const cannabinoids = [
  "Tetrahydrocannabinol", "Cannabidiol", "Cannabigerol", "Cannabinol", "Cannabichromene", "Tetrahydrocannabivarin", "Cannabidivarin", "Cannabigerolic Acid", "Tetrahydrocannabinolic Acid", "Cannabidiolic Acid", "Cannabinoid Receptor", "Endocannabinoid System", "Endocannabinoid Tone", "Dose Titration", "Therapeutic Window", "Drug Interaction Review", "Symptom Tracking", "Product Label Review", "Clinician Conversation", "Adverse Effect Tracking", "Certificate of Analysis", "Route of Administration", "Onset and Duration", "Biphasic Response", "Individual Variability",
];

const cannabinoidPuzzles = cannabinoids.map((answer, index) => puzzle("Cannabinoids and Medical Vocabulary", answer, "Cannabis responses and risks vary. This educational term is not medical advice or a treatment claim.", index, "A cannabinoid or cautious health-literacy term."));

const growTechniques = [
  "Low Stress Training", "Screen of Green", "Sea of Green", "Topping", "Super Cropping", "Mainlining", "Defoliation", "Trellising", "Bottom Feeding", "Crop Steering", "Transplanting", "Canopy Management", "Branch Training", "Selective Pruning", "Lollipop Pruning", "Root Pruning", "Integrated Pest Management", "Biological Pest Control", "Preventive Scouting", "Sticky Trap Monitoring", "Root Zone Management", "Irrigation Scheduling", "Pulse Irrigation", "Hand Watering", "Drip Irrigation", "Sub Irrigation", "Runoff Sampling", "Substrate Sampling", "Foliar Inspection", "Clone Acclimation", "Mother Plant Care", "Vegetative Training", "Flower Room Flip", "Light Deprivation", "Companion Planting", "Cover Cropping", "Living Soil Mulch", "Compost Tea Caution", "Sanitation Protocol", "Tool Sterilization",
];

const environmentTargets = ["Vapor Pressure Deficit", "Root Zone Temperature", "Leaf Surface Temperature", "Relative Humidity", "Daily Light Integral", "Substrate Moisture", "Dryback Percentage", "Runoff EC", "Irrigation Frequency", "Canopy Temperature", "Room Airflow", "Light Intensity", "Carbon Dioxide", "Air Exchange", "Dew Point", "Night Temperature", "Photoperiod", "Nutrient Solution pH"];
const monitoringActions = ["Monitoring", "Balancing", "Tracking", "Adjusting", "Recording", "Charting", "Reviewing"];

const cultivationPuzzles = [
  ...growTechniques.map((answer, index) => puzzle("Grow Techniques", answer, "Cultivation methods depend on context, equipment, plant response, local rules, and operator experience.", index, "A cultivation practice.")),
  ...environmentTargets.flatMap((target, targetIndex) => monitoringActions.map((action, actionIndex) => puzzle("Environmental Control", `${action} ${target}`, "Environmental measurements work best as trends interpreted alongside direct plant observation.", targetIndex * monitoringActions.length + actionIndex, "A grow-room measurement practice."))),
];

const anatomy = [
  "Apical Meristem", "Axillary Bud", "Trichome Head", "Trichome Stalk", "Sugar Leaf", "Bract", "Calyx", "Pistil", "Stigma", "Fan Leaf", "Taproot", "Lateral Root", "Lateral Branch", "Internode", "Node", "Petiole", "Leaflet", "Root Hair", "Vascular Tissue", "Xylem", "Phloem", "Cotyledon", "Hypocotyl", "Shoot Apex", "Inflorescence", "Pollen Sac", "Anther", "Glandular Trichome", "Capitate Stalked Trichome", "Cystolithic Hair", "Apical Dominance", "Phototropism", "Gravitropism", "Transpiration", "Stomata", "Chlorophyll", "Senescence", "Root Crown", "Primary Stem", "Secondary Metabolite",
];
const anatomyPuzzles = anatomy.map((answer, index) => puzzle("Plant Anatomy", answer, "Botanical terms are presented carefully; informal cannabis usage may differ from strict plant-science definitions.", index, "A cannabis plant structure or process."));

const breedingTerms = [
  "Filial Generation", "Backcross", "Outcross", "Inbreeding", "Line Breeding", "Phenotype", "Genotype", "Selection Pressure", "Trait Segregation", "Reversal", "Pollen Donor", "Recurrent Parent", "Progeny Test", "Open Pollination", "Stabilized Line", "Sibling Cross", "Self Pollination", "Feminized Seed", "Regular Seed", "Homozygous Trait", "Heterozygous Trait", "Dominant Allele", "Recessive Allele", "Quantitative Trait", "Polygenic Trait", "Population Size", "Genetic Bottleneck", "Hybrid Vigor", "Inbreeding Depression", "Combining Ability", "Maternal Effect", "Paternal Contribution", "Linkage Drag", "Recombination", "Segregating Population", "Selection Index", "Test Cross", "Recurrent Selection", "Family Selection", "Lineage Documentation",
];
const breedingTraits = ["Aroma", "Resin", "Vigor", "Plant Structure", "Flowering Time", "Internodal Spacing", "Stress Tolerance", "Yield", "Color", "Trichome Density", "Rooting Speed", "Pest Resilience", "Stem Strength", "Maturity", "Morphology", "Chemotype"];
const selectionActions = ["Selection", "Evaluation", "Scoring", "Tracking", "Comparison", "Documentation", "Screening"];
const breedingPuzzles = [
  ...breedingTerms.map((answer, index) => puzzle("Breeding Terminology", answer, "Breeding outcomes are probabilistic and depend on population size, parent selection, environment, and record quality.", index, "A genetics or breeding term.")),
  ...breedingTraits.flatMap((trait, traitIndex) => selectionActions.map((action, actionIndex) => puzzle("Breeder's Bench", `${trait} ${action}`, "Reliable selection compares repeated observations and keeps environmental effects in view.", traitIndex * selectionActions.length + actionIndex, "A trait-selection practice."))),
];

const huntSubjects = ["Keeper", "Clone", "Progeny", "Sibling", "Male", "Female", "Phenotype", "Genotype", "Seedling", "Candidate", "Donor", "Mother Plant"];
const huntActions = ["Selection", "Testing", "Evaluation", "Comparison", "Scoring", "Tracking", "Labeling", "Documentation"];
const huntCore = ["Stem Rub", "Clone Testing", "Resin Coverage", "Internodal Spacing", "Early Vigor", "Stress Testing", "Post Cure Evaluation", "Repeated Trials", "Male Selection", "Keeper Selection", "Blind Sensory Review", "Replicated Grow Trial", "Trait Correlation", "Environmental Replication", "Culling Criteria", "Selection Rubric", "Population Notes", "Clone Backup", "Unique Plant Identifier", "Harvest Sample Label"];
const huntPuzzles = [
  ...huntCore.map((answer, index) => puzzle("Phenohunting", answer, "Phenohunting benefits from consistent labels, clones, repeated trials, and separating observation from hype.", index, "A selection or evaluation practice.")),
  ...huntSubjects.flatMap((subject, subjectIndex) => huntActions.map((action, actionIndex) => puzzle("Phenohunting", `${subject} ${action}`, "Selection quality improves when observations are repeatable and records remain connected to the correct plant.", subjectIndex * huntActions.length + actionIndex, "A phenohunt workflow phrase."))),
];

const equipment = [
  "Oscillating Fan", "Carbon Filter", "Inline Fan", "Dehumidifier", "Humidifier", "Drip Irrigation", "Fabric Pot", "Environmental Controller", "LED Grow Light", "Trellis Net", "Microscope", "Drying Rack", "Light Meter", "Quantum Sensor", "Infrared Thermometer", "Data Logger", "Irrigation Manifold", "Pressure Regulator", "Backflow Preventer", "Air Stone", "Water Pump", "Reservoir Chiller", "Dosing Pump", "Mixing Tank", "Propagation Dome", "Clone Tray", "Rooting Plug", "Grow Tent", "Rolling Bench", "Air Conditioner", "Mini Split", "Desiccant Dehumidifier", "HEPA Filter", "Wet Dry Vacuum", "Pruning Shears", "Label Printer", "Hand Lens", "Digital Scale", "Rosin Press", "Wash Vessel", "Freeze Dryer", "Micron Bag", "Collection Paddle", "Parchment Paper", "Cold Room", "Curing Container", "Hygrometer", "Moisture Meter", "Trim Tray", "Personal Protective Equipment",
];
const equipmentPuzzles = equipment.map((answer, index) => puzzle("Grow Equipment", answer, "Equipment should be selected, operated, and maintained according to its documentation and local safety requirements.", index, "A grow, harvest, or solventless tool."));

const harvestHash = [
  "Whole Plant Hang", "Dry Trim", "Wet Trim", "Slow Dry", "Curing Jar", "Moisture Equilibrium", "Burping Jars", "Trichome Maturity", "Harvest Window", "Cold Cure", "Drying Temperature", "Drying Humidity", "Air Movement", "Branch Snap Myth", "Water Activity", "Post Harvest Handling", "Aroma Preservation", "Light Protection", "Lot Tracking", "Final Quality Review", "Bubble Hash", "Dry Sift", "Flower Rosin", "Hash Rosin", "Ice Water Extraction", "Micron Bag", "Cold Room", "Press Temperature", "Rosin Bag", "Static Sift", "Fresh Frozen Material", "Wash Water Temperature", "Agitation Control", "Resin Collection", "Freeze Drying", "Air Drying Hash", "Temple Ball", "Full Melt", "Food Grade Hash", "Press Pressure", "Plate Temperature", "Rosin Flow", "Bag Blowout", "Directional Fold", "Collection Surface", "Cold Storage", "Hash Grading", "Trichome Separation", "Contaminant Inspection", "Tool Sanitation",
];
const harvestPuzzles = harvestHash.map((answer, index) => puzzle(index < 20 ? "Harvest and Cure" : "Solventless and Hash", answer, "Post-harvest and solventless results depend on material, environment, handling, sanitation, and careful documentation.", index, "A harvest, cure, or solventless term."));

const growerLeads = ["Environment", "Observation", "Clean Tools", "Good Records", "Healthy Roots", "Patient Drying", "Consistent Labels", "Stable Conditions", "Plant Response", "Repeatable Trials", "Clone Backups", "Honest Notes", "Careful Selection", "Clean Water", "Airflow", "Calibration"];
const growerTails = ["Before Nutrients", "Before Hype", "Build Better Runs", "Protect the Hunt", "Reveal the Pattern", "Beat Guesswork", "Support the Canopy", "Improve Selection", "Preserve the Keeper", "Guide the Next Run"];
const sayings = growerLeads.flatMap((lead, leadIndex) => growerTails.map((tail, tailIndex) => puzzle("Grower Sayings", `${lead} ${tail}`, "An original game phrase celebrating observation, records, consistency, and respect for the plant.", leadIndex * growerTails.length + tailIndex, "An original grower-minded saying.")));

const communityLeads = ["Growers Share", "Breeders Document", "Smokers Respect", "The GBS Circle Shares", "Community Notes Build", "Curious Growers Ask", "Patient Hunters Find", "Better Records Create", "Respectful Debate Grows", "Open Learning Supports"];
const communityTails = ["Knowledge Freely", "The Full Story", "Better Questions", "Stronger Gardens", "Honest Context", "Responsible Culture", "Shared Understanding", "Plant Respect", "Future Keepers", "Community Memory"];
const communityPuzzles = communityLeads.flatMap((lead, leadIndex) => communityTails.map((tail, tailIndex) => puzzle("GBS Community", `${lead} ${tail}`, "An original community phrase about education, evidence, craft, and respectful cannabis culture.", leadIndex * communityTails.length + tailIndex, "A GBS community phrase.")));

const historyCulture = [
  "Hemp Fiber History", "Cannabis Prohibition", "Medical Cannabis Movement", "Compassionate Use", "Community Organizing", "Cultivar Preservation", "Underground Breeding", "Seed Bank Catalog", "Grow Magazine Archive", "Hashish History", "Traditional Dry Sift", "Regional Cannabis Culture", "Cannabis Tax Stamp", "Legalization Campaign", "Decriminalization", "Social Equity", "Expungement", "Home Grow Rights", "Patient Advocacy", "Cannabis Research", "Botanical Classification", "Drug Policy Reform", "Legacy Grower", "Counterculture Publication", "Cannabis Museum", "Oral History Project", "Genetic Preservation", "Cultural Stewardship", "Responsible Adult Use", "Regulatory Compliance", "Track and Trace", "Possession Limit", "Cultivation License", "Testing Laboratory", "Product Recall", "Child Resistant Package", "Public Consumption Rule", "Local Ordinance", "Cannabis Education", "Harm Reduction",
];
const historyPuzzles = historyCulture.map((answer, index) => puzzle("History and Culture", answer, "Cannabis history and policy differ by place and period; this game avoids reducing complex movements to folklore.", index, "A history, policy, or culture term."));

const all = [
  ...cultivarPuzzles,
  ...terpenePuzzles,
  ...cannabinoidPuzzles,
  ...cultivationPuzzles,
  ...anatomyPuzzles,
  ...breedingPuzzles,
  ...huntPuzzles,
  ...equipmentPuzzles,
  ...harvestPuzzles,
  ...sayings,
  ...communityPuzzles,
  ...historyPuzzles,
];

const unique = new Map<string, Puzzle>();
for (const item of all) {
  unique.set(`${item.category}:${item.answer}`, item);
}

export const puzzles = [...unique.values()].map((item, index) => ({
  ...item,
  id: `${item.id}-${index + 1}`,
}));

export const puzzleCategories = [...new Set(puzzles.map((item) => item.category))].sort();

export function puzzlesForMode(mode: string): Puzzle[] {
  if (mode === "breeder") return puzzles.filter((item) => /Breeder|Breeding|Pheno/.test(item.category));
  if (mode === "grower") return puzzles.filter((item) => /Grow|Environment|Harvest|Equipment|Anatomy/.test(item.category));
  if (mode === "strain") return puzzles.filter((item) => item.category === "Cultivar Archive");
  if (mode === "sprint") return puzzles.filter((item) => item.difficulty !== "Breeder Brain");
  return puzzles;
}

export function pickPuzzle(mode: string, excludedIds: string[] = [], seed = Math.random()): Puzzle {
  const pool = puzzlesForMode(mode);
  const fresh = pool.filter((item) => !excludedIds.includes(item.id));
  const candidates = fresh.length ? fresh : pool;
  return candidates[Math.floor(seed * candidates.length) % candidates.length];
}
