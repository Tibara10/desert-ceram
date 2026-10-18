import products from '../data/products.json';

const bySlug = new Map(products.map((p) => [p.slug, p]));
const form = document.getElementById('quote') as HTMLFormElement;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const produit = $<HTMLSelectElement>('produit');
const surface = $<HTMLInputElement>('surface');
const pose = $<HTMLSelectElement>('pose');
const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

// « 4 pièces · 1,44 m² » → { qty: 1.44, unit: 'm²' } ; « 15 pièces · 9 m linéaires » → { qty: 9, unit: 'm' }
function perBox(box: string) {
  const m = box.match(/·\s*([\d,]+)\s*(m²|m)/);
  if (!m) return null;
  return { qty: parseFloat(m[1].replace(',', '.')), unit: m[2] };
}

function estimate() {
  const p = bySlug.get(produit.value);
  const isPlinth = p?.category === 'plinthe';
  $('surface-label').firstChild!.textContent = isPlinth ? 'Longueur à couvrir (m) ' : 'Surface à couvrir (m²) ';
  $('est-need-label').textContent = isPlinth ? 'Longueur avec chutes' : 'Surface avec chutes';

  if (!p) {
    $('est-name').textContent = 'Choisissez un produit';
    ['est-need', 'est-boxes', 'est-total', 'est-box'].forEach((id) => ($(id).textContent = '—'));
    return;
  }
  $<HTMLImageElement>('est-img').src = `/tiles/${p.slug}.svg`;
  $('est-name').textContent = `${p.name} · ${p.format} cm`;
  $('est-box').textContent = p.box;

  const b = perBox(p.box);
  const s = parseFloat(surface.value);
  if (!b || !(s > 0)) {
    ['est-need', 'est-boxes', 'est-total'].forEach((id) => ($(id).textContent = '—'));
    return;
  }
  const need = s * (1 + Number(pose.value) / 100);
  const boxes = Math.ceil(need / b.qty - 1e-9);
  $('est-need').textContent = `${nf.format(need)} ${b.unit}`;
  $('est-boxes').textContent = String(boxes);
  $('est-total').textContent = `${nf.format(boxes * b.qty)} ${b.unit}`;
}

// ── Validation accessible ────────────────────────────────
const messages: Record<string, (el: HTMLInputElement) => string> = {
  produit: () => 'Choisissez un produit.',
  surface: (el) => (el.validity.valueMissing ? 'Indiquez une surface.' : 'Entrez une valeur entre 1 et 100 000.'),
  nom: () => 'Indiquez votre nom (2 caractères minimum).',
  wilaya: () => 'Indiquez votre wilaya.',
  email: (el) => (el.validity.valueMissing ? 'Indiquez votre email.' : 'Cet email ne semble pas valide.'),
  tel: () => 'Format attendu : 05/06/07 suivi de 8 chiffres, ou +213.',
  consent: () => 'Ce consentement est nécessaire pour traiter la demande.',
};

function check(el: HTMLInputElement) {
  const err = document.getElementById(`err-${el.name}`);
  if (!err) return true;
  const ok = el.checkValidity();
  el.setAttribute('aria-invalid', String(!ok));
  err.textContent = ok ? '' : messages[el.name]?.(el) ?? 'Champ invalide.';
  return ok;
}

form.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement;
  if (el.getAttribute('aria-invalid') === 'true') check(el);
  if (['produit', 'surface', 'pose'].includes(el.name)) estimate();
});
form.addEventListener('focusout', (e) => {
  const el = e.target as HTMLInputElement;
  if (el.name && el.value) check(el);
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const fields = [...form.querySelectorAll<HTMLInputElement>('input[name], select[name]')].filter((el) => el.type !== 'radio');
  const invalid = fields.filter((el) => !check(el));
  if (invalid.length) {
    invalid[0].focus();
    return;
  }
  const fd = new FormData(form);
  const p = bySlug.get(String(fd.get('produit')))!;
  const recap: [string, string][] = [
    ['Profil', String(fd.get('profil'))],
    ['Nom', String(fd.get('nom'))],
    ['Wilaya', String(fd.get('wilaya'))],
    ['Produit', `${p.name} (${p.format} cm)`],
    ['Quantité', `${$('est-boxes').textContent} boîtes · ${$('est-total').textContent}`],
  ];
  // textContent uniquement : aucune saisie n'est injectée comme HTML
  $('done-recap').replaceChildren(
    ...recap.flatMap(([k, v]) => {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      return [dt, dd];
    }),
  );
  $<HTMLDialogElement>('done').showModal();
});

$('done-close').addEventListener('click', () => {
  $<HTMLDialogElement>('done').close();
  form.reset();
  clearErrors();
  estimate();
});
function clearErrors() {
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  form.querySelectorAll('.error').forEach((el) => (el.textContent = ''));
}

// Produit présélectionné depuis une fiche (?produit=tassili)
const pre = new URLSearchParams(location.search).get('produit');
if (pre && bySlug.has(pre)) produit.value = pre;
estimate();
