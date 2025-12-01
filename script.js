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
    autoSave: true,
    language: 'en' // 'en' or 'pt-BR'
  },
  // New feature tracking
  achievements: {},
  dailyQuests: {},
  quests: [],
  equippedAmulet: null,
  areaReplays: {}, // Track how many times each area has been completed
  prestigeLevel: 0,
  prestigePoints: 0,
  specialAbilities: [],
  activeAbilities: {}, // Currently active special abilities with cooldowns
  bossPhases: {}, // Track boss phase per area/boss
  tutorialProgress: {},
  bossRewards: {}, // Track which boss-specific rewards have been earned
  endlessWave: 0,
  dungeonFloor: 0,
  statistics: {
    enemiesKilled: 0,
    bossesDefeated: 0,
    areasCompleted: 0,
    itemsCrafted: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    playTime: 0,
    deaths: 0
  },
  diary: {
    // Track encounters for diary entries
    enemyEncounters: {}, // {enemyName: count}
    itemUsage: {}, // {itemId: {crafted: count, used: count, equipped: count}}
    areaVisits: {}, // {areaId: visitCount}
    bossEncounters: {} // {bossName: count}
  },
  gameMode: 'normal', // 'normal', 'endless', 'dungeon'
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
    projectiles: [],
    // Animation state
    playerAnimFrame: 0,
    playerAnimState: 'idle', // idle, walk, attack
    lastAnimUpdate: 0
  }
};
// Language System
const translations = {
  en: {
    // UI
    'gameTitle': 'Survival Magic RPG',
    'startGame': 'Start Game',
    'loadGame': 'Load Game',
    'settings': 'Settings',
    'back': 'Back',
    'hp': 'HP',
    'level': 'Level',
    'attack': 'Attack',
    'defense': 'Defense',
    'experience': 'Experience',
    'inventory': 'Inventory',
    'gathering': 'Gathering',
    'magic': 'Magic',
    'crafting': 'Crafting',
    'structures': 'Structures',
    'combat': 'Combat',
    'save': 'Save',
    'menu': 'Menu',
    'achievements': 'Achievements',
    'quests': 'Quests',
    'dailyQuests': 'Daily Quests',
    'subquests': 'Subquests',
    'statistics': 'Statistics',
    'tutorial': 'Tutorial',
    'prestige': 'Prestige',
    'endlessMode': 'Endless Mode',
    'infiniteDungeon': 'Infinite Dungeon',
    'language': 'Language',
    'english': 'English',
    'portuguese': 'Portuguese (BR)',
    'volume': 'Volume'
  },
  'pt-BR': {
    // UI
    'gameTitle': 'RPG Magia de Sobrevivência',
    'startGame': 'Iniciar Jogo',
    'loadGame': 'Carregar Jogo',
    'settings': 'Configurações',
    'back': 'Voltar',
    'hp': 'PV',
    'level': 'Nível',
    'attack': 'Ataque',
    'defense': 'Defesa',
    'experience': 'Experiência',
    'inventory': 'Inventário',
    'gathering': 'Coleta',
    'magic': 'Magia',
    'crafting': 'Criação',
    'structures': 'Estruturas',
    'combat': 'Combate',
    'save': 'Salvar',
    'menu': 'Menu',
    'achievements': 'Conquistas',
    'quests': 'Missões',
    'dailyQuests': 'Missões Diárias',
    'subquests': 'Submissões',
    'statistics': 'Estatísticas',
    'tutorial': 'Tutorial',
    'prestige': 'Prestígio',
    'endlessMode': 'Modo Infinito',
    'infiniteDungeon': 'Calabouço Infinito',
    'language': 'Idioma',
    'english': 'Inglês',
    'portuguese': 'Português (BR)',
    'volume': 'Volume'
  }
};

function t(key) {
  const lang = gameState.settings.language || 'en';
  return translations[lang]?.[key] || translations.en[key] || key;
}

// Lore System - Comprehensive lore for all game elements
const loreData = {
  // Items with extensive lore
  woodenSword: { description: 'Basic melee weapon', lore: 'Carved from ancient forest timber, this blade has served countless adventurers. The wood still whispers with the memories of the great trees that once covered this land.' },
  stoneSword: { description: 'Reliable sword with stone edge', lore: 'The first real weapon crafted by survivors after the fall. Stone never rusts, symbolizing the enduring will of those who refuse to give up.' },
  longsword: { description: 'A powerful two-handed sword', lore: 'Forged in the fires of desperation, this blade cleaves through darkness. Its length represents the long path ahead for any true warrior.' },
  claymore: { description: 'Massive greatsword', lore: 'A weapon of legend, once wielded by the royal guard. The sheer weight of it speaks to the strength required to wield justice.' },
  dagger: { description: 'Quick and deadly', lore: 'Small but deadly, this blade was favored by assassins and scouts. Speed often trumps strength in the shadows.' },
  ironDagger: { description: 'Sharpened iron blade', lore: 'The mark of a true survivor - iron forged in hardship, sharpened by necessity. Many lives have been saved by such simple tools.' },
  handAxe: { description: 'Small and efficient axe', lore: 'Originally a tool for survival, this axe became a weapon when the monsters came. Versatility is its greatest strength.' },
  mace: { description: 'Crushing weapon', lore: 'Designed to break through armor and bone alike. The sound of it striking echoes with the fury of those who refuse to be crushed.' },
  huntingSling: { description: 'Basic ranged weapon', lore: 'A simple weapon used for hunting game. In desperate times, even the humble sling can become a weapon of war.' },
  spearThrower: { description: 'Throwing spear weapon', lore: 'Ancient design, timeless effectiveness. The spear has been humanity\'s companion since the first hunt.' },
  crystalRecurve: { description: 'Magical bow', lore: 'Infused with crystal energy, each arrow glows with otherworldly light. The bow itself hums with contained power.' },
  flameBow: { description: 'Fire-infused bow', lore: 'Forged in the depths of the Magical Tower, this bow never runs out of flame-tipped arrows. Fire is both creator and destroyer.' },
  heavyClub: { description: 'Crude but effective', lore: 'Sometimes the simplest weapons are the most effective. This club has crushed many a monster\'s skull.' },
  throwingSpear: { description: 'Heavy throwing weapon', lore: 'A weapon of honor, thrown with precision. The warriors of old would challenge each other with such spears.' },
  metalMaul: { description: 'Crushing metal maul', lore: 'Salvaged from the ruins of civilization. Even broken, the old world\'s tools are still deadly.' },
  warhammer: { description: 'Legendary hammer', lore: 'Once belonged to a hero of legend. The hammer itself seems to remember its past glory, striking with righteous fury.' },
  obsidianBlade: { description: 'Dark sinister blade', lore: 'Forged from the obsidian found only in the Shadow Realm. The blade seems to drink the light around it, leaving only darkness.' },
  woodenShield: { description: 'Basic protection', lore: 'A simple shield of wood and hide. Not much, but it can mean the difference between life and death.' },
  stoneShield: { description: 'Heavy stone shield', lore: 'Carved from mountain stone, this shield is as much a weapon as protection. Many enemies have been crushed by its weight.' },
  metalShield: { description: 'Reinforced metal shield', lore: 'Salvaged metal plates bound together. Each dent tells a story of survival against impossible odds.' },
  oreShield: { description: 'Heavy ore shield', lore: 'Forged from the finest ore, this shield shimmers with inner strength. Few weapons can pierce its defense.' },
  obsidianShield: { description: 'Shield of void', lore: 'Made from the darkest obsidian, this shield seems to absorb attacks into nothingness. The void protects its bearer.' },
  leatherArmor: { description: 'Light protective clothing', lore: 'Basic protection made from hide. Comfortable and practical, it\'s the armor of choice for scouts and travelers.' },
  boneArmor: { description: 'Armor reinforced with bone', lore: 'Bones of fallen creatures, turned into protection. Some say you can hear the whispers of the dead when you wear it.' },
  magicArmor: { description: 'Magically enhanced armor', lore: 'Infused with protective magic, this armor shimmers with defensive energy. The magic within adapts to threats.' },
  oreArmor: { description: 'Heavy ore armor', lore: 'Forged from the finest ores, this armor is nearly impenetrable. The weight is a small price for such protection.' },
  voidArmor: { description: 'Void-touched armor', lore: 'Armor that has been touched by the void itself. It seems to phase through attacks, making the wearer nearly untouchable.' },
  healingPotion: { description: 'Restores health', lore: 'A simple healing brew made from plants and water. The recipe has been passed down through generations of survivors.' },
  strongHealingPotion: { description: 'Strong health restoration', lore: 'Enhanced with magical crystals, this potion can heal even the most grievous wounds. Truly a lifesaver.' },
  essencePotion: { description: 'Powerful essence potion', lore: 'Bottled magical essence, pure life force. Drinking it is said to restore both body and spirit.' },
  backpack: { description: 'Increases inventory capacity', lore: 'A sturdy backpack for carrying supplies. Essential for any long journey into the unknown.' },
  reinforcedBackpack: { description: 'Enhanced capacity', lore: 'Reinforced with metal and leather, this backpack can carry far more than seems possible. Magic may be involved.' },
  magicSatchel: { description: 'Magical storage', lore: 'A satchel with spatial magic woven into its fabric. It can hold far more than its size suggests - truly a marvel.' },
  
  // Resources with lore
  wood: { description: 'Basic building material', lore: 'Lifeblood of the forest. Each piece tells the story of the trees that once covered this land in green.' },
  stone: { description: 'Common stone material', lore: 'The bones of the earth itself. Simple but essential, stone has built civilizations.' },
  meat: { description: 'Food from hunted creatures', lore: 'The price of survival. Every meal reminds us of the cycle of life and death in this harsh world.' },
  water: { description: 'Essential resource', lore: 'Pure and life-giving. In a world where magic fades, water remains the source of all life.' },
  plants: { description: 'Gathering plants', lore: 'Nature\'s bounty, providing both food and medicine. The old ways knew the secrets of every plant.' },
  hide: { description: 'Animal hide', lore: 'Respect for the creatures we hunt. Every hide is a tribute to the life that sustained us.' },
  ritualStones: { description: 'Magical ritual stones', lore: 'Ancient stones marked with runes. They pulse with the magic that once filled this world.' },
  scrapMetal: { description: 'Salvaged metal', lore: 'Remnants of the old world. Each piece is a memory of what was lost, repurposed for survival.' },
  crystal: { description: 'Magical crystal', lore: 'Glows with inner light. Some say it contains the memories of the fallen, preserving their essence forever.' },
  bone: { description: 'Creature bones', lore: 'Death made useful. Bones are repurposed into tools and armor, honoring the creatures that provide them.' },
  charcoal: { description: 'Burned wood', lore: 'The product of controlled fire. Charcoal burns longer and hotter, essential for advanced crafting.' },
  ore: { description: 'Metal ore', lore: 'Raw metal waiting to be refined. The mountains hold many secrets, and ore is among the most valuable.' },
  clay: { description: 'Wet clay', lore: 'Malleable earth, perfect for crafting. Clay remembers the shape you give it, holding it even after firing.' },
  fiber: { description: 'Plant fibers', lore: 'The threads that bind. From simple rope to complex cloth, fibers are the foundation of civilization.' },
  sulfur: { description: 'Volcanic sulfur', lore: 'Found deep in caves where the earth\'s fire still burns. Caustic and dangerous, but powerful in alchemy.' },
  gold: { description: 'Precious metal', lore: 'The metal of kings and legends. Even in the apocalypse, gold holds value and power.' },
  obsidian: { description: 'Volcanic glass', lore: 'Formed in extreme heat and pressure. Sharp as a razor and dark as the void, obsidian is the material of shadows.' },
  essence: { description: 'Pure magical essence', lore: 'The lifeblood of magic itself. Handle with care - raw essence can overwhelm the unprepared mind.' },
  void: { description: 'Void essence', lore: 'The absence of existence made manifest. Dangerous to the uninitiated, void essence represents the end of all things.' },
  
  // Enemies with lore
  Goblin: { lore: 'Small but fierce, goblins are the most common threat. They work in packs, using numbers to overwhelm their prey.' },
  Orc: { lore: 'Brutish and strong, orcs prefer direct confrontation. Their crude weapons belie their deadly effectiveness.' },
  Shadow: { lore: 'Not quite alive, not quite dead. Shadows are remnants of souls that refused to move on, bound to this world by unfinished business.' },
  Wolf: { lore: 'Wild creatures driven mad by the changing magic. Once loyal companions, they now see all as prey.' },
  "Dark Stalker": { lore: 'Predators that thrive in darkness. Their eyes glow with malevolent intelligence, and they hunt with terrifying precision.' },
  "Mountain Troll": { lore: 'Ancient creatures of stone and earth. They move slowly but hit with devastating force. Legends say they guard hidden treasures.' },
  "River Serpent": { lore: 'Massive serpents that claim the rivers as their domain. Their scales are as hard as armor, and their venom is deadly.' },
  "Plains Raider": { lore: 'Marauders who roam the open plains. They fight with desperation, having lost everything to the chaos that consumed the world.' },
  "Cave Bat": { lore: 'Swarming creatures of the darkness. Individually weak, but in numbers they can strip flesh from bone in minutes.' },
  "Temple Guardian": { lore: 'Constructs created by ancient magic to guard sacred places. They do not tire, do not feel pain, and will not stop until destroyed.' },
  "Shadow Wraith": { lore: 'Elite warriors consumed by shadow magic. Once heroes, they now serve darker purposes, their humanity lost to the void.' },
  "Tower Mage": { lore: 'Mages who survived the fall by locking themselves in their towers. Isolation has driven many mad, but their power remains formidable.' },
  "Void Spawn": { lore: 'Creatures born from the void itself. They should not exist, yet here they are - harbingers of the end of all things.' },
  "Forest Guardian": { lore: 'A protector of the old ways, awakened by the disturbance in nature. Defeating it may unlock hidden knowledge, but at what cost?' },
  "Ancient Golem": { lore: 'Forged in ages past to guard the temple. Its power never wanes, and its purpose never changes. An eternal sentinel of stone and magic.' },
  "Void Lord": { lore: 'The embodiment of nothingness itself. To face it is to face the end of existence. Only the truly powerful can hope to stand against such a being.' },
  
  // Areas with lore
  "Forest Path": { lore: 'Your journey begins here. The ancient trees whisper secrets of old, and the path forward is clear - but danger lurks in every shadow.' },
  "Dark Woods": { lore: 'Shadows grow deeper here. Something ancient stirs in the darkness, and the very air seems to resist your passage. The Forest Guardian awaits.' },
  "Mountain Trail": { lore: 'High altitudes and harsh winds make this trail treacherous. The mountains hold ancient secrets and valuable ores, but trolls guard them jealously.' },
  "River Crossing": { lore: 'The river flows with dark water. Serpents rule these waters, and crossing requires both courage and skill. Clay deposits line the banks.' },
  "Plains": { lore: 'Open and exposed, the plains offer no hiding places. Raiders roam freely here, preying on the unwary. But the grasslands hold valuable resources.' },
  "Cave System": { lore: 'Deep underground, where light dares not venture. The caves are home to dangerous creatures and valuable sulfur deposits. Darkness itself becomes the enemy.' },
  "Ancient Temple": { lore: 'Built before the fall, this temple still stands. The Ancient Golem guards its secrets, and the power within could change everything.' },
  "Shadow Realm": { lore: 'A place where reality bends and shadows rule. Those who enter may never leave, consumed by the darkness that birthed this realm.' },
  "Magical Tower": { lore: 'A tower that pierces the sky, still humming with residual magic. The mages within have been changed by their isolation - but their power remains.' },
  "Final Sanctum": { lore: 'The end of the journey, or perhaps a new beginning. The Void Lord awaits, and beyond lies either salvation or oblivion. The choice is yours.' }
};

