import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

import m from 'mithril';

import * as common from './common/common';
import Table from './common/views/Table';
import Header from './common/views/Header';

import * as app from './app';

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
        ]
    }
}

class Editor {
    selectedVariableDropdown() {
        if (!app.selectedVariable) return;
        let variableData = app.getVariable(app.selectedVariable);
        let dropStatistics = ['nature', 'time', 'binary'];

        return m('div', dropStatistics.map((statistic) => m('div', [
            statistic,
            variableData[statistic]
        ])))
    }

    view() {

        let {upper, lower} = app.partitionVariableTable();
        return [
            m(Table, {
                headers: ['Name', 'Label'],
                data: upper,
                activeRow: app.selectedVariable,
                onclickRow: app.selectVariable,
                attrsAll: {style: {width: '50%'}}
            }),
            this.selectedVariableDropdown(),
            m(Table, {
                data: lower,
                activeRow: app.selectedVariable,
                onclickRow: app.selectVariable,
                attrsAll: {style: {width: '50%'}}
            })
        ]

    }
}

class Report {
    view() {
        return m('div', 'report');
    }
}

class Data {
    view() {
        return m('div', 'data');
    }
}

m.route(document.body, '/', {
    '/': Body,
    '/:mode': Body
});
