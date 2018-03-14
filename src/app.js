import data from '../data/fearonLaitin.json'
import m from 'mithril'

export let accordionStatistics = ['numchar', 'nature', 'binary', 'interval', 'time'];

export let variableTable = [];
export let updateVariableTable = () => {
    for (let variable in data['variables']) {
        variableTable.push([variable, data['variables']['labl']]);
    }
};

updateVariableTable();

export let selectedVariable = '';
export let selectVariable = (variable) => selectedVariable = variable;

export let partitionVariableTable = () => {
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

export let getVariable = (name) => data['variables'][name];

export let customStatistics = [];
