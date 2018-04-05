import data from '../static/data/fearonLaitin.json';

export let {variables} = data;

let isResizingEditor = false;
export let leftpanelSize = 50;
export let resizeEditor = (e) => {
    isResizingEditor = true;
    document.body.classList.add('no-select');
    resizeEditorTick(e);
};

let resizeEditorTick = (e) => {
    leftpanelSize = (1 - e.clientX / document.getElementById('editor').clientWidth) * 100;

    document.getElementById('variables').style.right = leftpanelSize + "%";
    document.getElementById('statistics').style.width = leftpanelSize + "%";
};

document.onmousemove = (e) => isResizingEditor && resizeEditorTick(e);

document.onmouseup = () => {
    if (isResizingEditor) {
        isResizingEditor = false;
        document.body.classList.remove('no-select');
    }
};

export let getData = () => data;
export let accordionStatistics = ['labl', 'numchar', 'nature', 'binary', 'interval', 'time'];
export let ontologyStatistics = ['classification', 'units', 'note'];
export let editableStatistics = ['numchar', 'nature', 'time', 'labl', 'varnameTypes', ...ontologyStatistics];

export let allVariables = Object.keys(data['variables']);
export let usedVariables = new Set(allVariables);

// If passed variable is undefined, then all variables are set.
export let setUsedVariable = (status, variable) => {
    if (variable) status ? usedVariables.add(variable) : usedVariables.delete(variable);
    else usedVariables = status ? new Set(allVariables) : new Set();
};

export let selectedVariable;
export let setSelectedVariable = (variable) => {
    selectedVariable = selectedVariable === variable ? undefined : variable;

    // all statistics are enabled by default
    if (!usedStatistics[selectedVariable]) {
        usedStatistics[selectedVariable] = new Set(Object.keys(data['variables'][selectedVariable] || {})
            .filter((stat) => isStatistic(selectedVariable, stat)));
    }
};

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
export let setCustomField = (variable, statistic, field, value) => {
    // ignore non-edits
    if (data['variables'][variable][field] === value) {
        if (customFields[variable] && customFields[variable][statistic])
            delete customFields[variable][statistic][field];
        return;
    }

    // create key for variable if it does not exist
    customFields[variable] = customFields[variable] || {};
    customFields[variable][statistic] = customFields[variable][statistic] || {};
    customFields[variable][statistic][field] = value;
};


export let statisticUIDCount = {};
export let customStatistics = {};
export let setCustomStatistic = (variable, statUID, field, value) => {
    // create key for variable if it does not exist
    if (!customStatistics[variable]) {
        customStatistics[variable] = {};
        statisticUIDCount[variable] = 0;
    }

    // delete empty values/statistics
    if (value === '') {
        // ignore adding empty field to nonexistent statistic
        if (!customStatistics[variable][statUID]) return;

        // delete the field
        delete customStatistics[variable][statUID][field];

        // attempt to delete the statistic
        if (Object.keys(customStatistics[variable][statUID]).length === 0) {
            delete customStatistics[variable][statUID];
            usedCustomStatistics[variable].delete(parseInt(statUID));
        }

        return;
    }

    // create key for new statistic if UID does not exist
    if (statUID > statisticUIDCount[variable]) {
        customStatistics[variable][statUID] = customStatistics[variable][statUID] || {};

        // enable new custom statistics by default
        setUsedCustomStatistic(true, variable, statUID);
        statisticUIDCount[variable]++;
    }

    // set value in field in statistic in variable
    customStatistics[variable][statUID][field] = value;
};

let statisticalDatatypes = ['string', 'number', 'boolean'];

// Checks if an entry for a variable is a statistic
export let isStatistic = (variable, stat) =>
    accordionStatistics.indexOf(stat) === -1 &&
        statisticalDatatypes.indexOf(typeof(data['variables'][variable][stat])) !== -1;

export let usedStatistics = {};
// If statistic is undefined, all statistics are set
export let setUsedStatistic = (status, variable, statistic) => {
    // create key for variable if it does not exist
    usedStatistics[variable] = usedStatistics[variable] || new Set();
    if (statistic) {
        status ?
            usedStatistics[variable].add(statistic) :
            usedStatistics[variable].delete(statistic);
    } else {
        usedStatistics[variable] = status ?
            new Set(Object.keys(data['variables'][variable]).filter((stat) => isStatistic(variable, stat))) :
            new Set();
    }
};

export let usedCustomStatistics = {};
// If UID is undefined, all UIDs are set
export let setUsedCustomStatistic = (status, variable, UID) => {
    // create key for variable if it does not exist
    usedCustomStatistics[variable] = usedCustomStatistics[variable] || new Set();
    if (UID) {
        status ?
            usedCustomStatistics[variable].add(UID) :
            usedCustomStatistics[variable].delete(UID);
    } else {
        usedCustomStatistics[variable] = status ?
            new Set(Object.keys(customStatistics[variable] || [])) :
            new Set();
    }
};

export let getReportData = () => {
    let data = getData();
    let report = {'variables': {}};

    for (let variable in data['variables']) {
        let keyCount = {};

        if (usedVariables.has(variable)) {
            let varData = {};
            if (!usedStatistics[variable]) varData = data['variables'][variable];
            else usedStatistics[variable].forEach(stat => varData[stat] = data['variables'][variable][stat]);

            for (stat in customFields[variable]) varData[stat] = stat;

            if (usedCustomStatistics[variable]) {
                for (let usedUID of usedCustomStatistics[variable]) {
                    // add user statistics
                    let statistic = Object.assign({}, customStatistics[variable][usedUID]);
                    let name = statistic['name'];
                    delete statistic['name'];

                    if (!keyCount[name]) keyCount[name] = 0;
                    keyCount[name]++;

                    let suffix = keyCount[name] === 1 ? '' : keyCount[name];
                    varData[name + suffix] = statistic;
                }
            }
            // console.log(varData);
            report['variables'][variable] = varData;
        }
    }
    return report;
};
