const row_count = 6;
    const col_count = 3;

    const default_input1 = [
      ['A', 4, 3],
      ['B', 5, 6],
      ['C', 7, 0]
    ];

    const default_input2 = [
      ['A', 6, 1],
      ['D', 0, 9],
      ['E', 4, 8]
    ];

    buildInputTable('input1-body', default_input1);
    buildInputTable('input2-body', default_input2);

    function buildInputTable(tbody_id, default_data) {
      const tbody = document.getElementById(tbody_id);

      for (let row = 0; row < row_count; row++) {
        const tr = document.createElement('tr');

        for (let col = 0; col < col_count; col++) {
          const td = document.createElement('td');
          const input = document.createElement('input');

          if (col === 0) {
            input.type = 'text';
          } else {
            input.type = 'number';
          }


          td.appendChild(input);
          tr.appendChild(td);
        }

        tbody.appendChild(tr);
      }
    }

    function readInputTable(tbody_id) {
      const tbody = document.getElementById(tbody_id);
      const rows = tbody.getElementsByTagName('tr');
      const data = [];

      for (const row of rows) {
        const inputs = row.getElementsByTagName('input');
        const ingredient = inputs[0].value.trim();
        const val1 = Number(inputs[1].value);
        const val2 = Number(inputs[2].value);

        if (ingredient !== '') {
          data.push([ingredient, val1, val2]);
        }
      }

      return data;
    }

    function calculateAverages() {
      const input1 = readInputTable('input1-body');
      const input2 = readInputTable('input2-body');
      const myMap = new Map();

      for (const amt of input1) {
        putInMap(myMap, amt);
      }

      for (const amt of input2) {
        putInMap(myMap, amt);
      }

      for (const key of myMap.keys()) {
        myMap.get(key)[0] = myMap.get(key)[0] / 2;
        myMap.get(key)[1] = myMap.get(key)[1] / 2;
      }

      displayOutput(myMap);
      console.log(myMap);
    }

    function putInMap(myMap, amt) {
      const key = amt[0];
      let val1 = amt[1];
      let val2 = amt[2];

      if (myMap.get(key) === undefined) {
        myMap.set(key, [0, 0]);
      }

      val1 += myMap.get(key)[0];
      val2 += myMap.get(key)[1];
      myMap.set(key, [val1, val2]);
    }

    function displayOutput(myMap) {
      const tbody = document.getElementById('output-body');
      tbody.innerHTML = '';

      for (const [key, values] of myMap) {
        const tr = document.createElement('tr');

        const ingredient_td = document.createElement('td');
        ingredient_td.textContent = key;
        tr.appendChild(ingredient_td);

        const val1_td = document.createElement('td');
        val1_td.textContent = values[0];
        tr.appendChild(val1_td);

        const val2_td = document.createElement('td');
        val2_td.textContent = values[1];
        tr.appendChild(val2_td);

        tbody.appendChild(tr);
      }
    }