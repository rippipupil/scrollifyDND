# Spanish names. 2014 options use the wording of the user's PDF ("Manual para Casi Todo");
# 2024-era options without an official Spanish edition are translated here.

CLASS_ES = {
    'barbarian': 'Bárbaro', 'bard': 'Bardo', 'cleric': 'Clérigo', 'druid': 'Druida', 'fighter': 'Guerrero', 'monk': 'Monje',
    'paladin': 'Paladín', 'ranger': 'Explorador', 'rogue': 'Pícaro', 'sorcerer': 'Hechicero', 'warlock': 'Brujo', 'wizard': 'Mago',
    'artificer': 'Artífice',
}

# (class, English name, source) -> Spanish
SUBCLASS_ES = {
    # Artificer
    ('artificer', 'Alchemist'): 'Alquimista', ('artificer', 'Armorer'): 'Blindado', ('artificer', 'Artillerist'): 'Artillero',
    ('artificer', 'Battle Smith'): 'Herrero de Batalla', ('artificer', 'Cartographer'): 'Cartógrafo', ('artificer', 'Reanimator'): 'Reanimador',
    # Barbarian
    ('barbarian', 'Path of the Battlerager'): 'Senda del Camorrista', ('barbarian', 'Path of the Ancestral Guardian'): 'Senda del Guardián Ancestral',
    ('barbarian', 'Path of the Storm Herald'): 'Senda del Heraldo de la Tormenta', ('barbarian', 'Path of the Beast'): 'Senda de la Bestia',
    ('barbarian', 'Path of Wild Magic'): 'Senda de la Magia Salvaje', ('barbarian', 'Path of the Giant'): 'Senda del Gigante',
    ('barbarian', 'Path of the Totem Warrior'): 'Senda del Guerrero Totémico', ('barbarian', 'Path of the Berserker'): 'Senda del Berserker',
    ('barbarian', 'Path of the Zealot'): 'Senda del Fanático',
    # Bard
    ('bard', 'College of Swords'): 'Colegio de Espadas', ('bard', 'College of Whispers'): 'Colegio de los Susurros',
    ('bard', 'College of Creation'): 'Colegio de la Creación', ('bard', 'College of Eloquence'): 'Colegio de la Elocuencia',
    ('bard', 'College of Spirits'): 'Colegio de los Espíritus', ('bard', 'College of the Moon'): 'Colegio de la Luna',
    ('bard', 'College of Lore'): 'Colegio del Conocimiento', ('bard', 'College of Valor'): 'Colegio del Valor', ('bard', 'College of Glamour'): 'Colegio del Glamour',
    # Cleric
    ('cleric', 'Nature Domain'): 'Dominio de la Naturaleza', ('cleric', 'Tempest Domain'): 'Dominio de la Tempestad', ('cleric', 'Death Domain'): 'Dominio de la Muerte',
    ('cleric', 'Forge Domain'): 'Dominio de la Forja', ('cleric', 'Order Domain'): 'Dominio del Orden', ('cleric', 'Peace Domain'): 'Dominio de la Paz',
    ('cleric', 'Twilight Domain'): 'Dominio del Crepúsculo', ('cleric', 'Knowledge Domain'): 'Dominio del Conocimiento', ('cleric', 'Arcana Domain'): 'Dominio Arcano',
    ('cleric', 'Grave Domain'): 'Dominio de la Tumba', ('cleric', 'Life Domain'): 'Dominio de la Vida', ('cleric', 'Light Domain'): 'Dominio de la Luz',
    ('cleric', 'Trickery Domain'): 'Dominio del Engaño', ('cleric', 'War Domain'): 'Dominio de la Guerra',
    # Druid
    ('druid', 'Circle of Dreams'): 'Círculo de los Sueños', ('druid', 'Circle of the Shepherd'): 'Círculo del Pastor', ('druid', 'Circle of Spores'): 'Círculo de las Esporas',
    ('druid', 'Circle of Wildfire'): 'Círculo del Fuego Fatuo', ('druid', 'Circle of Stars'): 'Círculo de las Estrellas', ('druid', 'Circle of the Land'): 'Círculo de la Tierra',
    ('druid', 'Circle of the Moon'): 'Círculo de la Luna',
    # Fighter
    ('fighter', 'Cavalier'): 'Jinete', ('fighter', 'Samurai'): 'Samurái', ('fighter', 'Echo Knight'): 'Caballero Eco', ('fighter', 'Rune Knight'): 'Caballero Rúnico',
    ('fighter', 'Purple Dragon Knight (Banneret)'): 'Caballero del Dragón Púrpura', ('fighter', 'Banneret'): 'Abanderado', ('fighter', 'Arcane Archer'): 'Arquero Arcano',
    ('fighter', 'Battle Master'): 'Maestro de Batalla', ('fighter', 'Champion'): 'Campeón', ('fighter', 'Eldritch Knight'): 'Caballero Arcano', ('fighter', 'Psi Warrior'): 'Guerrero Psiónico',
    # Monk
    ('monk', 'Way of the Long Death'): 'Camino de la Larga Muerte', ('monk', 'Way of the Drunken Master'): 'Camino del Maestro Borracho', ('monk', 'Way of the Kensei'): 'Camino del Kensei',
    ('monk', 'Way of the Sun Soul'): 'Camino del Alma del Sol', ('monk', 'Way of the Astral Self'): 'Camino del Ser Astral', ('monk', 'Way of the Ascendant Dragon'): 'Camino del Dragón Ascendente',
    ('monk', 'Warrior of the Mystic Arts'): 'Guerrero de las Artes Místicas', ('monk', 'Way of the Open Hand'): 'Camino de la Palma', ('monk', 'Way of Shadow'): 'Camino de la Sombra',
    ('monk', 'Way of the Four Elements'): 'Camino de los Cuatro Elementos', ('monk', 'Way of Mercy'): 'Camino de la Misericordia',
    # Paladin
    ('paladin', 'Oathbreaker'): 'Rompejuramentos', ('paladin', 'Oath of the Crown'): 'Juramento de la Corona', ('paladin', 'Oath of Conquest'): 'Juramento de Conquista',
    ('paladin', 'Oath of Redemption'): 'Juramento de Redención', ('paladin', 'Oath of the Watchers'): 'Juramento de los Vigilantes', ('paladin', 'Oath of the Noble Genies'): 'Juramento de los Genios Nobles',
    ('paladin', 'Oath of Devotion'): 'Juramento de Devoción', ('paladin', 'Oath of the Ancients'): 'Juramento de los Antiguos', ('paladin', 'Oath of Vengeance'): 'Juramento de la Venganza',
    ('paladin', 'Oath of Glory'): 'Juramento de Gloria',
    # Ranger
    ('ranger', 'Horizon Walker'): 'Caminante del Horizonte', ('ranger', 'Monster Slayer'): 'Asesino de Monstruos', ('ranger', 'Swarmkeeper'): 'Guardián del Enjambre',
    ('ranger', 'Drakewarden'): 'Guardadracos', ('ranger', 'Winter Walker'): 'Caminante del Invierno', ('ranger', 'Hollow Warden'): 'Guardián de la Hondonada',
    ('ranger', 'Beast Master'): 'Señor de las Bestias', ('ranger', 'Hunter'): 'Cazador', ('ranger', 'Gloom Stalker'): 'Acechador de la Penumbra', ('ranger', 'Fey Wanderer'): 'Errante Feérico',
    # Rogue
    ('rogue', 'Inquisitive'): 'Inquisitivo', ('rogue', 'Mastermind'): 'Mente Maestra', ('rogue', 'Scout'): 'Rastreador', ('rogue', 'Swashbuckler'): 'Espadachín',
    ('rogue', 'Phantom'): 'Fantasma', ('rogue', 'Scion of the Three'): 'Vástago de los Tres', ('rogue', 'Thief'): 'Ladrón', ('rogue', 'Assassin'): 'Asesino',
    ('rogue', 'Arcane Trickster'): 'Bribón Arcano', ('rogue', 'Soulknife'): 'Cuchilla Espiritual',
    # Sorcerer
    ('sorcerer', 'Divine Soul'): 'Alma Divina', ('sorcerer', 'Storm Sorcery'): 'Hechicería de la Tormenta', ('sorcerer', 'Lunar Sorcery'): 'Hechicería Lunar',
    ('sorcerer', 'Shadow Magic'): 'Magia Sombría', ('sorcerer', 'Shadow Sorcery'): 'Hechicería Sombría', ('sorcerer', 'Spellfire Sorcery'): 'Hechicería del Fuego Mágico',
    ('sorcerer', 'Draconic Bloodline'): 'Sangre Dracónica', ('sorcerer', 'Wild Magic'): 'Magia Salvaje', ('sorcerer', 'Aberrant Mind'): 'Mente Aberrante', ('sorcerer', 'Clockwork Soul'): 'Alma Mecánica',
    # Warlock
    ('warlock', 'The Undying'): 'El Inmortal', ('warlock', 'The Hexblade'): 'El Hexblade', ('warlock', 'The Fathomless'): 'El Insondable', ('warlock', 'The Genie'): 'El Genio',
    ('warlock', 'The Undead'): 'El No Muerto', ('warlock', 'Undead Patron'): 'Patrón No Muerto', ('warlock', 'Vestige Patron'): 'Patrón Vestigio',
    ('warlock', 'The Archfey'): 'El Archifeérico', ('warlock', 'The Fiend'): 'El Infernal', ('warlock', 'The Great Old One'): 'El Primigenio', ('warlock', 'The Celestial'): 'El Celestial',
    # Wizard
    ('wizard', 'War Magic'): 'Magia de Guerra', ('wizard', 'Chronurgy Magic'): 'Magia Cronúrgica', ('wizard', 'Graviturgy Magic'): 'Magia Gravitúrgica',
    ('wizard', 'Order of Scribes'): 'Orden de los Escribas', ('wizard', 'Bladesinging'): 'Danzante del Filo', ('wizard', 'Bladesinger'): 'Danzante del Filo',
    ('wizard', 'Conjurer'): 'Conjurador', ('wizard', 'Enchanter'): 'Encantador', ('wizard', 'Necromancer'): 'Nigromante', ('wizard', 'Transmuter'): 'Transmutador',
    ('wizard', 'School of Abjuration'): 'Escuela de Abjuración', ('wizard', 'School of Conjuration'): 'Escuela de Conjuración', ('wizard', 'School of Divination'): 'Escuela de Adivinación',
    ('wizard', 'School of Enchantment'): 'Escuela de Encantamiento', ('wizard', 'School of Evocation'): 'Escuela de Evocación', ('wizard', 'School of Illusion'): 'Escuela de Ilusión',
    ('wizard', 'School of Necromancy'): 'Escuela de Nigromancia', ('wizard', 'School of Transmutation'): 'Escuela de Transmutación',
}

