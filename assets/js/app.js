/* ==========================================================================
   开源拾遗 · interactions
   No dependencies, works from file://.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ---------- Theme ---------- */
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function syncThemeMeta() {
    if (!themeMeta) return;
    themeMeta.setAttribute("content", root.getAttribute("data-theme") === "dark" ? "#16130f" : "#f7f2e8");
  }
  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("sg-theme", theme); } catch (e) { /* ignore */ }
    syncThemeMeta();
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-label", theme === "dark" ? "切换为浅色模式" : "切换为深色模式");
      btn.setAttribute("title", theme === "dark" ? "切换为浅色模式" : "切换为深色模式");
    });
  }
  syncThemeMeta();
  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    var current = root.getAttribute("data-theme") || "light";
    btn.setAttribute("aria-label", current === "dark" ? "切换为浅色模式" : "切换为深色模式");
    btn.addEventListener("click", function () {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  });

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById("siteHeader");
  var backToTop = document.querySelector("[data-back-to-top]");
  var lastY = -1;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (y === lastY) return;
    lastY = y;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (backToTop) backToTop.classList.toggle("is-visible", y > 640);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  /* ---------- Mobile navigation ---------- */
  var menuBtn = document.querySelector("[data-menu-toggle]");
  var mobileNav = document.getElementById("mobileNav");
  if (menuBtn && mobileNav) {
    var menuIcon = menuBtn.querySelector("use");
    var closeMenu = function () {
      mobileNav.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "打开菜单");
      if (menuIcon) menuIcon.setAttribute("href", "#i-menu");
    };
    var openMenu = function () {
      mobileNav.classList.add("is-open");
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", "关闭菜单");
      if (menuIcon) menuIcon.setAttribute("href", "#i-close");
    };
    menuBtn.addEventListener("click", function () {
      if (mobileNav.classList.contains("is-open")) closeMenu(); else openMenu();
    });
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeMenu();
    });
    document.addEventListener("click", function (e) {
      if (!mobileNav.classList.contains("is-open")) return;
      if (mobileNav.contains(e.target) || menuBtn.contains(e.target)) return;
      closeMenu();
    });
  }

  /* ---------- Render project grid ---------- */
  var grid = document.getElementById("projectGrid");
  var filters = document.getElementById("projectFilters");
  var search = document.getElementById("projectSearch");
  var empty = document.getElementById("emptyState");
  var projects = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];
  var categories = [];
  var activeCategory = "all";
  var query = "";

  projects.forEach(function (p) {
    if (categories.indexOf(p.category) === -1) categories.push(p.category);
  });

  function cardHtml(p) {
    var haystack = [
      p.name, p.repo, p.desc, p.category, p.language, (p.tags || []).join(" ")
    ].join(" ").toLowerCase();

    var tags = (p.tags || []).map(function (tag) {
      return "<li>" + escapeHtml(tag) + "</li>";
    }).join("");

    return '' +
      '<a class="project-card tone-' + escapeHtml(p.tone) + ' reveal" href="' + escapeHtml(p.url) + '" ' +
        'target="_blank" rel="noopener noreferrer" ' +
        'data-category="' + escapeHtml(p.category) + '" data-search="' + escapeHtml(haystack) + '">' +
        '<div class="project-banner">' +
          '<span class="project-initial" aria-hidden="true">' + escapeHtml(p.initial) + '</span>' +
          '<div class="project-top">' +
            '<span class="project-repo">' + escapeHtml(p.repo) + '</span>' +
            '<span class="project-stars"><svg class="icon" aria-hidden="true"><use href="#i-star"/></svg>' + escapeHtml(p.stars) + '</span>' +
          '</div>' +
          '<span class="project-open">打开 GitHub <svg class="icon" aria-hidden="true"><use href="#i-external"/></svg></span>' +
        '</div>' +
        '<div class="project-body">' +
          '<div class="project-kicker">' +
            '<span class="project-cat">' + escapeHtml(p.category) + '</span>' +
            '<span class="dot" aria-hidden="true"></span>' +
            '<span class="project-lang"><i style="--lang:' + escapeHtml(p.langColor) + '"></i>' + escapeHtml(p.language) + '</span>' +
          '</div>' +
          '<h3 class="project-title">' + escapeHtml(p.name) + ' <svg class="icon project-ext" aria-hidden="true"><use href="#i-external"/></svg></h3>' +
          '<p class="project-desc">' + escapeHtml(p.desc) + '</p>' +
          '<ul class="project-tags">' + tags + '</ul>' +
        '</div>' +
      '</a>';
  }

  function setCounts() {
    document.querySelectorAll("[data-total]").forEach(function (el) {
      el.textContent = projects.length + 1;
    });
    document.querySelectorAll("[data-grid-count]").forEach(function (el) {
      el.textContent = projects.length;
    });
    document.querySelectorAll("[data-category-count]").forEach(function (el) {
      el.textContent = categories.length;
    });
    var tagText = document.querySelector(".hero-tag-text");
    if (tagText) tagText.textContent = (projects.length + 1) + " 个项目，持续更新";
  }

  function applyFilter() {
    if (!grid) return;
    var visible = 0;
    Array.prototype.forEach.call(grid.children, function (card) {
      var category = card.getAttribute("data-category");
      var haystack = (card.getAttribute("data-search") || "") + " " + card.textContent.toLowerCase();
      var matchCategory = activeCategory === "all" || category === activeCategory;
      var matchQuery = !query || haystack.indexOf(query) !== -1;
      var show = matchCategory && matchQuery;
      card.hidden = !show;
      if (show) {
        visible += 1;
        card.classList.add("is-in");
      }
    });
    if (empty) empty.hidden = visible !== 0;
  }

  if (grid) {
    grid.innerHTML = projects.map(cardHtml).join("");

    if (filters) {
      filters.innerHTML = '<button class="chip is-active" type="button" data-filter="all">全部</button>' +
        categories.map(function (category) {
          return '<button class="chip" type="button" data-filter="' + escapeHtml(category) + '">' + escapeHtml(category) + "</button>";
        }).join("");

      filters.addEventListener("click", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip) return;
        activeCategory = chip.getAttribute("data-filter") || "all";
        Array.prototype.forEach.call(filters.children, function (btn) {
          btn.classList.toggle("is-active", btn === chip);
        });
        applyFilter();
      });
    }

    if (search) {
      search.addEventListener("input", function () {
        query = search.value.trim().toLowerCase();
        applyFilter();
      });
    }

    setCounts();
  }

  /* ---------- Reveal on scroll ---------- */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  function revealAll() {
    revealItems.forEach(function (el) { el.classList.add("is-in"); });
  }

  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealAll();
  } else if (revealItems.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });

    revealItems.forEach(function (el) { observer.observe(el); });
    // Safety net: never leave content invisible.
    window.setTimeout(revealAll, 2400);
  }

  /* ---------- Newsletter form ---------- */
  document.querySelectorAll("[data-subscribe]").forEach(function (form) {
    var input = form.querySelector('input[type="email"]');
    var hint = form.querySelector("[data-form-hint]");
    var defaultHint = hint ? hint.textContent : "";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!input || !hint) return;
      var value = input.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      hint.classList.remove("is-error", "is-success");
      if (!valid) {
        hint.textContent = "请输入一个有效的邮箱地址，比如 name@example.com。";
        hint.classList.add("is-error");
        input.focus();
        return;
      }
      hint.textContent = "订阅成功！下次整理完清单，会先寄给你。";
      hint.classList.add("is-success");
      input.value = "";
      window.setTimeout(function () {
        hint.textContent = defaultHint;
        hint.classList.remove("is-success");
      }, 6000);
    });
  });
})();
