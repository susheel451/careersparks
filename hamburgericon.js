console.log("script loaded");

var hamburger_icon = document.getElementById("hamburger-icon");
hamburger_icon.onclick = function iconclicked() {
    var navbar = document.getElementById("nav-all-items");
    console.log("click");
    if (navbar.className === "nav-all-items") {
        navbar.className += "responsive";
      } else {
        navbar.className = "nav-all-items";
      }
}