// Tooltip System - now uses comprehensive loreData
const tooltipData = loreData;

function showTooltip(element, itemId, itemObj) {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.id = 'tooltip';
  
  const data = tooltipData[itemId] || {};
  const desc = data.description || itemObj?.description || '';
  const lore = data.lore || '';
  
  tooltip.innerHTML = `
    <div class="tooltip-name">${itemObj?.name || itemId}</div>
    ${desc ? `<div class="tooltip-desc">${desc}</div>` : ''}
    ${itemObj?.stats ? `<div class="tooltip-stats">${Object.entries(itemObj.stats).map(([k,v])=>`${k}: ${v}`).join(', ')}</div>` : ''}
    ${lore ? `<div class="tooltip-lore">"${lore}"</div>` : ''}
  `;
  
  document.body.appendChild(tooltip);
  
  const rect = element.getBoundingClientRect();
  tooltip.style.left = rect.right + 10 + 'px';
  tooltip.style.top = rect.top + 'px';
  
  element.addEventListener('mouseleave', () => {
    tooltip.remove();
  }, { once: true });
}

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

// Helper function to check if achievement prerequisites are met
function checkAchievementPrerequisites(ach) {
  if (!ach.prerequisites) return true;
  
  // Check achievement prerequisites
  if (ach.prerequisites.achievements) {
    for (const reqId of ach.prerequisites.achievements) {
      if (!gameState.achievements[reqId]) return false;
    }
  }
  
  // Check area prerequisites
  if (ach.prerequisites.areas) {
    for (const areaId of ach.prerequisites.areas) {
      if (!gameState.unlockedAreas.includes(areaId)) return false;
    }
  }
  
  // Check level prerequisites
  if (ach.prerequisites.level) {
    if (gameState.player.level < ach.prerequisites.level) return false;
  }
  
  return true;
}

// Achievements System - Expanded to 50+ achievements with prerequisites
const achievementsList = [
  // Tier 1: Early Game (No prerequisites)
  { id: 'first_kill', name: 'First Blood', desc: 'Defeat your first enemy', reward: { gold: 10 } },
  { id: 'first_gather', name: 'Gatherer', desc: 'Gather your first resource', reward: { gold: 5 } },
  { id: 'first_craft', name: 'Crafter', desc: 'Craft your first item', reward: { gold: 10 } },
  { id: 'level_5', name: 'Apprentice', desc: 'Reach level 5', reward: { gold: 25 } },
  { id: 'kill_10', name: 'Warrior Novice', desc: 'Defeat 10 enemies', reward: { gold: 30 } },
  
  // Tier 2: Early Progress (Requires first_kill)
  { id: 'kill_25', name: 'Warrior', desc: 'Defeat 25 enemies', reward: { gold: 50 }, prerequisites: { achievements: ['first_kill'] } },
  { id: 'craft_10', name: 'Artisan', desc: 'Craft 10 items', reward: { gold: 40 }, prerequisites: { achievements: ['first_craft'] } },
  { id: 'gather_100', name: 'Resource Collector', desc: 'Gather 100 resources total', reward: { gold: 35 }, prerequisites: { achievements: ['first_gather'] } },
  { id: 'level_10', name: 'Veteran', desc: 'Reach level 10', reward: { gold: 100 }, prerequisites: { achievements: ['level_5'] } },
  { id: 'complete_area_1', name: 'Area Explorer', desc: 'Complete the first area', reward: { gold: 50, xp: 50 }, prerequisites: { achievements: ['first_kill'] } },
  
  // Tier 3: Area Progress (Requires area completion)
  { id: 'boss_slayer', name: 'Boss Slayer', desc: 'Defeat a boss', reward: { gold: 50, essence: 5 }, prerequisites: { areas: [1] } },
  { id: 'complete_area_2', name: 'Dark Wanderer', desc: 'Complete Dark Woods area', reward: { gold: 75, essence: 3 }, prerequisites: { achievements: ['complete_area_1'] } },
  { id: 'complete_area_3', name: 'Mountain Climber', desc: 'Complete Mountain Trail area', reward: { gold: 75, crystal: 5 }, prerequisites: { achievements: ['complete_area_2'] } },
  { id: 'complete_area_4', name: 'River Crosser', desc: 'Complete River Crossing area', reward: { gold: 75, clay: 10 }, prerequisites: { achievements: ['complete_area_3'] } },
  { id: 'complete_area_5', name: 'Plains Rider', desc: 'Complete Plains area', reward: { gold: 100, fiber: 10 }, prerequisites: { achievements: ['complete_area_4'] } },
  
  // Tier 4: Advanced Combat (Requires multiple areas)
  { id: 'kill_50', name: 'Seasoned Fighter', desc: 'Defeat 50 enemies', reward: { gold: 100 }, prerequisites: { achievements: ['kill_25'] } },
  { id: 'kill_100', name: 'Battle Hardened', desc: 'Defeat 100 enemies', reward: { gold: 200, xp: 200 }, prerequisites: { achievements: ['kill_50'] } },
  { id: 'kill_250', name: 'Master Warrior', desc: 'Defeat 250 enemies', reward: { gold: 400, essence: 10 }, prerequisites: { achievements: ['kill_100'] } },
  { id: 'kill_500', name: 'Legendary Fighter', desc: 'Defeat 500 enemies', reward: { gold: 750, essence: 20 }, prerequisites: { achievements: ['kill_250'] } },
  { id: 'boss_2', name: 'Double Boss Slayer', desc: 'Defeat 2 bosses', reward: { gold: 150, essence: 10 }, prerequisites: { achievements: ['boss_slayer'] } },
  
  // Tier 5: Crafting Mastery
  { id: 'craft_25', name: 'Expert Crafter', desc: 'Craft 25 items', reward: { gold: 75, crystal: 5 }, prerequisites: { achievements: ['craft_10'] } },
  { id: 'craft_50', name: 'Craft Master', desc: 'Craft 50 items', reward: { gold: 75, crystal: 10 }, prerequisites: { achievements: ['craft_25'] } },
  { id: 'craft_100', name: 'Master Artisan', desc: 'Craft 100 items', reward: { gold: 200, crystal: 20 }, prerequisites: { achievements: ['craft_50'] } },
  { id: 'craft_weapon', name: 'Weapon Smith', desc: 'Craft your first weapon', reward: { gold: 30 }, prerequisites: { achievements: ['first_craft'] } },
  { id: 'craft_armor', name: 'Armorer', desc: 'Craft your first armor', reward: { gold: 30 }, prerequisites: { achievements: ['first_craft'] } },
  
  // Tier 6: Gathering Specialization
  { id: 'gather_wood_50', name: 'Woodcutter', desc: 'Gather 50 wood', reward: { gold: 25, wood: 10 }, prerequisites: { achievements: ['first_gather'] } },
  { id: 'gather_stone_50', name: 'Quarry Worker', desc: 'Gather 50 stone', reward: { gold: 30, stone: 10 }, prerequisites: { areas: [2] } },
  { id: 'gather_ore_50', name: 'Miner', desc: 'Gather 50 ore', reward: { gold: 50, ore: 10 }, prerequisites: { areas: [2] } },
  { id: 'gather_all_resources', name: 'Resource Master', desc: 'Gather every type of resource at least once', reward: { gold: 100, essence: 5 }, prerequisites: { areas: [5] } },
  
  // Tier 7: Level Progression
  { id: 'level_15', name: 'Adept', desc: 'Reach level 15', reward: { gold: 150, xp: 100 }, prerequisites: { achievements: ['level_10'] } },
  { id: 'level_20', name: 'Expert', desc: 'Reach level 20', reward: { gold: 250, essence: 10 }, prerequisites: { achievements: ['level_15'] } },
  { id: 'level_25', name: 'Master', desc: 'Reach level 25', reward: { gold: 400, essence: 15 }, prerequisites: { achievements: ['level_20'] } },
  { id: 'level_30', name: 'Grandmaster', desc: 'Reach level 30', reward: { gold: 600, essence: 25 }, prerequisites: { achievements: ['level_25'] } },
  { id: 'level_40', name: 'Legend', desc: 'Reach level 40', reward: { gold: 1000, essence: 40 }, prerequisites: { achievements: ['level_30'] } },
  
  // Tier 8: Area Completion (Mid-game)
  { id: 'complete_area_6', name: 'Cave Explorer', desc: 'Complete Cave System area', reward: { gold: 125, sulfur: 10 }, prerequisites: { achievements: ['complete_area_5'] } },
  { id: 'boss_3', name: 'Temple Raider', desc: 'Defeat the Ancient Temple boss', reward: { gold: 200, essence: 15 }, prerequisites: { areas: [6] } },
  { id: 'complete_area_7', name: 'Temple Guardian', desc: 'Complete Ancient Temple area', reward: { gold: 150, gold: 10 }, prerequisites: { achievements: ['boss_3'] } },
  { id: 'complete_area_8', name: 'Shadow Walker', desc: 'Complete Shadow Realm area', reward: { gold: 175, obsidian: 10 }, prerequisites: { achievements: ['complete_area_7'] } },
  
  // Tier 9: Advanced Equipment
  { id: 'equip_legendary', name: 'Equipped for Legend', desc: 'Equip a legendary weapon or armor', reward: { gold: 300, essence: 20 }, prerequisites: { achievements: ['craft_50'] } },
  { id: 'enchant_item', name: 'Enchanter', desc: 'Enchant your first item', reward: { gold: 100, ritualStones: 10 }, prerequisites: { areas: [5] } },
  { id: 'enchant_5', name: 'Master Enchanter', desc: 'Enchant 5 items', reward: { gold: 300, ritualStones: 25 }, prerequisites: { achievements: ['enchant_item'] } },
  
  // Tier 10: End Game Areas
  { id: 'complete_area_9', name: 'Tower Ascender', desc: 'Complete Magical Tower area', reward: { gold: 200, essence: 20 }, prerequisites: { achievements: ['complete_area_8'] } },
  { id: 'boss_final', name: 'Void Vanquisher', desc: 'Defeat the Void Lord', reward: { gold: 500, essence: 50, prestigePoints: 5 }, prerequisites: { areas: [9] } },
  { id: 'complete_area_10', name: 'Sanctum Conqueror', desc: 'Complete Final Sanctum area', reward: { gold: 300, void: 10, prestigePoints: 10 }, prerequisites: { achievements: ['boss_final'] } },
  { id: 'explorer', name: 'Explorer', desc: 'Complete all areas', reward: { gold: 200, essence: 20 }, prerequisites: { achievements: ['complete_area_10'] } },
  
  // Tier 11: Statistics Achievements
  { id: 'deal_damage_1000', name: 'Damage Dealer', desc: 'Deal 1000 total damage', reward: { gold: 50 }, prerequisites: { achievements: ['first_kill'] } },
  { id: 'deal_damage_10000', name: 'Warmonger', desc: 'Deal 10,000 total damage', reward: { gold: 200, essence: 10 }, prerequisites: { achievements: ['deal_damage_1000'] } },
  { id: 'survive_100', name: 'Survivor', desc: 'Take 100 total damage and survive', reward: { gold: 75 }, prerequisites: { achievements: ['first_kill'] } },
  { id: 'no_deaths_10_areas', name: 'Undefeated', desc: 'Complete 10 areas without dying', reward: { gold: 300, prestigePoints: 5 }, prerequisites: { achievements: ['complete_area_1'] } },
  
  // Tier 12: Prestige & Special
  { id: 'prestige_1', name: 'Ascended', desc: 'Reach prestige level 1', reward: { prestigePoints: 10 }, prerequisites: { achievements: ['explorer'] } },
  { id: 'prestige_2', name: 'Twice Ascended', desc: 'Reach prestige level 2', reward: { prestigePoints: 20 }, prerequisites: { achievements: ['prestige_1'] } },
  { id: 'prestige_3', name: 'Thrice Ascended', desc: 'Reach prestige level 3', reward: { prestigePoints: 30 }, prerequisites: { achievements: ['prestige_2'] } },
  
  // Tier 13: Daily Quest & Quests
  { id: 'complete_daily_5', name: 'Daily Devotee', desc: 'Complete 5 daily quests', reward: { gold: 150 }, prerequisites: { achievements: ['first_kill'] } },
  { id: 'complete_daily_25', name: 'Daily Champion', desc: 'Complete 25 daily quests', reward: { gold: 500, essence: 15 }, prerequisites: { achievements: ['complete_daily_5'] } },
  { id: 'complete_subquest', name: 'Quest Seeker', desc: 'Complete your first subquest', reward: { gold: 50 }, prerequisites: { achievements: ['first_kill'] } },
  
  // Tier 14: Special Collection
  { id: 'collect_amulet', name: 'Amulet Collector', desc: 'Obtain your first amulet', reward: { gold: 100, essence: 5 }, prerequisites: { achievements: ['boss_slayer'] } },
  { id: 'collect_3_amulets', name: 'Amulet Master', desc: 'Collect 3 different amulets', reward: { gold: 300, essence: 15 }, prerequisites: { achievements: ['collect_amulet'] } }
];

function unlockAchievement(id) {
  if (gameState.achievements[id]) return; // Already unlocked
  const ach = achievementsList.find(a => a.id === id);
  if (!ach) return;
  
  gameState.achievements[id] = { unlocked: Date.now() };
  addLog(`Achievement Unlocked: ${ach.name}!`);
  
  // Grant rewards
  if (ach.reward) {
    Object.entries(ach.reward).forEach(([res, amt]) => {
      if (res === 'prestigePoints') {
        gameState.prestigePoints += amt;
      } else {
        addResource(res, amt);
      }
    });
  }
  refreshAchievementsMenu();
  saveGame();
}

// Amulets System (enemy-specific accessories)
const amuletDefinitions = {
  'frost_amulet': {
    name: 'Frost Amulet',
    sourceEnemy: ['Mountain Troll', 'Ice Elemental'],
    effect: { freeze: { chance: 0.3, duration: 2.0 } },
    lore: 'Frozen to the touch. Enemies hit have a chance to freeze solid.'
  },
  'flame_amulet': {
    name: 'Flame Amulet',
    sourceEnemy: ['Tower Mage'],
    effect: { burn: { dmg: 3, duration: 3 } },
    lore: 'Burns with eternal fire. Ignites enemies on hit.'
  },
  'shadow_amulet': {
    name: 'Shadow Amulet',
    sourceEnemy: ['Shadow Wraith', 'Dark Stalker'],
    effect: { shadow: { critChance: 0.15, critMultiplier: 2.0 } },
    lore: 'Woven from shadows. Increases critical hit chance.'
  },
  'life_amulet': {
    name: 'Life Amulet',
    sourceEnemy: ['Forest Guardian'],
    effect: { lifeSteal: { percent: 0.25 } },
    lore: 'Pulses with life energy. Drains health from enemies.'
  },
  'void_amulet': {
    name: 'Void Amulet',
    sourceEnemy: ['Void Lord', 'Void Spawn'],
    effect: { void: { armorPen: 0.5, bonusDmg: 5 } },
    lore: 'The absence made manifest. Ignores half of enemy armor.'
  },
  'serpent_amulet': {
    name: 'Serpent Amulet',
    sourceEnemy: ['River Serpent'],
    effect: { poison: { dmg: 2, duration: 5 } },
    lore: 'Filled with venom. Poisons enemies on hit.'
  }
};

