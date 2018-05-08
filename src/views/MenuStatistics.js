import m from 'mithril'

import Table from "../common/views/Table";
import TwoPanel from "../common/views/TwoPanel";

import * as app from "../app";
import CustomStatistic from "./CustomStatistic";

import descriptions from "../descriptions";
import TextField from "../common/views/TextField";

let variableSearch = '';
let statisticSearch = '';


export default class MenuStatistics {

    // data within statistic table for transposed menu, located on the left panel
    statisticsTable(statistics) {
        if (Object.keys(app.variables).length === 0) return;
        let firstVar = Object.keys(app.variables)[0];

        return Object.keys(statistics)
            .filter(statistic => statistic.includes(statisticSearch))
            .filter(statistic => app.isStatistic(firstVar, statistic) || app.editableStatistics.indexOf(statistic) !== -1)
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .map((statistic) => {

                // boolean for each variable, true if current statistic is not omitted
                let inclusion = Object.keys(app.variables)
                    .filter(variable => app.variable_display[variable])
                    .map(variable => app.variable_display[variable]['omit'].indexOf(statistic) === -1);

                // don't include checkmarks for editable statistics // TODO possibly remove?
                let hasCheck = app.editableStatistics.indexOf(statistic) === -1;

                let checked = inclusion.every(_ => _);
                let indeterminate = !checked && inclusion.some(_ => _);

                return [
                    statistic,
                    descriptions[statistic],
                    hasCheck && m('input[type=checkbox]', {
                        onclick: e => {
                            e.stopPropagation();
                            m.withAttr("checked", (checked) => app.setUsed(checked, undefined, statistic))(e)
                        },
                        checked: checked,
                        indeterminate: indeterminate
                    })
                ]
            });
    }

    customStatisticsTable() {
        let uniqueNames = new Set();
        Object.keys(app.custom_statistics)
            .filter(key => app.custom_statistics[key]['name'].includes(statisticSearch))
            .map(key => uniqueNames.add(app.custom_statistics[key]['name']));

        // determine state of checkboxes
        let relevantIDs = Object.keys(app.custom_statistics)
            .filter(id => app.custom_statistics[id]['name'] === app.selectedCustomStatistic);

        let allChecked = relevantIDs
            .every(id => app.custom_statistics[id]['display']['viewable']);
        let allIndet = !allChecked && relevantIDs
            .some(id => app.custom_statistics[id]['display']['viewable']);

        return [...uniqueNames].map(name => [
            name,
            m(`input#customStatCheck${name}[type=checkbox]`, {
                style: {float: 'right'},
                onclick: m.withAttr("checked", (checked) => app.setUsedCustomName(checked, id)),
                checked: allChecked,
                indeterminate: allIndet
            })
        ])
    }

    // data within rightView variable table for transposed menu, located on the right panel
    variablesTable(statistics, selectedStatistic) {
        let variables = statistics[selectedStatistic];
        if (variables === undefined) return [];

        let hasCheck = app.editableStatistics.indexOf(selectedStatistic) === -1;

        return Object.keys(variables)
            .filter(variable => variable.includes(variableSearch))
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .map((variable) => {
                return [
                    variable,
                    app.cellValue(variable, selectedStatistic, 'value', app.variables[variable][selectedStatistic] || ''),
                    hasCheck && m('input[type=checkbox]', {
                        onclick: m.withAttr("checked", (checked) => app.setUsed(checked, variable, selectedStatistic)),
                        checked: app.variable_display[variable]['omit'].indexOf(selectedStatistic) === -1
                    })
                ]
            });
    }

