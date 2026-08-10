# Mark of the Veil: world, picture, and sound bible

## Campaign lock

This bible defines the production language for an eight-chapter campaign. Each chapter is one
substantial authored level with five to seven objectives, checkpoints, a distinct spatial rhythm,
and a complete dramatic turn. A chapter can be split into smaller streaming scenes without changing
its campaign identity or save ID.

| Chapter | Level                     | Internal story beat          | Primary setting                                                   |
| ------: | ------------------------- | ---------------------------- | ----------------------------------------------------------------- |
|      01 | **Ashes of Home**         | A Broken Oath / City of Rain | Wayfarer crash basin and stormglass observatory                   |
|      02 | **The Root Vault**        | The Root Vault               | Subterranean bio-gothic prison and fungal aqueducts               |
|      03 | **Vespera in Black**      | Teeth of the Storm           | Rain-soaked cathedral city and resistance relay rooftops          |
|      04 | **The Drowned Cathedral** | Garden of False Stars        | Flooded nave, three Veil seals, and the Hollow Regent             |
|      05 | **The Silent Orbit**      | The Oath War                 | Derelict orbital lift and Crown debris in failing gravity         |
|      06 | **The Memory Forge**      | The Black Orchard            | Alien archive rebuilding Mark's war memories as physical space    |
|      07 | **Crown of Eidolon**      | The Eidolon Crown            | Moon-scale machine exterior, conduit trenches, and living gate    |
|      08 | **The Root Choir**        | What Never Was               | Hive-mind interior, memory ocean, and final knowledge convergence |

The quality bar is the authored clarity, material density, lighting contrast, performance stability,
and mix discipline expected from a premium action campaign. The browser delivery target changes the
asset strategy, not the art direction.

## Historical single-arena baseline

The build that preceded the campaign expansion provided the following foundation:

- `Arena.ts` creates a 48-meter flooded circular arena, storm cyclorama, rain, embers, moon key,
  lightning, and eight practical point lights.
- `BioGothicArchitecture.ts` supplies pointed arches, compound piers, reliquaries, rose portal,
  hanging chains, rubble, roots, central crown, floor slabs, and reflective pools.
- `ArenaMaterials.ts` supplies stone, bio-stone, chitin, tarnished metal, black metal, blood, water,
  hostile glass, veins, and soot.
- `ActorFactory.ts` supplies Mark, the Sunlance, Chainling, Needlewing, Ruin Warden, Hollow Regent,
  Veil seals, carrot talisman, and Wayfarer extraction craft.
- `CharacterMaterials.ts` supplies dedicated 1K PBR studies for Mark's fur and armor and alien chitin.
- `EffectsDirector.ts` supplies pooled particles, tracers, muzzle effects, bursts, and radial pulses.
- `CinematicRenderPipeline.ts` supplies HDR composition, screen-space reflections, GTAO, bloom,
  SMAA or FXAA, cinematic grading, adaptive quality, and frozen-scene path tracing.
- `AudioDirector.ts` supplies one gesture-authorized Web Audio graph, spatial SFX, drone, choir,
  procedural percussion, deterministic noise, convolution reverb, adaptive intensity, and four
  player-facing mix buses.

The original arena became the seed for Chapter 4. It is not the universal campaign template. Its
historical gameplay capture submitted roughly 1.2 to 1.5 million triangles and reached 37 to 38 FPS
on an Apple M4 at 1672 by 941 on High. That measurement predates the current eight-chapter build and
is not a campaign benchmark. Each chapter needs a fresh, named-hardware measurement before a release
performance claim.

The promotional plates and gameplay target show denser materials, clearer depth layering, stronger
hero silhouettes, and more motivated lighting than the historical single-arena runtime capture.
Closing that gap is a production requirement. Recoloring the circular arena does not count as a new
biome.

## Creative north star

### World thesis

Vespera is a civilization whose sacred architecture, military hardware, and nervous tissue have
grown into one another. Every object should answer three questions:

1. What human purpose did this object once serve?
2. How did the Eidolon Crown repurpose it?
3. What physical evidence records the struggle between those states?

A wall is never only a wall. It can begin as cut basalt, acquire a metal service spine, split under
root pressure, bleed conductive resin, and receive a resistance repair plate. These layers create
history without exposition.

### Emotional thesis

Mark begins certain that origins make a person. His bond with mechanic and wingmate Sable Vale, his
conflict with bereaved resistance commander Ilya Rook, and his friendship with the dissident Choir
fragment Nacre test that belief from three directions. Mark learns that his memories, body, and
species were authored. He still chooses the bonds he lived as real. In the final act he gives up his
individual boundary to free the captive minds inside the Choir.

The story separates provenance from meaning. The reveal that unicorns never existed invalidates a
biological origin, not Mark's choices, Sable's love, Nacre's emerging selfhood, or the lives he saves.

### Character picture and sound identifiers

| Character  | Picture rule                                                             | Sound rule                                              | Arc marker                                                         |
| ---------- | ------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------ |
| Mark       | Purple tactile mass, battered asymmetry, readable eyes and horn          | Three-note horn call, body Foley, worn weapon mechanics | His motif loses one note at a time in Chapter 8                    |
| Sable Vale | Warm practicals, rolled sleeves, repaired tools, open triangular framing | Warm mechanical percussion and close unprocessed voice  | Her rhythm survives inside the final separated voices              |
| Ilya Rook  | Severe verticals, clipped silhouette, resistance gold losing warmth      | Clipped martial pulse with no swing                     | Pulse fractures when grief turns him against Mark                  |
| Nacre      | One pale asymmetrical fragment inside Crown symmetry                     | Choir cluster separating into one breath                | Singular breath becomes a distinct voice and then many free voices |
| Wayfarer   | Wedge silhouette, visible repairs, Crown geometry under human paint      | Engine rhythm fused with Sable's percussion             | Its Crown origin is visible before it is explained                 |

Recurring story images are carrot amber, broken oaths, rain becoming stars, missing constellations,
mirrors, roots that form crowns, the three-note horn call, and the phrase “the veil remembers.” Each
recurrence must change meaning or reveal information. It cannot serve as ornamental branding alone.

### Five visual pillars

1. **Monumental scale, readable routes.** Large forms frame a clear 6 to 12 meter gameplay corridor.
2. **Wet, abraded matter.** Water, soot, frost, oil, fur, scars, chipped oxide, and tissue keep every
   surface physically specific.
3. **One warm truth in a cold world.** Carrot amber, resistance lamps, and Wayfarer cabin light mark
   shelter, choice, or memory. Hostile coral is sharper and more saturated.
4. **The Crown repeats with intent.** Rings, axial symmetry, eleven-point crowns, and branching roots
   increase as Mark approaches the hive-mind.
5. **Mark remains tactile.** Purple fur, battered armor, weapon weight, breath, footfall, and cloth
   movement anchor abstract spaces in a body the player trusts.

### Shape language

