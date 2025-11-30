// Global start game function - define early so it's always available
function startGame() {
  try { console.log('[DEBUG] startGame() called'); } catch (e) {}
  const gs = document.getElementById('game-screen');
  if (gs && !gs.classList.contains('hidden')) return; // already visible
  if (typeof showScreen === 'function') showScreen("game-screen");
  if (typeof refreshStats === 'function') refreshStats();
  if (typeof refreshGatheringMenu === 'function') refreshGatheringMenu();
  if (typeof refreshMagicMenu === 'function') refreshMagicMenu();
  if (typeof refreshCraftingMenu === 'function') refreshCraftingMenu();
  if (typeof refreshStructuresMenu === 'function') refreshStructuresMenu();
  if (typeof refreshInventory === 'function') refreshInventory();
  if (typeof addLog === 'function') addLog("Game started!");
  try { document.body.setAttribute('data-start-clicked', String(Date.now())); } catch(e){}
  
  // Re-attach event listeners after game screen is shown (in case they weren't attached initially)
  setTimeout(() => {
    attachMenuEventListeners();
  }, 100);
}

// Function to attach menu event listeners (can be called multiple times safely)
let menuDelegationAttached = false;
function attachMenuEventListeners() {
  // Idle Navigation - use event delegation as fallback (only attach once)
  if (!menuDelegationAttached) {
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
      gameScreen.addEventListener('click', (e) => {
        const target = e.target;
        if (!target) return;
        
        if (target.id === 'btn-gathering') {
          console.log('[DEBUG] Gathering button clicked (delegated)');
          e.preventDefault();
          e.stopPropagation();
          showIdleMenu("gathering-menu");
          refreshGatheringMenu();
        } else if (target.id === 'btn-magic') {
          console.log('[DEBUG] Magic button clicked (delegated)');
          e.preventDefault();
          e.stopPropagation();
          showIdleMenu("magic-menu");
          refreshMagicMenu();
        } else if (target.id === 'btn-crafting') {
          console.log('[DEBUG] Crafting button clicked (delegated)');
          e.preventDefault();
          e.stopPropagation();
          showIdleMenu("crafting-menu");
          refreshCraftingMenu();
        } else if (target.id === 'btn-structures') {
          console.log('[DEBUG] Structures button clicked (delegated)');
          e.preventDefault();
          e.stopPropagation();
          showIdleMenu("structures-menu");
          refreshStructuresMenu();
        } else         if (target.id === 'btn-inventory') {
          console.log('[DEBUG] Inventory button clicked (delegated)');
          e.preventDefault();
          e.stopPropagation();
          showIdleMenu("inventory-menu");
          refreshInventory();
        } else if (target.id === 'btn-combat') {
          console.log('[DEBUG] Combat button clicked (delegated)');
          e.preventDefault();
          e.stopPropagation();
          showAreaSelection();
        }
      });
      menuDelegationAttached = true;
      console.log('[DEBUG] Menu event delegation attached');
    }
  }
}

// Game State
const gameState = {
  player: {
    hp: 20,
    maxHp: 20,
    level: 1,
    xp: 0,
    attack: 2,
    defense: 0,
    xpToNext: 10
  },
  resources: {
    wood: 0,
    meat: 0,
    water: 0,
    plants: 0,
    stone: 0,
    hide: 0,
    ritualStones: 0,
    scrapMetal: 0,
    crystal: 0,
    bone: 0,
    charcoal: 0,
    ore: 0,
    clay: 0,
    fiber: 0,
    sulfur: 0,
    gold: 0,
    obsidian: 0,
    essence: 0,
    void: 0
  },
  capacity: {
    current: 0,
    max: 100 // expandable through items/structures
  },
  inventory: {},
  equipped: {
    weapon: null,
    armor: null
  },
  unlockedAreas: [0], // Start with area 0
  unlockedIdleFeatures: [],
  currentArea: 0,
  areaProgress: {},
  gameTime: Date.now(),
  settings: {
    volume: 50,
    autoSave: true
  },
  activeActions: {}, // Track active gathering actions
  autoGenerators: {}, // Track auto-generation
  passiveHealing: {
    amount: 1, // HP restored per tick
    interval: 5000, // milliseconds between healing ticks
    structuresBuilt: [], // track structures that modified healing
    intervalId: null
  },
  // Track upgrades/levels for built structures
  structureLevels: {},
  combat: {
    active: false,
    paused: false,
    enemies: [],
    playerX: 50,
    scrollX: 0,
    lastFrame: 0,
    lastEnemyDamage: 0,
    floatingTexts: [],
    particles: [],
    projectiles: []
  }
};
// Game Data
const areas = [
  { name: "Forest Path", enemies: 5, boss: false, unlockIdle: null, unlockables: [], mapLength: 2000, spawnRate: 2000, background: "forest", unlockedMaterial: null, signatureMechanic: null },
  { name: "Dark Woods", enemies: 8, boss: true, unlockIdle: "autoWood", unlockables: [], mapLength: 2200, spawnRate: 1800, background: "woods", unlockedMaterial: "charcoal", signatureMechanic: "lowVisibility" },
  { name: "Mountain Trail", enemies: 10, boss: false, unlockIdle: "stoneGathering", unlockables: [], mapLength: 2500, spawnRate: 2000, background: "mountain", unlockedMaterial: "ore", signatureMechanic: "windResistance" },
  { name: "River Crossing", enemies: 12, boss: false, unlockIdle: "waterGathering", unlockables: [], mapLength: 2600, spawnRate: 1800, background: "river", unlockedMaterial: "clay", signatureMechanic: "waterHazards" },
  { name: "Plains", enemies: 15, boss: false, unlockIdle: "plantGathering", unlockables: ["boneGathering"], mapLength: 3000, spawnRate: 1600, background: "plains", unlockedMaterial: "fiber", signatureMechanic: "groupSpawning" },
  { name: "Cave System", enemies: 18, boss: false, unlockIdle: "ritualStoneGathering", unlockables: ["ritualStoneGathering"], mapLength: 3200, spawnRate: 1700, background: "cave", unlockedMaterial: "sulfur", signatureMechanic: "darkness" },
  { name: "Ancient Temple", enemies: 20, boss: true, unlockIdle: "advancedCrafting", unlockables: ["advancedCrafting", "weaponUpgrades"], mapLength: 3500, spawnRate: 1500, background: "temple", unlockedMaterial: "gold", signatureMechanic: "ritualPower" },
  { name: "Shadow Realm", enemies: 25, boss: false, unlockIdle: null, unlockables: ["scrapGathering"], mapLength: 3800, spawnRate: 1400, background: "shadow", unlockedMaterial: "obsidian", signatureMechanic: "shadowClones" },
  { name: "Magical Tower", enemies: 30, boss: false, unlockIdle: "powerfulUpgrades", unlockables: ["crystalGathering"], mapLength: 4200, spawnRate: 1300, background: "tower", unlockedMaterial: "essence", signatureMechanic: "manaSurges" },
  { name: "Final Sanctum", enemies: 35, boss: true, unlockIdle: null, unlockables: [], mapLength: 5000, spawnRate: 1200, background: "sanctum", unlockedMaterial: "void", signatureMechanic: "voidCorruption" }
];

// ASCII Art for characters
const playerASCII = [
  "  O  ",
  " /|\\ ",
  " / \\ "
];

const enemyASCII = {
  "Goblin": [
    "  o  ",
    " /|\\ ",
    " / \\ "
  ],
  "Orc": [
    "  O  ",
    " /|\\ ",
    " / \\ "
  ],
  "Shadow": [
    "  ~  ",
    " /~\\ ",
    " / \\ "
  ],
  "Boss": [
    "  ██  ",
    " ████ ",
    " █  █ ",
    " ████ "
  ],
  "Wolf": [
    "  w  ",
    " /|\\ ",
    " / \\ "
  ],
  "Dark Stalker": [
    "  D  ",
    " /|\\ ",
    " / \\ "
  ],
  "Mountain Troll": [
    "  T  ",
    " /|\\ ",
    " / \\ "
  ],
  "River Serpent": [
    "  S  ",
    " /|\\ ",
    " / \\ "
  ],
  "Plains Raider": [
    "  R  ",
    " /|\\ ",
    " / \\ "
  ],
  "Cave Bat": [
    "  B  ",
    " /|\\ ",
    " / \\ "
  ],
  "Temple Guardian": [
    "  G  ",
    " /|\\ ",
    " / \\ "
  ],
  "Shadow Wraith": [
    "  W  ",
    " /~\\ ",
    " / \\ "
  ],
  "Tower Mage": [
    "  M  ",
    " /|\\ ",
    " / \\ "
  ],
  "Void Spawn": [
    "  V  ",
    " /∞\\ ",
    " / \\ "
  ],
  "Forest Guardian": [
    "  F  ",
    " /|\\ ",
    " / \\ "
  ],
  "Ancient Golem": [
    "  A  ",
    " /|\\ ",
    " / \\ "
  ],
  "Void Lord": [
    "  ∞  ",
    " /∞\\ ",
    " /∞\\ "
  ]
};

// Simple ASCII art for items/recipes (used in inventory and crafting/shop)
const itemAsciiArt = {
  // Swords
  woodenSword: [` /\\ `, `/==\\`, ` || `],
  stoneSword: [` /\\ `, `/##\\`, ` || `],
  longsword: [` /\\ `, `|===|`, ` |||| `],
  claymore: [` /\\ `, `|###|`, `  ||  `],
  
  // Short weapons
  dagger: [` / `, `|=|`, ` | `],
  ironDagger: [` / `, `|#|`, ` | `],
  handAxe: [`  >> `, ` \\|/ `, `  |  `],
  mace: [` ___ `, `|###|`, `  |  `],
  
  huntingSling: [` ( ) `, `/ | \\`, `  '  `],
  spearThrower: [` /|\\`, ` / \\`, `  |  `],
  crystalRecurve: [` <* > `, ` /|\\ `, `  |  `],
  flameBow: [` <*> `, ` /|\\ `, `  *  `],
  
  heavyClub: [`  __ `, ` /__\\`, `  || `],
  throwingSpear: [` ->--`, `  |  `, `  ^  `],
  metalMaul: [` [##] `, `  ||  `, `  ||  `],
  warhammer: [` [###] `, `  |||  `, `  |||  `],
  obsidianBlade: [` /\\ `, `|∞∞∞|`, `  ||  `],
  
  woodenShield: [` [ ] `, ` | | `, `     `],
  stoneShield: [` [#] `, ` |#| `, `     `],
  metalShield: [` [M] `, ` |M| `, `     `],
  oreShield: [` [O] `, ` |O| `, `     `],
  obsidianShield: [` [∞] `, ` |∞| `, `     `],
  
  leatherArmor: [` /\\ `, `|--|`, ` || `],
  boneArmor: [` /\\ `, `|==|`, ` || `],
  magicArmor: [` <M> `, `|MMM|`, ` || `],
  oreArmor: [` <O> `, `|OOO|`, ` || `],
  voidArmor: [` <∞> `, `|∞∞∞|`, ` || `],
  
  healingPotion: [` ~~~ `, `(+ )`, ` ~~~ `],
  strongHealingPotion: [` ~~~ `, `(++ )`, ` ~~~ `],
  essencePotion: [` ~~~ `, `(+*)`, ` ~~~ `],
  
  backpack: [` [B] `, `| B |`, `     `],
  reinforcedBackpack: [` [R] `, `| R |`, `     `],
  magicSatchel: [` [*] `, `| * |`, `     `],
  
  gatherRitualStones: [`  ▲  `, ` ▲▲ `, `  ▲  `],
  
  // Resources
  wood: [`  /// `, ` /|\\ `, `  |  `],
  meat: [`  ><> `, ` ( ) `, `  ~~ `],
  water: [`  ~~~ `, ` ~~~ `, `  ~~~ `],
  plants: [`  ,,, `, ` /|\\ `, `  |  `],
  stone: [`  []  `, ` [ ] `, `     `],
  hide: [` /\\ `, `| H |`, `     `],
  ritualStones: [`  ▲  `, ` ▲▲ `, `  ▲  `],
  scrapMetal: [`  ::: `, ` :M: `, `  ::: `],
  crystal: [`  <>  `, ` <*> `, `  <>  `],
  bone: [`  ||  `, ` /\\ `, `  ||  `],
  charcoal: [`  ███ `, ` ███ `, `  ███ `],
  ore: [`  ■■  `, ` ■■■ `, `  ■■  `],
  clay: [`  ▒▒▒ `, ` ▒▒▒ `, `  ▒▒▒ `],
  fiber: [`  ░░░ `, ` ░░░░ `, `  ░░░ `],
  sulfur: [`  ⚡⚡  `, ` ⚡⚡⚡ `, `  ⚡⚡  `],
  gold: [`  ◊◊  `, ` ◊◊◊ `, `  ◊◊  `],
  obsidian: [`  ∞∞  `, ` ∞∞∞ `, `  ∞∞  `],
  essence: [`  ◈◈  `, ` ◈◈◈ `, `  ◈◈  `],
  void: [`  ◆◆  `, ` ◆◆◆ `, `  ◆◆  `],
  
  // Projectiles
  projectile_sling: [`-->`, `  `],
  projectile_spear: [`->>`, ` ` ],
  projectile_arrow: [`->`, ` `],
  
  default: [` [ ] `, `  ?  `, `     `]
};

// Friendly display names for resources (used in inventory/resource cards)
const resourceDisplayNames = {
  wood: 'Wood',
  meat: 'Meat',
  water: 'Water',
  plants: 'Plants',
  stone: 'Stone',
  hide: 'Hide',
  ritualStones: 'Ritual Stones',
  scrapMetal: 'Scrap Metal',
  crystal: 'Crystal',
  bone: 'Bone',
  charcoal: 'Charcoal',
  ore: 'Ore',
  clay: 'Clay',
  fiber: 'Fiber',
  sulfur: 'Sulfur',
  gold: 'Gold',
  obsidian: 'Obsidian',
  essence: 'Essence',
  void: 'Void Essence'
};

function getAsciiForId(id, obj) {
  if (!id) return itemAsciiArt.default;
  if (itemAsciiArt[id]) return itemAsciiArt[id];
  // Try to use type/weaponType heuristics
  if (obj && obj.weaponType) {
    if (obj.weaponType === 'bow') return [` )-->`, ` /|  `, `     `];
    if (obj.weaponType === 'heavy') return [`  ## `, ` /|| `, `  || `];
    if (obj.weaponType === 'shield') return [` [ ] `, ` | | `, `     `];
  }
  if (obj && obj.type === 'consumable') return [` ~~~ `, `( * )`, ` ~~~ `];
  // Fallback: use initials
  const name = (obj && obj.name) ? obj.name : id;
  const initials = name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  return [` [${initials}] `, `     `, `     `];
}

const enemyTypes = [
  // Generic enemies (can appear in any area)
  { name: "Goblin", hp: 10, attack: 1, defense: 0, xp: 2, width: 30, height: 40, ascii: enemyASCII["Goblin"], areaSpecific: false },
  { name: "Orc", hp: 20, attack: 2, defense: 1, xp: 5, width: 35, height: 45, ascii: enemyASCII["Orc"], areaSpecific: false },
  { name: "Shadow", hp: 15, attack: 3, defense: 0, xp: 4, width: 25, height: 35, ascii: enemyASCII["Shadow"], areaSpecific: false },
  
  // Area-specific enemies
  { name: "Wolf", hp: 12, attack: 2, defense: 0, xp: 3, width: 30, height: 40, ascii: enemyASCII["Wolf"], areaSpecific: true, areas: [0] },
  { name: "Dark Stalker", hp: 18, attack: 3, defense: 1, xp: 4, width: 28, height: 38, ascii: enemyASCII["Dark Stalker"], areaSpecific: true, areas: [1] },
  { name: "Mountain Troll", hp: 35, attack: 4, defense: 2, xp: 8, width: 40, height: 50, ascii: enemyASCII["Mountain Troll"], areaSpecific: true, areas: [2] },
  { name: "River Serpent", hp: 22, attack: 3, defense: 0, xp: 5, width: 35, height: 45, ascii: enemyASCII["River Serpent"], areaSpecific: true, areas: [3] },
  { name: "Plains Raider", hp: 25, attack: 4, defense: 1, xp: 6, width: 32, height: 42, ascii: enemyASCII["Plains Raider"], areaSpecific: true, areas: [4] },
  { name: "Cave Bat", hp: 8, attack: 2, defense: 0, xp: 3, width: 20, height: 30, ascii: enemyASCII["Cave Bat"], areaSpecific: true, areas: [5] },
  { name: "Temple Guardian", hp: 40, attack: 5, defense: 3, xp: 10, width: 45, height: 55, ascii: enemyASCII["Temple Guardian"], areaSpecific: true, areas: [6] },
  { name: "Shadow Wraith", hp: 30, attack: 5, defense: 1, xp: 8, width: 30, height: 40, ascii: enemyASCII["Shadow Wraith"], areaSpecific: true, areas: [7] },
  { name: "Tower Mage", hp: 35, attack: 6, defense: 2, xp: 9, width: 35, height: 45, ascii: enemyASCII["Tower Mage"], areaSpecific: true, areas: [8] },
  { name: "Void Spawn", hp: 45, attack: 7, defense: 2, xp: 12, width: 40, height: 50, ascii: enemyASCII["Void Spawn"], areaSpecific: true, areas: [9] },
  
  // Bosses
  { name: "Forest Guardian", hp: 120, attack: 6, defense: 3, xp: 30, width: 55, height: 65, ascii: enemyASCII["Forest Guardian"], isBoss: true, areas: [1] },
  { name: "Ancient Golem", hp: 200, attack: 8, defense: 5, xp: 50, width: 60, height: 70, ascii: enemyASCII["Ancient Golem"], isBoss: true, areas: [6] },
  { name: "Void Lord", hp: 300, attack: 10, defense: 6, xp: 100, width: 65, height: 75, ascii: enemyASCII["Void Lord"], isBoss: true, areas: [9] }
];

