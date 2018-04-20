import '../static/bootstrap4/css/bootstrap.css';
import './index.css'

import m from 'mithril';

import * as common from './common/common';
import Table from './common/views/Table';
import Header from './common/views/Header';
import ButtonRadio from './common/views/ButtonRadio';
import TextField from './common/views/TextField';
import Peek from './common/views/Peek';

import * as app from './app';

import test_data from '../static/data/test.json';
import {heightFooter} from "./common/common";
import {panelOcclusion} from "./common/common";
import {heightHeader} from "./common/common";

class Editor {
    cellValue(data, statistic, field) {
        let customVal = ((app.customFields[app.selectedVariable] || {})[statistic] || {})[field];
        let defaultVal = field === 'value' ? data[statistic] : '--';  // missing from preprocess.json
        let chosenVal = customVal || defaultVal || '';
        if (app.editableStatistics.indexOf(statistic) === -1 || field === 'description') return chosenVal;

        return m(TextField, {
            id: 'textField' + statistic + field,
            value: chosenVal,
            onblur: (value) => app.setCustomField(app.selectedVariable, statistic, field, value),
            style: {margin: 0}
        });
    }

    // data within variable table
    variableTable() {
        return Object.keys(app.variables).map((variable) => [
            variable,
            ((app.customFields[variable] || {})['labl'] || {})['value'] || app.variables[variable]['labl'] || '',
            m('input[type=checkbox]', {
                onclick: m.withAttr("checked", (checked) => app.setUsedVariable(checked, variable)),
                checked: app.usedVariables.has(variable)
            })
        ]);
    };

    // data shown within accordion upon variable click
    variableAccordionTable(variableName) {
        let statistics = app.variables[variableName];
        statistics = statistics || [];

        return [...app.accordionStatistics, ...app.ontologyStatistics].map((stat) => [
            stat,
            this.cellValue(statistics, stat, 'value'),
            this.cellValue(statistics, stat, 'description')
        ]);
    }

    // data within statistics table
    statisticsTable(variableName) {
        let statistics = app.variables[variableName];
        if (statistics === undefined) return [];
        return Object.keys(statistics)
            .filter((stat) => app.isStatistic(variableName, stat))
            .map((stat) => [
                stat,
                this.cellValue(statistics, stat, 'value'),
                this.cellValue(statistics, stat, 'description'),
                '--',
                m('input[type=checkbox]', {
                    onclick: m.withAttr("checked", (checked) => app.setUsedStatistic(checked, variableName, stat)),
                    checked: (app.usedStatistics[variableName] || new Set()).has(stat)
                })
            ]);
    }

    // data within custom statistics table
    customStatisticsTable(variableName) {
        let statistics = app.customStatistics[variableName] || [];
        let newUID = (app.statisticUIDCount[variableName] || 0) + 1;

        return [...Object.keys(statistics), newUID].map((UID) => [
            UID,
            ...['name', 'value', 'description', 'replication'].map((field) => m(TextField, {
                id: 'textField' + variableName + UID + field,
                value: statistics[UID] ? statistics[UID][field] || '' : '',
                onblur: (value) =>
                    app.setCustomStatistic(variableName, UID, field, value),
                style: {margin: 0}
            })),
            UID === newUID ? undefined : m('input[type=checkbox]', {
                onclick: m.withAttr("checked", (checked) => app.setUsedCustomStatistic(checked, variableName, UID)),
                checked: (app.usedCustomStatistics[variableName] || new Set()).has(parseInt(UID))
            })
        ]);
    }