| Faction or idea     | Primary shapes                                         | Edge behavior                                   | Motion                                                  |
| ------------------- | ------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------- |
| Mark and Wayfarer   | Wedges, offset rectangles, visible fasteners           | Worn bevels and field repairs                   | Weighted arcs, recoil, mechanical follow-through        |
| Vespera civic world | Pointed arches, vertical bays, radial plazas           | Eroded masonry and metal inlays                 | Rain, cloth, cables, failing machinery                  |
| Resistance          | Triangles, hand-cut chevrons, asymmetric patches       | Saw cuts, weld beads, paint abrasion            | Human timing, hesitation, manual mechanisms             |
| Eidolon Crown       | Concentric rings, eleven-point crowns, branching veins | Surgical edges against wet tissue               | Synchronized pulses and impossible smooth rotation      |
| Memory Forge        | Incomplete frames, repeated doorways, sheared planes   | Pixel-fine fracture mixed with soft dissolution | Repetition, temporal slips, reversed debris             |
| Root Choir          | Horizonless circles, root lattices, liquid mirrors     | No stable edge at the final convergence         | Breathing scale, phase-locked waves, eventual stillness |

## Modular environment strategy

### Shared kit families

Five kit families support all eight chapters. Each chapter may expose at most three families at once.

1. **Civic Gothic:** piers, pointed arches, window tracery, stairs, balustrades, slabs, reliquaries,
   plazas, rail platforms, and tower shells.
2. **Vespera Utility:** conduits, lifts, catwalks, maintenance doors, relay dishes, bridge trusses,
   cable looms, lamps, drainage, and power cabinets.
3. **Crown Incursion:** chitin plates, tendons, membranes, roots, hostile glass, crowns, seals, iris
   doors, sensory cilia, and neural cores.
4. **Wayfarer Military:** hull panels, cockpit glass, seat rails, cargo cells, weapon racks, heat
   shielding, landing gear, field cases, and pilot instrumentation.
5. **Memory Matter:** fragment planes, mirrored water, volumetric silhouettes, displaced decals,
   temporal afterimages, and topology transitions.

Every structural piece uses a shared metric grid: 0.5 meter detail, 2 meter service module, 4 meter
combat bay, and 8 meter landmark bay. Door clearances, cover heights, mantle edges, and camera
collision volumes stay consistent across skins.

### Anti-repetition contract

Each chapter must change all six of these dimensions:

1. **Plan:** basin, descent, rooftop chain, radial nave, vertical lift, impossible loop, trench, ocean.
2. **Section:** open sky, compressed tunnel, stepped skyline, vaulted hall, rotating zero gravity,
   fractured memory, colossal exterior, horizonless interior.
3. **Dominant material:** basalt, fungal stone, rain-black metal, flooded masonry, thermal alloy,
   memory glass, bone chitin, liquid thought.
4. **Key direction:** storm backlight, low prison slots, neon side light, moon shafts, solar rim,
   source-less memory glow, grazing stellar light, omnidirectional convergence.
5. **Atmospheric motion:** ash, spores, rain, mist, ice debris, reversed particles, cinders, thought
   motes.
6. **Sound horizon:** open storm, close drips, urban machinery, cathedral tail, structure-borne hum,
   unstable recollection, planetary machinery, internal voices.

The shared-kit ratio is 60 percent structural reuse, 30 percent chapter-specific modification, and
10 percent hero assets. The 10 percent must control the skyline, first reveal, midpoint reversal,
and final combat backdrop. Reuse is invisible when the hero assets and spatial section change.

### Variation layers

- **Macro:** swap silhouette modules, rooflines, broken spans, and traversal direction.
- **Meso:** use chapter-specific damage, roots, braces, cables, vegetation, snow, or debris clusters.
- **Micro:** use decals, edge wear, leakage, soot, waterline, frost, dust, and localized roughness.
- **State:** create intact, Crown-touched, destroyed, and aftermath variants for every hero room.
- **Story:** reserve unique props for named events. Do not scatter hero props as filler.

## Campaign color and light script

| Chapter | Dominant value        | Key color                | Practical color                  | Hostile accent           | Emotional change                 |
| ------: | --------------------- | ------------------------ | -------------------------------- | ------------------------ | -------------------------------- |
|      01 | Open mid-dark         | Storm blue `#86a9c7`     | Cabin amber `#e9a259`            | Coral `#ff5b35`          | Confidence becomes shock         |
|      02 | Compressed black      | Fungal green `#779579`   | Sodium amber `#d88742`           | Blood coral `#f0442c`    | Captivity becomes resolve        |
|      03 | Layered urban dark    | Rain cyan `#58b7d8`      | Resistance gold `#e3ad61`        | Signal magenta `#e04b76` | Isolation becomes connection     |
|      04 | Reflective blue-black | Moon blue `#a9c8ff`      | Carrot and flame amber `#f3a24f` | Veil coral `#ff6038`     | Resolve becomes trespass         |
|      05 | Extreme black-white   | Solar white `#f5f1df`    | Emergency red `#cf3f31`          | Crown green `#57ffad`    | Scale becomes dread              |
|      06 | False warmth          | Memory gold `#e3bc78`    | Wayfarer cyan `#7ecce8`          | Error violet `#9a78ff`   | Nostalgia becomes suspicion      |
|      07 | Bone midtone          | Stellar violet `#877cff` | Conduit cyan `#64c9e8`           | Core coral `#ff3d27`     | Defiance becomes inevitability   |
|      08 | Near-monochrome       | Bone white `#e7d7b0`     | Mark violet `#9a78ff`            | None after convergence   | Identity becomes total knowledge |

Rules:

- One shadow-casting directional or spot key remains the gameplay rule. Local practicals do not cast
  shadows unless a scripted hero shot temporarily replaces the key.
- High supports seven camera-relevant point lights, Medium six, and Low four. Authors may place more
  lights, but the forward-light budget must select them without changing navigation cues.
- A chapter owns one dominant key direction. Reversing that direction marks a story reversal.
- Bloom identifies energy, wet highlights, lightning, and optics. It does not soften masonry or fur.
- Fog separates three depth planes. It never obscures an active enemy silhouette or objective route.
- Reduced Flashes removes lightning pulses, rapid practical flutter, and additive spikes while
  preserving the chapter's key-to-fill ratio.

## Chapter production briefs

### 01: Ashes of Home

**Dramatic purpose:** Introduce Mark and Sable as a capable veteran team before taking control away
from them. Their broken oath is simple: neither will enter the Crown alone. Teach movement,
perspective switching, weapon handling, and the meaning of the carrot in a place that still contains
traces of safety.

**Spatial sequence:** Wayfarer cockpit, impact furrow, broken fuselage camp, basalt ascent, stormglass
bridge, observatory rotunda, Crown sighting.

**Kit use:** Wayfarer Military dominates. Civic Gothic appears only at the observatory. Crown
Incursion appears as small surgical punctures, so later infestation has room to escalate.

**Hero assets:** Split Wayfarer hull, cracked canopy with layered refraction, stormglass telescope,
observatory iris, distant Crown ring.

**Lighting:** Begin inside warm cabin practicals against cold lightning. The crash extinguishes the
warm fill. The observatory restores one amber lamp beside Mark while the Crown remains a cold
backlit silhouette. This sets the campaign rule that warm light signals chosen meaning.

**Atmosphere and surfaces:** Wind-driven ash, rain beginning as sparse needles, wet basalt, scorched
alloy, aviation fuel sheen, cracked laminated glass, torn insulation, and violet ion residue.

