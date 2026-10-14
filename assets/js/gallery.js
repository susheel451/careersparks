/**
 * Accessible gallery lightbox (no dependencies).
 * Keyboard: Enter/Space opens, ←/→ navigates, Esc closes, focus is trapped.
 */
(function () {
  "use strict";
  var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox] .gallery-item button"));
  var box = document.getElementById("lightbox");
  if (!buttons.length || !box) return;

  var img = box.querySelector("img");
  var caption = box.querySelector("figcaption");
  var closeBtn = box.querySelector(".lightbox-close");
  var prevBtn = box.querySelector(".lightbox-prev");
  var nextBtn = box.querySelector(".lightbox-next");
  var current = 0, lastFocus = null;

  function visibleButtons() {
    return buttons.filter(function (b) {
      var item = b.closest(".gallery-item");
      return !item.classList.contains("is-hidden");
    });
  }

  function load(i) {
    var list = visibleButtons();
    if (!list.length) return;
    current = (i + list.length) % list.length;
    var thumb = list[current].querySelector("img");
    var full = (thumb.getAttribute("data-cld") && window.CS_cloudinaryUrl(thumb.getAttribute("data-cld"), 1600)) ||
      thumb.getAttribute("data-local") || thumb.getAttribute("src");
    img.hidden = true;
    img.onload = function () { img.hidden = false; };
    img.onerror = function () { img.hidden = true; };
    img.src = full;
    img.alt = thumb.alt;
    caption.textContent = thumb.alt;
  }

  function open(btn) {
    lastFocus = btn;
    load(visibleButtons().indexOf(btn));
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    img.removeAttribute("src");
    if (lastFocus) lastFocus.focus();
  }

  buttons.forEach(function (b) { b.addEventListener("click", function () { open(b); }); });
  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", function () { load(current - 1); });
  nextBtn.addEventListener("click", function () { load(current + 1); });
  box.addEventListener("click", function (e) { if (e.target === box) close(); });

  document.addEventListener("keydown", function (e) {
    if (!box.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") load(current - 1);
    else if (e.key === "ArrowRight") load(current + 1);
    else if (e.key === "Tab") {
      var f = [closeBtn, prevBtn, nextBtn];
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

})();
