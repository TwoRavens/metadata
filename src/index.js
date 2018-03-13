import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

import m from 'mithril';

import * as common from './common/common';
import Table from './common/views/Table';

class Editor {
    view() {
        return m(Table, {
            headers: ['H1', 'H2', 'H3'],
            data: [
                ['var1', 'descriptive stuff', 'string'],
                ['var1', 'descriptive stuff', 'string']
            ]
        });
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
    '/': Editor,
    '/report': Report,
    '/data': Data
});
