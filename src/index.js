import '../static/bootstrap4/css/bootstrap.css';
import './index.css'

import m from 'mithril';

import * as common from './common/common';
import Table from './common/views/Table';
import Header from './common/views/Header';
import ButtonRadio from './common/views/ButtonRadio';
import TextField from './common/views/TextField';
import Peek from './common/views/Peek';
import TwoPanel from './common/views/TwoPanel';

import descriptions from './descriptions';

import * as app from './app';
import {customStatistics} from "./app";

class Home {
    view(vnode) {
        return m('div#home', {
                style: {
                    height: '100%',
                    width: '100%',
                    position: 'absolute',
                    'overflow': 'hidden'
                }
            }, m(TwoPanel, {
                left: [
                    m('h4#selectDatasetHeader', {
                        style: {
                            'padding-top': '.5em',
                            'text-align': 'center'
                        }
                    }, 'Select Dataset'),
                    m('div', {style: {display: 'inline-block', width: '100%', 'text-align': 'center'}}, [
                        m('label', {style: {'margin-right': '2em'}}, 'Preprocess ID'),
                        m(TextField, {
                            style: {display: 'inline', width: 'auto'},
                            id: 'textFieldPreprocessID',
                            value: app.preprocess_id,
                            placeholder: 'numeric',
                            oninput: app.getData
                        }),
                        // disabled because it auto-loads
                        // m('button.btn.btn-outline-secondary', {
                        //     style: {'margin-left': '2em'},
                        //     onclick: () => m.route.set('/' + app.preprocess_id + '/editor'),
                        //     disabled: app.preprocess_id === undefined
                        // }, 'Load')
                    ]),
                    app.preprocess_id && m(Table, {
                        id: 'datasetStatistics',
                        headers: ['Name', 'Value'],
                        data: app.datasetInfo,
                        attrsCells: {style: {padding: '.5em'}}
                    })
                ],
                right: [
                    m('h4#uploadDatasetHeader', {
                        style: {
                            'padding-top': '.5em',
                            'text-align': 'center'
                        }
                    }, 'Upload Dataset'),
                    m('div', {style: {display: 'inline-block', width: '100%', 'text-align': 'center'}}, [
                        m('input', {
                            type: 'file',
                            onchange: app.uploadFile
                        })
                    ]),
                    m('div', {style: {display: 'inline-block', width: '100%', 'text-align': 'center'}}, app.uploadStatus)
                ]
            })
        )
    }
}

class Editor {
    cellValue(data, variable, statistic, field) {

        let customVal = ((app.customFields[variable] || {})[statistic] || {})[field];
        let defaultVal = data[statistic] || '--';
        let chosenVal = customVal || defaultVal || '';
        if (app.editableStatistics.indexOf(statistic) === -1) return m('div', {
            'data-toggle': 'tooltip',
            title: descriptions[statistic]
        }, chosenVal);

        return m(TextField, {
            id: 'textField' + statistic + field,
            value: chosenVal,
            onblur: (value) => app.setCustomField(variable, statistic, field, value),
            style: {margin: 0}
        });
    }

