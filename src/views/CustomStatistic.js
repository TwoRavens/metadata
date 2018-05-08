import m from 'mithril';

import Table from '../common/views/Table';
import TextField from "../common/views/TextField";
import TextFieldSuggestion from "../common/views/TextFieldSuggestion";
import ListTags from "../common/views/ListTags";

import * as app from "../app";

let allFields = ['name', 'value', 'variables', 'description', 'replication', 'image'];

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
            value: value || '',
            onblur: (value) => app.setFieldCustom(id, field, value),
            style: {margin: 0}
        })
    }

    if (field === 'variables') {
        value = value || [];
        return [
            m(TextFieldSuggestion, {
                id: 'textFieldCustom' + field + id,
                enforce: true,
                limit: 5,
                value: app.pendingCustomVariable[id],
                suggestions: Object.keys(app.variables),
                oninput: (value) => app.pendingCustomVariable[id] = value,
                onblur: (value) => app.pendingCustomVariable[id] = value,
                attrsAll: {
                    class: value.length === 0 && ['is-invalid'],
                    style: {display: 'inline', width: 'auto', margin: 0}
                }
            }),
            app.pendingCustomVariable[id] && m(`button#btnVarAdd${id}.btn.btn-outline-secondary`, {
                    disabled: !app.pendingCustomVariable[id],
                    title: 'record that variable is related to this statistic',
                    style: {display: 'inline-block', "margin-left": '2em'},
                    onclick: () => {
                        // ignore if already added (redundant)
                        if (value.indexOf(app.pendingCustomVariable[id]) !== -1) return;

                        // noinspection JSIgnoredPromiseFromCall
                        app.setFieldCustom(id, field, [...value, app.pendingCustomVariable[id]]);
                        app.pendingCustomVariable[id] = '';
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

    if (['description', 'replication'].indexOf(field) !== -1) {
        return m(TextField, {
            id: 'textFieldCustom' + field + id,
            disabled: id === 'ID_NEW',
            value: value || '',
            onblur: (value) => app.setFieldCustom(id, field, value),
            style: {
                width: '100%',
                'box-sizing': 'border-box',
                margin: 0
            }
        })
    }

    if (field === 'image') return [
        m('div.hide-mobile', {style: {display: 'inline-block'}}, [
            m('input', {
                disabled: id === 'ID_NEW',
                type: 'file',
                onchange: (e) => app.setImageCustom(id, e)})
        ]),
        m('div', {style: {display: 'inline-block'}}, app.uploadStatus)]
};

export default class CustomStatistic {

    view(vnode) {
        let {id} = vnode.attrs;
        let statistic = app.custom_statistics[id] || app.pendingCustomStatistic;

        let colgroupAttributes = () => m('colgroup',
            m('col', {width: '20%'}),
            m('col', {width: '80%'}));

        // Checkboxes for toggling all states
        let isUsedCheckbox = statistic['display'] && m(`input#isUsedCheck${id}[type=checkbox]`, {
            style: {float: 'right'},
            title: ((statistic['display'] || {})['viewable'] ? '' : 'not ') + 'used in report',
            onclick: m.withAttr("checked", (checked) => app.setUsedCustom(checked, id)),
            checked: (statistic['display'] || {})['viewable']
        });

        let deleteIcon = m('div', {
            onclick: () => app.deleteCustom(id),
            style: {
                display: 'inline-block',
                'margin-right': '0.5em',
                transform: 'scale(1.3, 1.3)'
            }
        }, '×');

        return [
            // m('h5#customFieldHeader' + id, {style: {'padding-top': '.5em'}}, name),
            m(Table, {
                id: 'customFieldTable' + id,
                headers: [
                    statistic['name'] ? [deleteIcon, statistic['name']] : 'New Statistic',
                    isUsedCheckbox
                ],
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