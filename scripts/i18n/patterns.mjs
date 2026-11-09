// Traducciones por patrón para las frases repetitivas de la guía de TenSquare3.
// translateLine devuelve el texto traducido o null si ningún patrón aplica.

const WEEKDAYS = { Monday: 'Lunes', Tuesday: 'Martes', Wednesday: 'Miércoles', Thursday: 'Jueves', Friday: 'Viernes', Saturday: 'Sábado', Sunday: 'Domingo' };
export const translateWeekday = (w) => WEEKDAYS[w] ?? w;

const LABELS = {
  'Morning': 'Mañana', 'Early Morning': 'Temprano', 'After School': 'Después de clase', 'Afternoon': 'Tarde',
  'Evening': 'Noche', 'Daytime': 'Día', 'Dark Hour': 'Hora Oscura', 'Lunchtime': 'Almuerzo', 'Lunch Time': 'Almuerzo',
  'Social Stats': 'Stats sociales', 'Good Ending': 'Final bueno', 'Bad Ending': 'Final malo',
  "Elizabeth’s Request": 'Encargo de Elizabeth', "Elizabeth's Request": 'Encargo de Elizabeth', 'DLC Personas': 'Personas DLC', 'General': 'General',
};
export const translateLabel = (l) => LABELS[l.replace(/:$/, '').trim()] ?? l;

const STAT = { Academics: 'Académicos', Charm: 'Encanto', Courage: 'Valentía' };
const stat = (s) => STAT[s] ?? s;

/** Traduce "(Charm +1)", "(Academics + 2)", "(Charm, Courage +1 and 3,000 yen)" etc. dentro de un texto */
export function translateInline(t) {
  return t
    .replace(/\bRequires (Academics|Charm|Courage) (?:Rank|Level) (\d+)/gi, (_, a, n) => `Requiere ${stat(a)} Rango ${n}`)
    .replace(/\b(Academics|Charm|Courage) Rank (\d+) Required\b/g, (_, a, n) => `requiere ${stat(a)} Rango ${n}`)
    .replace(/\b(Academics|Charm|Courage),\s*(Academics|Charm|Courage)\s*\+\s*(\d+)/g, (_, a, b, n) => `${stat(a)} y ${stat(b)} +${n}`)
    .replace(/\b(Academics|Charm|Courage)\s*\+\s*(\d+)/g, (_, a, n) => `${stat(a)} +${n}`)
    .replace(/\b(Academics|Charm|Courage) Rank (\d+)/g, (_, a, n) => `${stat(a)} Rango ${n}`)
    .replace(/\+(\d+) and ([\d,.]+) yen\b/g, (_, n, y) => `+${n}, ${y.replace(/,/g, '.')} yen`)
    .replace(/\b([A-Z][a-z]+(?: Man)?) Rank (\d+)/g, '$1 Rango $2')
    .replace(/\b([A-Z][a-z]+) Rank MAX\b/gi, '$1 Rango MAX')
    .replace(/\(([A-Z][a-z]+) Linked Episode (\d+)\)/g, '(Episodio de $1 $2)')
    .replace(/\(Social Link \+(\d+)\)/g, '(Vínculo +$1)')
    .replace(/\b([A-Z][a-z]+) Flag\b/g, 'flag $1')
    .replace(/\band ([\d,.]+) yen\b/g, (_, n) => `y ${n.replace(/,/g, '.')} yen`)
    .replace(/\b([\d]{1,3}(?:,\d{3})+) [Yy]en\b/g, (_, n) => `${n.replace(/,/g, '.')} yen`)
    .replace(/\(Stats of equipped Persona raised by (\d+)\)/g, '(Stats de la Persona equipada +$1)')
    .replace(/Achievement\/Trophy:/g, 'Logro/Trofeo:');
}

const P = [];
const add = (re, fn) => P.push([re, fn]);
const T = (s) => translateInline(s);
let TR = () => null; // traducción por diccionario (la inyecta el generador con setDictionary)
export const setDictionary = (fn) => { TR = fn; };

