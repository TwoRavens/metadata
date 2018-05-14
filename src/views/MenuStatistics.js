import m from 'mithril'

import Table from "../common/views/Table";
import TwoPanel from "../common/views/TwoPanel";
import TextField from "../common/views/TextField";

import * as app from "../app";
import CustomStatistic from "./CustomStatistic";

let variableSearch = '';
let statisticSearch = '';


export default class MenuStatistics {

    // data within statistic table for transposed menu, located on the left panel
    statisticsTable(statistics) {
        if (Object.keys(app.variables).length === 0) return;

        return Object.keys(statistics)
            .filter(statistic => statistic.toLowerCase().includes(statisticSearch.toLowerCase()))
            .filter(statistic => app.isStatistic(statistic))
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .map((statistic) => {

                // boolean for each variable, true if current statistic is not omitted
                let inclusion = Object.keys(app.variables)
                    .filter(variable => app.variableDisplay[variable])
                    .map(variable => app.variableDisplay[variable]['omit'].indexOf(statistic) === -1);

                let checked = inclusion.every(_ => _);
                let indeterminate = !checked && inclusion.some(_ => _);

                return [
                    statistic,
                    app.getStatSchema(statistic)['description'],
                    m('input[type=checkbox]', {
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
        Object.keys(app.customStatistics)
            .filter(key => app.customStatistics[key]['name'].toLowerCase().includes(statisticSearch.toLowerCase()))
            .map(key => uniqueNames.add(app.customStatistics[key]['name']));

        // determine state of checkboxes
        let relevantIDs = Object.keys(app.customStatistics)
            .filter(id => app.customStatistics[id]['name'] === app.selectedCustomStatistic);

        let allChecked = relevantIDs
            .every(id => app.customStatistics[id]['display']['viewable']);
        let allIndet = !allChecked && relevantIDs
            .some(id => app.customStatistics[id]['display']['viewable']);

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

        return Object.keys(variables)
            .filter(variable => variable.toLowerCase().includes(variableSearch.toLowerCase()))
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .map((variable) => {
                return [
                    variable,
                    app.cellValue(variable, selectedStatistic, app.variables[variable][selectedStatistic] || ''),
                    m('input[type=checkbox]', {
                        onclick: m.withAttr("checked", (checked) => app.setUsed(checked, variable, selectedStatistic)),
                        checked: app.variableDisplay[variable]['omit'].indexOf(selectedStatistic) === -1
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
        let allChecked = Object.keys(app.variableDisplay).every(key => app.variableDisplay[key]['viewable']);
        let allIndet = !allChecked && Object.keys(app.variableDisplay).some(key => app.variableDisplay[key]['omit'].length !== Object.keys(app.variables[key]).length);

        let statisticsAllCheckbox = m('input#statisticsAllCheck[type=checkbox]', {
            onclick: m.withAttr("checked", (checked) => app.setUsed(checked)),
            checked: allChecked,
            indeterminate: allIndet
        });

        // all custom statistics that share the current statistic name
        let relevantIDs = Object.keys(app.customStatistics)
            .filter(key => (app.customStatistics[key]['name']) === app.selectedCustomStatistic);

        let allCustomChecked = Object.keys(app.customStatistics)
            .every(id => app.customStatistics[id]['display']['viewable']);
        let allCustomIndet = !allCustomChecked && Object.keys(app.customStatistics)
            .some(id => app.customStatistics[id]['display']['viewable']);

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

        return m(TwoPanel, {
            left: [
                m(TextField, {
                    id: 'searchStatistics',
                    placeholder: 'search statistics',
                    value: statisticSearch,
                    oninput: value => {
                        statisticSearch = value;

                        let matches = Object.keys(statistics)
                            .filter(stat => app.isStatistic(stat))
                            .filter(stat => stat.toLowerCase().includes(statisticSearch.toLowerCase()));
                        let matchesCustom = Object.keys(app.customStatistics)
                            .filter(id => app.customStatistics[id]['name']
                                .toLowerCase().includes(statisticSearch.toLowerCase()));

                        if (matches.length === 1 && matchesCustom.length === 0) {
                            app.setSelectedStatistic(matches[0]);
                            app.setSelectedCustomStatistic(undefined);
                        }
                        if (matches.length === 0 && matchesCustom.length === 1) {
                            app.setSelectedStatistic(undefined);
                            app.setSelectedCustomStatistic(matches[0]);
                        }
                    },
                    style: {margin: '1em', width: 'calc(100% - 2em)', display: 'inline-block'}
                }),
                m('h4#statisticsHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Statistics'),
                m(Table, {
                    id: 'statisticsList',
                    headers: ['Name', 'Description', statisticsAllCheckbox],
                    data: this.statisticsTable(statistics),
                    activeRow: app.selectedStatistic,
                    onclick: (statistic) => {
                        app.setSelectedStatistic(app.selectedStatistic === statistic ? undefined : statistic);
                        app.setSelectedCustomStatistic(undefined);
                    },
                    tableTags: colgroupStatistics(),
                    attrsCells: {style: {padding: '.5em'}}
                }),
                Object.keys(app.customStatistics).length !== 0 && [
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
                        onclick: (statistic) => {
                            app.setSelectedStatistic(undefined);
                            app.setSelectedCustomStatistic(
                                app.selectedCustomStatistic === statistic ? undefined : statistic);
                        },
                        tableTags: colgroupCustomStatistics(),
                        attrsCells: {style: {padding: '.5em'}}
                    }),
                ]
            ],
            right: [
                app.selectedStatistic && [
                    m(TextField, {
                        id: 'searchVariables',
                        placeholder: 'search variables',
                        value: variableSearch,
                        oninput: value => variableSearch = value,
                        style: {margin: '1em', width: 'calc(100% - 2em)', display: 'inline-block'}
                    }),
                    m('h4#variablesHeader', {
                        style: {
                            'padding-top': '.5em',
                            'text-align': 'center'
                        }
                    }, app.selectedStatistic + ' for each variable'),
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
        })
    }
}