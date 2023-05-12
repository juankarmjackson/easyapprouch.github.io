const inputBoton = document.getElementById('inputBoton');
console.log(inputBoton);


inputBoton.addEventListener('click', function(){
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value
    const telefono = document.getElementById('telefono').value;
    // const nombreempresa = document.getElementById('nombreempresa').value;
    // const observaciones = document.getElementById('observaciones').value;
    const hora = new Date();
    


    const username = "username1";
    const password = "password1";

    $.ajax({
    url: 'https://presupuestaya-production.up.railway.app/api/leads',
    type: 'POST',
    async: false,
    contentType: 'application/json',
    dataType: 'jsonp',
    username: username,
    password: password,
    data: JSON.stringify({
        "nombre": nombre,
        "telefono": telefono,
        "email": email,
        "whatsapp": "none",
        "llamada": false,
        "estatus": "no contactado",
        "fechaCreacion": hora,
    }),

    // error: function (request, error) {
    //     console.log(arguments);
    //     alert(" Can't do because: " + error);
    // },

    success: function (data) {
        console.log('okey');
    }

    })

});

$('#inputBoton2').click(function () {
    const nombre2 = document.getElementById('nombre2').value;
    const telefono2 = document.getElementById('telefono2').value;
    const nombreempresa2 = document.getElementById('nombreempresa2').value;
    const observaciones2 = document.getElementById('observaciones2').value;
    const tipoDeNegocio2 = "Agencia de Marketing";


    const username = "username1";
    const password = "password1";

    $.ajax({
    url: `https://presupuestaya-production.up.railway.app/api/leads`,
    type: 'POST',
    async: false,
    contentType: 'application/json',
    dataType: 'jsonp',
    username: username,
    password: password,
    data: JSON.stringify({
        "nombre": nombre2,
        "telefono": telefono2,
        "email": nombreempresa2,
        "tipoDeNegocio": tipoDeNegocio2,
        "mensaje": observaciones2
    }),
    success: function (data) {
        console.log('okey');
    }

    })

});
