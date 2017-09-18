const http = new XMLHttpRequest();
let isDrawing = false;
let startPoint = null;
let points = [];

function ajax(url, method, data, callback) {
  http.open(method, url, true);
  http.setRequestHeader('Content-type', 'application/json');
  if (method.toLowerCase() === 'post')
    http.send(JSON.stringify(data));
  else
    http.send();
  http.onload = function() {
    callback(null, http.responseText);
  }
}

function saveHandler() {
  const detail = document.querySelector('#nameOfDetail').value;
  const select = document.querySelector('#loadImageInput');
  const uuid = select.options[select.selectedIndex].value;
  const data = { uuid, detail, points };
  ajax('/shape', 'post', data, () => {});
}



document.addEventListener("DOMContentLoaded", () => {

  ajax('/image', 'get', null, (err, reply) => {
    const data = JSON.parse(reply);
    const select = document.querySelector('#loadImageInput');
    const o = document.createElement("option");
    o.text = '---';
    select.add(o);
    data.forEach(option => {
      const o = document.createElement("option");
      o.text = option.name;
      o.value = option.uuid;
      select.add(o)
    });
    run();
  })
});

function cleanCanvas(id) {
  let editorLayout = document.querySelector(id);
  editorLayout
    .getContext('2d')
    .clearRect(0, 0, editorLayout.width, editorLayout.height);
  editorLayout.getContext('2d').drawImage(image, 0, 0);
}

let image;
function run() {
  // function changeDetailColor(e) {
  //   addCanvasPath('canvas', points, e.target.value)
  // }
  // const colorPicker = document.querySelector('#colorPicker');
  // colorPicker.addEventListener("input", changeDetailColor, false);
  // colorPicker.addEventListener("change", changeDetailColor, false);
  // colorPicker.select();

  document.querySelector('#loadImageInput').onchange = (event) => {
    if (event.target.selectedIndex === 0) {
      cleanCanvas('canvas');
      cleanDetailsList();
      return;
    }
    const imageId = event.target.options[event.target.selectedIndex].value;
    fetchImage('/image/' + imageId + '/data');
    fetchDetails('/shape/' + imageId, (err, reply) => {
      const data = JSON.parse(reply);
      const detailsList = document.querySelector('#detailList');
      data.forEach(item => {
        const img = document.createElement('img');
        img.src = `/image/${imageId}/${item.name}`;
        img.onclick = function() {
          points = item.points;
          cleanCanvas('canvas');
          addCanvasPath('canvas', item.points);
        };
        detailsList.appendChild(img);
      });
    })

  };
  function addCanvasPath(id, points, fillColor) {
    let editorLayout = document.querySelector(id);
    const ctx = editorLayout.getContext('2d');
    ctx.beginPath();
    points.forEach(point => {
      const {x, y} = point;
      // console.log(x, y)
      ctx.lineTo(x, y)
    });
    const {x, y} = points[0];
    ctx.lineTo(x, y);
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }
  function fetchDetails(url, cb) {
    ajax(url, 'get', null, (err, reply) => {
      cb(err, reply)
    })
  }

  function fetchImage(url) {
    image = new Image();
    image.onload = () => {
      createEditor(image);
    };
    image.src = url;
  }

  function cleanDetailsList() {
    const detailsList = document.querySelector('#detailList');
    while(detailsList.firstChild)
      detailsList.removeChild(detailsList.firstChild)
  }

  function createEditor(image) {
    let editorLayout = document.querySelector('canvas');
    if (editorLayout) {
      cleanCanvas('canvas');
    } else {
      const canvasBlock = document.querySelector('#canvasBlock')
      editorLayout = document.createElement('canvas');
      canvasBlock.appendChild(editorLayout);
    }

    editorLayout.width = image.width;
    editorLayout.height = image.height;

    const context = editorLayout.getContext("2d");
    context.drawImage(image, 0, 0);

    editorLayout.addEventListener('click', event => {
      const offsetLeft = editorLayout.offsetLeft;
      const offsetTop = editorLayout.offsetTop;

      const x = event.pageX - offsetLeft;
      const y = event.pageY - offsetTop;
      points.push({x, y});

      if (!isDrawing) {
        points = [];
        isDrawing = true;
        context.beginPath();
        startPoint = {x, y};
      }
      context.lineTo(x, y);
      context.stroke();

      if (
        points.length > 1 &&
        Math.abs(startPoint.x - x) <= 6 &&
        Math.abs(startPoint.y - y) <= 6
      ) {
        isDrawing = false;
        startPoint = {};
        context.closePath();
        context.stroke();
      }
    });
  }
}
