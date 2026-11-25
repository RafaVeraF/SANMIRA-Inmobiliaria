import { supabase, isConfigured } from './supabase.js';
import { t, getLang } from './i18n.js';
import { formData, toast } from './util.js';

/** Conecta un formulario de contacto a la tabla `leads`. */
export function bindContactForm(form, { propertyId = null } = {}) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = formData(form);
    if (data.website) return; // bot

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;

    const lead = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      interest: data.interest,
      message: data.message,
      language: getLang(),
      property_id: propertyId,
    };

    try {
      if (isConfigured) {
        const { error } = await supabase.from('leads').insert(lead);
        if (error) throw error;
      } else {
        console.info('[SANMIRA demo] Lead (no enviado, Supabase sin configurar):', lead);
      }
      form.reset();
      toast(t('contact.sent'), 'ok');
    } catch (err) {
      console.error(err);
      toast(t('contact.error'), 'error');
    } finally {
      button.disabled = false;
    }
  });
}
