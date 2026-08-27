(function () {
  'use strict';

  const enquiryDialog = document.getElementById('enquiry-dialog');
  const feedbackDialog = document.getElementById('feedback-dialog');

  document.querySelectorAll('[data-open="enquiry"]').forEach((btn) => {
    btn.addEventListener('click', () => openDialog(enquiryDialog));
  });
  document.querySelectorAll('[data-open="feedback"]').forEach((btn) => {
    btn.addEventListener('click', () => openDialog(feedbackDialog));
  });
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('dialog').close());
  });
  [enquiryDialog, feedbackDialog].forEach((dialog) => {
    // Close when clicking the backdrop (outside the modal card).
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  });

  function openDialog(dialog) {
    resetDialog(dialog);
    dialog.showModal();
  }

  function resetDialog(dialog) {
    const form = dialog.querySelector('form');
    const status = dialog.querySelector('.form-status');
    if (form) {
      form.hidden = false;
      form.reset();
    }
    if (status) {
      status.hidden = true;
      status.textContent = '';
      status.className = 'form-status';
    }
  }

  function bindForm(formId, endpoint, buildPayload) {
    const form = document.getElementById(formId);
    if (!form) return;
    const dialog = form.closest('dialog');
    const status = dialog.querySelector('.form-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload(new FormData(form))),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Something went wrong. Please try again.');
        }

        form.hidden = true;
        status.hidden = false;
        status.className = 'form-status success';
        status.textContent = "Thanks, we've received your message. We'll be in touch shortly.";
      } catch (err) {
        status.hidden = false;
        status.className = 'form-status error';
        status.textContent = err.message || 'Something went wrong. Please try again.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.label;
      }
    });
  }

  bindForm('enquiry-form', '/api/enquiry', (fd) => ({
    name: fd.get('name'),
    email: fd.get('email'),
    phone: fd.get('phone'),
    propertyType: fd.get('propertyType'),
    service: fd.get('service'),
    message: fd.get('message'),
  }));

  bindForm('feedback-form', '/api/feedback', (fd) => ({
    name: fd.get('name'),
    email: fd.get('email'),
    rating: fd.get('rating'),
    message: fd.get('message'),
  }));
})();
