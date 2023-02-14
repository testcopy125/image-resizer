//import * as Magick from 'https://cdn.jsdelivr.net/npm/wasm-imagemagick/dist/bundles/magickApi.js';
import * as Magick from 'https://cdn.jsdelivr.net/npm/wasm-imagemagick/dist/bundles/magickApi.js';
// import * as Magick from '/wp-content/plugins/imagetools/inc/libraries/magickApi.js';

let script_imageCompression_loaded = false;
let script_jszip_loaded = false;


let ExecuteBulkJobs = async function () {
  getDom('download_image').innerText = "Loading...";
  getDom('download_image').disabled = true;

  let pngCompressionOptions;
  const new_width   = getDom('options_width').value;
  const new_height  = getDom('options_height').value;;



  let command = [];

  if(new_width !== "" && new_height === "") {
    command.push('-resize', new_width);
  } else if(new_height !== "" && new_width === "") {
    command.push('-resize', 'x' + new_height);
  } else if(new_width !== "" && new_height !== "") {
    command.push('-resize', new_width + 'x' + new_height + '!');
  }

  if(getDom("filetype").value === "png") {
    if(getDom("png_option_strip").checked === true) {
      command.push('-strip');
    }
    if(getDom("png_option_removealpha").checked === true) {
      command.push('-alpha', 'remove');
    }
    if(getDom("png_option_compress").checked === true) {
      pngCompressionOptions = {
          //maxSizeMB: 2,          // (default: Number.POSITIVE_INFINITY)
          //maxWidthOrHeight: number,   // compressedFile will scale down by ratio to a point that width or height is smaller than maxWidthOrHeight (default: undefined)
          //onProgress: Function,       // optional, a function takes one progress argument (percentage from 0 to 100)
          useWebWorker: true,      // optional, use multi-thread web worker, fallback to run in main-thread (default: true)

          // following options are for advanced users
          maxIteration: 10,       // optional, max number of iteration to compress the image (default: 10)
          //exifOrientation: number,    // optional, see https://stackoverflow.com/a/32490603/10395024
          fileType: "image/png",           // optional, fileType override
          initialQuality: 1      // optional, initial quality value between 0 and 1 (default: 1)
      }
      if(getDom("png_option_compress_maximumfilesize").value !== "0" && getDom("png_option_compress_maximumfilesize").value !== "" && getDom("png_option_compress_maximumfilesize").value !== undefined) {
        pngCompressionOptions.maxSizeMB = parseInt(getDom("png_option_compress_maximumfilesize").value) / 1024;
      }

    }
  }

  if(getDom("filetype").value === "jpg") {
    command.push('-sampling-factor', '4:2:0');
    command.push('-strip');
    command.push('-interlace', 'JPEG');
    command.push('-colorspace', 'sRGB');

    if(getDom("jpg_option_quality").value !== "") {
      command.push('-quality', getDom("jpg_option_quality").value);
    }

    if(getDom("jpg_option_filesize").value !== "") {
      command.push('-define', 'jpeg:extent=' + getDom("jpg_option_filesize").value + 'kb');
    }
  }

  let processedFiles;
  let arrayBuffer;
  let sourceBytes;
  let new_filename;
  let magickCommand = [];
  let files = [];


  if(script_jszip_loaded === false && getDom("save_as_zip").checked === true) {
    await load_script_promise('https://cdn.jsdelivr.net/gh/testcopy125/image-resizer/jszip.js', 'text/javascript');
    script_jszip_loaded = true;
  }

  if(getDom("save_as_zip").checked === true) {
    var zip = await new JSZip();
  }





  for (let i = 0; i < image_files.length; i++) {
    if(image_files[i] !== undefined) {

      new_filename = image_files[i].filename.split('.').slice(0, -1).join('.') + '-resized.' + getDom('filetype').value;

      magickCommand = ["convert", image_files[i].filename].concat(command);

      magickCommand.push(new_filename);

      arrayBuffer = await image_files[i].file.arrayBuffer();

      sourceBytes = new Uint8Array(arrayBuffer);

      files = [{ 'name': image_files[i].filename, 'content': sourceBytes }];

      //console.log(magickCommand);

      processedFiles = await Magick.Call(files, magickCommand);

      if(getDom("png_option_compress").checked === true && getDom("filetype").value === "png") {

        if(script_imageCompression_loaded === false) {
          await load_script_promise('/wp-content/plugins/imagetools/inc/libraries/browser-image-compression.js', 'module');
          script_imageCompression_loaded = true;
        }

        await imageCompression(processedFiles[0].blob.slice(0, processedFiles[0].blob.size, "image/png"), pngCompressionOptions).then(function (output) {
          if(getDom("save_as_zip").checked === true) {
            zip.file(new_filename, output);
          } else {
            downloadBlob(URL.createObjectURL(output));
          }
        });
      } else {
        if(getDom("save_as_zip").checked === true) {
          await zip.file(new_filename, processedFiles[0].blob);
        } else {
          downloadBlob(URL.createObjectURL(processedFiles[0].blob));
        }
      }
    }
  }

  if(getDom("save_as_zip").checked === true) {
    zip.generateAsync({type:"blob"}).then(function(content) {
      downloadBlob(content, "zip");
    });
  }

  getDom('download_image').disabled = false;
  getDom('download_image').innerText = "Process and Download";

};

document.getElementById("download_image").addEventListener("click", function() {
  if (processing_status.includes(false)) {
    alert('Please wait until all images are loaded. No image should have the "Loading..." status your filelist.')
  } else {
    ExecuteBulkJobs();
  }
});