const gatheringActions = [
  { id: "gatherWood", name: "Gather Wood", time: 5000, cost: {}, reward: { wood: 1 }, xp: 1 },
  { id: "gatherMeat", name: "Hunt Meat", time: 8000, cost: {}, reward: { meat: 1 }, xp: 2 },
  { id: "gatherWater", name: "Collect Water", time: 6000, cost: {}, reward: { water: 1 }, xp: 1, unlock: "waterGathering" },
  { id: "gatherPlants", name: "Forage Plants", time: 7000, cost: {}, reward: { plants: 1 }, xp: 1, unlock: "plantGathering" },
  { id: "gatherStone", name: "Mine Stone", time: 10000, cost: {}, reward: { stone: 1 }, xp: 2, unlock: "stoneGathering" },
  { id: "gatherHide", name: "Skin Hide", time: 9000, cost: { meat: 1 }, reward: { hide: 1 }, xp: 2 },
  { id: "gatherRitualStones", name: "Harvest Ritual Stones", time: 15000, cost: {}, reward: { ritualStones: 1 }, xp: 5, unlock: "ritualStoneGathering" },
  { id: "gatherBone", name: "Collect Bones", time: 8000, cost: {}, reward: { bone: 1 }, xp: 1, unlock: "boneGathering" },
  { id: "gatherCrystal", name: "Mine Crystals", time: 12000, cost: {}, reward: { crystal: 1 }, xp: 3, unlock: "crystalGathering" },
  { id: "gatherScrapMetal", name: "Salvage Scrap Metal", time: 11000, cost: {}, reward: { scrapMetal: 1 }, xp: 2, unlock: "scrapGathering" },
  { id: "gatherCharcoal", name: "Harvest Charcoal", time: 9000, cost: {}, reward: { charcoal: 1 }, xp: 2, unlock: "charcoalGathering" },
  { id: "gatherOre", name: "Mine Ore", time: 13000, cost: {}, reward: { ore: 1 }, xp: 3, unlock: "oreGathering" },
  { id: "gatherClay", name: "Dig Clay", time: 10000, cost: {}, reward: { clay: 1 }, xp: 2, unlock: "clayGathering" },
  { id: "gatherFiber", name: "Harvest Fiber", time: 8000, cost: {}, reward: { fiber: 1 }, xp: 2, unlock: "fiberGathering" },
  { id: "gatherSulfur", name: "Collect Sulfur", time: 12000, cost: {}, reward: { sulfur: 1 }, xp: 3, unlock: "sulfurGathering" },
  { id: "gatherGold", name: "Pan for Gold", time: 15000, cost: {}, reward: { gold: 1 }, xp: 4, unlock: "goldGathering" },
  { id: "gatherObsidian", name: "Cut Obsidian", time: 14000, cost: {}, reward: { obsidian: 1 }, xp: 4, unlock: "obsidianGathering" },
  { id: "gatherEssence", name: "Extract Essence", time: 16000, cost: {}, reward: { essence: 1 }, xp: 5, unlock: "essenceGathering" },
  { id: "gatherVoid", name: "Harvest Void Essence", time: 20000, cost: {}, reward: { void: 1 }, xp: 6, unlock: "voidGathering" }
];

const craftingRecipes = [
  // Basic Weapons (speed: higher = faster DPS)
  { id: "woodenSword", name: "Wooden Sword", cost: { wood: 5 }, type: "weapon", weaponType: "sword", stats: { attack: 2, speed: 1.0 }, description: "Basic melee weapon" },
  { id: "stoneSword", name: "Stone Sword", cost: { wood: 3, stone: 5 }, type: "weapon", weaponType: "sword", stats: { attack: 4, speed: 0.95 }, description: "Reliable sword with stone edge" },
  { id: "longsword", name: "Longsword", cost: { wood: 5, ore: 8, charcoal: 3 }, type: "weapon", weaponType: "sword", stats: { attack: 6, speed: 0.85 }, description: "A powerful two-handed sword", unlock: "oreGathering" },
  { id: "claymore", name: "Claymore", cost: { ore: 12, coal: 5, gold: 2 }, type: "weapon", weaponType: "sword", stats: { attack: 9, speed: 0.75 }, description: "Massive greatsword for maximum damage", unlock: "goldGathering" },
  
  // Short weapons (one-handed, work with shields)
  { id: "dagger", name: "Dagger", cost: { wood: 2, stone: 3 }, type: "weapon", weaponType: "shortsword", stats: { attack: 1.5, speed: 1.5 }, description: "Quick and deadly, pairs well with shields" },
  { id: "ironDagger", name: "Iron Dagger", cost: { ore: 5, charcoal: 2 }, type: "weapon", weaponType: "shortsword", stats: { attack: 3, speed: 1.6 }, description: "Sharpened iron blade", unlock: "oreGathering" },
  { id: "handAxe", name: "Hand Axe", cost: { wood: 4, stone: 6 }, type: "weapon", weaponType: "shortsword", stats: { attack: 2.5, speed: 1.2 }, description: "Small and efficient axe" },
  { id: "mace", name: "Mace", cost: { ore: 6, stone: 4 }, type: "weapon", weaponType: "shortsword", stats: { attack: 3.5, speed: 1.0 }, description: "Crushing weapon effective against armor", unlock: "oreGathering" },
  
  // Bows (fast, ranged, lower damage)
  { id: "huntingSling", name: "Hunting Sling", cost: { wood: 8, hide: 2 }, type: "weapon", weaponType: "bow", stats: { attack: 3, speed: 1.3, range: 220 }, description: "A simple sling for hunting small prey", projectile: "projectile_sling" },
  { id: "spearThrower", name: "Spear Thrower", cost: { wood: 5, stone: 8, hide: 3 }, type: "weapon", weaponType: "bow", stats: { attack: 5, speed: 1.2, range: 320 }, description: "A device that increases thrown spear range and power", projectile: "projectile_spear" },
  { id: "crystalRecurve", name: "Crystal Recurve", cost: { wood: 5, crystal: 5, hide: 4 }, type: "weapon", weaponType: "bow", stats: { attack: 7, speed: 1.4, range: 420 }, description: "A reinforced recurve with crystal limbs", unlock: "crystalGathering", projectile: "projectile_arrow" },
  { id: "flameBow", name: "Flame Bow", cost: { essence: 3, charcoal: 5, fiber: 4 }, type: "weapon", weaponType: "bow", stats: { attack: 8, speed: 1.3, range: 380 }, description: "Bow enchanted with fire essence", unlock: "essenceGathering", projectile: "projectile_arrow" },
  
  // Heavy Weapons (slow, high damage)
  { id: "heavyClub", name: "Heavy Club", cost: { wood: 10, stone: 3 }, type: "weapon", weaponType: "heavy", stats: { attack: 6, speed: 0.7 }, description: "A blunt club designed to stagger foes" },
  { id: "throwingSpear", name: "Throwing Spear", cost: { wood: 8, stone: 10, bone: 2 }, type: "weapon", weaponType: "heavy", stats: { attack: 9, speed: 0.6 }, description: "A heavy spear optimized for throwing", unlock: "boneGathering" },
  { id: "metalMaul", name: "Metal Maul", cost: { scrapMetal: 8, stone: 5, wood: 6 }, type: "weapon", weaponType: "heavy", stats: { attack: 11, speed: 0.5 }, description: "A crushing metal maul", unlock: "scrapGathering" },
  { id: "warhammer", name: "Warhammer", cost: { ore: 10, gold: 3, wood: 5 }, type: "weapon", weaponType: "heavy", stats: { attack: 13, speed: 0.6 }, description: "Legendary two-handed hammer", unlock: "goldGathering" },
  { id: "obsidianBlade", name: "Obsidian Blade", cost: { obsidian: 8, essence: 2, bone: 4 }, type: "weapon", weaponType: "heavy", stats: { attack: 14, speed: 0.65 }, description: "Dark and sinister, cuts through defenses", unlock: "obsidianGathering" },
  
  // Shields (defense, work with short weapons and one-handed weapons)
  { id: "woodenShield", name: "Wooden Shield", cost: { wood: 12, hide: 2 }, type: "weapon", weaponType: "shield", stats: { defense: 3 }, description: "Basic protection shield" },
  { id: "stoneShield", name: "Stone Shield", cost: { wood: 8, stone: 12, hide: 3 }, type: "weapon", weaponType: "shield", stats: { defense: 5 }, description: "Heavy stone shield for more protection" },
  { id: "metalShield", name: "Metal Shield", cost: { scrapMetal: 10, stone: 8, hide: 4 }, type: "weapon", weaponType: "shield", stats: { defense: 7 }, description: "Reinforced metal shield blocks more damage", unlock: "scrapGathering" },
  { id: "oreShield", name: "Ore Shield", cost: { ore: 12, gold: 2, hide: 5 }, type: "weapon", weaponType: "shield", stats: { defense: 9 }, description: "Heavy ore shield with excellent defense", unlock: "oreGathering" },
  { id: "obsidianShield", name: "Obsidian Shield", cost: { obsidian: 10, essence: 3, void: 1 }, type: "weapon", weaponType: "shield", stats: { defense: 11 }, description: "A shield of pure void, blocks almost anything", unlock: "obsidianGathering" },
  
  // Armor
  { id: "leatherArmor", name: "Leather Armor", cost: { hide: 5 }, type: "armor", stats: { defense: 2 }, description: "Light protective clothing" },
  { id: "boneArmor", name: "Bone Armor", cost: { hide: 8, bone: 6 }, type: "armor", stats: { defense: 4 }, description: "Armor reinforced with bone plates", unlock: "boneGathering" },
  { id: "magicArmor", name: "Magic Armor", cost: { hide: 5, ritualStones: 5, crystal: 3 }, type: "armor", stats: { defense: 5 }, description: "Enchanted armor with magical resilience", unlock: "advancedCrafting" },
  { id: "oreArmor", name: "Ore Armor", cost: { ore: 10, charcoal: 5, hide: 6 }, type: "armor", stats: { defense: 7 }, description: "Heavy ore plate armor", unlock: "oreGathering" },
  { id: "voidArmor", name: "Void Armor", cost: { obsidian: 8, essence: 5, void: 2 }, type: "armor", stats: { defense: 10 }, description: "Armor woven from void essence, nearly impenetrable", unlock: "voidGathering" },
  
  // Potions and Consumables
  { id: "healingPotion", name: "Healing Potion", cost: { plants: 2, water: 1 }, type: "consumable", effect: { hp: 10 }, description: "Restores 10 HP" },
  { id: "strongHealingPotion", name: "Strong Healing Potion", cost: { plants: 5, water: 3, crystal: 2 }, type: "consumable", effect: { hp: 25 }, description: "Restores 25 HP, made with crystals", unlock: "crystalGathering" },
  { id: "essencePotion", name: "Essence Potion", cost: { essence: 3, plants: 8, water: 5 }, type: "consumable", effect: { hp: 40 }, description: "Restores 40 HP with magical properties", unlock: "essenceGathering" },
  { id: "strengthPotion", name: "Strength Potion", cost: { plants: 5, ore: 3, water: 2 }, type: "consumable", effect: { attack: 5, duration: 30 }, description: "Temporarily increases attack by 5 for 30 seconds", unlock: "oreGathering" },
  { id: "defensePotion", name: "Defense Potion", cost: { plants: 5, stone: 5, water: 2 }, type: "consumable", effect: { defense: 3, duration: 30 }, description: "Temporarily increases defense by 3 for 30 seconds", unlock: null },
  { id: "speedPotion", name: "Speed Potion", cost: { plants: 4, crystal: 2, water: 2 }, type: "consumable", effect: { speed: 0.2, duration: 20 }, description: "Temporarily increases movement and attack speed", unlock: "crystalGathering" },
  
  // Capacity Upgrades (items)
  { id: "backpack", name: "Backpack", cost: { wood: 8, hide: 5 }, type: "capacity", capacityBonus: 50, description: "Increases inventory capacity by 50" },
  { id: "reinforcedBackpack", name: "Reinforced Backpack", cost: { hide: 10, stone: 8, scrapMetal: 3 }, type: "capacity", capacityBonus: 75, description: "Increases inventory capacity by 75", unlock: "scrapGathering" },
  { id: "magicSatchel", name: "Magic Satchel", cost: { essence: 5, fiber: 8, crystal: 4 }, type: "capacity", capacityBonus: 100, description: "Magically enlarged satchel holds more items", unlock: "essenceGathering" }
];

// Enchant effects available for items (applied via magic menu)
const enchantEffects = [
  { id: 'poison', name: 'Poison', description: 'Adds a chance to poison enemies for damage over time', apply: (item) => { item.effect = item.effect || {}; item.effect.poison = { dmg: 1.5, duration: 4 }; } },
  { id: 'lifeSteal', name: 'Life Steal', description: 'Steals a portion of damage as HP', apply: (item) => { item.effect = item.effect || {}; item.effect.lifeSteal = { percent: 0.20 }; } },
  { id: 'freeze', name: 'Freeze', description: 'Small chance to slow enemy movement for a short period', apply: (item) => { item.effect = item.effect || {}; item.effect.freeze = { chance: 0.15, duration: 1.8 }; } },
  { id: 'extraDamage', name: 'Extra Damage', description: 'Flat damage bonus', apply: (item) => { item.stats = item.stats || {}; item.stats.attack = (item.stats.attack || 0) + 3; } },
  { id: 'weaken', name: 'Weaken', description: 'Small chance to reduce enemy defense temporarily', apply: (item) => { item.effect = item.effect || {}; item.effect.weaken = { chance: 0.20, defenseReduction: 2, duration: 3 }; } },
  { id: 'bleed', name: 'Bleed', description: 'Chance to cause bleeding for DOT', apply: (item) => { item.effect = item.effect || {}; item.effect.bleed = { dmg: 2.5, duration: 4 }; } }
];

// Visuals for enchants: icon and color for display
const enchantIcons = {
  poison: { icon: '☠', color: '#a6e' },
  lifeSteal: { icon: '❤', color: '#8f8' },
  freeze: { icon: '❄', color: '#6ef' },
  extraDamage: { icon: '✦', color: '#ffd700' },
  weaken: { icon: '↓', color: '#ffc' },
  bleed: { icon: '✸', color: '#f88' }
};

function getEnchantIconHtml(item) {
  if (!item || !item.enchants) return '';
  return item.enchants.map(eName => {
    const key = Object.keys(enchantIcons).find(k => enchantEffects.find(e => e.name === eName && e.id === k) || k === eName || enchantEffects.find(e=>e.name===eName && e.id===k));
    // best-effort: try to match by id or name
    const iconObj = enchantIcons[key] || Object.values(enchantIcons)[0];
    return `<span class="enchant-badge" title="${eName}" style="background:${iconObj.color};">${iconObj.icon}</span>`;
  }).join('');
}

const structures = [
  // Resource generation structures
  { id: "woodHut", name: "Wood Hut", cost: { wood: 25 }, effect: "autoWood", rate: 5000, resource: "wood", amount: 0.5, unlock: "autoWood" },
  { id: "huntingLodge", name: "Hunting Lodge", cost: { meat: 15 }, effect: "autoMeat", rate: 8000, resource: "meat", amount: 0.5 },
  { id: "waterWell", name: "Water Well", cost: { water: 20 }, effect: "autoWater", rate: 6000, resource: "water", amount: 0.5, unlock: "waterGathering" },
  { id: "garden", name: "Garden", cost: { plants: 10 }, effect: "autoPlants", rate: 7000, resource: "plants", amount: 0.5, unlock: "plantGathering" },
  { id: "quarry", name: "Quarry", cost: { stone: 15 }, effect: "autoStone", rate: 10000, resource: "stone", amount: 0.5, unlock: "stoneGathering" },
  { id: "ritualAltar", name: "Ritual Altar", cost: { ritualStones: 3, stone: 10 }, effect: "autoRitualStones", rate: 15000, resource: "ritualStones", amount: 0.5, unlock: "ritualStoneGathering" },
  
  // Early-game healing structures
  { id: "dwelling", name: "Dwelling", cost: { wood: 5, stone: 2 }, effect: "healing", healAmount: 0.5, healInterval: 8000, unlock: null },
  { id: "herbGarden", name: "Herb Garden", cost: { plants: 8, water: 3 }, effect: "healing", healAmount: 1, healInterval: 6000, unlock: "plantGathering" },
  { id: "meditationCircle", name: "Meditation Circle", cost: { stone: 8, plants: 5 }, effect: "healing", healAmount: 0.75, healInterval: 4000, unlock: null },
  
  // Late-game healing structure
  { id: "healingShrine", name: "Healing Shrine", cost: { ritualStones: 5, stone: 15 }, effect: "healing", healAmount: 2, healInterval: 3000, unlock: "ritualStoneGathering" }
];

// Helper Functions
// Safe element getter: returns the element if found, otherwise returns a lightweight stub
const el = id => {
  const e = document.getElementById(id);
  if (e) return e;
  // Lightweight stub to avoid long chains of null checks during startup
  return {
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    set textContent(v) {},
    get textContent() { return ''; },
    get value() { return ''; },
    style: {},
    appendChild: () => {},
    innerHTML: '',
    scrollTop: 0,
    offsetHeight: 0
  };
};

function addLog(text) {
  const logEl = el("event-log");
  if (logEl) {
    const time = new Date().toLocaleTimeString();
    const newText = `[${time}] ${text}`;
    // Prepend new message
    logEl.textContent = newText + '\n' + logEl.textContent;
    
    // Limit to 50 lines
    const lines = logEl.textContent.split('\n');
    if (lines.length > 50) {
      logEl.textContent = lines.slice(0, 50).join('\n');
    }
    
    // Scroll to top to show latest message
    logEl.scrollTop = 0;
    
    // Force a reflow to ensure the log updates
    logEl.offsetHeight;
  }
}

function refreshStats() {
  el("hp-display").textContent = `${Math.floor(gameState.player.hp)} / ${gameState.player.maxHp}`;
  el("level-display").textContent = gameState.player.level;
  el("attack-display").textContent = gameState.player.attack + (gameState.equipped.weapon ? gameState.equipped.weapon.stats.attack : 0);
  el("defense-display").textContent = gameState.player.defense + (gameState.equipped.armor ? gameState.equipped.armor.stats.defense : 0);
  
  // Removed resource displays from main HUD - they show in context where needed
  el("xp-display").textContent = `${gameState.player.xp} / ${gameState.player.xpToNext}`;
}

function canAfford(cost) {
  for (const [resource, amount] of Object.entries(cost)) {
    if (gameState.resources[resource] < amount) return false;
  }
  return true;
}

function payCost(cost) {
  for (const [resource, amount] of Object.entries(cost)) {
    gameState.resources[resource] -= amount;
  }
}

function addResource(resource, amount) {
  if (gameState.resources[resource] !== undefined) {
    gameState.resources[resource] += amount;
  }
}

function addXP(amount) {
  gameState.player.xp += amount;
  while (gameState.player.xp >= gameState.player.xpToNext) {
    gameState.player.xp -= gameState.player.xpToNext;
    gameState.player.level++;
    gameState.player.xpToNext = Math.floor(gameState.player.xpToNext * 1.5);
    gameState.player.maxHp += 5;
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.attack += 1;
    addLog(`Level up! Now level ${gameState.player.level}`);
  }
}

function addToInventory(itemId, item, qty = 1) {
  if (!gameState.inventory[itemId]) {
    gameState.inventory[itemId] = { obj: item, qty: 0 };
  }
  gameState.inventory[itemId].qty += qty;
}

function removeFromInventory(itemId, qty = 1) {
  if (!gameState.inventory[itemId] || gameState.inventory[itemId].qty < qty) return false;
  gameState.inventory[itemId].qty -= qty;
  if (gameState.inventory[itemId].qty <= 0) {
    delete gameState.inventory[itemId];
  }
  return true;
}

// Menu System
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.remove('hidden');
  } else {
    console.error(`[showScreen] Element with id "${screenId}" not found`);
  }
}