**Enemy silhouette pass:** Chainling Scouts have narrow shoulder plates, long sensory whiskers, and
small coral eyes. Needlewing Spotters carry a single relay fin and maintain a broad horizontal wing
shape. No heavy enemy appears before the observatory.

**Soundscape:** Cooling engine ticks, stressed hull groans, canopy rain, distant thunder delay,
instrument relays, Sable's repair tools over radio, wind through the impact trench, and Mark's close
gear movement. The first gunshot must sound startling after a quiet traversal minute.

**Score:** Present Mark's three-note horn call as open fifths on low strings, horn, and glass
harmonics. Sable's warm mechanical rhythm gives the Wayfarer motion. Combat adds one dry drum and
granular engine layer. End on the unresolved Veil semitone as the Crown turns and the oath breaks.

**Cinematic rule:** Mark is photographed at eye height or slightly low. The crash uses short 28 mm
shots attached to the cabin, then cuts to a stable 50 mm profile when he chooses to stand. Do not
frame him as a comic animal reveal.

### 02: The Root Vault

**Dramatic purpose:** Strip Mark of equipment, cut him off from Sable, force a tactile escape,
establish the Crown's prison methods, and turn the carrot from a joke into an anchor for memory.

**Spatial sequence:** Restraint chamber, processing gallery, ossuary cells, fungal cistern, aqueduct
run, gaoler bridge, vault mouth.

**Kit use:** Civic Gothic supplies vault mass. Crown Incursion replaces mortar and drainage. Vespera
Utility supplies lifts, restraints, and service routes.

**Hero assets:** Mark's restraint frame, memory extraction organ, stacked cell wall, luminous fungal
aqueduct, Root Gaoler apparatus.

**Lighting:** Low green fungal bounce and narrow amber maintenance slots. Hostile coral stays behind
membranes until the first alarm. The final vault mouth introduces the cyan rain of Vespera as a hard
vertical blade.

**Atmosphere and surfaces:** Condensation, dripping mineral teeth, spore dust, algae films, black
iron, polished restraint contact points, damp fur, and scratched tally marks.

**Enemy silhouette pass:** Chainling Gaolers add dragging chain arcs and a high restraint collar.
Needlewing Leeches fold their wings vertically in tunnels. The Root Warden is the first inverted-
triangle heavy, with a bright rear keyhole that teaches weak-point language.

**Soundscape:** Close drips, pipe resonance, fungal pops, restraint tension, chains transmitted
through stone, muffled prisoners, and low machinery below hearing focus. Reverb moves from 0.7-second
cells to a 2.4-second aqueduct tail.

**Score:** Reduce Mark's horn call to breath, bowed metal, and one detuned D. The carrot memory uses
the Home figure in a simple unprocessed instrument. A faint mechanical rhythm suggests Sable is still
searching for him. The escape restores that rhythm one layer at a time.

**Cinematic rule:** Use 50 to 85 mm lenses and occluding foreground bars until Mark recovers the
Sunlance. The first 35 mm wide shot arrives with player control in the aqueduct.

### 03: Vespera in Black

**Dramatic purpose:** Show what can still be saved. Give Vespera civilian scale, resistance presence,
and consequences before the campaign leaves the planet. Commander Ilya Rook offers Mark military
purpose while Sable presses him to keep their oath.

**Spatial sequence:** Flooded market roof, bell-tower interior, skybridge ambush, resistance relay,
neon transept, evacuation roof, Crown signal chase.

**Kit use:** Civic Gothic and Vespera Utility dominate. Crown Incursion appears as signal growth on
antennas and wounded facades, not full organic architecture.

**Hero assets:** Vespera skyline layers, working bell machinery, Rook's resistance command post,
resistance relay mast, evacuation beacon, collapsing skybridge.

**Lighting:** Cyan rain and black silhouettes form the base. Human rooms use low gold practicals.
Magenta signal contamination isolates infected routes. Lightning reveals distant threats but never
serves as the only navigation light.

**Atmosphere and surfaces:** Heavy rain, roof runoff, steam vents, wet neon, tar, copper roofs, soot,
cloth signs, shattered ceramic, and localized electrical arcing.

**Enemy silhouette pass:** Urban Chainlings carry cable tails that draw low S-curves. Needlewing
Relays add tall antenna forks and magenta target wedges. Ruin Wardens wear civic masonry as frontal
armor, leaving the rear core language intact.

**Soundscape:** Layer rain by cover state, tower bells, transformer hum, rail noise below, distant
evacuation horns, resistance radio, cloth snap, and electrical faults. Rooftop height is sold by long
pre-delay reflections and a sparse low-frequency city bed.

**Score:** The Home figure gains a human ensemble and hand percussion. Rook's clipped martial pulse
organizes the rooftop assault. Signal contamination filters both into the Choir formants during
combat. The relay activation earns the campaign's first complete statement of Mark's motif.

**Cinematic rule:** Establish routes with 35 mm lateral moves that preserve skyline orientation.
Never cut across the pursuit axis during the signal chase. Civilians stay at human eye level; Crown
views use centered high angles.

### 04: The Drowned Cathedral

**Dramatic purpose:** Convert the current mission into the campaign midpoint assault. Mark breaks the
three Veil seals, defeats the Hollow Regent, follows Nacre's newly singular voice through the stolen
names inside the collective, and knowingly enters a channel built to consume minds.

**Spatial sequence:** Drowned vestibule, reliquary nave, north seal, submerged transept, south seal,
rose portal, final seal and Regent court.

**Kit use:** The current Civic Gothic and Crown Incursion assets form the base. Add unique vestibule,
submerged transept, and Regent court sections so the level is a journey, not one circular arena.

**Hero assets:** Full-height rose portal, submerged saints, moving seal machinery, false-star garden,
Nacre's pale fragment, organ-root wall, Regent throne crown, Wayfarer signal beam.

**Lighting:** Preserve the current moon-blue key, coral seals, amber flame, and reflective floor.
Each broken seal removes one coral field and admits more cold moonlight. The Regent fight begins in
hostile coral symmetry and ends under a blue Wayfarer shaft.

**Atmosphere and surfaces:** Rain through the roof, ankle water, suspended mist, embers near wounds,
blood pools, oxidized metal, chitin varnish, wet masonry, and moving caustic breakup.

**Enemy silhouette pass:** Use the canonical Chainling, Needlewing, and Ruin Warden as the player's
recognition test. Add damage stages and cathedral reliquary attachments without changing their core
profiles. The Hollow Regent keeps its radial crown, hanging tendrils, broad wings, and bright pearl.

**Soundscape:** Long cathedral decay, water displacement, seal rotation, chain swings, roof rain,
organ wind, enemy calls reflected from height, and Wayfarer radio bleed. Combat reverb must duck
during rapid weapon transients.

**Score:** This chapter uses the current D/A drone and choir as source material. Each seal adds a
pitch and percussion layer. Nacre begins as a split choir cluster and resolves into one unprocessed
breath. Regent phase changes rotate the meter while maintaining bar-aligned transitions. Victory does
not resolve; it opens the Choir motif.

**Cinematic rule:** Use axial 35 mm views for seal reveals and a 65 mm orbit for Regent introduction.
Gameplay keeps the player-controlled shoulder or first-person view. No scripted camera steals input
during a live attack.

### 05: The Silent Orbit

