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
            window.location.href = '../../pantallas/usuarios/loginJulex.html';
            console.error('El usuarioId no es un entero:', usuarioId);
        }

    } catch (error) {
        window.location.href = '../../pantallas/usuarios/loginJulex.html';
        console.error('Error al obtener usuarioId:', error);
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


    loadDataProductos();

    /*
    * Cambio en Configuracion Rejilla
    * */
    /*

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
    */


    /*
    * HandSomeTable
    * */

    async function loadDataProductos() {

        /*
        * Añadimos datos desde Backend
        * */

        try {
            let isPasting = false;
            let pastedData = [];
            const tablaContenedor = document.getElementById('tabla-productos');
            const id = document.getElementById('formularioBotId').value || -1;

            // Vacía el contenedor de la tabla
            tablaContenedor.innerHTML = '';

            //Actualizamos la Tabla
            const url = raizUrl + `/productos/formulario_bot/${id}`;
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ` + authToken
                }
            });
            const data = response.data;
            console.log(data);

            const container = document.getElementById('tabla-productos');
            const hot = new Handsontable(container, {
                filters: true, // Habilita los filtros
                dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
                data: data,
                fixedColumnsStart: 1,
                manualColumnFreeze: true,
                rowHeaders: true,
                colHeaders: ['ID', 'Nombre', 'Descripcion', 'Tipo de Cliente', 'Precio'],
                columns: [
                    {
                        data: 'id',
                    },
                    {
                        data: 'nombre',
                    },
                    {
                        data: 'descripcion',
                    },
                    {
                        data: 'tipoCliente',
                    },
                    {
                        data: 'precio',
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
                    if (col === 2) {
                        addTooltip(TH, 'Breve descripción de lo que se le ofrecerá al cliente');
                    } else if (col === 3) {
                        addTooltip(TH, 'Breve descripción del tipo de cliente al que se le ofrecerá el servicio, importante para las preguntas del bot');
                    } else if (col === 4) {
                        addTooltip(TH, 'El precio del producto');
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
                hot.setDataAtCell(0, 1, "Nuevo Producto");
                // Llama a tu función para guardar la nueva fila
                guardarFilaFirst("Nuevo Producto", newRowData);
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
                    descripcion: hot.getDataAtCell(row, 2),
                    tipoCliente: hot.getDataAtCell(row, 3),
                    precio: hot.getDataAtCell(row, 4),
                    formularioBotId: $('#formularioBotId').val(),
                };

                const camposObligatorios = ['nombre'];
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
                    descripcion: null,
                    tipoCliente: null,
                    precio: null,
                    formularioBotId: $('#formularioBotId').val(),
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
                    descripcion: hot.getDataAtCell(row, 2),
                    tipoCliente: hot.getDataAtCell(row, 3),
                    precio: hot.getDataAtCell(row, 4),
                    formularioBotId: $('#formularioBotId').val(),
                };

                const camposObligatorios = ['nombre'];
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
                    descripcion: row['descripcion'],
                    tipoCliente: row['tipoCliente'],
                    precio: row['precio'],
                    formularioBotId: $('#formularioBotId').val(),
                };

                const camposObligatorios = ['nombre'];
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
                    numeroTotal.innerHTML = 10;

                    // CONTACTADOS TOTAL
                    const contactadosTotal = document.getElementById('contactados');
                    contactadosTotal.innerHTML = 1;

                    // EN NEGOCIACION
                    const enNegociacion = document.getElementById('negociacion');
                    enNegociacion.innerHTML = 1;

                    // EN CIERRES
                    const cierres = document.getElementById('cierres');
                    cierres.innerHTML = 1;

                    // TASA
                    let tasa = Number(kpis.numeroLeadTotales / kpis.numeroLeadsCerrados).toFixed(1);
                    const tasaCierre = document.getElementById('tasa');
                    tasaCierre.innerHTML = '100' + '%';

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
                return axios.post(raizUrl + '/productos', registro, {
                    headers: {
                        'Authorization': `Bearer ` + authToken,
                        'Content-Type': 'application/json'
                    }
                });
            }

            function actualizarRegistro(id, registro) {
                return axios.put(raizUrl + `/productos/${id}`, registro, {
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
                        await axios.delete(raizUrl + `/productos/${id}`, {
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
                window.location.href = '../../pantallas/usuarios/loginJulex.html';
                // Aquí puedes redirigir al usuario a la página de inicio de sesión o realizar otras acciones
            } else {
                console.log('Error al cerrar la sesión');
            }
        });
});