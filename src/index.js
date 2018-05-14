import '../static/bootstrap4/css/bootstrap.css';
import './index.css';

import m from 'mithril';
// common
import * as common from './common/common';
import Header from './common/views/Header';
import ButtonRadio from './common/views/ButtonRadio';
import Peek from './common/views/Peek';
import Canvas from "./common/views/Canvas";
// metadata
import MenuDataset from './views/MenuDataset';
import MenuVariables from './views/MenuVariables';
import MenuStatistics from './views/MenuStatistics';

import * as app from './app';
import Table from "./common/views/Table";
import TextField from "./common/views/TextField";

common.heightHeader = '72px';
common.heightFooter = '0px';

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
        return m('div#editor', m({
            'Dataset': MenuDataset,
            'Variables': MenuVariables,
            'Statistics': MenuStatistics
        }[app.editorMode]))
    }
}

class Report {
    view() {
        let imageSize = '400px';
        return m('div#report', {position: 'relative', style: {'max-width': '1000px', margin: '0 auto'}},
            m('h5', {
                style: {
                    'margin-top': '50px',
                    'text-align': 'center'
                }
            }, app.citation ? app.citation['name'] : 'Data Exploration Report'),

            m('h6', {style: {'text-align': 'center'}}, [
                'Results by TwoRavens | ',
                m('a', {
                    href: 'http://2ra.vn',
                    target: '_blank',
                    style: {display: 'inline-block'}
                }, 'http://2ra.vn')
            ]),
            m('h6', {style: {'text-align': 'center'}}, Date()),
            m('div', app.dataset['description']),
            Object.keys(app.variables)
                .filter(variable => app.variableDisplay[variable]['viewable'])
                .map(variable => [
                    m('h6', {style: {width: '100%', 'font-weight': 'bold', 'margin': '1em 2em 0 2em'}}, variable),
                    m('div', app.variables[variable]['description']),
                    m('div', [
                        m(Table, {
                            id: 'table' + variable,
                            headers: ['name', 'value'],
                            data: Object.keys(app.variables[variable])
                                .filter(key => ['description', 'plotValues', 'pdfPlotType', 'pdfPlotX', 'pdfPlotY', 'cdfPlotType', 'cdfPlotX', 'cdfPlotY'].indexOf(key) === -1)
                                .filter(key => app.variableDisplay[variable]['omit'].indexOf(key) === -1)
                                .map(key => [key, app.cellValue(variable, key, app.variables[variable][key])]),
                            attrsAll: {
                                style: {
                                    display: 'inline-table',
                                    margin: '1em 1em 2em 0',
                                    width: 'auto',
                                    'max-width': 'calc(50% - 3em)',
                                    'font-size': '11pt',
                                    'box-shadow': '0 3px 6px #777'
                                }
                            },
                            attrsCells: {style: {padding: '0.1em 1em'}}
                        }),
                        app.variableDisplay[variable]['omit'].indexOf('plotValues') === -1 && m(Table, {
                            id: 'table' + variable + 'plotValues',
                            headers: ['bucket', 'frequency'],
                            data: Object.keys(app.variables[variable]['plotValues'])
                                .sort((a, b) => app.variables[variable]['plotValues'][b] - app.variables[variable]['plotValues'][a])
                                .slice(0, 25)
                                .map(key => [key, app.variables[variable]['plotValues'][key]]),
                            attrsAll: {
                                style: {
                                    display: 'inline-table',
                                    margin: '1em 1em 2em 0',
                                    width: 'auto',
                                    'max-width': 'calc(50% - 3em)',
                                    'font-size': '11pt',
                                    'box-shadow': '0 3px 6px #777'
                                }
                            },
                            attrsCells: {style: {padding: '0.1em 1em'}}
                        })
                    ]),
                    m('div.html2pdf__page-break')
                ]));
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
        app.setMetadataMode(mode || 'home');

        let {pages, dpi} = app.getPrintProfile();

        return [
            m(Header,

                app.mode !== 'home' && m('div#precision', {style: {'margin-right': '2em'}}, [
                    m('label#labelTextFieldPrecision', {
                        for: 'textFieldPrecision',
                        style: {'margin-right': '1em'}
                    }, 'Precision: '),
                    m(TextField, {
                        id: 'textFieldPrecision',
                        value: app.precision || '',
                        style: {width: '50px', display: 'inline-block'},
                        oninput: (value) => {
                            value = value || 0;
                            if (isNaN(value)) return;
                            value *= 1;
                            if (value >= 0 && Number.isInteger(value))
                                app.setPrecision(value * 1);
                        }
                    }),
                ]),
                mode === 'editor' && m(ButtonRadio, {
                    id: 'editorButtonBar',
                    attrsAll: {style: {width: 'auto', 'margin-top': '8px', 'margin-right': '2em'}},
                    onclick: app.setEditorMode,
                    activeSection: app.editorMode,
                    sections: [{value: 'Dataset'}].concat(app.preprocessId ? [{value: 'Variables'}, {value: 'Statistics'}] : []),
                }),
                mode === 'report' && [
                    m('div', {style: {'margin-right': '2em'}}, `Pages: ${pages}` + (pages < 40 ? ` - DPI: ${dpi}` : ' - Threshold is 40 pages - DPI is too low')),
                    m("button#btnSave.btn.btn-outline-secondary", {
                        disabled: pages > 40,
                        title: 'Save as a PDF',
                        style: {"margin-right": '2em'},
                        onclick: app.saveReport
                    }, 'Save')
                ],
                app.preprocessId && m("button#btnPeek.btn.btn-outline-secondary", {
                        title: 'Display a data preview',
                        style: {"margin-right": '2em'},
                        onclick: () => window.open('/data', 'data')
                    }, 'Data'),
                m(ButtonRadio, {
                    id: 'modeButtonBar',
                    attrsAll: {style: {width: 'auto', 'margin-top': '8px', 'margin-right': '2em'}},
                    onclick: (value) => m.route.set('/' + id + '/' + value.toLowerCase()),
                    activeSection: app.metadataMode,
                    sections: [/*{value: 'Home'},*/ {value: 'Editor'}].concat(app.preprocessId ? [{value: 'Report'}] : [])
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
