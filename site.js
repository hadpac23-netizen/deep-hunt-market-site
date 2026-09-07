document.querySelectorAll(".package-select").forEach(button => {
  button.addEventListener("click", () => {
    const select = document.querySelector("#package-select");
    if (select) select.value = button.dataset.package;
  });
});