// Idle Section
function showIdleMenu(menuId) {
  console.log('[DEBUG] showIdleMenu called with:', menuId);
  document.querySelectorAll('.menu-content').forEach(m => m.classList.add('hidden'));
  const menu = document.getElementById(menuId);
  if (menu) {
    menu.classList.remove('hidden');
    console.log('[DEBUG] Menu shown:', menuId);
  } else {
    console.error(`[showIdleMenu] Element with id "${menuId}" not found`);
  }
}

function refreshGatheringMenu() {
  const container = el("gathering-actions");
  container.innerHTML = "";
  // Reserve space at top of each action so the progress bar appears above and pushes buttons down.

  gatheringActions.forEach(action => {
    if (action.unlock && !gameState.unlockedIdleFeatures.includes(action.unlock)) return;

    const item = document.createElement("div");
    item.className = "action-item";

    const isActive = !!gameState.activeActions[action.id];
    const isAuto = !!gameState.autoGenerators[action.id];

    // Calculate current progress if active
    let progressWidth = "0%";
    let progressText = "0%";
    if (isActive) {
      const elapsed = Date.now() - gameState.activeActions[action.id].startTime;
      const progress = Math.min(100, (elapsed / action.time) * 100);
      progressWidth = `${progress}%`;
      progressText = `${Math.floor(progress)}%`;
    }

  // Reserve a fixed area for progress bar so content stays in the same place; bar overlays that area
  const overlayBar = isActive ? `<div class="progress-bar"><div class="progress-bar-inner" id="progress-${action.id}" style="width:${progressWidth}"></div><div class="progress-text" id="progress-text-${action.id}">${progressText}</div></div>` : '';
  const progressPlaceholder = `<div class="progress-placeholder">${overlayBar}</div>`;

    const costDisplay = Object.entries(action.cost).map(([r, a]) => `${a} ${resourceDisplayNames[r] || r}`).join(", ") || "Free";
    const rewardDisplay = Object.entries(action.reward).map(([r, a]) => `${a} ${resourceDisplayNames[r] || r}`).join(", ");

    item.innerHTML = `
      <div class="action-item-header">
        <div class="action-item-name">${action.name}</div>
        <div class="action-item-cost">${costDisplay}</div>
      </div>
      <div class="action-item-description">Time: ${action.time / 1000}s | Reward: ${rewardDisplay} | XP: ${action.xp}</div>
      ${progressPlaceholder}
      ${isAuto ? `<div class="auto-active">Auto-generating</div>` : ""}
      <div class="action-controls">
        <button class="btn action-btn" id="action-${action.id}" ${isActive ? "disabled" : ""}>
          ${isActive ? "In Progress..." : "Start"}
        </button>
      </div>
    `;

    container.appendChild(item);

    const btn = el(`action-${action.id}`);
    if (btn && !isActive) {
      btn.addEventListener("click", () => startGatheringAction(action));
    }
  });
}

function startGatheringAction(action) {
  // Allow multiple concurrent gathering actions. Use timestamped jobs so they complete even if the tab
  // is inactive (we compute completion based on Date.now()).
  if (gameState.activeActions[action.id]) return;
  if (!canAfford(action.cost)) {
    addLog(`Cannot afford ${action.name}`);
    return;
  }

  payCost(action.cost);
  gameState.activeActions[action.id] = {
    startTime: Date.now(),
    duration: action.time,
    interval: null
  };

  // Refresh menu first to show progress bar
  refreshGatheringMenu();

  // Start a UI interval to update the progress bar while this tab is active.
  setupGatheringUIInterval(action.id);

  // Persist activeActions in save (so jobs survive save/load cycles while keeping intervals transient)
  try { saveGame(); } catch (e) {}

  addLog(`Started ${action.name}`);
}

// Create a UI interval for a gathering job (does not affect the timing/completion logic)
function setupGatheringUIInterval(actionId) {
  const action = gatheringActions.find(a => a.id === actionId);
  if (!action || !gameState.activeActions[actionId]) return;
  // Clear any existing interval
  if (gameState.activeActions[actionId].interval) {
    clearInterval(gameState.activeActions[actionId].interval);
  }
  const interval = setInterval(() => {
    const job = gameState.activeActions[actionId];
    if (!job) { clearInterval(interval); return; }
    const progressBar = el(`progress-${actionId}`);
    const progressText = el(`progress-text-${actionId}`);
    const elapsed = Date.now() - job.startTime;
    const progress = Math.min(100, (elapsed / job.duration) * 100);
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${Math.floor(progress)}%`;
    // If completed (compute based on timestamps) - finalize
    if (elapsed >= job.duration) {
      clearInterval(interval);
      if (gameState.activeActions[actionId]) gameState.activeActions[actionId].interval = null;
      completeGatheringAction(action);
    }
  }, 100);
  gameState.activeActions[actionId].interval = interval;
}

function completeGatheringAction(action) {
  // Guard to avoid double-completing the same job if called multiple times
  const job = gameState.activeActions[action.id];
  if (!job) return; // already completed

  // Clear UI interval if it exists
  if (job.interval) {
    try { clearInterval(job.interval); } catch (e) {}
  }

  // Remove the job record before awarding so subsequent callers see it as completed
  delete gameState.activeActions[action.id];

  // Award rewards and XP
  for (const [resource, amount] of Object.entries(action.reward)) {
    addResource(resource, amount);
  }

  addXP(action.xp);
  addLog(`Completed ${action.name}`);
  refreshStats();
  refreshGatheringMenu();
  try { saveGame(); } catch (e) {}
}

// Process timestamped gathering jobs (finalize any jobs whose end time has passed).
function processGatheringJobs() {
  const now = Date.now();
  const toComplete = [];
  for (const [jobId, job] of Object.entries(gameState.activeActions || {})) {
    if (!job || !job.startTime || !job.duration) continue;
    if (now >= job.startTime + job.duration) toComplete.push(jobId);
  }
  toComplete.forEach(id => {
    const action = gatheringActions.find(a => a.id === id);
  if (action) {
      // Ensure any UI interval is cleared inside completeGatheringAction
      completeGatheringAction(action);
    } else {
      // Unknown action - just remove
      if (gameState.activeActions[id] && gameState.activeActions[id].interval) {
        clearInterval(gameState.activeActions[id].interval);
      }
      delete gameState.activeActions[id];
    }
  });
}

function refreshMagicMenu() {
  const container = el("magic-actions");
  container.innerHTML = "";

  // Weapon Upgrade System (unlocked in Ancient Temple)
  if (gameState.unlockedIdleFeatures.includes("weaponUpgrades")) {
    container.innerHTML += '<h3>Weapon Upgrades</h3><div class="small">Upgrade your weapons to make them all viable at end-game. Each upgrade costs gold and essence.</div>';
    
    // Get all weapons from inventory
    const weapons = [];
    for (const [itemId, itemData] of Object.entries(gameState.inventory || {})) {
      const item = itemData.item || itemData.obj;
      if (item && item.type === "weapon" && item.weaponType !== "shield") {
        weapons.push({ id: itemId, ...item, count: itemData.count || itemData.qty });
      }
    }
    
    if (weapons.length === 0) {
      container.innerHTML += '<div class="small" style="margin-top:8px; color:#888;">No weapons in inventory to upgrade.</div>';
    } else {
      weapons.forEach(weapon => {
        const upgradeLevel = weapon.upgradeLevel || 0;
        const maxUpgrades = 3;
        if (upgradeLevel >= maxUpgrades) {
          container.innerHTML += `<div class="action-item"><div class="action-item-header"><div class="action-item-name">${weapon.name} (Maxed)</div></div><div class="action-item-description">Fully upgraded!</div></div>`;
        } else {
          const upgradeCost = { gold: 5 + (upgradeLevel * 3), essence: 2 + upgradeLevel };
          const canAfford = canAfford(upgradeCost);
          const costDisplay = Object.entries(upgradeCost).map(([r, a]) => `<span class="${canAfford ? 'have-resource' : 'lack-resource'}">${a} ${resourceDisplayNames[r] || r}</span>`).join(", ");
          container.innerHTML += `
            <div class="action-item">
              <div class="action-item-header">
                <div class="action-item-name">${weapon.name} (Level ${upgradeLevel + 1}/${maxUpgrades})</div>
              </div>
              <div class="action-item-description">
                Upgrade Cost: ${costDisplay}<br>
                Effect: +${2 + upgradeLevel} Attack, +${0.1 + (upgradeLevel * 0.05)} Speed
              </div>
              <button class="btn action-btn ${canAfford ? '' : 'disabled'}" ${canAfford ? '' : 'disabled'} onclick="upgradeWeapon('${weapon.id}')">
                Upgrade
              </button>
            </div>
          `;
        }
      });
    }
    
    container.innerHTML += '<hr style="margin:16px 0; border-color:#333;">';
  }

  // Ritual stone gathering (same as before, with reserved progress placeholder)
  const magicAction = gatheringActions.find(a => a.id === "gatherRitualStones");
  if (magicAction && (!magicAction.unlock || gameState.unlockedIdleFeatures.includes(magicAction.unlock))) {
    const isActive = !!gameState.activeActions[magicAction.id];
    const isAuto = !!gameState.autoGenerators[magicAction.id];
    let progressWidth = "0%";
    let progressText = "0%";
    if (isActive) {
      const elapsed = Date.now() - gameState.activeActions[magicAction.id].startTime;
      const progress = Math.min(100, (elapsed / magicAction.time) * 100);
      progressWidth = `${progress}%`;
      progressText = `${Math.floor(progress)}%`;
    }
    const costDisplay = Object.entries(magicAction.cost).map(([r, a]) => `${a} ${resourceDisplayNames[r] || r}`).join(", ") || "Free";
    const rewardDisplay = Object.entries(magicAction.reward).map(([r, a]) => `${a} ${resourceDisplayNames[r] || r}`).join(", ");
    const overlayBar = isActive ? `<div class="progress-bar"><div class="progress-bar-inner" id="progress-${magicAction.id}" style="width:${progressWidth}"></div><div class="progress-text" id="progress-text-${magicAction.id}">${progressText}</div></div>` : '';
    container.innerHTML += `
      <div class="action-item">
        <div class="action-item-header">
          <div class="action-item-name">${magicAction.name}</div>
          <div class="action-item-cost">${costDisplay}</div>
        </div>
        <div class="action-item-description">Time: ${magicAction.time / 1000}s | Reward: ${rewardDisplay} | XP: ${magicAction.xp}</div>
        <div class="progress-placeholder">${overlayBar}</div>
        ${isAuto ? `<div class="auto-active">Auto-generating</div>` : ""}
        <div class="action-controls"><button class="btn action-btn" id="action-${magicAction.id}" ${isActive ? "disabled" : ""}>${isActive ? "In Progress..." : "Start"}</button></div>
      </div>
    `;
    const btn = el(`action-${magicAction.id}`);
    if (btn && !isActive) btn.addEventListener('click', () => startGatheringAction(magicAction));
  } else {
    container.innerHTML = "<div class='small'>Ritual Stone gathering not yet unlocked. Defeat the Cave System boss.</div>";
  }

  // Enchanting section: allow enchanting of weapons/armor using ritualStones
  const enchantSection = document.createElement('div');
  enchantSection.className = 'enchant-section';
  enchantSection.innerHTML = '<h3>Enchanting</h3><div class="small">Use Ritual Stones to enchant weapons or armor. Each enchant costs 3 ritual stones. You can also change an existing enchant for the same cost.</div><div id="enchant-list" class="enchant-list"></div>';
  container.appendChild(enchantSection);

  const listEl = el('enchant-list');
  // Find eligible items in inventory (weapons and armor)
  Object.entries(gameState.inventory).forEach(([itemId, itemData]) => {
    if (itemData.obj.type !== 'weapon' && itemData.obj.type !== 'armor') return;
    const card = document.createElement('div');
    card.className = 'enchant-card';
    const enchants = itemData.obj.effect ? Object.keys(itemData.obj.effect || {}).join(', ') : 'None';
    const cost = 3;
    const ritualAmt = gameState.resources.ritualStones || 0;
    const canAfford = ritualAmt >= cost;
    const hasHistory = (itemData.obj._enchantHistory && itemData.obj._enchantHistory.length > 0);
    card.innerHTML = `
      <div>
        <div class="enchant-item-name">${itemData.obj.name} (x${itemData.qty})</div>
        <div class="small">Current Enchants: ${enchants}</div>
      </div>
      <div class="enchant-actions">
        <button class="btn enchant-btn" id="enchant-${itemId}" ${!canAfford ? 'disabled' : ''}>Enchant (3 ritual stones)</button>
        <button class="btn enchant-change" id="enchant-change-${itemId}" ${(!canAfford || !hasHistory) ? 'disabled' : ''}>Change Last Enchant (3 ritual stones)</button>
      </div>
    `;
    listEl.appendChild(card);

    const btn = el(`enchant-${itemId}`);
    if (btn) btn.addEventListener('click', () => {
      if (!canAfford) return;
      showConfirm(`Spend ${cost} ritual stones to enchant ${itemData.obj.name}?`, () => enchantItem(itemId, false));
    });
    const btn2 = el(`enchant-change-${itemId}`);
    if (btn2) btn2.addEventListener('click', () => {
      if (!canAfford || !hasHistory) return;
      showConfirm(`Spend ${cost} ritual stones to change the last enchant on ${itemData.obj.name}?`, () => enchantItem(itemId, true));
    });
  });
}

function refreshCraftingMenu() {
  const container = el("crafting-recipes");
  container.innerHTML = "";
  // Group recipes into labeled categories and render grids to reduce clutter
  const categories = {
    swords: { title: 'Swords', filter: r => r.type === 'weapon' && r.weaponType === 'sword' },
    shortswords: { title: 'Short Weapons', filter: r => r.type === 'weapon' && r.weaponType === 'shortsword' },
    bows: { title: 'Ranged', filter: r => r.type === 'weapon' && r.weaponType === 'bow' },
    heavy: { title: 'Heavy Weapons', filter: r => r.type === 'weapon' && r.weaponType === 'heavy' },
    shields: { title: 'Shields', filter: r => r.type === 'weapon' && r.weaponType === 'shield' },
    armor: { title: 'Armor', filter: r => r.type === 'armor' },
    consumables: { title: 'Consumables', filter: r => r.type === 'consumable' },
    capacity: { title: 'Capacity', filter: r => r.type === 'capacity' }
  };

  for (const key of Object.keys(categories)) {
    const cat = categories[key];
    const list = craftingRecipes.filter(r => (!r.unlock || gameState.unlockedIdleFeatures.includes(r.unlock)) && cat.filter(r));
    // Sort recipes alphabetically by name for consistent ordering
    list.sort((a, b) => a.name.localeCompare(b.name));
    if (!list.length) continue;

    const section = document.createElement('div');
    section.className = 'recipe-section';
    section.innerHTML = `<h3>${cat.title}</h3><div class="recipe-grid" id="recipe-grid-${key}"></div>`;
    container.appendChild(section);

    const grid = el(`recipe-grid-${key}`);
    list.forEach(recipe => {
      const card = document.createElement('div');
      card.className = 'recipe-card';

      const canCraft = canAfford(recipe.cost);
      const resourceDisplay = Object.entries(recipe.cost).map(([r, a]) => {
        const current = gameState.resources[r] || 0;
        const name = resourceDisplayNames[r] || r;
        return `<span class="${current >= a ? 'have-resource' : 'lack-resource'}">${current >= a ? '✓' : '✗'} ${a} ${name} (${Math.floor(current)})</span>`;
      }).join('<br>');

      card.innerHTML = `
        <div class="recipe-card-inner">
          <pre class="ascii-art">${getAsciiForId(recipe.id, recipe).join('\n')}</pre>
          <div class="recipe-name">${recipe.name}</div>
          ${recipe.description ? `<div class="small recipe-desc">${recipe.description}</div>` : ''}
          <div class="recipe-cost">${resourceDisplay}</div>
          ${(() => {
            // If player already owns this crafted item, show its enchants (if any)
            const inv = gameState.inventory && gameState.inventory[recipe.id];
            if (inv && inv.obj) {
              const ench = inv.obj.enchants && inv.obj.enchants.length ? inv.obj.enchants.join(', ') : 'None';
              const enchBadges = getEnchantIconHtml(inv.obj);
              return `<div class="small">Owned: x${inv.qty} ${enchBadges ? `<div class="enchant-icons">${enchBadges}</div>` : ''} | Enchants: ${ench}</div>`;
            }
            return '';
          })()}
          ${recipe.stats ? `<div class="small">Stats: ${Object.entries(recipe.stats).map(([s, v]) => `${s} ${v}`).join(', ')}</div>` : ''}
          ${recipe.capacityBonus ? `<div class="small">Capacity: +${recipe.capacityBonus}</div>` : ''}
          <div class="recipe-actions"><button class="btn recipe-btn ${!canCraft ? 'disabled' : ''}" id="craft-${recipe.id}" ${!canCraft ? 'disabled' : ''}>Craft</button></div>
        </div>
      `;

      grid.appendChild(card);

      const btn = card.querySelector(`#craft-${recipe.id}`);
      if (btn && canCraft) btn.addEventListener('click', () => craftItem(recipe));
    });
  }
}

function craftItem(recipe) {
  if (!canAfford(recipe.cost)) {
    addLog(`Cannot afford ${recipe.name}`);
    return;
  }
  
  payCost(recipe.cost);
  
  // Handle capacity items
  if (recipe.type === "capacity") {
    gameState.capacity.max += recipe.capacityBonus;
    addLog(`Crafted ${recipe.name} - Capacity increased to ${gameState.capacity.max}`);
  } else {
    // Handle regular items (weapons, armor, consumables)
    const item = {
      id: recipe.id,
      name: recipe.name,
      type: recipe.type,
      weaponType: recipe.weaponType || null,
      stats: recipe.stats || {},
      effect: recipe.effect || {}
    };
    
    addToInventory(recipe.id, item, 1);
    addLog(`Crafted ${recipe.name}`);
  }
  
  refreshStats();
  refreshCraftingMenu();
  refreshInventory();
}

// Enchanting mechanics: apply a random enchant to an inventory weapon/armor using ritualStones
function enchantItem(itemId, replaceLast = false) {
  const cost = 3;
  if ((gameState.resources.ritualStones || 0) < cost) {
    addLog('Not enough Ritual Stones to enchant.');
    return;
  }
  const invEntry = gameState.inventory[itemId];
  if (!invEntry) {
    addLog('Item not found in inventory');
    return;
  }
  const item = invEntry.obj;

  // If replaceLast is true and there's history, revert last enchant snapshot
  item._enchantHistory = item._enchantHistory || [];
  if (replaceLast && item._enchantHistory.length) {
    const last = item._enchantHistory.pop();
    // restore previous stats/effect
    item.stats = last.prevStats || {};
    item.effect = last.prevEffect || {};
  }

  // Pay cost
  gameState.resources.ritualStones -= cost;

  // Pick a random enchant effect
  const choice = enchantEffects[Math.floor(Math.random() * enchantEffects.length)];
  // Save snapshot of current stats/effect so we can revert later
  const snapshot = { prevStats: JSON.parse(JSON.stringify(item.stats || {})), prevEffect: JSON.parse(JSON.stringify(item.effect || {})), id: choice.id };
  item._enchantHistory.push(snapshot);

  // Apply effect (mutates item)
  try {
    choice.apply(item);
    // mark applied enchant list for display
    item.enchants = item.enchants || [];
    item.enchants.push(choice.name);
    addLog(`Applied enchant '${choice.name}' to ${item.name}`);
    // show a small floating confirmation near player
    if (gameState.combat && gameState.combat.floatingTexts) {
      gameState.combat.floatingTexts.push({ x: gameState.combat.playerX + 10, y: 260, text: `Enchanted ${item.name}`, ttl: 1.6, alpha: 1 });
    }
  } catch (e) {
    addLog('Error applying enchant');
  }

  refreshInventory();
  refreshMagicMenu();
  refreshCraftingMenu();
  refreshStats();
}

