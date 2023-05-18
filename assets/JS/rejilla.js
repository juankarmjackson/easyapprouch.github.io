const authToken = localStorage.getItem('authToken');
/*
const raizUrl = 'http://localhost:8080';
*/
const raizUrl = 'https://presupuestaya-production.up.railway.app';

document.addEventListener('DOMContentLoaded', async function () {

    let estados = [];
    const authToken = localStorage.getItem('authToken');

    try {
        const response = await axios.get(raizUrl + '/usuarios/obtenerUsuarioIdByAutentication', {
            headers: {
                'Authorization': `Bearer ` + authToken
            }
        });
        const usuarioId = response.data;

        if (Number.isInteger(usuarioId)) {
            localStorage.setItem('usuarioId', usuarioId);
        } else {
            window.location.href = '../../pantallas/usuarios/login.html';
            console.error('El usuarioId no es un entero:', usuarioId);
        }

    } catch (error) {
        window.location.href = '../../pantallas/usuarios/login.html';
        console.error('Error al obtener usuarioId:', error);
    }

    try {
        const response = await axios.get(raizUrl + '/api/token_miro/findByUsuario', {
            headers: {
                'Authorization': `Bearer ` + authToken
            }
        });
        var tokenMiro = response.data;
        var contenedorMiro = document.getElementById('contenedorMiro');
        contenedorMiro.innerHTML = '\n' +
            '    <div class="miro">\n' +
            '        <iframe src="' + tokenMiro + '" frameborder="0" scrolling="no" allow="fullscreen; clipboard-read; clipboard-write" allowfullscreen></iframe>\n' +
            '    </div>';

    } catch (error) {
        console.error('No se encuentra el token de acceso al miro:', error);
    }


    try {
        const response = await axios.get(raizUrl + '/usuarios/obtenerUsernameByAutentication', {
            headers: {
                'Authorization': `Bearer ` + authToken
            }
        });
        localStorage.setItem('username', response.data);


    } catch (error) {
        console.error('Error al obtener username:', error);
    }

    const usuarioId = localStorage.getItem('usuarioId');
    const username = localStorage.getItem('username');

    crearContenidoPagina();

    async function crearContenidoPagina() {

        const contendorBienvenida = document.getElementById('nombreBienvenida');
        contendorBienvenida.innerHTML = username;

    }

    fetchEstados();

    async function fetchEstados() {
        try {
            const response = await axios.get(raizUrl + '/api/estados', {
                headers: {
                    'Authorization': `Bearer ` + authToken
                }
            });
            estados = response.data.map(estado => (estado.nombre));
        } catch (error) {
            console.error('Error al obtener los estados:', error);
        }
    }


    loadData();

    /*
    * Cambio en Configuracion Rejilla
    * */

    const paginaInput = document.getElementById('pagina');
    const limiteInput = document.getElementById('limite');

    paginaInput.addEventListener('change', cambioConfiguracionRejilla);
    limiteInput.addEventListener('change', cambioConfiguracionRejilla);


    async function cambioConfiguracionRejilla() {

        const paginaInput = document.getElementById('pagina');
        const limiteInput = document.getElementById('limite');

        const registroConfiguracionRejilla = {
            id: null,
            limiteDePaginas: limiteInput.value,
            pagina: paginaInput.value,
            usuarioId: usuarioId,
        };


        try {
            await axios.put(raizUrl + `/api/configuracionRejilla/${usuarioId}`, registroConfiguracionRejilla, {
                headers: {
                    'Authorization': `Bearer ` + authToken,
                    'Content-Type': 'application/json'
                }
            });

            await loadData();
        } catch (error) {
            console.error('Error al actualizar la configuración de la rejilla:', error);
        }
    }


    /*
    * HandSomeTable
    * */

    async function loadData() {

        /*
        * Añadimos datos desde Backend
        * */
        const paginaInput = document.getElementById('pagina');
        const limiteInput = document.getElementById('limite');

        const urlConfiguracionRejilla = raizUrl + `/api/configuracionRejilla/usuario/${usuarioId}`;
        const responseConfiguracionRejilla = await axios.get(urlConfiguracionRejilla, {
            headers: {
                'Authorization': `Bearer ` + authToken
            }
        });
        const dataConfiguracionRejilla = responseConfiguracionRejilla.data;

        paginaInput.value = dataConfiguracionRejilla.pagina;
        limiteInput.value = dataConfiguracionRejilla.limiteDePaginas;

        const page = parseInt(paginaInput.value, 10) - 1; // Restamos 1 porque la API espera un índice base 0
        const size = parseInt(limiteInput.value, 10);

        try {
            let isPasting = false;
            let pastedData = [];
            const tablaContenedor = document.getElementById('tabla-contenedor');

            // Vacía el contenedor de la tabla
            tablaContenedor.innerHTML = '';

            //Actualizamos la Tabla
            const url = raizUrl + `/api/leads/findAllByUsuarioIdAndFechaCreacionDesc/${usuarioId}?page=${page}&size=${size}`;
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ` + authToken
                }
            });
            const data = response.data;
            console.log(data);

            const container = document.getElementById('tabla-contenedor');
            const hot = new Handsontable(container, {
                filters: true, // Habilita los filtros
                dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
                data: data,
                fixedColumnsStart: 2,
                manualColumnFreeze: true,
                rowHeaders: true,
                colHeaders: ['ID', 'Nombre', 'Teléfono', 'Email', 'WhatsApp', 'Llamada', 'Email Enviado',
                    'Estado', 'Fecha', 'Fecha de Registro', 'Observación', 'SMS Enviado', 'Mensaje SMS',
                    'Origen Lead'],
                columns: [
                    {
                        data: 'id',
                        readOnly: true, // Añade esta línea para hacer la columna de solo lectura
                    },
                    {
                        data: 'nombre',
                        width: 150,
                    },
                    {
                        data: 'telefono',
                        width: 150,
                        renderer: whatsappRenderer
                    },
                    {
                        data: 'email',
                        width: 250,
                        renderer: emailRenderer // Añade esta línea para usar el renderer de correo electrónico
                    },
                    {
                        data: 'whatsapp',
                        type: 'checkbox'
                    },
                    {data: 'llamada', type: 'checkbox'},
                    {data: 'emailEnviado', type: 'checkbox'},
                    {
                        data: 'estadoNombre',
                        type: 'dropdown',
                        source: estados,
                        title: 'Estado',
                        width: 150,
                        renderer: function (instance, td, row, col, prop, value, cellProperties) {
                            switch (value) {
                                case 'Cerrado':
                                    td.style.backgroundColor = 'green';
                                    td.style.color = 'white';
                                    break;
                                case 'Descartado':
                                    td.style.backgroundColor = 'red';
                                    td.style.color = 'white';
                                    break;
                                case 'En Negociacion':
                                    td.style.backgroundColor = 'orange';
                                    td.style.color = 'white';
                                    break;
                                case 'Contactado':
                                    td.style.backgroundColor = 'grey';
                                    td.style.color = 'white';
                                    break;
                            }
                            Handsontable.renderers.TextRenderer.apply(this, arguments);
                        }
                    },
                    {
                        data: 'fecha',
                        type: 'date'
                    },
                    {
                        data: 'fechaRegistro',
                        type: 'date',
                        readOnly: true // Añade esta línea para hacer la columna de solo lectura
                    },
                    {
                        data: 'observacion',
                        width: 250
                    },
                    {
                        data: 'smsEnviado',
                        type: 'checkbox',
                    },
                    {
                        data: 'mensajeSMS',
                        width: 300
                    },
                    {
                        data: 'origen',
                        readOnly: true // Añade esta línea para hacer la columna de solo lectura
                    },
                ],
                manualRowMove: true,
                manualColumnMove: true,
                contextMenu: ['row_above', 'row_below', 'remove_row', 'undo', 'redo'],
                licenseKey: 'non-commercial-and-evaluation',
                hiddenColumns: {
                    columns: [0], // Agrega esta línea para ocultar la columna ID
                    indicators: false // Desactiva los indicadores visuales de las columnas ocultas
                },
                beforeCopy: function (data, coords) {/*
                    for (let i = 0; i < data.length; i++) {
                        data[i][0] = ''; // Establece el primer elemento (ID) de cada fila copiada como vacío
                    }
                */
                },
                afterChange: function (changes, source) {
                    if (source === 'loadData') {
                        return;
                    }

                    // Obtén la fila y la columna modificadas
                    const row = changes[0][0];
                    const column = changes[0][1];

                    // Si estamos pegando, agregamos los cambios al array de datos pegados.
                    if (isPasting) {
                        pastedData.push(...changes);

                        // Si hemos terminado de pegar, guardamos todas las filas.
                        if (source === 'CopyPaste.paste') {
                            isPasting = false;
                            const rowsToSave = groupChangesByRow(pastedData);
                            rowsToSave.forEach(row => {
                                guardarFilaMultiple(row);
                            });
                            actualizarRejilla();
                            pastedData = [];
                        } else if (!isPasting) {
                            // Tu lógica de guardar una sola fila.
                            guardarFila(row);
                        }
                    } else {

                        // Comprueba si es la última fila (la fila de "nuevo registro")
                        actualizarFila(row);

                    }
                },
                afterGetColHeader: function (col, TH) {
                    if (col === 11) { // Índice de la columna 'SMS Enviado'
                        addTooltip(TH, 'Si se quiere enviar un SMS, marque esta casilla. Pero solo se puede hacer una vez.');
                    } else if (col === 12) { // Índice de la columna 'Mensaje SMS'
                        addTooltip(TH, 'Este es el mensaje que se enviará en los SMS.');
                    }
                },
            });

            /*
            * Añadir fila
            * */
            var addRowHandler = function () {
                hot.alter('insert_row', 0);

                // Obtén los datos de la nueva fila
                var newRowData = hot.getDataAtRow(0);
                hot.setDataAtCell(0, 1, "NuevaFila");
                // Llama a tu función para guardar la nueva fila
                guardarFilaFirst("NuevaFila", newRowData);
            };

// Utiliza jQuery para asignar el evento
            $('#add-row').off('click').on('click', addRowHandler);

            $('#actualizarRejilla').off('click').on('click', actualizarRejilla);


            /*
            * Añadir mensaje atravez de toolip de bootstrap
            * */
            function addTooltip(element, message) {
                element.setAttribute('data-bs-toggle', 'tooltip');
                element.setAttribute('title', message);
                new bootstrap.Tooltip(element);
            }

            function guardarFila(row) {
                // Crea un nuevo registro a partir de los datos de la fila
                const registro = {
                    id: hot.getDataAtCell(row, 0) || -1,
                    nombre: hot.getDataAtCell(row, 1),
                    telefono: hot.getDataAtCell(row, 2),
                    email: hot.getDataAtCell(row, 3),
                    whatsapp: hot.getDataAtCell(row, 4) || false,
                    llamada: hot.getDataAtCell(row, 5) || false,
                    emailEnviado: hot.getDataAtCell(row, 6) || false,
                    estadoNombre: hot.getDataAtCell(row, 7),
                    fecha: hot.getDataAtCell(row, 8),
                    observacion: hot.getDataAtCell(row, 10),
                    smsEnviado: hot.getDataAtCell(row, 11) || false,
                    mensajeSMS: hot.getDataAtCell(row, 12),
                };

                const camposObligatorios = ['nombre', 'whatsapp', 'llamada', 'emailEnviado'];
                const registroCompleto = camposObligatorios.every((campo) => registro[campo] !== null && registro[campo] !== undefined && registro[campo] !== '');

                if (registroCompleto) {
                    console.log("Creando nuevo registro");
                    // Llama a la función guardarRegistro y maneja la respuesta
                    guardarRegistro(registro)
                        .then(function (response) {
                            console.log('Registro guardado con éxito:', response.data);
                            console.log('Registro guardado con éxito con Id:' + response.data.id);
                            actualizarRejilla();
                        })
                        .catch(function (error) {
                            console.error('Error al guardar el registro:', error);
                        });

                    console.log('Se ha añadido una nueva fila en el índice:', row);
                } else {
                    console.log('No se puede guardar el registro, faltan datos.');
                }
            }

            function guardarFilaFirst(TextoGuardado) {
                // Crea un nuevo registro a partir de los datos de la fila
                const registro = {
                    id: null,
                    nombre: TextoGuardado,
                    telefono: null,
                    email: null,
                    whatsapp: false,
                    llamada: false,
                    emailEnviado: false,
                    estadoNombre: null,
                    fecha: null,
                    observacion: null,
                    smsEnviado: false,
                    mensajeSMS: null,
                };


                console.log("Creando nuevo registro");
                // Llama a la función guardarRegistro y maneja la respuesta
                guardarRegistro(registro)
                    .then(function (response) {
                        console.log('Registro guardado con éxito con Id:' + response.data.id);

                        actualizarRejilla();
                    })
                    .catch(function (error) {
                        console.error('Error al guardar el registro:', error);
                    });
            }


            function actualizarFila(row) {
                // Actualizar registros existentes
                /*
                * Tener cuidado con el ID 0, si existe en BDD puede ser una putada
                * */
                const id = hot.getDataAtCell(row, 0) || -1; // Asegúrate de que la columna 0 contiene el ID
                const registro = {
                    nombre: hot.getDataAtCell(row, 1),
                    telefono: hot.getDataAtCell(row, 2),
                    email: hot.getDataAtCell(row, 3),
                    whatsapp: hot.getDataAtCell(row, 4) || false,
                    llamada: hot.getDataAtCell(row, 5) || false,
                    emailEnviado: hot.getDataAtCell(row, 6) || false,
                    estadoNombre: hot.getDataAtCell(row, 7),
                    fecha: hot.getDataAtCell(row, 8),
                    observacion: hot.getDataAtCell(row, 10),
                    smsEnviado: hot.getDataAtCell(row, 11) || false,
                    mensajeSMS: hot.getDataAtCell(row, 12),
                };


                const camposObligatorios = ['nombre', 'whatsapp', 'llamada', 'emailEnviado'];
                const registroCompleto = camposObligatorios.every((campo) => registro[campo] !== null && registro[campo] !== undefined && registro[campo] !== '');

                if (registroCompleto && id !== -1) {
                    console.log("Actualizando registro");
                    // Llama a la función actualizarRegistro y maneja la respuesta
                    actualizarRegistro(id, registro)
                        .then(function (response) {
                            console.log('Registro actualizado con éxito:', response.data);
                            console.log('Registro actualizado con éxito:', response.data);
                        })
                        .catch(function (error) {
                            console.error('Error al actualizar el registro:', error);
                        });
                } else {
                    console.log('No se puede guardar el registro, faltan datos o el Id no es correcto.');
                }
            }

            function guardarFilaMultiple(row) {
                // Aquí llamarías a tu función para guardar la fila en la base de datos.
                // Asumiendo que la columna 0 contiene el ID
                const registro = {
                    id: row['id'] || -1,
                    nombre: row['nombre'],
                    telefono: row['telefono'],
                    email: row['email'],
                    whatsapp: row['whatsapp'] || false,
                    llamada: row['llamada'] || false,
                    emailEnviado: row['emailEnviado'] || false,
                    estadoNombre: row['estadoNombre'],
                    fecha: row['fecha'],
                    observacion: row['observacion'],
                    smsEnviado: row['smsEnviado'],
                    mensajeSMS: row['mensajeSMS'],
                };


                const camposObligatorios = ['nombre', 'whatsapp', 'llamada', 'emailEnviado'];
                const registroCompleto = camposObligatorios.every((campo) => registro[campo] !== null && registro[campo] !== undefined && registro[campo] !== '');

                if (registroCompleto) {
                    console.log('Empezando guardado');

                    // Llama a la función guardarRegistro y maneja la respuesta
                    guardarRegistro(registro)
                        .then(function (response) {
                            console.log('Registro guardado con éxito:', response.data);
                            console.log('Registro guardado con éxito con Id:' + response.data.id);
                        })
                        .catch(function (error) {
                            console.error('Error al guardar el registro:', error);
                        });
                } else {
                    console.log('No se puede guardar el registro, faltan datos.');
                }
            }


            function whatsappRenderer(instance, td, row, col, prop, value, cellProperties) {
                if (value === null || value === '') {
                    td.innerHTML = '';
                } else {
                    td.innerHTML = '<a class="whatsapp-link" href="https://wa.me/' + value + '" target="_blank">' + value + '</a>';
                }
            }

            function emailRenderer(instance, td, row, col, prop, value, cellProperties) {
                if (value === null || value === '') {
                    td.innerHTML = '';
                } else {
                    td.innerHTML = '<a class="email-link" href="https://mail.google.com/mail/u/0/?view=cm&fs=1&to=' + value + '" target="_blank">' + value + '</a>';
                }
            }

            // Evento para marcar cuando se inicia una operación de pegado
            hot.addHook('beforeChange', (changes, source) => {
                if (source === 'CopyPaste.paste') {
                    isPasting = true;
                }
            });

            // Función para agrupar cambios por fila
            function groupChangesByRow(changes) {
                const rows = {};
                changes.forEach(([row, prop, oldValue, newValue]) => {
                    if (!(row in rows)) {
                        rows[row] = {};
                    }
                    rows[row][prop] = newValue;
                });
                return Object.values(rows);
            }

            /*
            * Estilos Diseño
            * */
            async function fetchKPIs() {
                try {
                    const response = await axios.get(raizUrl + '/api/leads/kpi', {
                        headers: {
                            'Authorization': 'Bearer ' + authToken
                        }
                    });

                    const kpis = response.data;

                    // CONTADOR TOTAL
                    const numeroTotal = document.getElementById('resultado');
                    numeroTotal.innerHTML = kpis.numeroLeadTotales;

                    // CONTACTADOS TOTAL
                    const contactadosTotal = document.getElementById('contactados');
                    contactadosTotal.innerHTML = kpis.numeroLeadsContactados;

                    // EN NEGOCIACION
                    const enNegociacion = document.getElementById('negociacion');
                    enNegociacion.innerHTML = kpis.numeroLeadsFaseNegociacion;

                    // EN CIERRES
                    const cierres = document.getElementById('cierres');
                    cierres.innerHTML = kpis.numeroLeadsCerrados;

                    // TASA
                    let tasa = Number(kpis.numeroLeadTotales / kpis.numeroLeadsCerrados).toFixed(1);
                    const tasaCierre = document.getElementById('tasa');
                    tasaCierre.innerHTML = tasa + '%';

                } catch (error) {
                    console.error(`Error al obtener los KPIs:`, error);
                }
            }

            // Llama a la función cuando la página se carga
            fetchKPIs();

            /*
                        function isLastRow(row) {
                            const id = hot.getDataAtCell(row, 0) || -1; // Asegúrate de que la columna 0 contiene el ID
                            if (id === null || id === '' || id === -1) {
                                row = row + 2;
                            } else {
                                row = row + 1;
                            }
                            const lastRow = hot.countRows();
                            return row === lastRow;
                        }

                        function isFirstRow(row) {
                            // Retorna 'true' si la fila es la primera (índice 0), 'false' en caso contrario.
                            return row === 0;
                        }
            */

            function guardarRegistro(registro) {
                return axios.post(raizUrl + '/api/leads', registro, {
                    headers: {
                        'Authorization': `Bearer ` + authToken,
                        'Content-Type': 'application/json'
                    }
                });
            }

            function actualizarRegistro(id, registro) {
                return axios.put(raizUrl + `/api/leads/${id}`, registro, {
                    headers: {
                        'Authorization': `Bearer ` + authToken,
                        'Content-Type': 'application/json'
                    }
                });
            }

            /*
            * Eliminar Fila
            * */
            const botonEliminar = document.getElementById('eliminar-fila');
            const eliminarFilaBtn = document.getElementById('eliminar-fila');
            eliminarFilaBtn.addEventListener('mousedown', (event) => {
                event.stopPropagation();
            });
            botonEliminar.addEventListener('click', eliminarFilaSeleccionada);

            async function eliminarFilaSeleccionada() {
                // Obtén la fila seleccionada
                const filaSeleccionada = hot.getSelectedLast();

                // Comprueba si se ha seleccionado una fila
                if (filaSeleccionada) {
                    const row = filaSeleccionada[0];

                    // Comprueba si no es la última fila (la fila de "nuevo registro")
                    const id = hot.getDataAtCell(row, 0);

                    // Elimina el registro en el servidor
                    try {
                        await axios.delete(raizUrl + `/api/leads/${id}`, {
                            headers: {
                                'Authorization': `Bearer ` + authToken
                            }
                        });
                        console.log(`Registro con ID ${id} eliminado con éxito`);

                        // Elimina la fila de la tabla
                        hot.alter('remove_row', row);
                    } catch (error) {
                        console.error(`Error al eliminar el registro con ID ${id}:`, error);
                    }
                } else {
                    console.log('No se ha seleccionado ninguna fila');
                }
            }


        } catch (error) {
            console.error('Error al cargar los datos:', error);
        }

        /*
        * Mensaje de Ejemplo
        * */

        $('#generarMensaje').click(function () {
            generarMensaje();
        });

        $('#generarMensaje').click(function () {
            generarMensaje();
        });

        async function generarMensaje() {
            // Deshabilita el botón y muestra el gif de carga
            $('#generarMensaje').prop('disabled', true);
            $('#loading').show();

            const urlConfiguracionRejilla = raizUrl + `/api/v1/complete-chat-no-mono`;
            const data = {
                modeloGenerado: "gpt-3.5-turbo",
                promp: "generame un mensaje de sms marketing, corto y conciso, con este caracter donde debe ir ${nombre}"
            };
            try {
                const responseConfiguracionRejilla = await axios.post(urlConfiguracionRejilla, data, {
                    headers: {
                        'Authorization': `Bearer ` + authToken
                    }
                });
                const smsEjemplo = document.getElementById('mensajeEjemplo');
                smsEjemplo.value = responseConfiguracionRejilla.data;
            } catch (error) {
                console.error(error);
            } finally {
                // Habilita el botón y oculta el gif de carga
                $('#generarMensaje').prop('disabled', false);
                $('#loading').hide();
            }
        }


    }


    /*
    * Comprobar si el usuario es administrador
    * */
    try {
        const response = await axios.get(raizUrl + '/usuarios/comprobarRoleAdministrador', {
            headers: {
                'Authorization': `Bearer ` + authToken
            }
        });

        if (response.data === false) {
            return null;
        }

        crearBotones();

        async function crearBotones() {
            const contendorBienvenida = $('#botones-admin');
            contendorBienvenida.css('display', 'block'); // Hace visible el contenedor
        }


        document.getElementById('usuarios').addEventListener('click', redirigirRejillaUsuario);

        async function redirigirRejillaUsuario() {
            window.location.href = '../usuarios/rejillaUsuarios.html';
        }

        /*

                document.getElementById('logout').addEventListener('click', redirigirLogout);

                async function redirigirLogout() {
                    window.location.href = '../usuarios/login.html';
                }

        */
    } catch (error) {
        console.error('Error al obtener usuarioId:', error);
    }


    /*
    * Actualizar rejilla
    * */
    function actualizarRejilla() {
        // Guarda el tamaño actual del contenedor antes de eliminar la tabla
        var container = document.getElementById('tabla-contenedor');
        lastContainerHeight = container.offsetHeight;

        // Elimina la tabla Handsontable
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Actualiza el tamaño del contenedor antes de recargar la tabla
        /*        if (lastContainerHeight) {
                    container.style.height = lastContainerHeight + 'px';
                } else {
                    container.style.height = 'auto';
                }*/

        loadData();
    }


    function removeHandsontable() {
        var container = document.getElementById('tabla-contenedor');
        lastContainerHeight = container.offsetHeight;

        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    function updateContainerSize() {
        var container = document.getElementById('tabla-contenedor');
        if (lastContainerHeight) {
            container.style.height = lastContainerHeight + 'px';
        } else {
            container.style.height = 'auto';
        }
    }
});


// Carga el SDK de Facebook de manera asíncrona
(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// Inicializa el SDK de Facebook
window.fbAsyncInit = function () {
    FB.init({
        appId: '598094998940576', // Reemplaza con tu App ID de Facebook
        cookie: true,
        xfbml: true,
        version: 'v12.0'
    });
};


// Función para manejar el inicio de sesión con Facebook
function loginWithFacebook() {

    FB.init({
        appId: '598094998940576',
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v12.0'
    });

    console.log("Iniciando sesión con Facebook");

    FB.login(function (response) {
        if (response.authResponse) {
            // ... (código anterior)

            // Si el inicio de sesión es exitoso, redirige al usuario al punto final de tu aplicación Spring Boot
            const url = raizUrl + `/login/facebook?accessToken=${response.authResponse.accessToken}`;
            axios.get(url, {
                headers: {
                    'Authorization': `Bearer ` + authToken
                }
            }).then(axiosResponse => {
                const data = axiosResponse.status;
                console.log(data);
                location.reload();

                /*
                                if (data === true) {
                                    location.reload();
                                }else {
                                    location.reload();
                                }
                */

            }).catch(error => {
                console.error('Error al realizar la solicitud a la API: ', error);
                location.reload();
            });

        } else {
            // Manejar el caso en que el usuario no complete el inicio de sesión
        }
    }, {scope: 'public_profile,email,pages_show_list,leads_retrieval'}); // Añade otros permisos aquí si es necesario

}

document.addEventListener("DOMContentLoaded", function () {
    const botonFacebook = document.getElementById("boton-facebook");

    botonFacebook.addEventListener("click", loginWithFacebook);
});


document.getElementById('logout').addEventListener('click', function () {
    fetch(raizUrl + '/api/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ` + authToken
        },
    })
        .then(function (response) {
            if (response.status === 200) {
                console.log('Sesión cerrada correctamente');
                window.location.href = '../../pantallas/usuarios/login.html';
                // Aquí puedes redirigir al usuario a la página de inicio de sesión o realizar otras acciones
            } else {
                console.log('Error al cerrar la sesión');
            }
        });
});