// ---- respuestas / misceláneas cortas
add(/^Any\.?$/, () => 'Cualquiera');
add(/^Either\.?$/, () => 'Cualquiera.');
add(/^Story [Ee]vent\.?(.*)$/, (_, r) => 'Evento de historia' + T(r));
add(/^Automatic (?:answer|question)\.?$/i, () => 'Respuesta automática');
add(/^Bonus Story Event\.?$/i, () => 'Evento de historia extra.');
add(/^Free Evening\.?$/, () => 'Noche libre.');
add(/^Free Day\.?$/, () => 'Día libre.');
add(/^Boss fight\.?$/, () => 'Pelea contra el jefe.');
add(/^Vending machines refill today\.?$/, () => 'Hoy se recargan las máquinas expendedoras.');
add(/^Work Experience\.?$/, () => 'Pasantía laboral.');
add(/^Track and Field training\.?$/, () => 'Entrenamiento de atletismo.');
add(/^(\((?:[^()]*\b(?:Rank|Linked Episode|Social Link|Academics|Charm|Courage|Flag|Stats of equipped)\b[^()]*)\)(?: \([^()]*\))*)$/, (_, r) => T(r));
add(/^\(For [Hh]aving (.+) in the [Cc]ompendium\)$/, (_, r) => `(por tener ${r.replace(/ and /g, ' y ')} en el compendio)`);
add(/^\(Requires having (.+) in the compendium\)$/, (_, r) => `(requiere tener ${r.replace(/ and /g, ' y ')} en el compendio)`);
add(/^Achievement\/Trophy: (.*)$/, (_, r) => `🏆 Logro/Trofeo: ${r}`);
add(/^Exam Results?: Top of the [Cc]lass (.*)$/, (_, r) => `Resultado del examen: primero de la clase ${T(r)}`);

