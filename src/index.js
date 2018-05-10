import '../static/bootstrap4/css/bootstrap.css';
import './index.css'

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
        return m({
            'Dataset': MenuDataset,
            'Variables': MenuVariables,
            'Statistics': MenuStatistics
            }[app.editorMode])
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
                    sections: [{value: 'Dataset'}].concat(app.preprocessId ? [{value: 'Variables'}, {value: 'Statistics'}] : []),
                }),
                app.preprocessId && m("button#btnPeek.btn.btn-outline-secondary", {
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
                    sections: [{value: 'Home'}, {value: 'Editor'}].concat(app.preprocessId ? [{value: 'Report'}] : [])
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
