import m from 'mithril'

import Table from "../common/views/Table";
import TextField from "../common/views/TextField";
import TwoPanel from "../common/views/TwoPanel";

import * as app from "../app";

// TODO: possibly load description from API call?
import descriptions from "../descriptions";

import {
    customStatistics,
    setCustomStatistic,
    setUsedCustomStatistic,
    statisticUIDCount,
    usedCustomStatistics
} from "../custom";
import CustomStatistic from "./CustomStatistic";

// breaks the variable table data
export let partitionVariableTable = (variableTable) => {
    let isUpper = true;
    let upperVars = variableTable.filter((row) => {
        if (row[0] === app.selectedVariable) { isUpper = false; return true; }
        return isUpper;
    });

    let isLower = false;
    let lowerVars = variableTable.filter((row) => {
        if (row[0] === app.selectedVariable) { isLower = true; return false; }
        return isLower;
    });

    return {upper: upperVars, lower: lowerVars};
};

export default class MenuVariables {

    // data within variable table
    variableTable() {
        return Object.keys(app.variables)
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .map((variable) => [
                variable,
                app.variables[variable]['labl'] || '',
                m('input[type=checkbox]', {
                    onclick: e => {
                        e.stopPropagation();
                        m.withAttr("checked", (checked) => app.setUsed(checked, variable))(e)
                    },
                    checked: app.variable_display[variable]['viewable']
                })
            ]);
    }

    // data shown within accordion upon variable click
    variableAccordionTable(variableName) {
        let statistics = app.variables[variableName];
        statistics = statistics || [];

        return [...app.accordionStatistics].map((stat) => [
            m('div', {
                'data-toggle': 'tooltip',
                'title': descriptions[stat]
            }, stat),
            app.cellValue(variableName, stat, 'value', statistics[stat])
        ]);
    }

    // data within statistics table
    statisticsTable(variableName) {
        let statistics = app.variables[variableName];

        let omissions = new Set(app.variable_display[variableName]['omit']);
        if (statistics === undefined) return [];
        return Object.keys(statistics)
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .filter((stat) => app.isStatistic(variableName, stat))
            .map((stat) => [
                m('div', {
                    'data-toggle': 'tooltip',
                    title: descriptions[stat]
                }, stat),
                app.cellValue(variableName, stat, 'value', statistics[stat]),
                m('input[type=checkbox]', {
                    onclick: m.withAttr("checked", (checked) => app.setUsed(checked, variableName, stat)),
                    checked: !omissions.has(stat)
                })
            ]);
    }

    view() {
        // format variable table data
        let center = this.variableAccordionTable(app.selectedVariable);
        let {upper, lower} = partitionVariableTable(this.variableTable());

        // Checkboxes for toggling all states
        let variableAllCheckbox = m('input#variableAllCheck[type=checkbox]', {
            onclick: m.withAttr("checked", (checked) => app.setUsed(checked)),
            checked: Object.keys(app.variable_display).every(key => app.variable_display[key]['viewable'])
        });

        // all custom statistics that include the current variable
        let relevantStatistics = Object.keys(app.custom_statistics)
            .filter(key => (app.custom_statistics[key]['variables'] || []).indexOf(app.selectedVariable) !== -1);

        // Sets spacing of variable table column
        let colgroupVariables = () => {
            return m('colgroup',
                m('col', {span: 1, width: '10em'}),
                m('col', {span: 1}),
                m('col', {span: 1, width: '2em'}));
        };
        let colgroupStatistics = () => {
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
            },

            m(TwoPanel, {
                left: [
                    m('h4#variablesHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Variables'),
                    m(Table, {
                        id: 'variablesListUpper',
                        headers: ['Name', 'Label', variableAllCheckbox],
                        data: upper,
                        activeRow: app.selectedVariable,
                        onclick: app.setSelectedVariable,
                        tableTags: colgroupVariables(),
                        attrsCells: {style: {padding: '.5em'}}
                    }),
                    app.selectedVariable && m(Table, {
                        id: 'variablesListCenter',
                        headers: ['Name', 'Value'],
                        data: center,
                        attrsCells: {style: {padding: '.3em'}},
                        attrsAll: {
                            style: {
                                width: 'calc(100% - 2em)',
                                'margin-left': '1em',
                                'border-left': '1px solid #dee2e6',
                                'box-shadow': '0 3px 6px #777',
                                animation: 'slide-down .4s ease'
                            }
                        }
                    }),
                    m(Table, {
                        id: 'variablesListLower',
                        data: lower,
                        activeRow: app.selectedVariable,
                        onclick: app.setSelectedVariable,
                        tableTags: colgroupVariables(),
                        attrsCells: {style: {padding: '.5em'}}
                    })
                ],
                right: app.selectedVariable && [
                    m('h4#statisticsComputedHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, app.selectedVariable +' Computed Statistics'),
                    m(Table, {
                        id: 'statisticsComputed',
                        headers: ['Name', 'Value', ''],
                        data: this.statisticsTable(app.selectedVariable),
                        tableTags: colgroupStatistics(),
                        attrsCells: {style: {padding: '.5em'}}
                    }),
                    relevantStatistics.length !== 0 && [
                        m('h4#statisticsCustomHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Custom Statistics'),
                        relevantStatistics.map((id) => m(CustomStatistic, {id}))
                    ]
                ]
            }))
    }
}