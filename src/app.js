import m from 'mithril'

import * as common from './common/common';
import ButtonRadio from "./common/views/ButtonRadio";
import Dropdown from "./common/views/Dropdown";
import TextField from "./common/views/TextField";

// TODO: remove for production
import citationSample from './citationSample';
import descriptions from "./descriptions";

let data_url = 'http://localhost:8080/preprocess/';

export let preprocess_id;

// preprocess info
export let custom_statistics = {};
export let dataset = {};
export let variables = {};
export let variable_display = {};
export let self = {};
export let citation;

// if set, then a historical version is being displayed and the menu is readonly
export let version;

// menu text
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

export let getData = async (id, versionTemp) => {
    if (isNaN(id) || id === '') {
        preprocess_id = undefined;
        return false;
    }

    // version is only set when the field is set manually. It is unset from any edit
    version = versionTemp;

    let response = await m.request({
        method: "GET",
        url: data_url + 'api/metadata/' + id + (version ? '/version/' + version : '')
    });

    console.log("Data response:");
    console.log(response);

    if (!response['success']) {
        console.log(response['message']);
        return false;
    }

    reloadData(response['data']);
    return true;
};

// takes in only the preprocess.json
let reloadData = (data) => {
    console.log(data);
    preprocess_id = data['self']['preprocess_id'];

    resetPeek();

    ({custom_statistics, dataset, self, variable_display, variables} = data);

    // make sure custom stats is not undefined
    custom_statistics = custom_statistics || {};

    // why is this in here? get outta hea'
    // TODO remove 'editable' and 'units' when API is updated to include them
    editableStatistics = [...variable_display['editable'], 'identifier', 'units'];
    delete variable_display['editable'];

    dataset = {
        'description': data['dataset']['description'],
        'row count': data['dataset']['row_cnt'],
        'variable count': data['dataset']['variable_cnt'],
        'filename': data['dataset']['data_source']['name'],
        'filesize': data['dataset']['data_source']['filesize'],
        'type': data['dataset']['data_source']['type'],
        'format': data['dataset']['data_source']['format']
    };

    // TODO: remove citationSample and read from data['dataset']['citation'] instead (production)
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

export let editableStatistics;

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

// TODO render images
let statisticalDatatypes = ['string', 'number', 'boolean'];

// Checks if an entry for a variable is a statistic
export let isStatistic = (stat, variable) => {
    if (variable === undefined) {
        return Object.keys(variables).some(variable => isStatistic(stat, variable));
    }

    // don't consider the variable or accordion stats as statistics
    if (editableStatistics.indexOf(stat) !== -1 || stat === 'varnameSumStat') return false;

    // ignore plot data, etc.
    return statisticalDatatypes.indexOf(typeof(variables[variable][stat])) !== -1;
};

// transposed statistics menu
export let selectedStatistic;
export let setSelectedStatistic = (statistic) => {
    selectedStatistic = selectedStatistic === statistic ? undefined : statistic;
    selectedCustomStatistic = undefined;
};

export let setField = async (variable, statistic, value) => {
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
        updates[variable]['viewable'] = updates[variable]['omit'].length !== Object.keys(variables[variable]).length;
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

export let selectedCustomStatistic;
export let setSelectedCustomStatistic = (statistic) => {
    selectedStatistic = undefined;
    selectedCustomStatistic =
        selectedCustomStatistic === statistic ? undefined : statistic;
};

// holds the value displayed in the ui when searching for variables
export let pendingCustomVariable = {};

export let setFieldCustom = async (id, field, value) => {

    let update;

    if (id === 'ID_NEW') {
        if (value === '') return;
        // name and value appear mandatory, but give them empty strings, so they save no matter what
        update = {
            updates: {
                'name': '',
                'value': '',
                'display': {'viewable': true},
                [field]: value
            }
        };
    }
    else update = {
        id: id,
        updates: {[field]: value}
    };

    let response = await m.request({
        method: 'POST',
        url: data_url + 'form/custom-statistics-update',
        data: {
            preprocess_id: preprocess_id,
            custom_statistics: [update]
        }
    });

    console.log(response);

    if (response['success']) reloadData(response['data']);
    else console.log(response['message']);
};

// updates a custom stat with a given id
export let setUsedCustom = (status, id) => {
    setFieldCustom(id, 'display', {'viewable': status})
};

// updates all custom stats with a given name. If no name set, then update all stats
export let setUsedCustomName = async (status, name) => {
    let updates = Object.keys(custom_statistics)
        .filter(id =>
            (name === undefined || custom_statistics[id]['name'] === name) &&
            custom_statistics[id]['display']['viewable'] !== status)
        .map(id => Object({
            id: id,
            updates: {'display': {'viewable': status}}
        }));

    let response = await m.request({
        method: 'POST',
        url: data_url + 'form/custom-statistics_update',
        data: {
            preprocess_id: preprocess_id,
            custom_statistics: updates
        }
    });

    console.log(response);

    if (response['success']) reloadData(response['data']);
    else console.log(response['message']);
};

export let deleteCustom = async (id) => {
    let response = await m.request({
        method: 'POST',
        url: data_url + 'form/custom-statistics-update',
        data: {
            preprocess_id: preprocess_id,
            custom_statistics: [
                {id: id, 'delete': ['id']}
            ]
        }
    });

    console.log(response);

    if (response['success']) reloadData(response['data']);
    else console.log(response['message']);
};

export let uploadImageStatus = {};

export let setImageCustom = async (id, e) => {
    let file = e.target.files[0];

    let data = new FormData();
    data.append("source_file", file);

    // TODO API request
};

// NOTE: This really belongs in index.js, but it causes an infinite import
// return a mithril cell - could be text, field, radio, button, dropdown, etc.
export let cellValue = (variable, statistic, field, value = '') => {

    // old versions are readonly
    if (version) return m('div', {
        'data-toggle': 'tooltip',
        title: descriptions[statistic]
    }, value);

    if (statistic === 'numchar') {
        return m(ButtonRadio, {
            id: 'radioNumchar',
            sections: [{value: 'numeric'}, {value: 'character'}],
            activeSection: value,
            onclick: (value) => setField(variable, statistic, value),
            attrsAll: {style: {width: 'auto'}}
        })
    }

    if (statistic === 'identifier') {
        return m(ButtonRadio, {
            id: 'radioIdentifier',
            sections: [{value: 'cross-section'}, {value: 'time'}],
            activeSection: value,
            onclick: (value) => setField(variable, statistic, value),
            attrsAll: {style: {width: '240px'}}
        })
    }

    if (statistic === 'nature') {
        return m(Dropdown, {
            id: 'dropdownNature',
            items: ['nominal', 'ordinal', 'interval', 'ratio', 'percent', 'other'],
            activeItem: value,
            onclickChild: (value) => setField(variable, statistic, value),
            dropWidth: '100px'
        })
    }

    if (editableStatistics.indexOf(statistic) === -1) return m('div', {
        'data-toggle': 'tooltip',
        title: descriptions[statistic]
    }, value);

    return m(TextField, {
        id: 'textField' + statistic + field,
        value: value,
        onblur: (value) => setField(variable, statistic, value),
        style: {margin: 0}
    });
};
