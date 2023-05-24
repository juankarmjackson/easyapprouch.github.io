const raizUrl = 'http://localhost:8080';
/*const raizUrl = 'https://presupuestaya-production.up.railway.app';*/

$(document).ready(function () {
    mostrarMensajes();
    enviarMensaje();
    borrarConversacion();
});

async function mostrarMensajes() {
    // Enviar el mensaje al servidor y obtener la respuesta del chatbot al cargar la página
    await axios.get(raizUrl + '/api/v1/mensajes_chatbot/findUserAndAssistantMessages').then(function (response) {
        $('#mensaje-generados .row').empty();

        var mensajes = response.data;

        // Iterar sobre los mensajes y generar el HTML correspondiente
        for (var i = 0; i < mensajes.length; i++) {
            var mensaje = mensajes[i];
            var html = '';

            if (mensaje.role === 'assistant') {
                html = `
                    <div class="col-6">
                        <div class="p-3 mb-2 bg-info-subtle text-emphasis-info rounded">
                            <p>${mensaje.content}</p>
                        </div>
                    </div>
                    <div class="col-6"></div>
                `;
            } else if (mensaje.role === 'user') {
                html = `
                    <div class="col-6"></div>
                    <div class="col-6">
                        <div class="p-3 mb-2 bg-success-subtle text-emphasis-success rounded">
                            <p class="text-right">${mensaje.content}</p>
                        </div>
                    </div>
                `;
            }

            // Agregar el HTML al contenedor de mensajes
            $('#mensaje-generados .row').append(html);
        }
    });
}

function enviarMensaje() {

    $("#chatbot-form").submit(async function (event) {
        event.preventDefault(); // Evita que el formulario se envíe automáticamente

        // Muestra el GIF animado de carga
        $('#mensaje-generados .row').empty();
        $("#loading-gif").css("display", "block");

        // Obtén el valor del campo de entrada
        const message = $("#chatbot-input").val();

        // Enviar el mensaje al servidor y obtener la respuesta del chatbot
        await axios.post(raizUrl + '/api/v1/complete-chat-no-mono', {
            modeloGenerado: "gpt-3.5-turbo",
            mensaje: message
        }).then(function (response) {
            mostrarMensajes();
        });

        // Oculta el GIF animado después de completar la carga o procesamiento
        $("#loading-gif").css("display", "none");

        // Limpia el campo de entrada después de enviar el mensaje
        $("#chatbot-input").val("");

    });
}

function borrarConversacion() {

    $("#borrarConversacion").click(async function (event) {
        event.preventDefault(); // Evita que el formulario se envíe automáticamente

        // Muestra el GIF animado de carga
        $('#mensaje-generados .row').empty();
        $("#loading-gif").css("display", "block");

        // Obtén el valor del campo de entrada
        const message = $("#chatbot-input").val();

        // Enviar el mensaje al servidor y obtener la respuesta del chatbot
        await axios.delete(raizUrl + '/api/v1/mensajes_chatbot/borrarMensajes').then(function (response) {
            mostrarMensajes();
        });

        // Oculta el GIF animado después de completar la carga o procesamiento
        $("#loading-gif").css("display", "none");

        // Limpia el campo de entrada después de enviar el mensaje
        $("#chatbot-input").val("");

    });
}