**Dramatic purpose:** Expand the scale from city to planet, isolate Mark physically, and reveal the
Crown as planetary infrastructure. Rook turns the resistance weapon on the
orbital Choir captives, forcing Mark to choose rescue over military victory.

**Spatial sequence:** Orbital lift cabin, severed station ring, maintenance spoke, open debris field,
failing-gravity hub, Crown docking wound, ascent capsule.

**Kit use:** Vespera Utility and Crown Incursion dominate. Wayfarer Military supplies traversal pods
and emergency shelters. Gothic proportions survive only in the lift's structural ribs.

**Hero assets:** Planet vista, severed lift cable, rotating station ring, Rook's oath weapon, Crown
fragment, magnetic walk surface, docking iris.

**Lighting:** Use hard solar white against void black, with one blue planetary bounce. Emergency red
marks pressure-safe interiors. Crown green identifies zero-gravity threats. Exposure adaptation is
authored between airlock and exterior so the player never loses the route.

**Atmosphere and surfaces:** Interior frost, floating ice, insulation fibers, chipped white thermal
paint, carbon weave, polished handrails, micrometeor damage, and slow debris. Exterior space has no
fog.

**Enemy silhouette pass:** Chainling Clamps use four long magnetic limbs and four tucked limbs.
Needlewing Harpoons trade flapping for reaction pulses and a longer needle axis. Ballast Wardens are
wide, slow anchors that manipulate gravity. Their weak points retain established placement and shape.

**Soundscape:** Exterior action is heard through Mark's suit, weapon stock, boots, and nearby
structure. Do not add free-field explosions in vacuum. Interior fans, pumps, cable tension, relay
clicks, and hull impacts return with pressure. The mix narrows during oxygen loss.

**Score:** Remove acoustic space and most percussion outdoors. Use contact-like low strings, filtered
heart rhythm, and narrow-band radio tones. Rook's clipped pulse drives the weapon countdown while
Sable's mechanical rhythm argues against it. Gravity restoration returns the full spectral field on
a downbeat after Mark rejects Rook's order.

**Cinematic rule:** Exterior reveals use a stable 24 mm lens with slow translation. Rotating geometry
may change the horizon, but the reticle and movement frame remain stable during combat. Reduced
Motion replaces horizon rolls with cut-based orientation changes.

### 06: The Memory Forge

**Dramatic purpose:** Let Mark revisit victories and losses while teaching the player that his
memories are being assembled, measured, and corrected by an external intelligence. Nacre learns to
hold a singular voice while helping Mark test the archive's claims.

**Spatial sequence:** Archive threshold, reconstructed flight deck, impossible home field, repeating
war corridor, witness chamber, corrupted victory, forge core.

**Kit use:** Memory Matter recombines exact fragments from Chapters 1 through 5. Reuse is diegetic
and must include a visible error: wrong scale, missing back face, repeated prop, frozen rain, or
misaligned shadow. No memory room may be a clean copy of an earlier level.

**Hero assets:** Incomplete home horizon, duplicated Wayfarer cockpit, suspended battle tableau,
memory loom, identity index, forge aperture.

**Lighting:** Begin in comforting memory gold. Introduce violet errors at frame edges and reflection
disagreements. By the forge core, key lights have no fixtures and shadows point toward the Crown.

**Atmosphere and surfaces:** Warm dust, frozen rain, glass fractures, displaced decals, reversed
embers, dissolving fur impressions, untextured memory voids, and liquid mirror floors.

**Enemy silhouette pass:** Echo enemies retain their black silhouette but use incorrect material
assignments and delayed afterimages. A Memory Double copies Mark's shoulder and weapon outline
without a face. Damage removes remembered layers instead of producing gore.

**Soundscape:** Repeat earlier ambiences with one impossible property: reversed thunder, dry rain,
footsteps before contact, wrong reverb size, or dialogue with missing consonants. Every anomaly must
correspond to a visible error so it reads as authored evidence.

**Score:** Quote all earlier motifs in the wrong order. The Home figure starts consonant, then loses
its root note. Nacre's singular breath holds steady while the wider Choir predicts player actions by
one beat. At the forge core, Mark's motif plays from enemy positions instead of the music bus.

**Cinematic rule:** Match earlier shots exactly, then break one continuity rule at a time. The camera
may cross the axis only after the player sees a memory error. Reduced Motion disables afterimage
smear and uses hard dissolves.

### 07: Crown of Eidolon

**Dramatic purpose:** Deliver the military climax. Mark crosses the machine exterior, breaks the
living gate, and commits to entering the intelligence even after learning it authored his memories
and body. He chooses the lived bonds with Sable and Nacre over proof of origin.

**Spatial sequence:** Hull landing, conduit trench, stellar shield, root artillery field, crown
meridian, living gate approach, gate boss.

**Kit use:** Crown Incursion dominates at a scale ten times larger than prior use. Vespera Utility
appears as captured lift machinery embedded in the hull. Memory Matter leaks through damaged
conduits.

**Hero assets:** Curved moon horizon, kilometer crown teeth, moving conduit river, artillery roots,
meridian aperture, living gate face.

**Lighting:** Grazing stellar violet creates long readable shadows across bone-gray chitin. Conduits
use cyan flow. Hostile cores remain coral. The living gate removes the star key in phases until only
Mark's violet ability light defines his body.

**Atmosphere and surfaces:** No weather. Use cinders, coolant crystals, charged dust, vented vapor,
bone chitin, ablated metal, polished neural channels, and colossal parallax movement.

**Enemy silhouette pass:** Crown Elites use cleaner, more symmetrical versions of known forms. Add a
tall Listener support unit, a stationary Choir Node, and a shield-bearing Gate Custodian. Each new
form receives a unique negative-space profile and a non-color telegraph before combat complexity
increases.

**Soundscape:** Planetary machinery uses subharmonic pulses, conduit flow, distant impacts carried
through the hull, neural clicks, and vast pressure releases. Exterior weapon reports retain close
mechanical detail and lose long atmospheric tails.

**Score:** Full orchestra, processed choir, metal percussion, and synthesized subharmonics state
Mark's three-note horn call at its largest. Sable's mechanical rhythm and Nacre's single breath join
it without becoming subordinate accompaniment. The Crown answers in phase-locked eleven-beat cycles.
The gate boss forces all motifs into the same tempo without resolving their harmony.

**Cinematic rule:** Keep Mark small against 24 mm environmental frames, then move to 50 mm during
acts of choice. Colossal background motion stays below 12 screen pixels per frame to prevent visual
noise and motion discomfort.

### 08: The Root Choir

**Dramatic purpose:** Replace physical victory with epistemic surrender. Mark receives the Choir's
total knowledge, searches it for the origin of unicorns, finds none, realizes his identity was an
interface, and ceases to exist when no boundary remains between knower and knowledge. His sacrifice
breaks the Crown's forced collective and gives its captive minds the choice to become individuals.

**Spatial sequence:** Root threshold, billion-voice causeway, memory ocean, first-birth archive,
origin query, null horizon, convergence.

**Kit use:** Root Choir and Memory Matter dominate. Physical objects appear only when Mark needs a
conceptual handhold. Each later scene removes one familiar material family until the convergence has
no architecture in the ordinary sense.

**Hero assets:** Memory ocean, infinite choir silhouettes, first-birth constellation, origin index,
null horizon, Mark dissolution rig.