    view() {
        // retrieve data from data source
        let variableData = app.variables[app.selectedVariable];
        let statisticsData = Object.keys(variableData || {}).filter((stat) => app.isStatistic(app.selectedVariable, stat));

        // format variable table data
        let center = this.variableAccordionTable(app.selectedVariable);
        let {upper, lower} = app.partitionVariableTable(this.variableTable());

        // Checkboxes for toggling all states
        let variableAllCheckbox = m('input#variableAllCheck[type=checkbox]', {
            onclick: m.withAttr("checked", (checked) => app.setUsedVariable(checked)),
            checked: Object.keys(app.variables).length === app.usedVariables.size
        });

        let usedStats = app.usedStatistics[app.selectedVariable];

        let statisticsAllCheckbox = m('input#statisticsAllCheck[type=checkbox]', {
            onclick: m.withAttr("checked", (checked) => app.setUsedStatistic(checked, app.selectedVariable)),
            checked: usedStats && (statisticsData.length === usedStats.size)
        });

        let usedCustStats = app.usedCustomStatistics[app.selectedVariable];
        let customStatisticsAllCheckbox = m('input#customStatisticsAllCheck[type=checkbox]', {
            onclick: m.withAttr("checked", (checked) => app.setUsedCustomStatistic(checked, app.selectedVariable)),
            checked: usedCustStats && usedCustStats.size !== 0 && (Object.keys(app.customStatistics[app.selectedVariable] || {}).length === usedCustStats.size)
        });

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
                m('col', {span: 1}),
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
            }, m('div#variables', {
                style: {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    right: app.leftpanelSize + '%',
                    'overflow-y': 'auto'
                }
            }, [m('h4#variablesHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Variables'),
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
                    headers: ['Name', 'Value', 'Description'],
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
            ]),
            app.selectedVariable && m('div#statistics', {
                style: {
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: app.leftpanelSize + '%',
                    'overflow-y': 'auto',
                    animation: 'appear .5s ease'
                }
            }, [
                m('#horizontalDrag', {
                    style: {
                        position: 'absolute',
                        left: '-4px',
                        top: 0,
                        bottom: 0,
                        width: '12px',
                        cursor: 'w-resize'
                    },
                    onmousedown: app.resizeEditor
                }),
                m('h4#statisticsComputedHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Computed Statistics'),
                m(Table, {
                    id: 'statisticsComputed',
                    headers: ['Name', 'Value', 'Description', 'Replication', statisticsAllCheckbox],
                    data: this.statisticsTable(app.selectedVariable),
                    tableTags: colgroupStatistics(),
                    attrsCells: {style: {padding: '.5em'}}
                }),
                m('h4#statisticsCustomHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Custom Statistics'),
                m(Table, {
                    id: 'statisticsCustom',
                    headers: ['Name', 'Value', 'Description', 'Replication', customStatisticsAllCheckbox],
                    data: this.customStatisticsTable(app.selectedVariable),
                    attrsCells: {style: {padding: '.5em'}},
                    showUID: false
                })
            ]));
    }
}

class Report {
    view() {
        return m('div', {
            style: {
                'white-space': 'pre-wrap'
            }
        }, JSON.stringify(app.getReportData(), null, 2));
    }
}

window.addEventListener('scroll', function (e) {
    if (this.scrollY === this.scrollMaxY && m.route.get('/data')) {
        test_data.data.slice(0, 100).forEach(x => test_data.data.push(x));
        m.redraw();
    }
});

class Body {
    oninit(vnode) {
        let {id} = vnode.attrs;
        if (id === undefined) console.log("unknown preprocess_id")
        app.getData(id || 1);

        // reset peeked data on page load
        localStorage.setItem('peekHeader', 'metadata ' + id);
        localStorage.removeItem('peekTableData');
    }

    view(vnode) {
        let {id, mode} = vnode.attrs;
        mode = mode || 'editor';

        let modes = {
            'editor': Editor,
            'report': Report
        };

        return [
            m(Header,
                mode === 'editor' && m(ButtonRadio, {
                    id: 'editorTransposeButtonBar',
                    attrsAll: {style: {width: 'auto', 'margin-top': '8px', 'margin-right': '2em'}},
                    onclick: app.setTransposition,
                    activeSection: app.transposition,
                    sections: [{value: 'Variable'}, {value: 'Statistic'}]
                }),
                m("button#btnPeek.btn.btn-outline-secondary", {
                        title: 'Display a data preview',
                        style: {"margin-right": '2em'},
                        onclick: () => window.open('/peek', 'peek')
                    },
                    'Data'
                ),
                m(ButtonRadio, {
                    id: 'modeButtonBar',
                    attrsAll: {style: {width: 'auto', 'margin-top': '8px', 'margin-right': '2em'}},
                    onclick: (value) => m.route.set('/' + id + '/' + value.toLowerCase()),
                    activeSection: mode,
                    sections: [{value: 'Editor'}, {value: 'Report'}]
                })
            ),
            m('div#canvas', {
                style: {
                    width: '100%',
                    height: `calc(100% - ${heightHeader}px)`,
                    position: 'fixed',
                    overflow: 'auto',
                    top: heightHeader + 'px'
                }
            }, m(modes[mode]))
        ];
    }
}

m.route.prefix('');
m.route(document.body, '/', {
    '/': Body,
    '/peek': Peek,
    '/:id': Body,
    '/:id/:mode': Body,
});
