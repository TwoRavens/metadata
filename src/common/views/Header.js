import m from 'mithril'

import {aboutText, menuColor, borderColor, heightHeader, mergeAttributes} from '../common'
import TRImage from '../../images/TwoRavens-sm.png';

// ```
// m(Header, {
//     contents: m(...)
//     })
// ```

export default class Header {
    oninit() {
        this.about = false;
    }

    view(vnode) {
        let {contents, attrsInterface} = vnode.attrs;

        return m("nav#navbar.navbar.navbar-default.navbar-fixed-top[role=navigation]", mergeAttributes({
                style: {
                    background: menuColor,
                    height: heightHeader,
                    'border-bottom': borderColor
                }
            }, attrsInterface),
            [
                m("a.navbar-brand",
                    m("img[alt=TwoRavens][width=100][style=margin-left: 1em; margin-top: -0.5em]",
                        {
                            onmouseover: _ => this.about = true,
                            onmouseout: _ => this.about = false,
                            src: TRImage
                        })),
                m(`#about.panel.panel-default[style=display: ${this.about ? 'block' : 'none'}; left: 140px; position: absolute; width: 500px; z-index: 50]`,
                    m('.panel-body', aboutText)),
                m('div', {style: {'display': 'flex', 'justify-content': 'flex-end', 'align-items': 'center', 'height': '100%'}}, contents)            ]
        )
    }
}
