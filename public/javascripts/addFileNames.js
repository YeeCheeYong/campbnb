function previewMultiple(event) {
  // select imgPreview div where imgs will be displayed:
  const imgPreview = document.querySelector("#imgPreview");
  // clear previous images:
  imgPreview.innerHTML = "";
  // loop over files and add to imgPreview div:
  for (i = 0; i < event.target.files.length; i++) {
    const urls = URL.createObjectURL(event.target.files[i]);
    const fileName = event.target.files[i].name;
    imgPreview.innerHTML += `<figure class="figure mt-2 col-4 col-lg-3">
<img class="img-thumbnail" src="${urls}"><figcaption class="figure-caption">${fileName}</figcaption></figure>
`;
  }
}

// Listens for a change on file input and if there is a change, calls preview function
document.querySelector("#imgUpload").addEventListener("change", (ev) => {
  if (!ev.target.files) return; // Do nothing.
  previewMultiple(ev);
});
//my rewrite
// const a = document.querySelector('#imgUpload');
// a.addEventListener('change', b)
// const c = document.querySelector('#imgPreview')
// function b(event) {
//   if(!event.target.files)return;
//   c.innerHTML = "";
//   for (i = 0; i < event.target.files.length; i++) {
//     const url = URL.createObjectURL(event.target.files[i])
//     const filename = event.target.files[i].name;
//     c.innerHTML += `<figure class="figure mt-2 col-3 col-lg-3">
//     <img class="img-thumbnail" src="${url}">
//     <figcaption class="figure-caption">${filename}</figcaption></figure>`;
//   }
// }
