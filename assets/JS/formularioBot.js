const raizUrlFormulario = 'http://localhost:8080';
/*
const raizUrlChat = 'https://presupuestaya-production.up.railway.app';
*/

$(document).ready(function () {

    const variables = iniciarlizarVariables();
    cargarFormulario(variables);

    actualizarFormulario(variables);
});


function iniciarlizarVariables() {
    const variables = {
        formularioBotId: $("#formularioBotId"),
        nombreEmpresa: $("#nombreEmpresa"),
        nombre: $("#nombre"),
        Perfil: $("#Perfil"),
        linkAgendar: $("#linkAgendar"),
    };
    return variables;
}

async function cargarFormulario(variables) {

    await axios.get(raizUrl + '/formulario_bot/usuario', {
        headers: {
            'Authorization': `Bearer ` + authToken
        }
    }).then(function (response) {
        if (response.data.length < 0) {

            var formulario = response.data[0];
            variables.formularioBotId.val(formulario.formularioBotId);
            variables.nombreEmpresa.val(formulario.nombreEmpresa);
            variables.nombre.val(formulario.nombre);
            variables.Perfil.val(formulario.Perfil);
            variables.linkAgendar.val(formulario.linkAgendar);

        }
    });
}

function actualizarFormulario(variables) {

    $("#formularioBot").submit(async function (event) {

        const registro = {
            id: variables.formularioBotId.val(),
            nombreEmpresa: variables.nombreEmpresa.val(),
            nombre: variables.nombre.val(),
            puestoTrabajo: variables.Perfil.val(),
            linkAgendar: variables.linkAgendar.val(),
        };

        await axios.post(raizUrl + '/formulario_bot', registro, {
            headers: {
                'Authorization': `Bearer ` + authToken,
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            if (reponse.data !== null) {

                var formulario = response.data;
                nombreEmpresa.val(formulario.nombreEmpresa);

            }
        });

    });
}

