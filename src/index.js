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
    selectedVariableAccordion() {
        if (!app.selectedVariable) return;
        let variableData = app.getVariable(app.selectedVariable);

        return m('div#variableListCenter', app.accordionStatistics.map((statistic) => m('div', [
            statistic,
            variableData[statistic]
        ])))
    }

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

        let {upper, lower} = app.partitionVariableTable();

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
                    onclickRow: app.selectVariable
                }),
                this.selectedVariableAccordion(),
                m(Table, {
                    id: 'variablesListLower',
                    data: lower,
                    activeRow: app.selectedVariable,
                    onclickRow: app.selectVariable
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
                    data: this.statisticsData(app.selectedVariable),
                }),
                m('h4#statisticsCustomHeader', 'Custom Statistics'),
                m(Table, {
                    id: 'statisticsCustom',
                    data: app.customStatistics,
                })
            ]))
    }
}

class Report {
    view() {
        return m('div', 'report');
    }
}

class Data {
    view() {
        return m(Table, {
            headers: test_data.columns,
            data: test_data.data
        });

    }
}

m.route(document.body, '/', {
    '/': Body,
    '/:mode': Body
});
