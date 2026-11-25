import { initPublicPage, whatsappLink } from '../lib/layout.js';
import { onLangChange } from '../lib/i18n.js';
import { listPublished, propertyCard } from '../lib/properties.js';
import { bindContactForm } from '../lib/leads.js';
import { $ } from '../lib/util.js';

initPublicPage();

let all = [];

function render() {
  const f = new FormData($('#filters'));
  const op = f.get('op');
  const type = f.get('type');
  const beds = Number(f.get('beds') || 0);

  const list = all.filter((p) =>
    (!op || p.operation === op) &&
    (!type || p.property_type === type) &&
    (!beds || (p.bedrooms ?? 0) >= beds));

  $('#property-grid').innerHTML = list
    .map((p, i) => propertyCard(p, { arched: i % 3 === 1 })) // una foto en arco por fila
    .join('');
  $('#empty-note').classList.toggle('hidden', list.length > 0);
}

async function loadInventory() {
  const { data, demo } = await listPublished();
  all = data || [];
  $('#demo-note').classList.toggle('hidden', !demo);
  render();
}

$('#filters').addEventListener('change', render);
onLangChange(render);

$('#wa-link').href = whatsappLink();
bindContactForm($('#contact-form'));
loadInventory();
