import m from 'mithril';

import html2pdf from '../node_modules/html2pdf.js/dist/html2pdf';

import * as common from './common/common';
import ButtonRadio from "./common/views/ButtonRadio";
import Dropdown from "./common/views/Dropdown";
import TextField from "./common/views/TextField";
import ListTags from "./common/views/ListTags";
import Table from "./common/views/Table";

let dataUrl = 'http://localhost:8080/';
let preprocessUrl = dataUrl + 'preprocess/';

export let preprocessId;
export function setPreprocessId(id) {preprocessId = id}

// schema info
let schema;
export let getDataSchema = () => schema['properties']['dataset']['properties'];
export let getStatSchema = (statistic) =>
    schema['properties']['variables']['patternProperties']['^[_a-zA-Z0-9]+$']['properties'][statistic] || {};

// preprocess info
export let customStatistics = {};
export let dataset = {};
export let variables = {};
export let variableDisplay = {};
export let self = {};
export let citation;

// if set, then a historical version is being displayed and the menu is readonly
export let version;

// menu text
export let uploadStatus;

export async function uploadFile(e) {
    let file = e.target.files[0];

    let data = new FormData();
    data.append("source_file", file);

    // initial upload
    let response = await m.request({
        method: "POST",
        url: preprocessUrl + "api/process-single-file",
        data: data,
    });

    let callbackUrl = response['callback_url'];

    // get the data
    let processed = false;
    while (!processed) {
        response = await m.request({
            method: "GET",
            url: callbackUrl
        });

        uploadStatus = response['data']['userMessage'];

        if (response['data']['state'] !== "PENDING") {
            processed = true;
            if (response['data']['state'] === "SUCCESS") {
                reloadData(response['data']['data']);
                m.route.set('/' + preprocessId + '/' + metadataMode);
            }
        }
    }
}

export async function getData(id, versionTemp) {
    if (isNaN(id) || id === '') {
        preprocessId = undefined;
        return false;
    }

    if (schema === undefined) {
        schema = await m.request({
            method: 'GET',
            url: preprocessUrl + 'api/schema/metadata/latest'
        });
    }

    // version is only set when the field is set manually. It is unset from any edit
    version = versionTemp;

    let response = await m.request({
        method: "GET",
        url: preprocessUrl + 'api/metadata/' + id + (version ? '/version/' + version : '')
    });

    console.log("Data response:");
    console.log(response);

    if (!response['success']) {
        console.log(response['message']);
        return false;
    }

    reloadData(response['data']);
    return true;
}

// takes in only the preprocess.json
function reloadData(data) {
    preprocessId = data['self']['preprocessId'];

    resetPeek();

    ({customStatistics, dataset, self, variableDisplay, variables} = data);

    // make sure custom stats is not undefined
    customStatistics = customStatistics || {};

    // why is this in here? get outta hea'
    editableStatistics = variableDisplay['editable'];
    delete variableDisplay['editable'];
    //
    dataset = {
        'description': data['dataset']['description'],
        'row count': data['dataset']['rowCount'],
        'variable count': data['dataset']['variableCount'],
        'filename': data['dataset']['dataSource']['name'],
        'filesize': data['dataset']['dataSource']['filesize'],
        'type': data['dataset']['dataSource']['type'],
        'format': data['dataset']['dataSource']['format']
    };

    citation = data['dataset']['citation'];
}

// peek window
let peekBatchSize = 100;
let peekSkip = 0;
let peekData = [];

let peekAllDataReceived = false;
let peekIsGetting = false;

function onStorageEvent(e) {
    if (e.key !== 'peekMore' || peekIsGetting) return;
    if (localStorage.getItem('peekMore') === 'true' && !peekAllDataReceived) {
        peekIsGetting = true;
        localStorage.setItem('peekMore', 'false');
        updatePeek();
    }
}
window.addEventListener('storage', onStorageEvent);

