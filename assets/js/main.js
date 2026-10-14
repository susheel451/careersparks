/**
 * Career Spark — shared site behaviour.
 * Everything here is progressive enhancement: pages remain fully readable
 * and navigable if this file fails to load.
 */
(function () {
  "use strict";

  var config = window.CS_CONFIG || {};
  var cloudName = (config.cloudinaryCloudName || "").trim();

  /* ---------- Cloudinary delivery + graceful image fallbacks ---------- */
  // <img src="Images/local.jpg" data-cld="careerspark/folder/name" data-w="800">
  // If a cloud name is configured, the image is served from Cloudinary with
  // automatic format/quality. If Cloudinary fails we fall back to the local
  // file, and if that is missing too we show a branded placeholder.
  function cloudinaryUrl(publicId, width) {
    var t = "f_auto,q_auto,c_limit" + (width ? ",w_" + width : "");
    return "https://res.cloudinary.com/" + encodeURIComponent(cloudName) + "/image/upload/" + t + "/" + publicId;
  }
  window.CS_cloudinaryUrl = function (publicId, width) {
    return cloudName && publicId ? cloudinaryUrl(publicId, width) : null;
  };

  function markFallback(img) {
    var frame = img.closest(".media, .brand-mark");
    if (frame) {
      frame.classList.add("is-fallback");
      if (!frame.getAttribute("data-fallback")) frame.setAttribute("data-fallback", img.alt || "Image coming soon");
    }
    img.setAttribute("aria-hidden", "true");
  }

  function handleError(img) {
    var local = img.getAttribute("data-local");
    if (local && img.getAttribute("src") !== local) {
      img.setAttribute("src", local); // Cloudinary failed -> try local copy
      return;
    }
    markFallback(img);
  }

  document.querySelectorAll("img").forEach(function (img) {
    var publicId = img.getAttribute("data-cld");
    img.addEventListener("error", function () { handleError(img); });

    if (cloudName && publicId) {
      img.setAttribute("data-local", img.getAttribute("src"));
      img.setAttribute("src", cloudinaryUrl(publicId, img.getAttribute("data-w")));
    } else if (img.complete && img.naturalWidth === 0) {
      // Already failed before this script ran
      handleError(img);
    }
  });

  document.querySelectorAll("video").forEach(function (video) {
    var sources = video.querySelectorAll("source");
    var last = sources[sources.length - 1];
    var fail = function () {
      var frame = video.closest(".media");
      if (frame) { frame.classList.add("is-fallback"); frame.setAttribute("data-fallback", "Video unavailable"); }
      video.hidden = true;
      var section = video.closest("[data-video-section]");
      if (section) {
        var all = section.querySelectorAll("video");
        var failed = section.querySelectorAll("video[hidden]");
        if (all.length === failed.length) section.hidden = true;
      }
    };
    if (last) last.addEventListener("error", fail);
    else video.addEventListener("error", fail);
    if (video.networkState === 3) fail(); // NETWORK_NO_SOURCE: already failed
  });

  /* ---------- Header: scroll state ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
    };
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(open);
      if (open) { var first = nav.querySelector("a"); if (first) first.focus(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (mq) { if (mq.matches) setOpen(false); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || reduce) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Hero slideshow (preserves the original 4-image rotation) ---------- */
  var slider = document.querySelector("[data-slider]");
  if (slider) {
    var slides = slider.querySelectorAll(".hero-slide");
    var dotsWrap = slider.querySelector(".hero-dots");
    var index = 0, timer = null;
    var show = function (i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        s.classList.toggle("is-active", n === index);
        s.setAttribute("aria-hidden", String(n !== index));
      });
      if (dotsWrap) dotsWrap.querySelectorAll("button").forEach(function (b, n) {
        b.setAttribute("aria-current", String(n === index));
      });
    };
    var start = function () { if (!reduce && slides.length > 1) { stop(); timer = setInterval(function () { show(index + 1); }, 4500); } };
    var stop = function () { if (timer) clearInterval(timer); timer = null; };
    if (dotsWrap) {
      slides.forEach(function (_, n) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Show photo " + (n + 1) + " of " + slides.length);
        b.addEventListener("click", function () { show(n); start(); });
        dotsWrap.appendChild(b);
      });
    }
    slider.classList.add("is-ready");
    show(0);
    start();
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    slider.addEventListener("focusin", stop);
    slider.addEventListener("focusout", start);
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