SPECIES_ES = {
    'Aarakocra': 'Aarakocra', 'Bugbear': 'Osgo (Bugbear)', 'Centaur': 'Centauro', 'Deep Gnome': 'Gnomo de las Profundidades', 'Duergar': 'Duergar',
    'Eladrin': 'Eladrín', 'Fairy': 'Hada', 'Firbolg': 'Firbolg', 'Genasi': 'Genasi', 'Githyanki': 'Githyanki', 'Githzerai': 'Githzerai', 'Goblin': 'Goblin',
    'Harengon': 'Conéjido (Harengon)', 'Hobgoblin': 'Hobgoblin', 'Kenku': 'Kenku', 'Kobold': 'Kobold', 'Lizardfolk': 'Hombre lagarto', 'Minotaur': 'Minotauro',
    'Satyr': 'Sátiro', 'Sea Elf': 'Elfo de mar', 'Shadar-Kai': 'Shadar-Kai', 'Tabaxi': 'Tabaxi', 'Tortle': 'Tortuga (Tortle)', 'Triton': 'Tritón', 'Yuan-Ti': 'Yuan-ti',
    'Owlin': 'Búhonido (Owlin)', 'Grung': 'Grung', 'Locathah': 'Locathah', 'Verdan': 'Verdan', 'Leonin': 'Leónido', 'Loxodon': 'Loxodon', 'Simic Hybrid': 'Híbrido Simic',
    'Vedalken': 'Vedalken', 'Half-Orc': 'Semiorco', 'Half-Elf': 'Semielfo', 'Dragonborn (Gem)': 'Dracónido gemático',
    # 2024-era
    'Changeling': 'Cambiante (Changeling)', 'Kalashtar': 'Kalashtar', 'Khoravar': 'Khoravar (semielfo de Eberron)', 'Shifter': 'Cambiaformas (Shifter)', 'Warforged': 'Forjado (Warforged)',
    'Dhampir': 'Dhampiro', 'Hexblood': 'Sangre maldita (Hexblood)', 'Lupin': 'Lupino', 'Reborn': 'Renacido',
    'Boggart': 'Boggart', 'Elf': 'Elfo de Lorwyn', 'Faerie': 'Feérico de Lorwyn', 'Flamekin': 'Hijo de la llama (Flamekin)', 'Kithkin': 'Kithkin',
    'Lorwyn Changeling': 'Cambiante de Lorwyn', 'Rimekin': 'Hijo de la escarcha (Rimekin)',
}

