//    0. SHARED HELPERS
//    CONCEPT: arrow functions, querySelector / querySelectorAll,
//    and "feature detection" for the reduced-motion setting.

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Navbar mobile menu

const menuToggle = $("#menuToggle");
const navbar = $("#navbar");

function setMenu(open) {
    navbar.classList.toggle("active", open);  // 2nd argument forces on/off
    menuToggle.setAttribute("aria-expanded", open);
    menuToggle.setAttribute("aria-label", open? "Close navigation menu" : "Open navigation menu");
}

menuToggle.addEventListener("click", () => setMenu(!navbar.classList.contains("active")));

// Close the menu after tapping a link
$$("a", navbar).forEach((link) => link.addEventListener("click", () => setMenu(false)));

// --- 1b. Shrinking header, progress bar and back-to-top button ---
// One scroll listener drives three effects. Fewer listeners = better performance.
const siteHeader = $("#siteHeader");
const progressBar = $("#scrollProgress");
const backToTop = $("#backToTop");

function onScroll() {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  siteHeader.classList.toggle("scrolled", scrollTop > 50);
  backToTop.classList.toggle("show", scrollTop > 600);
  progressBar.style.width = `${(scrollTop / maxScroll) * 100}%`; // template literal
}

// { passive: true } tells the browser we won't block scrolling, so it stays smooth
window.addEventListener("scroll", onScroll, { passive: true });
onScroll(); // run once on load so the state is right if the page opens mid-scroll

backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// --- 1c. Highlight the nav link of the section currently on screen ---
// CONCEPT: IntersectionObserver. The browser tells you when an element enters
// or leaves the viewport, with no scroll maths needed.
const navLinks = $$("a", navbar);
const sections = $$("main section[id]");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.toggle("active-link", link.getAttribute("href") === `#${entry.target.id}`);
        });
      }
    });
  },
  { rootMargin: "-40% 0px -55% 0px" } // "on screen" = crossing a thin band in the middle
);

sections.forEach((section) => sectionObserver.observe(section));

/* ----------------------------------------------------------
   2. HERO
   CONCEPTS: async-style timing with setTimeout, arrays, string slicing,
   mouse events (mousemove / mouseleave), event.clientX, getBoundingClientRect.
   ---------------------------------------------------------- */

// --- 2a. Typing effect ---
const typedText = $("#typedText");
const words = ["More.", "Faster.", "Together.", "Smarter."];
let wordIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
  const word = words[wordIndex];

  // slice(0, n) gives the first n letters, so growing n "types", shrinking n "deletes"
  charIndex += deleting ? -1 : 1;
  typedText.textContent = word.slice(0, charIndex);

  let delay = deleting ? 60 : 110;

  if (!deleting && charIndex === word.length) {
    deleting = true;
    delay = 1400; // pause on the finished word
  } else if (deleting && charIndex === 0) {
    deleting = false;
    wordIndex = (wordIndex + 1) % words.length; // % wraps back to 0 at the end
    delay = 400;
  }

  setTimeout(typeLoop, delay);
}

if (prefersReducedMotion) {
  typedText.textContent = words[0]; // no animation for people who asked for less motion
} else {
  typeLoop();
}

// --- 2b. Hero image tilts toward the mouse (3D tilt) ---
const heroSection = $("#home");
const heroImg = $("#heroImage img");

heroSection.addEventListener("mousemove", (e) => {
  if (prefersReducedMotion) return;
  const rect = heroImg.getBoundingClientRect();
  // Distance of the mouse from the image centre, scaled to roughly -1 .. +1
  const x = (e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
  const y = (e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
  heroImg.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
});

heroSection.addEventListener("mouseleave", () => {
  heroImg.style.transform = "rotateY(0) rotateX(0)";
});

// --- 2c. Ripple effect on buttons ---
// CONCEPT: creating elements with JS (createElement), event.target vs currentTarget,
// and removing them again so the DOM doesn't fill up with junk.
$$(".btn, .zoho-one-btn").forEach((button) => {
  button.addEventListener("click", (e) => {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    button.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });
});


/* ----------------------------------------------------------
   3. ABOUT
   CONCEPTS: scroll-reveal with IntersectionObserver (reused for all
   sections), progressive enhancement, mouse-follow 3D tilt on cards.
   ---------------------------------------------------------- */

// --- 3a. Scroll reveal. Used by About, Products, Values, Stats and more. ---
// We add the .reveal class from JS (not HTML) on purpose. If JS fails to load,
// nothing is hidden. That idea is called PROGRESSIVE ENHANCEMENT.
const revealTargets = $$(
  ".section-heading, .about-card, .product-card, .zoho-one-content, .value-card, .stats-heading, .stat-card"
);

revealTargets.forEach((el, i) => {
  el.classList.add("reveal");
  // Stagger siblings: each card in a row waits a little longer than the previous one
  const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal") || revealTargets.includes(c));
  el.style.transitionDelay = `${siblings.indexOf(el) * 0.12}s`;
});

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add("visible");
      observer.unobserve(el); // reveal once, then stop watching (saves work)

      // After the animation, remove helper classes so the card's own hover
      // transitions work normally again.
      setTimeout(() => {
        el.classList.remove("reveal", "visible");
        el.style.transitionDelay = "";
      }, 2000); // longer than the biggest stagger delay + transition time
    });
  },
  { threshold: 0.15 } // fire when 15% of the element is visible
);

revealTargets.forEach((el) => revealObserver.observe(el));

