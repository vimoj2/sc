document.addEventListener("DOMContentLoaded", function(){
  document.getElementById('upload').addEventListener("submit", function(e){
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    const request = new XMLHttpRequest();

    request.onreadystatechange = function(){
      document.getElementById("result").innerText = request.responseText
    };

    request.open(form.method, form.action);
    request.send(data)
  })
});
