import m from 'mithril';

import Table from '../common/views/Table';
import TextField from "../common/views/TextField";
import TextFieldSuggestion from "../common/views/TextFieldSuggestion";
import ListTags from "../common/views/ListTags";

import * as app from "../app";

let allFields = ['name', 'value', 'description', 'replication', 'variables', 'image'];

let customCellValue = (id, field, value) => {
    // not editable
    if (app.version) {
        if (field === 'variables') {
            return value && m(ListTags, {tags: value, readonly: true})
        }
        return value;
    }

    if (['name', 'value'].indexOf(field) !== -1) {
        return m(TextField, {
            class: !value && ['is-invalid'],
            id: 'textFieldCustom' + field + id,
            value: value,
            onblur: (value) => app.setFieldCustom(id, field, value),
            style: {margin: 0}
        })
    }

    if (['description', 'replication'].indexOf(field) !== -1) {
        return m(TextField, {
            id: 'textFieldCustom' + field + id,
            value: value,
            onblur: (value) => app.setFieldCustom(id, field, value),
            style: {
                width: '100%',
                'box-sizing': 'border-box',
                margin: 0
            }
        })
    }

    if (field === 'variables') {
        value = value || [];
        return [
            m(TextFieldSuggestion, {
                id: 'textFieldCustom' + field + id,
                enforce: true,
                limit: 5,
                value: app.queuedCustomVariable[id],
                suggestions: Object.keys(app.variables),
                oninput: (value) => app.queuedCustomVariable[id] = value,
                onblur: (value) => app.queuedCustomVariable[id] = value,
                attrsAll: {style: {display: 'inline', width: 'auto', margin: 0}}
            }),
            app.queuedCustomVariable[id] && m(`button#btnVarAdd${id}.btn.btn-outline-secondary`, {
                    disabled: !app.queuedCustomVariable[id],
                    title: 'record that variable is related to this statistic',
                    style: {display: 'inline-block', "margin-left": '2em'},
                    onclick: () => {
                        // ignore if already added (redundant)
                        if (value.indexOf(app.queuedCustomVariable[id]) !== -1) return;

                        // noinspection JSIgnoredPromiseFromCall
                        app.setFieldCustom(id, field,  [...value, app.queuedCustomVariable[id]]);
                        app.queuedCustomVariable[id] = '';
                    }
                },
                'Add'
            ),
            value && m('div', m(ListTags, {
                tags: value,
                ondelete: (variable) => {
                    let idx = app.custom_statistics[id]['variables'].indexOf(variable);
                    if (idx === -1) return;
                    let changedVariables = [...app.custom_statistics[id]['variables']];
                    changedVariables.splice(idx, 1);
                    app.setFieldCustom(id, 'variables', changedVariables);
                }
            }))
        ];
    }

    if (field === 'image') return [
        m('div.hide-mobile', {style: {display: 'inline-block'}}, [
            m('input', {type: 'file', onchange: (e) => app.setImageCustom(id, e)})
        ]),
        m('div', {style: {display: 'inline-block'}}, app.uploadStatus)]
};

export default class CustomStatistic {

    view(vnode) {
        let {id} = vnode.attrs;
        let statistic = app.custom_statistics[id] || {};

        let colgroupAttributes = () => m('colgroup',
            m('col', {width: '20%'}),
            m('col', {width: '80%'}));

        return [
            // m('h5#customFieldHeader' + id, {style: {'padding-top': '.5em'}}, name),
            m(Table, {
                id: 'customFieldTable' + id,
                headers: [statistic['name'] || 'New Statistic', ''],
                data: allFields.map(field => [field, customCellValue(id, field, statistic[field])]),
                tableTags: colgroupAttributes(),
                attrsCells: {style: {padding: '.3em'}},
                attrsAll: {
                    style: {
                        width: 'calc(100% - 2em)',
                        'margin-left': '1em',
                        'border-left': '1px solid #dee2e6',
                        'box-shadow': '0 3px 3px #777',
                        animation: 'slide-down .4s ease'
                    }
                }
            })
        ]
    }
}