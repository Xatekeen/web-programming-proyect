/* ── Utility bar address ──────────────────────────────────────── */
const utilityTitle = document.querySelector(".utility-inner > span");
if (utilityTitle) utilityTitle.textContent = "209 Neungdong-ro, Gwangjin-gu, Seoul 05006";

/* ── Theme (dark mode) ────────────────────────────────────────── */
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.dataset.theme = savedTheme;

const darkBtn = document.createElement("button");
darkBtn.className = "text-button dark-icon";
darkBtn.id = "darkToggle";
darkBtn.setAttribute("aria-label", "Toggle dark mode");
document.querySelector(".utility-inner nav")?.prepend(darkBtn);

darkBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
});

/* ── Korean translations ──────────────────────────────────────── */
const heroKo = {
  home:       { eyebrow: "서울의 세계 창의 대학교",  h1: "세종대학교",                          sub: "과감한 창의성과 국제적 개방성으로 새로운 경계를 개척하는 학생들을 위한 집입니다." },
  about:      { eyebrow: "프로젝트 소개",            h1: "완전한 웹 경험으로 세종대학교를 소개합니다", sub: "이 프로젝트의 목표는 수업에서 배운 핵심 도구를 실습하면서 대학 웹페이지를 재현하는 것입니다." },
  academics:  { eyebrow: "학사",                    h1: "글로벌 커리어를 위한 학습 경로",           sub: "학문적 콘텐츠는 빠른 검색과 쉬운 탐색을 위해 명확한 프로그램 그룹으로 구성됩니다." },
  admissions: { eyebrow: "입학",                    h1: "관심에서 입학까지",                      sub: "이 페이지는 요건, 단계, 문의 양식이 포함된 완전한 사용자 워크플로우를 보여줍니다." },
  research:   { eyebrow: "연구",                    h1: "측정 가능한 영향력을 갖춘 혁신",           sub: "애니메이션 카운터와 연구 카드로 JavaScript 및 레이아웃 완성도를 보여줍니다." },
  news:       { eyebrow: "뉴스",                    h1: "캠퍼스 소식 및 공지사항",                 sub: "이 페이지는 공지사항, 이벤트, 연구 스토리를 위한 필터 가능한 콘텐츠 카드를 보여줍니다." },
  life:       { eyebrow: "세종 라이프",              h1: "학생 서비스, 캠퍼스 지원 및 일상생활",     sub: "이 페이지는 국제 학생을 위한 실용적인 링크와 함께 실제 사이트의 학생 생활 카테고리를 반영합니다." },
  contact:    { eyebrow: "연락처",                  h1: "대학교 방문 및 연락",                     sub: "연락처 정보는 사이트를 완성하고 재현물이 실제 대학 웹 경험처럼 느껴지게 합니다." },
};

const navKo = { About: "소개", Academics: "학사", Admissions: "입학", Research: "연구", Life: "학교생활", News: "뉴스", Helper: "도우미" };
const navEn = {};

let isKorean = false;

const menuToggle = document.querySelector("#menuToggle");
const primaryNav = document.querySelector("#primaryNav");
const openSearch = document.querySelector("#openSearch");
const searchDialog = document.querySelector("#searchDialog");
const siteSearch = document.querySelector("#siteSearch");
const searchResults = document.querySelector("#searchResults");
const languageToggle = document.querySelector("#languageToggle");
const inquiryForm = document.querySelector("#inquiryForm");
const formStatus = document.querySelector("#formStatus");
const backTop = document.querySelector("#backTop");

const sidebarGroups = [
  {
    title: "About Sejong",
    links: [
      { label: "Vision", href: "about.html" },
      { label: "Message from the President", href: "about.html" },
      { label: "Brief History", href: "about.html" },
      { label: "Organization", href: "about.html" },
      { label: "Campus Map", href: "contact.html" },
      { label: "Sejong Story", href: "news.html" }
    ]
  },
  {
    title: "Research",
    links: [
      { label: "Research News", href: "research.html" },
      { label: "Researchers Portal", href: "research.html" },
      { label: "AI Research", href: "research.html" },
      { label: "International Collaboration", href: "research.html" }
    ]
  },
  {
    title: "Academics",
    links: [
      {
        label: "Undergraduate",
        href: "academics.html",
        children: ["Liberal Arts", "Social Sciences", "Business & Economics", "Hospitality & Tourism", "Natural Sciences", "Life Science", "AI Convergence", "Engineering", "Arts & Physical Education"]
      },
      {
        label: "Graduate",
        href: "academics.html",
        children: ["Graduate School", "Business", "Public Policy", "Education", "Tourism", "Interdisciplinary Arts", "Industry"]
      },
      { label: "Academic Calendar", href: "academics.html" },
      { label: "English Track and ETC Programs", href: "academics.html" },
      { label: "Faculty Finder", href: "academics.html" }
    ]
  },
  {
    title: "Admissions",
    links: [
      { label: "English Track", href: "admissions.html", children: ["Undergraduate School", "Graduate School of General Studies", "Graduate School of Business"] },
      { label: "Korean Track", href: "admissions.html", children: ["Undergraduate School", "Graduate School", "Special Studies"] },
      { label: "Korean Language Program", href: "admissions.html" },
      { label: "Other Programs", href: "admissions.html" }
    ]
  },
  {
    title: "Life at Sejong",
    links: [
      { label: "Student Life", href: "life.html", children: ["Student Council", "International Student Organizations", "Facilities", "Job", "Parking", "Immigration Issues", "Insurance", "Hospitals", "Club Activity", "Documents", "Student ID Card", "IT Service"] },
      { label: "Notice", href: "news.html" },
      { label: "Guidebook for Students", href: "life.html" },
      { label: "Dormitory", href: "life.html" }
    ]
  },
  {
    title: "Util",
    links: [
      { label: "Search", href: "#search" },
      { label: "Contact", href: "contact.html" },
      { label: "KR / EN", href: "index.html" }
    ]
  }
];

