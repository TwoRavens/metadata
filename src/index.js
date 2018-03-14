import './pkgs/bootstrap4/css/bootstrap.css';
import './pkgs/bootstrap/css/bootstrap-theme.css';
import './pkgs/bootstrap/css/bootstrap.css';

import m from 'mithril';

import * as common from './common/common';
import Table from './common/views/Table';
import Header from './common/views/Header';
import ButtonRadio from './common/views/ButtonRadio';

import * as app from './app';

// For data view
import test_data from '../data/test.json';
import TextField from "./common/views/TextField";

class Body {
    view(vnode) {
        let {mode} = vnode.attrs;
        mode = mode || 'editor';

        let modes = {
            'editor': Editor,
            'report': Report,
            'data': Data
        };

        return [
            m(Header, {
                contents: m(ButtonRadio, {
                    id: 'modeButtonBar',
                    attrsAll: {style: {width: '200px', 'margin-right': '2em'}, class: 'navbar-right'},
                    onclick: (value) => m.route.set('/' + value.toLowerCase()),
                    activeSection: mode,
                    sections: [{value: 'Editor'}, {value: 'Report'}, {value: 'Data'}]
                })
            }),
            m(modes[mode])
        ];
    }
}

class Editor {

    variableTable() {
        return Object.keys(app.getData()['variables']).map((variable) => [
            variable,
            app.getData()['variables']['labl'],
            m('input[type=checkbox]', {
                onclick: m.withAttr("checked", (checked) => app.setUsedVariable(checked, variable)),
                checked: app.usedVariables.has(variable)
            })
        ])
    };

    statisticsTable(variableName) {
        let statisticsTable = [];
        let statistics = app.getData()['variables'][variableName];

        if (statistics === undefined) return [];

        for (let stat in statistics) {
            // Don't include statistics that are already in the accordion
            if (app.accordionStatistics.indexOf(stat) !== -1) continue;

            let acceptedTypes = ['string', 'number', 'boolean'];
            if (acceptedTypes.indexOf(typeof(statistics[stat])) === -1) continue;

            statisticsTable.push([stat, statistics[stat], '--'])
        }
        return statisticsTable;
    }

    customStatisticsTable(variableName) {
        let statistics = app.customStatistics[variableName] || [];

        return [...Object.keys(statistics), (app.statisticUIDCount[variableName] || 0) + 1].map((UID) => [
            UID,
            ...['name', 'value', 'replication'].map((field) => m(TextField, {
                id: 'textField' + variableName + UID + field,
                value: statistics[UID] ? statistics[UID][field] || '' : '',
                onblur: (value) =>
                    app.setCustomStatistic(variableName, UID, field, value),
                style: {margin: 0}
            }))
        ]);
    }

    view() {
        // Collect data for variable tables
        let variableData = app.getData()['variables'][app.selectedVariable];
        let center = [
            ...variableData ? app.accordionStatistics.map((statistic) => [statistic, variableData[statistic]]) : [],
            ...['classification', 'units', 'note'].map((field) => [field, m(TextField, {
                id: 'textField' + field,
                oninput: (value) => app.setVariableField(app.selectedVariable, field, value),
                style: {margin: 0}
            })])
        ];

        let {upper, lower} = app.partitionVariableTable(this.variableTable());

        let variableAllCheckbox = m('input#variableAllCheck[type=checkbox]', {
            onclick: m.withAttr("checked", (checked) => app.setUsedVariable(checked)),
            checked: app.allVariables.length === app.usedVariables.size
        })

        // Sets spacing of variable table column
        let colgroupVariables = () => m('colgroup',
            m('col', {span: 1, width: '10em'}),
            m('col', {span: 1}),
            m('col', {span: 1, width: '2em'})
        )

        return m('div#editor', {
                style: {
                    'margin-top': common.heightHeader + 'px',
                    height: `calc(100% - ${common.heightHeader}px)`,
                    width: '100%',
                    position: 'absolute',
                    'overflow': 'hidden'
                }
            }, m('div#variables', {
                style: {
                    display: 'inline-block',
                    width: '50%',
                    height: '100%',
                    'overflow-y': 'auto'
                }
            }, [
                m('h4#variablesHeader', {style: {'text-align': 'center'}}, 'Variables'),
                m(Table, {
                    id: 'variablesListUpper',
                    headers: ['Name', 'Label', variableAllCheckbox],
                    data: upper,
                    activeRow: app.selectedVariable,
                    onclick: app.selectVariable,
                    tableTags: colgroupVariables(),
                    attrsCells: {style: {padding: '.5em'}}
                }),
                app.selectedVariable ? m(Table, {
                    id: 'variablesListCenter',
                    headers: ['Name', 'Value'],
                    data: center,
                    attrsCells: {style: {padding: '.3em'}},
                    attrsAll: {
                        style: {
                            width: 'calc(100% - 2em)',
                            'margin-left': '1em',
                            'border-left': '1px solid #dee2e6',
                            'box-shadow': '0 3px 6px #777'
                        }
                    }
                }) : undefined,
                m(Table, {
                    id: 'variablesListLower',
                    data: lower,
                    activeRow: app.selectedVariable,
                    onclick: app.selectVariable,
                    tableTags: colgroupVariables(),
                    attrsCells: {style: {padding: '.5em'}}
                })
            ]),
            app.selectedVariable ? m('div#statistics', {
                style: {
                    display: 'inline-block',
                    width: '50%',
                    height: '100%',
                    float: 'right',
                    'overflow-y': 'auto'
                }
            }, [
                m('h4#statisticsComputedHeader', {style: {'text-align': 'center'}}, 'Computed Statistics'),
                m(Table, {
                    id: 'statisticsComputed',
                    headers: ['Name', 'Value', 'Replicate'],
                    data: this.statisticsTable(app.selectedVariable),
                    attrsCells: {style: {padding: '.5em'}}
                }),
                m('h4#statisticsCustomHeader', {style: {'text-align': 'center'}}, 'Custom Statistics'),
                m(Table, {
                    id: 'statisticsCustom',
                    headers: ['Name', 'Value', 'Replicate'],
                    data: this.customStatisticsTable(app.selectedVariable),
                    attrsCells: {style: {padding: '.5em'}},
                    showUID: false
                })
            ]) : []
        )
    }
}

class Report {
    view() {
        return m('div', {
                style: {'margin-top': common.heightHeader + 'px'}
            },
            'report');
    }
}

window.addEventListener('scroll', function (e) {
    if (this.scrollY === this.scrollMaxY && m.route.get('/data')) {
        test_data.data = test_data.data.concat(test_data.data.slice(0, 100));
        console.log(test_data.data.length);
        m.redraw();
    }
});

class Data {
    view() {
        return m(Table, {
            headers: test_data.columns,
            data: _ => test_data.data,
            attrsAll: {style: {'margin-top': common.heightHeader + 'px'}}
        });
    }
}

m.route.prefix("")
m.route(document.body, '/', {
    '/': Body,
    '/:mode': Body
});