function rollAmuletDrop(enemyName) {
  // 10% base chance for special enemies, 5% for regular
  const isSpecial = enemyName.includes('Guardian') || enemyName.includes('Lord') || 
                   enemyName.includes('Golem') || enemyName.includes('Mage') ||
                   enemyName.includes('Troll') || enemyName.includes('Serpent');
  const chance = isSpecial ? 0.10 : 0.05;
  
  if (Math.random() < chance) {
    // Find amulet that can drop from this enemy
    const possibleAmulets = Object.entries(amuletDefinitions).filter(([id, def]) => 
      def.sourceEnemy.some(src => enemyName.includes(src))
    );
    
    if (possibleAmulets.length > 0) {
      const [amuletId, amuletDef] = possibleAmulets[Math.floor(Math.random() * possibleAmulets.length)];
      const amulet = {
        id: amuletId,
        name: amuletDef.name,
        type: 'amulet',
        effect: amuletDef.effect,
        lore: amuletDef.lore,
        sourceEnemy: enemyName
      };
      addToInventory(amuletId, amulet, 1);
      addLog(`✨ ${amuletDef.name} dropped from ${enemyName}!`);
      refreshInventory();
      return true;
    }
  }
  return false;
}

// Daily Quests System
function generateDailyQuests() {
  const today = new Date().toDateString();
  if (gameState.dailyQuests.date === today && gameState.dailyQuests.quests) {
    return; // Already generated today
  }
  
  const questTemplates = [
    { type: 'kill', target: 'enemies', amount: 10, reward: { gold: 25, xp: 50 }, name: 'Defeat Enemies' },
    { type: 'kill', target: 'boss', amount: 1, reward: { gold: 100, essence: 5 }, name: 'Defeat Boss' },
    { type: 'gather', target: 'wood', amount: 20, reward: { gold: 15 }, name: 'Collect Wood' },
    { type: 'gather', target: 'stone', amount: 15, reward: { gold: 20 }, name: 'Collect Stone' },
    { type: 'gather', target: 'meat', amount: 10, reward: { gold: 15 }, name: 'Collect Meat' },
    { type: 'gather', target: 'water', amount: 10, reward: { gold: 12 }, name: 'Collect Water' },
    { type: 'gather', target: 'plants', amount: 15, reward: { gold: 15 }, name: 'Collect Plants' },
    { type: 'craft', target: 'weapons', amount: 3, reward: { gold: 30, crystal: 3 }, name: 'Craft Weapons' },
    { type: 'craft', target: 'armor', amount: 2, reward: { gold: 25, crystal: 2 }, name: 'Craft Armor' },
    { type: 'complete', target: 'area', amount: 1, reward: { gold: 50, xp: 100 }, name: 'Complete Area' }
  ];
  
  gameState.dailyQuests = {
    date: today,
    quests: questTemplates.slice(0, 3).map((t, i) => ({
      id: `daily_${i}`,
      ...t,
      progress: 0,
      completed: false
    }))
  };
  saveGame();
}

// Subquests System
const subquestTemplates = [
  { id: 'gather_50_wood', name: 'Wood Collector', desc: 'Gather 50 wood', type: 'gather', target: 'wood', amount: 50, reward: { gold: 50 } },
  { id: 'kill_100_enemies', name: 'Warrior', desc: 'Kill 100 enemies', type: 'kill', target: 'enemies', amount: 100, reward: { gold: 100, xp: 200 } },
  { id: 'craft_all_weapons', name: 'Weapon Master', desc: 'Craft at least one of each weapon type', type: 'craft', target: 'variety', amount: 5, reward: { gold: 150, essence: 10 } }
];

// Diary System - Unlockable entries based on encounters and usage
function trackDiaryEncounter(type, identifier, count = 1) {
  if (!gameState.diary) {
    gameState.diary = {
      enemyEncounters: {},
      itemUsage: {},
      areaVisits: {},
      bossEncounters: {}
    };
  }
  
  switch(type) {
    case 'enemy':
      gameState.diary.enemyEncounters[identifier] = (gameState.diary.enemyEncounters[identifier] || 0) + count;
      break;
    case 'boss':
      gameState.diary.bossEncounters[identifier] = (gameState.diary.bossEncounters[identifier] || 0) + count;
      break;
    case 'area':
      gameState.diary.areaVisits[identifier] = (gameState.diary.areaVisits[identifier] || 0) + count;
      break;
    case 'item':
      if (!gameState.diary.itemUsage[identifier]) {
        gameState.diary.itemUsage[identifier] = { crafted: 0, used: 0, equipped: 0 };
      }
      // This is called from specific contexts (craft, use, equip)
      break;
  }
}

// Diary Entry Definitions - Progressive thoughts that unlock based on usage
const diaryEntries = {
  enemies: {
    'Goblin': [
      { unlockCount: 1, thought: 'My first encounter with a goblin. Small but fierce - I underestimated them at first.' },
      { unlockCount: 5, thought: 'I\'ve learned to recognize their pack tactics. They\'re more dangerous in numbers than alone.' },
      { unlockCount: 20, thought: 'Despite their size, goblins are survivors. I respect that, even as I cut them down.' }
    ],
    'Orc': [
      { unlockCount: 1, thought: 'Orcs hit hard. I need better armor to face them without getting crushed.' },
      { unlockCount: 10, thought: 'Their brute force can be predictable. Speed and precision beat raw strength.' },
      { unlockCount: 30, thought: 'Orcs remind me that strength without strategy is just waste. I\'ve learned to use their aggression against them.' }
    ],
    'Wolf': [
      { unlockCount: 1, thought: 'The wolves here are different - wilder, more aggressive than any I\'ve seen before.' },
      { unlockCount: 5, thought: 'They hunt in packs. I need to be careful not to get surrounded.' },
      { unlockCount: 15, thought: 'The magic that changed this world affected them too. They\'re victims of the same disaster I\'m trying to fix.' }
    ],
    'Shadow': [
      { unlockCount: 1, thought: 'What are these shadow creatures? They move strangely, not quite solid.' },
      { unlockCount: 10, thought: 'They seem... incomplete. Like remnants of something that should have passed on.' },
      { unlockCount: 25, thought: 'Shadows are lost souls, trapped between worlds. I wonder if there\'s a way to help them find peace instead of destroying them.' }
    ],
    'Dark Stalker': [
      { unlockCount: 1, thought: 'These stalkers move like predators. The darkness is their ally.' },
      { unlockCount: 8, thought: 'I can feel them watching even when I can\'t see them. They\'re patient hunters.' },
      { unlockCount: 20, thought: 'The Dark Woods have changed them. Something in the shadows calls to them.' }
    ],
    'Mountain Troll': [
      { unlockCount: 1, thought: 'That troll... I\'m lucky to have survived. Their strength is legendary for a reason.' },
      { unlockCount: 5, thought: 'Trolls guard something. They\'re territorial - maybe protecting treasure, maybe protecting secrets.' },
      { unlockCount: 10, thought: 'Ancient creatures of stone and earth. They were here long before the fall, and they\'ll be here after.' }
    ],
    'Forest Guardian': [
      { unlockCount: 1, thought: 'The Forest Guardian... I didn\'t expect something so powerful in the woods. It protects something important.' },
      { unlockCount: 3, thought: 'It seems to test me rather than truly trying to kill me. There\'s purpose in its attacks.' },
      { unlockCount: 5, thought: 'The Guardian is a protector of old ways. Defeating it feels wrong, but necessary for progress.' }
    ]
  },
  areas: {
    0: [ // Forest Path
      { unlockCount: 1, thought: 'The Forest Path is where my journey began. The trees here remember better times.' },
      { unlockCount: 5, thought: 'I\'ve walked this path many times now. The familiarity is comforting, but I must move forward.' },
      { unlockCount: 10, thought: 'Every time I return here, I notice something new. The forest is full of secrets.' }
    ],
    1: [ // Dark Woods
      { unlockCount: 1, thought: 'The Dark Woods live up to their name. The shadows here feel... alive.' },
      { unlockCount: 3, thought: 'Something ancient stirs in the darkness. I can feel it watching.' },
      { unlockCount: 8, thought: 'The deeper I go, the more I understand why people fear the dark. But I\'ve faced worse.' }
    ]
  },
  items: {
    'woodenSword': [
      { unlockCount: 1, thought: 'My first weapon. Simple, but it kept me alive through those early fights.' },
      { unlockCount: 10, thought: 'I\'ve grown beyond this blade, but I won\'t forget where I started.' },
      { unlockCount: 25, thought: 'A wooden sword taught me that skill matters more than the weapon. A lesson I\'ll never forget.' }
    ],
    'stoneSword': [
      { unlockCount: 1, thought: 'Stone never rusts. This blade is reliable, just like I need to be.' },
      { unlockCount: 15, thought: 'Sturdy and dependable. Sometimes the simple things are the best.' }
    ]
  },
  bosses: {
    'Forest Guardian': [
      { unlockCount: 1, thought: 'The Forest Guardian tested my resolve. It was a guardian of old, protecting secrets I may never understand.' },
      { unlockCount: 3, thought: 'Each time I face it, I learn more about the old world. The magic was stronger then.' },
      { unlockCount: 5, thought: 'The Guardian respects strength. I think it approves of my progress, even as it fights me.' }
    ],
    'Ancient Golem': [
      { unlockCount: 1, thought: 'The Ancient Golem - a construct of incredible power. Built before the fall, still standing watch.' },
      { unlockCount: 2, thought: 'It doesn\'t feel pain. It doesn\'t tire. It just... exists. A perfect guardian, perhaps too perfect.' },
      { unlockCount: 3, thought: 'What was the temple protecting that required such a powerful guardian? I may never know.' }
    ],
    'Void Lord': [
      { unlockCount: 1, thought: 'The Void Lord... facing it was facing the end of everything. I can\'t describe the emptiness I felt.' },
      { unlockCount: 2, thought: 'It represents nothingness itself. To defeat it was to affirm existence, to choose to continue.' },
      { unlockCount: 3, thought: 'The Void Lord will return. Nothingness can\'t be destroyed, only delayed. I\'ll be ready.' }
    ]
  }
};

// Story and Lore System - Expanded with comprehensive lore
const storyLore = {
  intro: "In a world where magic has faded, you must survive and rebuild. Ancient powers slumber in the depths, waiting to be awakened. Every enemy, every area, every item tells a story. The path forward is yours to choose."
};

  // Special Abilities System (mid-game unlockable)
const specialAbilities = {
  'power_strike': {
    name: 'Power Strike',
    desc: 'Deal 200% damage on next hit. Cooldown: 30s',
    cooldown: 30,
    unlockLevel: 15,
    icon: '⚡',
    activate: function() {
      gameState.player.powerStrikeActive = true;
      gameState.player.powerStrikeTimer = 5; // 5 seconds to use it
      addLog('Power Strike ready! Next hit deals 200% damage!');
    }
  },
  'healing_aura': {
    name: 'Healing Aura',
    desc: 'Regenerate 5 HP per second for 10 seconds. Cooldown: 60s',
    cooldown: 60,
    unlockLevel: 20,
    icon: '❤',
    activate: function() {
      gameState.player.healingAuraActive = true;
      gameState.player.healingAuraTimer = 10;
      addLog('Healing Aura activated! Regenerating health.');
    }
  },
  'berserker_rage': {
    name: 'Berserker Rage',
    desc: 'Double attack speed for 15 seconds. Cooldown: 90s',
    cooldown: 90,
    unlockLevel: 25,
    icon: '🔥',
    activate: function() {
      gameState.player.berserkerRageActive = true;
      gameState.player.berserkerRageTimer = 15;
      gameState.player.speedBuff = (gameState.player.speedBuff || 0) + 1.0;
      addLog('BERSERKER RAGE! Attack speed doubled!');
    }
  }
};

// Check and unlock special abilities based on level
function checkSpecialAbilityUnlocks() {
  Object.entries(specialAbilities).forEach(([id, ability]) => {
    if (gameState.player.level >= ability.unlockLevel && !gameState.specialAbilities.includes(id)) {
      gameState.specialAbilities.push(id);
      addLog(`✨ Unlocked Special Ability: ${ability.name}!`);
      refreshSpecialAbilitiesMenu();
    }
  });
}

// Activate special ability
function activateSpecialAbility(abilityId) {
  const ability = specialAbilities[abilityId];
  if (!ability) return;
  
  if (!gameState.specialAbilities.includes(abilityId)) {
    addLog('Ability not unlocked yet');
    return;
  }
  
  const active = gameState.activeAbilities[abilityId];
  if (active && active.cooldownRemaining > 0) {
    addLog(`Ability on cooldown: ${active.cooldownRemaining.toFixed(1)}s`);
    return;
  }
  
  ability.activate();
  gameState.activeAbilities[abilityId] = {
    cooldownRemaining: ability.cooldown,
    lastUsed: Date.now()
  };
  
  refreshSpecialAbilitiesMenu();
  saveGame();
}

// Boss Phases System
function getBossPhases(bossName, replayCount) {
  const phases = {
    "Forest Guardian": [
      { hpPercent: 1.0, mechanics: ['basic'] },
      { hpPercent: 0.5, mechanics: ['enrage', 'summon'] }
    ],
    "Ancient Golem": [
      { hpPercent: 1.0, mechanics: ['basic', 'armor'] },
      { hpPercent: 0.6, mechanics: ['enrage', 'quake'] },
      { hpPercent: 0.3, mechanics: ['final_stand', 'explosion'] }
    ],
    "Void Lord": [
      { hpPercent: 1.0, mechanics: ['basic', 'void_aura'] },
      { hpPercent: 0.7, mechanics: ['teleport', 'clones'] },
      { hpPercent: 0.4, mechanics: ['enrage', 'void_storm'] },
      { hpPercent: 0.1, mechanics: ['desperation', 'final_void'] }
    ]
  };
  
  // Add extra phases for replayCount > 2
  let bossPhases = phases[bossName] || phases["Forest Guardian"];
  if (replayCount >= 3) {
    bossPhases.push({ hpPercent: 0.05, mechanics: ['extra_phase', 'enhanced'] });
  }
  return bossPhases;
}

// Get current boss phase based on HP
function getCurrentBossPhase(enemy) {
  if (!enemy.isBoss) return null;
  const areaId = gameState.currentArea;
  const replayCount = gameState.areaReplays[areaId] || 0;
  const phases = getBossPhases(enemy.name, replayCount);
  const hpPercent = enemy.hp / enemy.maxHp;
  
  // Find the current phase (highest phase with hpPercent >= current HP)
  for (let i = phases.length - 1; i >= 0; i--) {
    if (hpPercent >= phases[i].hpPercent) {
      return { phase: i, data: phases[i] };
    }
  }
  return { phase: 0, data: phases[0] };
}

