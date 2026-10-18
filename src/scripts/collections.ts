import products from '../data/products.json';

type Product = (typeof products)[number];
const bySlug = new Map(products.map((p) => [p.slug, p]));
const catLabel: Record<string, string> = { sol: 'Carreau de sol', mur: 'Faïence murale', plinthe: 'Plinthe' };

const form = document.getElementById('filters') as HTMLFormElement;
const cards = [...document.querySelectorAll<HTMLElement>('#grid .product')];
const results = document.getElementById('results')!;
const empty = document.getElementById('empty')!;

// ── Filtres ───────────────────────────────────────────────
function readFilters() {
  const fd = new FormData(form);
  return {
    cat: String(fd.get('cat') ?? ''),
    q: String(fd.get('q') ?? '').trim().toLowerCase(),
    format: String(fd.get('format') ?? ''),
    finish: String(fd.get('finish') ?? ''),
    color: String(fd.get('color') ?? ''),
  };
}

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function applyFilters() {
  const f = readFilters();
  let shown = 0;
  for (const card of cards) {
    const d = card.dataset;
    const ok =
      (!f.cat || d.cat === f.cat) &&
      (!f.format || d.format === f.format) &&
      (!f.finish || d.finish === f.finish) &&
      (!f.color || d.color === f.color) &&
      (!f.q || normalize(d.name ?? '').includes(normalize(f.q)));
    card.hidden = !ok;
    if (ok) shown++;
  }
  results.textContent = `${shown} produit${shown > 1 ? 's' : ''}`;
  empty.hidden = shown > 0;

  // L'URL reflète la catégorie : partageable et compatible avec le bouton « précédent »
  const url = new URL(location.href);
  if (f.cat) url.searchParams.set('cat', f.cat);
  else url.searchParams.delete('cat');
  history.replaceState(null, '', url);
}

form.addEventListener('input', applyFilters);
form.addEventListener('submit', (e) => e.preventDefault());
document.getElementById('reset')!.addEventListener('click', () => {
  form.reset();
  applyFilters();
});

// Catégorie initiale depuis l'URL (?cat=sol)
const initialCat = new URLSearchParams(location.search).get('cat');
if (initialCat && ['sol', 'mur', 'plinthe'].includes(initialCat)) {
  const radio = form.querySelector<HTMLInputElement>(`input[name="cat"][value="${initialCat}"]`);
  if (radio) radio.checked = true;
}
applyFilters();

// ── Fiche produit ─────────────────────────────────────────
const sheet = document.getElementById('sheet') as HTMLDialogElement;
const $ = (id: string) => document.getElementById(id)!;
const tabTile = $('tab-tile');
const tabRoom = $('tab-room');

function selectTab(room: boolean) {
  tabTile.setAttribute('aria-selected', String(!room));
  tabRoom.setAttribute('aria-selected', String(room));
  $('view-tile').hidden = room;
  $('view-room').hidden = !room;
}
tabTile.addEventListener('click', () => selectTab(false));
tabRoom.addEventListener('click', () => selectTab(true));

// Taille d'un carreau dans la simulation : on part du format réel en cm
function tileSize(p: Product, scale: number) {
  const [w, h] = p.format.split('×').map((n) => parseFloat(n));
  // Les carreaux rectangulaires sont posés dans le sens de la longueur
  return { w: Math.max(w, h) * scale, h: Math.min(w, h) * scale };
}

function paint(el: HTMLElement, p: Product, scale: number) {
  const { w, h } = tileSize(p, scale);
  const joint = 'rgba(60,45,35,.35)';
  // Modification via CSSOM : autorisée par la CSP (contrairement aux attributs style="")
  el.style.backgroundImage =
    `linear-gradient(to right, ${joint} 1px, transparent 1px), ` +
    `linear-gradient(to bottom, ${joint} 1px, transparent 1px), ` +
    `url(/tiles/${p.slug}.svg)`;
  el.style.backgroundSize = `${w}px ${h}px, ${w}px ${h}px, ${w}px ${h}px`;
}

function fillSheet(p: Product) {
  ($('sheet-img') as HTMLImageElement).src = `/tiles/${p.slug}.svg`;
  ($('sheet-img') as HTMLImageElement).alt = `Aperçu du carreau ${p.name}`;
  $('sheet-cat').textContent = `${catLabel[p.category]} · ${p.format} cm`;
  $('sheet-title').textContent = p.name;
  $('sheet-desc').textContent = p.description;

  const specs: [string, string][] = [
    ['Format', `${p.format} cm`],
    ['Finition', p.finish],
    ['Couleur', p.color],
    ['Épaisseur', p.thickness],
    ['Poids', p.weight],
    ['Résistance (PEI)', p.pei],
    ['Glissance', p.slip],
    ['Absorption d’eau', p.absorption],
    ['Usage', p.usage],
    ['Conditionnement', p.box],
    ['Norme', 'EN 14411'],
  ];
  const dl = $('sheet-specs');
  dl.replaceChildren(
    ...specs.flatMap(([k, v]) => {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      return [dt, dd];
    }),
  );

  ($('sheet-quote') as HTMLAnchorElement).href = `/devis/?produit=${encodeURIComponent(p.slug)}`;

  // Simulation : le produit va au sol (sol, plinthe) ou au mur (faïence)
  const wall = $('room-wall');
  const floor = $('room-floor');
  wall.style.cssText = '';
  floor.style.cssText = '';
  if (p.category === 'mur') {
    paint(wall, p, 3.2);
    paint(floor, bySlug.get('erg')!, 1.2);
  } else {
    paint(floor, p, 1.2);
  }
  selectTab(false);
}

function openSheet(slug: string, push = true) {
  const p = bySlug.get(slug);
  if (!p) return;
  fillSheet(p);
  if (!sheet.open) sheet.showModal();
  if (push) {
    const url = new URL(location.href);
    url.searchParams.set('p', slug);
    history.pushState({ p: slug }, '', url);
  }
}

function closeSheet() {
  if (sheet.open) sheet.close();
}

sheet.addEventListener('close', () => {
  const url = new URL(location.href);
  if (url.searchParams.has('p')) {
    url.searchParams.delete('p');
    history.replaceState(null, '', url);
  }
});
$('sheet-close').addEventListener('click', closeSheet);
// Clic sur le fond assombri = fermeture
sheet.addEventListener('click', (e) => {
  if (e.target === sheet) closeSheet();
});
window.addEventListener('popstate', () => {
  const slug = new URLSearchParams(location.search).get('p');
  if (slug) openSheet(slug, false);
  else closeSheet();
});

// Les cartes sont des liens (?p=slug) : sans JavaScript elles restent utilisables
for (const card of cards) {
  card.querySelector('a')!.addEventListener('click', (e) => {
    e.preventDefault();
    openSheet(card.dataset.slug!);
  });
}

$('sheet-copy').addEventListener('click', async (e) => {
  const btn = e.currentTarget as HTMLButtonElement;
  try {
    await navigator.clipboard.writeText(location.href);
    btn.textContent = 'Lien copié ✓';
  } catch {
    btn.textContent = 'Copie impossible';
  }
  setTimeout(() => (btn.textContent = 'Copier le lien'), 2000);
});

// Lien direct vers une fiche (?p=tassili)
const initial = new URLSearchParams(location.search).get('p');
if (initial) openSheet(initial, false);
