import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

import m from 'mithril';

import * as common from './common/common';
import Table from './common/views/Table';
import Header from './common/views/Header';

import * as app from './app';

// For data view
import test_data from '../data/test.json';
import {getVariable, accordionStatistics} from "./app";

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
            m(Header),
            m(modes[mode])
        ];
    }
}

class Editor {

    statisticsData(name) {
        let statisticsData = [];
        let variable = getVariable(name);

        if (variable === undefined) return [];

        for (let statistic in variable) {
            // Don't include statistics that are already in the accordion
            if (accordionStatistics.indexOf(statistic) !== -1) continue;

            let acceptedTypes = ['string', 'number', 'boolean'];
            if (acceptedTypes.indexOf(typeof(variable[statistic])) === -1) continue;

            statisticsData.push([statistic, variable[statistic]])
        }
        return statisticsData;
    }

    view() {

        // Collect data for variable tables
        let variableData = app.getVariable(app.selectedVariable);
        let center = variableData ? app.accordionStatistics.map(
            (statistic) => [statistic, variableData[statistic]]) : [];

        let {upper, lower} = app.partitionVariableTable();

        // Sets spacing of variable table column
        let colgroupVariables = m('colgroup',
            m('col', {span: 1, style: {width: '10em'}}))

        return m('div#editor', {
                style: {
                    height: `calc(100% - ${common.heightHeader + 1}px)`,
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
                m('h4#variablesHeader', 'Variables'),
                m(Table, {
                    id: 'variablesListUpper',
                    headers: ['Name', 'Label'],
                    data: upper,
                    activeRow: app.selectedVariable,
                    onclick: app.selectVariable,
                    tableTags: colgroupVariables,
                    attrsCells: {style: {padding: '.5em'}}
                }),
                m(Table, {
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
                }),
                m(Table, {
                    id: 'variablesListLower',
                    data: lower,
                    activeRow: app.selectedVariable,
                    onclick: app.selectVariable,
                    tableTags: colgroupVariables,
                    attrsCells: {style: {padding: '.5em'}}
                })
            ]),
            m('div#statistics', {
                style: {
                    display: 'inline-block',
                    width: '50%',
                    height: '100%',
                    float: 'right',
                    'overflow-y': 'auto'
                }
            }, [
                m('h4#statisticsComputedHeader', 'Computed Statistics'),
                m(Table, {
                    id: 'statisticsComputed',
                    headers: ['Name', 'Value'],
                    data: this.statisticsData(app.selectedVariable),
                    attrsCells: {style: {padding: '.5em'}}
                }),
                m('h4#statisticsCustomHeader', 'Custom Statistics'),
                m(Table, {
                    id: 'statisticsCustom',
                    headers: ['Name', 'Value'],
                    data: app.customStatistics,
                    attrsCells: {style: {padding: '.5em'}}
                })
            ]))
    }
}

class Report {
    view() {
        return m('div', 'report');
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
            data: _ => test_data.data
        });
    }
}

m.route(document.body, '/', {
    '/': Body,
    '/:mode': Body
});