function refreshStructuresMenu() {
  const container = el("structures-options");
  container.innerHTML = "";
  
  structures.forEach(structure => {
    if (structure.unlock && !gameState.unlockedIdleFeatures.includes(structure.unlock)) return;
    
    const isBuilt = gameState.unlockedIdleFeatures.includes(structure.id);
    const item = document.createElement("div");
    item.className = "structure-item";
    
    if (isBuilt) {
      const level = gameState.structureLevels[structure.id] || 1;
      const maxLevel = structure.maxLevel || 3;
      // Already built - show production rate
        if (structure.amount && structure.resource) {
          // Read current production from generator (which has upgrade scaling applied)
          const actionMap = {
            "autoWood": "gatherWood",
            "autoMeat": "gatherMeat",
            "autoWater": "gatherWater",
            "autoPlants": "gatherPlants",
            "autoStone": "gatherStone",
            "autoRitualStones": "gatherRitualStones"
          };
          const mappedActionId = actionMap[structure.effect];
          const gen = gameState.autoGenerators[mappedActionId];
          const currentAmount = gen ? gen.amount : structure.amount;
          const currentRate = gen ? gen.rate : structure.rate;
          const ratePerSecond = (currentAmount / (currentRate / 1000)).toFixed(2);
          item.innerHTML = `
            <div class="structure-info">
              <div class="structure-name">${structure.name} (Lv ${level})</div>
              <div class="small" style="color: var(--success);">Built - Producing ${ratePerSecond} ${structure.resource}/sec</div>
            </div>
          `;
        } else if (structure.effect === 'healing') {
          // For healing structures, read the actual current healing stats
          const currentHealAmount = gameState.passiveHealing ? gameState.passiveHealing.amount : structure.healAmount;
          const currentHealInterval = gameState.passiveHealing ? gameState.passiveHealing.interval : structure.healInterval;
          item.innerHTML = `
            <div class="structure-info">
              <div class="structure-name">${structure.name} (Lv ${level})</div>
              <div class="small" style="color: var(--success);">Built - Provides healing (+${currentHealAmount} HP every ${(currentHealInterval / 1000).toFixed(1)}s)</div>
            </div>
          `;
        } else {
          item.innerHTML = `
            <div class="structure-info">
              <div class="structure-name">${structure.name} (Lv ${level})</div>
              <div class="small" style="color: var(--success);">Built</div>
            </div>
          `;
        }
      // Show upgrade button if not at max level
      if (level < maxLevel) {
        const nextCost = computeUpgradeCost(structure, level + 1);
        const canAffordUpgrade = canAfford(nextCost);
        const costDisplay = Object.entries(nextCost).map(([r, a]) => `${a} ${resourceDisplayNames[r] || r}`).join(", ");
        const upgradeHtml = `
          <div class="structure-upgrade">
            <div class="small">Upgrade cost: ${costDisplay}</div>
            <button class="btn structure-upgrade-btn" id="upgrade-${structure.id}" ${!canAffordUpgrade ? 'disabled' : ''}>Upgrade</button>
          </div>`;
        item.innerHTML += upgradeHtml;
        // attach listener
        const upBtn = item.querySelector(`#upgrade-${structure.id}`);
        if (upBtn) upBtn.addEventListener('click', () => upgradeStructure(structure));
      } else {
        item.innerHTML += `<div class="small">Max Level</div>`;
      }
    } else {
      // Not built - show build option
      const canAffordStructure = canAfford(structure.cost);
      let productionLine = '';
      if (structure.amount && structure.resource) {
        const ratePerSecond = (structure.amount / (structure.rate / 1000)).toFixed(2);
        productionLine = `<div class="small">Production: ${ratePerSecond} ${structure.resource}/second</div>`;
      } else if (structure.effect === 'healing') {
        productionLine = `<div class="small">Provides healing: +${structure.healAmount} HP every ${structure.healInterval / 1000}s</div>`;
      }

      item.innerHTML = `
          <div class="structure-info">
            <div class="structure-name">${structure.name}</div>
            <div class="structure-cost">Cost: ${Object.entries(structure.cost).map(([r, a]) => `${a} ${resourceDisplayNames[r] || r}`).join(", ")}</div>
            ${productionLine}
          </div>
          <button class="btn structure-btn" id="structure-${structure.id}" ${!canAffordStructure ? "disabled" : ""}>
            Build
          </button>
        `;
      
      // Query the button from the newly-created `item` element so the
      // listener is attached to the real DOM node (document.getElementById
      // won't find it until it's appended to the document).
      const btn = item.querySelector(`#structure-${structure.id}`);
      if (btn) {
        btn.addEventListener("click", () => buildStructure(structure));
      }
    }
    
    container.appendChild(item);
  });
}

function buildStructure(structure) {
  if (!canAfford(structure.cost)) {
    addLog(`Cannot afford ${structure.name}`);
    return;
  }
  
  payCost(structure.cost);
  gameState.unlockedIdleFeatures.push(structure.id);
  // Initialize structure level (1 = built). Upgrades will increment this.
  if (!gameState.structureLevels[structure.id]) gameState.structureLevels[structure.id] = 1;
  
  // Start auto-generation based on structure
  const actionId = structure.effect.replace("auto", "gather");
  const actionIdCapitalized = actionId.charAt(0).toLowerCase() + actionId.slice(1);
  
  // Map structure effects to action IDs
  const actionMap = {
    "autoWood": "gatherWood",
    "autoMeat": "gatherMeat",
    "autoWater": "gatherWater",
    "autoPlants": "gatherPlants",
    "autoStone": "gatherStone",
    "autoRitualStones": "gatherRitualStones"
  };
  
  const mappedActionId = actionMap[structure.effect];
  if (mappedActionId) {
    gameState.autoGenerators[mappedActionId] = { 
      rate: structure.rate,
      resource: structure.resource,
      amount: structure.amount
    };
    startAutoGenerator(mappedActionId, structure);
  }

  // Apply healing if the structure provides it
  if (structure.effect === "healing") {
    if (!gameState.passiveHealing) {
      gameState.passiveHealing = { amount: 1, interval: 5000, structuresBuilt: [], intervalId: null };
    }
    // Increase heal amount
    if (structure.healAmount) {
      gameState.passiveHealing.amount += structure.healAmount;
    }
    // Use the fastest interval among all built healing structures (stack for faster healing)
    if (structure.healInterval) {
      gameState.passiveHealing.interval = Math.min(gameState.passiveHealing.interval, structure.healInterval);
    }
    if (!gameState.passiveHealing.structuresBuilt.includes(structure.id)) {
      gameState.passiveHealing.structuresBuilt.push(structure.id);
    }
    // Restart passive healing so it uses updated interval/amount
    stopPassiveHealing();
    startPassiveHealing();
  }
  
  // Log for resource generation structures
  if (structure.effect !== "healing" && structure.rate) {
    addLog(`Built ${structure.name} - Now producing ${structure.amount} ${structure.resource} every ${structure.rate / 1000}s`);
  } else if (structure.effect === "healing") {
    addLog(`Built ${structure.name} - Healing increased (+${structure.healAmount} HP every ${structure.healInterval / 1000}s)`);
  }
  refreshStats();
  refreshStructuresMenu();
  refreshGatheringMenu();
}

function startAutoGenerator(actionId, structure = null) {
  const action = gatheringActions.find(a => a.id === actionId);
  if (!action) return;
  
  const generator = gameState.autoGenerators[actionId];
  if (!generator) return;
  
  // If already running, don't start another interval
  if (generator.interval) return;
  
  const interval = setInterval(() => {
    if (!gameState.autoGenerators[actionId]) {
      clearInterval(interval);
      return;
    }
    
    // Use structure data if available, otherwise use action reward
    if (structure && generator.resource && generator.amount) {
      addResource(generator.resource, generator.amount);
      addXP(action.xp);
    } else {
      for (const [resource, amount] of Object.entries(action.reward)) {
        addResource(resource, amount);
      }
      addXP(action.xp);
    }
    refreshStats();
  }, generator.rate);
  
  generator.interval = interval;
}

function stopAutoGenerator(actionId) {
  const gen = gameState.autoGenerators[actionId];
  if (gen && gen.interval) {
    clearInterval(gen.interval);
    gen.interval = null;
  }
}

// Compute an upgrade cost for a structure based on its base cost and desired level
function computeUpgradeCost(structure, nextLevel) {
  // Simple scaling: multiply each base cost by nextLevel (1 -> 2x for level 2, etc.)
  const factor = nextLevel; // next level multiplier
  const newCost = {};
  Object.entries(structure.cost || {}).forEach(([r, a]) => {
    newCost[r] = Math.ceil(a * factor);
  });
  return newCost;
}

function upgradeStructure(structure) {
  const currentLevel = gameState.structureLevels[structure.id] || 1;
  const maxLevel = structure.maxLevel || 3;
  if (currentLevel >= maxLevel) {
    addLog(`${structure.name} is already at maximum level (${maxLevel}).`);
    return;
  }

  const nextLevel = currentLevel + 1;
  const cost = computeUpgradeCost(structure, nextLevel);
  if (!canAfford(cost)) {
    addLog(`Cannot afford upgrade for ${structure.name}`);
    return;
  }

  payCost(cost);
  gameState.structureLevels[structure.id] = nextLevel;

  // Improve effects: for resource generators, increase amount and/or decrease interval
  const actionMap = {
    "autoWood": "gatherWood",
    "autoMeat": "gatherMeat",
    "autoWater": "gatherWater",
    "autoPlants": "gatherPlants",
    "autoStone": "gatherStone",
    "autoRitualStones": "gatherRitualStones"
  };
  const mappedActionId = actionMap[structure.effect];
  if (mappedActionId && gameState.autoGenerators[mappedActionId]) {
    const gen = gameState.autoGenerators[mappedActionId];
    // Increase amount by 50% per upgrade and make it faster by 20% per upgrade
    gen.amount = +(gen.amount * 1.5).toFixed(2);
    gen.rate = Math.max(1000, Math.floor(gen.rate * 0.8));
    // Restart generator to apply new rate
    stopAutoGenerator(mappedActionId);
    startAutoGenerator(mappedActionId, structure);
  }

  // If the structure provides healing, adjust passiveHealing values
  if (structure.effect === "healing" && gameState.passiveHealing) {
    // Increase heal amount proportional to structure's healAmount
    if (structure.healAmount) {
      gameState.passiveHealing.amount += structure.healAmount; // add base heal per upgrade
    }
    if (structure.healInterval) {
      // make healing faster a bit
      gameState.passiveHealing.interval = Math.max(1000, Math.floor(gameState.passiveHealing.interval * 0.9));
    }
    // restart passive healing to pick up new interval/amount
    stopPassiveHealing();
    startPassiveHealing();
  }

  addLog(`${structure.name} upgraded to level ${nextLevel}`);
  refreshStats();
  refreshStructuresMenu();
}

// Passive healing system (heals the player over time; can be improved by structures)
function startPassiveHealing() {
  const ph = gameState.passiveHealing;
  if (!ph) return;
  if (ph.intervalId) return; // already running

  ph.intervalId = setInterval(() => {
    if (!gameState || !gameState.player) return;
    if (gameState.player.hp <= 0) {
      // allow revival from 0
      gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + ph.amount);
    } else if (gameState.player.hp < gameState.player.maxHp) {
      gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + ph.amount);
    }
    refreshStats();
  }, ph.interval);
}

function stopPassiveHealing() {
  const ph = gameState.passiveHealing;
  if (!ph || !ph.intervalId) return;
  clearInterval(ph.intervalId);
  ph.intervalId = null;
}

// Inventory
function refreshInventory() {
  const container = el("inventory-grid");
  container.innerHTML = "";

  // Materials section: show current materials/resources as cards similar to crafting (only show if qty > 0)
  const materialsList = Object.entries(gameState.resources).map(([r, a]) => {
    const art = getAsciiForId(r).join('\n');
    const displayName = resourceDisplayNames[r] || r;
    return {
      id: r,
      name: displayName,
      art,
      qty: Math.floor(a)
    };
  }).filter(x => x.qty > 0);  // Only show materials with quantity > 0

  if (materialsList.length) {
    const section = document.createElement('div');
    section.className = 'inventory-section';
    section.innerHTML = `<h3>Materials</h3><div class="inventory-type-grid" id="inventory-materials"></div>`;
    container.appendChild(section);
    const matGrid = el('inventory-materials');
    materialsList.forEach(m => {
      const card = document.createElement('div');
      card.className = 'inventory-card';
      card.innerHTML = `<pre class="ascii-art ascii-small">${m.art}</pre><div class="inventory-name">${m.name}</div><div class="inventory-qty">x${m.qty}</div>`;
      matGrid.appendChild(card);
    });
  }

  // Group inventory items by type (weapons grouped by weaponType)
  const grouped = {};
  Object.entries(gameState.inventory).forEach(([itemId, itemData]) => {
    const t = itemData.obj.type || 'misc';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push({ id: itemId, data: itemData });
  });

  // Sort each group alphabetically by item name for a tidy inventory
  Object.keys(grouped).forEach(k => {
    grouped[k].sort((a, b) => (a.data.obj.name || '').localeCompare(b.data.obj.name || ''));
  });

  // Weapons grouped by weaponType
  if (grouped.weapon && grouped.weapon.length) {
    const section = document.createElement('div');
    section.className = 'inventory-section';
    section.innerHTML = `<h3>Weapons</h3><div class="inventory-type-grid" id="inventory-weapons"></div>`;
    container.appendChild(section);
    const grid = el('inventory-weapons');
    grouped.weapon.forEach(it => {
      const itemCard = document.createElement('div');
      itemCard.className = 'inventory-card';
      const isEquipped = (gameState.equipped.weapon && gameState.equipped.weapon.id === it.id);
      if (isEquipped) itemCard.classList.add('equipped');
      const enchantBadges = getEnchantIconHtml(it.data.obj);
      itemCard.innerHTML = `
        <pre class="ascii-art">${getAsciiForId(it.id, it.data.obj).join('\n')}</pre>
        <div class="inventory-name">${it.data.obj.name}</div>
        <div class="inventory-qty">x${it.data.qty}</div>
        ${enchantBadges ? `<div class="enchant-icons">${enchantBadges}</div>` : ''}
        ${it.data.obj.stats ? `<div class="small">${Object.entries(it.data.obj.stats).map(([s,v])=>`${s} ${v}`).join(', ')}</div>` : ''}
        ${it.data.obj.effect ? `<div class="small">Enchantments: ${(it.data.obj.effect && Object.keys(it.data.obj.effect).length) ? Object.keys(it.data.obj.effect).join(', ') : 'None'}</div>` : ''}
      `;
      itemCard.addEventListener('click', () => useInventoryItem(it.id, it.data.obj));
      grid.appendChild(itemCard);
    });
  }

  // Armor
  if (grouped.armor && grouped.armor.length) {
    const section = document.createElement('div');
    section.className = 'inventory-section';
    section.innerHTML = `<h3>Armor</h3><div class="inventory-type-grid" id="inventory-armor"></div>`;
    container.appendChild(section);
    const grid = el('inventory-armor');
    grouped.armor.forEach(it => {
      const card = document.createElement('div');
      card.className = 'inventory-card';
      const isEquipped = (gameState.equipped.armor && gameState.equipped.armor.id === it.id);
      if (isEquipped) card.classList.add('equipped');
      const enchantBadges = getEnchantIconHtml(it.data.obj);
      card.innerHTML = `
        <pre class="ascii-art">${getAsciiForId(it.id, it.data.obj).join('\n')}</pre>
        <div class="inventory-name">${it.data.obj.name}</div>
        <div class="inventory-qty">x${it.data.qty}</div>
        ${enchantBadges ? `<div class="enchant-icons">${enchantBadges}</div>` : ''}
        ${it.data.obj.stats ? `<div class="small">${Object.entries(it.data.obj.stats).map(([s,v])=>`${s} ${v}`).join(', ')}</div>` : ''}
        ${it.data.obj.effect ? `<div class="small">Effects: ${(it.data.obj.effect && Object.keys(it.data.obj.effect).length) ? Object.keys(it.data.obj.effect).join(', ') : 'None'}</div>` : ''}
      `;
      card.addEventListener('click', () => useInventoryItem(it.id, it.data.obj));
      grid.appendChild(card);
    });
  }

  // Consumables
  if (grouped.consumable && grouped.consumable.length) {
    const section = document.createElement('div');
    section.className = 'inventory-section';
    section.innerHTML = `<h3>Consumables</h3><div class="inventory-type-grid" id="inventory-consumables"></div>`;
    container.appendChild(section);
    const grid = el('inventory-consumables');
    grouped.consumable.forEach(it => {
      const card = document.createElement('div');
      card.className = 'inventory-card';
  card.innerHTML = `<pre class="ascii-art">${getAsciiForId(it.id, it.data.obj).join('\n')}</pre><div class="inventory-name">${it.data.obj.name}</div><div class="inventory-qty">x${it.data.qty}</div>`;
      card.addEventListener('click', () => useInventoryItem(it.id, it.data.obj));
      grid.appendChild(card);
    });
  }

  // Quest / misc
  if ((grouped.quest && grouped.quest.length) || (grouped.misc && grouped.misc.length)) {
    const list = (grouped.quest || []).concat(grouped.misc || []);
    const section = document.createElement('div');
    section.className = 'inventory-section';
    section.innerHTML = `<h3>Misc</h3><div class="inventory-type-grid" id="inventory-misc"></div>`;
    container.appendChild(section);
    const grid = el('inventory-misc');
    list.forEach(it => {
      const card = document.createElement('div');
      card.className = 'inventory-card';
  card.innerHTML = `<pre class="ascii-art">${getAsciiForId(it.id, it.data.obj).join('\n')}</pre><div class="inventory-name">${it.data.obj.name}</div><div class="inventory-qty">x${it.data.qty}</div>`;
      card.addEventListener('click', () => useInventoryItem(it.id, it.data.obj));
      grid.appendChild(card);
    });
  }
}