    view() {
        // transpose the variables data structure
        let statistics = {};

        for (let variable of Object.keys(app.variables || {}))
            for (let statistic of Object.keys(app.variables[variable] || {}))
                statistics[statistic] === undefined ?
                    statistics[statistic] = {[variable]: app.variables[variable][statistic]} :
                    statistics[statistic][variable] = app.variables[variable][statistic];

        // Checkbox for toggling all states
        let statisticsAllCheckbox = m('input#statisticsAllCheck[type=checkbox]', {
            onclick: m.withAttr("checked", (checked) => app.setUsed(checked)),
            checked: Object.keys(app.variable_display).every(key => app.variable_display[key]['viewable']),
            indeterminate: Object.keys(app.variable_display).some(key => app.variable_display[key]['omit'].length !== 0)
        });

        // all custom statistics that share the current statistic name
        let relevantIDs = Object.keys(app.custom_statistics)
            .filter(key => (app.custom_statistics[key]['name']) === app.selectedCustomStatistic);

        let allCustomChecked = Object.keys(app.custom_statistics)
            .every(id => app.custom_statistics[id]['display']['viewable']);
        let allCustomIndet = !allCustomChecked && Object.keys(app.custom_statistics)
            .some(id => app.custom_statistics[id]['display']['viewable']);

        let customStatAllCheckbox = m(`input#customStatAllCheck[type=checkbox]`, {
            style: {float: 'right'},
            onclick: m.withAttr("checked", (checked) => app.setUsedCustomName(checked)),
            checked: allCustomChecked,
            indeterminate: allCustomIndet
        });

        // Sets spacing of variable table columns
        let colgroupStatistics = () => {
            return m('colgroup',
                m('col', {span: 1, width: '10em'}),
                m('col', {span: 1}),
                m('col', {span: 1, width: '2em'}));
        };
        let colgroupCustomStatistics = () => {
            return m('colgroup',
                m('col', {span: 1}),
                m('col', {span: 1, width: '2em'}));
        };
        let colgroupVariables = () => {
            return m('colgroup',
                m('col', {span: 1, width: '10em'}),
                m('col', {span: 1}),
                m('col', {span: 1, width: '2em'}));
        };

        return m('div#editor', {
            style: {
                height: '100%',
                width: '100%',
                position: 'absolute',
                'overflow': 'hidden'
            }
        }, m(TwoPanel, {
            left: [
                m('h4#statisticsHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Statistics'),
                m('label#searchStatisticsLabel', {
                    for: 'searchStatistics',
                    style: {display: 'inline-block', 'margin': '0 1em'}
                }, 'Search'),
                m(TextField, {
                    id: 'searchStatistics',
                    value: statisticSearch,
                    oninput: value => statisticSearch = value,
                    style: {width: 'auto', display: 'inline-block'}
                }),
                m(Table, {
                    id: 'statisticsList',
                    headers: ['Name', 'Description', statisticsAllCheckbox],
                    data: this.statisticsTable(statistics),
                    activeRow: app.selectedStatistic,
                    onclick: app.setSelectedStatistic,
                    tableTags: colgroupStatistics(),
                    attrsCells: {style: {padding: '.5em'}}
                }),
                Object.keys(app.custom_statistics).length !== 0 && [
                    m('h4#customStatisticsHeader', {
                        style: {
                            'padding-top': '.5em',
                            'text-align': 'center'
                        }
                    }, 'Custom Statistics'),
                    m(Table, {
                        id: 'customStatisticsList',
                        headers: ['Name', customStatAllCheckbox],
                        data: this.customStatisticsTable(statistics),
                        activeRow: app.selectedCustomStatistic,
                        onclick: app.setSelectedCustomStatistic,
                        tableTags: colgroupCustomStatistics(),
                        attrsCells: {style: {padding: '.5em'}}
                    }),
                ]
            ],
            right: [
                app.selectedStatistic && [
                    m('h4#variablesHeader', {
                        style: {
                            'padding-top': '.5em',
                            'text-align': 'center'
                        }
                    }, app.selectedStatistic + ' for each variable'),
                    m('label#searchVariablesLabel', {
                        for: 'searchVariables',
                        style: {display: 'inline-block', 'margin': '0 1em'}
                    }, 'Search'),
                    m(TextField, {
                        id: 'searchVariables',
                        value: variableSearch,
                        oninput: value => variableSearch = value,
                        style: {width: 'auto', display: 'inline-block'}
                    }),
                    m(Table, {
                        id: 'variablesComputed',
                        headers: ['Name', 'Value', ''],
                        data: this.variablesTable(statistics, app.selectedStatistic),
                        tableTags: colgroupVariables(),
                        attrsCells: {style: {padding: '.5em'}}
                    })],
                app.selectedCustomStatistic && [
                    m('h4#customStatisticsHeader', {
                        style: {
                            'padding-top': '.5em',
                            'text-align': 'center'
                        }
                    }, 'Custom Statistics with name: ' + app.selectedCustomStatistic),
                    relevantIDs.map((id) => m(CustomStatistic, {id}))
                ]
            ]
        }))
    }
}