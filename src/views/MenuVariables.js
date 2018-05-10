import m from 'mithril'

import Table from "../common/views/Table";
import TextField from "../common/views/TextField";
import TwoPanel from "../common/views/TwoPanel";

import * as app from "../app";
import CustomStatistic from "./CustomStatistic";

let variableSearch = '';
let statisticSearch = '';

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
        // noinspection JSCheckFunctionSignatures
        return Object.keys(app.variables)
            .filter(key => key.toLowerCase().includes(variableSearch.toLowerCase()))
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .map((variable) => [
                variable,
                app.variables[variable]['description'] || '',
                m('input[type=checkbox]', {
                    onclick: e => {
                        e.stopPropagation();
                        m.withAttr("checked", (checked) => app.setUsed(checked, variable))(e)
                    },
                    checked: app.variableDisplay[variable]['viewable'],
                    indeterminate: app.variableDisplay[variable]['viewable'] && app.variableDisplay[variable]['omit'].length !== 0
                })
            ]);
    }

    // data shown within accordion upon variable click
    variableAccordionTable(variableName) {
        let statistics = app.variables[variableName];
        statistics = statistics || [];

        return app.editableStatistics.map((stat) => [
            m('div', {
                'data-toggle': 'tooltip',
                'title': app.getStatSchema(stat)['description']
            }, stat),
            app.cellValue(variableName, stat, statistics[stat])
        ]);
    }

    // data within statistics table
    statisticsTable(variableName) {
        let statistics = app.variables[variableName];

        let omissions = new Set(app.variableDisplay[variableName]['omit']);
        if (statistics === undefined) return [];
        // noinspection JSCheckFunctionSignatures
        return Object.keys(statistics)
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .filter(stat => stat.toLowerCase().includes(statisticSearch.toLowerCase()))
            .filter((stat) => app.isStatistic(stat, variableName))
            .map((stat) => [
                m('div', {
                    'data-toggle': 'tooltip',
                    title: app.getStatSchema(stat)['description']
                }, stat),
                app.cellValue(variableName, stat, statistics[stat]),
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

        // Checkbox for toggling all states
        let allChecked = Object.keys(app.variableDisplay).every(key => app.variableDisplay[key]['viewable']);
        let allIndet = !allChecked && Object.keys(app.variableDisplay).some(key => app.variableDisplay[key]['omit'].length !== Object.keys(app.variables[key]).length);

        let variableAllCheckbox = m('input#variableAllCheck[type=checkbox]', {
            onclick: m.withAttr("checked", (checked) => app.setUsed(checked)),
            checked: allChecked,
            indeterminate: allIndet
        });

        // all custom statistics that include the current variable
        let relevantStatistics = Object.keys(app.customStatistics)
            .filter(key => app.customStatistics[key]['name'].toLowerCase().includes(statisticSearch.toLowerCase()))
            .filter(key => (app.customStatistics[key]['variables'] || []).indexOf(app.selectedVariable) !== -1);

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

        return m(TwoPanel, {
                left: [
                    m(TextField, {
                        id: 'searchVariables',
                        placeholder: 'search variables',
                        value: variableSearch,
                        oninput: value => {
                            variableSearch = value;
                            let matches = Object.keys(app.variables).filter(key => key.toLowerCase().includes(variableSearch.toLowerCase()));
                            if (matches.length === 1) app.selectedVariable = matches[0];
                        },
                        style: {margin: '1em', width: 'calc(100% - 2em)', display: 'inline-block'}
                    }),
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
                    // center table is only rendered if selected, and is matched in the search
                    (app.selectedVariable || '').toLowerCase().includes(variableSearch.toLowerCase())
                    && m(Table, {
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
                    m(TextField, {
                        id: 'searchStatistics',
                        placeholder: 'search statistics',
                        value: statisticSearch,
                        oninput: value => statisticSearch = value,
                        style: {margin: '1em', width: 'calc(100% - 2em)', display: 'inline-block'}
                    }),
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
            })
    }
}