// ---- social links
add(/^Spend [Tt]ime with ([^,.(]+?) at the ([^,.(]+?) (\(.*\))\.?$/, (_, n, w, r) => `Pasá tiempo con ${n} en ${w} ${T(r)}`);
add(/^(?:Spend [Tt]ime|Spend|Hang out) with ([^,.(]+?)\.?$/, (_, n) => `Pasá tiempo con ${n}`);
add(/^Have coffee with (\w+)\.?$/, (_, n) => `Tomá un café con ${n}.`);
add(/^(\d+x .+?) \(Equip on (\w+)\)$/, (_, i, n) => `${i} (equipáselo a ${n})`);
add(/^Spend time with ([^,(]+?), then hand in quests? ([\d ,and]+)\.?$/, (_, n, q) => `Pasá tiempo con ${n} y entregá el encargo ${q.replace(/ and /g, ' y ')}`);
add(/^Spend time with ([^,(]+?) (\(.*\))\.?$/, (_, n, r) => `Pasá tiempo con ${n} ${T(r)}`);
add(/^Spend time at Bookworms\.?$/, () => 'Pasá tiempo en Bookworms');
add(/^Head to the Student Council Room\.?$/, () => 'Andá a la sala del Consejo Estudiantil');
add(/^Play Innocent Sin Online\.?$/, () => 'Jugá Innocent Sin Online');
add(/^Take Koromaru for a walk(.*)$/, (_, r) => 'Sacá a pasear a Koromaru' + T(r).replace(/\(He's on the (\d)F\)/, '(está en el $1F)'));
add(/^Hand in quests? ([\d ,and]+) to Elizabeth\.?$/, (_, q) => `Entregá ${/and|,/.test(q) ? 'los encargos' : 'el encargo'} ${q.replace(/ and /g, ' y ')} a Elizabeth.`);
add(/^Sell your loot and (?:collect|pick up) your rewards\.?$/, () => 'Vendé el botín y cobrá las recompensas.');

// ---- stats
add(/^Stay [Aa]wake (\(.*\))\.?$/, (_, r) => `Quedate despierto en clase ${T(r)}`);
add(/^Work at Chagall Cafe (\(.*\))\.?$/, (_, r) => `Trabajá en Chagall Café ${T(r)}`);
add(/^Work at Be Blue V (\(.*\))\.?$/, (_, r) => `Trabajá en Be Blue V ${T(r)}`);
add(/^Work at Screen Shot (\(.*\))\.?$/, (_, r) => `Trabajá en Screen Shot ${T(r)}`);
add(/^Work at Paulownia Mall's Be Blue V (\(.*\))\.?$/, (_, r) => `Trabajá en Be Blue V ${T(r)}`);
add(/^Head to the Faculty Office (\(.*\))\.?$/, (_, r) => `Andá a la sala de profesores ${T(r)}`);
add(/^Summer School (\(.*\))\.?$/, (_, r) => `Escuela de verano ${T(r)}`);
add(/^Study (?:in|at) (?:the )?[Ll]ibrary(?: on the 1F)? (\(.*\))\.?$/, (_, r) => `Estudiá en la biblioteca ${T(r)}`);
add(/^Study in (?:you|your) room (\(.*\))\.?$/, (_, r) => `Estudiá en tu cuarto ${T(r)}`);
add(/^Study with everyone (\(.*\))\.?$/, (_, r) => `Estudiá con todos ${T(r)}`);
add(/^Study at Wild Duck Burger (\(.*\))\.?$/, (_, r) => `Estudiá en Wilduck Burger ${T(r)}`);
add(/^Study at Wilduck (\(.*\))\.?$/, (_, r) => `Estudiá en Wilduck ${T(r)}`);
add(/^Study at Chagall Cafe (\(.*\))\.?$/, (_, r) => `Estudiá en Chagall Café ${T(r)}`);
add(/^Drink coffee at Chagall Cafe (\(.*\))\.?$/, (_, r) => `Tomá un café en Chagall Café ${T(r)}`);
add(/^Sing (solo )?karaoke at Mandragora(?: in Paulownia Mall)? (\(.*\))\.?$/, (_, s, r) => `Cantá karaoke ${s ? 'solo ' : ''}en Mandragora ${T(r)}`);
add(/^Eat (?:the |a |an )?(.+?) at (.+?) (\(.*\))\.?$/, (_, f, w, r) => `Comé ${f} en ${w} ${T(r)}`);
add(/^Play (.+?) at (?:the )?Game Parade (\(.*\))\.?$/, (_, g, r) => `Jugá ${g} en Game Parade ${T(r)}`);
add(/^Play (.+?) on the (?:shared )?(?:computer|PC) (\(.*\))\.?$/i, (_, g, r) => `Compu compartida → ${g} ${T(r)}`);
add(/^Use the (?:shared )?(?:computer|PC)(?: to (?:play|use|read))? (.+?) (\(.*\))\.?$/i, (_, g, r) => `Compu compartida → ${g} ${T(r)}`);
add(/^Watch a DVD with (\w+) (\(.*\))\.?$/, (_, n, r) => `Mirá un DVD con ${n} ${T(r)}`);
add(/^Watch a DVD (\(.*\))\.?$/, (_, r) => `Mirá un DVD ${T(r)}`);
add(/^Watch (.+?) (\(.*\))\.?$/, (_, n, r) => `Mirá ${n} ${T(r)}`);
add(/^Read with (\w+) (\(.*\))\.?$/, (_, n, r) => `Leé con ${n} ${T(r)}`);
add(/^Read (.+?) (\(.*\))\.?$/, (_, n, r) => `Leé ${n} ${T(r)}`);
add(/^Have tea with Mitsuru\.?(.*)$/, (_, r) => `Tomá el té con Mitsuru${T(r)}`);
add(/^Cook with Shinjiro\.?(.*)$/, (_, r) => `Cociná con Shinjiro${T(r)}`);
add(/^Tend to the garden with Shinjiro\.?(.*)$/, (_, r) => `Cuidá la huerta con Shinjiro${T(r)}`);
add(/^Head to the Nurse’s Office \(Supplemental Lesson (\d+) of (\d+)\)\.?$/, (_, a, b) => `Andá a la enfermería (clase suplementaria ${a} de ${b})`);
add(/^Head to the Nurse’s Office and drink the strange medicine (\(.*\))\.?$/, (_, r) => `Andá a la enfermería y tomá la medicina rara ${T(r)}`);
add(/^Take (?:a )?bath at Naganaki Shrine (\(.*\))\.?$/, (_, r) => `Bañate en el santuario Naganaki ${T(r)}`);
add(/^Take the Bath at (?:the )?(.+?) (\(.*\))\.?$/, (_, w, r) => `Bañate en ${w} ${T(r)}`);
add(/^Go to (?:the )?(.+?) (\(.*\))\.?$/, (_, w, r) => `Andá a ${w} ${T(r)}`);

// ---- dorm / items
add(/^Check the fridge (\(.*\))\.?$/, (_, r) => `Revisá la heladera ${r}`);
add(/^Check the fridge\.?$/, () => 'Revisá la heladera');
add(/^Put the (.+?) in the fridge\.?$/, (_, n) => `Guardá ${n} en la heladera.`);
add(/^(?:Grab|Buy) (?:a |an |\d+x )?(.+?) from the School Store\.?$/, (_, n) => `Comprá ${n} en la tienda del colegio.`);
add(/^Harvest the Rooftop Garden(?: \((.*?)\))?,? then plant (.+?)\.?$/, (_, h, p) => `Cosechá la huerta de la terraza${h ? ` (${h})` : ''} y plantá ${p}.`);
add(/^Harvest the Rooftop Garden(?: \((.*?)\))?\.?$/, (_, h) => `Cosechá la huerta de la terraza${h ? ` (${h})` : ''}.`);
add(/^Plant (?:a )?(.+?) in the Rooftop Garden\.?$/, (_, p) => `Plantá ${p} en la huerta de la terraza.`);
add(/^Check the [Cc]ommand [Cc]onsole for a new video\.?$/, () => 'Revisá la consola de comandos: hay un video nuevo.');
add(/^Speak to Fuuka and head to Tartarus\.?$/, () => 'Hablá con Fuuka y andá a Tartarus.');
add(/^Shopping Channel: (.+?) for ([\d,]+) [Yy]en\. \*?\*?(Buy|Skip)!?\*?\*?(.*)$/, (_, s, p, a, r) => `Canal de compras: ${s} por ${p.replace(/,/g, '.')} yen. ${a === 'Buy' ? '**¡Comprar!**' : 'Saltear.'}${r.trim() ? ' ' + (TR(r.trim()) ?? r.trim()) : ''}`);
add(/^Elizabeth’s quests update today, accept:?$/, () => 'Hoy se actualizan los encargos de Elizabeth. Aceptá:');
add(/^Elizabeth's quests update today, accept:?$/, () => 'Hoy se actualizan los encargos de Elizabeth. Aceptá:');
add(/^Quest (\d+) - (.*)$/, (_, n, r) => `Encargo ${n} - ${r}`);

// ---- passthrough: respuestas de diálogo, nombres de ítems, recetas, encargos
add(/^Answer: (.*)$/, (_, r) => `Respuesta: **${T(r).replace(/ \((Encanto|Académicos|Valentía) \+(\d)\)$/, '** ($1 +$2)').replace(/\*\*$/, '') }${/\)$/.test(T(r)) ? '' : '**'}`);
add(/^["“]?(.+?)["”]? \(\+(\d)\)$/, (_, a, n) => `“${a}” (+${n})`);
add(/^(.+?) and (.+?) \/ Result: (.+)$/, (_, a, b, c) => `${a} + ${b} → **${c}**`);
add(/^Result: (.+)$/, (_, c) => `Resultado: **${c}**`);
add(/^Fuse (.+?) \/ from the Special Fusion$/, (_, a) => `Fusioná ${a} (fusión especial)`);
add(/^\*\*Fusion Recipe\*\*$/, () => '**Receta de fusión**');
add(/^\*\*Skills to Pass [Oo]n\*\*$/, () => '**Habilidades a heredar**');
add(/^([1-9]\d*)\\?[.:]\s*((?:(?!\b(?:you|your|we|then|if)\b).){3,60})$/, (_, n, q) => `${n}. ${q}`);
add(/^Accept (\w+)['’]s invit(?:e|ation)\.?$/, (_, n) => `Aceptá la invitación de ${n}`);
add(/^Automatic question\.?$/, () => 'Pregunta automática');
add(/^(\d+)x (.+)$/, (_, n, i) => `${n}x ${i}`);
add(/^Invite (\w+) to the movies (\(.*\))\.?$/, (_, n, r) => `Invitá a ${n} al cine ${T(r)}`);
add(/^Tend (?:to )?the garden with (\w+)\.?(.*)$/, (_, n, r) => `Cuidá la huerta con ${n}${T(r)}`);
add(/^Cook with (\w+)\.?(.*)$/, (_, n, r) => `Cociná con ${n}${T(r)}`);
add(/^Study with (\w+) and (\w+) (\(.*\))\.?$/, (_, a, b, r) => `Estudiá con ${a} y ${b} ${T(r)}`);
add(/^Characteristics Unlocked: (.+)$/, (_, c) => `Característica desbloqueada: ${c}`);
add(/^Doesn'?t max out its skill(?:s| list)\.?$|^Doesn't max out skill list\.?$/, () => 'No llena su lista de habilidades');
add(/^Feed the cat\.?$/, () => 'Dale de comer al gato.');
add(/^Feed the cat, then hand in quest (\d+) to Elizabeth\.?$/, (_, q) => `Dale de comer al gato y entregá el encargo ${q} a Elizabeth.`);
add(/^Use (.+? Note) on the [Ss]hared [Cc]omputer\.?$/, (_, n) => `Usá ${n} en la compu compartida.`);
add(/^Talk [Tt]o Fuuka to head to Tartarus\.?$/, () => 'Hablá con Fuuka para ir a Tartarus.');
add(/^Vending machines have been refilled\.?$/, () => 'Se recargaron las máquinas expendedoras.');
add(/^Elizabeth’s [Qq]uests updates? today\.?$/, () => 'Hoy se actualizan los encargos de Elizabeth.');
add(/^Elizabeth’s Quests update today, accept:?$/, () => 'Hoy se actualizan los encargos de Elizabeth. Aceptá:');
add(/^Return to Elizabeth and hand in quests? ([\d ,and]+)\.?$/, (_, q) => `Volvé con Elizabeth y entregá ${/and|,/.test(q) ? 'los encargos' : 'el encargo'} ${q.replace(/ and /g, ' y ')}.`);
add(/^Hand in quest (\d+) to Elizabeth, which unlocks:?$/, (_, q) => `Entregá el encargo ${q} a Elizabeth, eso desbloquea:`);
add(/^This unlocks:?$/, () => 'Esto desbloquea:');
add(/^You'll need:?$/, () => 'Vas a necesitar:');
add(/^Speak to (\w+) to [Rr]eceive:?$/, (_, n) => `Hablá con ${n} para recibir:`);
add(/^\*\*(Weapon|Armor|Armour|Footwear|Accessory|Skills to Keep)\*\*$/, (_, w) => `**${{ Weapon: 'Arma', Armor: 'Armadura', Armour: 'Armadura', Footwear: 'Calzado', Accessory: 'Accesorio', 'Skills to Keep': 'Habilidades a conservar' }[w]}**`);
add(/^\*\*([A-Z][a-z]+)\*\*$/, (s) => s);
add(/^([\w'’\- ]+): ([\w'’\- ]+)$/, (s) => s); // "Upbeat Man: Oolong Tea"
add(/^[\w'’\- ]+(?:, [\w'’\- ]+)*,? \/ [\w'’\- ]+(?:(?:,| and) [\w'’\- ]+)*$/, (s) => s.replace(/ and /g, ' y '));
add(/^Automatically get sent to the dorm\.?$/, () => 'Te mandan automáticamente al dormitorio.');
add(/^New dorm activities unlock\.?$/, () => 'Se desbloquean nuevas actividades en el dormitorio.');
// listas de habilidades / nombres sueltos (sin verbos): 1-4 palabras o separados por comas y barras
add(/^(?!.*\b(?:to|the|with|at|of|your|in|on|for|you|it|is|out|up|her|him|go|look|that|that's|me|my)\b)[A-Z][\w'’\-]*(?: [A-Za-z0-9][\w'’\-]*){0,3}$/, (s) => s);
add(/^[A-Z][\w'’\- ]+(?:,\s*[A-Z][\w'’\- ]+)+(?:\s*\/\s*[\w'’\- ]+(?:(?:,| and)\s*[\w'’\- ]+)*)?$/, (s) => s.replace(/ and /g, ' y '));

export function translateLine(src) {
  for (const [re, fn] of P) {
    const m = src.match(re);
    if (m) return fn(...m);
  }
  return null;
}
