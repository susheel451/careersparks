/**
 * Enquiry form: validation + honest submission.
 * - If ENQUIRY_FORM_ENDPOINT is configured (e.g. a Formspree / Web3Forms /
 *   Getform endpoint), the form is POSTed and success is shown ONLY when the
 *   service responds with a 2xx status.
 * - If no endpoint is configured, nothing is "sent". The visitor is offered
 *   to open their own SMS app with the message pre-filled, and told so clearly.
 */
(function () {
  "use strict";
  var form = document.getElementById("enquiry-form");
  if (!form) return;

  var config = window.CS_CONFIG || {};
  var endpoint = (config.enquiryEndpoint || "").trim();
  var PHONE = "8660995890";
  var statusEl = document.getElementById("form-status");
  var submitBtn = form.querySelector("[type=submit]");
  var submitLabel = submitBtn.querySelector(".btn-label");

  if (!endpoint) {
    submitLabel.textContent = "Continue in SMS app";
    var notice = document.getElementById("form-mode-note");
    if (notice) notice.hidden = false;
  }

  var rules = {
    name: function (v) { return v.trim().length >= 2 || "Please enter your full name."; },
    phone: function (v) { return /^(\+?91[\s-]?)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "")) || "Please enter a valid 10-digit mobile number."; },
    email: function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Please enter a valid email address."; },
    interest: function (v) { return !!v || "Please choose what you are interested in."; },
    message: function (v) { return v.trim().length >= 10 || "Please add a short message (at least 10 characters)."; }
  };

  function validateField(field) {
    var rule = rules[field.name];
    if (!rule) return true;
    var result = rule(field.value);
    var err = document.getElementById(field.id + "-error");
    var ok = result === true;
    field.setAttribute("aria-invalid", String(!ok));
    if (err) err.textContent = ok ? "" : result;
    return ok;
  }

  Object.keys(rules).forEach(function (name) {
    var field = form.elements[name];
    if (!field) return;
    field.addEventListener("blur", function () { if (field.value) validateField(field); });
    field.addEventListener("input", function () { if (field.getAttribute("aria-invalid") === "true") validateField(field); });
  });

  function setStatus(type, html) {
    statusEl.className = "form-status is-visible " + type;
    statusEl.innerHTML = html;
    statusEl.focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var f = form.elements[name];
      if (f && !validateField(f) && !firstInvalid) firstInvalid = f;
    });
    if (firstInvalid) {
      setStatus("error", "Please correct the highlighted fields and try again.");
      firstInvalid.focus();
      return;
    }
    if (form.elements._gotcha && form.elements._gotcha.value) return; // bot trap

    var data = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      email: form.elements.email.value.trim(),
      interest: form.elements.interest.value,
      message: form.elements.message.value.trim()
    };

    if (!endpoint) {
      var body = "Enquiry from " + data.name + " (" + data.phone + (data.email ? ", " + data.email : "") + ")\n" +
        "Interested in: " + data.interest + "\n" + data.message;
      var href = "sms:" + PHONE + "?&body=" + encodeURIComponent(body);
      setStatus("info",
        "Online submission is not connected yet, so <strong>your message has not been sent</strong>. " +
        "<a href=\"" + href + "\">Open your SMS app with this message</a> (you will need to press send), " +
        "or call us on <a href=\"tel:+91" + PHONE + "\">" + PHONE + "</a>.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(Object.assign({ _subject: "Website enquiry — " + data.interest }, data))
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        setStatus("success", "Thank you, " + data.name.split(" ")[0] + ". Your enquiry has been received and our team will contact you soon.");
      })
      .catch(function () {
        setStatus("error", "Sorry, your enquiry could not be sent right now. Please try again, or call us on <a href=\"tel:+91" + PHONE + "\">" + PHONE + "</a>.");
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
      });
  });
})();
