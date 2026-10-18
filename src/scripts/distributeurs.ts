const form = document.getElementById('dist-filters') as HTMLFormElement;
const items = [...document.querySelectorAll<HTMLElement>('#dists .dist')];
const results = document.getElementById('dist-results')!;
const empty = document.getElementById('dist-empty')!;
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function apply() {
  const fd = new FormData(form);
  const region = String(fd.get('region') ?? '');
  const q = norm(String(fd.get('q') ?? '').trim());
  const showroomOnly = fd.get('showroom') === 'on';
  let n = 0;
  for (const el of items) {
    const ok =
      (!region || el.dataset.region === region) &&
      (!showroomOnly || el.dataset.type === 'Showroom') &&
      (!q || norm(el.dataset.search ?? '').includes(q));
    el.hidden = !ok;
    if (ok) n++;
  }
  results.textContent = `${n} point${n > 1 ? 's' : ''} de vente`;
  empty.hidden = n > 0;
}
form.addEventListener('input', apply);
form.addEventListener('submit', (e) => e.preventDefault());
apply();
