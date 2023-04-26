document.addEventListener('DOMContentLoaded', async function () {

    let estados = [];
    const authToken = localStorage.getItem('authToken');

    try {
        const response = await axios.get('https://presupuestaya-production.up.railway.app/usuarios/obtenerUsuarioIdByAutentication', {
            headers: {
                'Authorization': `Bearer ` + authToken
            }
        });
        localStorage.setItem('usuarioId', response.data);


    } catch (error) {
        console.error('Error al obtener usuarioId:', error);
    }

    try {
        const response = await axios.get('https://presupuestaya-production.up.railway.app/usuarios/obtenerUsernameByAutentication', {
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

    fetchEstados();

    async function fetchEstados() {
        try {
            const response = await axios.get('https://presupuestaya-production.up.railway.app/api/estados', {
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
            await axios.put(`https://presupuestaya-production.up.railway.app/api/configuracionRejilla/${usuarioId}`, registroConfiguracionRejilla, {
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

        const urlConfiguracionRejilla = `https://presupuestaya-production.up.railway.app/api/configuracionRejilla/usuario/${usuarioId}`;
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
            const url = `https://presupuestaya-production.up.railway.app/api/leads/findAllByUsuarioIdAndFechaCreacionDesc/${usuarioId}?page=${page}&size=${size}`;
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ` + authToken
                }
            });
            const data = response.data;
            console.log(data);

            const container = document.getElementById('tabla-contenedor');
            const hot = new Handsontable(container, {
                data: data,

                rowHeaders: true,
                colHeaders: ['ID', 'Nombre', 'Teléfono', 'Email', 'WhatsApp', 'Llamada', 'Email Enviado', 'Estado', 'Fecha de Registro', 'Observación'],
                columns: [
                    {data: 'id'},
                    {data: 'nombre'},
                    {data: 'telefono'},
                    {data: 'email'},
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
                    {data: 'fechaCreacion', type: 'date'},
                    {data: 'observacion'},
                ],


                manualRowMove: true,
                manualColumnMove: true,
                contextMenu: ['row_above', 'row_below', 'remove_row', 'undo', 'redo'],
                licenseKey: 'non-commercial-and-evaluation',
                minSpareRows: 1,
                hiddenColumns: {
                    columns: [0], // Agrega esta línea para ocultar la columna ID
                    indicators: false // Desactiva los indicadores visuales de las columnas ocultas
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
                            nombre: hot.getDataAtCell(row, 1),
                            telefono: hot.getDataAtCell(row, 2),
                            email: hot.getDataAtCell(row, 3),
                            whatsapp: hot.getDataAtCell(row, 4) || false,
                            llamada: hot.getDataAtCell(row, 5) || false,
                            emailEnviado: hot.getDataAtCell(row, 6) || false,
                            estadoNombre: hot.getDataAtCell(row, 7),
                            fechaCreacion: hot.getDataAtCell(row, 8),
                            observacion: hot.getDataAtCell(row, 9),
                        };


                        const camposObligatorios = ['nombre', 'whatsapp', 'llamada', 'emailEnviado', 'estadoNombre', 'fechaCreacion'];
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
                            nombre: hot.getDataAtCell(row, 1),
                            telefono: hot.getDataAtCell(row, 2),
                            email: hot.getDataAtCell(row, 3),
                            whatsapp: hot.getDataAtCell(row, 4) || false,
                            llamada: hot.getDataAtCell(row, 5) || false,
                            emailEnviado: hot.getDataAtCell(row, 6) || false,
                            estadoNombre: hot.getDataAtCell(row, 7),
                            fechaCreacion: hot.getDataAtCell(row, 8),
                            observacion: hot.getDataAtCell(row, 9),
                        };

                        const camposObligatorios = ['nombre', 'whatsapp', 'llamada', 'emailEnviado', 'estadoNombre', 'fechaCreacion'];
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


            // CONTADOR TOTAL

            let count = 0;
            for (let i = 0; i < data.length; i++) {
                if (data[i][0] !== null && data[i][0] !== '') {
                    count++;
                }
            }

            const numeroTotal = document.getElementById('resultado');
            numeroTotal.innerHTML = +count;

            // CONTACTADOS TOTAL

            let contactados = 0;
            for (let i = 0; i < hot.countRows(); i++) {
                if (data[i].estadoNombre === 'Contactado') {
                    contactados++;
                }
            }

            const contactadosTotal = document.getElementById('contactados');
            contactadosTotal.innerHTML = +contactados;

            // EN NEGOCIACION
            let countEnNegociacion = 0;
            for (let i = 0; i < hot.countRows(); i++) {
                if (data[i].estadoNombre === 'En Negociacion') {
                    countEnNegociacion++;
                }
            }

            const enNegociacion = document.getElementById('negociacion');
            enNegociacion.innerHTML = +countEnNegociacion;


            // EN CIERRES
            let countCierres = 0;
            for (let i = 0; i < hot.countRows(); i++) {
                if (data[i].estadoNombre === 'Cerrado') {
                    countCierres++;
                }

                console.log(hot.countRows());
            }


            const cierres = document.getElementById('cierres');
            cierres.innerHTML = +countCierres;

            //TASA

            let tasa = Number(count / countCierres).toFixed(1);
            const tasaCierre = document.getElementById('tasa');
            tasaCierre.innerHTML = +tasa;

            /*
            hot.addHook('afterCreateRow', function (index, amount) {

            });*/

            function isLastRow(row) {
                const lastRow = hot.countRows() - 2;
                return row === lastRow;
            }

            function guardarRegistro(registro) {
                return axios.post('https://presupuestaya-production.up.railway.app/api/leads', registro, {
                    headers: {
                        'Authorization': `Bearer ` + authToken,
                        'Content-Type': 'application/json'
                    }
                });
            }

            function actualizarRegistro(id, registro) {
                return axios.put(`https://presupuestaya-production.up.railway.app/api/leads/${id}`, registro, {
                    headers: {
                        'Authorization': `Bearer ` + authToken,
                        'Content-Type': 'application/json'
                    }
                });
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
                        await axios.delete(`https://presupuestaya-production.up.railway.app/api/leads/${id}`, {
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


});
