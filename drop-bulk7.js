let imageCount = 0;
var processing_status = [];
function insertRow() {
  processing_status[imageCount] = false;
  var x = getDom('images_to_edit').insertRow(-1);
  x.setAttribute('id', 'imageRow' + imageCount);
  x.insertCell(0).innerHTML = 'Loading...';
  x.insertCell(1).innerHTML = '';
  x.insertCell(2).innerHTML = '';
  return imageCount++;
}

function insertImageToRow(filename, width, height, filesize, imageId) {
  var x = getDom('imageRow' + imageId);
  x.cells[0].innerHTML = filename +" ("+(filesize/1024).toFixed(2)+ "KB)";

  if(width !== "" || height !== "") {
    x.cells[1].innerHTML = width + " x " + height;
  } else {
    x.cells[1].innerHTML = '-';
  }

  x.cells[2].innerHTML = '<a href="javascript:;" onClick="removeImageFromBulk('+ imageId +')">X</a>';
  processing_status[imageId] = true;
}

function removeImageFromBulk (imageId) {
  delete image_files[imageId];
  getDom('imageRow' + imageId).parentNode.removeChild(getDom('imageRow' + imageId));
  if ( image_files.filter(function (el) { return el != null; }).length === 0 ) {
    getDom("bulk_panel").style.display = "none";
  }
}

function removeAllImagesFromBulk () {
  for (var i = 0; i < image_files.length; i++) {
    if(image_files[i] !== undefined) {
      delete image_files[i];
      getDom('imageRow' + i).parentNode.removeChild(getDom('imageRow' + i));
    }
  }
  if ( image_files.filter(function (el) { return el != null; }).length === 0 ) {
    getDom("bulk_panel").style.display = "none";
  }
}

async function upload_file(event_data_transfer) {
    for (var i = 0; i < event_data_transfer.length; i++) {
        //Add files to the selected file list
        if(allowed_image_filetypes.includes(event_data_transfer[i].type)) {
          await filetoImage(event_data_transfer[i], insertRow());
        } else if(allowed_other_filetypes.includes(event_data_transfer[i].type)) {
          if(event_data_transfer[i].type === 'application/pdf') {
            fileToImagePdf(event_data_transfer[i]);
          } else if(event_data_transfer[i].type === 'image/heic' || event_data_transfer[i].type === 'image/heif') {
            heicToImage(event_data_transfer[i], insertRow());
          }
          
        }
    }
    scrollSmoothToElement(getDom('bulk_panel'));
}

function file_explorer() {
  loadBulkTools();
  getDom('uploaded_image').click();
  getDom('uploaded_image').onchange = function() {
    upload_file(getDom("uploaded_image").files);
  };
}

window.addEventListener("drop",function(event) {
  loadBulkTools();
  event.preventDefault();
  upload_file(event.dataTransfer.files);
  getDom("drop_file_zone").classList.remove("green-hover-border");
});

let image_files = [];

function filetoImage(file, imageId) {
  const reader = new FileReader();
  let image = new Image();
  reader.readAsDataURL(file);

  reader.addEventListener("load", async function () {
    image.src = await reader.result;

    image.addEventListener("load", function () {
      insertImageToRow(file.name, image.width, image.height, file.size, imageId);
    }, false);

    image_files.push({
      type: 'image',
      filename: file.name,
      file: file,
      image: image
    });
  }, false);
}

function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

let pdf_script_loaded = false;
async function fileToImagePdf(file, imageId) {

  if(pdf_script_loaded === false) {
    await load_script_promise('https://cdn.jsdelivr.net/npm/pdfjs-dist@2.2.228/build/pdf.min.js', 'text/javascript');
    pdf_script_loaded = true;
  }


  await pdfjsLib.getDocument(URL.createObjectURL(file)).promise.then(async function(doc) {
    let imageIdCount;
    for (let i = 0; i < doc.numPages; i++) {
      if(i === 0) {
        imageIdCount = insertRow();
      } else {
        insertRow();
      }
    }

    for (let i = 0; i < doc.numPages; i++) {
      console.log(imageIdCount);
        // here the value of i was passed into as the argument cntr
        // and will be captured in this function closure so each
        // iteration of the loop can have it's own value
        let image_pagename = file.name + 'page' + (i+1) + '.png';


        let page = await doc.getPage(i + 1);
        let canvas_array = await document.createElement("canvas");

        let context = await canvas_array.getContext("2d");
        let viewport = await page.getViewport({scale:3});
        canvas_array.width = await viewport.width;
        canvas_array.height = await viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).then(async function() {
          await canvas_array.toBlob(async function(blob) {
            let image = await new Image();
            image.src = await canvas_array.toDataURL();

            let imagefile = await dataURLtoFile(canvas_array.toDataURL(), image_pagename);

            image_files[imageIdCount + i] = await {
              type: 'image',
              filename: image_pagename,
              file: imagefile,
              image: image
            };
            await insertImageToRow(image_pagename, image.width, image.height, file.size, imageIdCount + i);
          });
        });
      }



  });
}

let heic_script_loaded = false;
async function heicToImage(file, imageId) {
  if(heic_script_loaded === false) {
    await load_script_promise('https://cdn.jsdelivr.net/gh/testcopy125/image-resizer/h2ic.js', 'text/javascript');
    heic_script_loaded = true;
  }

	var blob = file;
	heic2any({
		blob: file,
		toType: "image/gif",
	})
		.then(async function (resultBlob) {
      let image_filename = file.name + '.gif';
      let image = await new Image();
      image.src = await blobToBase64(resultBlob);
      await blobToBase64(resultBlob).then(res => {
        image.src = res;
      });

      let imagefile = blobToFile(resultBlob, image_filename);


      image_files[imageId] = await {
        type: 'image',
        filename: image_filename,
        file: imagefile,
        image: image
      };
      await insertImageToRow(file.name, image.width, image.height, resultBlob.size, imageId);
		})
		.catch(function (x) {
			alert("Error code: " + x.code + " message: " + x.message);
		});

  //await insert_Row(image_pagename, image.width, image.height, file.size, imageId);

}

function blobToFile(theBlob, fileName){
  theBlob.lastModifiedDate = new Date();
  theBlob.name = fileName;
  return theBlob;
}

const blobToBase64 = blob => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise(resolve => {
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
};


function getDom(domId) {
  return document.getElementById(domId)
}

window.addEventListener("dragover",function(event) {
  event.preventDefault();
  getDom("drop_file_zone").classList.add("green-hover-border");
  return false;
});

window.addEventListener("dragleave",function(event) {
  getDom("drop_file_zone").classList.remove("green-hover-border");
});

function scrollSmoothToElement(elem) {
  window.scroll({
        top: elem.offsetTop,
        left: 0,
        behavior: 'smooth'
  });
}

function load_script_promise(url, type){
	return new Promise(function(resolve, reject){
		var head = document.getElementsByTagName('head')[0]
		var script = document.createElement('script')
		script.type = type
		script.addEventListener('load', function(){
			this.removeEventListener('load', arguments.callee)
			resolve(script)
		})
		script.src = url
		head.appendChild(script)
	})
}