**Lighting:** Begin with bone white and black, retain Mark violet as the only saturated color, then
allow every prior chapter color to pass through the memory ocean. The origin query drains all color.
The final frame is soft white with no directional key and no surviving silhouette.

**Atmosphere and surfaces:** Liquid thought, volumetric roots, suspended memories, skinless light,
refracted text fragments, and phase-aligned motes. Do not use generic digital code rain.

**Enemy silhouette pass:** The final threats are ideas expressed through known silhouettes. A
Chainling becomes pursuit, a Warden becomes denial, and a Needlewing becomes observation. Their
material dissolves as Mark understands them. The final convergence has no boss health bar.

**Soundscape:** Begin with billions of near-field whispers rendered as a controlled statistical
texture, not literal simultaneous voices. Each knowledge scene isolates a few intelligible phrases.
At the null result, remove ambience, reverb, music, UI sweeteners, and controller rumble in that
order. Mark's final breath is dry and centered. The last beat is true digital silence before the
results screen.

**Score:** Combine every leitmotif in compatible tempo, then remove one note from Mark's three-note
call as each identity claim fails. After Mark disappears, separated Choir voices inherit the complete
call one at a time. Their choice turns the motif from ancestry into legacy. Do not score the statement
that unicorns are not real with a joke or sting.

**Cinematic rule:** The Choir uses centered, axial compositions and slow moves that appear to breathe.
Close-ups use 65 to 85 mm equivalents and preserve Mark's scars and wet fur. Dissolution is observed
without a reaction shot because no observer remains.

## Material bible

Every production material has macro shape, meso breakup, micro response, and story state. A color map
alone is not a material.

| Family              | Required response                                                 | Variation system                                     | Primary chapters   |
| ------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- | ------------------ |
| Mark fur            | Directional clumping, wetness, dirt, blood, rim separation        | Clean, rain-wet, prison-matted, frost, memory-eroded | All                |
| Mark armor          | Chipped black oxide, blued steel, exposed edge, soot, repair weld | Chapter grime decals and cumulative damage masks     | All                |
| Wayfarer alloy      | Brushed metal, heat stain, paint edge, oil, impact deformation    | Intact, crash, vacuum frost, memory duplicate        | 01, 05, 06         |
| Vespera basalt      | Cut stone, pore scale, mineral streak, waterline, worn contact    | Civic, prison, roof, submerged, memory error         | 01 to 04, 06       |
| Stormglass          | Laminated depth, scratches, droplets, internal fracture           | Clear, cracked, electrically active, memory-flat     | 01, 03, 06         |
| Fungal masonry      | Damp stone under translucent growth and spore bloom               | Green, amber, drained, alarm-reactive                | 02                 |
| Civic metal         | Black iron, tarnished copper, welds, rivets, rain response        | Resistance repair, Crown capture, submerged          | 02 to 04           |
| Hive chitin         | Ribbed plate, tissue seam, mineral pit, iridescent wear           | Juvenile, urban, cathedral, vacuum, Crown elite      | 02 to 08           |
| Tendon and membrane | Subsurface color, wet clearcoat, tension direction                | Resting, alarmed, damaged, understood                | 02 to 08           |
| Water and blood     | Depth tint, roughness shift, reflection breakup, contact edge     | Rain film, pool, current, memory mirror              | 02, 03, 04, 06, 08 |
| Orbital thermal     | White paint, carbon weave, foil, frost, radiation scorch          | Pressurized, vacuum, Crown-punctured                 | 05                 |
| Memory matter       | Stable reflection with unstable topology and delayed decay        | Recall, contradiction, null, convergence             | 06, 08             |

### Texture and shader rules

- Author hero characters and first-person weapons at 512 pixels per meter where UV area permits.
  Environment hero props target 256 pixels per meter; background kits target 128.
- Ship KTX2 or Basis Universal textures with mipmaps. Use 2K hero atlases and 1K modular atlases as
  the default. A 4K map needs a camera-distance proof and memory-budget approval.
- Pack ambient occlusion, roughness, and metalness into one texture. Keep normals linear and albedo
  in sRGB. Height maps are reserved for authored close assets.
- Add a low-frequency macro mask and a tiling detail normal to broad surfaces. Never scale one 1K
  albedo across a whole hero wall.
- Decals carry leaks, welds, impacts, signage, blood, soot, and local roughness. Limit transparent
  decal overlap to three layers at any screen pixel.
- Wetness changes base roughness and darkens porous albedo. It does not add the same clearcoat value
  to stone, fur, metal, and tissue.
- Mark's fur uses cards or shell clusters at the silhouette, a stable body material inside the
  silhouette, and simplified first-person forearm grooming. Alpha coverage must remain stable under
  SMAA and dynamic resolution.
- Hive iridescence is strongest at worn plate edges and low at wet tendon. Uniform rainbow chitin is
  prohibited.
- Memory Matter may violate physical response only when the contradiction communicates plot. It
  still needs consistent depth, motion, and accessibility cues.

## Enemy silhouette and surface program

### Readability contract

An enemy must pass three tests before material review:

1. Recognizable in flat black at 64 pixels tall within 200 milliseconds.
2. Attack class identifiable from profile, posture, and anticipation without emissive color.
3. Critical target identifiable through shape and motion with color disabled.

| Form           | Immutable silhouette                                    | Variant zones                         | Audio identity                                         |
| -------------- | ------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| Chainling      | Low eight-limb runner, long jaw, dorsal rhythm          | Collar, tail, spine, foot, side armor | Chain rattle, wet limb taps, short inhale before lunge |
| Needlewing     | Wide wing span, long forward needle, hanging tendrils   | Wing edge, relay fin, needle, abdomen | Doppler wing buzz, targeting chirp, membrane snap      |
| Ruin Warden    | Inverted triangle, heavy shoulders, bright rear keyhole | Crown, forearm, back armor, feet      | Low plate strain, three-step charge, core vent         |
| Hollow Regent  | Radial crown, four broad wings, hanging root skirt      | Crown blades, halo, pearl, wing tears | Choir cluster, rotating metal, subharmonic breath      |
| Listener       | Tall narrow biped, open head fork, long arms            | Fork, shoulder sensor, hand array     | Narrow-band scan, whispered range call                 |
| Choir Node     | Stationary vertical spine, circular negative space      | Antenna, shield petals, root anchors  | Metered pulse, relay answer from nearby units          |
| Gate Custodian | Broad shield crescent with offset weapon limb           | Shield break zones, horn, weapon edge | Stone scrape, charged shield chord, heavy impact       |

Biome variants change attachments, damage, surface contamination, and movement secondary action.
They do not move weak points or silently change an established attack. Elite variants add one large
silhouette feature and one new telegraph, not a field of small spikes.

### Chapter roster progression

| Chapter | New recognition burden                             |
| ------: | -------------------------------------------------- |
|      01 | Chainling Scout, then Needlewing Spotter           |
|      02 | Gaoler variants and first Ruin Warden              |
|      03 | Urban variants and coordinated vertical attacks    |
|      04 | Canonical mixed roster and Hollow Regent           |
|      05 | Zero-gravity variants and Ballast Warden           |
|      06 | Memory echoes and Mark Double                      |
|      07 | Listener, Choir Node, Gate Custodian, Crown elites |
|      08 | Conceptual echoes with no new mechanical burden    |

