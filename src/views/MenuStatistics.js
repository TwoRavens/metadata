import m from 'mithril'

import Table from "../common/views/Table";
import TwoPanel from "../common/views/TwoPanel";

import * as app from "../app";
import descriptions from "../descriptions";


export default class MenuStatistics {

    // data within statistic table for transposed menu, located on the left panel
    statisticsTable(statistics) {
        if (Object.keys(app.variables).length === 0) return;
        let firstVar = Object.keys(app.variables)[0];

        return Object.keys(statistics)
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

    // data within rightView variable table for transposed menu, located on the right panel
    variablesTable(statistics, selectedStatistic) {
        let variables = statistics[selectedStatistic];
        if (variables === undefined) return [];

        let hasCheck = app.editableStatistics.indexOf(selectedStatistic) === -1;

        return Object.keys(variables)
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

        // Sets spacing of variable table column
        let colgroupStatistics = () => {
            return m('colgroup',
                m('col', {span: 1, width: '10em'}),
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
                m(Table, {
                    id: 'statisticsList',
                    headers: ['Name', 'Description', ''],
                    data: this.statisticsTable(statistics),
                    activeRow: app.selectedStatistic,
                    onclick: app.setSelectedStatistic,
                    tableTags: colgroupStatistics(),
                    attrsCells: {style: {padding: '.5em'}}
                }),
            ],
            right: app.selectedStatistic && [
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
                })]
        }))
    }
}