function showAreaSelection() {
  console.log('[DEBUG] showAreaSelection called');
  const overlay = document.getElementById("area-selection-overlay");
  const container = document.getElementById("area-list");
  
  if (!overlay) {
    console.error('[DEBUG] area-selection-overlay not found');
    return;
  }
  if (!container) {
    console.error('[DEBUG] area-list not found');
    return;
  }
  
  container.innerHTML = "";
  
  gameState.unlockedAreas.forEach(areaIndex => {
    const area = areas[areaIndex];
    const item = document.createElement("div");
    item.className = "action-item";
    
    item.innerHTML = `
      <div class="action-item-header">
        <div class="action-item-name">${area.name}</div>
      </div>
      <div class="action-item-description">
        Enemies: ${area.enemies} | ${area.boss ? "Boss Area" : "Regular Area"}
        ${area.unlockIdle ? ` | Unlocks: ${area.unlockIdle}` : ""}
      </div>
      <button class="btn action-btn" id="select-area-${areaIndex}">
        Enter Area
      </button>
    `;
    
    container.appendChild(item);
    
    const btn = document.getElementById(`select-area-${areaIndex}`);
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[DEBUG] Area selected:', areaIndex);
        gameState.currentArea = areaIndex;
        overlay.classList.add("hidden");
        const idleSection = document.getElementById("idle-section");
        const combatSection = document.getElementById("combat-section");
        if (idleSection) idleSection.classList.add("hidden");
        if (combatSection) combatSection.classList.remove("hidden");
        if (typeof startRPG === 'function') {
          startRPG();
        } else {
          console.error('[DEBUG] startRPG function not available');
        }
      });
    } else {
      console.warn(`[DEBUG] Button select-area-${areaIndex} not found after creation`);
    }
  });
  
  overlay.classList.remove("hidden");
  console.log('[DEBUG] Area selection overlay shown');
}

function upgradeWeapon(itemId) {
  if (!gameState.inventory[itemId]) {
    addLog("Weapon not found in inventory");
    return;
  }
  
  const itemData = gameState.inventory[itemId];
  const weapon = itemData.item || itemData.obj;
  if (!weapon) {
    addLog("Weapon not found in inventory");
    return;
  }
  const upgradeLevel = weapon.upgradeLevel || 0;
  const maxUpgrades = 3;
  
  if (upgradeLevel >= maxUpgrades) {
    addLog(`${weapon.name} is already fully upgraded!`);
    return;
  }
  
  const upgradeCost = { gold: 5 + (upgradeLevel * 3), essence: 2 + upgradeLevel };
  if (!canAfford(upgradeCost)) {
    addLog("Cannot afford upgrade cost");
    return;
  }
  
  payCost(upgradeCost);
  
  // Apply upgrade
  weapon.upgradeLevel = (weapon.upgradeLevel || 0) + 1;
  weapon.stats = weapon.stats || {};
  weapon.stats.attack = (weapon.stats.attack || 0) + (2 + upgradeLevel);
  weapon.stats.speed = (weapon.stats.speed || 1) + (0.1 + (upgradeLevel * 0.05));
  
  // Update inventory item
  if (itemData.item) itemData.item = weapon;
  if (itemData.obj) itemData.obj = weapon;
  
  // Update equipped weapon if it's the same item
  if (gameState.equipped.weapon && (gameState.equipped.weapon.id === itemId || gameState.equipped.weapon.id === weapon.id)) {
    gameState.equipped.weapon = weapon;
    gameState.equipped.weapon.id = itemId;
  }
  
  addLog(`Upgraded ${weapon.name} to level ${weapon.upgradeLevel}!`);
  refreshStats();
  refreshMagicMenu();
  refreshInventory();
  try { saveGame(); } catch (e) {}
}

function useInventoryItem(itemId, item) {
  if (item.type === "weapon") {
    // Check weapon constraints - heavy weapons cannot be dual-wielded with shields
    const currentWeapon = gameState.equipped.weapon;
    const currentShield = gameState.equipped.armor && gameState.equipped.armor.weaponType === "shield" ? gameState.equipped.armor : null;
    
    if (item.weaponType === "shield") {
      // Trying to equip a shield
      if (currentWeapon && currentWeapon.weaponType === "heavy") {
        addLog(`Cannot equip shield with heavy weapon`);
        return;
      }
      // Shields go into armor slot for equipment purposes
      gameState.equipped.armor = item;
      gameState.equipped.armor.id = itemId;
    } else if (item.weaponType === "heavy") {
      // Trying to equip heavy weapon
      if (currentShield) {
        addLog(`Cannot equip heavy weapon with shield`);
        return;
      }
      gameState.equipped.weapon = item;
      gameState.equipped.weapon.id = itemId;
    } else {
      // Regular weapon (sword, bow, shortsword, etc)
      gameState.equipped.weapon = item;
      gameState.equipped.weapon.id = itemId;
    }
    
    addLog(`Equipped ${item.name}`);
    refreshStats();
    refreshInventory();
  } else if (item.type === "armor") {
    // Regular armor (not shield)
    gameState.equipped.armor = item;
    gameState.equipped.armor.id = itemId;
    addLog(`Equipped ${item.name}`);
    refreshStats();
    refreshInventory();
  } else if (item.type === "consumable") {
    if (item.effect && item.effect.hp) {
      gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + item.effect.hp);
      removeFromInventory(itemId, 1);
      addLog(`Used ${item.name} (+${item.effect.hp} HP)`);
      refreshStats();
      refreshInventory();
    }
  }
}

// RPG Combat Section
let gameCanvas, ctx;
let animationFrameId;

function initRPG() {
  console.log('[DEBUG] initRPG called');
  gameCanvas = document.getElementById("game-canvas");
  if (gameCanvas) {
    ctx = gameCanvas.getContext("2d");
    console.log('[DEBUG] Canvas initialized successfully');
  } else {
    console.error('[DEBUG] game-canvas element not found');
  }
}

function startRPG() {
  console.log('[DEBUG] startRPG called');
  if (gameState.combat.active) {
    console.log('[DEBUG] Combat already active, returning');
    return;
  }
  
  try {
    gameState.combat.active = true;
    gameState.combat.paused = false;
    gameState.combat.enemies = [];
    gameState.combat.projectiles = [];
    gameState.combat.playerX = 50; // Fixed screen position
    gameState.combat.scrollX = 0;
    gameState.combat.lastFrame = Date.now();
    gameState.combat.lastEnemyDamage = 0;
    gameState.combat.mapProgress = 0; // Track how far through the map
    gameState.combat.spawnedEnemiesCount = 0; // Count of spawned enemies
    gameState.combat.spawnIntervalId = null;
    
    // Initialize area signature mechanics
    gameState.combat.areaMechanic = {
      lastTick: Date.now(),
      ritualPowerBuff: 0,
      lastManaSurge: 0,
      shadowCloneTimer: 0,
      waterHazardTimer: 0,
      voidCorruptionTimer: 0
    };
    
    // Initialize weapon mechanics
    gameState.combat.weaponMechanics = {
      swordCombo: 0,
      swordComboTimer: 0,
      lastCrit: 0,
      lastStagger: 0,
      lastBlock: 0
    };
    
    const area = areas[gameState.currentArea];
    const areaNameEl = document.getElementById("area-name");
    if (areaNameEl) {
      areaNameEl.textContent = area.name;
    } else {
      console.warn('[DEBUG] area-name element not found');
    }
    
    // Ensure combat section is visible and idle section is hidden
    const combatSection = document.getElementById("combat-section");
    const idleSection = document.getElementById("idle-section");
    if (combatSection) {
      combatSection.classList.remove("hidden");
    } else {
      console.error('[DEBUG] combat-section not found');
    }
    if (idleSection) {
      idleSection.classList.add("hidden");
    } else {
      console.warn('[DEBUG] idle-section not found');
    }
    
    // Check if canvas is initialized
    if (!ctx) {
      console.error('[DEBUG] Canvas context not initialized, initializing now');
      if (gameCanvas) {
        ctx = gameCanvas.getContext("2d");
      } else {
        gameCanvas = document.getElementById("game-canvas");
        if (gameCanvas) {
          ctx = gameCanvas.getContext("2d");
        } else {
          console.error('[DEBUG] Cannot initialize canvas - game-canvas element not found');
          throw new Error('Canvas not available');
        }
      }
    }
    
    // Spawn first enemy
    if (typeof spawnSingleEnemy === 'function') {
      spawnSingleEnemy();
    } else {
      console.error('[DEBUG] spawnSingleEnemy function not available');
    }
    
    // Start enemy spawn timer
    if (typeof startEnemySpawner === 'function') {
      startEnemySpawner();
    } else {
      console.error('[DEBUG] startEnemySpawner function not available');
    }
    
    // Start game loop
    if (typeof gameLoop === 'function') {
      gameLoop();
    } else {
      console.error('[DEBUG] gameLoop function not available');
    }
    
    // Start ASCII animation if available
    try {
      if (typeof startAsciiAnimation === 'function') {
        startAsciiAnimation();
      }
    } catch (e) {
      console.warn('[DEBUG] Could not start ASCII animation:', e);
    }
    
    if (typeof addLog === 'function') {
      addLog(`Entered ${area.name} - Reach the end to victory!`);
    }
    
    console.log('[DEBUG] startRPG completed successfully');
  } catch (error) {
    console.error('[DEBUG] Error in startRPG:', error);
    gameState.combat.active = false;
    // Don't redirect to main menu on error, just log it
  }
}

function spawnSingleEnemy() {
  const area = areas[gameState.currentArea];
  const isBoss = area.boss && gameState.combat.spawnedEnemiesCount === area.enemies - 1;
  
  let enemyType;
  if (isBoss) {
    // Find boss for this area
    enemyType = enemyTypes.find(e => e.isBoss && e.areas && e.areas.includes(gameState.currentArea)) || enemyTypes.find(e => e.isBoss) || enemyTypes[3];
  } else {
    // Get area-specific enemies or fall back to generic
    const areaEnemies = enemyTypes.filter(e => !e.isBoss && (e.areaSpecific === false || (e.areas && e.areas.includes(gameState.currentArea))));
    if (areaEnemies.length > 0) {
      // 60% chance for area-specific, 40% for generic
      const genericEnemies = areaEnemies.filter(e => !e.areaSpecific);
      const specificEnemies = areaEnemies.filter(e => e.areaSpecific);
      if (specificEnemies.length > 0 && Math.random() < 0.6) {
        enemyType = specificEnemies[Math.floor(Math.random() * specificEnemies.length)];
      } else if (genericEnemies.length > 0) {
        enemyType = genericEnemies[Math.floor(Math.random() * genericEnemies.length)];
      } else {
        enemyType = specificEnemies[Math.floor(Math.random() * specificEnemies.length)];
      }
    } else {
      // Fallback to generic enemies
      const genericEnemies = enemyTypes.filter(e => !e.isBoss && !e.areaSpecific);
      enemyType = genericEnemies[Math.floor(Math.random() * genericEnemies.length)] || enemyTypes[0];
    }
  }
  
  // Handle group spawning for Plains area
  let spawnCount = 1;
  if (area.signatureMechanic === "groupSpawning" && !isBoss && Math.random() < 0.3) {
    spawnCount = 2 + Math.floor(Math.random() * 2); // 2-3 enemies
  }
  
  for (let i = 0; i < spawnCount; i++) {
    gameState.combat.enemies.push({
      ...enemyType,
      ascii: enemyType.ascii.slice(),
      x: 800 + (gameState.combat.spawnedEnemiesCount * 250) + Math.random() * 100 + (i * 50),
      y: 300 + (Math.random() * 40 - 20),
      maxHp: enemyType.hp,
      hp: enemyType.hp,
      lastDamage: 0,
      animFrame: 0,
      effects: {} // active status effects (poison, bleed, freeze, weaken) mapped to timers/values
    });
  }
  
  gameState.combat.spawnedEnemiesCount += spawnCount;
  gameState.combat.enemies.sort((a, b) => a.x - b.x);
}

// Utility: show an in-game confirmation modal with callback
function showConfirm(message, onYes) {
  let modal = el('confirm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'confirm-modal';
    modal.className = 'confirm-modal hidden';
    modal.innerHTML = `<div class="confirm-inner"><div id="confirm-msg"></div><div class="confirm-actions"><button id="confirm-yes" class="btn">Yes</button><button id="confirm-no" class="btn">No</button></div></div>`;
    document.body.appendChild(modal);
    const confirmNo = document.getElementById('confirm-no');
    if (confirmNo) {
      confirmNo.addEventListener('click', () => { modal.classList.add('hidden'); });
    }
  }
  el('confirm-msg').textContent = message;
  modal.classList.remove('hidden');
  const yesBtn = el('confirm-yes');
  const noBtn = el('confirm-no');
  const close = () => { modal.classList.add('hidden'); yesBtn.removeEventListener('click', handler); };
  const handler = () => { close(); onYes && onYes(); };
  yesBtn.addEventListener('click', handler);
}

// Simple combat simulator for balance testing
function simulateCombat(numTrials = 10) {
  let totalPlayerDamage = 0, totalEnemyDamage = 0, totalTime = 0;
  
  for (let trial = 0; trial < numTrials; trial++) {
    const equipped = gameState.equipped.weapon;
    const baseAttack = gameState.player.attack + (equipped ? (equipped.stats.attack || 0) : 0);
    const speedMult = equipped ? (equipped.stats.speed || 1) : 1;
    const playerDPS = Math.max(1, (baseAttack * speedMult));
    
    const enemy = { attack: 5, defense: 1, effects: {} };
    let enemyHp = 50, playerHp = gameState.player.maxHp;
    let combatTime = 0;
    
    while (enemyHp > 0 && playerHp > 0 && combatTime < 60) {
      const deltaTime = 0.016;
      
      // Player attacks
      const playerDamage = Math.max(1, playerDPS - enemy.defense);
      enemyHp -= playerDamage * deltaTime;
      
      // Life steal
      if (equipped && equipped.effect && equipped.effect.lifeSteal) {
        const heal = playerDamage * (equipped.effect.lifeSteal.percent || 0) * deltaTime;
        playerHp = Math.min(gameState.player.maxHp, playerHp + heal);
      }
      
      // Enemy attacks (reduced if frozen)
      let enemyAttack = enemy.attack;
      if (enemy.effects.freeze) {
        enemyAttack *= 0.5;
      }
      const enemyDamage = Math.max(1, enemyAttack - gameState.player.defense);
      playerHp -= enemyDamage * deltaTime;
      
      totalPlayerDamage += playerDamage * deltaTime;
      totalEnemyDamage += enemyDamage * deltaTime;
      combatTime += deltaTime;
    }
    
    totalTime += combatTime;
  }
  
  console.log(`=== Combat Simulator Results (${numTrials} trials) ===`);
  console.log(`Avg Player DPS: ${(totalPlayerDamage / numTrials).toFixed(2)}`);
  console.log(`Avg Enemy DPS: ${(totalEnemyDamage / numTrials).toFixed(2)}`);
  console.log(`Avg Combat Time: ${(totalTime / numTrials).toFixed(2)}s`);
  console.log(`Equipped: ${gameState.equipped.weapon ? gameState.equipped.weapon.name : 'None'}`);
  return {
    playerDPS: totalPlayerDamage / numTrials,
    enemyDPS: totalEnemyDamage / numTrials,
    avgTime: totalTime / numTrials
  };
}

// Export for console use: window.simulateCombat
if (typeof window !== 'undefined') {
  window.simulateCombat = simulateCombat;
}

function startEnemySpawner() {
  // Clear projectiles at the start of combat
  gameState.combat.projectiles = [];
  const area = areas[gameState.currentArea];
  gameState.combat.spawnIntervalId = setInterval(() => {
    if (!gameState.combat.active || gameState.combat.paused) return;
    if (gameState.combat.spawnedEnemiesCount >= area.enemies) {
      clearInterval(gameState.combat.spawnIntervalId);
      gameState.combat.spawnIntervalId = null;
      return;
    }
    spawnSingleEnemy();
  }, area.spawnRate);
}

function spawnEnemies() {
  // Deprecated - use spawnSingleEnemy and startEnemySpawner instead
}

