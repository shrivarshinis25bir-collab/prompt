/* ================================
   MOBILE SIDEBAR
================================ */

const sidebar = document.querySelector(".sidebar");
const menuButton = document.querySelector(".menu-button");

if (menuButton) {

    menuButton.addEventListener("click", function () {

        sidebar.classList.toggle("open");

    });

}


/* ================================
   MODULE CARD INTERACTION
================================ */

const moduleCards =
    document.querySelectorAll(".module-card");


moduleCards.forEach(function (card) {

    card.addEventListener("click", function () {

        moduleCards.forEach(function (item) {

            item.classList.remove("selected");

        });

        card.classList.add("selected");

    });

});


/* ================================
   SUMMARY CARD INTERACTION
================================ */

const summaryCards =
    document.querySelectorAll(".summary-card");


summaryCards.forEach(function (card) {

    card.addEventListener("mouseenter", function () {

        card.style.cursor = "pointer";

    });

});


/* ================================
   VIDEO FALLBACK
================================ */

const heroVideo =
    document.querySelector(".hero-video");


if (heroVideo) {

    heroVideo.addEventListener("error", function () {

        heroVideo.style.display = "none";

    });

}