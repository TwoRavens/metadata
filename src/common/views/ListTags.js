import m from 'mithril';

import * as common from '../common';

export default class ListTags {
    view(vnode) {
        let {tags, ondelete, readonly} = vnode.attrs;

        return tags.map((tag) => m('div', {
                style: {
                    display: 'inline-block',
                    margin: '5px',
                    'border-radius': '5px',
                    padding: '4px 8px',
                    background: common.grayColor
                }
            }, [
                !readonly && m('div', {
                    onclick: () => ondelete(tag),
                    style: {
                        display: 'inline-block',
                        'margin-right': '0.5em',
                        transform: 'scale(1.3, 1.3)'
                    }
                }, '×'),
                m('div', {style: {display: 'inline-block'}}, tag)
            ])
        )
    }
}