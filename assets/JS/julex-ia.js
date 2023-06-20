function fetchData() {
    const boardId = document.getElementById('boardIdInput').value;
  
    const monday = window.mondaySdk();
  
    monday.setToken('eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjI2MzEzMjIxOSwiYWFpIjoxMSwidWlkIjo0MzU1OTExNCwiaWFkIjoiMjAyMy0wNi0xNlQxODowMDowOS4wNDdaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTcwMjMxNTYsInJnbiI6ImV1YzEifQ.-6cmn0a_h328a1fE2be4uQ-qzx65vcgBIH1UA5xCoFs'); // Reemplaza "YOUR_API_KEY" con tu clave de API
  
    monday.api(`query {
      boards(ids: ${boardId}) {
        name
        columns {
          id
          title
          settings_str
        }
        items {
          id
          name
          column_values {
            id
            value
            title
          }
        }
      }
    }`).then(response => {
      const board = response.data.boards[0];
      console.log('Datos del board:', board);
  
      const tableHtml = createTable(board.items);
      const tablaContainer = document.getElementById('tablaContainer');
      tablaContainer.innerHTML = tableHtml;
    }).catch(error => {
      console.log('Error al obtener los datos:', error);
    });
  }
  
  function createTable(items) {
    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Valor de los Nombres</th>
            <th>Valor de los Correos Electrónicos</th>
            <th>Valor de los Teléfonos</th>
            <th>Julex</th>
          </tr>
        </thead>
        <tbody>
    `;
  
    items.forEach(item => {
      const nombre = item.name || '';
      const email = getItemColumnValue(item, 'correo_electr_nico');
      const telefono = getItemColumnValue(item, 'tel_fono');
  
      tableHtml += `
        <tr>
          <td>${nombre}</td>
          <td>${email}</td>
          <td>${telefono}</td>
          <td><img src="cargando.gif" style="width: 30px" alt="Cargando"></td>
        </tr>
      `;
    });
  
    tableHtml += `
        </tbody>
      </table>
    `;
  
    return tableHtml;
  }
  
  function getItemColumnValue(item, columnId) {
    const columnValues = item.column_values;
    const columnValue = columnValues.find(value => value.id === columnId);
    if (columnValue) {
      const { value } = columnValue;
      if (value) {
        try {
          const parsedValue = JSON.parse(value);
          if (parsedValue.phone) {
            return parsedValue.phone;
          } else {
            return parsedValue.text || '';
          }
        } catch (error) {
          return value;
        }
      }
    }
    return '';
  }
  