const searchIndex = [
  { title: "Home", text: "Sejong University Seoul global creative university news announcements", href: "index.html" },
  { title: "About Sejong", text: "Vision history founded 1940 Daeyang spirit colleges graduate schools internationalization", href: "about.html" },
  { title: "Admissions", text: "Apply English track Korean track undergraduate graduate language program SISP requirements deadlines", href: "admissions.html" },
  { title: "Academics", text: "Programs Liberal Arts Business AI Convergence Engineering Hospitality Tourism Natural Sciences graduate MBA", href: "academics.html" },
  { title: "Research", text: "Research quality THE rankings institutes partner universities satellite AI battery neuromorphic LLM", href: "research.html" },
  { title: "News & Notices", text: "News events notices career fair alumni ASEAN summer program Yoo Yeon-seok graduation", href: "news.html" },
  { title: "Life at Sejong", text: "Student life dormitory housing clubs facilities IT service visa immigration insurance career jobs", href: "life.html" },
  { title: "Contact", text: "Contact address 209 Neungdong-ro Gwangjin-gu Seoul phone email campus map directions", href: "contact.html" }
];

function renderSidebarLinks(links) {
  return links
    .map((link) => {
      const children = link.children
        ? `<ul>${link.children.map((child) => `<li><a href="${link.href}">${child}</a></li>`).join("")}</ul>`
        : "";
      return `<li><a href="${link.href}">${link.label}</a>${children}</li>`;
    })
    .join("");
}

function createSidebar() {
  const backdrop = document.createElement("div");
  backdrop.className = "sidebar-backdrop";
  backdrop.id = "sidebarBackdrop";

  const sidebar = document.createElement("aside");
  sidebar.className = "site-sidebar";
  sidebar.id = "siteSidebar";
  sidebar.setAttribute("aria-label", "Expanded site navigation");
  sidebar.setAttribute("aria-hidden", "true");
  sidebar.innerHTML = `
    <div class="sidebar-head">
      <a class="brand" href="index.html">
        <span class="brand-mark">S</span>
        <span><strong>SEJONG</strong><small>SITEMAP</small></span>
      </a>
      <button class="sidebar-close" id="sidebarClose" type="button" aria-label="Close expanded menu">x</button>
    </div>
    <div class="sidebar-groups">
      <section class="sidebar-group sidebar-group-helper"><ul><li><a href="sejong-helper/">🧭 Sejong Helper</a></li></ul></section>
      ${sidebarGroups.map((group) => `<section class="sidebar-group"><h2>${group.title}</h2><ul>${renderSidebarLinks(group.links)}</ul></section>`).join("")}
    </div>
  `;

  document.body.append(backdrop, sidebar);
  return { backdrop, sidebar, closeButton: sidebar.querySelector("#sidebarClose") };
}

const sidebarElements = createSidebar();

function openSidebar() {
  sidebarElements.backdrop.classList.add("is-open");
  sidebarElements.sidebar.classList.add("is-open");
  sidebarElements.sidebar.setAttribute("aria-hidden", "false");
  menuToggle.setAttribute("aria-expanded", "true");
  sidebarElements.closeButton.focus();
}

function closeSidebar() {
  sidebarElements.backdrop.classList.remove("is-open");
  sidebarElements.sidebar.classList.remove("is-open");
  sidebarElements.sidebar.setAttribute("aria-hidden", "true");
  menuToggle.setAttribute("aria-expanded", "false");
}

