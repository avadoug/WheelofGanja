export interface GlossaryEntry {
  term: string;
  group: string;
  definition: string;
  caution?: string;
}

export const glossary: GlossaryEntry[] = [
  { term: "Myrcene", group: "Terpenes", definition: "A terpene found in cannabis and many other plants, often described with earthy, herbal, or musky sensory language.", caution: "Aroma alone does not reliably predict an individual experience." },
  { term: "Limonene", group: "Terpenes", definition: "A citrus-associated terpene that also occurs in citrus peels and other botanicals." },
  { term: "Beta-caryophyllene", group: "Terpenes", definition: "A peppery or woody sesquiterpene that can interact with CB2 receptors, though that fact is not a treatment recommendation." },
  { term: "Pinene", group: "Terpenes", definition: "A family of terpenes commonly associated with pine-like aromas and found across many plant species." },
  { term: "Linalool", group: "Terpenes", definition: "A floral terpene present in lavender and other plants as well as some cannabis chemovars." },
  { term: "Phenotype", group: "Breeding", definition: "The observable traits produced by the interaction of a plant's genotype and its environment." },
  { term: "Genotype", group: "Breeding", definition: "The genetic constitution of an organism; not every genetic difference produces an obvious visible trait." },
  { term: "F1", group: "Breeding", definition: "The first filial generation produced by crossing two parents. Uniformity depends on the parents and breeding context." },
  { term: "F2", group: "Breeding", definition: "The second filial generation, commonly made by crossing or selfing individuals from an F1 population; trait segregation may become more visible." },
  { term: "Backcross", group: "Breeding", definition: "A cross of offspring back to a parent or parent-like recurrent line, often written with BX terminology." },
  { term: "Reversal", group: "Breeding", definition: "Inducing pollen production on a genetically female plant for breeding. Methods and regulations vary." },
  { term: "Feminized seed", group: "Seeds", definition: "Seed produced through breeding methods intended to yield predominantly female plants; no seed lot is a substitute for careful observation." },
  { term: "Regular seed", group: "Seeds", definition: "Seed not produced through feminization, ordinarily capable of producing male or female plants." },
  { term: "Landrace", group: "History", definition: "A locally adapted plant population shaped over time in a region. The label is sometimes used loosely in marketing." },
  { term: "Chemovar", group: "Science", definition: "A way to describe plant material by chemical profile rather than relying only on a cultivar name." },
  { term: "Dryback", group: "Cultivation", definition: "The reduction in substrate water content between irrigation events, tracked as part of an irrigation strategy." },
  { term: "VPD", group: "Environment", definition: "Vapor pressure deficit: a calculated relationship between temperature, humidity, and the air's drying demand." },
  { term: "DLI", group: "Lighting", definition: "Daily light integral: the total photosynthetically active light delivered to an area over a day." },
  { term: "SCROG", group: "Training", definition: "Screen of green: training plant branches across a screen or trellis to shape an even canopy." },
  { term: "Topping", group: "Training", definition: "Removing an apical growing tip to alter branching and canopy structure." },
  { term: "Low-stress training", group: "Training", definition: "Shaping a plant through gradual bending or tying with the aim of limiting major tissue damage." },
  { term: "High-stress training", group: "Training", definition: "A broad informal label for training methods that intentionally damage or sharply manipulate tissue." },
  { term: "Rosin", group: "Solventless", definition: "A concentrate produced by applying heat and pressure to plant material or hash without adding extraction solvent." },
  { term: "Trichome", group: "Anatomy", definition: "A plant epidermal outgrowth. Glandular trichomes on cannabis can produce and hold resinous compounds." },
  { term: "Senescence", group: "Plant Science", definition: "A regulated phase of aging and tissue change; leaf color alone is not a complete diagnostic tool." },
  { term: "Apical dominance", group: "Plant Science", definition: "The tendency of a primary shoot to suppress growth of lower shoots through plant signaling." },
  { term: "Pistil", group: "Anatomy", definition: "A botanical term for the female reproductive structure. In cannabis conversation it is often imprecisely used for the visible stigmas." },
  { term: "Bract", group: "Anatomy", definition: "A modified leaf associated with a flower; cannabis bracts can bear dense glandular trichomes." },
  { term: "EC", group: "Cultivation", definition: "Electrical conductivity, used as an indirect measure of dissolved ionic concentration in a solution." },
  { term: "PPFD", group: "Lighting", definition: "Photosynthetic photon flux density: the rate of photosynthetically active photons reaching a surface." },
];