// Apply difficulty scaling based on replay count
function getDifficultyMultiplier(areaId) {
  const replayCount = gameState.areaReplays[areaId] || 0;
  if (replayCount === 0) return 1.0;
  // Each replay increases difficulty by 50%
  return 1.0 + (replayCount * 0.5);
}

// Boss-specific rewards
const bossRewards = {
  "Forest Guardian": {
    name: "Guardian's Blessing",
    effect: { maxHp: 10 },
    type: "consumable",
    lore: "A fragment of the guardian's power. Permanently increases max HP."
  },
  "Ancient Golem": {
    name: "Golem Core",
    effect: { attack: 3, defense: 2 },
    type: "consumable",
    lore: "The core of an ancient golem. Permanently increases attack and defense."
  },
  "Void Lord": {
    name: "Void Essence",
    effect: { allStats: 5 },
    type: "consumable",
    lore: "Pure void essence. Permanently increases all stats significantly."
  }
};

function grantBossReward(bossName) {
  const reward = bossRewards[bossName];
  if (!reward) return;
  if (gameState.bossRewards[bossName]) {
    addLog(`${reward.name} already obtained from ${bossName}`);
    return;
  }
  
  gameState.bossRewards[bossName] = true;
  const item = {
    id: `boss_reward_${bossName.replace(/\s/g, '_').toLowerCase()}`,
    name: reward.name,
    type: reward.type,
    effect: reward.effect,
    lore: reward.lore
  };
  addToInventory(item.id, item, 1);
  addLog(`✨ Received ${reward.name} from ${bossName}!`);
  refreshInventory();
}

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
  const prestigeBonus = gameState.player.prestigeBonus || {};
  const maxHpWithPrestige = gameState.player.maxHp + (prestigeBonus.maxHp || 0);
  
  el("hp-display").textContent = `${Math.floor(gameState.player.hp)} / ${maxHpWithPrestige}`;
  el("level-display").textContent = gameState.player.level;
  
  const attackBase = gameState.player.attack + (gameState.equipped.weapon ? gameState.equipped.weapon.stats.attack : 0);
  const attackWithPrestige = Math.floor(attackBase * (1 + (prestigeBonus.attack || 0)));
  el("attack-display").textContent = attackWithPrestige;
  
  const defenseBase = gameState.player.defense + (gameState.equipped.armor ? gameState.equipped.armor.stats.defense : 0);
  const defenseWithPrestige = Math.floor(defenseBase * (1 + (prestigeBonus.defense || 0)));
  el("defense-display").textContent = defenseWithPrestige;
  
  // Removed resource displays from main HUD - they show in context where needed
  el("xp-display").textContent = `${gameState.player.xp} / ${gameState.player.xpToNext}`;
  
  // Show game mode indicator
  if (gameState.gameMode === 'endless') {
    const areaNameEl = document.getElementById("area-name");
    if (areaNameEl) {
      areaNameEl.textContent = `Endless Mode - Wave ${gameState.endlessWave + 1}`;
    }
  } else if (gameState.gameMode === 'dungeon') {
    const areaNameEl = document.getElementById("area-name");
    if (areaNameEl) {
      areaNameEl.textContent = `Dungeon Floor ${gameState.dungeonFloor}`;
    }
  }
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
    const prestigeBonus = gameState.player.prestigeBonus || {};
    gameState.player.maxHp = 20 + ((gameState.player.level - 1) * 5) + (prestigeBonus.maxHp || 0);
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.attack += 1;
    addLog(`Level up! Now level ${gameState.player.level}`);
    
    // Check for special ability unlocks
    checkSpecialAbilityUnlocks();
    
    // Unlock achievements
    if (gameState.player.level === 1 && !gameState.achievements['first_kill']) {
      unlockAchievement('first_kill');
    }
    if (gameState.player.level >= 10) {
      unlockAchievement('level_10');
    }
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
  
  // Track statistics
  gameState.statistics.itemsCrafted = (gameState.statistics.itemsCrafted || 0) + 1;
  updateQuestProgress('craft', 'weapons', recipe.type === 'weapon' ? 1 : 0);
  
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
    
    // Track item usage in diary
    if (!gameState.diary.itemUsage[recipe.id]) {
      gameState.diary.itemUsage[recipe.id] = { crafted: 0, used: 0, equipped: 0 };
    }
    gameState.diary.itemUsage[recipe.id].crafted = (gameState.diary.itemUsage[recipe.id].crafted || 0) + 1;
  }
  
  refreshStats();
  refreshCraftingMenu();
  refreshInventory();
  
  // Unlock achievement
  if (gameState.statistics.itemsCrafted >= 50) {
    unlockAchievement('craft_master');
  }
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

  // Amulets section
  const amulets = Object.entries(gameState.inventory).filter(([id, data]) => data.obj && data.obj.type === 'amulet');
  if (amulets.length > 0) {
    const section = document.createElement('div');
    section.className = 'inventory-section';
    section.innerHTML = `<h3>Amulets</h3><div class="amulet-slot ${gameState.equippedAmulet ? 'has-amulet' : ''}" id="amulet-slot">
      ${gameState.equippedAmulet ? `
        <div class="amulet-equipped">
          <div>
            <div class="amulet-name">${gameState.equippedAmulet.name}</div>
            <div class="amulet-effect">${gameState.equippedAmulet.lore || 'Special effect active'}</div>
          </div>
          <button class="btn btn-small" onclick="unequipAmulet()">Unequip</button>
        </div>
      ` : '<div class="small">Click an amulet to equip it</div>'}
    </div>
    <div class="inventory-type-grid" id="inventory-amulets"></div>`;
    container.appendChild(section);
    const grid = el('inventory-amulets');
    amulets.forEach(([id, data]) => {
      const card = document.createElement('div');
      card.className = 'inventory-card';
      const isEquipped = gameState.equippedAmulet && gameState.equippedAmulet.id === id;
      if (isEquipped) card.classList.add('equipped');
      card.innerHTML = `
        <div class="inventory-name">${data.obj.name}</div>
        <div class="small">${data.obj.lore || ''}</div>
        ${data.obj.effect ? `<div class="small">Effect: ${Object.keys(data.obj.effect).join(', ')}</div>` : ''}
      `;
      card.addEventListener('click', () => equipAmulet(id, data.obj));
      card.addEventListener('mouseenter', (e) => showTooltip(e.target, id, data.obj));
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
      card.addEventListener('mouseenter', (e) => showTooltip(e.target, it.id, it.data.obj));
      grid.appendChild(card);
    });
  }
}

// Helper function to format quest names
function formatQuestName(quest) {
  if (quest.name) return quest.name;
  
  // Format type
  const typeFormatted = quest.type.charAt(0).toUpperCase() + quest.type.slice(1);
  // Format target
  const targetFormatted = quest.target.charAt(0).toUpperCase() + quest.target.slice(1);
  
  if (quest.type === 'gather') {
    return `Collect ${targetFormatted}`;
  } else if (quest.type === 'kill') {
    if (quest.target === 'boss') {
      return 'Defeat Boss';
    } else {
      return `Defeat ${quest.amount} ${targetFormatted}`;
    }
  } else if (quest.type === 'craft') {
    return `Craft ${quest.amount} ${targetFormatted}`;
  } else if (quest.type === 'complete') {
    return `Complete ${quest.amount} ${targetFormatted}`;
  }
  return `${typeFormatted} ${targetFormatted}`;
}

// Quest Menu Functions
function refreshQuestsMenu() {
  generateDailyQuests();
  const dailyList = el('daily-quests-list');
  const subquestList = el('subquests-list');
  
  if (dailyList) {
    dailyList.innerHTML = '';
    (gameState.dailyQuests.quests || []).forEach(quest => {
      const item = document.createElement('div');
      item.className = `quest-item ${quest.completed ? 'completed' : ''}`;
      const progress = quest.completed ? quest.amount : (quest.progress || 0);
      const rewardText = Object.entries(quest.reward || {}).map(([k,v])=>`${v} ${k}`).join(', ');
      const questName = formatQuestName(quest);
      item.innerHTML = `
        <div class="quest-header">
          <div class="quest-name">${questName}</div>
          <div class="quest-reward">Reward: ${rewardText}</div>
        </div>
        <div class="quest-desc">${quest.type === 'gather' ? 'Collect' : quest.type === 'kill' ? 'Defeat' : quest.type === 'craft' ? 'Craft' : 'Complete'} ${quest.amount} ${quest.target}</div>
        <div class="quest-progress">Progress: ${progress} / ${quest.amount}</div>
      `;
      dailyList.appendChild(item);
    });
  }
  
  if (subquestList) {
    subquestList.innerHTML = '';
    subquestTemplates.forEach(template => {
      const quest = gameState.quests.find(q => q.id === template.id);
      const progress = quest ? quest.progress : 0;
      const completed = progress >= template.amount;
      const item = document.createElement('div');
      item.className = `quest-item ${completed ? 'completed' : ''}`;
      const rewardText = Object.entries(template.reward || {}).map(([k,v])=>`${v} ${k}`).join(', ');
      item.innerHTML = `
        <div class="quest-header">
          <div class="quest-name">${template.name}</div>
          <div class="quest-reward">Reward: ${rewardText}</div>
        </div>
        <div class="quest-desc">${template.desc}</div>
        <div class="quest-progress">Progress: ${progress} / ${template.amount}</div>
      `;
      subquestList.appendChild(item);
    });
  }
  
  // Setup quest tab switching
  const questTabs = document.querySelectorAll('.quest-tab');
  questTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabType = tab.getAttribute('data-tab');
      questTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      if (tabType === 'daily') {
        if (dailyList) dailyList.classList.remove('hidden');
        if (subquestList) subquestList.classList.add('hidden');
      } else if (tabType === 'subquests') {
        if (dailyList) dailyList.classList.add('hidden');
        if (subquestList) subquestList.classList.remove('hidden');
      }
    });
  });
}

// Achievements Menu - Only show achievements when prerequisites are met
function refreshAchievementsMenu() {
  const container = el('achievements-grid');
  if (!container) return;
  container.innerHTML = '';
  
  achievementsList.forEach(ach => {
    const unlocked = gameState.achievements[ach.id];
    
    // Only show achievement if prerequisites are met (or if already unlocked)
    const prerequisitesMet = unlocked || checkAchievementPrerequisites(ach);
    if (!prerequisitesMet) return;
    
    const card = document.createElement('div');
    card.className = `achievement-card ${unlocked ? 'unlocked' : ''}`;
    const rewardText = ach.reward ? Object.entries(ach.reward).map(([k,v])=>`${v} ${k}`).join(', ') : '';
    card.innerHTML = `
      <div class="achievement-header">
        <div class="achievement-name">${ach.name}</div>
        <div class="achievement-icon">${unlocked ? '✓' : '🔒'}</div>
      </div>
      <div class="achievement-desc">${ach.desc}</div>
      ${rewardText ? `<div class="achievement-reward">Reward: ${rewardText}</div>` : ''}
    `;
    container.appendChild(card);
  });
}

// Statistics Menu
function refreshStatisticsMenu() {
  const container = el('statistics-list');
  if (!container) return;
  const stats = gameState.statistics || {};
  container.innerHTML = `
    <div class="stat-item"><span class="stat-label">Enemies Killed:</span><span class="stat-value">${stats.enemiesKilled || 0}</span></div>
    <div class="stat-item"><span class="stat-label">Bosses Defeated:</span><span class="stat-value">${stats.bossesDefeated || 0}</span></div>
    <div class="stat-item"><span class="stat-label">Areas Completed:</span><span class="stat-value">${stats.areasCompleted || 0}</span></div>
    <div class="stat-item"><span class="stat-label">Items Crafted:</span><span class="stat-value">${stats.itemsCrafted || 0}</span></div>
    <div class="stat-item"><span class="stat-label">Total Damage Dealt:</span><span class="stat-value">${Math.floor(stats.totalDamageDealt || 0)}</span></div>
    <div class="stat-item"><span class="stat-label">Total Damage Taken:</span><span class="stat-value">${Math.floor(stats.totalDamageTaken || 0)}</span></div>
    <div class="stat-item"><span class="stat-label">Play Time:</span><span class="stat-value">${Math.floor((stats.playTime || 0) / 60)}m</span></div>
    <div class="stat-item"><span class="stat-label">Deaths:</span><span class="stat-value">${stats.deaths || 0}</span></div>
  `;
}

