import m from 'mithril';

export default class ListTags {
    view(vnode) {
        let {tags} = vnode.attrs;

        return tags.map((tag) => m('div', [
                m('div.glyphicon.glyphicon-remove'),
                m('div', tag)
            ])
        )
    }
}