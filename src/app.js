import m from 'mithril'
import * as common from './common/common';

let preprocess_id;

export let variables = {};
// TODO add to preprocess.json
// TODO load from preprocess.json
export let customFieldsDataset = [];

export let row_cnt = 0;
export let variable_cnt= 0;

let data_url = 'http://localhost:8080/preprocess/api/';

export let getData = (id) => {

    if (preprocess_id !== id) {
        preprocess_id = parseInt(id);
        resetPeek();
    }

    m.request({
        method: "GET",
        url: data_url + 'metadata/' + id
    }).then(reloadData);
};

let reloadData = (result) => {
    if (!result['success']) {
        console.log(result['message']);
        return;
    }

    variables = result['data']['variables'];

    // load variable checkmarks
    let variable_display = result['data']['variable_display'];
    usedVariables = new Set(Object.keys(variable_display)
        .filter((variable) => variable_display[variable]['viewable']));

    // load statistic checkmarks
    for (let variable of Object.keys(variables)) {
        let omissions = new Set(variable_display[variable]['omit']);
        usedStatistics[variable] = new Set(Object.keys(variables[variable])
            .filter(stat => !omissions.has(stat) && isStatistic(variable, stat)))
    }

    ({row_cnt, variable_cnt} = result['data']['dataset']);
};

// peek window
let peekBatchSize = 100;
let peekSkip = 0;
let peekData = [];

let peekAllDataReceived = false;
let peekIsGetting = false;

let onStorageEvent = (e) => {
    if (e.key !== 'peekMore' || peekIsGetting) return;

    if (localStorage.getItem('peekMore') === 'true' && !peekAllDataReceived) {
        peekIsGetting = true;
        localStorage.setItem('peekMore', 'false');
        updatePeek();
    }
};
window.addEventListener('storage', onStorageEvent);

let updatePeek = () => {
    // peekAllDataReceived = true;
    if (preprocess_id === undefined) {
        peekAllDataReceived = true;
        return;
    }

    m.request({
        method: 'POST',
        url: data_url + 'retrieve-rows',
        data: {
            preprocess_id: preprocess_id,
            start_row: peekSkip + 1,
            num_rows: peekBatchSize,
            format: 'json'
        }
    }).then((response) => {
        peekIsGetting = false;
        let headers = response['data']['columns'].map(header => {
            if (variables[header]['nature'] === 'nominal') {
                return m('div', {style: 'color: ' + common.nomColor}, header)
            }
            return header;
        });
        localStorage.setItem('peekTableHeaders', JSON.stringify(headers));
        peekData = peekData.concat(response['data']['data']);
        localStorage.setItem('peekTableData', JSON.stringify(peekData));
    });
};

let resetPeek = () => {
    peekSkip = 0;
    peekData = [];

    peekAllDataReceived = false;
    peekIsGetting = false;

    // this will cause a redraw in the peek menu
    localStorage.removeItem('peekTableData');
};


// window resizing
let isResizingEditor = false;
export let leftpanelSize = 50;
export let resizeEditor = (e) => {
    isResizingEditor = true;
    document.body.classList.add('no-select');
    resizeEditorTick(e);
};

let resizeEditorTick = (e) => {
    leftpanelSize = (1 - e.clientX / document.getElementById('editor').clientWidth) * 100;

    document.getElementById('exterior').style.right = leftpanelSize + "%";
    document.getElementById('interior').style.width = leftpanelSize + "%";
};

document.onmousemove = (e) => isResizingEditor && resizeEditorTick(e);

document.onmouseup = () => {
    if (isResizingEditor) {
        isResizingEditor = false;
        document.body.classList.remove('no-select');
    }
};

// display variable list or statistic list in the leftpanel
export let editorMode = 'Variables';
export let setEditorMode = (mode) => editorMode = mode;

export let selectedDatasetField;
export let setSelectedDatasetAttribute = (attr) => selectedDatasetField = attr;