// --- 3b. 3D tilt on the About cards ---
$$(".about-card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    if (prefersReducedMotion) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 .. +0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-8px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});


/* ----------------------------------------------------------
   4. PRODUCTS
   CONCEPTS: the "state" idea (variables that describe the UI), input event,
   data-* attributes (dataset), Array methods, one render function that
   rebuilds the view from state, debouncing, event delegation.
   ---------------------------------------------------------- */
const searchInput = $("#productSearch");
const filterButtons = $$(".filter-btn");
const productCards = $$(".product-card");
const productCount = $("#productCount");
const productContainer = $("#productContainer");

// STATE: the only two things that decide which cards show
let activeFilter = "all";
let searchTerm = "";

// RENDER: always recompute from state. This is how React/Vue think too.
function renderProducts() {
  let visible = 0;

  productCards.forEach((card) => {
    const matchesCategory = activeFilter === "all" || card.dataset.category === activeFilter;
    const title = $("h3", card).textContent.toLowerCase();
    const description = $("p", card).textContent.toLowerCase();
    const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);

    const show = matchesCategory && matchesSearch;
    card.classList.toggle("hidden", !show);
    if (show) visible++;
  });

  productCount.textContent =
    visible === 0
      ? "No apps found. Try a different word or category."
      : `Showing ${visible} of ${productCards.length} apps`;
}

// Debounce: wait until the user stops typing for 200ms before doing work.
function debounce(fn, wait = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

searchInput.addEventListener(
  "input",
  debounce(() => {
    searchTerm = searchInput.value.trim().toLowerCase();
    renderProducts();
  })
);

// EVENT DELEGATION: one listener on the parent instead of one per button
$(".product-filters").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return; // click wasn't on a button

  activeFilter = btn.dataset.filter;
  filterButtons.forEach((b) => b.classList.toggle("active", b === btn));
  renderProducts();
});

renderProducts(); // initial paint

/* ----------------------------------------------------------
   5. COUNT-UP NUMBERS (used by Zoho One and Stats)
   CONCEPTS: requestAnimationFrame, easing functions, parseInt,
   reading data-* attributes, reusing one observer for many elements.
   ---------------------------------------------------------- */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || "";
  const duration = 1800; // ms
  const start = performance.now();

  if (prefersReducedMotion) {
    el.textContent = target + suffix;
    return;
  }

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1); // 0 .. 1
    const eased = 1 - Math.pow(1 - progress, 3);            // easeOutCubic: fast start, soft landing
    el.textContent = Math.round(target * eased) + suffix;

    if (progress < 1) requestAnimationFrame(frame);          // ask for the next frame
  }

  requestAnimationFrame(frame);
}

const counterObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);

$$(".counter").forEach((el) => counterObserver.observe(el));

/* ----------------------------------------------------------
   6. ZOHO ONE
   CONCEPTS: parallax (moving background with scroll), CSS custom
   properties set from JS, linear interpolation of a value.
   ---------------------------------------------------------- */
const zohoOne = $("#zoho-one");

window.addEventListener(
  "scroll",
  () => {
    if (prefersReducedMotion) return;
    const rect = zohoOne.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return; // off screen, skip

    // How far through the section are we? 0 (just entering) .. 1 (just leaving)
    const progress = 1 - (rect.bottom / (window.innerHeight + rect.height));
    zohoOne.style.backgroundPosition = `${progress * 40}px ${progress * -60}px, ${progress * -40}px ${progress * 60}px, 0 0`;
  },
  { passive: true }
);

/* ----------------------------------------------------------
   7. VALUES
   CONCEPTS: toggling state on click, "only one active" pattern,
   keyboard accessibility (tabindex, role, keydown).
   ---------------------------------------------------------- */
const valueCards = $$(".value-card");

function selectValue(card) {
  const alreadyOn = card.classList.contains("highlighted");
  valueCards.forEach((c) => c.classList.remove("highlighted")); // clear all
  if (!alreadyOn) card.classList.add("highlighted");             // click again to turn off
}

valueCards.forEach((card) => {
  // Make the cards usable with the keyboard too, not only the mouse
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");

  card.addEventListener("click", () => selectValue(card));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); // stop the space bar from scrolling the page
      selectValue(card);
    }
  });
});

/* ----------------------------------------------------------
   8. FOOTER
   CONCEPTS: form submit event, preventDefault, regular expressions,
   input validation, Date object, giving user feedback in the UI.
   ---------------------------------------------------------- */

// Current year, so you never edit the copyright by hand again
$("#year").textContent = new Date().getFullYear();

const newsletterForm = $("#newsletterForm");
const emailInput = $("#newsletterEmail");
const formMessage = $("#formMessage");

// A simple email pattern: something@something.something (no spaces)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = `form-message ${type}`;
  emailInput.classList.toggle("invalid", type === "error");
}

newsletterForm.addEventListener("submit", (e) => {
  e.preventDefault(); // stop the browser from reloading the page

  const email = emailInput.value.trim();

  if (email === "") {
    showMessage("Please enter your email address.", "error");
  } else if (!emailPattern.test(email)) {
    showMessage("That doesn't look like a valid email.", "error");
  } else {
    // A real site would send this to a server with fetch(). Here we just simulate it.
    showMessage(`Thanks! We'll write to ${email} soon.`, "success");
    newsletterForm.reset();
  }
});

// Clear the red error state as soon as the user starts fixing the input
emailInput.addEventListener("input", () => {
  emailInput.classList.remove("invalid");
});