function updatePeek() {
    if (preprocessId === undefined) {
        peekAllDataReceived = true;
        return;
    }

    m.request({
        method: 'POST',
        url: preprocessUrl + 'api/retrieve-rows',
        data: {
            preprocessId: preprocessId,
            startRow: peekSkip + 1,
            numberRows: peekBatchSize,
            format: 'json'
        }
    }).then((response) => {
        console.log('Peek response:');
        console.log(response);

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
}

function resetPeek() {
    peekSkip = 0;
    peekData = [];

    peekAllDataReceived = false;
    peekIsGetting = false;

    // this will cause a redraw in the peek menu
    localStorage.removeItem('peekTableData');
}

// overall mode: ['Home', 'Editor', 'Report']
export let metadataMode = 'Home';
export function setMetadataMode(mode) {metadataMode = mode}


// mode for editor: ['Dataset', 'Variables', 'Statistics']
export let editorMode = 'Dataset';
export function setEditorMode(mode) {editorMode = mode}

export let editableStatistics;

export let selectedVariable;
export function setSelectedVariable (variable) {
    selectedVariable = selectedVariable === variable ? undefined : variable;

    // ugly hack to make the css animation play
    let varlist = document.getElementById("variablesListCenter");
    if (varlist) {
        varlist.style.animation = '';
        void varlist.offsetWidth; // re-flow
        varlist.style.animation = 'slide-down .3s ease';
    }
}

// Checks if an entry for a variable is a statistic
export function isStatistic (stat, variable) {
    if (variable === undefined) {
        return Object.keys(variables).some(variable => isStatistic(stat, variable));
    }

    // don't consider the variable or accordion stats as statistics
    if (editableStatistics.indexOf(stat) !== -1 || stat === 'variableName') return false;

    // ignore plot data, etc.
    return true;
}

// transposed statistics menu
export let selectedStatistic;
export let selectedCustomStatistic;
export function setSelectedStatistic(stat) {selectedStatistic = stat};
export function setSelectedCustomStatistic(stat) {selectedCustomStatistic = stat};

export async function setField(variable, statistic, value) {
    // ignore non-edits
    if (variables[variable][statistic] === value) return;

    let response = await m.request({
        method: 'POST',
        url: preprocessUrl + 'api/update-metadata',
        data: {
            preprocessId: preprocessId,
            variableUpdates: {
                [variable]: {
                    valueUpdates: {
                        [statistic]: value
                    }
                }
            }
        }
    });

    if (response['success'])
        variables[variable][statistic] = value;  // reloadData(response['data']);
    else console.log(response['message']);
}

export async function setUsed(status, variable, statistic) {
    if (version) return;

    // format into request
    let updates = {};

    let prepUpdateVariable = (status, variable) => {
        if (variableDisplay[variable]['viewable'] === status) return;
        updates[variable] = {
            'viewable': status,
            'omit': status ? [] : Object.keys(variables[variable])
        };
    };

    let prepUpdateStatistic = (status, variable, statistic) => {
        // check if no change is necessary
        let isIncluded = variableDisplay[variable]['omit'].indexOf(statistic) === -1;
        if (isIncluded === status) return;

        // update omissions
        updates[variable] = status ? {
            'omit': variableDisplay[variable]['omit'].filter(key => key !== statistic)
        } : {
            'omit': [statistic, ...variableDisplay[variable]['omit']]
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
        url: preprocessUrl + 'api/update-metadata',
        data: {
            preprocessId: preprocessId,
            variableUpdates: updates
        }
    });

    if (response['success']) reloadData(response['data']);
    else console.log(response['message']);
}

// holds the value displayed in the ui when searching for variables, before adding. key is statistic
export let pendingCustomVariable = {};

// holds the new statistic that has not been saved yet
export let pendingCustomStatistic = {};

export async function setFieldCustom(id, field, value) {
    if (version) return;

    let response;

    // new id
    if (id === 'ID_NEW') {
        if (value === '' || (Array.isArray(value) && value.length === 0)) return;

        pendingCustomStatistic[field] = value;
        if (['name', 'value', 'variables'].some(name => !(name in pendingCustomStatistic))) return;

        let update = {
            preprocessId: preprocessId,
            customStatistics: [pendingCustomStatistic]
        };

        response = await m.request({
            method: 'POST',
            url: preprocessUrl + 'form/custom-statistics',
            data: update
        });

        // reset the pending stat
        if (response['success']) pendingCustomStatistic = {};
    }

    // delete a field (but not name or value)
    else if (field !== 'name' && field !== 'value' &&
        (value === '' || (Array.isArray(value) && value.length === 0))) {

        let update = {
            preprocessId: preprocessId,
            customStatistics: [{
                id: id,
                'delete': [field]
            }]
        };

        response = await m.request({
            method: 'POST',
            url: preprocessUrl + 'form/custom-statistics-delete',
            data: update
        });
    }

    // edit a field
    else {
        let update = {
            preprocessId: preprocessId,
            customStatistics: [{
                id: id,
                updates: {[field]: value}
            }]
        };

        response = await m.request({
            method: 'POST',
            url: preprocessUrl + 'form/custom-statistics-update',
            data: update
        });
    }

    console.log(response);

    if (response['success']) reloadData(response['data']);
    else console.log(response['message']);
}

// updates a custom stat with a given id
export function setUsedCustom(status, id) {
    setFieldCustom(id, 'display', {'viewable': status})
}

// updates all custom stats with a given name. If no name set, then update all stats
export async function setUsedCustomName(status, name) {
    if (version) return;

    let updates = Object.keys(customStatistics)
        .filter(id =>
            (name === undefined || customStatistics[id]['name'] === name) &&
            customStatistics[id]['display']['viewable'] !== status)
        .map(id => Object({
            id: id,
            updates: {'display': {'viewable': status}}
        }));

    let response = await m.request({
        method: 'POST',
        url: preprocessUrl + 'form/custom-statistics-update',
        data: {
            preprocessId: preprocessId,
            customStatistics: updates
        }
    });

    console.log(response);

    if (response['success']) reloadData(response['data']);
    else console.log(response['message']);
}

export async function deleteCustom (id) {
    let response = await m.request({
        method: 'POST',
        url: preprocessUrl + 'form/custom-statistics-delete',
        data: {
            preprocessId: preprocessId,
            customStatistics: [
                {id: id, 'delete': ['id']}
            ]
        }
    });

    console.log(response);

    if (response['success']) reloadData(response['data']);
    else console.log(response['message']);
}

export let uploadImageStatus = {};

export async function setImageCustom(id, e) {
    if (version) return;

    let file = e.target.files[0];

    let data = new FormData();
    data.append("source_file", file);

    // TODO API request
}

export let precision = 4;
export let setPrecision = (value) => precision = value;

export function formatPrecision(value) {
    if (isNaN(value)) return value;

    // convert to Number
    value *= 1;
    // determine number of digits in value
    let digits = Math.max(Math.floor(Math.log10(Math.abs(Number(String(value).replace(/[^0-9]/g, ''))))), 0) + 1;

    if (digits <= precision || precision === 0) return value;
    return value.toPrecision(precision);
}

// return a mithril cell - could be text, field, radio, button, dropdown, etc.
export function cellValue(variable, statistic, value = '') {

    let statSchema = getStatSchema(statistic);

    // old versions and non-editable stats are readonly
    if (version || editableStatistics.indexOf(statistic) === -1 || metadataMode === 'report') {
        if (Array.isArray(value)) {
            return m(ListTags, {
                tags: value.map(val => formatPrecision(val)),
                attrsTags: {style: {margin: '0.1em', padding: '0.2em', background: common.menuColor}},
                readonly: true
            });
        }

        if (typeof value === 'object' && value)
            return m(Table, {
                id: 'table' + statistic,
                headers: ['bucket', 'frequency'],
                data: value,
                attrsAll: {style: {'box-shadow': '0 3px 6px #777'}},
                attrsCells: {style: {padding: '.5em'}}
            });

        return m('div', {
            'data-toggle': 'tooltip',
            title: (statSchema || {})['description']
        }, formatPrecision(value));
    }

    if (statSchema['type'] === 'boolean')
        return m(ButtonRadio, {
            id: 'radio' + statistic,
            sections: [{value: 'true'} , {value: 'false'}],
            activeSection: {1: 'true', 0: 'false'}[value],
            onclick: (value) => setField(variable, statistic, {'true': 1, 'false': 0}[value]),
            attrsAll: {style: {width: 'auto'}}
        });

    // if it can only take certain values
    if (statSchema['enum']) {
        if (statSchema['enum'].length > 3)
            return m(Dropdown, {
                id: 'dropdown' + statistic,
                items: statSchema['enum'],
                activeItem: value,
                onclickChild: (value) => setField(variable, statistic, value),
                dropWidth: '100px'
            });

        else
            return m(ButtonRadio, {
                id: 'radio' + statistic,
                sections: statSchema['enum'].map(item => Object({value: item})),
                activeSection: value,
                onclick: (value) => setField(variable, statistic, value),
                attrsAll: {style: {width: 'auto'}}
            })
    }

    return m(TextField, {
        id: 'textField' + statistic,
        value: value,
        onblur: (value) => setField(variable, statistic, value),
        style: {margin: 0}
    });
}

let dpiRange = {
    0: 300,
    2: 300,
    4: 300,
    8: 240,
    16: 140,
    32: 92,
    64: 40  // too low!
};

export function getPrintProfile() {
    let pages = 0;
    Object.keys(variables).forEach(variable => pages += variableDisplay[variable]['viewable']);
    let range = Math.pow(2, Math.floor(Math.log(pages) / Math.log(2)));
    return {pages: pages, dpi: dpiRange[range]};
}

export function saveReport() {
    html2pdf(document.getElementById('report'), {
        filename: 'TwoRavens.pdf',
        html2canvas: {dpi: getPrintProfile()['dpi'], letterRendering: true},
        margin: 1,
        jsPDF: {unit: 'in'}
    });
}
