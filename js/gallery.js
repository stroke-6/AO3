// Shared script for the images/*-Illustrations/index.html galleries.
// Lists the folder through the GitHub API, so new images show up after a push
// without editing any page. The folder name comes from <body data-folder="...">.
(function () {
  var folder = document.body.getAttribute("data-folder");
  var api = "https://api.github.com/repos/stroke-6/AO3/contents/images/" + folder;
  var grid = document.getElementById("grid");
  var count = document.getElementById("count");
  var filter = document.getElementById("filter");
  var box = document.getElementById("lightbox");
  var boxImg = box.querySelector("img");
  var boxCap = box.querySelector(".caption");
  var files = [];
  var shown = [];
  var current = -1;

  function status(text) {
    grid.innerHTML = "";
    var p = document.createElement("p");
    p.className = "status";
    p.textContent = text;
    grid.appendChild(p);
  }

  function render() {
    var q = filter.value.trim().toLowerCase();
    shown = files.filter(function (name) { return name.toLowerCase().indexOf(q) !== -1; });
    count.textContent = shown.length === files.length
      ? files.length + " images"
      : shown.length + " of " + files.length;
    if (!shown.length) { status("Nothing matches that."); return; }
    grid.innerHTML = "";
    shown.forEach(function (name, i) {
      var a = document.createElement("a");
      a.className = "tile";
      a.href = encodeURIComponent(name);
      a.innerHTML = '<div class="thumb"><img loading="lazy" alt=""></div><div class="name"></div>';
      a.querySelector("img").src = encodeURIComponent(name);
      a.querySelector(".name").textContent = name;
      a.title = name;
      a.addEventListener("click", function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        open(i);
      });
      grid.appendChild(a);
    });
  }

  function open(i) {
    current = (i + shown.length) % shown.length;
    var name = shown[current];
    boxImg.src = encodeURIComponent(name);
    boxCap.innerHTML = "";
    var link = document.createElement("a");
    link.href = encodeURIComponent(name);
    link.target = "_blank";
    link.textContent = name;
    boxCap.appendChild(link);
    boxCap.appendChild(document.createTextNode("  ·  " + (current + 1) + " / " + shown.length));
    box.classList.add("open");
  }

  function close() {
    box.classList.remove("open");
    boxImg.removeAttribute("src");
    current = -1;
  }

  box.querySelector(".close").addEventListener("click", close);
  box.querySelector(".prev").addEventListener("click", function () { open(current - 1); });
  box.querySelector(".next").addEventListener("click", function () { open(current + 1); });
  box.addEventListener("click", function (e) { if (e.target === box) close(); });
  document.addEventListener("keydown", function (e) {
    if (current < 0) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") open(current - 1);
    else if (e.key === "ArrowRight") open(current + 1);
  });
  filter.addEventListener("input", render);

  status("Loading…");
  fetch(api)
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (list) {
      files = list
        .filter(function (f) { return f.type === "file" && /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(f.name); })
        .map(function (f) { return f.name; })
        .sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
      render();
    })
    .catch(function () {
      status("Couldn't load the image list (GitHub allows 60 lookups an hour — try again in a bit).");
    });
})();
