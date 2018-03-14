import data from '../data/fearonLaitin.json'

export let getData = () => data;
export let accordionStatistics = ['numchar', 'nature', 'binary', 'interval', 'time'];

export let usedVariables = new Set();
export let allVariables = Object.keys(data['variables']);

// If variable is not set, then it sets all variables.
export let setUsedVariable = (status, variable) => {
    if (variable) status ? usedVariables.add(variable) : usedVariables.delete(variable);
    else usedVariables = status ? new Set(allVariables) : new Set();
};

export let selectedVariable;
export let selectVariable = (variable) =>
    selectedVariable = selectedVariable === variable ? undefined : variable;

export let partitionVariableTable = (variableTable) => {
    let isUpper = true;
    let upperVars = variableTable.filter((row) => {
        if (row[0] === selectedVariable) { isUpper = false; return true; }
        return isUpper;
    });

    let isLower = false;
    let lowerVars = variableTable.filter((row) => {
        if (row[0] === selectedVariable) { isLower = true; return false; }
        return isLower;
    });

    return {upper: upperVars, lower: lowerVars};
};

export let customFields = {};
export let setCustomField = (variable, field, value) => {
    // create key for variable if it does not exist
    customFields[variable] = customFields[variable] || {};
    customFields[variable][field] = value;
};


export let statisticUIDCount = {};
export let customStatistics = {};
export let setCustomStatistic = (variable, statUID, field, value) => {
    // create key for variable if it does not exist
    if (!customStatistics[variable]) {
        customStatistics[variable] = {};
        statisticUIDCount[variable] = -1;
    }

    // create key for new statistic if UID does not exist
    if (statUID > statisticUIDCount[variable]) {

        // ignore if no value was added (prevents adding new empty rows)
        if (value === '') return;

        customStatistics[variable][statUID] = customStatistics[variable][statUID] || {};
        statisticUIDCount[variable]++;
    }

    // set value in field in statistic in variable
    customStatistics[variable][statUID][field] = value;
};