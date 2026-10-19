/* ==========================================================================
   开源拾遗 · interactions
   零依赖，file:// 下也能运行。
   - 首页搜索：加权索引、多关键词、名称优先、命中高亮
   - 筛选：分类 / 语言 / 类型 / 验证状态 / 难度 + 排序
   - 状态写入 URL，可分享与刷新还原
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SITE = window.SITE_CONFIG || {};
  var CONTACT_EMAIL = SITE.contactEmail || "hi@shiyi.notes";
  var SUBSCRIBE_ENDPOINT = SITE.subscribeEndpoint || "";

  /* ---------- 常量 ---------- */
  var STATUS_LABEL = {
    "not-tested": "未测试",
    "install-tested": "依赖安装已测试",
    "smoke-tested": "基本启动已测试",
    "experiment-verified": "实验已验证"
  };
  var TYPE_LABEL = {
    snippet: "代码片段",
    download: "可下载",
    repository: "原始仓库"
  };
  var JUSTIFIED_STATUS = ["not-tested", "install-tested", "smoke-tested", "experiment-verified"];
  var CATEGORIES = [
    "人工智能与机器学习",
    "算法与数学建模",
    "数据分析与可视化",
    "Web 与软件开发",
    "移动应用与桌面软件",
    "开发工具与自动化",
    "其他开源项目"
  ];

  /* ---------- 工具 ---------- */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // 归一化：大小写、全角、空格、常见标点
  function normalize(value) {
    return String(value == null ? "" : value)
      .toLowerCase()
      .replace(/[\uFF01-\uFF5E]/g, function (ch) {
        return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
      })
      .replace(/\u3000/g, " ")
      .replace(/[·・、，,。.；;：:!?！？'"“”‘’()（）\[\]【】<>《》\/\\|_+*~`-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokensOf(query) {
    var q = normalize(query);
    return q ? q.split(" ").filter(Boolean) : [];
  }

  function formatStars(stars) {
    if (typeof stars !== "number" || !isFinite(stars)) return "";
    if (stars >= 10000) return (Math.round(stars / 1000) / 10).toFixed(1).replace(/\.0$/, "") + " 万";
    if (stars >= 1000) return (Math.round(stars / 100) / 10).toFixed(1).replace(/\.0$/, "") + "k";
    return String(stars);
  }

  function slugify(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  /* ---------- 数据归一化（兼容旧格式） ---------- */
  var LEGACY_CATEGORY = {
    "效率工具": "开发工具与自动化",
    "自托管": "Web 与软件开发",
    "前端开发": "Web 与软件开发",
    "学习资源": "其他开源项目",
    "AI 与数据": "人工智能与机器学习",
    "开发工具": "开发工具与自动化"
  };

  function normalizeProject(raw) {
    var repo = raw.repo || "";
    var category = raw.category || "";
    return {
      id: raw.id || slugify(repo || raw.name || ""),
      name: raw.name || "",
      originalName: raw.originalName || (repo ? repo.split("/").pop() : null),
      aliases: raw.aliases || [],
      summary: raw.summary || raw.desc || "",
      description: raw.description || null,
      category: LEGACY_CATEGORY[category] || category || "其他开源项目",
      tags: raw.tags || [],
      languages: raw.languages || (raw.language ? [raw.language] : []),
      techStack: raw.techStack || [],
      difficulty: raw.difficulty || null,
      repositoryUrl: raw.repositoryUrl || raw.url || null,
      deliveryType: raw.deliveryType || ["repository"],
      codePath: raw.codePath || null,
      downloadUrl: raw.downloadUrl || null,
      requirements: raw.requirements || null,
      installCommand: raw.installCommand || null,
      runCommand: raw.runCommand || null,
      dataset: raw.dataset || null,
      hardwareRequirements: raw.hardwareRequirements || null,
      runStatus: raw.runStatus && JUSTIFIED_STATUS.indexOf(raw.runStatus) !== -1 ? raw.runStatus : "not-tested",
      verificationNotes: raw.verificationNotes || null,
      license: raw.license || null,
      author: raw.author || (repo ? repo.split("/")[0] : null),
      sourceRevision: raw.sourceRevision || null,
      lastVerifiedAt: raw.lastVerifiedAt || null,
      addedAt: raw.addedAt || "",
      featured: !!raw.featured,
      stars: typeof raw.stars === "number" ? raw.stars : null,
      tone: raw.tone || 1,
      initial: raw.initial || (raw.name || "?").slice(0, 2).toUpperCase(),
      langColor: raw.langColor || null
    };
  }

  var projects = (Array.isArray(window.PROJECTS) ? window.PROJECTS : []).map(normalizeProject);

  /* ---------- 搜索索引 ---------- */
  // 权重：名称 > 原名/别名 > 仓库名 > 标签/技术栈 > 简介 > 分类/语言
  var index = projects.map(function (p) {
    var repoName = p.repositoryUrl ? p.repositoryUrl.split("/").slice(-2).join("/") : "";
    return {
      p: p,
      name: normalize(p.name),
      original: normalize([p.originalName || ""].concat(p.aliases).join(" ")),
      repo: normalize(repoName),
      tags: normalize(p.tags.concat(p.techStack).join(" ")),
      text: normalize([p.summary, p.description || ""].join(" ")),
      meta: normalize([p.category].concat(p.languages).join(" "))
    };
  });

  function fieldScore(field, token) {
    if (!field || !token) return 0;
    if (field === token) return 1000;
    if (field.indexOf(token) === 0) return 620;
    if (field.indexOf(" " + token) !== -1) return 520;
    if (field.indexOf(token) !== -1) return 380;
    return 0;
  }

  function scoreProject(entry, tokens) {
    if (!tokens.length) return 0;
    var total = 0;
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      var score = Math.max(
        fieldScore(entry.name, t),
        Math.round(fieldScore(entry.original, t) * 0.8),
        Math.round(fieldScore(entry.repo, t) * 0.75),
        Math.round(fieldScore(entry.tags, t) * 0.6),
        Math.round(fieldScore(entry.text, t) * 0.42),
        Math.round(fieldScore(entry.meta, t) * 0.3)
      );
      if (score === 0) return 0; // 多关键词：必须全部命中
      total += score;
    }
    return total;
  }

  /* ---------- 状态 ---------- */
  var state = {
    q: "",
    tokens: [],
    cat: "all",
    lang: "all",
    type: "all",
    status: "all",
    diff: "all",
    sort: "relevance"
  };

  /* ---------- DOM ---------- */
  var grid = document.getElementById("projectGrid");
  var filters = document.getElementById("projectFilters");
  var searchInput = document.getElementById("projectSearch");
  var searchForm = document.getElementById("searchForm");
  var clearBtn = document.querySelector("[data-search-clear]");
  var statusEl = document.getElementById("filterStatus");
  var resultCountEl = document.getElementById("resultCount");
  var emptyEl = document.getElementById("emptyState");
  var categoryGrid = document.getElementById("categoryGrid");
  var featuredList = document.getElementById("featuredList");
  var recentList = document.getElementById("recentList");
  var langSelect = document.getElementById("filterLanguage");
  var typeSelect = document.getElementById("filterType");
  var statusSelect = document.getElementById("filterStatusSelect");
  var diffSelect = document.getElementById("filterDifficulty");
  var sortSelect = document.getElementById("sortOrder");
  var resetBtn = document.getElementById("resetFilters");

  /* ---------- 主题 ---------- */
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

  /* ---------- 头部滚动 / 返回顶部 ---------- */
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

  /* ---------- 移动端菜单 ---------- */
  var menuBtn = document.querySelector("[data-menu-toggle]");
  var mobileNav = document.getElementById("mobileNav");
  if (menuBtn && mobileNav) {
    var menuIcon = menuBtn.querySelector("use");
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
    };
    var openMenu = function () {
      mobileNav.classList.add("is-open");
      mobileNav.setAttribute("aria-hidden", "false");
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", "关闭菜单");
      document.body.classList.add("is-nav-open");
      if (menuIcon) menuIcon.setAttribute("href", "#i-close");
      var firstLink = mobileNav.querySelector("a");
      if (firstLink) {
        window.requestAnimationFrame(function () { firstLink.focus({ preventScroll: true }); });
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

  /* ---------- 卡片渲染 ---------- */
  function highlight(text, tokens) {
    var source = String(text == null ? "" : text);
    var safe = escapeHtml(source);
    if (!tokens || !tokens.length) return safe;
    var normal = normalize(source);
    // 归一化会改变长度时无法安全映射，退回纯文本
    if (normal.length !== source.length) return safe;

    var ranges = [];
    tokens.forEach(function (token) {
      var from = 0, at;
      while ((at = normal.indexOf(token, from)) !== -1) {
        ranges.push([at, at + token.length]);
        from = at + token.length;
      }
    });
    if (!ranges.length) return safe;
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [];
    ranges.forEach(function (r) {
      var last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push([r[0], r[1]]);
    });

    var out = "";
    var cursor = 0;
    merged.forEach(function (r) {
      out += escapeHtml(source.slice(cursor, r[0]));
      out += '<mark class="hit">' + escapeHtml(source.slice(r[0], r[1])) + "</mark>";
      cursor = r[1];
    });
    out += escapeHtml(source.slice(cursor));
    return out;
  }

  function detailHref(p) {
    return "p/" + encodeURIComponent(p.id) + "/";
  }

  function cardHtml(p, tokens) {
    var langs = p.languages.slice(0, 2).map(function (lang) {
      return '<span class="lang">' + escapeHtml(lang) + "</span>";
    }).join("");
    var tags = p.tags.slice(0, 3).map(function (tag) {
      return "<li>" + escapeHtml(tag) + "</li>";
    }).join("");
    var types = p.deliveryType.map(function (type) {
      return '<span class="badge type-' + escapeHtml(type) + '">' + escapeHtml(TYPE_LABEL[type] || type) + "</span>";
    }).join("");
    var stars = formatStars(p.stars);
    var repoLink = p.repositoryUrl
      ? '<a class="card-repo" href="' + escapeHtml(p.repositoryUrl) + '" target="_blank" rel="noopener noreferrer" aria-label="在 GitHub 打开 ' + escapeHtml(p.name) + '">GitHub<span aria-hidden="true"> ↗</span></a>'
      : "";

    var attrs = [
      'data-id="' + escapeHtml(p.id) + '"',
      'data-category="' + escapeHtml(p.category) + '"',
      'data-languages="' + escapeHtml(p.languages.join("|")) + '"',
      'data-types="' + escapeHtml(p.deliveryType.join("|")) + '"',
      'data-status="' + escapeHtml(p.runStatus) + '"',
      'data-difficulty="' + escapeHtml(p.difficulty || "") + '"'
    ].join(" ");

    return "" +
      '<article class="project-card tone-' + escapeHtml(p.tone) + '" ' + attrs + ">" +
        '<a class="card-main" href="' + detailHref(p) + '">' +
          '<div class="card-head">' +
            '<span class="card-initial" aria-hidden="true">' + escapeHtml(p.initial) + "</span>" +
            '<span class="card-category">' + escapeHtml(p.category) + "</span>" +
          "</div>" +
          '<h3 class="card-title">' + highlight(p.name, tokens) + "</h3>" +
          '<p class="card-summary">' + highlight(p.summary, tokens) + "</p>" +
          '<ul class="card-tags">' + tags + "</ul>" +
          '<div class="card-meta">' +
            (langs || '<span class="lang">语言未提供</span>') +
            '<span class="badge status-' + escapeHtml(p.runStatus) + '">' + escapeHtml(STATUS_LABEL[p.runStatus]) + "</span>" +
            types +
            (stars ? '<span class="stars"><svg class="icon" aria-hidden="true"><use href="#i-star"/></svg>' + stars + "</span>" : "") +
          "</div>" +
        "</a>" +
        repoLink +
      "</article>";
  }

  /* ---------- 筛选与排序 ---------- */
  var CLIENT_STATES = ["all"].concat(CATEGORIES);

  function matches(p, entry) {
    if (state.cat !== "all" && p.category !== state.cat) return false;
    if (state.lang !== "all" && p.languages.indexOf(state.lang) === -1) return false;
    if (state.type !== "all" && p.deliveryType.indexOf(state.type) === -1) return false;
    if (state.status !== "all" && p.runStatus !== state.status) return false;
    if (state.diff !== "all" && p.difficulty !== state.diff) return false;
    if (state.tokens.length && scoreProject(entry, state.tokens) === 0) return false;
    return true;
  }

  function compare(a, b) {
    switch (state.sort) {
      case "recent":
        return String(b.p.addedAt).localeCompare(String(a.p.addedAt)) || (b.p.stars || 0) - (a.p.stars || 0);
      case "stars":
        return (b.p.stars || 0) - (a.p.stars || 0) || a.p.name.localeCompare(b.p.name, "zh");
      case "name":
        return a.p.name.localeCompare(b.p.name, "zh");
      default:
        if (state.tokens.length) return b.score - a.score || (b.p.stars || 0) - (a.p.stars || 0);
        return (b.p.featured ? 1 : 0) - (a.p.featured ? 1 : 0) || (b.p.stars || 0) - (a.p.stars || 0);
    }
  }

  function applyFilters() {
    var tokens = state.tokens;
    var rows = [];
    index.forEach(function (entry) {
      if (!matches(entry.p, entry)) return;
      rows.push({ p: entry.p, score: tokens.length ? scoreProject(entry, tokens) : 0 });
    });
    rows.sort(compare);

    if (grid) grid.innerHTML = rows.map(function (row) { return cardHtml(row.p, tokens); }).join("");
    if (emptyEl) emptyEl.hidden = rows.length !== 0;
    if (resultCountEl) resultCountEl.textContent = "共 " + rows.length + " 个";

    if (statusEl) {
      var bits = [];
      if (state.tokens.length) bits.push("关键词「" + state.q.trim() + "」");
      if (state.cat !== "all") bits.push("分类「" + state.cat + "」");
      if (state.lang !== "all") bits.push("语言 " + state.lang);
      if (state.type !== "all") bits.push("类型 " + (TYPE_LABEL[state.type] || state.type));
      if (state.status !== "all") bits.push("验证 " + (STATUS_LABEL[state.status] || state.status));
      if (state.diff !== "all") bits.push("难度 " + state.diff);
      statusEl.textContent = bits.length
        ? bits.join(" · ") + "，找到 " + rows.length + " 个，共 " + projects.length + " 个。"
        : "";
    }

    var dirty = state.tokens.length || state.cat !== "all" || state.lang !== "all" ||
      state.type !== "all" || state.status !== "all" || state.diff !== "all";
    if (resetBtn) resetBtn.hidden = !dirty;
    if (clearBtn && searchInput) clearBtn.hidden = searchInput.value === "";
    syncUrl();
  }

  /* ---------- URL 状态 ---------- */
  function syncUrl() {
    if (!window.history || !history.replaceState) return;
    try {
      var params = new URLSearchParams();
      if (state.q.trim()) params.set("q", state.q.trim());
      if (state.cat !== "all") params.set("cat", state.cat);
      if (state.lang !== "all") params.set("lang", state.lang);
      if (state.type !== "all") params.set("type", state.type);
      if (state.status !== "all") params.set("status", state.status);
      if (state.diff !== "all") params.set("diff", state.diff);
      if (state.sort !== "relevance") params.set("sort", state.sort);
      var qs = params.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    } catch (e) { /* file:// 下可能不允许 */ }
  }

  function readUrl() {
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { return; }
    function take(key) {
      var v = params.get(key);
      return v == null ? "" : v;
    }
    state.q = take("q");
    state.cat = take("cat") || "all";
    state.lang = take("lang") || "all";
    state.type = take("type") || "all";
    state.status = take("status") || "all";
    state.diff = take("diff") || "all";
    state.sort = take("sort") || "relevance";
    if (CLIENT_STATES.indexOf(state.cat) === -1) state.cat = "all";
    if (state.sort !== "recent" && state.sort !== "stars" && state.sort !== "name") state.sort = "relevance";
    state.tokens = tokensOf(state.q);
    if (searchInput && state.q) searchInput.value = state.q;
  }

  /* ---------- 控件 ---------- */
  function fillSelect(select, options, current, allLabel) {
    if (!select) return;
    select.innerHTML = '<option value="all">' + escapeHtml(allLabel) + "</option>" +
      options.map(function (opt) {
        return '<option value="' + escapeHtml(opt.value) + '">' + escapeHtml(opt.label) + "</option>";
      }).join("");
    select.value = current;
  }

  function setupControls() {
    if (filters) {
      filters.innerHTML = '<button class="chip is-active" type="button" data-filter="all">全部</button>' +
        CATEGORIES.map(function (category) {
          var count = projects.filter(function (p) { return p.category === category; }).length;
          if (!count) return "";
          return '<button class="chip" type="button" data-filter="' + escapeHtml(category) + '">' +
            escapeHtml(category) + ' <span class="chip-count">' + count + "</span></button>";
        }).join("");
      filters.addEventListener("click", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip) return;
        state.cat = chip.getAttribute("data-filter") || "all";
        Array.prototype.forEach.call(filters.children, function (btn) {
          btn.classList.toggle("is-active", btn === chip);
        });
        applyFilters();
      });
      // 从 URL 恢复分类时同步选中态
      if (state.cat !== "all") {
        Array.prototype.forEach.call(filters.children, function (btn) {
          btn.classList.toggle("is-active", btn.getAttribute("data-filter") === state.cat);
        });
      }
    }

    var allLangs = [];
    projects.forEach(function (p) {
      p.languages.forEach(function (lang) {
        if (allLangs.indexOf(lang) === -1) allLangs.push(lang);
      });
    });
    allLangs.sort();
    fillSelect(langSelect, allLangs.map(function (l) { return { value: l, label: l }; }), state.lang, "全部语言");

    var usedTypes = [];
    projects.forEach(function (p) {
      p.deliveryType.forEach(function (t) {
        if (usedTypes.indexOf(t) === -1) usedTypes.push(t);
      });
    });
    fillSelect(typeSelect, usedTypes.map(function (t) {
      return { value: t, label: TYPE_LABEL[t] || t };
    }), state.type, "全部类型");

    fillSelect(statusSelect, JUSTIFIED_STATUS.map(function (s) {
      return { value: s, label: STATUS_LABEL[s] };
    }), state.status, "全部验证状态");

    var usedDiff = [];
    projects.forEach(function (p) {
      if (p.difficulty && usedDiff.indexOf(p.difficulty) === -1) usedDiff.push(p.difficulty);
    });
    fillSelect(diffSelect, usedDiff.map(function (d) { return { value: d, label: d }; }), state.diff, "全部难度");

    if (sortSelect) {
      sortSelect.value = state.sort;
      sortSelect.addEventListener("change", function () {
        state.sort = sortSelect.value;
        applyFilters();
      });
    }
    [langSelect, typeSelect, statusSelect, diffSelect].forEach(function (select, i) {
      if (!select) return;
      select.addEventListener("change", function () {
        state[["lang", "type", "status", "diff"][i]] = select.value;
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.q = searchInput.value;
        state.tokens = tokensOf(state.q);
        applyFilters();
      });
      searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          e.preventDefault();
          clearSearch(true);
        }
      });
    }
    if (searchForm) {
      searchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        state.q = searchInput ? searchInput.value : "";
        state.tokens = tokensOf(state.q);
        applyFilters();
        scrollToProjects();
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", function () { clearSearch(true); });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", function () { resetFilters(); });
    }
    var resetLink = document.querySelector("[data-action='reset']");
    if (resetLink) {
      resetLink.addEventListener("click", function (e) { e.preventDefault(); resetFilters(); });
    }

    document.querySelectorAll("[data-hot]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var q = btn.getAttribute("data-hot") || "";
        if (searchInput) searchInput.value = q;
        state.q = q;
        state.tokens = tokensOf(q);
        applyFilters();
        scrollToProjects();
      });
    });

    if (categoryGrid) {
      categoryGrid.innerHTML = CATEGORIES.map(function (category) {
        var count = projects.filter(function (p) { return p.category === category; }).length;
        if (!count) return "";
        return '<button class="category-card reveal is-in" type="button" data-category-entry="' + escapeHtml(category) + '">' +
          '<span class="category-name">' + escapeHtml(category) + "</span>" +
          '<span class="category-count">' + count + " 个项目</span>" +
          "</button>";
      }).join("");
      categoryGrid.addEventListener("click", function (e) {
        var card = e.target.closest("[data-category-entry]");
        if (!card) return;
        state.cat = card.getAttribute("data-category-entry");
        if (filters) {
          Array.prototype.forEach.call(filters.children, function (btn) {
            btn.classList.toggle("is-active", btn.getAttribute("data-filter") === state.cat);
          });
        }
        applyFilters();
        scrollToProjects();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      var tag = (e.target && e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || (e.target && e.target.isContentEditable)) return;
      if (!searchInput) return;
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    });
  }

  function clearSearch(focus) {
    if (!searchInput) return;
    searchInput.value = "";
    state.q = "";
    state.tokens = [];
    applyFilters();
    if (focus) searchInput.focus({ preventScroll: true });
  }

  function resetFilters() {
    state.q = "";
    state.tokens = [];
    state.cat = "all";
    state.lang = "all";
    state.type = "all";
    state.status = "all";
    state.diff = "all";
    state.sort = "relevance";
    if (searchInput) searchInput.value = "";
    if (filters) {
      Array.prototype.forEach.call(filters.children, function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-filter") === "all");
      });
    }
    if (langSelect) langSelect.value = "all";
    if (typeSelect) typeSelect.value = "all";
    if (statusSelect) statusSelect.value = "all";
    if (diffSelect) diffSelect.value = "all";
    if (sortSelect) sortSelect.value = "relevance";
    applyFilters();
  }

  function scrollToProjects() {
    var target = document.getElementById("projects");
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: top, behavior: prefersReduced ? "auto" : "smooth" });
  }

  /* ---------- 统计 / 推荐 / 最近 ---------- */
  function renderStats() {
    var languages = [];
    var categories = [];
    var verified = 0;
    projects.forEach(function (p) {
      p.languages.forEach(function (l) { if (languages.indexOf(l) === -1) languages.push(l); });
      if (categories.indexOf(p.category) === -1) categories.push(p.category);
      if (p.runStatus !== "not-tested") verified += 1;
    });
    document.querySelectorAll("[data-stat-projects]").forEach(function (el) { el.textContent = projects.length; });
    document.querySelectorAll("[data-stat-categories]").forEach(function (el) { el.textContent = categories.length; });
    document.querySelectorAll("[data-stat-languages]").forEach(function (el) { el.textContent = languages.length; });
    document.querySelectorAll("[data-stat-verified]").forEach(function (el) { el.textContent = verified; });
  }

  function renderPicks() {
    if (featuredList) {
      var picks = projects.filter(function (p) { return p.featured; }).slice(0, 3);
      featuredList.innerHTML = picks.map(function (p) {
        return '<a class="pick-card tone-' + escapeHtml(p.tone) + '" href="' + detailHref(p) + '">' +
          '<span class="pick-title">' + escapeHtml(p.name) + "</span>" +
          '<span class="pick-summary">' + escapeHtml(p.summary) + "</span>" +
          '<span class="pick-meta">' + escapeHtml(p.category) + (p.languages.length ? " · " + escapeHtml(p.languages[0]) : "") + "</span>" +
          "</a>";
      }).join("");
    }
    if (recentList) {
      var recent = projects.slice().sort(function (a, b) {
        return String(b.addedAt).localeCompare(String(a.addedAt));
      }).slice(0, 6);
      recentList.innerHTML = recent.map(function (p) {
        return '<li><a href="' + detailHref(p) + '"><span class="recent-name">' + escapeHtml(p.name) + "</span>" +
          '<span class="recent-cat">' + escapeHtml(p.category) + "</span></a></li>";
      }).join("");
    }
  }

  /* ---------- 滚动渐显 ---------- */
  function setupReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal:not(.is-in)"));
    function revealAll() { items.forEach(function (el) { el.classList.add("is-in"); }); }
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealAll();
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });
    items.forEach(function (el) { observer.observe(el); });
    window.setTimeout(revealAll, 2400);
  }

  /* ---------- 订阅 ---------- */
  function setupSubscribe() {
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
        var subject = "订阅《开源拾遗》";
        var body = "你好，我想订阅开源拾遗的更新。\n\n我的邮箱：" + value + "\n\n（直接发送这封邮件即可）";
        window.location.href = "mailto:" + CONTACT_EMAIL +
          "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
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
  }

  /* ---------- 启动 ---------- */
  readUrl();
  setupControls();
  renderStats();
  renderPicks();
  setupReveal();
  setupSubscribe();
  applyFilters();

  if (state.tokens.length || state.cat !== "all" || state.lang !== "all" ||
      state.type !== "all" || state.status !== "all" || state.diff !== "all") {
    window.setTimeout(scrollToProjects, 120);
  }
})();