export let accordionStatistics = ['labl', 'numchar', 'nature', 'binary', 'interval', 'time'];
export let ontologyStatistics = ['classification', 'units', 'note'];
export let editableStatistics = ['numchar', 'nature', 'time', 'labl', 'varnameTypes', ...ontologyStatistics];

export let usedVariables = new Set();

// If passed variable is undefined, then all variables are set.
export let setUsedVariable = (status, variable) => {
    // format into request
    let updates = {};
    if (variable) updates = {[variable]: {'viewable': status}};
    else Object.keys(variables).forEach(variable => updates[variable] = {'viewable': status});

    m.request({
        method: 'POST',
        url: data_url + 'update-metadata',
        data: {
            preprocess_id: preprocess_id,
            variable_updates: updates
        }
    }).then(reloadData);
};

export let selectedVariable;
export let setSelectedVariable = (variable) => {
    selectedVariable = selectedVariable === variable ? undefined : variable;

    // all statistics are enabled by default
    if (!usedStatistics[selectedVariable]) {
        usedStatistics[selectedVariable] = new Set(Object.keys(variables[selectedVariable] || {})
            .filter((stat) => isStatistic(selectedVariable, stat)));
    }

    // ugly hack to make the css animation play
    let varlist = document.getElementById("variablesListCenter");
    if (varlist) {
        varlist.style.animation = '';
        void varlist.offsetWidth; // re-flow
        varlist.style.animation = 'slide-down .3s ease';
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
    if (variables[variable][field] === value) {
        if (customFields[variable] && customFields[variable][statistic])
            delete customFields[variable][statistic][field];
        return;
    }

    m.request({
        method: 'POST',
        url: data_url + 'update-metadata',
        data: {
            preprocess_id: preprocess_id,
            variable_updates: {
                [variable]: {
                    value_updates: {
                        [statistic]: value
                    }
                }
            }
        }
    }).then(reloadData);
};


export let statisticUIDCount = {};
export let customStatistics = {};
export let setCustomStatistic = (variable, statUID, field, value) => {
    console.log(customStatistics);
    // TODO add request

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
        statisticalDatatypes.indexOf(typeof(variables[variable][stat])) !== -1;

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
            new Set(Object.keys(variables[variable]).filter((stat) => isStatistic(variable, stat))) :
            new Set();
    }

    let omissions = Object.keys(variables[variable])
        .filter(stat => !usedStatistics[variable].has(stat));

    m.request({
        method: 'POST',
        url: data_url + 'update-metadata',
        data: {
            preprocess_id: preprocess_id,
            variable_updates: {
                [variable]: {
                    omit: omissions
                }
            }
        }
    }).then(reloadData);
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


// transposed statistics menu
export let selectedStatistic;
export let setSelectedStatistic = (statistic) => {
    selectedStatistic = selectedStatistic === statistic ? undefined : statistic;

    // all statistics are enabled by default. Since this is a cross-view, initialize everything
    Object.keys(variables).forEach(variable => {
        if (usedStatistics[variable] === undefined) {
            usedStatistics[variable] = new Set(Object.keys(variables[variable] || {})
                .filter((stat) => isStatistic(variable, stat)));
        }
    });
};

// Sets the state of a statistic checkbox within all variables
// If passed variable is undefined, nothing happens
export let setTransposedUsedStatistic = (status, statistic) => {
    if (statistic === undefined) return;

    // format into request
    let updates = {};
    for (let variable of Object.keys(variables)) {
        // edit a copy
        let inclusions = new Set(usedStatistics[variable]);

        // set inclusion on the copy
        status ? inclusions.add(statistic) : inclusions.delete(statistic);

        // invert inclusions to omissions
        updates[variable] = {};
        updates[variable]['omit'] = Object.keys(variables[variable]).filter(stat=>!inclusions.has(stat));
    }
    m.request({
        method: 'POST',
        url: data_url + 'update-metadata',
        data: {
            preprocess_id: preprocess_id,
            variable_updates: updates
        }
    }).then(reloadData);
};
