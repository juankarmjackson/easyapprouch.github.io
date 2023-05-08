document.addEventListener('DOMContentLoaded', async function () {

    let roles = [];
    let rolesString = [];
    const authToken = localStorage.getItem('authToken');
    /*
        const raizUrl = 'http://localhost:8080';
    */
    const raizUrl = 'https://presupuestaya-production.up.railway.app';

    try {
        const response = await axios.get(raizUrl + '/usuarios/obtenerUsuarioIdByAutentication', {
            headers: {
                'Authorization': `Bearer ` + authToken
            }
        });
        localStorage.setItem('usuarioId', response.data);


    } catch (error) {
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
        contendorBienvenida.innerHTML = '<h1> Bienvenido ' + username + '</h1>';

    }

    fetchRoles();

    async function fetchRoles() {
        try {
            const response = await axios.get(raizUrl + '/api/roles', {
                headers: {
                    'Authorization': `Bearer ` + authToken
                }
            });
            roles = response.data;
        } catch (error) {
            console.error('Error al obtener los roles:', error);
        }
    }

    fetchRolesString();

    async function fetchRolesString() {
        try {
            const response = await axios.get(raizUrl + '/api/roles', {
                headers: {
                    'Authorization': `Bearer ` + authToken
                }
            });
            rolesString = response.data.map(role => (role.name));
        } catch (error) {
            console.error('Error al obtener los roles:', error);
        }
    }


    loadData();

    const paginaInput = document.getElementById('pagina');
    const limiteInput = document.getElementById('limite');

    paginaInput.addEventListener('change', cambioPaginado);
    limiteInput.addEventListener('change', cambioPaginado);


    async function cambioPaginado() {

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
    * Paginación de registros
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
            const tablaContenedor = document.getElementById('tabla-contenedor');

            // Vacía el contenedor de la tabla
            tablaContenedor.innerHTML = '';

            //Actualizamos la Tabla
            const url = raizUrl + `/usuarios/all`;
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ` + authToken
                }
            });
            const data = response.data;
            console.log(data);

            function rolesRenderer(instance, td, row, col, prop, value, cellProperties) {
                if (value && Array.isArray(value)) {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                    td.textContent = value.map(role => role.name).join(', ');
                } else {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                }
            }


            // Registrar el renderizador personalizado
            Handsontable.renderers.registerRenderer('rolesRenderer', rolesRenderer);


            const container = document.getElementById('tabla-contenedor');
            const hot = new Handsontable(container, {
                data: data,
                rowHeaders: true,
                colHeaders: ['ID', 'Nombre de usuario', 'Contraseña', 'Roles', 'Link Miro'],
                columns: [
                    {data: 'id'},
                    {data: 'username'},
                    {
                        data: 'password',
                        renderer: 'password',
                    },
                    {
                        data: 'roles',
                        renderer: 'rolesRenderer',
                        editor: 'select',
                        selectOptions: rolesString,
                        multiple: true,
                        strict: true,
                        onBeforeChange: function rolesAfterChange(changes, source) {
                            if (source === 'edit' || source === 'autofill') {
                                for (const change of changes) {
                                    const row = change[0];
                                    const col = change[1];
                                    const oldValue = change[2];
                                    const newValue = change[3];

                                    if (col === 'roles') {
                                        const selectedRoles = newValue.split(',').map(roleName => roles.find(role => role.name === roleName.trim()));
                                        hot.setDataAtCell(row, col, selectedRoles);
                                    }
                                }
                            }
                        },
                    },
                    {
                        data: 'tokenMiro',
                        width: 300,
                    },
                ],
                manualRowMove: true,
                manualColumnMove: true,
                contextMenu: ['row_above', 'row_below', 'remove_row', 'undo', 'redo'],
                licenseKey: 'non-commercial-and-evaluation',
                minSpareRows: 1,
                hiddenColumns: {/*
                    columns: [0], // Agrega esta línea para ocultar la columna ID
                    indicators: false // Desactiva los indicadores visuales de las columnas ocultas
                */
                },
                beforeCopy: function (data, coords) {
                    for (let i = 0; i < data.length; i++) {
                        data[i][0] = ''; // Establece el primer elemento (ID) de cada fila copiada como vacío
                    }
                },
                afterChange: function (changes, source) {
                    if (source === 'loadData') {
                        return;
                    }

                    // Obtén la fila y la columna modificadas
                    const row = changes[0][0];
                    const column = changes[0][1];

                    // Comprueba si es la última fila (la fila de "nuevo registro")
                    if (!isLastRow(row)) {
                        // Actualizar registros existentes
                        /*
                        * Tener cuidado con el ID 0, si existe en BDD puede ser una putada
                        * */
                        const id = hot.getDataAtCell(row, 0) || -1; // Asegúrate de que la columna 0 contiene el ID
                        const registro = {
                            username: hot.getDataAtCell(row, 1),
                            password: hot.getDataAtCell(row, 2),
                            roles: hot.getDataAtCell(row, 3),
                            tokenMiro: hot.getDataAtCell(row, 4),
                        };


                        const camposObligatorios = ['username', 'password', 'roles'];
                        const registroCompleto = camposObligatorios.every((campo) => registro[campo] !== null && registro[campo] !== undefined && registro[campo] !== '');

                        if (registroCompleto) {
                            console.log("Actualizando registro");
                            // Llama a la función actualizarRegistro y maneja la respuesta
                            actualizarRegistro(id, registro)
                                .then(function (response) {
                                    console.log('Registro actualizado con éxito:', response.data);
                                })
                                .catch(function (error) {
                                    console.error('Error al actualizar el registro:', error);
                                });
                        } else {
                            console.log('No se puede guardar el registro, faltan datos.');
                        }
                    } else {
                        // Crea un nuevo registro a partir de los datos de la fila
                        const registro = {
                            id: hot.getDataAtCell(row, 0) || -1,
                            username: hot.getDataAtCell(row, 1),
                            password: hot.getDataAtCell(row, 2),
                            roles: hot.getDataAtCell(row, 3),
                            tokenMiro: hot.getDataAtCell(row, 4),
                        };


                        const camposObligatorios = ['username', 'password', 'roles'];
                        const registroCompleto = camposObligatorios.every((campo) => registro[campo] !== null && registro[campo] !== undefined && registro[campo] !== '');

                        if (registroCompleto) {

                            if (registro.id !== -1) {
                                console.log("Actualizando registro");
                                // Llama a la función actualizarRegistro y maneja la respuesta
                                actualizarRegistro(registro.id, registro)
                                    .then(function (response) {
                                        console.log('Registro actualizado con éxito:', response.data);
                                    })
                                    .catch(function (error) {
                                        console.error('Error al actualizar el registro:', error);
                                    });
                            } else {
                                console.log("Creando nuevo registro");
                                // Llama a la función guardarRegistro y maneja la respuesta
                                guardarRegistro(registro)
                                    .then(function (response) {
                                        console.log('Registro guardado con éxito:', response.data);
                                        actualizarRejilla();
                                    })
                                    .catch(function (error) {
                                        console.error('Error al guardar el registro:', error);
                                    });

                                console.log('Se ha añadido una nueva fila en el índice:', row);
                                // Código para añadir una nueva fila
                            }
                            ;
                        } else {
                            console.log('No se puede guardar el registro, faltan datos.');
                        }
                    }
                },
            });

            function isLastRow(row) {
                const lastRow = hot.countRows() - 2;
                return row === lastRow;
            }

            function guardarRegistro(registro) {
                return axios.post(raizUrl + '/usuarios/save', registro, {
                    headers: {
                        'Authorization': `Bearer ` + authToken,
                        'Content-Type': 'application/json'
                    }
                });
            }

            function actualizarRegistro(id, registro) {
                return axios.put(raizUrl + `/usuarios/${id}`, registro, {
                    headers: {
                        'Authorization': `Bearer ` + authToken,
                        'Content-Type': 'application/json'
                    }
                });
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
                        await axios.delete(raizUrl + `/usuarios/${id}`, {
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

            const botonesAdmin = document.getElementById('botones-admin');
            botonesAdmin.innerHTML = "\n" +
                "    <button id=\"leads\" class=\"leads\">Leads CRM</button>\n" +
                "    <button id=\"clientes-potenciales\" class=\"clientes-potenciales\">Rejilla Clientes Potenciales</button>\n"

        }

        document.getElementById('leads').addEventListener('click', redirigirRejillaLeads);

        async function redirigirRejillaLeads() {
            window.location.href = '../leads/leadCRM.html';
        }

        document.getElementById('clientes-potenciales').addEventListener('click', redirigirRejillaClientesPotenciales);

        async function redirigirRejillaClientesPotenciales() {
            window.location.href = '../clientePotenciales/rejillaClientesPotenciales.html';
        }

    } catch (error) {
        console.error('Error al obtener usuarioId:', error);
    }

    document.getElementById('logout').addEventListener('click', redirigirLogout);

    async function redirigirLogout() {
        window.location.href = '../usuarios/login.html';
    }

});
