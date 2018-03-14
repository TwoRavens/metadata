import data from '../data/fearonLaitin.json'

export let getData = () => data;
export let accordionStatistics = ['numchar', 'nature', 'binary', 'interval', 'time'];

export let usedVariables = new Set();
export let allVariables = Object.keys(data['variables']);

// If variable is not set, then it sets all variables.
export let setUsedVariable = (status, variable) => {
    if (variable) status ? usedVariables.add(variable) : usedVariables.delete(variable);
    else usedVariables = status ? new Set(allVariables) : new Set();

    console.log(usedVariables);
};

export let selectedVariable = '';
export let selectVariable = (variable) =>
    selectedVariable = selectedVariable === variable ? '' : variable;

export let partitionVariableTable = (variableTable) => {
    let upperVars = [];
    let lowerVars = [];

    let upper = true;
    for (let row of variableTable) {
        if (upper) upperVars.push(row);
        else lowerVars.push(row);

        if (row[0] === selectedVariable) upper = false;
    }
    return {upper: upperVars, lower: lowerVars};
};

export let setField = (variable, field, value) => {
    console.log(variable + ' ' + field + ' ' + value)
};


export let getVariable = (name) => data['variables'][name];

export let customStatistics = [];