## Cinematic language

### Gameplay camera

- Third person remains an offset shoulder camera. Default target is 63 degrees, 5.25 meters from
  Mark, narrowing by 10 degrees while aiming. First person remains seven degrees wider than the
  player FOV setting and shares the same center-screen aim ray.
- Preserve Mark's horn, weapon, target, and route landmark inside a clear triangle whenever combat
  begins in third person.
- Add camera collision as a swept sphere with a soft return. Do not allow hard wall cuts, geometry
  penetration, or an instant snap to Mark's spine.
- Camera trauma stays event-based and decays quickly. Repeated automatic fire uses recoil motion in
  the weapon and shoulder before whole-camera shake.
- No level-authored camera volume may alter aim, yaw, pitch, or shoulder side during live combat.
- First-person hands and Sunlance need a separate near-field light budget and cannot receive scene
  shadow artifacts that obscure reload information.
- Reduced Motion sets trauma to zero, replaces horizon rolls with cuts, disables memory smears, and
  preserves all mechanical telegraphs.

### In-engine cinema

| Shot purpose        | Lens equivalent | Camera behavior                                                |
| ------------------- | --------------- | -------------------------------------------------------------- |
| World reveal        | 24 to 28 mm     | Slow translation, three depth planes, stable horizon           |
| Mark decision       | 50 mm           | Eye-level or slightly low, minimal drift                       |
| Intimacy or doubt   | 65 to 85 mm     | Close focus, visible scars, breath, and eye light              |
| Threat introduction | 35 to 50 mm     | Begin on consequence, reveal source, preserve screen direction |
| Crown cognition     | 32 mm axial     | Centered symmetry and slow phase-locked motion                 |

Rules:

- Interactive scenes retain 16:9 composition and HUD safe areas. Letterbox only a noninteractive
  sequence, and restore control before removing the bars.
- Skippable scenes place a checkpoint before the first frame and after the final state change.
- A cutscene never hides an enemy spawn that can damage the player when control returns.
- Match action across perspective changes. Mark's screen position, aim point, and forward vector must
  survive the cut.
- Use one hero camera move per story beat. Extra orbits make procedural geometry look smaller.
- The final revelation slows through longer shot duration, not slow-motion particles.

## Sound and music system

### Sonic pillars

1. **Body before spectacle:** hoof, breath, fur, cloth, armor, weapon action, and contact sell Mark.
2. **Structure carries scale:** impacts excite stone, hull, water, cable, or tissue with distinct
   resonances.
3. **The Crown synchronizes:** alien sounds share phase, pulse intervals, and formants as proximity
   increases.
4. **Silence has authorship:** low activity is composed, not filled with constant drones.
5. **Every threat has a sound sentence:** anticipation, release, travel, impact, and recovery.

### Bus and voice architecture

The current Music, Effects, Ambience, and Master controls remain player-facing. Internally, expand
the graph to these buses:

```text
Dialogue ───────────────┐
Weapons ─┐              │
Foley ───┼─ SFX ────────┼─ Master ─ Compressor/Limiter ─ Output
Enemies ─┤              │
World ───┘              │
Ambience ───────────────┤
Music stems ────────────┤
UI ─────────────────────┘
          └─ Early reflection and late reverb sends
```

- Preserve one `AudioContext`, gesture authorization, smooth gain automation, and graceful failure.
- High supports 48 simultaneous voices, Medium 32, and Low 20. The priority order is dialogue,
  player damage, threat telegraph, player weapon, nearby impact, enemy body, world, ambience detail.
- Limit HRTF panners to the 16 most important moving sources on High, 10 on Medium, and 6 on Low.
  Remaining sources use stereo beds or inexpensive equal-power pan.
- Update source occlusion at 10 Hz with a shared ray budget. Use low-pass and level reduction, not
  complete muting.
- Define acoustic zones with early reflection delay, late-tail duration, damping, and wet level.
  Crossfade zones over 250 milliseconds.
- Duck long reverb and score by 2 to 4 dB during dense weapon transients. Duck SFX under critical
  dialogue by no more than 5 dB.
- Final output target is approximately -16 LUFS integrated across a representative chapter capture
  with a -1 dBTP ceiling. Dialogue anchors near -18 LUFS short-term. Validate on headphones, laptop
  speakers, television, and controller-connected desktop play.

### Leitmotifs

| Motif            | Interval or rhythm                                          | Meaning                               | Development                                                                                       |
| ---------------- | ----------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Mark             | Three-note horn call built from rising open fifths: A, E, B | Agency, skill, chosen self            | Gains orchestration through Chapter 7, loses notes in Chapter 8, then passes to free Choir voices |
| Sable / Wayfarer | Warm mechanical pattern with a long-short-short answer      | Repair, trust, practical love         | Starts inside the fighter, becomes an independent human rhythm, survives Mark                     |
| Rook             | Clipped four-beat martial pulse with a hard rest            | Duty hardened by grief                | Organizes the resistance, loses swing, then fractures during the oath weapon choice               |
| Nacre            | Choir cluster splitting into one audible breath             | A collective mind learning to say “I” | Moves from spatial texture to centered singular voice, then joins other free voices               |
| Home / carrot    | G, D, A, D with a human three-beat pickup                   | Chosen memory and absurd tenderness   | Starts acoustic, becomes suspect in Chapter 6, remains emotionally true                           |
| Veil             | D to E-flat semitone over a low D                           | Boundary, pressure, intrusion         | Moves from distant texture to harmonic control                                                    |
| Root Choir       | Phase-locked D, A, E voices with 740 and 1150 Hz formants   | Collective intelligence               | Gains clarity and semantic rhythm as Mark approaches                                              |
| Crown            | Eleven-pulse cycle grouped 3, 3, 3, 2                       | Machine intent                        | Moves from ambience into percussion and boss timing                                               |
| Null             | Mark motif without its root                                 | Missing origin                        | Appears only after the Memory Forge begins questioning home                                       |

### Adaptive music states

The current scalar intensity remains useful but is insufficient for a campaign. Use explicit state
plus continuous threat parameters.

| State      | Entry condition                 | Layers                                                | Exit rule                            |
| ---------- | ------------------------------- | ----------------------------------------------------- | ------------------------------------ |
| Stillness  | Safe traversal for 12 seconds   | Air, location tone, sparse motif fragment             | Quantized fade at first suspicion    |
| Explore    | Traversal with objective active | Pulse-free harmonic bed and chapter instrument        | One-bar transition                   |
| Suspicion  | Threat sensed, no attack        | Filtered ostinato and telegraph pulse                 | Immediate release into combat pickup |
| Combat A   | Standard wave                   | Rhythm, bass, one motif stem                          | Two-bar sustain after last threat    |
| Combat B   | High pressure or elite          | Added percussion, dissonant choir, faster subdivision | Drop one layer at pressure threshold |
| Boss       | Authored phase                  | Dedicated phase stems and transition stingers         | Phase transition marker only         |
| Aftermath  | Encounter clear                 | Resonance tail and narrative motif                    | Resolve on objective interaction     |
| Revelation | Scripted knowledge state        | Voice, memory stems, controlled subtraction           | Timeline cue, never threat scalar    |