// Story/Lore Menu
// Diary Menu - Shows progressive thoughts based on encounters
function refreshDiaryMenu() {
  const container = el('diary-content');
  if (!container) return;
  
  // Get active tab
  const activeTab = container.dataset.activeTab || 'enemies';
  let html = '';
  
  if (!gameState.diary) {
    gameState.diary = {
      enemyEncounters: {},
      itemUsage: {},
      areaVisits: {},
      bossEncounters: {}
    };
  }
  
  // Helper to get unlocked thoughts
  function getUnlockedThoughts(entries, count) {
    if (!entries) return [];
    return entries.filter(e => (count || 0) >= e.unlockCount);
  }
  
  // Helper to format entry
  function formatDiaryEntry(title, thoughts, count = 0) {
    if (thoughts.length === 0) return '';
    let entry = `<div class="diary-entry"><div class="diary-entry-header"><strong>${title}</strong>`;
    if (count > 0) {
      entry += ` <span class="diary-count">(${count} encounters)</span>`;
    }
    entry += '</div><div class="diary-thoughts">';
    thoughts.forEach((thought, idx) => {
      entry += `<div class="diary-thought ${idx === thoughts.length - 1 ? 'latest' : ''}">"${thought.thought}"</div>`;
    });
    entry += '</div></div>';
    return entry;
  }
  
  if (activeTab === 'enemies') {
    html += '<h3>Enemies</h3>';
    const allEnemies = [...enemyTypes.filter(e => !e.isBoss), ...enemyTypes.filter(e => e.isBoss && e.name !== 'Forest Guardian' && e.name !== 'Ancient Golem' && e.name !== 'Void Lord')];
    
    allEnemies.forEach(enemy => {
      const count = gameState.diary.enemyEncounters[enemy.name] || 0;
      const entries = diaryEntries.enemies[enemy.name];
      if (entries && count > 0) {
        const thoughts = getUnlockedThoughts(entries, count);
        if (thoughts.length > 0) {
          html += formatDiaryEntry(enemy.name, thoughts, count);
        }
      }
    });
    
    if (html === '<h3>Enemies</h3>') {
      html += '<div class="diary-empty">No enemy encounters recorded yet. Fight enemies to unlock diary entries.</div>';
    }
  } else if (activeTab === 'areas') {
    html += '<h3>Areas</h3>';
    areas.forEach((area, index) => {
      if (gameState.unlockedAreas.includes(index)) {
        const count = gameState.diary.areaVisits[index] || 0;
        const entries = diaryEntries.areas[index];
        if (entries) {
          const thoughts = getUnlockedThoughts(entries, count);
          if (thoughts.length > 0 || count > 0) {
            html += formatDiaryEntry(area.name, thoughts, count);
          }
        } else {
          html += `<div class="diary-entry"><div class="diary-entry-header"><strong>${area.name}</strong></div><div class="diary-thoughts"><div class="diary-thought">${loreData[area.name]?.lore || 'No thoughts recorded yet.'}</div></div></div>`;
        }
      }
    });
    
    if (html === '<h3>Areas</h3>') {
      html += '<div class="diary-empty">No areas visited yet. Explore areas to unlock diary entries.</div>';
    }
  } else if (activeTab === 'items') {
    html += '<h3>Items & Equipment</h3>';
    const allItems = Object.keys(loreData).filter(key => {
      const data = loreData[key];
      return data && data.description && !areas.find(a => a.name === key) && !enemyTypes.find(e => e.name === key);
    });
    
    allItems.forEach(itemId => {
      const usage = gameState.diary.itemUsage[itemId];
      const crafted = usage?.crafted || 0;
      const used = usage?.used || 0;
      const equipped = usage?.equipped || 0;
      const totalUsage = crafted + used + equipped;
      
      // Check if item has been encountered
      const hasItem = gameState.inventory[itemId] || crafted > 0 || used > 0 || equipped > 0;
      const entries = diaryEntries.items[itemId];
      
      if (hasItem) {
        if (entries && totalUsage > 0) {
          const thoughts = getUnlockedThoughts(entries, totalUsage);
          if (thoughts.length > 0) {
            html += formatDiaryEntry(itemId.replace(/([A-Z])/g, ' $1').trim(), thoughts, totalUsage);
          }
        } else {
          const lore = loreData[itemId]?.lore;
          if (lore) {
            html += `<div class="diary-entry"><div class="diary-entry-header"><strong>${itemId.replace(/([A-Z])/g, ' $1').trim()}</strong></div><div class="diary-thoughts"><div class="diary-thought">${lore}</div></div></div>`;
          }
        }
      }
    });
    
    if (html === '<h3>Items & Equipment</h3>') {
      html += '<div class="diary-empty">No items recorded yet. Craft or use items to unlock diary entries.</div>';
    }
  } else if (activeTab === 'bosses') {
    html += '<h3>Bosses</h3>';
    enemyTypes.filter(e => e.isBoss).forEach(boss => {
      const count = gameState.diary.bossEncounters[boss.name] || 0;
      const hasEncountered = boss.areas?.some(areaId => gameState.unlockedAreas.includes(areaId)) || count > 0;
      
      if (hasEncountered) {
        const entries = diaryEntries.bosses[boss.name];
        if (entries) {
          const thoughts = getUnlockedThoughts(entries, count);
          if (thoughts.length > 0 || count > 0) {
            html += formatDiaryEntry(boss.name, thoughts, count);
          }
        } else {
          const lore = loreData[boss.name]?.lore;
          if (lore) {
            html += `<div class="diary-entry"><div class="diary-entry-header"><strong>${boss.name}</strong></div><div class="diary-thoughts"><div class="diary-thought">${lore}</div></div></div>`;
          }
        }
      }
    });
    
    if (html === '<h3>Bosses</h3>') {
      html += '<div class="diary-empty">No bosses encountered yet. Defeat bosses to unlock diary entries.</div>';
    }
  }
  
  container.innerHTML = html;
  
  // Setup tab switching
  const tabs = document.querySelectorAll('.diary-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabType = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      container.dataset.activeTab = tabType;
      refreshDiaryMenu();
    });
  });
  
  // Set initial active tab
  container.dataset.activeTab = activeTab;
}

// Amulet Functions
function equipAmulet(amuletId, amuletObj) {
  gameState.equippedAmulet = { ...amuletObj, id: amuletId };
  addLog(`Equipped ${amuletObj.name}`);
  refreshInventory();
  saveGame();
}

function unequipAmulet() {
  if (gameState.equippedAmulet) {
    addLog(`Unequipped ${gameState.equippedAmulet.name}`);
    gameState.equippedAmulet = null;
    refreshInventory();
    saveGame();
  }
}

// Screen Shake
function screenShake(intensity = 5) {
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    canvas.classList.add('screen-shake');
    setTimeout(() => canvas.classList.remove('screen-shake'), 500);
  }
}

// Boss Introduction
function showBossIntro(bossName) {
  const intro = document.createElement('div');
  intro.className = 'boss-intro';
  const lore = storyLore.bosses[bossName] || 'A powerful foe stands in your way.';
  intro.innerHTML = `
    <div class="boss-name">${bossName}</div>
    <div class="boss-desc">${lore}</div>
  `;
  document.body.appendChild(intro);
  setTimeout(() => intro.remove(), 3000);
}

// Area Transition
function showAreaTransition(areaName) {
  const transition = document.createElement('div');
  transition.className = 'area-transition';
  transition.innerHTML = `<div class="area-transition-text">Entering ${areaName}...</div>`;
  document.body.appendChild(transition);
  setTimeout(() => transition.remove(), 1500);
}

// Quest Progress Tracking
function updateQuestProgress(type, target, amount) {
  // Update daily quests
  if (gameState.dailyQuests && gameState.dailyQuests.quests) {
    gameState.dailyQuests.quests.forEach(quest => {
      if (!quest.completed && quest.type === type && quest.target === target) {
        quest.progress = Math.min(quest.amount, (quest.progress || 0) + amount);
        if (quest.progress >= quest.amount) {
          quest.completed = true;
          // Grant rewards
          Object.entries(quest.reward || {}).forEach(([res, amt]) => {
            if (res === 'xp') {
              addXP(amt);
            } else {
              addResource(res, amt);
            }
          });
          addLog(`Daily Quest Completed: ${target}`);
          refreshQuestsMenu();
        }
      }
    });
  }
  
  // Update subquests
  if (!gameState.quests) gameState.quests = [];
  subquestTemplates.forEach(template => {
    if (template.type === type && template.target === target) {
      let quest = gameState.quests.find(q => q.id === template.id);
      if (!quest) {
        quest = { id: template.id, progress: 0 };
        gameState.quests.push(quest);
      }
      if (quest.progress < template.amount) {
        quest.progress = Math.min(template.amount, quest.progress + amount);
        if (quest.progress >= template.amount) {
          // Grant rewards
          Object.entries(template.reward || {}).forEach(([res, amt]) => {
            if (res === 'xp') {
              addXP(amt);
            } else {
              addResource(res, amt);
            }
          });
          addLog(`Subquest Completed: ${template.name}`);
          refreshQuestsMenu();
        }
      }
    }
  });
}

