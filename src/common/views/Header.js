import TRImage from '../../../static/images/TwoRavens-sm.png';
import m from 'mithril';
import {ABOUT, mergeAttributes} from '../common';

export default class Header {
    oninit() {
        this.about = false;
    }

    view(vnode) {
        let {attrsInterface} = vnode.attrs;

        return m('nav.navbar.navbar-expand-lg.fixed-top.bg-light', mergeAttributes(
            {style: {'box-shadow': '0 0 4px #888'}}, attrsInterface), [
            m("a.navbar-brand",
                m("img[alt=TwoRavens][width=100][style=margin-left: 1em]", {
                    onmouseover: _ => this.about = true,
                    onmouseout: _ => this.about = false,
                    src: TRImage
                })),
            m(`#about.card[style=display: ${this.about ? 'block' : 'none'}; top: 10px; left: 140px; position: absolute; width: 500px; z-index: 50]`,
                m('.card-body', ABOUT)),
            m('div', {
                style: {
                    display: 'flex',
                    width: 'calc(100% - 158px)',
                    'justify-content': 'flex-end',
                    'align-items': 'center'
                }
            }, vnode.children)
        ]);
    }
}
