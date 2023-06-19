/*
const raizUrlChat = 'http://localhost:8080';
*/
const raizUrlChat = 'https://presupuestaya-production.up.railway.app';

$(document).ready(function () {
    mostrarMensajes('ChatBotNormal', 'mensaje-generados-ChatBotNormal');
    mostrarMensajes('ChatBotAtaca', 'mensaje-generados-ChatBotAtaca');
    enviarMensaje('ChatBotNormal');
    enviarMensaje('ChatBotAtaca');
    borrarConversacion('ChatBotNormal');
    borrarConversacion('ChatBotAtaca');

    mostrarbotonIniciarConversacion('ChatBotAtaca');
});


async function mostrarMensajes(nombreConversacion, idDiv) {
    await axios.get(raizUrlChat + '/api/v1/mensajes_chatbot/porUsuarioYNombreConversacion', {
        params: {
            nombreConversacion: nombreConversacion
        }
    }).then(function (response) {
        $('#' + idDiv + ' .row').empty();

        var mensajes = response.data;

        for (var i = 0; i < mensajes.length; i++) {
            var mensaje = mensajes[i];
            var html = '';

            if (mensaje.role === 'assistant') {
                html = `
                    <div class="col-6">
                        <div class="p-3 mb-2 bg-custom2 text-white rounded">
                            <p>${mensaje.content}</p>
                        </div>
                    </div>
                    <div class="col-6"></div>
                `;
            } else if (mensaje.role === 'user') {
                if (mensaje.content !== '' && mensaje.content !== null && mensaje.content !== 'undefined') {
                    html = `
                    <div class="col-6"></div>
                    <div class="col-6">
                        <div class="p-3 mb-2 bg-custom text-white rounded">
                            <p class="text-right">${mensaje.content}</p>
                        </div>
                    </div>
                `;

                }
            }

            $('#' + idDiv + ' .row').append(html);
        }
    });
}

function enviarMensaje(nombreConversacion) {

    $("#chatbot-form-" + nombreConversacion).submit(async function (event) {
        event.preventDefault(); // Evita que el formulario se envíe automáticamente
        var message = $("#chatbot-input-" + nombreConversacion).val();

        // Limpia el campo de entrada después de enviar el mensaje
        $("#chatbot-input-" + nombreConversacion).val("");

        $("#boton-enviar-" + nombreConversacion).prop("disabled", true);
        $("#carga-boton-" + nombreConversacion).css("display", "block");
        $("#boton-nombre-enviar-" + nombreConversacion).css("display", "none");

        var html = '';
        if (message !== '' && message !== null && message !== 'undefined') {
            html = `
                    <div class="col-6"></div>
                    <div class="col-6">
                        <div class="p-3 mb-2 bg-custom text-white rounded">
                            <p class="text-right">${message}</p>
                        </div>
                    </div>
                `;
            $('#mensaje-generados-' + nombreConversacion + ' .row').append(html);
        }
        await esperar(2000);
        html = `
                    <div class="escribiendo-` + nombreConversacion + ` col-6">
                        <div class="p-3 mb-2 bg-custom2 text-white rounded">
                            <img src="../../assets/img/work-in-progress.gif" height="50px" width="50px">
                        </div>
                    </div>
                    <div class="escribiendo-` + nombreConversacion + ` col-6"></div>
                `;
        $('#mensaje-generados-' + nombreConversacion + ' .row').append(html);


        // Obtén el valor del campo de entrada

        // Enviar el mensaje al servidor y obtener la respuesta del chatbot
        await axios.post(raizUrlChat + '/api/v1/complete-chat-no-mono-atacar', {
            modeloGenerado: "gpt-3.5-turbo-16k",
            mensaje: message,
            nombreConversacion: nombreConversacion
        }).then(function (response) {

            const elementos = document.getElementsByClassName("escribiendo-" + nombreConversacion);
            while (elementos.length > 0) {
                elementos[0].parentNode.removeChild(elementos[0]);
            }

            html = `
                    <div class="col-6">
                        <div class="p-3 mb-2 bg-custom2 text-white rounded">
                        ${response.data}
                        </div>
                    </div>
                    <div class="col-6"></div>
                `;
            $('#mensaje-generados-' + nombreConversacion + ' .row').append(html);
        });

        // Oculta el GIF animado después de completar la carga o procesamiento
        $("#loading-gif-" + nombreConversacion).css("display", "none");
        $("#boton-enviar-" + nombreConversacion).prop("disabled", false);
        $("#carga-boton-" + nombreConversacion).css("display", "none");
        $("#boton-nombre-enviar-" + nombreConversacion).css("display", "block");

    });
}

function borrarConversacion(nombreConversacion) {

    $("#borrarConversacion-" + nombreConversacion).click(async function (event) {
        event.preventDefault(); // Evita que el formulario se envíe automáticamente

        // Muestra el GIF animado de carga
        $('#mensaje-generados-' + nombreConversacion + ' .row').empty();
        $("#loading-gif-" + nombreConversacion).css("display", "block");

        // Obtén el valor del campo de entrada
        const message = $("#chatbot-input-" + nombreConversacion).val();

        // Enviar el mensaje al servidor y obtener la respuesta del chatbot
        await axios.delete(raizUrlChat + '/api/v1/mensajes_chatbot/borrarMensajes', {
            params: {
                nombreConversacion: nombreConversacion
            }
        }).then(function (response) {
            mostrarMensajes();
        });

        // Oculta el GIF animado después de completar la carga o procesamiento
        $("#loading-gif-" + nombreConversacion).css("display", "none");

        if (nombreConversacion === 'ChatBotAtaca') {
            $("#chatbot-input-" + nombreConversacion).prop("disabled", true);
            $("#boton-enviar-" + nombreConversacion).prop("disabled", true);
            $("#borrarConversacion-" + nombreConversacion).prop("disabled", true);
            $("#iniciarConversacion-" + nombreConversacion).css("display", "block");
        }

    });
}

async function mostrarbotonIniciarConversacion(nombreConversacion) {

    await axios.get(raizUrlChat + '/api/v1/mensajes_chatbot/porUsuarioYNombreConversacion', {
        params: {
            nombreConversacion: nombreConversacion
        }
    }).then(function (response) {
        var mensajes = response.data;
        if (mensajes.length === 0) {
            $("#chatbot-input-" + nombreConversacion).prop("disabled", true);
            $("#boton-enviar-" + nombreConversacion).prop("disabled", true);
            $("#borrarConversacion-" + nombreConversacion).prop("disabled", true);
        } else {
            $("#chatbot-input-" + nombreConversacion).prop("disabled", false);
            $("#boton-enviar-" + nombreConversacion).prop("disabled", false);
            $("#borrarConversacion-" + nombreConversacion).prop("disabled", false);
            $("#iniciarConversacion-" + nombreConversacion).css("display", "none");
        }
    });

    $("#iniciarConversacion-" + nombreConversacion).click(async function (event) {
        event.preventDefault(); // Evita que el formulario se envíe automáticamente
        $("#chatbot-form-" + nombreConversacion).submit();
        $("#chatbot-input-" + nombreConversacion).prop("disabled", false);
        $("#boton-enviar-" + nombreConversacion).prop("disabled", false);
        $("#borrarConversacion-" + nombreConversacion).prop("disabled", false);
        $("#iniciarConversacion-" + nombreConversacion).css("display", "none");
    });
}

function esperar(tiempo) {
    return new Promise(function (resolve) {
        setTimeout(resolve, tiempo);
    });
}