function gameLoop() {
  if (!gameState.combat.active || gameState.combat.paused) return;
  
  const now = Date.now();
  const deltaTime = (now - gameState.combat.lastFrame) / 1000;
  gameState.combat.lastFrame = now;
  
  // Process area signature mechanics
  const currentArea = areas[gameState.currentArea];
  if (currentArea && currentArea.signatureMechanic && gameState.combat.areaMechanic) {
    const mechanic = gameState.combat.areaMechanic;
    
    switch (currentArea.signatureMechanic) {
      case "lowVisibility":
        // Dark Woods: Enemies are harder to see, slower spawn rate
        // Already handled in spawn rate
        break;
        
      case "windResistance":
        // Mountain Trail: Player moves slower (handled in scroll section)
        break;
        
      case "waterHazards":
        // River Crossing: Periodic water damage
        mechanic.waterHazardTimer = (mechanic.waterHazardTimer || 0) + deltaTime;
        if (mechanic.waterHazardTimer >= 3) {
          const damage = 2;
          gameState.player.hp -= damage;
          if (gameState.combat.floatingTexts) {
            gameState.combat.floatingTexts.push({ x: gameState.combat.playerX, y: 280, text: `-${damage}`, ttl: 1.0, alpha: 1, color: '#6ef' });
          }
          mechanic.waterHazardTimer = 0;
        }
        break;
        
      case "groupSpawning":
        // Plains: Already handled in spawnSingleEnemy
        break;
        
      case "darkness":
        // Cave System: Enemies have higher defense
        // Handled in enemy stats
        break;
        
      case "ritualPower":
        // Ancient Temple: Periodic buffs
        mechanic.ritualPowerBuff = (mechanic.ritualPowerBuff || 0) + deltaTime;
        if (mechanic.ritualPowerBuff >= 5) {
          const buff = 2;
          gameState.player.attack += buff;
          if (gameState.combat.floatingTexts) {
            gameState.combat.floatingTexts.push({ x: gameState.combat.playerX, y: 280, text: `+${buff} ATK`, ttl: 2.0, alpha: 1, color: '#ffd700' });
          }
          mechanic.ritualPowerBuff = 0;
          setTimeout(() => { gameState.player.attack = Math.max(2, gameState.player.attack - buff); }, 10000);
        }
        break;
        
      case "shadowClones":
        // Shadow Realm: Enemies occasionally spawn duplicates
        mechanic.shadowCloneTimer = (mechanic.shadowCloneTimer || 0) + deltaTime;
        if (mechanic.shadowCloneTimer >= 8 && gameState.combat.enemies.length > 0) {
          const randomEnemy = gameState.combat.enemies[Math.floor(Math.random() * gameState.combat.enemies.length)];
          if (randomEnemy && !randomEnemy.isClone) {
            gameState.combat.enemies.push({
              ...randomEnemy,
              isClone: true,
              hp: randomEnemy.hp * 0.5,
              maxHp: randomEnemy.maxHp * 0.5,
              x: randomEnemy.x + 100,
              effects: {}
            });
            mechanic.shadowCloneTimer = 0;
          }
        }
        break;
        
      case "manaSurges":
        // Magical Tower: Periodic damage bursts
        mechanic.lastManaSurge = (mechanic.lastManaSurge || 0) + deltaTime;
        if (mechanic.lastManaSurge >= 4) {
          const surgeDamage = 3;
          gameState.player.hp -= surgeDamage;
          if (gameState.combat.floatingTexts) {
            gameState.combat.floatingTexts.push({ x: gameState.combat.playerX, y: 280, text: `-${surgeDamage}`, ttl: 1.0, alpha: 1, color: '#f6f' });
          }
          mechanic.lastManaSurge = 0;
        }
        break;
        
      case "voidCorruption":
        // Final Sanctum: Gradual HP drain, but enemies are weaker
        mechanic.voidCorruptionTimer = (mechanic.voidCorruptionTimer || 0) + deltaTime;
        if (mechanic.voidCorruptionTimer >= 2) {
          const drain = 0.5;
          gameState.player.hp -= drain * deltaTime;
          mechanic.voidCorruptionTimer = 0;
        }
        break;
    }
  }
  
  // Check if player is colliding with any enemy
  let isColliding = false;
  let blockingEnemy = null;
  
  gameState.combat.enemies.forEach((enemy, index) => {
    const enemyScreenX = enemy.x - gameState.combat.scrollX;
    
    const playerRect = {
      x: gameState.combat.playerX,
      y: 300,
      width: 30, // Approximate width of player ASCII
      height: 40 // Approximate height of player ASCII
    };
    
    const enemyRect = {
      x: enemyScreenX,
      y: enemy.y,
      width: enemy.width,
      height: enemy.height
    };
    
    if (checkCollision(playerRect, enemyRect)) {
      isColliding = true;
      if (!blockingEnemy || enemyScreenX < blockingEnemy.screenX) {
        blockingEnemy = { enemy, index, screenX: enemyScreenX };
      }
    }
  });
  
  // Only scroll if not colliding with an enemy
  if (!isColliding) {
    // Wind resistance mechanic - player moves slower
    if (currentArea && currentArea.signatureMechanic === "windResistance") {
      gameState.combat.scrollX += 30 * deltaTime; // Reduced from 50
    } else {
      gameState.combat.scrollX += 50 * deltaTime;
    }
    gameState.combat.mapProgress = gameState.combat.scrollX;
  }
  
  // Check if player reached the end of the map
  const area = areas[gameState.currentArea];
  if (gameState.combat.mapProgress >= area.mapLength && gameState.combat.enemies.length === 0) {
    completeArea();
    return;
  }
  
  // Update enemies and handle combat
  // First, tick any status effects on enemies (poison/bleed/freeze/weaken)
  for (let i = gameState.combat.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.combat.enemies[i];
    if (enemy.effects) {
      // Poison
      if (enemy.effects.poison && enemy.effects.poison.timer > 0) {
        const dmg = (enemy.effects.poison.dmg || 0) * deltaTime;
        enemy.hp -= dmg;
        enemy.effects.poison.timer -= deltaTime;
        // floating text for DOT
        if (dmg > 0.01 && gameState.combat.floatingTexts) {
          gameState.combat.floatingTexts.push({ x: enemy.x - gameState.combat.scrollX, y: enemy.y - 10, text: `-${Math.ceil(dmg)}`, ttl: 0.9, alpha: 1, color: '#a6e' });
        }
      }
      // Bleed
      if (enemy.effects.bleed && enemy.effects.bleed.timer > 0) {
        const dmg = (enemy.effects.bleed.dmg || 0) * deltaTime;
        enemy.hp -= dmg;
        enemy.effects.bleed.timer -= deltaTime;
        if (dmg > 0.01 && gameState.combat.floatingTexts) {
          gameState.combat.floatingTexts.push({ x: enemy.x - gameState.combat.scrollX, y: enemy.y - 10, text: `-${Math.ceil(dmg)}`, ttl: 0.9, alpha: 1, color: '#f88' });
        }
      }
      // Weaken and Freeze timers
      if (enemy.effects.weaken && enemy.effects.weaken.timer > 0) {
        enemy.effects.weaken.timer -= deltaTime;
      }
      if (enemy.effects.freeze && enemy.effects.freeze.timer > 0) {
        enemy.effects.freeze.timer -= deltaTime;
      }
      // Clean up expired effects
      for (const k of Object.keys(enemy.effects)) {
        if (enemy.effects[k] && enemy.effects[k].timer <= 0) {
          delete enemy.effects[k];
        }
      }
      // If enemy died from DOT
      if (enemy.hp <= 0) {
        const xpGained = enemy.xp || 0;
        addXP(xpGained);
        addLog(`Defeated ${enemy.name} (+${xpGained} XP)`);
        refreshStats();
        gameState.combat.enemies.splice(i, 1);
        continue; // skip further processing for this enemy
      }
    }
  }

  // Update and check projectile collisions
  if (gameState.combat.projectiles && gameState.combat.projectiles.length) {
    for (let i = gameState.combat.projectiles.length - 1; i >= 0; i--) {
      const proj = gameState.combat.projectiles[i];
      proj.x += proj.vx * deltaTime;
      proj.y += proj.vy * deltaTime;
      proj.vy += 100 * deltaTime; // gravity
      
      // Check collision with enemies
      for (let j = 0; j < gameState.combat.enemies.length; j++) {
        const enemy = gameState.combat.enemies[j];
        const enemyScreenX = enemy.x - gameState.combat.scrollX;
        const dist = Math.sqrt(Math.pow(proj.x - enemyScreenX, 2) + Math.pow(proj.y - enemy.y, 2));
        
        if (dist < 20 && !proj.hit) {
          // Hit!
          const weaponDamage = (proj.weapon && proj.weapon.stats) ? proj.weapon.stats.attack || 1 : 1;
          const damage = Math.max(1, weaponDamage - enemy.defense * 0.5);
          enemy.hp -= damage;
          
          // Bow piercing: can hit multiple enemies
          if (proj.weapon && proj.weapon.weaponType === "bow" && !proj.hit) {
            // Check for additional enemies in line
            for (let k = j + 1; k < gameState.combat.enemies.length; k++) {
              const nextEnemy = gameState.combat.enemies[k];
              const nextEx = nextEnemy.x - gameState.combat.scrollX;
              const nextEy = nextEnemy.y + 10;
              const nextDist = Math.sqrt(Math.pow(proj.x - nextEx, 2) + Math.pow(proj.y - nextEy, 2));
              if (nextDist < 30) {
                const nextDamage = Math.max(1, weaponDamage * 0.7 - nextEnemy.defense * 0.5); // 70% damage to second enemy
                nextEnemy.hp -= nextDamage;
                if (gameState.combat.floatingTexts) {
                  gameState.combat.floatingTexts.push({
                    x: nextEx,
                    y: nextEnemy.y - 20,
                    text: `-${Math.ceil(nextDamage)}`,
                    ttl: 1.0,
                    alpha: 1,
                    color: '#f88'
                  });
                }
                break;
              }
            }
          }
          
          proj.hit = true;
          
          // Floating text
          if (gameState.combat.floatingTexts) {
            gameState.combat.floatingTexts.push({
              x: enemyScreenX,
              y: enemy.y - 20,
              text: `-${Math.ceil(damage)}`,
              ttl: 1.0,
              alpha: 1,
              color: '#f88'
            });
          }
          
          // Impact particles
          if (gameState.combat.particles) {
            for (let x = 0; x < 5; x++) {
              gameState.combat.particles.push({
                x: proj.x,
                y: proj.y,
                vx: (Math.random() - 0.5) * 80,
                vy: -Math.random() * 60,
                life: 0.5,
                maxLife: 0.5,
                color: '#f88',
                size: 2
              });
            }
          }
          
          // Check if enemy died from projectile
          if (enemy.hp <= 0) {
            const xpGained = enemy.xp || 0;
            addXP(xpGained);
            addLog(`Defeated ${enemy.name} (+${xpGained} XP)`);
            refreshStats();
            gameState.combat.enemies.splice(j, 1);
          }
          break;
        }
      }
      
      // Remove if off-screen or hit
      if (proj.hit || proj.x < 0 || proj.x > gameCanvas.width || proj.y > gameCanvas.height) {
        gameState.combat.projectiles.splice(i, 1);
      }
    }
  }

  if (blockingEnemy) {
    const { enemy: blockingEnemyRef, index: blockingIndex } = blockingEnemy;
    // Find the actual enemy in the array to ensure we're modifying the correct object
    // Try to find by reference first, then by index, then fall back to the reference
    let enemy = gameState.combat.enemies.find(e => e === blockingEnemyRef);
    if (!enemy && blockingIndex >= 0 && blockingIndex < gameState.combat.enemies.length) {
      enemy = gameState.combat.enemies[blockingIndex];
    }
    if (!enemy) {
      enemy = blockingEnemyRef; // Fall back to original reference
    }
    
    // Get the current index of the enemy in the array
    const index = gameState.combat.enemies.indexOf(enemy);
    
    // Only proceed if enemy exists in the array
    if (index !== -1 && enemy) {
      // Get the enemy from the array directly to ensure we're working with the correct object
      const arrayEnemy = gameState.combat.enemies[index];
      if (!arrayEnemy) {
        // Enemy not found in array, skip combat logic for this enemy
      } else {
        // Ranged weapon: spawn projectiles toward the nearest enemy within range
        const equipped = gameState.equipped.weapon;
        if (equipped && equipped.weaponType === "bow" && equipped.stats.range) {
          // Fire projectiles at intervals based on weapon speed
          const fireRate = 0.5 / (equipped.stats.speed || 1); // seconds between shots
          if (!gameState.combat.lastPlayerProjectile) gameState.combat.lastPlayerProjectile = 0;
          const timeSinceFire = (Date.now() - gameState.combat.lastPlayerProjectile) / 1000;

          if (timeSinceFire > fireRate) {
        // find nearest enemy within weapon range (measured from player screen position)
        const spawnX = gameState.combat.playerX + 20;
        const spawnY = 310;
        let nearest = null;
        let nearestDist = Infinity;
        for (let k = 0; k < gameState.combat.enemies.length; k++) {
          const e = gameState.combat.enemies[k];
          const ex = e.x - gameState.combat.scrollX;
          const ey = e.y + 10;
          const dx = ex - spawnX;
          const dy = ey - spawnY;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d <= (equipped.stats.range || 0) && d < nearestDist) {
            nearestDist = d;
            nearest = e;
          }
        }

        if (nearest) {
          // Spawn projectile toward the selected enemy
          gameState.combat.projectiles = gameState.combat.projectiles || [];
          const projectileAscii = itemAsciiArt[equipped.projectile] || itemAsciiArt.projectile_arrow;
          const targetScreenX = nearest.x - gameState.combat.scrollX;
          const targetScreenY = nearest.y + 10;
          let dx = targetScreenX - spawnX;
          let dy = targetScreenY - spawnY;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (!isFinite(dist) || dist < 1) dist = 1; // avoid division by zero
          // base speed in pixels per second (tweakable). Use weapon range to scale slightly.
          const baseSpeed = Math.min(1000, Math.max(300, (equipped.stats.range || 300) * 1.2));
          const vx = (dx / dist) * baseSpeed;
          const vy = (dy / dist) * baseSpeed;

          gameState.combat.projectiles.push({
            x: spawnX,
            y: spawnY,
            targetX: targetScreenX,
            targetY: targetScreenY,
            vx,
            vy,
            damage: Math.max(1, (equipped.stats.attack || 1) * (equipped.stats.speed || 1)),
            ascii: projectileAscii,
            hit: false,
            weapon: equipped
          });
          gameState.combat.lastPlayerProjectile = Date.now();

          // Add recoil particle effect
            if (gameState.combat.particles) {
              gameState.combat.particles.push({
                x: gameState.combat.playerX + 5,
                y: 315,
                vx: -30,
                vy: 10,
                life: 0.3,
                maxLife: 0.3,
                color: '#6ef',
                size: 2
              });
            }
          }
        }
      }
      
      // Melee weapon: deal damage directly
      if (!equipped || equipped.weaponType !== "bow") {
        // Debug: confirm we're in the melee damage block
        if (!gameState.combat._meleeBlockLogged) {
          console.log('[DEBUG] Entering melee damage block. equipped:', equipped, 'weaponType:', equipped?.weaponType);
          gameState.combat._meleeBlockLogged = true;
        }
        
        // Deal damage to enemy continuously while touching
        // arrayEnemy is already defined above
        
        const baseAttack = gameState.player.attack + (equipped ? (equipped.stats.attack || 0) : 0);
        let speedMult = equipped ? (equipped.stats.speed || 1) : 1;
        if (gameState.player.speedBuff) speedMult += gameState.player.speedBuff;
        let damageMultiplier = 1;

        // Weapon signature mechanics
        if (equipped && gameState.combat.weaponMechanics) {
          const wm = gameState.combat.weaponMechanics;
          
          if (equipped.weaponType === "sword") {
            // Swords: Combo system - damage increases with consecutive hits
            wm.swordComboTimer = (wm.swordComboTimer || 0) + deltaTime;
            if (wm.swordComboTimer > 2) {
              wm.swordCombo = 0; // Reset combo if too much time passes
            }
            wm.swordCombo = (wm.swordCombo || 0) + 1;
            wm.swordComboTimer = 0;
            damageMultiplier = 1 + (wm.swordCombo * 0.05); // 5% per combo stack, max 50% at 10 stacks
            if (wm.swordCombo > 10) wm.swordCombo = 10;
          } else if (equipped.weaponType === "shortsword") {
            // Shortswords: Critical hits - chance for double damage
            if (Math.random() < 0.15) { // 15% crit chance
              damageMultiplier = 2;
              if (gameState.combat.floatingTexts) {
                gameState.combat.floatingTexts.push({ x: arrayEnemy.x - gameState.combat.scrollX, y: arrayEnemy.y - 20, text: "CRIT!", ttl: 1.0, alpha: 1, color: '#ffd700' });
              }
            }
          } else if (equipped.weaponType === "bow") {
            // Bows: Piercing - can hit multiple enemies (handled in projectile collision)
            // No special multiplier needed here
          } else if (equipped.weaponType === "heavy") {
            // Heavy: Stagger - chance to stun enemies briefly
            if (Math.random() < 0.25) { // 25% stagger chance
              arrayEnemy.effects = arrayEnemy.effects || {};
              arrayEnemy.effects.stagger = { timer: 1.0 };
              damageMultiplier = 1.2; // 20% bonus damage on stagger
            }
          }
        }

        // Apply weaken effect on enemy (temporary defense reduction)
        const weakenReduction = arrayEnemy.effects && arrayEnemy.effects.weaken ? (arrayEnemy.effects.weaken.defenseReduction || 0) : 0;

        const playerDPS = Math.max(1, (baseAttack * speedMult * damageMultiplier) - Math.max(0, arrayEnemy.defense - weakenReduction));
        const damageDealt = playerDPS * deltaTime;
        
        // Debug: log first time to see what's happening
        if (!gameState.combat._damageDebugLogged) {
          console.log('[DEBUG] Damage calc - baseAttack:', baseAttack, 'speedMult:', speedMult, 'enemy.defense:', arrayEnemy.defense, 'weakenReduction:', weakenReduction, 'playerDPS:', playerDPS, 'deltaTime:', deltaTime, 'damageDealt:', damageDealt);
          gameState.combat._damageDebugLogged = true;
        }
        
        // Always apply damage if enemy is alive and damage is positive
        if (arrayEnemy.hp > 0 && damageDealt > 0) {
          const oldHp = arrayEnemy.hp;
          arrayEnemy.hp = Math.max(0, arrayEnemy.hp - damageDealt);
          // Update the local enemy variable for consistency
          enemy.hp = arrayEnemy.hp;
          // Debug: log damage occasionally to verify it's working
          if (Math.random() < 0.1) { // 10% chance to log
            console.log('[DEBUG] Dealing damage:', damageDealt.toFixed(4), 'DPS:', playerDPS.toFixed(2), 'enemy HP:', oldHp.toFixed(2), '->', arrayEnemy.hp.toFixed(2));
          }
        } else {
          if (Math.random() < 0.05) {
            console.log('[DEBUG] No damage. damageDealt:', damageDealt, 'enemy.hp:', arrayEnemy?.hp, 'playerDPS:', playerDPS);
          }
        }

        // Apply life steal if weapon has it
        if (equipped && equipped.effect && equipped.effect.lifeSteal && equipped.effect.lifeSteal.percent) {
          const heal = damageDealt * (equipped.effect.lifeSteal.percent || 0);
          gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + heal);
          // floating heal text
          if (heal > 0.01 && gameState.combat.floatingTexts) {
            gameState.combat.floatingTexts.push({ x: gameState.combat.playerX, y: 280, text: `+${Math.ceil(heal)}`, ttl: 0.9, alpha: 1, color: '#8f8' });
          }
        }
      }
      
      // Apply on-hit status effects from equipped weapon (poison, bleed, freeze, weaken)
      // This applies to both melee and ranged weapons when they hit
      if (equipped && equipped.effect) {
        // Poison
        if (equipped.effect.poison) {
          const p = equipped.effect.poison;
          arrayEnemy.effects = arrayEnemy.effects || {};
          arrayEnemy.effects.poison = { timer: p.duration || 3, dmg: p.dmg || 1 };
          // spawn particle
          if (gameState.combat.particles) {
            for (let x = 0; x < 3; x++) {
              gameState.combat.particles.push({
                x: arrayEnemy.x - gameState.combat.scrollX + Math.random() * 20 - 10,
                y: arrayEnemy.y + Math.random() * 20,
                vx: (Math.random() - 0.5) * 50,
                vy: Math.random() * 20 - 10,
                life: 0.6,
                maxLife: 0.6,
                color: '#a6e',
                size: 3
              });
            }
          }
        }
        // Bleed
        if (equipped.effect.bleed) {
          const b = equipped.effect.bleed;
          arrayEnemy.effects = arrayEnemy.effects || {};
          arrayEnemy.effects.bleed = { timer: b.duration || 4, dmg: b.dmg || 2 };
          if (gameState.combat.particles) {
            for (let x = 0; x < 2; x++) {
              gameState.combat.particles.push({
                x: arrayEnemy.x - gameState.combat.scrollX,
                y: arrayEnemy.y - 5,
                vx: Math.random() * 30 - 15,
                vy: -Math.random() * 30,
                life: 0.8,
                maxLife: 0.8,
                color: '#f88',
                size: 2
              });
            }
          }
        }
        // Freeze (chance)
        if (equipped.effect.freeze && Math.random() < (equipped.effect.freeze.chance || 0)) {
          const f = equipped.effect.freeze;
          arrayEnemy.effects = arrayEnemy.effects || {};
          arrayEnemy.effects.freeze = { timer: f.duration || 1.5, slowFactor: 0.5 };
          if (gameState.combat.particles) {
            for (let x = 0; x < 4; x++) {
              gameState.combat.particles.push({
                x: arrayEnemy.x - gameState.combat.scrollX + Math.random() * 25 - 12,
                y: arrayEnemy.y + Math.random() * 20,
                vx: (Math.random() - 0.5) * 40,
                vy: Math.random() * 15 - 8,
                life: 1.0,
                maxLife: 1.0,
                color: '#6ef',
                size: 2
              });
            }
          }
        }
        // Weaken (chance)
        if (equipped.effect.weaken && Math.random() < (equipped.effect.weaken.chance || 0)) {
          const w = equipped.effect.weaken;
          arrayEnemy.effects = arrayEnemy.effects || {};
          arrayEnemy.effects.weaken = { timer: w.duration || 3, defenseReduction: w.defenseReduction || 1 };
          if (gameState.combat.particles) {
            for (let x = 0; x < 2; x++) {
              gameState.combat.particles.push({
                x: arrayEnemy.x - gameState.combat.scrollX,
                y: arrayEnemy.y - 10,
                vx: Math.random() * 40 - 20,
                vy: -Math.random() * 20,
                life: 0.7,
                maxLife: 0.7,
                color: '#ffc',
                size: 2
              });
            }
          }
        }
      }
      
      if (arrayEnemy.hp <= 0) {
        const xpGained = arrayEnemy.xp;
        addXP(xpGained);
        addLog(`Defeated ${arrayEnemy.name} (+${xpGained} XP)`);
        refreshStats(); // Update stats to show XP gain
        gameState.combat.enemies.splice(index, 1);
        
        // Check if all enemies defeated
        if (gameState.combat.enemies.length === 0) {
          completeArea();
          return;
        }
      }
      
      // Take damage from enemy continuously while touching
      // Apply freeze effect (reduce enemy attack while frozen)
      let enemyAttackEffective = arrayEnemy.attack;
      if (arrayEnemy.effects && arrayEnemy.effects.freeze && arrayEnemy.effects.freeze.timer > 0) {
        enemyAttackEffective = enemyAttackEffective * (arrayEnemy.effects.freeze.slowFactor || 0.5);
      }
      // Apply stagger effect (reduce enemy attack while staggered)
      if (arrayEnemy.effects && arrayEnemy.effects.stagger && arrayEnemy.effects.stagger.timer > 0) {
        enemyAttackEffective = enemyAttackEffective * 0.3; // 70% reduction
        arrayEnemy.effects.stagger.timer -= deltaTime;
        if (arrayEnemy.effects.stagger.timer <= 0) {
          delete arrayEnemy.effects.stagger;
        }
      }
      // Apply player's equipped armor defense
      const playerDefenseTotal = gameState.player.defense + (gameState.equipped.armor ? (gameState.equipped.armor.stats.defense || 0) : 0);
      let enemyDamage = Math.max(1, enemyAttackEffective - playerDefenseTotal);
      
      // Shield blocking mechanic
      const shield = gameState.equipped.armor && gameState.equipped.armor.weaponType === "shield" ? gameState.equipped.armor : null;
      if (shield && Math.random() < 0.3) { // 30% block chance
        enemyDamage = 0;
        if (gameState.combat.floatingTexts && gameState.combat.weaponMechanics) {
          const wm = gameState.combat.weaponMechanics;
          if (!wm.lastBlock || Date.now() - wm.lastBlock > 500) { // Throttle block messages
            gameState.combat.floatingTexts.push({ x: gameState.combat.playerX, y: 280, text: "BLOCK!", ttl: 0.8, alpha: 1, color: '#6ef' });
            wm.lastBlock = Date.now();
          }
        }
      }
      
      gameState.player.hp -= enemyDamage * deltaTime;
      
      if (gameState.player.hp <= 0) {
        gameState.player.hp = 0;
        gameOver();
        return;
      }
      } // Close else block for arrayEnemy check
    } // Close if (index !== -1 && enemy) block
  }
  
  // Draw
  draw();
  
  // Update UI (both RPG and general stats for real-time XP display)
  updateRPGUI();
  el("xp-display").textContent = `${gameState.player.xp} / ${gameState.player.xpToNext}`;
  
  animationFrameId = requestAnimationFrame(gameLoop);
}

