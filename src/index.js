import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

import m from 'mithril';

import * as common from './common/common';
import Table from './common/views/Table';
import Header from './common/views/Header';

import data from '../data/fearonLaitin.json';
import test_data from '../data/test.json';

console.log(data);

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

window.addEventListener('scroll', function(e) {
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
