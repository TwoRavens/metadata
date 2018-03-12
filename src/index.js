import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

import m from 'mithril';
import Table from './common/views/Table';
import * as common from './common/common';

class Main {
    view() {
        return m(Table, {
            headers: ['H1', 'H2', 'H3'],
            data: [
                ['var1', 'descriptive stuff', 'string'],
                ['var1', 'descriptive stuff', 'string']
            ]
        })
    }
}

m.mount(document.body, Main);