function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

function drawASCII(text, x, y, color, fontSize = 12) {
  if (!ctx) {
    console.warn('[DEBUG] drawASCII called but ctx is not available');
    return;
  }
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = "center"; // draw centered so variable-width frames stay anchored
  ctx.textBaseline = "top";
  
  const lines = text;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * fontSize);
  });
}

// Get player ASCII representation with equipped items
function getPlayerASCIIWithEquipment() {
  const hasWeapon = gameState.equipped.weapon;
  const hasArmor = gameState.equipped.armor;
  
  // Base player
  let playerASCII = ["  O  ", " /|\\ ", " / \\ "];
  
  if (hasArmor && hasArmor.weaponType === "shield") {
    // With shield - show on left side
    if (hasWeapon && hasWeapon.weaponType !== "bow") {
      // Weapon + shield combo
      return [" [ O  ", "[/|\\\\", "[ / \\ "];
    } else if (hasWeapon && hasWeapon.weaponType === "bow") {
      // Bow + shield
      return [" [ O> ", "[/| \\", "[ |  "];
    } else {
      // Just shield
      return [" [ O  ", "[/|\\ ", "[ / \\ "];
    }
  } else if (hasWeapon) {
    if (hasWeapon.weaponType === "bow") {
      // Bow stance
      return ["  O  ", " >|< ", " / \\ "];
    } else if (hasWeapon.weaponType === "heavy") {
      // Heavy weapon
      return ["  O  ", " /|\\ ", " /|\\ "];
    } else if (hasWeapon.weaponType === "sword") {
      // Regular sword
      return ["  O  ", " /|\\ ", " > \\ "];
    } else if (hasWeapon.weaponType === "shortsword") {
      // Short sword
      return ["  O  ", " /|\\ ", " />\\ "];
    }
  }
  
  // Add armor indicator if wearing armor but not shield
  if (hasArmor && hasArmor.type === "armor") {
    return ["  O  ", "[||\\ ", " / \\ "];
  }
  
  return playerASCII;
}

function drawASCII(text, x, y, color, fontSize = 12) {
  if (!ctx) {
    console.warn('[DEBUG] drawASCII called but ctx is not available');
    return;
  }
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = "center"; // draw centered so variable-width frames stay anchored
  ctx.textBaseline = "top";
  
  const lines = text;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * fontSize);
  });
}

function drawBackground() {
  const area = areas[gameState.currentArea];
  const bgType = area.background || "forest";
  
  // Parallax layers - far background scrolls slower
  const scrollOffsetFar = (gameState.combat.scrollX * 0.2) % 400; // Background layer moves at 20%
  const scrollOffsetMid = (gameState.combat.scrollX * 0.5) % 400; // Middle layer at 50%
  const scrollOffsetNear = gameState.combat.scrollX % 400;      // Foreground at 100%
  
  // Simple ASCII background patterns that repeat and scroll
  const backgroundsLayers = {
    forest: {
      far: ["▲", "▲", "▲"],
      mid: ["🌲", "🌲"],
      near: ["▲▲", "▲", "▲▲"]
    },
    woods: {
      far: ["🌲", "🌲", "🌲"],
      mid: ["🌲", "🌲"],
      near: ["🌲🌲", "🌲"]
    },
    mountain: {
      far: ["⛰", "⛰"],
      mid: ["⛰", "⛰"],
      near: ["⛰⛰", "⛰"]
    },
    river: {
      far: ["≈", "≈"],
      mid: ["≈≈", "≈"],
      near: ["≈≈≈", "≈≈"]
    },
    plains: {
      far: ["~", "~"],
      mid: ["~", "~"],
      near: ["~~", "~"]
    },
    cave: {
      far: ["●", "●"],
      mid: ["●●", "●"],
      near: ["●●●", "●●"]
    },
    temple: {
      far: ["◼", "◼"],
      mid: ["◼◼", "◼"],
      near: ["◼◼◼", "◼◼"]
    },
    shadow: {
      far: ["◆", "◆"],
      mid: ["◆◆", "◆"],
      near: ["◆◆◆", "◆"]
    },
    tower: {
      far: ["▮", "▮"],
      mid: ["▮▮", "▮"],
      near: ["▮▮▮", "▮▮"]
    },
    sanctum: {
      far: ["★", "★"],
      mid: ["★★", "★"],
      near: ["★★★", "★★"]
    }
  };
  
  const layers = backgroundsLayers[bgType] || backgroundsLayers.forest;
  
  // Draw far background layer (slowest, most faded)
  ctx.fillStyle = "rgba(80, 80, 100, 0.15)";
  ctx.font = "32px monospace";
  for (let row = 0; row < 2; row++) {
    let x = -scrollOffsetFar;
    while (x < gameCanvas.width) {
      const idx = row % layers.far.length;
      ctx.fillText(layers.far[idx], x + 50, 20 + row * 80);
      x += 120;
    }
  }
  
  // Draw mid background layer (medium speed, medium faded)
  ctx.fillStyle = "rgba(100, 100, 120, 0.25)";
  ctx.font = "28px monospace";
  for (let row = 0; row < 2; row++) {
    let x = -scrollOffsetMid;
    while (x < gameCanvas.width) {
      const idx = row % layers.mid.length;
      ctx.fillText(layers.mid[idx], x + 50, 80 + row * 70);
      x += 110;
    }
  }
  
  // Draw near foreground layer (fastest, most visible)
  ctx.fillStyle = "rgba(100, 100, 120, 0.3)";
  ctx.font = "24px monospace";
  for (let row = 0; row < 2; row++) {
    let x = -scrollOffsetNear;
    while (x < gameCanvas.width) {
      const idx = row % layers.near.length;
      ctx.fillText(layers.near[idx], x + 50, 140 + row * 60);
      x += 100;
    }
  }
}

function draw() {
  // Clear canvas
  ctx.fillStyle = "#020203";
  ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
  
  // Draw scrolling background based on area
  drawBackground();
  
  // Draw ground
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 350, gameCanvas.width, 50);
  
  // Draw ground line
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 350);
  ctx.lineTo(gameCanvas.width, 350);
  ctx.stroke();
  
  // Draw player ASCII art with equipment
  const playerY = 300;
  const playerFontSize = 14;
  const playerASCIIToDraw = getPlayerASCIIWithEquipment();
  drawASCII(playerASCIIToDraw, gameState.combat.playerX, playerY, "#6ef", playerFontSize);
  
  // Draw enemies
  gameState.combat.enemies.forEach(enemy => {
    const x = enemy.x - gameState.combat.scrollX;
    if (x > -50 && x < gameCanvas.width + 50) {
      const enemyY = enemy.y;
      const enemyFontSize = enemy.name === "Boss" ? 16 : 12;
      
      // Draw enemy ASCII art
      const enemyColor = enemy.name === "Shadow" ? "#666" : 
                        enemy.name === "Boss" ? "#f44" : "#f66";
      drawASCII(enemy.ascii, x, enemyY, enemyColor, enemyFontSize);
      
      // Draw status icons (poison, freeze, weaken, bleed)
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      let iconX = x + 20;
      if (enemy.effects) {
        if (enemy.effects.poison) {
          ctx.fillStyle = '#a6e'; ctx.fillText('☠', iconX, enemyY - 28); iconX += 18;
        }
        if (enemy.effects.bleed) {
          ctx.fillStyle = '#f88'; ctx.fillText('✸', iconX, enemyY - 28); iconX += 18;
        }
        if (enemy.effects.freeze) {
          ctx.fillStyle = '#6ef'; ctx.fillText('❄', iconX, enemyY - 28); iconX += 18;
        }
        if (enemy.effects.weaken) {
          ctx.fillStyle = '#ffd'; ctx.fillText('↓', iconX, enemyY - 28); iconX += 18;
        }
      }
      
      // Draw status timers above icons
      if (enemy.effects) {
        ctx.font = '10px monospace';
        ctx.fillStyle = '#ccc';
        let timerX = x + 20;
        if (enemy.effects.poison) {
          ctx.fillText(enemy.effects.poison.timer.toFixed(1), timerX, enemyY - 32);
          timerX += 18;
        }
        if (enemy.effects.bleed) {
          ctx.fillText(enemy.effects.bleed.timer.toFixed(1), timerX, enemyY - 32);
          timerX += 18;
        }
        if (enemy.effects.freeze) {
          ctx.fillText(enemy.effects.freeze.timer.toFixed(1), timerX, enemyY - 32);
          timerX += 18;
        }
        if (enemy.effects.weaken) {
          ctx.fillText(enemy.effects.weaken.timer.toFixed(1), timerX, enemyY - 32);
          timerX += 18;
        }
      }
      
  // Draw health bar background (centered on x)
  const barWidth = enemy.name === "Boss" ? 60 : 40;
  const barHeight = 6;
  ctx.fillStyle = "#081018";
  ctx.fillRect(x - barWidth / 2, enemyY - 15, barWidth, barHeight);
      
  // Draw health bar
  const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = enemyColor;
  ctx.fillRect(x - barWidth / 2, enemyY - 15, barWidth * hpPercent, barHeight);
      
  // Draw health bar border
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.strokeRect(x - barWidth / 2, enemyY - 15, barWidth, barHeight);
      
  // Draw enemy name (centered)
  ctx.fillStyle = "#fff";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(enemy.name, x, enemyY - 18);
    }
  });

  // Draw projectiles
  if (gameState.combat.projectiles && gameState.combat.projectiles.length) {
    gameState.combat.projectiles.forEach(proj => {
      ctx.fillStyle = '#f8f';
      ctx.globalAlpha = 0.9;
      // Draw projectile as small rectangle with rotation
      const angle = Math.atan2(proj.vy, proj.vx);
      ctx.save();
      ctx.translate(proj.x, proj.y);
      ctx.rotate(angle);
      ctx.fillRect(-8, -2, 16, 4);
      ctx.restore();
      ctx.globalAlpha = 1;
    });
  }

  // Draw floating texts (damage numbers, heals, notifications)
  if (gameState.combat.floatingTexts && gameState.combat.floatingTexts.length) {
    for (let i = gameState.combat.floatingTexts.length - 1; i >= 0; i--) {
      const ft = gameState.combat.floatingTexts[i];
      ctx.globalAlpha = ft.alpha || 1;
      ctx.fillStyle = ft.color || '#fff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y - (1 - ft.alpha) * 10);
      ctx.globalAlpha = 1;
      // decrease ttl and alpha
      ft.ttl -= 1/60;
      ft.alpha -= 0.02;
      ft.y -= 0.3; // float upward
      if (ft.ttl <= 0 || ft.alpha <= 0) {
        gameState.combat.floatingTexts.splice(i, 1);
      }
    }
  }

  // Draw particles (effect visual feedback)
  if (gameState.combat.particles && gameState.combat.particles.length) {
    for (let i = gameState.combat.particles.length - 1; i >= 0; i--) {
      const p = gameState.combat.particles[i];
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color || '#fff';
      ctx.fillRect(p.x, p.y, p.size || 4, p.size || 4);
      // update particle
      p.x += p.vx * (deltaTime || 0.016);
      p.y += p.vy * (deltaTime || 0.016);
      p.vy += 50 * (deltaTime || 0.016); // gravity
      p.life -= (deltaTime || 0.016);
      if (p.life <= 0) {
        gameState.combat.particles.splice(i, 1);
      }
    }
    ctx.globalAlpha = 1;
  }
}

function updateRPGUI() {
  const hpPercent = Math.max(0, gameState.player.hp / gameState.player.maxHp);
  el("player-hp-bar").style.width = `${hpPercent * 100}%`;
  el("player-hp-text").textContent = `${Math.floor(gameState.player.hp)} / ${gameState.player.maxHp}`;
}

function completeArea() {
  gameState.combat.active = false;
  cancelAnimationFrame(animationFrameId);
  // Stop spawn timer if running
  if (gameState.combat.spawnIntervalId) {
    clearInterval(gameState.combat.spawnIntervalId);
    gameState.combat.spawnIntervalId = null;
  }
  
  const area = areas[gameState.currentArea];
  
  // Give exclusive item
  const exclusiveItem = {
    id: `exclusive_${gameState.currentArea}`,
    name: `${area.name} Trophy`,
    type: "quest",
    stats: {}
  };
  addToInventory(exclusiveItem.id, exclusiveItem, 1);
  addLog(`Received ${exclusiveItem.name} for clearing ${area.name}`);
  
  // Unlock new material and gathering for this area
  if (area.unlockedMaterial && area.unlockedMaterial !== "charcoal") {
    const gatheringAction = gatheringActions.find(a => a.id === `gather${area.unlockedMaterial.charAt(0).toUpperCase() + area.unlockedMaterial.slice(1)}`);
    if (gatheringAction && !gameState.unlockedIdleFeatures.includes(gatheringAction.unlock)) {
      gameState.unlockedIdleFeatures.push(gatheringAction.unlock);
      addLog(`Unlocked ${area.unlockedMaterial} gathering!`);
    }
  }
  
  // Unlock next area after finishing map
  if (gameState.currentArea < areas.length - 1) {
    const nextAreaIndex = gameState.currentArea + 1;
    if (!gameState.unlockedAreas.includes(nextAreaIndex)) {
      gameState.unlockedAreas.push(nextAreaIndex);
      addLog(`Unlocked new area: ${areas[nextAreaIndex].name}`);
    }
  }
  
  // Unlock unlockables (recipes and gathering) defined on the area
  if (area.unlockables && Array.isArray(area.unlockables)) {
    area.unlockables.forEach(u => {
      if (!gameState.unlockedIdleFeatures.includes(u)) {
        gameState.unlockedIdleFeatures.push(u);
        addLog(`Unlocked ${u}`);
      }
    });
    refreshGatheringMenu();
    refreshMagicMenu();
    refreshCraftingMenu();
    refreshStructuresMenu();
  }
  
  // Also unlock unlockIdle if available
  if (area.unlockIdle && !gameState.unlockedIdleFeatures.includes(area.unlockIdle)) {
    gameState.unlockedIdleFeatures.push(area.unlockIdle);
    addLog(`Unlocked ${area.unlockIdle}`);
  }
  
  refreshStats();
  refreshInventory();
  refreshGatheringMenu();
  refreshMagicMenu();
  refreshCraftingMenu();
  refreshStructuresMenu();
  showIdleMenu("gathering-menu");
  el("combat-section").classList.add("hidden");
  el("idle-section").classList.remove("hidden");
}

function gameOver() {
  gameState.combat.active = false;
  cancelAnimationFrame(animationFrameId);
  // Stop spawn timer if running
  if (gameState.combat.spawnIntervalId) {
    clearInterval(gameState.combat.spawnIntervalId);
    gameState.combat.spawnIntervalId = null;
  }
  addLog("You were defeated! Recovering over time...");
  showIdleMenu("gathering-menu");
  el("combat-section").classList.add("hidden");
  el("idle-section").classList.remove("hidden");
  refreshStats();
}

function pauseRPG() {
  gameState.combat.paused = !gameState.combat.paused;
  if (!gameState.combat.paused) {
    gameState.combat.lastFrame = Date.now();
    gameLoop();
  }
}

function exitRPG() {
  console.log('[DEBUG] exitRPG called');
  if (gameState.combat.active) {
    gameState.combat.active = false;
    if (typeof cancelAnimationFrame === 'function' && typeof animationFrameId !== 'undefined') {
      cancelAnimationFrame(animationFrameId);
    }
    // Clear any active projectiles so they don't persist between combats
    gameState.combat.projectiles = [];
    if (typeof showIdleMenu === 'function') {
      showIdleMenu("gathering-menu");
    }
    const combatSection = document.getElementById("combat-section");
    const idleSection = document.getElementById("idle-section");
    if (combatSection) combatSection.classList.add("hidden");
    if (idleSection) idleSection.classList.remove("hidden");
  }
}