Music transitions are bar-quantized except player death, hard narrative rupture, and the Chapter 8
null result. Schedule 200 milliseconds ahead through Web Audio. Each chapter requires six seamless
stems, two transition pickups, one failure cadence, one checkpoint cadence, and one authored boss or
set-piece cue.

### Instrument and processing arc

| Chapter | Acoustic color                                 | Electronic or processed color                                |
| ------: | ---------------------------------------------- | ------------------------------------------------------------ |
|      01 | Low strings, restrained horn, struck glass     | Engine granulation and storm subharmonics                    |
|      02 | Bowed metal, breath, frame drum                | Pipe resonance and detuned prison oscillators                |
|      03 | Human ensemble, hand percussion, bell metal    | Radio sidebands and neon transformer rhythm                  |
|      04 | Low choir, organ wind, bass drum               | Seal pulses and water-filtered synthesis                     |
|      05 | Contact strings and heartbeat                  | Narrow-band telemetry and vacuum-muted transients            |
|      06 | Solo memory instruments and damaged tape color | Reversed envelopes, misplaced convolution, predictive echoes |
|      07 | Full ensemble, metal battery, massed choir     | Conduit bass and eleven-pulse machine grid                   |
|      08 | Solo breath, then collective voice             | Spectral convergence followed by complete subtraction        |

### Level ambience and signature SFX

| Chapter | Base ambience                           | Foreground details                        | Signature event                              |
| ------: | --------------------------------------- | ----------------------------------------- | -------------------------------------------- |
|      01 | Storm basin wind and cooling hull       | Canopy drops, ash, relay clicks           | Wayfarer crash and observatory rotation      |
|      02 | Subterranean water and prison machinery | Spores, chain tension, cell voices        | Restraint break and aqueduct surge           |
|      03 | Roof rain and distant city systems      | Bells, signs, radio, cloth                | Relay ignition and skybridge collapse        |
|      04 | Cathedral rain, water, organ pressure   | Chains, seal motors, roof debris          | Three seal breaks and Regent crown opening   |
|      05 | Suit bed and structure transmission     | Frost, pumps, cable strain                | Gravity failure and orbital lift severance   |
|      06 | Recalled ambience with authored errors  | Premature steps, dry rain, wrong tails    | Memory loop fracture and origin index reveal |
|      07 | Planetary machine and conduit flow      | Cinders, neural clicks, hull impacts      | Living gate opening                          |
|      08 | Statistical voices and memory ocean     | Isolated names, root movement, dry breath | Origin query null and final silence          |

### Weapon, creature, and traversal recording plan

- **Sunlance:** record bolt, receiver, spring, belt, casing, grip, and shoulder contact separately.
  Layer a short mechanical transient, low body, crystalline energy, environment tail, and distant
  report. First person receives more mechanism; third person receives more body and environment.
- **Hooves:** record hard stone, wet stone, metal, glass, chitin, shallow water, and memory matter at
  walk, run, stop, turn, land, and dash recovery. Add armor and cloth as independent randomized layers.
- **Mark:** capture breath effort, damage, cold, focus, exertion, and recovery without constant vocal
  chatter. Performance is tired, dry, and competent.
- **Chainling:** combine joint clicks, short chain, wet leather, insect scrape, and mammal breath.
- **Needlewing:** combine membrane snap, servo whine, air cut, and target chirp. Vacuum variants route
  motion through structure and telemetry.
- **Ruin Warden:** combine stone drag, plate strain, low animal mass, and pressure vent.
- **Choir:** build from a small cast with controlled vowel sets, breaths, consonants, and whispers.
  Granulation extends scale. It does not replace intelligible final writing.

All imported recordings require documented provenance, edit ownership, and release terms. Runtime
synthesis remains available as a deterministic fallback and for signals that benefit from exact
pitch or timing.

### Dialogue and captions

- Mark's delivery is concise, observant, and emotionally guarded. Avoid quips during civilian loss,
  memory violation, or the final revelation.
- Sable speaks with practical warmth and does not exist only to explain Mark. Her mechanical work,
  tactical judgment, anger, and silence carry scenes before dialogue summarizes them.
- Rook speaks in short operational units. Grief narrows his language as he moves from commander to
  tragic antagonist. His performance remains human and specific, never theatrical villainy.
- Nacre begins as layered first-person plural, then isolates one breath and one singular pronoun.
  Spatial placement moves from surrounding Mark to one stable position as selfhood develops.
- Resistance radio is practical and interrupted by action, never a lore lecture during combat.
- The Root Choir begins as pattern and becomes grammar. Its final statements are calm because total
  knowledge has no need to threaten.
- Caption every meaningful off-screen threat, machinery state, creature call, radio line, and
  objective sound. Use source labels and directional arrows when the source is not visible.
- Captions describe useful sound, not waveform poetry. Example: `[CHAINLING SCRAPES ALONG LEFT WALL]`.
- Dialogue, captions, animation, and objective progression share authored cue IDs so a skipped scene
  cannot leave stale audio or text.

### Haptic composition

Retain semantic haptic events and capability-gated dual rumble. Add surface, gravity, and narrative
channels without turning ambience into constant vibration.

- Recoil uses a short weak-motor snap with minimal strong motor.
- Heavy enemy telegraphs begin with a low strong-motor swell before impact.
- Rain, wind, choir beds, and music do not vibrate continuously.
- Zero-gravity contact uses isolated pulses only when Mark touches structure.
- The Chapter 8 convergence removes haptics before removing sound. The absence is part of the story.
- Reduced Flashes and Reduced Motion do not disable essential haptic telegraphs. The Haptics setting
  always does.

## WebGL and streaming budgets

### Frame targets

| Tier   | Resolution target     | Gameplay target |                   Submitted triangles | Draw calls in mixed combat |
| ------ | --------------------- | --------------- | ------------------------------------: | -------------------------: |
| High   | 1440p class, adaptive | 60 FPS, 16.7 ms | 1.1 million typical, 1.4 million peak |      450 typical, 650 peak |
| Medium | 1080p class, adaptive | 60 FPS, 16.7 ms |     800,000 typical, 1.0 million peak |      350 typical, 500 peak |
| Low    | 720p to 900p class    | 30 FPS, 33.3 ms |         450,000 typical, 650,000 peak |      250 typical, 350 peak |

High's frame budget is 5.5 ms simulation and submission, 10.2 ms GPU, and 1 ms contingency on the
target desktop. A chapter that reaches only the current 37 FPS baseline has not passed content lock.

### Live resource budgets

| Resource                              |            High |          Medium |             Low |
| ------------------------------------- | --------------: | --------------: | --------------: |
| GPU textures                          |          320 MB |          192 MB |          112 MB |
| GPU geometry                          |          180 MB |          112 MB |           72 MB |
| Active skinned or articulated enemies |              18 |              14 |              10 |
| Pooled combat particles               |             800 |             480 |             240 |
| Camera-relevant point lights          |               7 |               6 |               4 |
| Shadow maps                           | One 2048 square | One 1024 square | None by default |
| HRTF sources                          |              16 |              10 |               6 |
| Total audio voices                    |              48 |              32 |              20 |

Measure budgets at first entry and after a five-minute combat soak. Track geometries, textures,
programs, sources, panners, and detached scene roots through diagnostics.

