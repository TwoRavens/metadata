import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

import m from 'mithril';

class Main {
    view() {
        return m('h1', 'test');
    }
}

m.mount(document.body, Main);
