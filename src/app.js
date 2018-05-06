import m from 'mithril'
import * as common from './common/common';

import citationSample from './citationSample';

export let preprocess_id;

// preprocess info
export let custom_statistics = {};
export let dataset = {};
export let variables = {};
export let variable_display = {};
export let citation;

let data_url = 'http://localhost:8080/preprocess/';

export let uploadStatus;
export let uploadFile = async (e) => {
    let file = e.target.files[0];

    let data = new FormData();
    data.append("source_file", file);

    // initial upload
    let response = await m.request({
        method: "POST",
        url: data_url + "api/process-single-file",
        data: data,
    });

    let callback_url = response['callback_url'];

    // get the data
    let processed = false;
    while (!processed) {
        response = await m.request({
            method: "GET",
            url: callback_url
        });

        uploadStatus = response['data']['user_message'];

        if (response['data']['state'] !== "PREPROCESS_STARTED") {
            processed = true;
            if (response['data']['state'] === "SUCCESS") {
                reloadData(response['data']['data']);
                m.route.set('/' + preprocess_id + '/' + metadataMode);
            }
        }
    }
};

export let getData = async (id) => {
    if (isNaN(id) || id === '') {
        preprocess_id = undefined;
        return false;
    }

    let response = await m.request({
        method: "GET",
        url: data_url + 'api/metadata/' + id
    });

    console.log("Data response:");
    console.log(response);

    if (!response['success']) {
        if (response['message'].indexOf("PreprocessJob not found") !== -1) {
            preprocess_id = undefined;
            m.route.set('/');
        }
        console.log(response['message']);
        return false;
    }

    reloadData(response['data']);
    return true;
};

// takes in only the preprocess.json
let reloadData = (data) => {
    preprocess_id = data['self']['preprocess_id'];

    resetPeek();

    ({custom_statistics, dataset, variable_display, variables} = data);

    dataset = {
        'description': data['dataset']['description'],
        'row count': data['dataset']['row_cnt'],
        'variable count': data['dataset']['variable_cnt'],
        'filename': data['dataset']['data_source']['name'],
        'filesize': data['dataset']['data_source']['filesize'],
        'type': data['dataset']['data_source']['type'],
        'format': data['dataset']['data_source']['format']
    };

    // TODO: remove this once citationSample is implemented/tested
    citation = citationSample;
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
        url: data_url + 'api/retrieve-rows',
        data: {
            preprocess_id: preprocess_id,
            start_row: peekSkip + 1,
            num_rows: peekBatchSize,
            format: 'json'
        }
    }).then((response) => {

        // TODO the API spec changed... was this intentional? Not sure why response is now returned in an array
        response = response[1];

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

// overall mode: ['Home', 'Editor', 'Report']
export let metadataMode = 'Home';

// mode for editor: ['Dataset', 'Variables', 'Statistics']
export let editorMode = 'Dataset';
export let setEditorMode = (mode) => editorMode = mode;

export let selectedDatasetField;
export let setSelectedDatasetAttribute = (attr) => selectedDatasetField = attr;

export let accordionStatistics = ['labl', 'numchar', 'nature', 'binary', 'identifier', 'interval', 'time', 'units'];
export let editableStatistics = ['numchar', 'nature', 'time', 'identifier', 'labl', 'varnameTypes', 'units'];

export let selectedVariable;
export let setSelectedVariable = (variable) => {
    selectedVariable = selectedVariable === variable ? undefined : variable;

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

export let setCustomField = async (variable, statistic, value) => {
    // ignore non-edits
    if (variables[variable][statistic] === value) return;

    let response = await m.request({
        method: 'POST',
        url: data_url + 'api/update-metadata',
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
    });

    if (response['success']) reloadData(response['data']);
    else console.log(response['message']);
};


export let statisticUIDCount = 0;
export let customStatistics = {};

export let setCustomStatistic_new = (statUID, field, value) => {
    // deletion
    if (value === "") {
        // TODO use API
        delete customStatistics[statUID][field];
    }

    // insertion
    if (statUID in customStatistics) customStatistics[statUID][field] = value;
    else customStatistics[++statisticUIDCount] = {[field]: value};
};


export let setCustomStatistic = (variable, statUID, field, value) => {
    console.log(customStatistics);

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

    m.request({
        method: "POST",
        url: data_url + "form/custom-statistics",
        data: {
            preprocess_id: preprocess_id,
            custom_statistics: [
                Object.assign({"variables": [variable], "image": []}, customStatistics[variable][statUID])
            ]
        }
    }).then((response) => console.log(response));

    console.log(JSON.stringify({
            preprocess_id: preprocess_id,
            custom_statistics: [
                Object.assign({"variables": [variable], "image": []}, customStatistics[variable][statUID])
            ]
        }));
};

let statisticalDatatypes = ['string', 'number', 'boolean'];

// Checks if an entry for a variable is a statistic
export let isStatistic = (variable, stat) =>
    accordionStatistics.indexOf(stat) === -1 &&
        statisticalDatatypes.indexOf(typeof(variables[variable][stat])) !== -1 &&
        stat !== 'varnameSumStat';

// TODO roll into custom statistics edit
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
};

export let setUsed = async (status, variable, statistic) => {

    // format into request
    let updates = {};

    let prepUpdateVariable = (status, variable) => {
        if (variable_display[variable]['viewable'] === status) return;
        updates[variable] = {
            'viewable': status,
            'omit': status ? [] : Object.keys(variables[variable])
        };
    };

    let prepUpdateStatistic = (status, variable, statistic) => {
        // check if no change is necessary
        let isIncluded = variable_display[variable]['omit'].indexOf(statistic) === -1;
        if (isIncluded === status) return;

        // update omissions
        updates[variable] = status ? {
            'omit': variable_display[variable]['omit'].filter(key => key !== statistic)
        } : {
            'omit': [statistic, ...variable_display[variable]['omit']]
        };

        // update viewable status
        updates[variable]['viewable'] = updates[variable]['omit'].length !== 0;
    };

    // ----- UPDATE CASES -----
    // 1. set all statistics for all variables
    if (variable === undefined && statistic === undefined)
        Object.keys(variables).forEach(variable => prepUpdateVariable(status, variable));

    // 2. set all statistics for one variable
    else if (statistic === undefined)
        prepUpdateVariable(status, variable);

    // 3. set all variables for one statistic
    else if (variable === undefined)
        Object.keys(variables).forEach(variable => prepUpdateStatistic(status, variable, statistic));

    // 4. set one statistic for one variable
    else
        prepUpdateStatistic(status, variable, statistic);

    // don't bother POSTing if there are no updates
    if (Object.keys(updates).length === 0) return;
    let response = await m.request({
        method: 'POST',
        url: data_url + 'api/update-metadata',
        data: {
            preprocess_id: preprocess_id,
            variable_updates: updates
        }
    });

    if (response['success']) reloadData(response['data']);
    else console.log(response['message']);
};