const currentFile = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".primary-nav").forEach((nav) => {
  if (!nav.querySelector('a[href="life.html"]')) {
    const lifeLink = document.createElement("a");
    lifeLink.href = "life.html";
    lifeLink.textContent = "Life";
    const newsLink = nav.querySelector('a[href="news.html"]');
    nav.insertBefore(lifeLink, newsLink);
  }
});

document.querySelectorAll(".primary-nav a").forEach((link) => {
  if (link.getAttribute("href") === currentFile) {
    link.setAttribute("aria-current", "page");
  }
});

function closeMenu() {
  closeSidebar();
}

menuToggle.addEventListener("click", () => {
  openSidebar();
});

sidebarElements.backdrop.addEventListener("click", closeSidebar);
sidebarElements.closeButton.addEventListener("click", closeSidebar);
sidebarElements.sidebar.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    const href = event.target.getAttribute("href");
    closeSidebar();
    if (href === "#search" && openSearch) {
      event.preventDefault();
      openSearch.click();
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSidebar();
  }
});

function renderSearchResults(query = "") {
  const normalized = query.trim().toLowerCase();
  const results = searchIndex.filter((item) => {
    const content = `${item.title} ${item.text}`.toLowerCase();
    return !normalized || content.includes(normalized);
  });

  searchResults.innerHTML = results
    .map((item) => `<li><a href="${item.href}"><strong>${item.title}</strong><br><span>${item.text}</span></a></li>`)
    .join("");
}

if (openSearch && searchDialog && siteSearch && searchResults) {
  openSearch.addEventListener("click", () => {
    renderSearchResults();
    searchDialog.showModal();
    siteSearch.focus();
  });

  siteSearch.addEventListener("input", () => renderSearchResults(siteSearch.value));

  searchResults.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link) {
      searchDialog.close();
    }
  });
}

document.querySelectorAll(".primary-nav a").forEach((link) => {
  navEn[link.textContent.trim()] = link.textContent.trim();
});

function applyTranslation(korean) {
  const page = document.body.dataset.page || "home";
  const hero = document.querySelector(".page-hero, .hero");
  if (hero) {
    const eyebrow = hero.querySelector(".eyebrow");
    const h1 = hero.querySelector("h1");
    const sub = hero.querySelector("p:not(.eyebrow)");
    const ko = heroKo[page];
    if (ko) {
      if (eyebrow) eyebrow.textContent = korean ? ko.eyebrow : eyebrow.dataset.en ?? eyebrow.textContent;
      if (h1)      h1.textContent      = korean ? ko.h1      : h1.dataset.en      ?? h1.textContent;
      if (sub)     sub.textContent     = korean ? ko.sub     : sub.dataset.en     ?? sub.textContent;
      if (!eyebrow?.dataset.en && eyebrow) eyebrow.dataset.en = eyebrow.textContent;
      if (!h1?.dataset.en && h1)           h1.dataset.en      = h1.textContent;
      if (!sub?.dataset.en && sub)         sub.dataset.en     = sub.textContent;
    }
  }

  document.querySelectorAll(".primary-nav a").forEach((link) => {
    const label = link.dataset.en ?? link.textContent.trim();
    if (!link.dataset.en) link.dataset.en = label;
    link.textContent = korean ? (navKo[label] ?? label) : label;
    if (link.getAttribute("aria-current") === "page") link.setAttribute("aria-current", "page");
  });
}

languageToggle.addEventListener("click", () => {
  isKorean = !isKorean;
  languageToggle.textContent = isKorean ? "EN" : "KR";
  languageToggle.setAttribute("aria-label", isKorean ? "Korean preview active — click for English" : "Switch to Korean");
  applyTranslation(isKorean);
});

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    document.querySelectorAll(".news-card").forEach((card) => {
      const shouldShow = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

if (inquiryForm && formStatus) {
  inquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(inquiryForm);
    formStatus.textContent = `Thank you, ${data.get("name")}. Your ${data.get("program")} inquiry is ready for review.`;
    inquiryForm.reset();
  });
}

if ("IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const target = entry.target;
        const finalValue = Number(target.dataset.count);
        const duration = 900;
        const start = performance.now();

        function update(now) {
          const progress = Math.min((now - start) / duration, 1);
          const value = Math.floor(progress * finalValue);
          target.textContent = value.toLocaleString();
          if (progress < 1) {
            requestAnimationFrame(update);
          }
        }

        requestAnimationFrame(update);
        observer.unobserve(target);
      });
    },
    { threshold: 0.4 }
  );

  document.querySelectorAll("[data-count]").forEach((counter) => counterObserver.observe(counter));
} else {
  document.querySelectorAll("[data-count]").forEach((counter) => {
    counter.textContent = Number(counter.dataset.count).toLocaleString();
  });
}

window.addEventListener("scroll", () => {
  backTop.classList.toggle("is-visible", window.scrollY > 500);
});

backTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
