window.JV_SITE_CONFIG = Object.freeze({
  formEndpoint: 'https://script.google.com/macros/s/AKfycbzy289R1s32ck_Ax-PyRZIFpuW1BV_0odj2ZaiPyuzWHcYQ7s-W-Jk2scIdBCj7e0k/exec'
});

(() => {
  const form = document.querySelector('#estimate-form');
  if (!form) return;

  const card = form.closest('.contact-form-card') || form.parentElement;
  const endpoint = String(window.JV_SITE_CONFIG?.formEndpoint || '').trim();
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.contact-form-status');
  const originalButtonText = button?.textContent || 'Request Estimate';

  let pending = false;
  let timeoutId = 0;
  let responseMessageReceived = false;

  const style = document.createElement('style');
  style.textContent = `
    .form-honeypot {
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
    }
    .contact-form-status {
      min-height: 1.4em;
      margin: 12px 0 0;
      font-size: .95rem;
      line-height: 1.45;
    }
    .contact-form-status.is-success { color: #207a3b; }
    .contact-form button[disabled] { opacity: .72; cursor: wait; }
    .jv-form-result {
      min-height: 330px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 36px 22px;
    }
    .jv-form-result h3 {
      margin: 0 0 12px;
      font-size: clamp(1.65rem, 3vw, 2.2rem);
      line-height: 1.1;
      color: #151515;
    }
    .jv-result-icon {
      width: 74px;
      height: 74px;
      margin: 0 0 22px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 42px;
      line-height: 1;
      font-weight: 900;
    }
    .jv-form-success .jv-result-icon {
      background: #e8f7ed;
      color: #16833b;
      border: 2px solid #16833b;
    }
    .jv-form-result p {
      max-width: 520px;
      margin: 0 0 24px;
      color: #555;
      font-size: 1rem;
      line-height: 1.55;
    }
    .jv-form-result a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 54px;
      padding: 0 26px;
      border-radius: 10px;
      background: #ffc400;
      color: #111;
      font-weight: 800;
      text-decoration: none;
    }
  `;
  document.head.appendChild(style);

  const iframe = document.createElement('iframe');
  iframe.name = 'jv-estimate-form-target';
  iframe.title = 'Estimate request submission';
  iframe.hidden = true;
  document.body.appendChild(iframe);

  const setStatus = (message, type = '') => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-success', type === 'success');
  };

  const setBusy = (busy) => {
    if (!button) return;
    button.disabled = busy;
    button.textContent = busy ? 'Sending…' : originalButtonText;
  };

  const clearPendingTimers = () => {
    window.clearTimeout(timeoutId);
  };

  const resetPending = () => {
    pending = false;
    clearPendingTimers();
    setBusy(false);
  };

  const showSuccess = () => {
    if (!pending) return;
    resetPending();
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'generate_lead', {
        form_name: 'estimate_form',
        project_type: String(form.elements.projectType?.value || ''),
        page_path: location.pathname
      });
    }
    form.reset();

    if (!card) {
      setStatus('Thanks. Your estimate request was sent. JV Electric will follow up soon.', 'success');
      return;
    }

    card.innerHTML = `
      <div class="jv-form-result jv-form-success" role="status" aria-live="polite">
        <div class="jv-result-icon" aria-hidden="true">✓</div>
        <h3>Thanks! Your request was sent.</h3>
        <p>JV Electric received your estimate request and will follow up soon.</p>
      </div>
    `;
  };

  const showFullFormError = () => {
    if (!pending && card?.querySelector('.jv-form-error')) return;
    resetPending();

    if (!card) {
      setStatus('Error. Please call (360) 442-3618.');
      return;
    }

    card.innerHTML = `
      <div class="jv-form-result jv-form-error" role="alert">
        <h3>We couldn’t send your request.</h3>
        <p>Please call JV Electric directly and we’ll help you with your estimate.</p>
        <a href="tel:+13604423618">Call (360) 442-3618</a>
      </div>
    `;
  };


  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!pending || !data || data.source !== 'jv-electric-form') return;

    responseMessageReceived = true;
    if (data.ok) {
      showSuccess();
    } else {
      showFullFormError();
    }
  });

  form.addEventListener('submit', (event) => {
    setStatus('');

    if (!/^https:\/\/script\.google\.com\/macros\/s\//i.test(endpoint)) {
      event.preventDefault();
      showFullFormError();
      return;
    }

    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      return;
    }

    if (pending) {
      event.preventDefault();
      return;
    }

    responseMessageReceived = false;
    pending = true;
    setBusy(true);
    setStatus('Sending your request…');

    form.action = endpoint;
    form.method = 'POST';
    form.target = iframe.name;

     
    timeoutId = window.setTimeout(() => {
      if (pending) showFullFormError();
    }, 20000);
  });
})();