BACKGROUND_ES = {
    # 2014 (PDF)
    'City Watch': 'Guardia de Ciudad', 'Clan Crafter': 'Artesano del Clan', 'Cloistered Scholar': 'Erudito Enclaustrado', 'Courtier': 'Cortesano',
    'Faction Agent': 'Agente de una Facción', 'Far Traveler': 'Forastero Errante', 'Folk Hero': 'Héroe del Pueblo', 'Guild Artisan': 'Artesano Gremial',
    'Inheritor': 'Heredero', 'Knight of the Order': 'Caballero de la Orden', 'Mercenary Veteran': 'Mercenario Veterano', 'Outlander': 'Fronterizo',
    'Urban Bounty Hunter': 'Cazarrecompensas Urbano', 'Urchin': 'Huérfano', 'Uthgardt Tribe Member': 'Miembro de una Tribu Uthgardt', 'Waterdhavian Noble': 'Noble de Aguasprofundas',
    # 2024-era books
    'Aberrant Heir': 'Heredero aberrante', 'Agent of the Ninth Quill': 'Agente de la Novena Pluma', 'Archaeologist': 'Arqueólogo', 'Bejeweled Conclave Spy': 'Espía del Cónclave Enjoyado',
    'Carouser': 'Juerguista', 'Chondathan Freebooter': 'Filibustero chondathano', 'Cosmic Dawn Experiment': 'Experimento del Alba Cósmica', 'Covenant of the Grave Recruit': 'Recluta del Pacto de la Tumba',
    'Crucible Storm Chaser': 'Cazatormentas del Crisol', 'Dead Magic Dweller': 'Habitante de la magia muerta', 'Dragon Cultist': 'Cultista del Dragón', 'Emerald Enclave Caretaker': 'Cuidador del Enclave Esmeralda',
    'Familiar Trainer': 'Adiestrador de familiares', 'Flaming Fist Mercenary': 'Mercenario del Puño Llameante', 'Genie Touched': 'Tocado por un genio', 'Harper': 'Arpista',
    'Haunted One': 'Atormentado', 'Horizon Weaver Initiate': 'Iniciado de los Tejedores del Horizonte', 'House Agent': 'Agente de una Casa', 'House Cannith Heir': 'Heredero de la Casa Cannith',
    'House Deneith Heir': 'Heredero de la Casa Deneith', 'House Ghallanda Heir': 'Heredero de la Casa Ghallanda', 'House Jorasco Heir': 'Heredero de la Casa Jorasco',
    'House Kundarak Heir': 'Heredero de la Casa Kundarak', 'House Lyrandar Heir': 'Heredero de la Casa Lyrandar', 'House Medani Heir': 'Heredero de la Casa Medani',
    'House Orien Heir': 'Heredero de la Casa Orien', 'House Phiarlan Heir': 'Heredero de la Casa Phiarlan', 'House Sivis Heir': 'Heredero de la Casa Sivis',
    'House Tharashk Heir': 'Heredero de la Casa Tharashk', 'House Thuranni Heir': 'Heredero de la Casa Thuranni', 'House Vadalis Heir': 'Heredero de la Casa Vadalis',
    'Ice Fisher': 'Pescador del hielo', 'Inquisitive': 'Inquisitivo', 'Investigator': 'Investigador', 'Knight of the Gauntlet': 'Caballero del Guantelete',
    "Lords' Alliance Vassal": 'Vasallo de la Alianza de los Señores', 'Lorwyn Expert': 'Experto de Lorwyn', 'Mist Wanderer': 'Errante de la bruma', 'Moonwell Pilgrim': 'Peregrino del Pozo Lunar',
    'Mulhorandi Tomb Raider': 'Saqueador de tumbas mulhorandino', 'Mythalkeeper': 'Guardián del mythal', 'Phantasmic Circus Trouper': 'Artista del Circo Fantasmal',
    'Purple Dragon Squire': 'Escudero del Dragón Púrpura', 'Rashemi Wanderer': 'Errante rashemí', 'Seer Apprentice': 'Aprendiz de vidente', 'Shadowmasters Exile': 'Exiliado de los Maestros de las Sombras',
    'Shadowmoor Expert': 'Experto de Shadowmoor', 'Spellfire Initiate': 'Iniciado del fuego mágico', 'Spirit Medium': 'Médium', 'Vampire Devotee': 'Devoto vampírico',
    'Vampire Survivor': 'Superviviente de vampiros', 'Ward of the Sheltering Hands': 'Pupilo de las Manos Protectoras', 'Zhentarim Mercenary': 'Mercenario zhentarim',
}

