/* ==========================================================================
   开源拾遗 · interactions
   No dependencies, works from file://.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 站点配置（可在 index.html 里改） ---------- */
  var SITE = window.SITE_CONFIG || {};
  var CONTACT_EMAIL = SITE.contactEmail || "hi@shiyi.notes";
  var SUBSCRIBE_ENDPOINT = SITE.subscribeEndpoint || "";

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
    var lastFocused = null;

    if (!mobileNav.hasAttribute("aria-hidden")) mobileNav.setAttribute("aria-hidden", "true");

    var closeMenu = function (restoreFocus) {
      if (!mobileNav.classList.contains("is-open")) return;
      var focusInNav = mobileNav.contains(document.activeElement);
      mobileNav.classList.remove("is-open");
      mobileNav.setAttribute("aria-hidden", "true");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "打开菜单");
      document.body.classList.remove("is-nav-open");
      if (menuIcon) menuIcon.setAttribute("href", "#i-menu");
      if (restoreFocus && focusInNav) menuBtn.focus({ preventScroll: true });
      lastFocused = null;
    };
    var openMenu = function () {
      lastFocused = document.activeElement;
      mobileNav.classList.add("is-open");
      mobileNav.setAttribute("aria-hidden", "false");
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", "关闭菜单");
      document.body.classList.add("is-nav-open");
      if (menuIcon) menuIcon.setAttribute("href", "#i-close");
      var firstLink = mobileNav.querySelector("a");
      if (firstLink) {
        // 等一帧，确保 visibility 已切换，元素可被聚焦
        window.requestAnimationFrame(function () {
          firstLink.focus({ preventScroll: true });
        });
      }
    };
    menuBtn.addEventListener("click", function () {
      if (mobileNav.classList.contains("is-open")) closeMenu(true); else openMenu();
    });
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { closeMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu(true);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeMenu(false);
    });
    document.addEventListener("click", function (e) {
      if (!mobileNav.classList.contains("is-open")) return;
      if (mobileNav.contains(e.target) || menuBtn.contains(e.target)) return;
      closeMenu(false);
    });
  }

  /* ---------- Render project grid ---------- */
  var grid = document.getElementById("projectGrid");
  var filters = document.getElementById("projectFilters");
  var search = document.getElementById("projectSearch");
  var clearBtn = document.querySelector("[data-search-clear]");
  var status = document.getElementById("filterStatus");
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

  /* 把当前筛选状态写进地址栏：刷新、分享都能还原 */
  function syncUrl() {
    if (!window.history || !history.replaceState) return;
    try {
      var params = new URLSearchParams();
      if (query && search && search.value.trim()) params.set("q", search.value.trim());
      if (activeCategory !== "all") params.set("cat", activeCategory);
      var qs = params.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    } catch (e) { /* file:// 下可能不允许，忽略 */ }
  }

  function restoreUrlState() {
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { return; }
    var q = params.get("q") || "";
    var cat = params.get("cat") || "all";
    if (q && search) {
      search.value = q;
      query = q.trim().toLowerCase();
      if (clearBtn) clearBtn.hidden = false;
    }
    if (cat !== "all" && categories.indexOf(cat) !== -1) {
      activeCategory = cat;
      if (filters) {
        Array.prototype.forEach.call(filters.children, function (btn) {
          btn.classList.toggle("is-active", btn.getAttribute("data-filter") === cat);
        });
      }
    }
  }

  function updateStatus(visible) {
    if (!status) return;
    if (!query && activeCategory === "all") {
      status.textContent = "";
      return;
    }
    var parts = [];
    if (activeCategory !== "all") parts.push("「" + activeCategory + "」");
    if (query) parts.push("“" + (search ? search.value.trim() : query) + "”");
    status.textContent = parts.join(" ") + "：找到 " + visible + " 个，共 " + projects.length + " 个。";
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
    if (clearBtn && search) clearBtn.hidden = search.value === "";
    updateStatus(visible);
    syncUrl();
  }

  function clearSearch(focus) {
    if (!search) return;
    search.value = "";
    query = "";
    applyFilter();
    if (focus) search.focus({ preventScroll: true });
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
      search.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          e.preventDefault();
          clearSearch(true);
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", function () { clearSearch(true); });
    }

    // 按 “/” 直接跳到搜索框（输入框里按则不触发）
    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      var tag = (e.target && e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || (e.target && e.target.isContentEditable)) return;
      if (!search) return;
      e.preventDefault();
      search.focus({ preventScroll: false });
      search.select();
    });

    setCounts();
    restoreUrlState();
    applyFilter();
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
    var button = form.querySelector('button[type="submit"]');
    var defaultHint = hint ? hint.textContent : "";

    function setHint(text, kind) {
      if (!hint) return;
      hint.classList.remove("is-error", "is-success");
      hint.textContent = text;
      if (kind) hint.classList.add(kind);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!input || !hint) return;
      var value = input.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

      if (!valid) {
        setHint("请输入一个有效的邮箱地址，比如 name@example.com。", "is-error");
        input.focus();
        return;
      }

      // 情况一：配置了订阅接口（如 Formspree），真实提交
      if (SUBSCRIBE_ENDPOINT) {
        if (button) button.disabled = true;
        setHint("正在提交…", null);
        fetch(SUBSCRIBE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ email: value, source: location.href })
        }).then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          setHint("订阅成功！下次整理完清单，会先寄给你。", "is-success");
          input.value = "";
        }).catch(function () {
          setHint("提交失败，请稍后再试；也可以直接写信到 " + CONTACT_EMAIL + "。", "is-error");
        }).then(function () {
          if (button) button.disabled = false;
        });
        return;
      }

      // 情况二：没配接口时，用邮件客户端完成订阅（真正可用，不假装成功）
      var subject = "订阅《开源拾遗》";
      var body = "你好，我想订阅开源拾遗的更新。\n\n我的邮箱：" + value + "\n\n（直接发送这封邮件即可）";
      var mailto = "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      window.location.href = mailto;
      setHint("已为你打开邮件客户端，直接发送就能完成订阅；若没有弹出，也可以手动写信到 " + CONTACT_EMAIL + "。", "is-success");
      input.value = "";
      window.setTimeout(function () {
        if (hint && hint.classList.contains("is-success")) {
          hint.classList.remove("is-success");
          hint.textContent = defaultHint;
        }
      }, 8000);
    });
  });
})();
