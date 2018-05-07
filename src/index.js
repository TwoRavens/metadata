import '../static/bootstrap4/css/bootstrap.css';
import './index.css'

import m from 'mithril';

// common
import * as common from './common/common';
import Table from './common/views/Table';
import Header from './common/views/Header';
import ButtonRadio from './common/views/ButtonRadio';
import TextField from './common/views/TextField';
import Peek from './common/views/Peek';
import TwoPanel from './common/views/TwoPanel';
import Dropdown from './common/views/Dropdown';
import Canvas from "./common/views/Canvas";

// metadata
import MenuDataset from './views/MenuDataset';
import MenuVariables from './views/MenuVariables';
import MenuStatistics from './views/MenuStatistics';

import descriptions from './descriptions';

import * as app from './app';
import {
    customStatistics,
    setCustomStatistic,
    setUsedCustomStatistic,
    statisticUIDCount,
    usedCustomStatistics
} from "./custom";

common.heightHeader = '72px';
common.heightFooter = '0px';

// return a mithril cell - could be text, field, radio, button, dropdown, etc.
export let cellValue = (data, variable, statistic, field) => {
    let showText = data[statistic] || '';

    // old versions are readonly
    if (app.version) return m('div', {
        'data-toggle': 'tooltip',
        title: descriptions[statistic]
    }, showText);

    if (statistic === 'numchar') {
        return m(ButtonRadio, {
            id: 'radioNumchar',
            sections: [{value: 'numeric'}, {value: 'character'}],
            activeSection: showText,
            onclick: (value) => app.setField(variable, statistic, value),
            attrsAll: {style: {width: 'auto'}}
        })
    }

    if (statistic === 'identifier') {
        return m(ButtonRadio, {
            id: 'radioIdentifier',
            sections: [{value: 'cross-section'}, {value: 'time'}],
            activeSection: showText,
            onclick: (value) => app.setField(variable, statistic, value),
            attrsAll: {style: {width: '240px'}}
        })
    }

    if (statistic === 'nature') {
        return m(Dropdown, {
            id: 'dropdownNature',
            items: ['nominal', 'ordinal', 'interval', 'ratio', 'percent', 'other'],
            onclickChild: (value) => app.setField(variable, statistic, value),
            dropWidth: '100px'
        })
    }

    if (app.editableStatistics.indexOf(statistic) === -1) return m('div', {
        'data-toggle': 'tooltip',
        title: descriptions[statistic]
    }, showText);

    return m(TextField, {
        id: 'textField' + statistic + field,
        value: showText,
        onblur: (value) => app.setField(variable, statistic, value),
        style: {margin: 0}
    });
}

class Home {
    view(vnode) {
        return m('div#home', {
                style: {
                    height: '100%',
                    width: '100%',
                    position: 'absolute',
                    'overflow': 'hidden'
                }
            }, 'Informative text about the metadata service'
        )
    }
}

class Editor {
    view() {
        return m({
            'Dataset': MenuDataset,
            'Variables': MenuVariables,
            'Statistics': MenuStatistics}[app.editorMode])
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
                    onclick: (mode) => app.editorMode = mode,
                    activeSection: app.editorMode,
                    sections: [{value: 'Dataset'}].concat(app.preprocess_id ? [{value: 'Variables'}, {value: 'Statistics'}] : []),
                }),
                app.preprocess_id && m("button#btnPeek.btn.btn-outline-secondary", {
                        title: 'Display a data preview',
                        style: {"margin-right": '2em'},
                        onclick: () => window.open('/data', 'data')
                    },
                    'Data'
                ),
                m(ButtonRadio, {
                    id: 'modeButtonBar',
                    attrsAll: {style: {width: 'auto', 'margin-top': '8px', 'margin-right': '2em'}},
                    onclick: (value) => m.route.set('/' + id + '/' + value.toLowerCase()),
                    activeSection: app.metadataMode,
                    sections: [{value: 'Home'}, {value: 'Editor'}].concat(app.preprocess_id ? [{value: 'Report'}] : [])
                })
            ),
            m(Canvas,
                m({
                    'home': Home,
                    'editor': Editor,
                    'report': Report
                }[app.metadataMode])
            )
        ];
    }
}

m.route.prefix('');
m.route(document.body, '/', {
    '/': Body,
    '/data': Peek,
    '/:id': Body,
    '/:id/:mode': Body,
});