    // data within variable table
    variableTable() {
        return Object.keys(app.variables).map((variable) => [
            variable,
            ((app.customFields[variable] || {})['labl'] || {})['value'] || app.variables[variable]['labl'] || '',
            m('input[type=checkbox]', {
                onclick: e => {e.stopPropagation(); m.withAttr("checked", (checked) => app.setUsedVariable(checked, variable))(e)},
                checked: app.usedVariables.has(variable)
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
            this.cellValue(statistics, variableName, stat, 'value')
        ]);
    }

    // data within statistics table
    statisticsTable(variableName) {
        let statistics = app.variables[variableName];
        if (statistics === undefined) return [];
        return Object.keys(statistics)
            .filter((stat) => app.isStatistic(variableName, stat))
            .map((stat) => [
                m('div', {
                    'data-toggle': 'tooltip',
                    title: descriptions[stat]
                }, stat),
                this.cellValue(statistics, variableName, stat, 'value'),
                m('input[type=checkbox]', {
                    onclick: m.withAttr("checked", (checked) => app.setUsedStatistic(checked, variableName, stat)),
                    checked: (app.usedStatistics[variableName] || new Set()).has(stat)
                })
            ]);
    }

    // data within custom statistics table
    customStatisticsTable(variableName) {
        let statistics = app.customStatistics[variableName] || [];

        let stat_ids = Object.keys(customStatistics).filter(key => {
            return customStatistics[key][variables].length === 1 && customStatistics[key][variables][0] === variableName;
        })

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


    datasetMenu() {
        // Sets spacing of variable table column
        let colgroupAttributes = () => {
            return m('colgroup',
                m('col', {span: 1, width: '10em'}),
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
        }, m(TwoPanel, {
            left: [
                m('h4#datasetHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Dataset Statistics'),
                m(Table, {
                    id: 'datasetStatistics',
                    headers: ['Name', 'Value'],
                    data: Object.assign({}, app.datasetInfo,
                        {
                            'Name': m(TextField, {
                                id: 'textFieldDatasetName',
                                value: app.datasetInfo['Name'],
                                onblur: (value) => app.setDatasetField('name', value),
                                style: {margin: 0}
                            }),
                            'Description': m(TextField, {
                                id: 'textFieldDatasetDescription',
                                value: app.datasetInfo['Description'],
                                onblur: (value) => app.setDatasetField('description', value),
                                style: {margin: 0}
                            })
                        }),
                    attrsCells: {style: {padding: '.5em'}}
                }),
                m('h4#datasetHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Custom Dataset Statistics'),
                m(Table, {
                    id: 'datasetList',
                    headers: ['Name', 'Description', 'Replication', ''],
                    data: app.customFieldsDataset,
                    activeRow: app.selectedDatasetField,
                    onclick: app.setSelectedDatasetAttribute,
                    tableTags: colgroupAttributes(),
                    attrsCells: {style: {padding: '.5em'}}
                })
            ],
            right: [
                m('h4#datasetFieldHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, "Citation"),
                m(Table, {
                    id: 'citationTable',
                    headers: ['Name', 'Description', 'Replication', ''],
                    data: app.customFieldsDataset,
                    activeRow: app.selectedDatasetField,
                    onclick: app.setSelectedDatasetAttribute,
                    tableTags: colgroupAttributes(),
                    attrsCells: {style: {padding: '.5em'}}
                })
            ]
        }));
    }


    variablesMenu() {
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
               right: app.selectedVariable ? [
                   m('h4#statisticsComputedHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, app.selectedVariable +' Computed Statistics'),
                   m(Table, {
                       id: 'statisticsComputed',
                       headers: ['Name', 'Value', statisticsAllCheckbox],
                       data: this.statisticsTable(app.selectedVariable),
                       tableTags: colgroupStatistics(),
                       attrsCells: {style: {padding: '.5em'}}
                   }),
                   m('h4#statisticsCustomHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Custom Statistics'),
                   m(Table, {
                       id: 'statisticsCustom',
                       headers: ['ID', 'Name', 'Value', 'Description', 'Replication', customStatisticsAllCheckbox],
                       data: this.customStatisticsTable(app.selectedVariable),
                       attrsCells: {style: {padding: '.5em'}},
                       showUID: false
                   })
               ] : []
           }))
    }

    // data within statistic table for transposed menu, located on the left panel
    statisticsTransTable(statistics) {
        if (Object.keys(app.variables).length === 0) return;
        let firstVar = Object.keys(app.variables)[0];

        return Object.keys(statistics)
            .filter(statistic => app.isStatistic(firstVar, statistic) || app.editableStatistics.indexOf(statistic) !== -1)
            .map((statistic) => {
                let inclusion = Object.keys(app.variables).map(variable => app.usedStatistics[variable].has(statistic));

                let hasCheck = app.editableStatistics.indexOf(statistic) === -1;
                let checked = inclusion.every(_ => _);
                let indeterminate = !checked && inclusion.some(_ => _);

                return [
                    m('div', {
                        'data-toggle': 'tooltip',
                        title: descriptions[statistic]
                    }, statistic),
                    hasCheck && m('input[type=checkbox]', {
                        onclick: e => {
                            e.stopPropagation();
                            m.withAttr("checked", (checked) => app.setTransposedUsedStatistic(checked, statistic))(e)
                        },
                        checked: checked,
                        indeterminate: indeterminate
                    })
                ]
            });
    }

    // data within rightView variable table for transposed menu, located on the right panel
    variablesTransTable(statistics, selectedStatistic) {
        let variables = statistics[selectedStatistic];
        if (variables === undefined) return [];

        let hasCheck = app.editableStatistics.indexOf(selectedStatistic) === -1;

        return Object.keys(variables).map((variable) => {
            return [
                variable,
                this.cellValue(app.variables[variable], variable, selectedStatistic, 'value'),
                hasCheck && m('input[type=checkbox]', {
                    onclick: m.withAttr("checked", (checked) => app.setUsedStatistic(checked, variable, selectedStatistic)),
                    checked: (app.usedStatistics[variable] || new Set()).has(selectedStatistic)
                })
            ]
        });
    }

    statisticsMenu() {
        // transpose the variables data structure
        let statistics = {};

        for (let variable of Object.keys(app.variables || {}))
            for (let statistic of Object.keys(app.variables[variable] || {}))
                statistics[statistic] === undefined ?
                    statistics[statistic] = {[variable]: app.variables[variable][statistic]} :
                    statistics[statistic][variable] = app.variables[variable][statistic];

        // retrieve data from data source
        let statisticData = statistics[app.selectedStatistic];
        let variableData = Object.keys(statisticData || {});

        // set of enabled checkboxes for right transposed menu
        let usedVars = new Set(Object.keys(app.usedStatistics)
            .map(variable => app.usedStatistics[variable].has(app.selectedStatistic)));

        // Sets spacing of variable table column
        let colgroupStatistics = () => {
            return m('colgroup',
                m('col', {span: 1, width: '10em'}),
                m('col', {span: 1}),
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
                    headers: ['Name', 'Description', 'Replication', ''],
                    data: this.statisticsTransTable(statistics),
                    activeRow: app.selectedStatistic,
                    onclick: app.setSelectedStatistic,
                    tableTags: colgroupStatistics(),
                    attrsCells: {style: {padding: '.5em'}}
                }),
            ],
            right: app.selectedStatistic ? [
                m('h4#variablesHeader', {
                    style: {
                        'padding-top': '.5em',
                        'text-align': 'center'
                    }
                }, app.selectedStatistic + ' for each variable'),
                m(Table, {
                    id: 'variablesComputed',
                    headers: ['Name', 'Value', ''],
                    data: this.variablesTransTable(statistics, app.selectedStatistic),
                    tableTags: colgroupVariables(),
                    attrsCells: {style: {padding: '.5em'}}
                })] : []
        }))
    }

    view() {
        if (app.editorMode === 'Dataset') {
            return this.datasetMenu();
        }

        if (app.editorMode === 'Statistics') {
            return this.statisticsMenu();
        }

        if (app.editorMode === 'Variables') {
            return this.variablesMenu();
        }
    }
}