// Save/Load
function saveGame() {
  const saveData = {
    player: { ...gameState.player },
    resources: { ...gameState.resources },
    inventory: JSON.parse(JSON.stringify(gameState.inventory)),
    equipped: { ...gameState.equipped },
    unlockedAreas: [...gameState.unlockedAreas],
    unlockedIdleFeatures: [...gameState.unlockedIdleFeatures],
    structureLevels: { ...gameState.structureLevels },
    currentArea: gameState.currentArea,
    settings: { ...gameState.settings },
    capacity: { ...gameState.capacity },
    gameTime: Date.now(),
    // Persist active gathering jobs (intervals are transient and not serialized)
    activeActions: Object.fromEntries(Object.entries(gameState.activeActions || {}).map(([k, v]) => [k, { startTime: v.startTime, duration: v.duration }]))
  };
  
  localStorage.setItem("survivalMagicRPG_save", JSON.stringify(saveData));
  addLog("Game saved!");
}

function loadGame() {
  const saveData = localStorage.getItem("survivalMagicRPG_save");
  if (!saveData) {
    addLog("No save file found");
    return false;
  }
  
  try {
    const data = JSON.parse(saveData);
    gameState.player = { ...data.player };
    gameState.resources = { ...data.resources };
    gameState.inventory = data.inventory || {};
    gameState.equipped = data.equipped || { weapon: null, armor: null };
    gameState.unlockedAreas = data.unlockedAreas || [0];
    gameState.unlockedIdleFeatures = data.unlockedIdleFeatures || [];
  gameState.structureLevels = data.structureLevels || {};
    gameState.currentArea = data.currentArea || 0;
    gameState.settings = { ...data.settings };
    gameState.capacity = data.capacity || { current: 0, max: 100 };
    // Restore active gathering jobs (UI intervals will be created for each)
    gameState.activeActions = data.activeActions || {};
    
    addLog("Game loaded!");
    refreshStats();
    refreshGatheringMenu();
    refreshMagicMenu();
    refreshCraftingMenu();
    refreshStructuresMenu();
    refreshInventory();
    // Recreate UI intervals for any active gathering jobs
    Object.keys(gameState.activeActions || {}).forEach(jobId => {
      // If the job is already past due, process it immediately
      const job = gameState.activeActions[jobId];
      if (!job) return;
      if (Date.now() >= (job.startTime || 0) + (job.duration || 0)) {
        const actionDef = gatheringActions.find(a => a.id === jobId);
        if (actionDef) completeGatheringAction(actionDef);
        else delete gameState.activeActions[jobId];
      } else {
        setupGatheringUIInterval(jobId);
      }
    });
    // Restart auto-generators after load based on built structures
    structures.forEach(structure => {
      if (gameState.unlockedIdleFeatures.includes(structure.id)) {
        const actionMap = {
          "autoWood": "gatherWood",
          "autoMeat": "gatherMeat",
          "autoWater": "gatherWater",
          "autoPlants": "gatherPlants",
          "autoStone": "gatherStone",
          "autoRitualStones": "gatherRitualStones"
        };
        const mappedActionId = actionMap[structure.effect];
        if (mappedActionId) {
          gameState.autoGenerators[mappedActionId] = { 
            rate: structure.rate,
            resource: structure.resource,
            amount: structure.amount
          };
          startAutoGenerator(mappedActionId, structure);
        }

        // Re-apply healing from built healing structures
        if (structure.effect === "healing") {
          if (!gameState.passiveHealing) {
            gameState.passiveHealing = { amount: 1, interval: 5000, structuresBuilt: [], intervalId: null };
          }
          const level = gameState.structureLevels[structure.id] || 1;
          if (structure.healAmount) {
            // Add base healAmount per built level
            gameState.passiveHealing.amount += structure.healAmount * level;
          }
          if (structure.healInterval) {
            // take the fastest interval among built structures and scale it slightly for upgrades
            const scaledInterval = Math.max(1000, Math.floor(structure.healInterval * Math.pow(0.9, Math.max(0, level - 1))));
            gameState.passiveHealing.interval = Math.min(gameState.passiveHealing.interval, scaledInterval);
          }
          if (!gameState.passiveHealing.structuresBuilt.includes(structure.id)) {
            gameState.passiveHealing.structuresBuilt.push(structure.id);
          }
        }
      }
    });
    // Start passive healing after restoring structures
    if (gameState.passiveHealing) startPassiveHealing();
    return true;
  } catch (e) {
    addLog("Error loading save file");
    return false;
  }
}

// Event Listeners
function initEventListeners() {
  // Main Menu
  const startBtn = document.getElementById("btn-start");
  if (startBtn) {
    startBtn.addEventListener("click", startGame);
    try { console.log('[DEBUG] Start button event listener attached'); } catch (e) {}
  } else {
    try { console.warn('[DEBUG] Start button not found when attaching listener'); } catch (e) {}
  }

  // Delegated fallback: catch clicks even if the button is replaced later
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t) return;
    if (t.id === 'btn-start') {
      try { console.log('[DEBUG] Delegated click handler triggered for btn-start'); } catch (e) {}
      startGame();
    }
  });
  
  const loadBtn = document.getElementById("btn-load");
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      if (loadGame()) {
        showScreen("game-screen");
        refreshGatheringMenu();
        refreshMagicMenu();
        refreshCraftingMenu();
        refreshStructuresMenu();
        refreshInventory();
        // Restart auto-generators after load based on built structures
        structures.forEach(structure => {
          if (gameState.unlockedIdleFeatures.includes(structure.id)) {
            const actionMap = {
              "autoWood": "gatherWood",
              "autoMeat": "gatherMeat",
              "autoWater": "gatherWater",
              "autoPlants": "gatherPlants",
              "autoStone": "gatherStone",
              "autoRitualStones": "gatherRitualStones"
            };
            const mappedActionId = actionMap[structure.effect];
            if (mappedActionId) {
              gameState.autoGenerators[mappedActionId] = { 
                rate: structure.rate,
                resource: structure.resource,
                amount: structure.amount
              };
              startAutoGenerator(mappedActionId, structure);
            }
          }
        });
      }
    });
  }
  
  const settingsBtn = document.getElementById("btn-settings");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      showScreen("settings-screen");
    });
  }
  
  const settingsBackBtn = document.getElementById("btn-settings-back");
  if (settingsBackBtn) {
    settingsBackBtn.addEventListener("click", () => {
      showScreen("main-menu");
    });
  }
  
  // Settings
  const volumeSlider = document.getElementById("volume-slider");
  if (volumeSlider) {
    volumeSlider.addEventListener("input", (e) => {
      gameState.settings.volume = parseInt(e.target.value);
      const volumeValue = document.getElementById("volume-value");
      if (volumeValue) volumeValue.textContent = gameState.settings.volume;
    });
  }
  
  const autoSaveToggle = document.getElementById("auto-save-toggle");
  if (autoSaveToggle) {
    autoSaveToggle.addEventListener("change", (e) => {
      gameState.settings.autoSave = e.target.checked;
    });
  }
  
  // Idle Navigation - attach both direct listeners and event delegation
  attachMenuEventListeners();
  
  // Also attach direct listeners as primary method
  const btnGathering = document.getElementById("btn-gathering");
  if (btnGathering) {
    btnGathering.addEventListener("click", () => {
      console.log('[DEBUG] Gathering button clicked (direct)');
      showIdleMenu("gathering-menu");
      refreshGatheringMenu();
    });
    console.log('[DEBUG] Gathering button event listener attached');
  } else {
    console.warn('[DEBUG] Gathering button not found');
  }
  
  const btnMagic = document.getElementById("btn-magic");
  if (btnMagic) {
    btnMagic.addEventListener("click", () => {
      console.log('[DEBUG] Magic button clicked (direct)');
      showIdleMenu("magic-menu");
      refreshMagicMenu();
    });
    console.log('[DEBUG] Magic button event listener attached');
  } else {
    console.warn('[DEBUG] Magic button not found');
  }
  
  const btnCrafting = document.getElementById("btn-crafting");
  if (btnCrafting) {
    btnCrafting.addEventListener("click", () => {
      console.log('[DEBUG] Crafting button clicked (direct)');
      showIdleMenu("crafting-menu");
      refreshCraftingMenu();
    });
    console.log('[DEBUG] Crafting button event listener attached');
  } else {
    console.warn('[DEBUG] Crafting button not found');
  }
  
  const btnStructures = document.getElementById("btn-structures");
  if (btnStructures) {
    btnStructures.addEventListener("click", () => {
      console.log('[DEBUG] Structures button clicked (direct)');
      showIdleMenu("structures-menu");
      refreshStructuresMenu();
    });
    console.log('[DEBUG] Structures button event listener attached');
  } else {
    console.warn('[DEBUG] Structures button not found');
  }
  
  const btnInventory = document.getElementById("btn-inventory");
  if (btnInventory) {
    btnInventory.addEventListener("click", () => {
      console.log('[DEBUG] Inventory button clicked (direct)');
      showIdleMenu("inventory-menu");
      refreshInventory();
    });
    console.log('[DEBUG] Inventory button event listener attached');
  } else {
    console.warn('[DEBUG] Inventory button not found');
  }
  
  const btnCombat = document.getElementById("btn-combat");
  if (btnCombat) {
    btnCombat.addEventListener("click", () => {
      console.log('[DEBUG] Combat button clicked');
      showAreaSelection();
    });
    console.log('[DEBUG] Combat button event listener attached');
  } else {
    console.warn('[DEBUG] Combat button not found');
  }
  
  const btnCancelArea = document.getElementById("btn-cancel-area-selection");
  if (btnCancelArea) {
    btnCancelArea.addEventListener("click", () => {
      const overlay = document.getElementById("area-selection-overlay");
      if (overlay) overlay.classList.add("hidden");
    });
  }
  
  const btnExitCombat = document.getElementById("btn-exit-combat");
  if (btnExitCombat) {
    btnExitCombat.addEventListener("click", () => {
      exitRPG();
    });
  }
  
  const btnPause = document.getElementById("btn-pause");
  if (btnPause) {
    btnPause.addEventListener("click", () => {
      pauseRPG();
    });
  }
  
  const btnSaveGame = document.getElementById("btn-save-game");
  if (btnSaveGame) {
    btnSaveGame.addEventListener("click", () => {
      saveGame();
    });
  }
  
  const btnMenu = document.getElementById("btn-menu");
  if (btnMenu) {
    btnMenu.addEventListener("click", () => {
      if (gameState.combat.active) {
        exitRPG();
      }
      showScreen("main-menu");
    });
  }
  
  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    
    if (e.key === "i" || e.key === "I") {
      if (el("game-screen").classList.contains("hidden")) return;
      showIdleMenu("inventory-menu");
      refreshInventory();
    } else if (e.key === "m" || e.key === "M") {
      if (el("game-screen").classList.contains("hidden")) return;
      if (gameState.combat.active) {
        exitRPG();
      } else {
        showAreaSelection();
      }
    } else if (e.key === "p" || e.key === "P") {
      if (gameState.combat.active) {
        pauseRPG();
      }
    }
  });
  
  // Auto-save
  setInterval(() => {
    if (gameState.settings.autoSave) {
      saveGame();
    }
  }, 60000); // Every minute
}

// Initialize
function init() {
  try { console.log('[DEBUG] init()'); } catch(e){}
  initRPG();
  try { console.log('[DEBUG] calling initEventListeners()'); } catch(e){}
  initEventListeners();
  showScreen("main-menu");
  // Start passive healing system (runs in background and can be modified by structures)
  if (gameState.passiveHealing) startPassiveHealing();
  // Periodically check timestamped gathering jobs so they complete even after tab inactivity
  setInterval(processGatheringJobs, 1000);
  addLog("Welcome to Survival Magic RPG!");
}

// Start game when page loads
window.addEventListener("DOMContentLoaded", init);

// Global error hook to help detect initialization/runtime errors
window.addEventListener('error', function (ev) {
  try {
    console.error('[DEBUG] window error:', ev && ev.message);
    if (document && document.body) document.body.setAttribute('data-js-error', String(ev && ev.message));
  } catch (e) {}
});

// If the DOM is already ready (script loaded after DOMContentLoaded), call init immediately
try {
  if (document && document.readyState && document.readyState !== 'loading') {
    try { console.log('[DEBUG] DOM already ready — calling init() immediately'); } catch (e) {}
    init();
  }
} catch (e) {}

// Fallback global click handler: ensures Start Game can be triggered even if
// initialization didn't run (helps when event wiring is skipped or blocked).
document.addEventListener('click', (e) => {
  try {
    const t = e.target;
    if (!t) return;
    if (t.id === 'btn-start') {
      try { console.log('[FALLBACK] #btn-start clicked'); } catch (e) {}
      try {
        // Use global startGame function if available, otherwise fall back to individual calls
        if (typeof startGame === 'function') {
          startGame();
        } else {
          // Best-effort start sequence (calls same public functions used by init)
          if (typeof showScreen === 'function') showScreen('game-screen');
          if (typeof refreshStats === 'function') refreshStats();
          if (typeof refreshGatheringMenu === 'function') refreshGatheringMenu();
          if (typeof refreshMagicMenu === 'function') refreshMagicMenu();
          if (typeof refreshCraftingMenu === 'function') refreshCraftingMenu();
          if (typeof refreshStructuresMenu === 'function') refreshStructuresMenu();
          if (typeof refreshInventory === 'function') refreshInventory();
          try { document.body.setAttribute('data-start-clicked', String(Date.now())); } catch (e) {}
          try { addLog('Game started! [fallback]'); } catch (e) {}
        }
      } catch (err) {
        try { console.error('[FALLBACK] start error', err); } catch (e) {}
        try { document.body.setAttribute('data-js-error', String(err && err.message)); } catch (e) {}
      }
    }
  } catch (err) {}
});

/* ASCII Animator: walking and attacking preview that runs while in RPG */
const asciiAnimator = {
  elId: "ascii-anim",
  interval: null,
  fps: 8,
  frame: 0,
  running: false,
  mode: "idle" // idle | walk | attack
};

function combineAscii(leftLines, rightLines, gap = 6, leftOffset = 0, rightOffset = 0) {
  // leftOffset/rightOffset shift by adding spaces to simulate movement toward/away
  const leftWidth = Math.max(...leftLines.map(l => l.length));
  const height = Math.max(leftLines.length, rightLines.length);
  const out = [];
  for (let i = 0; i < height; i++) {
    const l = (leftLines[i] || "").padEnd(leftWidth, ' ');
    const r = (rightLines[i] || "");
    const leftPad = ' '.repeat(Math.max(0, leftOffset));
    const rightPad = ' '.repeat(Math.max(0, rightOffset));
    out.push(leftPad + l + ' '.repeat(Math.max(2, gap)) + r + rightPad);
  }
  return out;
}

// Player frames: walking (3 frames) and attacking (3 frames)
const playerFrames = {
  walk: [
    ["  O  ", " /|\\ ", " / \\ "],
    ["  O  ", " /|\\ ", " > \\ "],
    ["  O  ", " /|\\ ", " | \\ "],
    ["  O  ", " /|\\ ", " |>\\ "],
  ],
  attack: [
    ["  O  ", " /|\\ ", " / \\ "],
    ["  O> ", " /|  ", " / \\ "],
    ["  O  ", " /|\\ ", " / \\ "],
  ],
  idle: [
    ["  O  ", " /|\\ ", " / \\ "],
  ]
};

// Enemy generic frames: can be extended per enemy type
function getEnemyFrameSet(enemy) {
  const base = (enemy && enemy.ascii) || ["  o  ", " /|\\ ", " / \\"];
  const alt = base.map(l => l.replace(/\\\\|\//g, m => (m === '/' ? '\\' : '/')));
  return {
    walk: [base, alt],
    attack: [
      base,
      base.map(l => l.replace(/\|/, '\\|')),
      base
    ],
    idle: [base]
  };
}

function findBlockingEnemy() {
  if (!gameState.combat || !gameState.combat.enemies) return null;
  let blocking = null;
  gameState.combat.enemies.forEach((enemy, index) => {
    const enemyScreenX = enemy.x - gameState.combat.scrollX;
    const playerRect = { x: gameState.combat.playerX, y: 300, width: 30, height: 40 };
    const enemyRect = { x: enemyScreenX, y: enemy.y, width: enemy.width, height: enemy.height };
    if (checkCollision(playerRect, enemyRect)) {
      if (!blocking || enemyScreenX < blocking.screenX) {
        blocking = { enemy, index, screenX: enemyScreenX };
      }
    }
  });
  return blocking;
}

function renderAsciiPreview() {
  const el = document.getElementById(asciiAnimator.elId);
  if (!el) return;

  // Determine animation mode based on combat state
  let mode = 'idle';
  if (gameState.combat && gameState.combat.active) {
    const blocking = findBlockingEnemy();
    if (blocking) mode = 'attack';
    else mode = 'walk';
  }
  asciiAnimator.mode = mode;

  // Animate player
  const pSet = playerFrames[mode] || playerFrames.idle;
  const pIdx = asciiAnimator.frame % pSet.length;
  const left = pSet[pIdx];

  // Ensure the in-canvas player sprite uses the current animated frame by
  // mutating the global `playerASCII` in-place (it's declared as const).
  try {
    if (Array.isArray(playerASCII)) {
      playerASCII.length = 0;
      left.forEach(l => playerASCII.push(l));
    } else {
      window.playerASCII = left.slice();
    }
  } catch (err) {}

  // Note: Enemy animation disabled for now - enemies render with their base ASCII directly
  // To re-enable: uncommment below code and ensure enemy.ascii copies persist correctly

  // Keep the overlay element empty/hidden to avoid duplicate visuals
  try {
    el.textContent = '';
    el.style.opacity = '0';
  } catch (err) {}

  asciiAnimator.frame++;
}

function startAsciiAnimation() {
  const el = document.getElementById(asciiAnimator.elId);
  if (!el) return;
  if (asciiAnimator.running) return;
  asciiAnimator.running = true;
  asciiAnimator.frame = 0;
  // Keep the DOM preview hidden; animation will update the canvas data directly
  el.style.display = 'none';
  renderAsciiPreview();
  asciiAnimator.interval = setInterval(renderAsciiPreview, 1000 / asciiAnimator.fps);
}

function stopAsciiAnimation() {
  const el = document.getElementById(asciiAnimator.elId);
  asciiAnimator.running = false;
  if (asciiAnimator.interval) {
    clearInterval(asciiAnimator.interval);
    asciiAnimator.interval = null;
  }
  if (el) {
    // Ensure overlay is cleared and hidden
    el.style.opacity = '0';
    el.textContent = '';
    el.style.display = 'none';
  }
}

// Hook animator into RPG lifecycle safely (preserve existing functions)
// Note: startAsciiAnimation is now called directly from startRPG
// Other functions can call stopAsciiAnimation if needed
