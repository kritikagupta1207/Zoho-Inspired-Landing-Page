// Navbar mobile menu

const menuToggle = document.getElementById("menuToggle");
const navbar = document.getElementById("navbar");

console.dir(menuToggle);

menuToggle.addEventListener("click", ()=> {
    navbar.classList.toggle("active");

    const isOpen = navbar.classList.contains("active");

    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.setAttribute("aria-label", isOpen? "Close navigation menu" : "Open navigation menu");
});

// close menu after clicking a navigation link

const navLinks = navbar.querySelectorAll("a");

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        navbar.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
    });
});