// Apply amulet effects in combat
function applyAmuletEffects(enemy, damage) {
  if (!gameState.equippedAmulet || !gameState.equippedAmulet.effect) return damage;
  
  const amulet = gameState.equippedAmulet;
  const effect = amulet.effect;
  
  // Apply freeze effect
  if (effect.freeze && Math.random() < (effect.freeze.chance || 0.3)) {
    enemy.effects = enemy.effects || {};
    enemy.effects.freeze = { timer: effect.freeze.duration || 2, slowFactor: 0.5 };
  }
  
  // Apply poison
  if (effect.poison) {
    enemy.effects = enemy.effects || {};
    enemy.effects.poison = { timer: effect.poison.duration || 5, dmg: effect.poison.dmg || 2 };
  }
  
  // Apply burn
  if (effect.burn) {
    enemy.effects = enemy.effects || {};
    enemy.effects.burn = { timer: effect.burn.duration || 3, dmg: effect.burn.dmg || 3 };
  }
  
  // Apply shadow (crit)
  if (effect.shadow && Math.random() < (effect.shadow.critChance || 0.15)) {
    damage *= (effect.shadow.critMultiplier || 2.0);
    if (gameState.combat.floatingTexts) {
      gameState.combat.floatingTexts.push({ x: enemy.x - gameState.combat.scrollX, y: enemy.y - 20, text: "CRIT!", ttl: 1.0, alpha: 1, color: '#ffd700' });
    }
  }
  
  // Apply void (armor pen)
  if (effect.void) {
    damage += effect.void.bonusDmg || 0;
    // Armor pen handled in damage calculation
  }
  
  return damage;
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
  
  // Add game mode selection
  const modeSection = document.createElement("div");
  modeSection.className = "action-item";
  modeSection.innerHTML = `
    <div class="action-item-header">
      <div class="action-item-name">Game Mode</div>
    </div>
    <div class="action-item-description">
      Choose your challenge mode
    </div>
    <div style="display: flex; gap: 8px; margin-top: 8px;">
      <button class="btn btn-small" id="mode-normal" ${gameState.gameMode === 'normal' ? 'disabled' : ''}>Normal</button>
      <button class="btn btn-small" id="mode-endless" ${gameState.gameMode === 'endless' ? 'disabled' : ''}>Endless</button>
      <button class="btn btn-small" id="mode-dungeon" ${gameState.gameMode === 'dungeon' ? 'disabled' : ''}>Dungeon</button>
    </div>
  `;
  container.appendChild(modeSection);
  
  document.getElementById('mode-normal')?.addEventListener('click', () => {
    gameState.gameMode = 'normal';
    showAreaSelection();
  });
  document.getElementById('mode-endless')?.addEventListener('click', () => {
    gameState.gameMode = 'endless';
    startEndlessMode();
    overlay.classList.add("hidden");
  });
  document.getElementById('mode-dungeon')?.addEventListener('click', () => {
    gameState.gameMode = 'dungeon';
    startInfiniteDungeon();
    overlay.classList.add("hidden");
  });
  
  // Show areas only in normal mode
  if (gameState.gameMode === 'normal') {
    gameState.unlockedAreas.forEach(areaIndex => {
      const area = areas[areaIndex];
      const replayCount = gameState.areaReplays[areaIndex] || 0;
      const difficultyMult = getDifficultyMultiplier(areaIndex);
      const item = document.createElement("div");
      item.className = "action-item";
      
      item.innerHTML = `
      <div class="action-item-header">
        <div class="action-item-name">${area.name}${replayCount > 0 ? ` (Replay ${replayCount + 1})` : ''}</div>
      </div>
      <div class="action-item-description">
        Enemies: ${area.enemies} | ${area.boss ? "Boss Area" : "Regular Area"}
        ${replayCount > 0 ? ` | Difficulty: ${(difficultyMult * 100).toFixed(0)}%` : ''}
        ${area.unlockIdle ? ` | Unlocks: ${area.unlockIdle}` : ""}
      </div>
      <button class="btn action-btn" id="select-area-${areaIndex}">
        ${replayCount > 0 ? 'Replay Area' : 'Enter Area'}
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
          gameState.gameMode = 'normal'; // Ensure normal mode for area selection
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
      }
    });
  }
  
  overlay.classList.remove("hidden");
  console.log('[DEBUG] Area selection overlay shown');
}

// Endless Mode
function startEndlessMode() {
  gameState.endlessWave = 0;
  gameState.currentArea = 0; // Use first area as template
  addLog('Endless Mode: Survive as long as possible!');
  startRPG();
}

// Infinite Dungeon Mode
function startInfiniteDungeon() {
  gameState.dungeonFloor = 1;
  gameState.currentArea = 0; // Use first area as template
  addLog('Infinite Dungeon: Descend deeper and deeper!');
  startRPG();
}

// Modify enemy spawning for endless/dungeon modes
function getEnemyCountForMode() {
  if (gameState.gameMode === 'endless') {
    return Math.floor(5 + gameState.endlessWave * 2);
  } else if (gameState.gameMode === 'dungeon') {
    return Math.floor(5 + gameState.dungeonFloor * 1.5);
  }
  return null; // Use area default
}

// Refresh special abilities menu
function refreshSpecialAbilitiesMenu() {
  // This will be called from the combat UI section
}

// Prestige System
function performPrestige() {
  if (gameState.statistics.areasCompleted < areas.length) {
    addLog('Complete all areas before prestiging!');
    return false;
  }
  
  showConfirm('Prestige will reset your progress but grant permanent bonuses. Continue?', () => {
    gameState.prestigeLevel++;
    gameState.prestigePoints += 10 + (gameState.prestigeLevel * 5);
    
    // Reset stats but keep prestige bonuses
    const prestigeBonus = gameState.prestigeLevel * 0.1; // 10% bonus per prestige level
    
    // Save prestige bonuses
    gameState.player.prestigeBonus = {
      attack: (gameState.player.prestigeBonus?.attack || 0) + prestigeBonus,
      defense: (gameState.player.prestigeBonus?.defense || 0) + prestigeBonus,
      maxHp: (gameState.player.prestigeBonus?.maxHp || 0) + (gameState.prestigeLevel * 5)
    };
    
    // Reset game state
    gameState.player.level = 1;
    gameState.player.xp = 0;
    gameState.player.xpToNext = 10;
    gameState.unlockedAreas = [0];
    gameState.currentArea = 0;
    gameState.areaReplays = {};
    gameState.statistics.areasCompleted = 0;
    // Keep inventory, achievements, etc.
    
    addLog(`Prestiged to level ${gameState.prestigeLevel}! Gained ${gameState.prestigePoints} prestige points.`);
    unlockAchievement('prestige_1');
    refreshPrestigeMenu();
    saveGame();
  });
}

function refreshPrestigeMenu() {
  const container = el('prestige-content');
  if (!container) return;
  
  const canPrestige = gameState.statistics.areasCompleted >= areas.length;
  container.innerHTML = `
    <div class="prestige-display">
      <div class="prestige-level">Prestige Level: ${gameState.prestigeLevel}</div>
      <div class="prestige-points">Prestige Points: ${gameState.prestigePoints}</div>
    </div>
    <div class="small" style="margin: 12px 0;">
      Prestige resets your progress but grants permanent bonuses. Each prestige level gives a 10% bonus to all stats.
      ${gameState.player.prestigeBonus ? `
        <div style="margin-top: 8px;">
          Current Bonuses:<br>
          Attack: +${(gameState.player.prestigeBonus.attack * 100).toFixed(0)}%<br>
          Defense: +${(gameState.player.prestigeBonus.defense * 100).toFixed(0)}%<br>
          Max HP: +${gameState.player.prestigeBonus.maxHp || 0}
        </div>
      ` : ''}
    </div>
    <button class="btn ${!canPrestige ? 'disabled' : ''}" id="btn-prestige" ${!canPrestige ? 'disabled' : ''}>
      ${canPrestige ? 'Prestige Now' : 'Complete all areas to prestige'}
    </button>
  `;
  
  const btn = el('btn-prestige');
  if (btn && canPrestige) {
    btn.addEventListener('click', performPrestige);
  }
}

function refreshSpecialAbilitiesMenu() {
  const container = el('abilities-list');
  if (!container) return;
  container.innerHTML = '';
  
  Object.entries(specialAbilities).forEach(([id, ability]) => {
    const unlocked = gameState.specialAbilities.includes(id);
    const active = gameState.activeAbilities[id];
    const cooldownRemaining = active ? active.cooldownRemaining : 0;
    const canUse = unlocked && cooldownRemaining <= 0 && gameState.player.level >= ability.unlockLevel;
    
    const item = document.createElement('div');
    item.className = `ability-item ${unlocked ? 'unlocked' : 'locked'}`;
    item.innerHTML = `
      <div class="ability-header">
        <span class="ability-icon">${ability.icon}</span>
        <span class="ability-name">${ability.name}</span>
        ${!unlocked ? '<span class="ability-lock">🔒</span>' : ''}
      </div>
      <div class="ability-desc">${ability.desc}</div>
      <div class="small">Unlocks at level ${ability.unlockLevel}</div>
      ${cooldownRemaining > 0 ? `<div class="ability-cooldown">Cooldown: ${cooldownRemaining.toFixed(1)}s</div>` : ''}
      ${unlocked && canUse ? `<button class="btn btn-small" onclick="activateSpecialAbility('${id}')">Activate</button>` : ''}
    `;
    container.appendChild(item);
  });
}

// Tutorial System
const tutorialSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Survival Magic RPG!',
    content: 'You are a survivor in a world where magic has faded. Your goal is to gather resources, craft items, and battle through dangerous areas to restore what was lost.',
    highlight: null
  },
  {
    id: 'gathering',
    title: 'Gathering Resources',
    content: 'Click the Gathering button on the left to start collecting resources. Each action takes time but rewards you with materials and XP. Start by gathering wood!',
    highlight: 'btn-gathering'
  },
  {
    id: 'crafting',
    title: 'Crafting Items',
    content: 'Use gathered resources to craft weapons, armor, and consumables in the Crafting menu. Better equipment means stronger combat. Click the Crafting button!',
    highlight: 'btn-crafting'
  },
  {
    id: 'combat',
    title: 'Combat',
    content: 'Enter Combat to battle enemies and progress through areas. Defeat all enemies to complete an area and unlock new ones. Click Enter Combat (M) button!',
    highlight: 'btn-combat'
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    content: 'Check your Inventory (I) to see collected items and equip weapons or armor. Equipment boosts your combat stats!',
    highlight: 'btn-inventory'
  },
  {
    id: 'quests',
    title: 'Quests & Achievements',
    content: 'Complete daily quests and achievements to earn rewards. Check the Quests (Q) and Achievements (A) menus regularly!',
    highlight: 'btn-quests'
  }
];

// Helper function to highlight an element and make it clickable
function highlightElement(elementId) {
  // Remove existing highlights
  document.querySelectorAll('.tutorial-highlight, .tutorial-pointer, .tutorial-cutout').forEach(el => el.remove());
  
  if (!elementId) return;
  
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const rect = element.getBoundingClientRect();
  
  // Make the element clickable by bringing it forward
  const originalZIndex = element.style.zIndex;
  const originalPosition = element.style.position;
  element.style.position = 'relative';
  element.style.zIndex = '3005';
  
  // Store original styles for cleanup
  element.dataset.originalZIndex = originalZIndex || '';
  element.dataset.originalPosition = originalPosition || '';
  
  // Create a cutout div that sits behind the overlay but allows clicks through
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) {
    const cutout = document.createElement('div');
    cutout.className = 'tutorial-cutout';
    cutout.style.position = 'fixed';
    cutout.style.left = (rect.left - 10) + 'px';
    cutout.style.top = (rect.top - 10) + 'px';
    cutout.style.width = (rect.width + 20) + 'px';
    cutout.style.height = (rect.height + 20) + 'px';
    cutout.style.zIndex = '3004';
    cutout.style.pointerEvents = 'none';
    cutout.style.background = 'transparent';
    document.body.appendChild(cutout);
  }
  
  // Create highlight box (visible border)
  const highlight = document.createElement('div');
  highlight.className = 'tutorial-highlight';
  highlight.style.left = (rect.left - 6) + 'px';
  highlight.style.top = (rect.top - 6) + 'px';
  highlight.style.width = (rect.width + 12) + 'px';
  highlight.style.height = (rect.height + 12) + 'px';
  document.body.appendChild(highlight);
  
  // Create pointer arrow
  const pointer = document.createElement('div');
  pointer.className = 'tutorial-pointer';
  pointer.innerHTML = '👇';
  pointer.style.left = (rect.left + rect.width / 2 - 12) + 'px';
  pointer.style.top = (rect.top - 50) + 'px';
  document.body.appendChild(pointer);
  
  // Allow clicks on the element itself
  element.style.pointerEvents = 'auto';
}

function startTutorial() {
  if (gameState.tutorialProgress.completed) {
    return; // Don't show tutorial if already completed
  }
  
  gameState.tutorialProgress.currentStep = 0;
  gameState.tutorialProgress.completed = false;
  showTutorialStep(0);
}

function showTutorialStep(stepIndex) {
  if (stepIndex >= tutorialSteps.length) {
    // Remove any highlights and reset overlay
    document.querySelectorAll('.tutorial-highlight, .tutorial-pointer, .tutorial-cutout').forEach(el => el.remove());
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) {
      overlay.style.clipPath = 'none';
    }
    gameState.tutorialProgress.completed = true;
    addLog('Tutorial completed! Welcome to Survival Magic RPG!');
    saveGame();
    return;
  }
  
  const step = tutorialSteps[stepIndex];
  
  // Remove existing overlay
  const existingOverlay = document.getElementById('tutorial-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  // Remove existing highlights and reset element styles
  document.querySelectorAll('.tutorial-highlight, .tutorial-pointer, .tutorial-cutout').forEach(el => el.remove());
  // Reset any highlighted element styles
  document.querySelectorAll('[data-original-z-index]').forEach(el => {
    el.style.zIndex = el.dataset.originalZIndex || '';
    el.style.position = el.dataset.originalPosition || '';
    el.style.pointerEvents = '';
    delete el.dataset.originalZIndex;
    delete el.dataset.originalPosition;
  });
  
  const overlay = document.createElement('div');
  overlay.className = 'tutorial-overlay';
  overlay.id = 'tutorial-overlay';
  
  // Position popup based on highlight target
  let popupStyle = '';
  if (step.highlight) {
    const targetEl = document.getElementById(step.highlight);
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      // Position popup near the highlighted element
      if (rect.top < window.innerHeight / 2) {
        popupStyle = `top: ${rect.bottom + 20}px; left: ${Math.max(20, rect.left - 200)}px; max-width: 400px;`;
      } else {
        popupStyle = `bottom: ${window.innerHeight - rect.top + 20}px; left: ${Math.max(20, rect.left - 200)}px; max-width: 400px;`;
      }
    }
  }
  
  overlay.innerHTML = `
    <div class="tutorial-popup" style="${popupStyle}">
      <div class="tutorial-step">
        <div class="tutorial-step-title">${step.title}</div>
        <div class="tutorial-step-content">${step.content}</div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 20px;">
        <button class="btn btn-small" id="tutorial-skip">Skip Tutorial</button>
        <div>
          ${stepIndex > 0 ? `<button class="btn btn-small" id="tutorial-prev">Previous</button>` : ''}
          <button class="btn btn-small" id="tutorial-next">${stepIndex === tutorialSteps.length - 1 ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Highlight the target element if specified
  if (step.highlight) {
    setTimeout(() => {
      highlightElement(step.highlight);
    }, 100);
  }
  
  el('tutorial-next').addEventListener('click', () => {
    overlay.remove();
    document.querySelectorAll('.tutorial-highlight, .tutorial-pointer').forEach(el => el.remove());
    gameState.tutorialProgress.currentStep = stepIndex + 1;
    if (stepIndex < tutorialSteps.length - 1) {
      setTimeout(() => showTutorialStep(stepIndex + 1), 300);
    } else {
      gameState.tutorialProgress.completed = true;
      addLog('Tutorial completed!');
      saveGame();
    }
  });
  
  if (stepIndex > 0) {
    el('tutorial-prev').addEventListener('click', () => {
      overlay.remove();
      document.querySelectorAll('.tutorial-highlight, .tutorial-pointer').forEach(el => el.remove());
      gameState.tutorialProgress.currentStep = stepIndex - 1;
      setTimeout(() => showTutorialStep(stepIndex - 1), 300);
    });
  }
  
  el('tutorial-skip').addEventListener('click', () => {
    overlay.remove();
    document.querySelectorAll('.tutorial-highlight, .tutorial-pointer').forEach(el => el.remove());
    gameState.tutorialProgress.completed = true;
    addLog('Tutorial skipped.');
    saveGame();
  });
}

// Check if tutorial should auto-start (only for new games, not when loading)
function checkTutorial() {
  if (!gameState.tutorialProgress.completed && !gameState.tutorialProgress.started) {
    // Check if this is a new game (no achievements, minimal progress)
    const isNewGame = !gameState.achievements || Object.keys(gameState.achievements).length === 0;
    if (isNewGame) {
      gameState.tutorialProgress.started = true;
      setTimeout(() => startTutorial(), 1500);
    }
  }
}

// Refresh abilities bar in combat
function refreshCombatAbilitiesBar() {
  const bar = el('special-abilities-bar');
  if (!bar) return;
  bar.innerHTML = '';
  
  gameState.specialAbilities.forEach(abilityId => {
    const ability = specialAbilities[abilityId];
    if (!ability) return;
    const active = gameState.activeAbilities[abilityId];
    const cooldownRemaining = active ? active.cooldownRemaining : 0;
    const canUse = cooldownRemaining <= 0;
    
    const btn = document.createElement('button');
    btn.className = `btn ability-btn ${!canUse ? 'disabled' : ''}`;
    btn.innerHTML = `${ability.icon} ${ability.name}`;
    btn.title = ability.desc + (cooldownRemaining > 0 ? ` (${cooldownRemaining.toFixed(1)}s)` : '');
    btn.disabled = !canUse;
    btn.addEventListener('click', () => activateSpecialAbility(abilityId));
    bar.appendChild(btn);
  });
}

function completeEndlessWave() {
  gameState.endlessWave++;
  gameState.combat.active = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  stopAsciiAnimation();
  if (gameState.combat.spawnIntervalId) {
    clearInterval(gameState.combat.spawnIntervalId);
    gameState.combat.spawnIntervalId = null;
  }
  
  addLog(`Endless Wave ${gameState.endlessWave} completed! Starting wave ${gameState.endlessWave + 1}...`);
  gameState.combat.spawnedEnemiesCount = 0;
  gameState.combat.mapProgress = 0;
  gameState.combat.scrollX = 0;
  
  setTimeout(() => {
    startRPG();
  }, 2000);
}

function completeDungeonFloor() {
  gameState.dungeonFloor++;
  gameState.combat.active = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  stopAsciiAnimation();
  if (gameState.combat.spawnIntervalId) {
    clearInterval(gameState.combat.spawnIntervalId);
    gameState.combat.spawnIntervalId = null;
  }
  
  // Reward for completing floor
  const floorReward = { gold: gameState.dungeonFloor * 10, xp: gameState.dungeonFloor * 20 };
  Object.entries(floorReward).forEach(([res, amt]) => {
    if (res === 'xp') addXP(amt);
    else addResource(res, amt);
  });
  
  addLog(`Dungeon Floor ${gameState.dungeonFloor - 1} completed! Rewards: ${Object.entries(floorReward).map(([k,v])=>`${v} ${k}`).join(', ')}`);
  addLog(`Descending to Floor ${gameState.dungeonFloor}...`);
  
  gameState.combat.spawnedEnemiesCount = 0;
  gameState.combat.mapProgress = 0;
  gameState.combat.scrollX = 0;
  
  setTimeout(() => {
    startRPG();
  }, 2000);
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
    
    // Track item usage in diary
    if (!gameState.diary.itemUsage[itemId]) {
      gameState.diary.itemUsage[itemId] = { crafted: 0, used: 0, equipped: 0 };
    }
    gameState.diary.itemUsage[itemId].equipped = (gameState.diary.itemUsage[itemId].equipped || 0) + 1;
    
    refreshStats();
    refreshInventory();
  } else if (item.type === "armor") {
    // Regular armor (not shield)
    gameState.equipped.armor = item;
    gameState.equipped.armor.id = itemId;
    addLog(`Equipped ${item.name}`);
    
    // Track item usage in diary
    if (!gameState.diary.itemUsage[itemId]) {
      gameState.diary.itemUsage[itemId] = { crafted: 0, used: 0, equipped: 0 };
    }
    gameState.diary.itemUsage[itemId].equipped = (gameState.diary.itemUsage[itemId].equipped || 0) + 1;
    
    refreshStats();
    refreshInventory();
  } else if (item.type === "consumable") {
    // Track item usage in diary
    if (!gameState.diary.itemUsage[itemId]) {
      gameState.diary.itemUsage[itemId] = { crafted: 0, used: 0, equipped: 0 };
    }
    gameState.diary.itemUsage[itemId].used = (gameState.diary.itemUsage[itemId].used || 0) + 1;
    
    if (item.effect && item.effect.hp) {
      gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + item.effect.hp);
      removeFromInventory(itemId, 1);
      addLog(`Used ${item.name} (+${item.effect.hp} HP)`);
      refreshStats();
      refreshInventory();
    } else if (item.effect && item.effect.maxHp) {
      // Boss reward - permanent HP increase
      gameState.player.maxHp += item.effect.maxHp;
      gameState.player.hp += item.effect.maxHp;
      removeFromInventory(itemId, 1);
      addLog(`Used ${item.name}! Permanent +${item.effect.maxHp} Max HP!`);
      refreshStats();
      refreshInventory();
    } else if (item.effect && item.effect.attack) {
      // Boss reward - permanent stat increase
      gameState.player.attack += item.effect.attack;
      if (item.effect.defense) gameState.player.defense += item.effect.defense;
      removeFromInventory(itemId, 1);
      addLog(`Used ${item.name}! Permanent stat increase!`);
      refreshStats();
      refreshInventory();
    } else if (item.effect && item.effect.allStats) {
      // Boss reward - all stats
      gameState.player.attack += item.effect.allStats;
      gameState.player.defense += item.effect.allStats;
      gameState.player.maxHp += item.effect.allStats * 2;
      gameState.player.hp += item.effect.allStats * 2;
      removeFromInventory(itemId, 1);
      addLog(`Used ${item.name}! Massive permanent stat increase!`);
      refreshStats();
      refreshInventory();
    }
  } else if (item.type === "amulet") {
    equipAmulet(itemId, item);
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
  
  // Show area transition
  const area = areas[gameState.currentArea];
  showAreaTransition(area.name);
  
  // Track area visit in diary
  trackDiaryEncounter('area', gameState.currentArea, 1);
  
  // CRITICAL: Cancel any existing animation frame to prevent multiple loops
  if (typeof animationFrameId !== 'undefined' && animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
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
    
    // Refresh combat abilities bar
    refreshCombatAbilitiesBar();
    
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
    
    // Start game loop (only if not already running)
    if (typeof gameLoop === 'function') {
      // Cancel any existing loop first to prevent duplicates
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
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
  
  // Show boss introduction when boss spawns
  if (isBoss) {
    const bossType = enemyTypes.find(e => e.isBoss && e.areas && e.areas.includes(gameState.currentArea));
    if (bossType) {
      setTimeout(() => showBossIntro(bossType.name), 500);
    }
  }
  
  // Apply difficulty scaling for replays
  const difficultyMult = getDifficultyMultiplier(gameState.currentArea);
  
  let enemyType;
  if (isBoss) {
    // Find boss for this area
    enemyType = enemyTypes.find(e => e.isBoss && e.areas && e.areas.includes(gameState.currentArea)) || enemyTypes.find(e => e.isBoss) || enemyTypes[3];
    // Scale boss stats based on difficulty
    enemyType = {
      ...enemyType,
      hp: Math.floor(enemyType.hp * difficultyMult),
      attack: Math.floor(enemyType.attack * difficultyMult),
      defense: Math.floor(enemyType.defense * difficultyMult),
      xp: Math.floor(enemyType.xp * difficultyMult)
    };
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
    const enemyData = {
      ...enemyType,
      ascii: enemyType.ascii.slice(),
      x: 800 + (gameState.combat.spawnedEnemiesCount * 250) + Math.random() * 100 + (i * 50),
      y: 300 + (Math.random() * 40 - 20),
      maxHp: enemyType.hp,
      hp: enemyType.hp,
      lastDamage: 0,
      animFrame: 0,
      effects: {}, // active status effects (poison, bleed, freeze, weaken) mapped to timers/values
      isBoss: isBoss,
      currentPhase: isBoss ? 0 : null,
      phaseMechanics: isBoss ? [] : null
    };
    
    // Initialize boss phases
    if (isBoss) {
      const replayCount = gameState.areaReplays[gameState.currentArea] || 0;
      enemyData.bossPhases = getBossPhases(enemyType.name, replayCount);
      enemyData.currentPhase = 0;
    }
    
    // Scale regular enemies for difficulty (if not boss)
    if (!isBoss && difficultyMult > 1) {
      enemyData.hp = Math.floor(enemyData.hp * difficultyMult);
      enemyData.maxHp = enemyData.hp;
      enemyData.attack = Math.floor(enemyData.attack * difficultyMult * 0.8); // Slightly less aggressive scaling
      enemyData.xp = Math.floor(enemyData.xp * difficultyMult);
    }
    
    gameState.combat.enemies.push(enemyData);
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
  
  // Determine enemy count based on game mode
  let targetEnemyCount = area.enemies;
  if (gameState.gameMode === 'endless') {
    targetEnemyCount = Math.floor(5 + gameState.endlessWave * 2);
  } else if (gameState.gameMode === 'dungeon') {
    targetEnemyCount = Math.floor(5 + gameState.dungeonFloor * 1.5);
  }
  
  gameState.combat.targetEnemies = targetEnemyCount;
  gameState.combat.spawnIntervalId = setInterval(() => {
    if (!gameState.combat.active || gameState.combat.paused) return;
    if (gameState.combat.spawnedEnemiesCount >= targetEnemyCount) {
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
  if (!gameState.combat.active || gameState.combat.paused) {
    // Stop the loop if combat is not active
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    return;
  }
  
  const now = Date.now();
  const deltaTime = (now - gameState.combat.lastFrame) / 1000;
  gameState.combat.lastFrame = now;
  
  // Process special abilities
  if (gameState.player.healingAuraActive && gameState.player.healingAuraTimer > 0) {
    gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + 5 * deltaTime);
    gameState.player.healingAuraTimer -= deltaTime;
    if (gameState.player.healingAuraTimer <= 0) {
      gameState.player.healingAuraActive = false;
      addLog('Healing Aura expired');
    }
  }
  
  if (gameState.player.berserkerRageActive && gameState.player.berserkerRageTimer > 0) {
    gameState.player.berserkerRageTimer -= deltaTime;
    if (gameState.player.berserkerRageTimer <= 0) {
      gameState.player.berserkerRageActive = false;
      gameState.player.speedBuff = Math.max(0, (gameState.player.speedBuff || 0) - 1.0);
      addLog('Berserker Rage expired');
    }
  }
  
  // Update ability cooldowns
  Object.keys(gameState.activeAbilities || {}).forEach(abilityId => {
    const active = gameState.activeAbilities[abilityId];
    if (active.cooldownRemaining > 0) {
      active.cooldownRemaining -= deltaTime;
      if (active.cooldownRemaining <= 0) {
        active.cooldownRemaining = 0;
      }
    }
  });
  
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
  const mapLength = gameState.gameMode === 'endless' || gameState.gameMode === 'dungeon' ? 
                    2000 + (gameState.gameMode === 'endless' ? gameState.endlessWave * 200 : gameState.dungeonFloor * 200) : 
                    area.mapLength;
  
  if (gameState.combat.mapProgress >= mapLength && gameState.combat.enemies.length === 0) {
    if (gameState.gameMode === 'endless') {
      completeEndlessWave();
      return;
    } else if (gameState.gameMode === 'dungeon') {
      completeDungeonFloor();
      return;
    } else {
      completeArea();
      return;
    }
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
        
        // Apply prestige bonuses
        const prestigeBonus = gameState.player.prestigeBonus || {};
        const baseAttackWithPrestige = (gameState.player.attack + (equipped ? (equipped.stats.attack || 0) : 0)) * (1 + (prestigeBonus.attack || 0));
        const baseAttack = Math.floor(baseAttackWithPrestige);
        
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

        let playerDPS = Math.max(1, (baseAttack * speedMult * damageMultiplier) - Math.max(0, arrayEnemy.defense - weakenReduction));
        
        // Apply Power Strike ability
        if (gameState.player.powerStrikeActive && gameState.player.powerStrikeTimer > 0) {
          playerDPS *= 2.0;
          gameState.player.powerStrikeActive = false;
          gameState.player.powerStrikeTimer = 0;
          if (gameState.combat.floatingTexts) {
            gameState.combat.floatingTexts.push({ x: arrayEnemy.x - gameState.combat.scrollX, y: arrayEnemy.y - 20, text: "POWER STRIKE!", ttl: 1.5, alpha: 1, color: '#ffd700' });
          }
          // Add power strike particles
          if (gameState.combat.particles) {
            for (let x = 0; x < 10; x++) {
              gameState.combat.particles.push({
                x: arrayEnemy.x - gameState.combat.scrollX,
                y: arrayEnemy.y,
                vx: (Math.random() - 0.5) * 150,
                vy: -Math.random() * 100,
                life: 1.0,
                maxLife: 1.0,
                color: '#ffd700',
                size: 4
              });
            }
          }
          screenShake(8);
        }
        
        // Apply amulet effects
        if (gameState.equippedAmulet && gameState.equippedAmulet.effect) {
          const amulet = gameState.equippedAmulet;
          // Void amulet armor penetration
          if (amulet.effect.void && amulet.effect.void.armorPen) {
            const armorPen = arrayEnemy.defense * amulet.effect.void.armorPen;
            playerDPS = Math.max(1, (baseAttack * speedMult * damageMultiplier) - Math.max(0, arrayEnemy.defense - weakenReduction - armorPen));
            playerDPS += amulet.effect.void.bonusDmg || 0;
          }
        }
        
        const damageDealt = applyAmuletEffects(arrayEnemy, playerDPS) * deltaTime;
        
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
      
      // Handle boss phase transitions
      if (arrayEnemy.isBoss && arrayEnemy.bossPhases) {
        const currentPhase = getCurrentBossPhase(arrayEnemy);
        if (currentPhase && currentPhase.phase !== arrayEnemy.currentPhase) {
          arrayEnemy.currentPhase = currentPhase.phase;
          const phaseData = currentPhase.data;
          addLog(`${arrayEnemy.name} enters Phase ${currentPhase.phase + 1}!`);
          screenShake(8);
          
          // Apply phase mechanics
          if (phaseData.mechanics.includes('enrage')) {
            arrayEnemy.attack = Math.floor(arrayEnemy.attack * 1.5);
            if (gameState.combat.floatingTexts) {
              gameState.combat.floatingTexts.push({ x: arrayEnemy.x - gameState.combat.scrollX, y: arrayEnemy.y - 30, text: "ENRAGED!", ttl: 2.0, alpha: 1, color: '#f44' });
            }
          }
          if (phaseData.mechanics.includes('summon')) {
            // Spawn additional enemies
            spawnSingleEnemy();
            spawnSingleEnemy();
          }
          if (phaseData.mechanics.includes('teleport')) {
            arrayEnemy.x = arrayEnemy.x + (Math.random() > 0.5 ? 200 : -200);
          }
        }
      }
      
      if (arrayEnemy.hp <= 0) {
        const xpGained = arrayEnemy.xp;
        addXP(xpGained);
        addLog(`Defeated ${arrayEnemy.name} (+${xpGained} XP)`);
        refreshStats(); // Update stats to show XP gain
        
        // Track statistics
        gameState.statistics.enemiesKilled = (gameState.statistics.enemiesKilled || 0) + 1;
        if (arrayEnemy.isBoss) {
          gameState.statistics.bossesDefeated = (gameState.statistics.bossesDefeated || 0) + 1;
          unlockAchievement('boss_slayer');
          grantBossReward(arrayEnemy.name);
          // Track boss encounter in diary
          trackDiaryEncounter('boss', arrayEnemy.name, 1);
        } else {
          // Track enemy encounter in diary
          trackDiaryEncounter('enemy', arrayEnemy.name, 1);
        }
        
        // Roll for amulet drop
        rollAmuletDrop(arrayEnemy.name);
        
        // Update quest progress
        updateQuestProgress('kill', arrayEnemy.isBoss ? 'boss' : 'enemies', 1);
        
        // Screen shake on heavy hits (if heavy weapon or boss kill)
        if ((equipped && equipped.weaponType === 'heavy') || arrayEnemy.isBoss) {
          screenShake();
        }
        
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
      const prestigeBonus = gameState.player.prestigeBonus || {};
      const baseDefense = gameState.player.defense + (gameState.equipped.armor ? (gameState.equipped.armor.stats.defense || 0) : 0);
      const playerDefenseTotal = Math.floor(baseDefense * (1 + (prestigeBonus.defense || 0)));
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
function getPlayerASCIIWithEquipment(baseFrame = null) {
  const hasWeapon = gameState.equipped.weapon;
  const hasArmor = gameState.equipped.armor;
  
  // Base player - use provided frame or default
  let playerASCII = baseFrame || ["  O  ", " /|\\ ", " / \\ "];
  
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
  
  // Draw far background layer (slowest, most faded) - OPTIMIZED
  ctx.fillStyle = "rgba(80, 80, 100, 0.15)";
  ctx.font = "32px monospace";
  const farStep = 120;
  const farCount = Math.ceil((gameCanvas.width + Math.abs(scrollOffsetFar)) / farStep) + 1;
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < farCount; i++) {
      const x = -scrollOffsetFar + (i * farStep);
      if (x > -50 && x < gameCanvas.width + 50) {
        const idx = row % layers.far.length;
        ctx.fillText(layers.far[idx], x + 50, 20 + row * 80);
      }
    }
  }
  
  // Draw mid background layer (medium speed, medium faded) - OPTIMIZED
  ctx.fillStyle = "rgba(100, 100, 120, 0.25)";
  ctx.font = "28px monospace";
  const midStep = 110;
  const midCount = Math.ceil((gameCanvas.width + Math.abs(scrollOffsetMid)) / midStep) + 1;
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < midCount; i++) {
      const x = -scrollOffsetMid + (i * midStep);
      if (x > -50 && x < gameCanvas.width + 50) {
        const idx = row % layers.mid.length;
        ctx.fillText(layers.mid[idx], x + 50, 80 + row * 70);
      }
    }
  }
  
  // Draw near foreground layer (fastest, most visible) - OPTIMIZED
  ctx.fillStyle = "rgba(100, 100, 120, 0.3)";
  ctx.font = "24px monospace";
  const nearStep = 100;
  const nearCount = Math.ceil((gameCanvas.width + Math.abs(scrollOffsetNear)) / nearStep) + 1;
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < nearCount; i++) {
      const x = -scrollOffsetNear + (i * nearStep);
      if (x > -50 && x < gameCanvas.width + 50) {
        const idx = row % layers.near.length;
        ctx.fillText(layers.near[idx], x + 50, 140 + row * 60);
      }
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
  
  // Draw animated player ASCII art
  const playerY = 300;
  const playerFontSize = 14;
  
  // Update animation state
  const now = Date.now();
  const blockingEnemy = findBlockingEnemy();
  if (blockingEnemy) {
    gameState.combat.playerAnimState = 'attack';
  } else if (gameState.combat.scrollX > 0 || gameState.combat.mapProgress > 0) {
    gameState.combat.playerAnimState = 'walk';
  } else {
    gameState.combat.playerAnimState = 'idle';
  }
  
  // Update animation frame (8 FPS)
  if (!gameState.combat.lastAnimUpdate || now - gameState.combat.lastAnimUpdate > 125) {
    gameState.combat.playerAnimFrame++;
    gameState.combat.lastAnimUpdate = now;
  }
  
  // Get animated player frame
  const animState = gameState.combat.playerAnimState;
  const playerFrameSet = playerFrames[animState] || playerFrames.idle;
  const playerFrameIdx = gameState.combat.playerAnimFrame % playerFrameSet.length;
  const basePlayerASCII = playerFrameSet[playerFrameIdx];
  
  // Get equipment-modified player ASCII using animated base frame
  const playerASCIIToDraw = getPlayerASCIIWithEquipment(basePlayerASCII);
  
  drawASCII(playerASCIIToDraw, gameState.combat.playerX, playerY, "#6ef", playerFontSize);
  
  // Draw enemies
  gameState.combat.enemies.forEach(enemy => {
    const x = enemy.x - gameState.combat.scrollX;
    if (x > -50 && x < gameCanvas.width + 50) {
      const enemyY = enemy.y;
      const enemyFontSize = enemy.isBoss ? 16 : 12;
      
      // Draw enemy ASCII art
      let enemyColor = "#f66";
      if (enemy.name === "Shadow") enemyColor = "#666";
      else if (enemy.isBoss) {
        // Boss color changes with phase
        const phase = getCurrentBossPhase(enemy);
        if (phase && phase.phase > 0) {
          enemyColor = phase.phase === 1 ? "#f84" : phase.phase >= 2 ? "#f44" : "#f66";
        } else {
          enemyColor = "#f44";
        }
      }
      
      // Animate enemy
      if (!enemy.animFrame) enemy.animFrame = 0;
      if (!enemy.animState) enemy.animState = 'idle';
      if (!enemy.lastAnimUpdate) enemy.lastAnimUpdate = now || Date.now();
      
      // Update enemy animation (slower - 6 FPS)
      const currentTime = Date.now();
      if (currentTime - enemy.lastAnimUpdate > 167) {
        enemy.animFrame++;
        enemy.lastAnimUpdate = currentTime;
        
        // Determine animation state
        const distanceToPlayer = Math.abs(enemy.x - (gameState.combat.playerX + gameState.combat.scrollX));
        if (distanceToPlayer < 100 && enemy.hp > 0) {
          enemy.animState = 'attack';
        } else if (enemy.x > gameState.combat.playerX + gameState.combat.scrollX + 50) {
          enemy.animState = 'walk';
        } else {
          enemy.animState = 'idle';
        }
      }
      
      // Get enemy animation frames
      const enemyFrameSet = getEnemyFrameSet(enemy);
      const enemyAnimFrames = enemyFrameSet[enemy.animState] || enemyFrameSet.idle;
      const enemyFrameIdx = enemy.animFrame % enemyAnimFrames.length;
      const animatedEnemyASCII = enemyAnimFrames[enemyFrameIdx];
      
      // Boss special animation (pulse/glow effect)
      if (enemy.isBoss) {
        const pulsePhase = (Date.now() / 500) % (Math.PI * 2);
        const pulseAlpha = 0.7 + Math.sin(pulsePhase) * 0.3;
        ctx.globalAlpha = pulseAlpha;
      }
      
      drawASCII(animatedEnemyASCII, x, enemyY, enemyColor, enemyFontSize);
      
      if (enemy.isBoss) {
        ctx.globalAlpha = 1.0; // Reset alpha
      }
      
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
  const barWidth = enemy.isBoss ? 80 : 40;
  const barHeight = 6;
  ctx.fillStyle = "#081018";
  ctx.fillRect(x - barWidth / 2, enemyY - 15, barWidth, barHeight);
      
  // Draw health bar
  const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = enemyColor;
  ctx.fillRect(x - barWidth / 2, enemyY - 15, barWidth * hpPercent, barHeight);
  
  // Draw phase indicator for bosses
  if (enemy.isBoss && enemy.bossPhases) {
    const phase = getCurrentBossPhase(enemy);
    if (phase) {
      ctx.font = '10px monospace';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText(`Phase ${phase.phase + 1}/${enemy.bossPhases.length}`, x, enemyY - 40);
    }
  }
      
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
  
  // Draw special ability status indicators
  if (gameState.player.powerStrikeActive || gameState.player.healingAuraActive || gameState.player.berserkerRageActive) {
    ctx.font = '12px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'left';
    let yOffset = 20;
    if (gameState.player.powerStrikeActive) {
      ctx.fillText('⚡ POWER STRIKE READY', 10, yOffset);
      yOffset += 15;
    }
    if (gameState.player.healingAuraActive) {
      ctx.fillText('❤ HEALING AURA', 10, yOffset);
      yOffset += 15;
    }
    if (gameState.player.berserkerRageActive) {
      ctx.fillText('🔥 BERSERKER RAGE', 10, yOffset);
      yOffset += 15;
    }
  }
}

function updateRPGUI() {
  const hpPercent = Math.max(0, gameState.player.hp / gameState.player.maxHp);
  el("player-hp-bar").style.width = `${hpPercent * 100}%`;
  el("player-hp-text").textContent = `${Math.floor(gameState.player.hp)} / ${gameState.player.maxHp}`;
}

function completeArea() {
  gameState.combat.active = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  // Stop ASCII animation
  if (typeof stopAsciiAnimation === 'function') {
    stopAsciiAnimation();
  }
  // Stop spawn timer if running
  if (gameState.combat.spawnIntervalId) {
    clearInterval(gameState.combat.spawnIntervalId);
    gameState.combat.spawnIntervalId = null;
  }
  
  const area = areas[gameState.currentArea];
  
  // Track statistics
  gameState.statistics.areasCompleted = (gameState.statistics.areasCompleted || 0) + 1;
  updateQuestProgress('complete', 'area', 1);
  
  // Track area replay
  if (!gameState.areaReplays[gameState.currentArea]) {
    gameState.areaReplays[gameState.currentArea] = 0;
  }
  gameState.areaReplays[gameState.currentArea]++;
  
  // Unlock achievements
  if (gameState.statistics.areasCompleted >= areas.length) {
    unlockAchievement('explorer');
  }
  
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
  // Reset game mode to normal after completing area
  gameState.gameMode = 'normal';
  
  showIdleMenu("gathering-menu");
  el("combat-section").classList.add("hidden");
  el("idle-section").classList.remove("hidden");
}

function gameOver() {
  gameState.combat.active = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  // Stop ASCII animation
  if (typeof stopAsciiAnimation === 'function') {
    stopAsciiAnimation();
  }
  // Stop spawn timer if running
  if (gameState.combat.spawnIntervalId) {
    clearInterval(gameState.combat.spawnIntervalId);
    gameState.combat.spawnIntervalId = null;
  }
  gameState.statistics.deaths = (gameState.statistics.deaths || 0) + 1;
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
    // Only restart loop if it's not already running
    if (!animationFrameId) {
      gameLoop();
    }
  }
}

function exitRPG() {
  console.log('[DEBUG] exitRPG called');
  if (gameState.combat.active) {
    gameState.combat.active = false;
    if (typeof cancelAnimationFrame === 'function' && typeof animationFrameId !== 'undefined' && animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    // Stop ASCII animation
    if (typeof stopAsciiAnimation === 'function') {
      stopAsciiAnimation();
    }
    // Stop spawn timer if running
    if (gameState.combat.spawnIntervalId) {
      clearInterval(gameState.combat.spawnIntervalId);
      gameState.combat.spawnIntervalId = null;
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
    equippedAmulet: gameState.equippedAmulet,
    unlockedAreas: [...gameState.unlockedAreas],
    unlockedIdleFeatures: [...gameState.unlockedIdleFeatures],
    structureLevels: { ...gameState.structureLevels },
    currentArea: gameState.currentArea,
    settings: { ...gameState.settings },
    capacity: { ...gameState.capacity },
    achievements: { ...gameState.achievements },
    dailyQuests: { ...gameState.dailyQuests },
    quests: [...(gameState.quests || [])],
    areaReplays: { ...gameState.areaReplays },
    prestigeLevel: gameState.prestigeLevel,
    prestigePoints: gameState.prestigePoints,
    statistics: { ...gameState.statistics },
    gameTime: Date.now(),
    tutorialProgress: { ...gameState.tutorialProgress },
    bossRewards: { ...gameState.bossRewards },
    endlessWave: gameState.endlessWave,
    dungeonFloor: gameState.dungeonFloor,
    gameMode: gameState.gameMode || 'normal',
    // Persist active gathering jobs (intervals are transient and not serialized)
    activeActions: Object.fromEntries(Object.entries(gameState.activeActions || {}).map(([k, v]) => [k, { startTime: v.startTime, duration: v.duration }])),
    diary: gameState.diary || {
      enemyEncounters: {},
      itemUsage: {},
      areaVisits: {},
      bossEncounters: {}
    }
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
    gameState.equippedAmulet = data.equippedAmulet || null;
    gameState.unlockedAreas = data.unlockedAreas || [0];
    gameState.unlockedIdleFeatures = data.unlockedIdleFeatures || [];
  gameState.structureLevels = data.structureLevels || {};
    gameState.currentArea = data.currentArea || 0;
    gameState.settings = { ...data.settings };
    gameState.capacity = data.capacity || { current: 0, max: 100 };
    gameState.achievements = data.achievements || {};
    gameState.dailyQuests = data.dailyQuests || {};
    gameState.quests = data.quests || [];
    gameState.areaReplays = data.areaReplays || {};
    gameState.prestigeLevel = data.prestigeLevel || 0;
    gameState.prestigePoints = data.prestigePoints || 0;
    gameState.statistics = data.statistics || {};
    gameState.tutorialProgress = data.tutorialProgress || {};
    gameState.bossRewards = data.bossRewards || {};
    gameState.endlessWave = data.endlessWave || 0;
    gameState.dungeonFloor = data.dungeonFloor || 0;
    gameState.gameMode = data.gameMode || 'normal';
    gameState.player.prestigeBonus = data.player?.prestigeBonus || null;
    // Restore active gathering jobs (UI intervals will be created for each)
    gameState.activeActions = data.activeActions || {};
    // Restore diary data
    gameState.diary = data.diary || {
      enemyEncounters: {},
      itemUsage: {},
      areaVisits: {},
      bossEncounters: {}
    };
    
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

// Function to initialize main menu buttons based on save state
let mainMenuListenersAttached = { continue: false, newGame: false };
function initMainMenu() {
  const continueBtn = document.getElementById("btn-continue");
  const newGameBtn = document.getElementById("btn-new-game");
  const saveData = localStorage.getItem("survivalMagicRPG_save");
  
  // Show/hide Continue button based on save state
  if (saveData) {
    // Save exists - show Continue button on top
    if (continueBtn) {
      continueBtn.style.display = "block";
    }
  } else {
    // No save - hide Continue button
    if (continueBtn) {
      continueBtn.style.display = "none";
    }
  }
  
  // Attach Continue button listener (only once)
  if (saveData && continueBtn && !mainMenuListenersAttached.continue) {
    continueBtn.addEventListener("click", () => {
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
    mainMenuListenersAttached.continue = true;
  }
  
  // Attach New Game button listener (only once)
  if (newGameBtn && !mainMenuListenersAttached.newGame) {
    newGameBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[DEBUG] New Game button clicked');
      
      // Reset game state to initial values
      gameState.player = {
        hp: 20,
        maxHp: 20,
        level: 1,
        xp: 0,
        attack: 2,
        defense: 0,
        xpToNext: 10
      };
      gameState.resources = {
        wood: 0, meat: 0, water: 0, plants: 0, stone: 0, hide: 0,
        ritualStones: 0, scrapMetal: 0, crystal: 0, bone: 0, charcoal: 0,
        ore: 0, clay: 0, fiber: 0, sulfur: 0, gold: 0, obsidian: 0, essence: 0, void: 0
      };
      gameState.inventory = {};
      gameState.equipped = { weapon: null, armor: null };
      gameState.equippedAmulet = null;
      gameState.unlockedAreas = [0];
      gameState.unlockedIdleFeatures = [];
      gameState.currentArea = 0;
      gameState.achievements = {};
      gameState.dailyQuests = {};
      gameState.quests = [];
      gameState.areaReplays = {};
      gameState.prestigeLevel = 0;
      gameState.prestigePoints = 0;
      gameState.statistics = {
        enemiesKilled: 0, bossesDefeated: 0, areasCompleted: 0,
        itemsCrafted: 0, totalDamageDealt: 0, totalDamageTaken: 0,
        playTime: 0, deaths: 0
      };
      gameState.tutorialProgress = {};
      gameState.bossRewards = {};
      gameState.activeActions = {};
      gameState.structureLevels = {};
      gameState.capacity = { current: 0, max: 100 };
      gameState.diary = {
        enemyEncounters: {},
        itemUsage: {},
        areaVisits: {},
        bossEncounters: {}
      };
      
      startGame();
    });
    mainMenuListenersAttached.newGame = true;
    console.log('[DEBUG] New Game button event listener attached');
  } else if (!newGameBtn) {
    console.warn('[DEBUG] New Game button not found when initMainMenu was called');
  }
}

// Event Listeners
function initEventListeners() {
  // Main Menu - initialize Continue/New Game buttons
  initMainMenu();
  
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
  
  const btnQuests = document.getElementById("btn-quests");
  if (btnQuests) {
    btnQuests.addEventListener("click", () => {
      showIdleMenu("quests-menu");
      refreshQuestsMenu();
    });
  }
  
  const btnAchievements = document.getElementById("btn-achievements");
  if (btnAchievements) {
    btnAchievements.addEventListener("click", () => {
      showIdleMenu("achievements-menu");
      refreshAchievementsMenu();
    });
  }
  
  const btnStatistics = document.getElementById("btn-statistics");
  if (btnStatistics) {
    btnStatistics.addEventListener("click", () => {
      showIdleMenu("statistics-menu");
      refreshStatisticsMenu();
    });
  }
  
  const btnPrestige = document.getElementById("btn-prestige");
  if (btnPrestige) {
    btnPrestige.addEventListener("click", () => {
      showIdleMenu("prestige-menu");
      refreshPrestigeMenu();
    });
  }
  
  const btnAbilities = document.getElementById("btn-abilities");
  if (btnAbilities) {
    btnAbilities.addEventListener("click", () => {
      showIdleMenu("abilities-menu");
      refreshSpecialAbilitiesMenu();
    });
  }
  
  const btnDiary = document.getElementById("btn-diary");
  if (btnDiary) {
    btnDiary.addEventListener("click", () => {
      showIdleMenu("diary-menu");
      refreshDiaryMenu();
    });
  }
  
  
  // Language selector
  const languageSelect = document.getElementById("language-select");
  if (languageSelect) {
    languageSelect.value = gameState.settings.language || 'en';
    languageSelect.addEventListener("change", (e) => {
      gameState.settings.language = e.target.value;
      saveGame();
      location.reload(); // Reload to apply translations
    });
  }
  
  // Quest tabs
  document.querySelectorAll('.quest-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.quest-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      if (e.target.dataset.tab === 'daily') {
        el('daily-quests-list').classList.remove('hidden');
        el('subquests-list').classList.add('hidden');
      } else {
        el('daily-quests-list').classList.add('hidden');
        el('subquests-list').classList.remove('hidden');
      }
    });
  });
  
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
    } else if (e.key === "q" || e.key === "Q") {
      if (el("game-screen").classList.contains("hidden")) return;
      showIdleMenu("quests-menu");
      refreshQuestsMenu();
    } else if (e.key === "a" || e.key === "A") {
      if (el("game-screen").classList.contains("hidden")) return;
      showIdleMenu("achievements-menu");
      refreshAchievementsMenu();
    } else if (e.key === "s" || e.key === "S") {
      if (el("game-screen").classList.contains("hidden")) return;
      showIdleMenu("statistics-menu");
      refreshStatisticsMenu();
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
  // Initialize main menu (show Continue button if save exists)
  initMainMenu();
  // Start passive healing system (runs in background and can be modified by structures)
  if (gameState.passiveHealing) startPassiveHealing();
  // Periodically check timestamped gathering jobs so they complete even after tab inactivity
  setInterval(processGatheringJobs, 1000);
  addLog("Welcome to Survival Magic RPG!");
  
  // Check if tutorial should start (only for new games, not when continuing)
  checkTutorial();
  
  // Periodically update combat abilities bar if in combat
  setInterval(() => {
    if (gameState.combat.active) {
      refreshCombatAbilitiesBar();
    }
  }, 100);
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

// Fallback global click handler for Continue/New Game buttons (only if listeners haven't been attached yet)
document.addEventListener('click', (e) => {
  try {
    const t = e.target;
    if (!t) return;
    // Only use fallback if listeners haven't been attached yet
    if (t.id === 'btn-new-game' && !mainMenuListenersAttached.newGame) {
      initMainMenu();
      // Trigger click again after initialization
      setTimeout(() => {
        const btn = document.getElementById('btn-new-game');
        if (btn) btn.click();
      }, 10);
    } else if (t.id === 'btn-continue' && !mainMenuListenersAttached.continue) {
      initMainMenu();
      // Trigger click again after initialization
      setTimeout(() => {
        const btn = document.getElementById('btn-continue');
        if (btn) btn.click();
      }, 10);
    }
  } catch (err) {
    console.error('Error in main menu click handler:', err);
  }
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
  const leanLeft = base.map((l, i) => {
    if (i === 1) return ' ' + l.slice(1); // Lean body
    return l;
  });
  const leanRight = base.map((l, i) => {
    if (i === 1) return l.slice(1) + ' '; // Lean body
    return l;
  });
  
  return {
    walk: [base, alt, leanLeft, alt, leanRight],
    attack: [
      base,
      base.map((l, i) => {
        if (i === 1) return l.replace(/\|/, '>|'); // Attack forward
        return l;
      }),
      base.map((l, i) => {
        if (i === 1) return l.replace(/\|/, '\\|'); // Attack backward
        return l;
      }),
      base
    ],
    idle: [base, base.map(l => l.replace(/[Oo]/, m => m === 'O' ? 'o' : 'O'))] // Subtle idle breathing
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
