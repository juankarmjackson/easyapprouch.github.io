function toggleCodigo() {
    var codigo = document.getElementById("codigo");
    if (codigo.style.display === "none") {
        codigo.style.display = "block";
    } else {
        codigo.style.display = "none";
    }
}


document.addEventListener("DOMContentLoaded", function () {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
});