class Report {
    view() {
        return m('div', {
            style: {
                'white-space': 'pre-wrap'
            }
        }, "REPORT");
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
        app.getData(id);

        // reset peeked data on page load
        localStorage.setItem('peekHeader', 'Preprocess ID:  ' + id);
        localStorage.removeItem('peekTableData');
    }

    view(vnode) {
        let {id, mode} = vnode.attrs;
        app.metadataMode = mode || 'home';

        return [
            m(Header,
                mode === 'editor' && m(ButtonRadio, {
                    id: 'editorButtonBar',
                    attrsAll: {style: {width: 'auto', 'margin-top': '8px', 'margin-right': '2em'}},
                    onclick: app.setEditorMode,
                    activeSection: app.editorMode,
                    sections: [{value: 'Dataset'}, {value: 'Variables'}, {value: 'Statistics'}]
                }),
                app.preprocess_id && m("button#btnPeek.btn.btn-outline-secondary", {
                        title: 'Display a data preview',
                        style: {"margin-right": '2em'},
                        onclick: () => window.open('/peek', 'peek')
                    },
                    'Data'
                ),
                m(ButtonRadio, {
                    id: 'modeButtonBar',
                    attrsAll: {style: {width: 'auto', 'margin-top': '8px', 'margin-right': '2em'}},
                    onclick: (value) => m.route.set(app.preprocess_id ? '/' + id + '/' + value.toLowerCase() : '/'),
                    activeSection: app.metadataMode,
                    sections: [{value: 'Home'}].concat(app.preprocess_id ? [{value: 'Editor'}, {value: 'Report'}] : [])
                })
            ),
            m('div#canvas', {
                style: {
                    width: '100%',
                    height: `calc(100% - ${common.heightHeader}px)`,
                    position: 'fixed',
                    overflow: 'auto',
                    top: common.heightHeader + 'px'
                }
            }, m({
                'home': Home,
                'editor': Editor,
                'report': Report
            }[app.metadataMode]))
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
