const allowed_image_filetypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'];
const allowed_other_filetypes = ['application/pdf', 'image/heic', 'image/heif'];



function downloadBlob(blob, type) {
  // Convert your blob into a Blob URL (a special url that points to an object in the browser's memory)
  const blobUrl = blob;

  // Create a link element
  const link = document.createElement("a");

  // Set link's href to point to the Blob URL
  link.href = blobUrl;

  if(type === "zip") {
    link.download = 'bitfuul-images.zip';
    link.href = window.URL.createObjectURL(blobUrl);
  } else {
    link.download = 'bitfuul-image.' + getDom('filetype').value;
    link.href = blobUrl;
  }

  // Append link to the body
  document.body.appendChild(link);

  // Dispatch click event on the link
  // This is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
  );
  // Remove link from body
  document.body.removeChild(link);
}

function addPngOptimizer() {

  if (getDom("filetype").value === "png") {
    getDom("optimize_png").classList.remove("display_equals_none");
    getDom("optimize_png").classList.add("display_equals_block");
  }

  getDom("filetype").addEventListener("change", function() {
      if (getDom("filetype").value === "png") {
        getDom("optimize_png").classList.remove("display_equals_none");
        getDom("optimize_png").classList.add("display_equals_block");
      } else {
        getDom("optimize_png").classList.add("display_equals_none");
        getDom("optimize_png").classList.remove("display_equals_block");
      }
  });
}

function addJpgOptimizer() {
  if (getDom("filetype").value === "jpg") {
    getDom("optimize_jpg").classList.remove("display_equals_none");
    getDom("optimize_jpg").classList.add("display_equals_block");
  }

  getDom("filetype").addEventListener("change", function() {
      if (getDom("filetype").value === "jpg") {
        getDom("optimize_jpg").classList.remove("display_equals_none");
        getDom("optimize_jpg").classList.add("display_equals_block");
      } else {
        getDom("optimize_jpg").classList.add("display_equals_none");
        getDom("optimize_jpg").classList.remove("display_equals_block");
      }
  });
  handleJpgCompression();
}

function handleJpgCompression() {
  getDom("jpg_option_quality").addEventListener('input', function (evt) {
    if(getDom("jpg_option_filesize").value !== "") {
      getDom("jpg_option_filesize").value = "";
    }

  });

  getDom("jpg_option_filesize").addEventListener('input', function (evt) {
    if(getDom("jpg_option_quality").value !== "") {
      getDom("jpg_option_quality").value = "";
    }
  });
}

let bulkToolsLoaded = false;
let script_bulkJobsLoaded = false;
async function loadBulkTools() {
  getDom("bulk_panel").style.display = "block";
  if(bulkToolsLoaded === false) {
    if(script_bulkJobsLoaded === false) {
      await load_script_promise('https://cdn.jsdelivr.net/gh/testcopy125/image-resizer/bulkjob-js1.js', 'module');
      script_bulkJobsLoaded = true;
    }
    addPngOptimizer();
    addJpgOptimizer();
    bulkToolsLoaded = true;
  }
}

function bulkResizeHeight() {
  getDom("resize_width").style.display = "none";
  getDom("resize_height").style.display = "block";
  getDom("options_width").value = "";
  getDom("message_autoheight").style.display = "block";
  getDom("message_autowidth").style.display = "block";
  getDom("resize_none").style.display = "none";

}

function bulkResizeWidth() {
  getDom("resize_width").style.display = "block";
  getDom("resize_height").style.display = "none";

  getDom("options_height").value = "";
  getDom("message_autoheight").style.display = "block";
  getDom("message_autowidth").style.display = "block";
  getDom("resize_none").style.display = "none";

}

function bulkResizeCustom() {
  getDom("resize_width").style.display = "block";
  getDom("resize_height").style.display = "block";
  getDom("message_autoheight").style.display = "none";
  getDom("message_autowidth").style.display = "none";
  getDom("resize_none").style.display = "none";
}

function bulkResizeNone() {
  getDom("resize_width").style.display = "none";
  getDom("resize_height").style.display = "none";
  getDom("resize_none").style.display = "block";

  getDom("options_height").value = "";
  getDom("options_width").value = "";
}