FEAT_ES = {
    # 2014 (PDF)
    'Artificer Initiate': 'Artificiero Iniciado', 'Bountiful Luck': 'Suerte Abundante', 'Dragon Fear': 'Temor al Dragón', 'Dragon Hide': 'Piel de Dragón',
    'Drow High Magic': 'Magia Alta de Drow', 'Dungeon Delver': 'Explorador de Mazmorras', 'Dwarven Fortitude': 'Fortaleza Enana', 'Eldritch Adept': 'Adepto de lo Oculto',
    'Elven Accuracy': 'Precisión Élfica', 'Fade Away': 'Desvanecerse', 'Fey Teleportation': 'Teletransportación Feérica', 'Fighting Initiate': 'Iniciado en la Lucha',
    'Flames of Phlegethos': 'Llamas de Flegetos', 'Gift of the Chromatic Dragon': 'Bendición del Dragón Cromático', 'Gift of the Gem Dragon': 'Bendición del Dragón Gemático',
    'Gift of the Metallic Dragon': 'Bendición del Dragón Metálico', 'Gunner': 'Artillero', 'Infernal Constitution': 'Constitución Infernal', 'Linguist': 'Lingüista',
    'Martial Adept': 'Adepto Marcial', 'Metamagic Adept': 'Adepto Metamágico', 'Orcish Fury': 'Furia Orca', 'Prodigy': 'Prodigio', 'Second Chance': 'Segunda Oportunidad',
    'Squat Nimbleness': 'Elasticidad a Gachas', 'Wood Elf Magic': 'Magia de Elfo del Bosque',
    # Missing PHB 2024
    'Blessed Warrior': 'Guerrero bendito', 'Druidic Warrior': 'Guerrero druídico', 'Boon of Energy Resistance': 'Don de resistencia a la energía', 'Boon of Fortitude': 'Don de fortaleza',
    'Boon of Recovery': 'Don de recuperación', 'Boon of Skill': 'Don de habilidad', 'Boon of Speed': 'Don de velocidad',
    # 2024-era books
    'Aberrant Anatomy': 'Anatomía aberrante', 'Aberrant Dragonmark': 'Marca de dragón aberrante', 'Abjuration Adept': 'Adepto de la abjuración', 'Arcane Artist': 'Artista arcano',
    'Arcane Eloquence': 'Elocuencia arcana', 'Arcane Infiltrator': 'Infiltrado arcano', 'Arcane Omens': 'Presagios arcanos', 'Arcane Overload': 'Sobrecarga arcana',
    'Arcane Safeguard': 'Salvaguarda arcana', 'Arcane Undertaker': 'Enterrador arcano', 'Arcane Warrior': 'Guerrero arcano', 'Bloodlust': 'Sed de sangre', 'Bomber': 'Bombardero',
    'Boon of Blazing Dawn': 'Don del alba ardiente', 'Boon of Bloodshed': 'Don del derramamiento de sangre', 'Boon of Bountiful Health': 'Don de la salud abundante',
    'Boon of Communication': 'Don de la comunicación', 'Boon of Desperate Resilience': 'Don de la resistencia desesperada', 'Boon of Erupting Spellpower': 'Don del poder mágico desbordado',
    'Boon of Exquisite Radiance': 'Don del resplandor exquisito', 'Boon of Fluid Forms': 'Don de las formas fluidas', "Boon of Fortune's Favor": 'Don del favor de la fortuna',
    'Boon of Looming Shadows': 'Don de las sombras acechantes', 'Boon of Magic School Mastery': 'Don de maestría en una escuela de magia', 'Boon of Misty Escape': 'Don de la huida brumosa',
    'Boon of Poison Mastery': 'Don de maestría en venenos', 'Boon of Revelry': 'Don de la juerga', 'Boon of Siberys': 'Don de Siberys', 'Boon of Terror': 'Don del terror',
    'Boon of the Bright Sun': 'Don del sol brillante', 'Boon of the Furious Storm': 'Don de la tormenta furiosa', 'Boon of the Iron Mind': 'Don de la mente de hierro',
    'Boon of the Soul Drinker': 'Don del bebedor de almas', 'Child of the Sun': 'Hijo del sol', 'Cloying Mists': 'Brumas empalagosas', 'Cold Caster': 'Lanzador gélido',
    'Conjuration Adept': 'Adepto de la conjuración', 'Cult of the Dragon Initiate': 'Iniciado del Culto del Dragón', 'Delicious Pain': 'Dolor delicioso', 'Divination Adept': 'Adepto de la adivinación',
    'Dragonscarred': 'Marcado por dragones', 'Echoing Soul': 'Alma resonante', 'Elemental Familiar': 'Familiar elemental', 'Emerald Enclave Fledgling': 'Novato del Enclave Esmeralda',
    'Enchantment Adept': 'Adepto del encantamiento', 'Enclave Magic': 'Magia del Enclave', 'Evocation Adept': 'Adepto de la evocación', 'Fairy Trickster': 'Embaucador feérico',
    'Familiar Friend': 'Amigo de los familiares', 'Gathered Whispers': 'Susurros reunidos', 'Genie Magic': 'Magia de genio', 'Greater Aberrant Mark': 'Marca aberrante mayor',
    'Greater Mark of Detection': 'Marca mayor de detección', 'Greater Mark of Finding': 'Marca mayor de búsqueda', 'Greater Mark of Handling': 'Marca mayor de doma',
    'Greater Mark of Healing': 'Marca mayor de curación', 'Greater Mark of Hospitality': 'Marca mayor de hospitalidad', 'Greater Mark of Making': 'Marca mayor de creación',
    'Greater Mark of Passage': 'Marca mayor de paso', 'Greater Mark of Scribing': 'Marca mayor de escritura', 'Greater Mark of Sentinel': 'Marca mayor del centinela',
    'Greater Mark of Shadow': 'Marca mayor de sombra', 'Greater Mark of Storm': 'Marca mayor de tormenta', 'Greater Mark of Warding': 'Marca mayor de protección',
    'Harper Agent': 'Agente arpista', 'Harper Teamwork': 'Trabajo en equipo arpista', 'Illusion Adept': 'Adepto de la ilusión', 'Light Bringer': 'Portador de luz',
    'Living Shadow': 'Sombra viviente', 'Lordly Resolve': 'Resolución señorial', "Lords' Alliance Agent": 'Agente de la Alianza de los Señores', 'Love Bites': 'Mordiscos de amor',
    'Magic Connoisseur': 'Entendido en magia', 'Mark of Detection': 'Marca de detección', 'Mark of Finding': 'Marca de búsqueda', 'Mark of Handling': 'Marca de doma',
    'Mark of Healing': 'Marca de curación', 'Mark of Hospitality': 'Marca de hospitalidad', 'Mark of Making': 'Marca de creación', 'Mark of Passage': 'Marca de paso',
    'Mark of Scribing': 'Marca de escritura', 'Mark of Sentinel': 'Marca del centinela', 'Mark of Shadow': 'Marca de sombra', 'Mark of Storm': 'Marca de tormenta',
    'Mark of Warding': 'Marca de protección', 'Mist Walker': 'Caminante de la bruma', 'Mythal Touched': 'Tocado por un mythal', 'Necromancy Adept': 'Adepto de la nigromancia',
    "Order's Resilience": 'Resistencia de la Orden', 'Otherworldly Familiar': 'Familiar de otro mundo', 'Portal Jumper': 'Saltador de portales', 'Potent Dragonmark': 'Marca de dragón potente',
    'Purple Dragon Commandant': 'Comandante del Dragón Púrpura', 'Purple Dragon Rook': 'Recluta del Dragón Púrpura', 'Putrefy': 'Putrefacción', 'Rebuke': 'Reprimenda',
    'Second Skin': 'Segunda piel', 'Shadowmoor Hexer': 'Hechicero maléfico de Shadowmoor', 'Sharp Eye': 'Ojo avizor', 'Soothing Familiar': 'Familiar sosegador',
    'Spell Resistant': 'Resistente a la magia', 'Spell Subterfuge': 'Subterfugio mágico', 'Spellfire Adept': 'Adepto del fuego mágico', 'Spellfire Spark': 'Chispa de fuego mágico',
    'Street Justice': 'Justicia callejera', 'Survivor': 'Superviviente', 'Symbiotic Being': 'Ser simbiótico', 'Tireless Reveler': 'Juerguista incansable', 'Touch of Death': 'Toque de la muerte',
    'Transmutation Adept': 'Adepto de la transmutación', 'Transmuted Anatomy': 'Anatomía transmutada', 'Treacherous Allure': 'Atractivo traicionero', 'Tyro of the Gauntlet': 'Novicio del Guantelete',
    'Vampire Hunter': 'Cazavampiros', 'Vampire Touched': 'Tocado por un vampiro', "Vampire's Plaything": 'Juguete de un vampiro', 'Warlike Familiar': 'Familiar belicoso', 'Watchers': 'Observadores',
    'Zhentarim Ruffian': 'Matón zhentarim', 'Zhentarim Tactics': 'Tácticas zhentarim',
}

# Names the PDF uses for options that do have a 2024 version (for the report).
PDF_SUBCLASS_ES = {k: v for k, v in SUBCLASS_ES.items()}