### Network budgets

- Title and shell become interactive within 4 MB compressed on a normal repeatable test route.
- Shared Mark, weapon, UI, and common enemy package stays below 18 MB compressed.
- A chapter reaches playable state after at most 25 MB of chapter-specific compressed data.
- Remaining chapter detail may stream to a 45 MB chapter total. The next chapter prefetch is capped
  at 30 MB and yields immediately to active gameplay traffic.
- Chapter audio targets 8 to 12 MB in 48 kHz Opus, with loop points and stems tested gaplessly.
- Load one current chapter, one shared package, and one small next-chapter prefetch. Dispose two
  chapters back after checkpoint confirmation.
- Use content hashes, immutable caching, retryable chunks, and an offline-safe failure screen that
  preserves the last checkpoint.

### Geometry and shader rules

- Batch static kit meshes by material and streaming cell. Never merge an entire chapter into one
  culling volume.
- Instance rubble, fasteners, chain links, roots, cilia, cartridges, and repeating lamps.
- Build High, Medium, and Low LODs for hero props and enemies. LOD transitions use hysteresis and may
  not change an enemy's telegraph silhouette.
- Limit transparent full-screen layers. Water, membrane, fog, particles, and UI must be profiled
  together for overdraw.
- Active gameplay remains hybrid raster. Screen-space reflections are labeled accurately and may
  degrade first. Frozen path tracing remains a presentation enhancement, not a combat dependency.
- The path-traced snapshot keeps the current 450,000-triangle trace budget and excludes particles,
  distant cyclorama, micro-rubble, and hanging-chain detail.
- Compile likely shader variants during chapter load. A first-use hitch during an encounter fails
  performance acceptance.
- Use meshopt or equivalent geometry compression and KTX2 texture transcode with a tested fallback.

## Concrete production tasks

### Foundation sprint

1. Define `ChapterDefinition`, `SceneCellDefinition`, `BiomeProfile`, `LightingProfile`,
   `AcousticZone`, `MusicState`, and stable checkpoint IDs as data contracts.
2. Split arena creation into reusable structural kit, chapter dressing, lighting, atmosphere,
   encounters, and disposal stages.
3. Add streaming cells with explicit load, activate, deactivate, and dispose ownership.
4. Add KTX2 texture loading, mesh compression, shader warmup, asset manifests, and per-chapter size
   reports.
5. Expand AudioDirector from scalar intensity to authored state, stems, acoustic zones, voice
   priority, occlusion, and cue IDs while preserving current settings and fallbacks.
6. Add cumulative Mark material state for wetness, soot, frost, blood, armor damage, and memory loss.
7. Add a camera collision solver and in-engine cinematic timeline that never owns combat input.
8. Add diagnostics for CPU frame time, GPU timer query where supported, streaming memory, audio voice
   count, panner count, shader stalls, and chapter transitions.

### Visual vertical slice

Build Chapters 1 and 4 first. They prove the widest contrast between open crash landscape and dense
flooded cathedral while reusing Mark, enemies, Wayfarer, storm, civic, and Crown kits.

Acceptance:

- Both chapters are identifiable from a flat grayscale screenshot with effects disabled.
- No hero material shows obvious texture repetition at normal gameplay distance.
- Mark's fur, armor, horn, and weapon remain separated under each chapter's darkest combat lighting.
- Each chapter contains one vista, one intimate room, one traversal set piece, one mixed encounter,
  one cinematic transition, and one quiet aftermath.
- High reaches 60 FPS on the target GPU during the heaviest authored encounter or provides a proven
  visual-equivalent optimization plan before content duplication begins.

### Campaign content waves

1. **Wave A:** Chapters 2 and 3. Complete planetary context, prison logic, resistance language, and
   rain-heavy material library.
2. **Wave B:** Chapters 5 and 7. Complete orbital materials, large-scale Crown exterior, gravity
   readability, and elite silhouette program.
3. **Wave C:** Chapters 6 and 8. Complete memory-state system, authored continuity errors, Root Choir
   visual abstraction, motif subtraction, and final silence.

Each wave exits only after art, lighting, camera, audio, narrative, encounter, accessibility,
performance, and checkpoint owners sign the same playable build.

### Audio production passes

1. Record and edit Mark Foley, Sunlance mechanisms, seven surface footstep sets, and core enemy
   movement before composing final combat cues.
2. Build one dry close layer and one environment-send layer for every critical action.
3. Compose leitmotif sketches and secure narrative approval before full orchestration.
4. Implement Chapter 1 adaptive stems as the music-system proof. Test rapid state reversals,
   pause/resume, tab suspension, device change, and save reload.
5. Produce ambience by acoustic zone, then test a complete chapter with music muted.
6. Produce score stems, transitions, stingers, and chapter endings, then test with effects at full
   density.
7. Complete dialogue edit, captions, localization handles, mix automation, and loudness compliance.
8. Run headphone, laptop, television, mono, low-volume, and no-haptics acceptance passes.

### Cinematic production passes

1. Storyboard every chapter reveal, reversal, boss entrance, aftermath, and transition to the next
   chapter.
2. Previsualize with final gameplay collision and navigation metrics.
3. Lock screen direction, lens, camera height, duration, player-control boundary, skip point, and
   checkpoint for every shot.
4. Animate Mark's eyes, breath, ears, hands, mane, armor, and weapon before adding camera movement.
5. Add lighting and VFX after performance capture and body mechanics read without them.
6. Validate first-person entry and exit, subtitle safe area, reduced motion, reduced flashes, and
   ultra-wide crop.

## Acceptance gates

### Chapter art gate

- Seven objectives or fewer, each with a unique landmark and route silhouette.
- Four distance bands remain readable: player, threat, route, world.
- At least 30 percent of visible material area receives chapter-specific meso or story variation.
- No more than three major material families compete in one combat frame.
- Every hero room has intact, event, and aftermath states.
- Color-blind grayscale review preserves threats, weak points, and objectives.

### Audio gate

- Every damaging attack has audible anticipation, release, and impact.
- Dialogue remains intelligible during the heaviest legal combat mix without destroying weapon weight.
- Loop boundaries, stem transitions, tab suspension, device changes, and pause resume are click-free.
- Captions identify critical off-screen sound and remain synchronized after skip or checkpoint load.
- The chapter remains navigable with music muted and emotionally coherent with captions disabled.

### Performance gate

- Ten-minute soak stays inside live memory and voice budgets without monotonic growth.
- Five checkpoint reloads and three chapter transitions leave no detached GPU or audio resources.
- High, Medium, and Low each preserve the chapter's key light direction, enemy silhouette, objective
  practical, and signature atmosphere.
- Adaptive degradation does not oscillate, compile shaders during combat, or alter gameplay timing.
- Production preview E2E covers fresh start, checkpoint continue, death reload, perspective switch,
  gamepad path, pause, settings persistence, chapter transition, final convergence, and replay.

## Final creative test

Play the campaign with UI disabled and music muted. The world must still show where Mark is, who built
the place, what the Crown changed, where danger comes from, and how close he is to losing himself.

Then play with the image hidden. Sound must still identify Mark's body, room size, surface, threat
class, attack timing, objective state, and narrative pressure.

When both passes work, picture and sound may reinforce each other. They must never hide the same
missing information.
