function preview(input) {
  const videoPreview = document.getElementById("videoPreview");
  const file = input.files[0];

  if (file) {
    const objectURL = URL.createObjectURL(file);
    videoPreview.src = objectURL;
  }
}
