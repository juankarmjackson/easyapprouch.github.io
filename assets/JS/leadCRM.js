const authTokenLeadCRM = localStorage.getItem('authToken');
/*
const leadCRMUrl = 'http://localhost:8080';
*/
const leadCRMUrl = 'https://presupuestaya-production.up.railway.app';

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


    /*
    * HandSomeTable
    * */
    const usuarioId = localStorage.getItem('usuarioId');
    const username = localStorage.getItem('username');

    loadData();

    async function loadData() {

        /*
        * Añadimos datos desde Backend
        * */
        const paginaInput = document.getElementById('pagina');
        const limiteInput = document.getElementById('limite');

        const urlConfiguracionRejilla = leadCRMUrl + `/api/configuracionRejilla/usuario/${usuarioId}`;
        const responseConfiguracionRejilla = await axios.get(urlConfiguracionRejilla, {
            headers: {
                'Authorization': `Bearer ` + authTokenLeadCRM
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
            const tablaContenedor = document.getElementById('tabla-lead');

            // Vacía el contenedor de la tabla
            tablaContenedor.innerHTML = '';

            //Actualizamos la Tabla
            const url = leadCRMUrl + `/api/leads/findAllByUsuarioIdAndFechaCreacionDesc/${usuarioId}?page=${page}&size=${size}`;
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ` + authTokenLeadCRM
                }
            });
            const data = response.data;
            console.log(data);

            const container = document.getElementById('tabla-lead');
            const hotLeadCRM = new Handsontable(container, {
                filters: true, // Habilita los filtros
                dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
                data: data,
                fixedColumnsStart: 2,
                manualColumnFreeze: true,
                rowHeaders: true,
                colHeaders: ['ID', 'Nombre', 'Teléfono', 'Email',
                    'Estado', 'Fecha Registro', 'Observación', 'Activar Julex'],
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
                        data: 'fechaRegistro',
                        type: 'date',
                        readOnly: true // Añade esta línea para hacer la columna de solo lectura
                    },
                    {
                        data: 'boton',
                        renderer: botonRenderer
                    }
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

            function botonRenderer(instance, td, row, col, prop, value, cellProperties) {
                var button = document.createElement('button');
                button.className = 'btn btn-outline-dark btn-sm';
                button.innerHTML = '<i class="bi bi-skip-end-circle"></i>' + ' Activar Julex';
                button.onclick = function () {
                    // Aquí puedes manejar el evento de clic del botón
                    var leadName = instance.getDataAtRowProp(row, 'nombre');
                    alert('Julex ha empezado trabajar con ' + leadName);
                };
                Handsontable.dom.empty(td);
                td.appendChild(button);
            }


            /*
            * Añadir fila
            * */
            var addRowHandler = function () {
                hotLeadCRM.alter('insert_row', 0);

                // Obtén los datos de la nueva fila
                var newRowData = hotLeadCRM.getDataAtRow(0);
                hotLeadCRM.setDataAtCell(0, 1, "NuevaFila");
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
                    id: hotLeadCRM.getDataAtCell(row, 0) || -1,
                    nombre: hotLeadCRM.getDataAtCell(row, 1),
                    telefono: hotLeadCRM.getDataAtCell(row, 2),
                    email: hotLeadCRM.getDataAtCell(row, 3),
                    whatsapp: hotLeadCRM.getDataAtCell(row, 4) || false,
                    llamada: hotLeadCRM.getDataAtCell(row, 5) || false,
                    emailEnviado: hotLeadCRM.getDataAtCell(row, 6) || false,
                    estadoNombre: hotLeadCRM.getDataAtCell(row, 7),
                    fecha: hotLeadCRM.getDataAtCell(row, 8),
                    observacion: hotLeadCRM.getDataAtCell(row, 10),
                    smsEnviado: hotLeadCRM.getDataAtCell(row, 11) || false,
                    mensajeSMS: hotLeadCRM.getDataAtCell(row, 12),
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
                const id = hotLeadCRM.getDataAtCell(row, 0) || -1; // Asegúrate de que la columna 0 contiene el ID
                const registro = {
                    nombre: hotLeadCRM.getDataAtCell(row, 1),
                    telefono: hotLeadCRM.getDataAtCell(row, 2),
                    email: hotLeadCRM.getDataAtCell(row, 3),
                    whatsapp: hotLeadCRM.getDataAtCell(row, 4) || false,
                    llamada: hotLeadCRM.getDataAtCell(row, 5) || false,
                    emailEnviado: hotLeadCRM.getDataAtCell(row, 6) || false,
                    estadoNombre: hotLeadCRM.getDataAtCell(row, 7),
                    fecha: hotLeadCRM.getDataAtCell(row, 8),
                    observacion: hotLeadCRM.getDataAtCell(row, 10),
                    smsEnviado: hotLeadCRM.getDataAtCell(row, 11) || false,
                    mensajeSMS: hotLeadCRM.getDataAtCell(row, 12),
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
            hotLeadCRM.addHook('beforeChange', (changes, source) => {
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


            function guardarRegistro(registro) {
                return axios.post(leadCRMUrl + '/api/leads', registro, {
                    headers: {
                        'Authorization': `Bearer ` + authTokenLeadCRM,
                        'Content-Type': 'application/json'
                    }
                });
            }

            function actualizarRegistro(id, registro) {
                return axios.put(leadCRMUrl + `/api/leads/${id}`, registro, {
                    headers: {
                        'Authorization': `Bearer ` + authTokenLeadCRM,
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
                const filaSeleccionada = hotLeadCRM.getSelectedLast();

                // Comprueba si se ha seleccionado una fila
                if (filaSeleccionada) {
                    const row = filaSeleccionada[0];

                    // Comprueba si no es la última fila (la fila de "nuevo registro")
                    const id = hotLeadCRM.getDataAtCell(row, 0);

                    // Elimina el registro en el servidor
                    try {
                        await axios.delete(leadCRMUrl + `/api/leads/${id}`, {
                            headers: {
                                'Authorization': `Bearer ` + authTokenLeadCRM
                            }
                        });
                        console.log(`Registro con ID ${id} eliminado con éxito`);

                        // Elimina la fila de la tabla
                        hotLeadCRM.alter('remove_row', row);
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

            const urlConfiguracionRejilla = leadCRMUrl + `/api/v1/complete-chat-no-mono`;
            const data = {
                modeloGenerado: "gpt-3.5-turbo",
                promp: "generame un mensaje de sms marketing, corto y conciso, con este caracter donde debe ir ${nombre}"
            };
            try {
                const responseConfiguracionRejilla = await axios.post(urlConfiguracionRejilla, data, {
                    headers: {
                        'Authorization': `Bearer ` + authTokenLeadCRM
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
    * Actualizar rejilla
    * */
    function actualizarRejilla() {
        // Guarda el tamaño actual del contenedor antes de eliminar la tabla
        var container = document.getElementById('tabla-lead');
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
});
